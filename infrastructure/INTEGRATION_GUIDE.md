# Next.js Application Integration Guide

This guide explains how to integrate your Next.js application with the deployed S3 publishing infrastructure.

## 🔌 Environment Variables

After deploying the infrastructure, add these environment variables to your Next.js application:

### Required Environment Variables

```bash
# S3 Configuration
AWS_S3_BUCKET_NAME=1001-stories-content-12345678
AWS_S3_REGION=us-east-1
AWS_S3_BACKUP_BUCKET=1001-stories-backup-12345678
AWS_S3_TEMP_BUCKET=1001-stories-temp-12345678

# KMS Encryption
AWS_KMS_KEY_ID=alias/1001-stories-content-encryption

# CloudFront CDN
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
CLOUDFRONT_DOMAIN_NAME=d1234567890abc.cloudfront.net
CLOUDFRONT_URL=https://d1234567890abc.cloudfront.net

# IAM Roles for Role-Based Access
AWS_APP_EXECUTION_ROLE_ARN=arn:aws:iam::123456789012:role/1001-stories-app-execution-role
AWS_APP_TASK_ROLE_ARN=arn:aws:iam::123456789012:role/1001-stories-app-task-role

# User Role ARNs
AWS_LEARNER_ROLE_ARN=arn:aws:iam::123456789012:role/1001-stories-learner-role
AWS_TEACHER_ROLE_ARN=arn:aws:iam::123456789012:role/1001-stories-teacher-role
AWS_VOLUNTEER_ROLE_ARN=arn:aws:iam::123456789012:role/1001-stories-volunteer-role
AWS_STORY_MANAGER_ROLE_ARN=arn:aws:iam::123456789012:role/1001-stories-story-manager-role
AWS_BOOK_MANAGER_ROLE_ARN=arn:aws:iam::123456789012:role/1001-stories-book-manager-role
AWS_CONTENT_ADMIN_ROLE_ARN=arn:aws:iam::123456789012:role/1001-stories-content-admin-role
AWS_ADMIN_ROLE_ARN=arn:aws:iam::123456789012:role/1001-stories-admin-role

# Processing Role
AWS_LAMBDA_PROCESSING_ROLE_ARN=arn:aws:iam::123456789012:role/1001-stories-lambda-processing-role
```

## 📦 Required Dependencies

Install the AWS SDK and related packages:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/client-sts @aws-sdk/s3-request-presigner @aws-sdk/client-cloudwatch
```

## 🔐 Role-Based S3 Service

Create a service for role-based S3 operations:

```typescript
// lib/s3-service.ts
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface UserRole {
  role: 'LEARNER' | 'TEACHER' | 'VOLUNTEER' | 'STORY_MANAGER' | 'BOOK_MANAGER' | 'CONTENT_ADMIN' | 'ADMIN';
  userId: string;
}

class S3PublishingService {
  private stsClient: STSClient;
  private roleArnMap: Record<string, string>;

  constructor() {
    this.stsClient = new STSClient({ region: process.env.AWS_S3_REGION });
    this.roleArnMap = {
      LEARNER: process.env.AWS_LEARNER_ROLE_ARN!,
      TEACHER: process.env.AWS_TEACHER_ROLE_ARN!,
      VOLUNTEER: process.env.AWS_VOLUNTEER_ROLE_ARN!,
      STORY_MANAGER: process.env.AWS_STORY_MANAGER_ROLE_ARN!,
      BOOK_MANAGER: process.env.AWS_BOOK_MANAGER_ROLE_ARN!,
      CONTENT_ADMIN: process.env.AWS_CONTENT_ADMIN_ROLE_ARN!,
      ADMIN: process.env.AWS_ADMIN_ROLE_ARN!,
    };
  }

