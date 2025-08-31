import { SSMClient, GetParametersByPathCommand } from '@aws-sdk/client-ssm';

// Cache for SSM parameters
let ssmCache: Record<string, string> = {};
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// SSM configuration
const SSM_PREFIX = '/1001stories/production';
const AWS_REGION = process.env.AWS_REGION || 'us-east-2';

// Initialize SSM client
const ssmClient = new SSMClient({ 
  region: AWS_REGION,
  // Use IAM role attached to EC2 instance
  // No explicit credentials needed when running on EC2
});

/**
 * Load environment variables from AWS Systems Manager Parameter Store
 * Falls back to process.env if SSM is not available
 */
export async function loadEnvironmentFromSSM(): Promise<void> {
  // Skip if not in production or if explicitly disabled
  if (process.env.NODE_ENV !== 'production' || process.env.USE_SSM === 'false') {
    console.log('[SSM] Skipping SSM parameter loading (not in production or disabled)');
    return;
  }

  // Check if cache is still valid
  if (Date.now() - cacheTimestamp < CACHE_TTL && Object.keys(ssmCache).length > 0) {
    console.log('[SSM] Using cached parameters');
    applyParametersToEnv(ssmCache);
    return;
  }

  try {
    console.log('[SSM] Loading parameters from AWS Systems Manager...');
    
    const parameters: Record<string, string> = {};
    let nextToken: string | undefined;
    
    // Paginate through all parameters
    do {
      const command = new GetParametersByPathCommand({
        Path: SSM_PREFIX,
        Recursive: true,
        WithDecryption: true,
        NextToken: nextToken,
      });
      
      const response = await ssmClient.send(command);
      
      // Process parameters
      if (response.Parameters) {
        for (const param of response.Parameters) {
          if (param.Name && param.Value) {
            // Extract the key name (remove prefix)
            const key = param.Name.replace(`${SSM_PREFIX}/`, '');
            parameters[key] = param.Value;
          }
        }
      }
      
      nextToken = response.NextToken;
    } while (nextToken);
    
    // Update cache
    ssmCache = parameters;
    cacheTimestamp = Date.now();
    
    // Apply parameters to process.env
    applyParametersToEnv(parameters);
    
    console.log(`[SSM] Successfully loaded ${Object.keys(parameters).length} parameters`);
    
  } catch (error) {
    // Log error but don't crash - fall back to existing env vars
    console.error('[SSM] Failed to load parameters from SSM:', error);
    console.log('[SSM] Falling back to environment variables from .env file');
    
    // If running on EC2, this might indicate missing IAM permissions
    if (isRunningOnEC2()) {
      console.error('[SSM] Make sure the EC2 instance has the correct IAM role attached');
    }
  }
}

/**
 * Apply SSM parameters to process.env
 * Only overwrites if the SSM value exists
 */
function applyParametersToEnv(parameters: Record<string, string>): void {
  for (const [key, value] of Object.entries(parameters)) {
    // Only overwrite if value is not empty
    if (value && value.trim() !== '') {
      process.env[key] = value;
    }
  }
}

/**
 * Check if running on EC2 instance
 */
function isRunningOnEC2(): boolean {
  // Check for EC2 metadata service
  // This is a simple heuristic - could be improved
  return process.env.AWS_EXECUTION_ENV === 'AWS_ECS_EC2' ||
         process.env.AWS_EXECUTION_ENV === 'AWS_ECS_FARGATE' ||
         !!process.env.ECS_CONTAINER_METADATA_URI ||
         !!process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI;
}

/**
 * Get a specific parameter from SSM (with caching)
 */
export async function getSSMParameter(key: string): Promise<string | undefined> {
  // First check process.env
  if (process.env[key]) {
    return process.env[key];
  }
  
  // Then check cache
  if (ssmCache[key]) {
    return ssmCache[key];
  }
  
  // If not in cache, try to reload from SSM
  await loadEnvironmentFromSSM();
  
  return ssmCache[key] || process.env[key];
}

/**
 * Initialize SSM parameter loading on application startup
 * This should be called early in the application lifecycle
 */
export async function initializeSSM(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    try {
      await loadEnvironmentFromSSM();
      
      // Refresh cache periodically
      setInterval(async () => {
        try {
          await loadEnvironmentFromSSM();
        } catch (error) {
          console.error('[SSM] Failed to refresh parameters:', error);
        }
      }, CACHE_TTL);
      
    } catch (error) {
      console.error('[SSM] Failed to initialize SSM:', error);
    }
  }
}