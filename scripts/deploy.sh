#!/bin/bash

# Todo App Deployment Script
set -e

# Configuration
STACK_PREFIX="todo-app"
AWS_REGION="us-east-1"
GITHUB_OWNER="your-github-username"
GITHUB_REPO="todo-app"
NOTIFICATION_EMAIL="admin@example.com"

echo "🚀 Starting Todo App deployment..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 AWS Account ID: $AWS_ACCOUNT_ID"

# Deploy ECR Repository
echo "📦 Deploying ECR Repository..."
aws cloudformation deploy \
    --template-file infrastructure/ecr-repository.yaml \
    --stack-name "${STACK_PREFIX}-ecr" \
    --parameter-overrides \
        RepositoryName=todo-app \
    --region $AWS_REGION

# Get ECR Repository URI
ECR_REPO_URI=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_PREFIX}-ecr" \
    --query 'Stacks[0].Outputs[?OutputKey==`ECRRepositoryURI`].OutputValue' \
    --output text \
    --region $AWS_REGION)

echo "📦 ECR Repository URI: $ECR_REPO_URI"

# Build and push initial Docker image
echo "🐳 Building and pushing Docker image..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO_URI

docker build -t todo-app .
docker tag todo-app:latest $ECR_REPO_URI:latest
docker push $ECR_REPO_URI:latest

# Setup DynamoDB tables
echo "🗄️  Setting up DynamoDB tables..."
node scripts/setup-dynamodb.js

# Deploy App Runner Service
echo "🏃 Deploying App Runner Service..."
aws cloudformation deploy \
    --template-file infrastructure/apprunner.yaml \
    --stack-name "${STACK_PREFIX}-apprunner" \
    --parameter-overrides \
        ServiceName=todo-app-service \
        ECRRepositoryURI=$ECR_REPO_URI \
        ImageTag=latest \
        AWSRegion=$AWS_REGION \
    --capabilities CAPABILITY_IAM \
    --region $AWS_REGION

# Get App Runner Service ARN
APP_RUNNER_ARN=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_PREFIX}-apprunner" \
    --query 'Stacks[0].Outputs[?OutputKey==`AppRunnerServiceArn`].OutputValue' \
    --output text \
    --region $AWS_REGION)

# Deploy Monitoring
echo "📊 Deploying CloudWatch monitoring..."
aws cloudformation deploy \
    --template-file infrastructure/monitoring.yaml \
    --stack-name "${STACK_PREFIX}-monitoring" \
    --parameter-overrides \
        AppRunnerServiceArn=$APP_RUNNER_ARN \
        NotificationEmail=$NOTIFICATION_EMAIL \
    --region $AWS_REGION

# Deploy CI/CD Pipeline (optional - requires GitHub token in Secrets Manager)
echo "🔄 Deploying CI/CD Pipeline..."
echo "⚠️  Note: Make sure to store your GitHub token in AWS Secrets Manager with name 'github-token'"
read -p "Do you want to deploy the CI/CD pipeline? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    aws cloudformation deploy \
        --template-file infrastructure/codepipeline.yaml \
        --stack-name "${STACK_PREFIX}-pipeline" \
        --parameter-overrides \
            GitHubOwner=$GITHUB_OWNER \
            GitHubRepo=$GITHUB_REPO \
            GitHubBranch=main \
            ECRRepositoryName=todo-app \
            AppRunnerServiceName=todo-app-service \
        --capabilities CAPABILITY_IAM \
        --region $AWS_REGION
fi

# Get App Runner Service URL
SERVICE_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_PREFIX}-apprunner" \
    --query 'Stacks[0].Outputs[?OutputKey==`AppRunnerServiceUrl`].OutputValue' \
    --output text \
    --region $AWS_REGION)

# Get Dashboard URL
DASHBOARD_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_PREFIX}-monitoring" \
    --query 'Stacks[0].Outputs[?OutputKey==`DashboardURL`].OutputValue' \
    --output text \
    --region $AWS_REGION)

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   🌐 Application URL: $SERVICE_URL"
echo "   📊 CloudWatch Dashboard: $DASHBOARD_URL"
echo "   📦 ECR Repository: $ECR_REPO_URI"
echo ""
echo "🎉 Your Todo App is now live!"