  // Assume role for user-specific operations
  private async assumeUserRole(userRole: UserRole) {
    const roleArn = this.roleArnMap[userRole.role];
    if (!roleArn) {
      throw new Error(`Role ARN not found for role: ${userRole.role}`);
    }

    const { Credentials } = await this.stsClient.send(new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: `${userRole.role.toLowerCase()}-${userRole.userId}`,
      ExternalId: `1001-stories-${userRole.role.toLowerCase()}-external-id`,
      DurationSeconds: 3600, // 1 hour
    }));

    if (!Credentials) {
      throw new Error('Failed to assume role');
    }

    return new S3Client({
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: Credentials.AccessKeyId!,
        secretAccessKey: Credentials.SecretAccessKey!,
        sessionToken: Credentials.SessionToken!,
      },
    });
  }

  // Generate signed URL for content access
  async generateSignedUrl(
    key: string,
    userRole: UserRole,
    operation: 'GET' | 'PUT' = 'GET',
    expiresIn: number = 3600
  ): Promise<string> {
    const s3Client = await this.assumeUserRole(userRole);

    const command = operation === 'GET'
      ? new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: key,
          ResponseContentDisposition: `inline; filename="${key.split('/').pop()}"`,
        })
      : new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: key,
        });

    return getSignedUrl(s3Client, command, {
      expiresIn,
      signableHeaders: new Set(['x-user-role', 'x-user-id'])
    });
  }

  // Get book URL for learner (with assignment check)
  async getBookUrl(bookId: string, userRole: UserRole, isAssigned: boolean = false): Promise<string> {
    // Validate learner access
    if (userRole.role === 'LEARNER' && !isAssigned) {
      throw new Error('Book not assigned to learner');
    }

    const key = `books/published/${bookId}.pdf`;
    return this.generateSignedUrl(key, userRole, 'GET');
  }

  // Submit content (volunteer/teacher)
  async submitContent(content: Buffer, contentType: string, userRole: UserRole): Promise<string> {
    if (!['VOLUNTEER', 'TEACHER'].includes(userRole.role)) {
      throw new Error('Insufficient permissions for content submission');
    }

    const timestamp = new Date().toISOString();
    const key = `submissions/pending/${userRole.userId}/${timestamp}-${Date.now()}.${contentType}`;

    return this.generateSignedUrl(key, userRole, 'PUT');
  }

  // Move content through workflow (story manager)
  async moveContentWorkflow(
    submissionId: string,
    fromStage: string,
    toStage: string,
    userRole: UserRole
  ): Promise<void> {
    if (!['STORY_MANAGER', 'BOOK_MANAGER', 'CONTENT_ADMIN', 'ADMIN'].includes(userRole.role)) {
      throw new Error('Insufficient permissions for workflow management');
    }

    // Implementation would handle moving files between workflow stages
    // This is a simplified example
    console.log(`Moving ${submissionId} from ${fromStage} to ${toStage} by ${userRole.role}`);
  }
}

export const s3PublishingService = new S3PublishingService();
```

## 🌐 CloudFront Integration

Create a service for CloudFront operations:

```typescript
// lib/cloudfront-service.ts
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

class CloudFrontService {
  private cloudFrontClient: CloudFrontClient;

  constructor() {
    this.cloudFrontClient = new CloudFrontClient({ region: 'us-east-1' }); // CloudFront is always us-east-1
  }

  // Invalidate cache for updated content
  async invalidateContent(paths: string[]): Promise<string> {
    const { Invalidation } = await this.cloudFrontClient.send(new CreateInvalidationCommand({
      DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: paths.length,
          Items: paths,
        },
      },
    }));

    return Invalidation?.Id || '';
  }

  // Get CloudFront URL for content
  getCdnUrl(key: string): string {
    return `${process.env.CLOUDFRONT_URL}/${key}`;
  }
}

export const cloudFrontService = new CloudFrontService();
```

## 📊 Monitoring Integration

Add custom metrics to track educational platform usage:

```typescript
// lib/monitoring-service.ts
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

class MonitoringService {
  private cloudWatchClient: CloudWatchClient;

  constructor() {
    this.cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_S3_REGION });
  }

  // Track user activity
  async trackUserActivity(role: string, action: string, userId: string): Promise<void> {
    await this.cloudWatchClient.send(new PutMetricDataCommand({
      Namespace: '1001-stories',
      MetricData: [{
        MetricName: 'UserActivity',
        Dimensions: [
          { Name: 'Role', Value: role },
          { Name: 'Action', Value: action }
        ],
        Value: 1,
        Unit: 'Count',
        Timestamp: new Date(),
      }]
    }));
  }

  // Track content access
  async trackContentAccess(contentType: string, userRole: string): Promise<void> {
    await this.cloudWatchClient.send(new PutMetricDataCommand({
      Namespace: '1001-stories',
      MetricData: [{
        MetricName: 'ContentAccess',
        Dimensions: [
          { Name: 'ContentType', Value: contentType },
          { Name: 'Role', Value: userRole }
        ],
        Value: 1,
        Unit: 'Count',
        Timestamp: new Date(),
      }]
    }));
  }

  // Track workflow transitions
  async trackWorkflowTransition(fromStage: string, toStage: string): Promise<void> {
    await this.cloudWatchClient.send(new PutMetricDataCommand({
      Namespace: '1001-stories',
      MetricData: [{
        MetricName: 'SubmissionWorkflow',
        Dimensions: [
          { Name: 'FromStage', Value: fromStage },
          { Name: 'ToStage', Value: toStage }
        ],
        Value: 1,
        Unit: 'Count',
        Timestamp: new Date(),
      }]
    }));
  }
}

