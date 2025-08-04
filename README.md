# Todo App

A full-stack CRUD (Create, Read, Update, Delete) application built with Next.js, DynamoDB, and deployed on AWS with CI/CD pipeline.

## 🎯 Project Overview

This capstone project demonstrates the implementation of a complete todo management application with the following features:

- **Full CRUD Operations**: Create, read, update, and delete todos and categories
- **Modern UI**: Responsive design with dark/light theme support
- **Search & Filter**: Real-time search and category-based filtering
- **Pagination & Sorting**: Efficient data handling with pagination and sorting options
- **AWS Cloud Deployment**: Containerized deployment using AWS App Runner
- **CI/CD Pipeline**: Automated deployment with AWS CodePipeline
- **Monitoring**: CloudWatch dashboards and alerts

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **UI Components**: Radix UI with Tailwind CSS
- **State Management**: React hooks
- **Theme**: Dark/Light mode with next-themes

### Backend
- **API**: Next.js API Routes
- **Database**: Amazon DynamoDB
- **Authentication**: Simple user-based isolation

### Infrastructure
- **Container Registry**: Amazon ECR
- **Deployment**: AWS App Runner
- **CI/CD**: AWS CodePipeline + CodeBuild
- **Monitoring**: CloudWatch
- **Infrastructure as Code**: CloudFormation

## 📋 Features

### ✅ CRUD Operations

#### Create (C)
- ✅ Add new todos with form validation
- ✅ Create custom categories with color coding
- ✅ Input validation and error handling
- ✅ Success confirmation messages

#### Read (R)
- ✅ List all todos with pagination (10 items per page)
- ✅ Category-based filtering
- ✅ Real-time search functionality
- ✅ Detailed view of individual items
- ✅ Sorting by date, name, and completion status

#### Update (U)
- ✅ Toggle todo completion status
- ✅ Edit todo tasks (inline editing)
- ✅ Data validation on updates
- ✅ Update confirmation

#### Delete (D)
- ✅ Delete individual todos
- ✅ Delete categories (cascades to associated todos)
- ✅ Confirmation dialogs to prevent accidental deletion
- ✅ Success feedback

### 🔍 Advanced Features
- **Search**: Filter todos by task content
- **Sorting**: Sort by creation date, task name, or completion status
- **Pagination**: Navigate through large datasets efficiently
- **Responsive Design**: Works on desktop and mobile devices
- **Theme Support**: Dark and light mode toggle

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- AWS CLI configured
- Docker installed
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd todo-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your `.env.local`:
   ```env
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   DEFAULT_USER_ID=default-user
   ```

4. **Set up DynamoDB tables**
   ```bash
   node scripts/setup-dynamodb.js
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🐳 Docker Deployment

### Build Docker Image
```bash
docker build -t todo-app .
```

### Run Container
```bash
docker run -p 3000:3000 \
  -e AWS_ACCESS_KEY_ID=your_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret \
  -e AWS_REGION=us-east-1 \
  -e DEFAULT_USER_ID=default-user \
  todo-app
