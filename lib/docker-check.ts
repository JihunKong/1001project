import fs from 'fs';
import path from 'path';

interface DockerCheckResult {
  isDockerEnvironment: boolean;
  shouldEnforce: boolean;
  reason: string;
  exemptionReason?: string;
}

export function checkDockerEnvironment(): DockerCheckResult {
  // Check for CI/CD environment exemptions first
  const exemptions = checkExemptions();
  if (exemptions.isExempt) {
    return {
      isDockerEnvironment: false,
      shouldEnforce: false,
      reason: 'Docker environment not detected',
      exemptionReason: exemptions.reason
    };
  }

  // Check if Docker environment is required
  const dockerRequired = process.env.DOCKER_REQUIRED === 'true';
  
  // Multiple methods to detect Docker environment
  const dockerChecks = [
    checkDockerEnvFile(),
    checkCgroupFile(),
    checkContainerEnv(),
    checkDockerSocket()
  ];

  const isInDocker = dockerChecks.some(check => check.detected);
  const detectionMethods = dockerChecks.filter(check => check.detected).map(check => check.method);

  if (isInDocker) {
    return {
      isDockerEnvironment: true,
      shouldEnforce: false,  // Don't enforce when already in Docker
      reason: `Docker environment detected via: ${detectionMethods.join(', ')}`
    };
  }

  // If not in Docker but Docker is required
  if (dockerRequired) {
    return {
      isDockerEnvironment: false,
      shouldEnforce: true,  // Only enforce when Docker required but not in Docker
      reason: 'DOCKER_REQUIRED=true but Docker environment not detected'
    };
  }

  // Default case - not in Docker and not required
  return {
    isDockerEnvironment: false,
    shouldEnforce: false,
    reason: 'Docker environment not detected and not required'
  };
}

function checkExemptions(): { isExempt: boolean; reason?: string } {
  // CI/CD environments
  if (process.env.CI === 'true') {
    return { isExempt: true, reason: 'CI environment detected' };
  }

  // Test environments
  if (process.env.NODE_ENV === 'test') {
    return { isExempt: true, reason: 'Test environment detected' };
  }

  // Vercel deployment
  if (process.env.VERCEL === '1') {
    return { isExempt: true, reason: 'Vercel deployment detected' };
  }

  // Netlify deployment
  if (process.env.NETLIFY === 'true') {
    return { isExempt: true, reason: 'Netlify deployment detected' };
  }

  // Development override (for emergency situations)
  if (process.env.DOCKER_OVERRIDE === 'true') {
    return { isExempt: true, reason: 'Docker override enabled' };
  }

  // Build-time exemption (when building inside Docker containers)
  if (process.env.npm_lifecycle_event === 'build' && process.env.DOCKER_REQUIRED === 'true') {
    return { isExempt: true, reason: 'Docker build process detected' };
  }

  return { isExempt: false };
}

function checkDockerEnvFile(): { detected: boolean; method: string } {
  try {
    fs.accessSync('/.dockerenv');
    return { detected: true, method: '.dockerenv file' };
  } catch {
    return { detected: false, method: '.dockerenv file' };
  }
}

function checkCgroupFile(): { detected: boolean; method: string } {
  try {
    const cgroupPath = '/proc/1/cgroup';
    if (fs.existsSync(cgroupPath)) {
      const cgroup = fs.readFileSync(cgroupPath, 'utf8');
      if (cgroup.includes('docker') || cgroup.includes('container')) {
        return { detected: true, method: 'cgroup analysis' };
      }
    }
    return { detected: false, method: 'cgroup analysis' };
  } catch {
    return { detected: false, method: 'cgroup analysis' };
  }
}

function checkContainerEnv(): { detected: boolean; method: string } {
  // Check for common container environment variables
  const containerEnvVars = [
    'DOCKER_CONTAINER',
    'CONTAINER',
    'KUBERNETES_SERVICE_HOST',
    'HOSTNAME' // Docker containers often have generated hostnames
  ];

  for (const envVar of containerEnvVars) {
    if (process.env[envVar]) {
      // Additional check for HOSTNAME - should look like a container ID
      if (envVar === 'HOSTNAME') {
        const hostname = process.env.HOSTNAME;
        if (hostname && hostname.length === 12 && /^[a-f0-9]+$/.test(hostname)) {
          return { detected: true, method: 'container hostname pattern' };
        }
      } else {
        return { detected: true, method: `${envVar} environment variable` };
      }
    }
  }

  return { detected: false, method: 'container environment variables' };
}

function checkDockerSocket(): { detected: boolean; method: string } {
  try {
    // NOTE: Docker socket exists on host when Docker Desktop is running
    // This is NOT a reliable indicator of being inside a container
    // Removing this check to prevent false positives
    return { detected: false, method: 'Docker socket (disabled - not reliable)' };
  } catch {
    return { detected: false, method: 'Docker socket' };
  }
}

export function enforceDockerEnvironment(): void {
  const result = checkDockerEnvironment();

  if (!result.shouldEnforce) {
    if (result.exemptionReason) {
      console.log(`🔧 Docker enforcement skipped: ${result.exemptionReason}`);
    }
    return;
  }

  if (!result.isDockerEnvironment) {
    console.error('\n❌ DOCKER ENFORCEMENT ERROR');
    console.error('═══════════════════════════════════════════════');
    console.error('🚫 This application MUST run in Docker environment!');
    console.error('');
    console.error('📋 PRD Requirement: Docker 전용 실행 (절대적 제약조건)');
    console.error('');
    console.error('🔍 Detection Result:');
    console.error(`   ${result.reason}`);
    console.error('');
    console.error('💡 To fix this issue:');
    console.error('');
    console.error('   1. Install Docker Desktop:');
    console.error('      macOS: https://docs.docker.com/desktop/mac/install/');
    console.error('      Windows: https://docs.docker.com/desktop/windows/install/');
    console.error('      Linux: https://docs.docker.com/engine/install/');
    console.error('');
    console.error('   2. Start the application with Docker:');
    console.error('      $ docker-compose up -d');
    console.error('');
    console.error('   3. For development:');
    console.error('      $ docker-compose -f docker-compose.dev.yml up -d');
    console.error('');
    console.error('   4. View logs:');
    console.error('      $ docker-compose logs -f app');
    console.error('');
    console.error('🆘 Emergency override (development only):');
    console.error('      $ DOCKER_OVERRIDE=true npm run dev');
    console.error('');
    console.error('📚 For more information, see:');
    console.error('      - README.md');
    console.error('      - DEPLOYMENT_NOTES.md');
    console.error('═══════════════════════════════════════════════');
    console.error('');

    // Terminate the process
    process.exit(1);
  } else {
    console.log(`✅ Docker environment confirmed: ${result.reason}`);
  }
}

export function getDockerStatus(): {
  inDocker: boolean;
  method?: string;
  shouldEnforce: boolean;
  exemption?: string;
} {
  const result = checkDockerEnvironment();
  return {
    inDocker: result.isDockerEnvironment,
    method: result.reason,
    shouldEnforce: result.shouldEnforce,
    exemption: result.exemptionReason
  };
}