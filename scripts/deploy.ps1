# Todo App Deployment Script for Windows PowerShell
param(
    [string]$StackPrefix = "todo-app",
    [string]$AWSRegion = "us-east-1",
    [string]$GitHubOwner = "your-github-username",
    [string]$GitHubRepo = "todo-app",
    [string]$NotificationEmail = "admin@example.com"
)

Write-Host "🚀 Starting Todo App deployment..." -ForegroundColor Green

# Check if AWS CLI is configured
try {
    $null = aws sts get-caller-identity 2>$null
} catch {
    Write-Host "❌ AWS CLI not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Get AWS Account ID
$AWSAccountId = aws sts get-caller-identity --query Account --output text
Write-Host "📋 AWS Account ID: $AWSAccountId" -ForegroundColor Cyan

# Deploy ECR Repository
Write-Host "📦 Deploying ECR Repository..." -ForegroundColor Yellow
aws cloudformation deploy `
    --template-file infrastructure/ecr-repository.yaml `
    --stack-name "$StackPrefix-ecr" `
    --parameter-overrides RepositoryName=todo-app `
    --region $AWSRegion

# Get ECR Repository URI
$ECRRepoURI = aws cloudformation describe-stacks `
    --stack-name "$StackPrefix-ecr" `
    --query 'Stacks[0].Outputs[?OutputKey==`ECRRepositoryURI`].OutputValue' `
    --output text `
    --region $AWSRegion

Write-Host "📦 ECR Repository URI: $ECRRepoURI" -ForegroundColor Cyan

# Build and push initial Docker image
Write-Host "🐳 Building and pushing Docker image..." -ForegroundColor Yellow
$LoginCommand = aws ecr get-login-password --region $AWSRegion
$LoginCommand | docker login --username AWS --password-stdin $ECRRepoURI

docker build -t todo-app .
docker tag todo-app:latest "$ECRRepoURI:latest"
docker push "$ECRRepoURI:latest"

# Setup DynamoDB tables
Write-Host "🗄️  Setting up DynamoDB tables..." -ForegroundColor Yellow
node scripts/setup-dynamodb.js

# Deploy App Runner Service
Write-Host "🏃 Deploying App Runner Service..." -ForegroundColor Yellow
aws cloudformation deploy `
    --template-file infrastructure/apprunner.yaml `
    --stack-name "$StackPrefix-apprunner" `
    --parameter-overrides `
        ServiceName=todo-app-service `
        ECRRepositoryURI=$ECRRepoURI `
        ImageTag=latest `
        AWSRegion=$AWSRegion `
    --capabilities CAPABILITY_IAM `
    --region $AWSRegion

# Get App Runner Service ARN
$AppRunnerARN = aws cloudformation describe-stacks `
    --stack-name "$StackPrefix-apprunner" `
    --query 'Stacks[0].Outputs[?OutputKey==`AppRunnerServiceArn`].OutputValue' `
    --output text `
    --region $AWSRegion

# Deploy Monitoring
Write-Host "📊 Deploying CloudWatch monitoring..." -ForegroundColor Yellow
aws cloudformation deploy `
    --template-file infrastructure/monitoring.yaml `
    --stack-name "$StackPrefix-monitoring" `
    --parameter-overrides `
        AppRunnerServiceArn=$AppRunnerARN `
        NotificationEmail=$NotificationEmail `
    --region $AWSRegion

# Deploy CI/CD Pipeline (optional)
Write-Host "🔄 Deploying CI/CD Pipeline..." -ForegroundColor Yellow
Write-Host "⚠️  Note: Make sure to store your GitHub token in AWS Secrets Manager with name 'github-token'" -ForegroundColor Yellow
$DeployPipeline = Read-Host "Do you want to deploy the CI/CD pipeline? (y/n)"
if ($DeployPipeline -eq "y" -or $DeployPipeline -eq "Y") {
    aws cloudformation deploy `
        --template-file infrastructure/codepipeline.yaml `
        --stack-name "$StackPrefix-pipeline" `
        --parameter-overrides `
            GitHubOwner=$GitHubOwner `
            GitHubRepo=$GitHubRepo `
            GitHubBranch=main `
            ECRRepositoryName=todo-app `
            AppRunnerServiceName=todo-app-service `
        --capabilities CAPABILITY_IAM `
        --region $AWSRegion
}

# Get App Runner Service URL
$ServiceURL = aws cloudformation describe-stacks `
    --stack-name "$StackPrefix-apprunner" `
    --query 'Stacks[0].Outputs[?OutputKey==`AppRunnerServiceUrl`].OutputValue' `
    --output text `
    --region $AWSRegion

# Get Dashboard URL
$DashboardURL = aws cloudformation describe-stacks `
    --stack-name "$StackPrefix-monitoring" `
    --query 'Stacks[0].Outputs[?OutputKey==`DashboardURL`].OutputValue' `
    --output text `
    --region $AWSRegion

Write-Host ""
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Deployment Summary:" -ForegroundColor Cyan
Write-Host "   🌐 Application URL: $ServiceURL" -ForegroundColor White
Write-Host "   📊 CloudWatch Dashboard: $DashboardURL" -ForegroundColor White
Write-Host "   📦 ECR Repository: $ECRRepoURI" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Your Todo App is now live!" -ForegroundColor Green