```

## ☁️ AWS Deployment

### Automated Deployment (Recommended)

1. **Configure deployment script**
   Edit `scripts/deploy.ps1` (Windows) or `scripts/deploy.sh` (Linux/Mac):
   ```powershell
   $GitHubOwner = "your-github-username"
   $GitHubRepo = "todo-app"
   $NotificationEmail = "your-email@example.com"
   ```

2. **Run deployment**
   ```powershell
   # Windows
   .\scripts\deploy.ps1
   
   # Linux/Mac
   ./scripts/deploy.sh
   ```

### Manual Deployment

1. **Deploy ECR Repository**
   ```bash
   aws cloudformation deploy \
     --template-file infrastructure/ecr-repository.yaml \
     --stack-name todo-app-ecr \
     --region us-east-1
   ```

2. **Build and Push Docker Image**
   ```bash
   # Get ECR login
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   
   # Build and push
   docker build -t todo-app .
   docker tag todo-app:latest <ecr-uri>:latest
   docker push <ecr-uri>:latest
   ```

3. **Deploy App Runner Service**
   ```bash
   aws cloudformation deploy \
     --template-file infrastructure/apprunner.yaml \
     --stack-name todo-app-apprunner \
     --parameter-overrides ECRRepositoryURI=<ecr-uri> \
     --capabilities CAPABILITY_IAM \
     --region us-east-1
   ```

4. **Deploy Monitoring**
   ```bash
   aws cloudformation deploy \
     --template-file infrastructure/monitoring.yaml \
     --stack-name todo-app-monitoring \
     --parameter-overrides AppRunnerServiceArn=<service-arn> \
     --region us-east-1
   ```

## 📊 Monitoring & Observability

### CloudWatch Dashboard
- Request metrics (2xx, 4xx, 5xx responses)
- Response time monitoring
- CPU and memory utilization
- Custom application metrics

### Alerts
- High error rate (>10 5xx errors in 5 minutes)
- High response time (>2 seconds average)
- High CPU utilization (>80%)
- Email notifications via SNS

### Logs
- Application logs in CloudWatch Logs
- Request/response logging
- Error tracking and debugging

## 🔄 CI/CD Pipeline

### Pipeline Stages
1. **Source**: GitHub repository integration
2. **Build**: Docker image build and ECR push
3. **Deploy**: Automatic deployment to App Runner

### Setup CI/CD
1. **Store GitHub token in AWS Secrets Manager**
   ```bash
   aws secretsmanager create-secret \
     --name github-token \
     --secret-string '{"token":"your-github-personal-access-token"}'
   ```

2. **Deploy pipeline**
   ```bash
   aws cloudformation deploy \
     --template-file infrastructure/codepipeline.yaml \
     --stack-name todo-app-pipeline \
     --parameter-overrides \
       GitHubOwner=your-username \
       GitHubRepo=todo-app \
     --capabilities CAPABILITY_IAM
   ```

## 🗄️ Database Schema

### Todos Table
```
Primary Key: userId (String), todoId (String)
Attributes:
- task (String): The todo task description
- completed (Boolean): Completion status
- categoryId (String): Associated category ID
- created (String): ISO timestamp
```

### Categories Table
```
Primary Key: userId (String), categoryId (String)
Attributes:
- name (String): Category display name
- color (String): CSS color class
- created (String): ISO timestamp
```

## 🛠️ Development

### Project Structure
```
todo-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── todos/         # Todo CRUD endpoints
│   │   └── categories/    # Category CRUD endpoints
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main application
├── components/            # Reusable UI components
│   └── ui/               # Base UI components
├── infrastructure/        # CloudFormation templates
│   ├── apprunner.yaml    # App Runner service
│   ├── codepipeline.yaml # CI/CD pipeline
│   ├── ecr-repository.yaml # Container registry
│   └── monitoring.yaml   # CloudWatch resources
├── lib/                  # Utility libraries
│   ├── dynamodb.ts       # DynamoDB client
│   └── utils.ts          # Helper functions
├── scripts/              # Deployment scripts
│   ├── deploy.ps1        # Windows deployment
│   ├── deploy.sh         # Linux/Mac deployment
│   └── setup-dynamodb.js # Database setup
├── Dockerfile            # Container configuration
├── buildspec.yml         # CodeBuild specification
└── apprunner.yaml        # App Runner configuration
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Environment Variables
```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Application Configuration
DEFAULT_USER_ID=default-user
NODE_ENV=production
```

## 🧪 Testing

### Automated Test Suite

The project includes comprehensive automated tests covering unit tests, integration tests, and component tests.

#### Test Structure
```
__tests__/
├── api/                    # API route unit tests
│   ├── todos.test.ts      # Todos CRUD operations
│   ├── todos/[id].test.ts # Individual todo operations
│   ├── categories.test.ts # Categories CRUD operations
│   └── categories/[id].test.ts # Category deletion
├── components/            # React component tests
│   └── TodoApp.test.tsx   # Main application component
├── integration/           # Integration tests
│   └── todos-api.test.ts  # Full API workflow tests
├── lib/                   # Utility function tests
│   └── dynamodb.test.ts   # Database configuration tests
├── scripts/               # Script tests
│   └── setup-dynamodb.test.js # Database setup tests
└── test-utils.tsx         # Testing utilities and helpers
```

#### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- todos.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should create"
```

#### Test Coverage

The test suite maintains high coverage across all critical components:

- **API Routes**: 100% coverage of all CRUD endpoints
- **Database Operations**: Complete DynamoDB integration testing
- **Component Logic**: User interactions and state management
- **Error Handling**: Comprehensive error scenario testing
- **Integration Workflows**: End-to-end API testing

#### Test Categories

**Unit Tests**
- API route handlers (`/api/todos`, `/api/categories`)
- Database utility functions
- Individual component logic
- Error handling and validation

**Integration Tests**
- Complete CRUD workflows
- Search and filtering functionality
- Pagination logic
- Database integration

**Component Tests**
- User interface interactions
- Form submissions and validation
- State management
- Event handling

#### Test Configuration

Tests are configured with:
- **Jest** as the test runner
- **React Testing Library** for component testing
- **jsdom** environment for DOM simulation
- **AWS SDK mocking** for database operations
- **Coverage thresholds** set to 70% minimum

#### Mock Strategy

- **AWS SDK**: Mocked to prevent actual AWS calls during testing
- **Next.js APIs**: Mocked navigation and themes
- **Fetch API**: Mocked for API endpoint testing
- **Environment Variables**: Test-specific configuration

### Manual Testing Checklist
- [ ] Create new todo
- [ ] Edit existing todo
- [ ] Mark todo as complete/incomplete
- [ ] Delete todo
- [ ] Create new category
- [ ] Delete category (with todos)
- [ ] Search functionality
- [ ] Pagination navigation
- [ ] Sort by different criteria
- [ ] Theme toggle
- [ ] Responsive design

### API Testing
Use tools like Postman or curl to test API endpoints:

```bash
# Get all todos
curl -X GET http://localhost:3000/api/todos

# Create new todo
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"task":"Test todo","categoryId":"personal"}'

# Update todo
curl -X PUT http://localhost:3000/api/todos/123 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Delete todo
curl -X DELETE http://localhost:3000/api/todos/123
```

### Performance Testing

For load testing the deployed application:

```bash
# Install Artillery for load testing
npm install -g artillery

# Create a load test configuration
cat > load-test.yml << EOF
config:
  target: 'https://your-app-url.awsapprunner.com'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Get todos"
    requests:
      - get:
          url: "/api/todos"
  - name: "Create todo"
    requests:
      - post:
          url: "/api/todos"
          json:
            task: "Load test todo"
            categoryId: "personal"
EOF

# Run load test
artillery run load-test.yml
```

## 🚨 Troubleshooting

### Common Issues

1. **DynamoDB Connection Issues**
   - Verify AWS credentials are configured
   - Check AWS region settings
   - Ensure DynamoDB tables exist

2. **Docker Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review Dockerfile syntax

3. **Deployment Issues**
   - Confirm AWS CLI is configured
   - Check CloudFormation stack status
   - Review CloudWatch logs

4. **App Runner Issues**
   - Verify ECR image exists
   - Check environment variables
   - Review App Runner service logs

### Logs and Debugging
- **Local Development**: Check browser console and terminal output
- **Production**: Use CloudWatch Logs to view application logs
- **Build Issues**: Check CodeBuild logs in AWS Console

## 📈 Performance Considerations

- **Database**: DynamoDB provides single-digit millisecond latency
- **Caching**: Consider implementing Redis for frequently accessed data
- **CDN**: Use CloudFront for static asset delivery
- **Optimization**: Next.js automatic code splitting and optimization

## 🔒 Security Best Practices

- **Environment Variables**: Never commit secrets to version control
- **IAM Roles**: Use least privilege principle
- **HTTPS**: All traffic encrypted in transit
- **Input Validation**: Server-side validation for all inputs
- **Error Handling**: Don't expose sensitive information in errors
