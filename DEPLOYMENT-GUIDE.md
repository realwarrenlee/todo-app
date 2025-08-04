# Todo App - Deployment Guide

This comprehensive guide walks you through deploying the Todo App to AWS using multiple deployment strategies.

## 📋 Prerequisites

### Required Tools
- **AWS CLI**: Version 2.0 or later
- **Docker**: Version 20.0 or later
- **Node.js**: Version 18 or later
- **Git**: For version control

### AWS Account Setup
1. **AWS Account**: Active AWS account with billing enabled
2. **IAM User**: User with programmatic access and required permissions
3. **AWS CLI Configuration**: Configured with access keys

### Required AWS Permissions
Your IAM user needs the following permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "ecr:*",
        "apprunner:*",
        "codepipeline:*",
        "codebuild:*",
        "dynamodb:*",
        "cloudwatch:*",
        "sns:*",
        "iam:*",
        "s3:*",
        "secretsmanager:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🚀 Deployment Options

### Option 1: Automated Deployment (Recommended)

This is the fastest way to get your application running on AWS.

#### Step 1: Configure Environment
```bash
# Clone the repository
git clone <your-repo-url>
cd todo-app

# Install dependencies
npm install
```

#### Step 2: Configure AWS CLI
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
# Enter output format (json)
```

#### Step 3: Update Deployment Configuration

**For Windows (PowerShell):**
Edit `scripts/deploy.ps1`:
```powershell
param(
    [string]$StackPrefix = "todo-app",
    [string]$AWSRegion = "us-east-1",
    [string]$GitHubOwner = "your-github-username",    # Update this
    [string]$GitHubRepo = "todo-app",                 # Update this
    [string]$NotificationEmail = "your-email@example.com"  # Update this
)
```

**For Linux/Mac:**
Edit `scripts/deploy.sh`:
```bash
STACK_PREFIX="todo-app"
AWS_REGION="us-east-1"
GITHUB_OWNER="your-github-username"     # Update this
GITHUB_REPO="todo-app"                  # Update this
NOTIFICATION_EMAIL="your-email@example.com"  # Update this
```

#### Step 4: Run Deployment Script

**Windows:**
```powershell
.\scripts\deploy.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

The script will:
1. Deploy ECR repository
2. Build and push Docker image
3. Set up DynamoDB tables
4. Deploy App Runner service
5. Set up CloudWatch monitoring
6. Optionally deploy CI/CD pipeline

#### Step 5: Access Your Application
After deployment completes, you'll see output like:
```
✅ Deployment completed successfully!

📋 Deployment Summary:
   🌐 Application URL: https://abc123.us-east-1.awsapprunner.com
   📊 CloudWatch Dashboard: https://console.aws.amazon.com/cloudwatch/...
   📦 ECR Repository: 123456789012.dkr.ecr.us-east-1.amazonaws.com/todo-app
```

### Option 2: Manual Step-by-Step Deployment

For more control over the deployment process.

#### Step 1: Create ECR Repository
```bash
aws cloudformation deploy \
  --template-file infrastructure/ecr-repository.yaml \
  --stack-name todo-app-ecr \
  --region us-east-1
```

#### Step 2: Get ECR Repository URI
```bash
ECR_URI=$(aws cloudformation describe-stacks \
  --stack-name todo-app-ecr \
  --query 'Stacks[0].Outputs[?OutputKey==`ECRRepositoryURI`].OutputValue' \
  --output text \
  --region us-east-1)

echo "ECR URI: $ECR_URI"
```

#### Step 3: Build and Push Docker Image
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_URI

# Build image
docker build -t todo-app .

# Tag image
docker tag todo-app:latest $ECR_URI:latest

# Push image
docker push $ECR_URI:latest
```

#### Step 4: Set Up DynamoDB Tables
```bash
node scripts/setup-dynamodb.js
```

#### Step 5: Deploy App Runner Service
```bash
aws cloudformation deploy \
  --template-file infrastructure/apprunner.yaml \
  --stack-name todo-app-apprunner \
  --parameter-overrides \
    ECRRepositoryURI=$ECR_URI \
    ImageTag=latest \
    AWSRegion=us-east-1 \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