export const monitoringService = new MonitoringService();
```

## 🔌 API Routes Integration

Create API routes that utilize the S3 publishing infrastructure:

```typescript
// pages/api/books/[bookId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { s3PublishingService } from '../../../lib/s3-service';
import { monitoringService } from '../../../lib/monitoring-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { bookId } = req.query;
    const userRole = session.user.role;
    const userId = session.user.id;

    // Check if book is assigned to learner (you'd implement this logic)
    const isAssigned = userRole !== 'LEARNER' || await checkBookAssignment(userId, bookId as string);

    // Generate signed URL
    const signedUrl = await s3PublishingService.getBookUrl(
      bookId as string,
      { role: userRole, userId },
      isAssigned
    );

    // Track access
    await monitoringService.trackContentAccess('PDF', userRole);

    res.status(200).json({ signedUrl });
  } catch (error) {
    console.error('Book access error:', error);
    res.status(500).json({ error: 'Failed to access book' });
  }
}
```

```typescript
// pages/api/submissions/upload.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { s3PublishingService } from '../../../lib/s3-service';
import formidable from 'formidable';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = session.user.role;
    if (!['VOLUNTEER', 'TEACHER'].includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Get upload URL for direct S3 upload
    const uploadUrl = await s3PublishingService.submitContent(
      Buffer.from(''), // Not used for signed URL generation
      'pdf',
      { role: userRole, userId: session.user.id }
    );

    res.status(200).json({ uploadUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to get upload URL' });
  }
}
```

## 🎨 Frontend Integration

Use the infrastructure in your React components:

```typescript
// components/BookViewer.tsx
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface BookViewerProps {
  bookId: string;
}

export default function BookViewer({ bookId }: BookViewerProps) {
  const { data: session } = useSession();
  const [bookUrl, setBookUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function fetchBookUrl() {
      try {
        const response = await fetch(`/api/books/${bookId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch book');
        }

        const { signedUrl } = await response.json();
        setBookUrl(signedUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load book');
      } finally {
        setLoading(false);
      }
    }

    if (session && bookId) {
      fetchBookUrl();
    }
  }, [session, bookId]);

  if (loading) return <div>Loading book...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="book-viewer">
      <iframe
        src={bookUrl}
        width="100%"
        height="600px"
        title={`Book ${bookId}`}
        className="border rounded-lg"
      />
    </div>
  );
}
```

## 🔄 Deployment Integration

Update your deployment scripts to work with the new infrastructure:

```bash
# scripts/deploy-with-s3.sh
#!/bin/bash

set -e

echo "Deploying 1001 Stories with S3 Infrastructure..."

# Build Next.js application
npm run build

# Deploy to your hosting platform (Lightsail, ECS, etc.)
# The application will automatically use the S3 infrastructure via environment variables

# Invalidate CloudFront cache for updated assets
aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/static/*" "/_next/*"

echo "Deployment complete!"
```

## 🚀 Getting Started

1. **Deploy Infrastructure**:
   ```bash
   cd infrastructure
   ./scripts/deploy-s3-infrastructure.sh apply -e production
   ```

2. **Get Environment Variables**:
   ```bash
   cd infrastructure/terraform
   terraform output -json > ../outputs/production.json
   ```

3. **Update Your .env.local**:
   ```bash
   # Copy values from terraform outputs to your .env.local
   ```

4. **Test Integration**:
   ```bash
   npm run dev
   # Test book access, content upload, and role-based features
   ```

## 📞 Support

For integration support:
- Check CloudWatch logs for AWS service errors
- Monitor S3 access logs for permission issues
- Use CloudWatch metrics to track usage patterns
- Review IAM policies for access problems

The infrastructure is designed to be secure by default and scalable for your educational platform needs.