#### Step 6: Deploy Monitoring
```bash
# Get App Runner Service ARN
APP_RUNNER_ARN=$(aws cloudformation describe-stacks \
  --stack-name todo-app-apprunner \
  --query 'Stacks[0].Outputs[?OutputKey==`AppRunnerServiceArn`].OutputValue' \
  --output text \
  --region us-east-1)

# Deploy monitoring
aws cloudformation deploy \
  --template-file infrastructure/monitoring.yaml \
  --stack-name todo-app-monitoring \
  --parameter-overrides \
    AppRunnerServiceArn=$APP_RUNNER_ARN \
    NotificationEmail=your-email@example.com \
  --region us-east-1
```

### Option 3: CI/CD Pipeline Deployment

Set up automated deployments from your GitHub repository.

#### Step 1: Create GitHub Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` and `admin:repo_hook` permissions
3. Copy the token

#### Step 2: Store Token in AWS Secrets Manager
```bash
aws secretsmanager create-secret \
  --name github-token \
  --secret-string '{"token":"your-github-personal-access-token"}' \
  --region us-east-1
```

#### Step 3: Deploy CI/CD Pipeline
```bash
aws cloudformation deploy \
  --template-file infrastructure/codepipeline.yaml \
  --stack-name todo-app-pipeline \
  --parameter-overrides \
    GitHubOwner=your-github-username \
    GitHubRepo=todo-app \
    GitHubBranch=main \
    ECRRepositoryName=todo-app \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

#### Step 4: Trigger Pipeline
Push changes to your GitHub repository to trigger the pipeline:
```bash
git add .
git commit -m "Deploy to AWS"
git push origin main
```

## 🔧 Configuration

### Environment Variables

The application uses the following environment variables:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Application Configuration
DEFAULT_USER_ID=default-user
NODE_ENV=production

# Optional: Custom DynamoDB table names
TODOS_TABLE_NAME=todos
CATEGORIES_TABLE_NAME=categories
```

### App Runner Configuration

The `apprunner.yaml` file configures the App Runner service:

```yaml
version: 1.0
runtime: docker
build:
  commands:
    build:
      - echo "Build phase completed"
run:
  runtime-version: latest
  command: node server.js
  network:
    port: 3000
    env: PORT
  env:
    - name: NODE_ENV
      value: production
    - name: AWS_REGION
      value: us-east-1
```

### Docker Configuration

The `Dockerfile` uses multi-stage builds for optimization:

```dockerfile
# Dependencies stage
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner stage
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

## 🔍 Verification

### Health Checks

After deployment, verify your application is working:

1. **Application Health**
   ```bash
   curl -I https://your-app-url.awsapprunner.com
   # Should return HTTP 200
   ```

2. **API Endpoints**
   ```bash
   # Test todos endpoint
   curl https://your-app-url.awsapprunner.com/api/todos
   
   # Test categories endpoint
   curl https://your-app-url.awsapprunner.com/api/categories
   ```

3. **Database Connectivity**
   ```bash
   # Check DynamoDB tables
   aws dynamodb list-tables --region us-east-1
   ```

### Monitoring Verification

1. **CloudWatch Dashboard**
   - Navigate to CloudWatch in AWS Console
   - Find "TodoApp-Dashboard"
   - Verify metrics are being collected

2. **CloudWatch Alarms**
   ```bash
   aws cloudwatch describe-alarms \
     --alarm-names TodoApp-HighErrorRate TodoApp-HighResponseTime TodoApp-HighCPU \
     --region us-east-1
   ```

3. **SNS Topic**
   ```bash
   aws sns list-topics --region us-east-1 | grep todo-app-alerts
   ```

## 🚨 Troubleshooting

### Common Issues

#### 1. ECR Authentication Issues
```bash
# Error: "no basic auth credentials"
# Solution: Re-authenticate with ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

#### 2. App Runner Service Failed to Start
```bash
# Check App Runner logs
aws apprunner describe-service \
  --service-arn <service-arn> \
  --region us-east-1

# Common causes:
# - Incorrect environment variables
# - Docker image issues
# - Port configuration problems
```

#### 3. DynamoDB Access Issues
```bash
# Verify tables exist
aws dynamodb list-tables --region us-east-1

# Check IAM permissions
aws iam get-role-policy \
  --role-name <app-runner-instance-role> \
  --policy-name DynamoDBPolicy
```

#### 4. CloudFormation Stack Failures
```bash
# Check stack events
aws cloudformation describe-stack-events \
  --stack-name <stack-name> \
  --region us-east-1

# Common solutions:
# - Check IAM permissions
# - Verify parameter values
# - Review resource limits
```

### Debugging Commands

```bash
# Check App Runner service status
aws apprunner list-services --region us-east-1

# View CloudFormation stacks
aws cloudformation list-stacks --region us-east-1

# Check ECR repositories
aws ecr describe-repositories --region us-east-1

# View DynamoDB tables
aws dynamodb list-tables --region us-east-1

# Check CodePipeline status
aws codepipeline list-pipelines --region us-east-1
```

## 🔄 Updates and Maintenance

### Application Updates

#### Manual Updates
```bash
# Build new image
docker build -t todo-app .
docker tag todo-app:latest $ECR_URI:$(date +%s)
docker push $ECR_URI:$(date +%s)

# Update App Runner service
aws apprunner start-deployment \
  --service-arn <service-arn> \
  --region us-east-1
```

#### Automated Updates (with CI/CD)
```bash
# Simply push to your repository
git add .
git commit -m "Update application"
git push origin main
```

### Infrastructure Updates

```bash
# Update CloudFormation stacks
aws cloudformation deploy \
  --template-file infrastructure/apprunner.yaml \
  --stack-name todo-app-apprunner \
  --parameter-overrides <new-parameters> \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

## 🧹 Cleanup

To remove all AWS resources:

```bash
# Delete CloudFormation stacks (in order)
aws cloudformation delete-stack --stack-name todo-app-pipeline --region us-east-1
aws cloudformation delete-stack --stack-name todo-app-monitoring --region us-east-1
aws cloudformation delete-stack --stack-name todo-app-apprunner --region us-east-1

# Wait for stacks to delete, then delete ECR (after removing images)
aws ecr delete-repository --repository-name todo-app --force --region us-east-1
aws cloudformation delete-stack --stack-name todo-app-ecr --region us-east-1

# Delete DynamoDB tables
aws dynamodb delete-table --table-name todos --region us-east-1
aws dynamodb delete-table --table-name categories --region us-east-1

# Delete GitHub token from Secrets Manager
aws secretsmanager delete-secret --secret-id github-token --region us-east-1
```

## 💰 Cost Optimization

### Estimated Monthly Costs (us-east-1)

- **App Runner**: ~$25-50/month (1 vCPU, 2GB RAM)
- **DynamoDB**: ~$1-5/month (on-demand pricing)
- **ECR**: ~$1/month (storage)
- **CloudWatch**: ~$5-10/month (logs and metrics)
- **CodePipeline**: ~$1/month (1 pipeline)
- **Total**: ~$33-67/month

### Cost Optimization Tips

1. **Use App Runner's auto-scaling** to minimize idle costs
2. **Enable DynamoDB on-demand billing** for variable workloads
3. **Set up CloudWatch log retention** to control storage costs
4. **Use ECR lifecycle policies** to clean up old images
5. **Monitor costs** with AWS Cost Explorer

## 📞 Support

For deployment issues:

1. **Check AWS Service Health**: https://status.aws.amazon.com/
2. **Review AWS Documentation**: https://docs.aws.amazon.com/
3. **AWS Support**: Consider AWS Support plan for production workloads
4. **Community Forums**: AWS re:Post, Stack Overflow

---

This deployment guide provides multiple paths to get your Todo App running on AWS. Choose the approach that best fits your needs and experience level.