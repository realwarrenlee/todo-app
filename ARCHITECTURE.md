# Todo App - Architecture Documentation

## 🏗️ System Architecture Overview

This document provides a comprehensive overview of the Todo App architecture, including system design, component interactions, and deployment strategy.

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Interface                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Web Browser   │  │   Mobile App    │  │   API Client    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AWS App Runner                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Next.js Application                     │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │ │
│  │  │   Frontend    │  │  API Routes   │  │  Middleware   │  │ │
│  │  │   (React)     │  │  (REST API)   │  │   (Auth)      │  │ │
│  │  └───────────────┘  └───────────────┘  └───────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ AWS SDK
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Amazon DynamoDB                          │
│  ┌─────────────────┐              ┌─────────────────┐          │
│  │   Todos Table   │              │ Categories Table│          │
│  │                 │              │                 │          │
│  │ PK: userId      │              │ PK: userId      │          │
│  │ SK: todoId      │              │ SK: categoryId  │          │
│  └─────────────────┘              └─────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Metrics & Logs
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Amazon CloudWatch                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Dashboards    │  │     Alarms      │  │      Logs       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Notifications
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Amazon SNS                              │
│                    (Email Notifications)                        │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 CI/CD Pipeline Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│  AWS CodePipeline│───▶│  AWS CodeBuild  │
│                 │    │                 │    │                 │
│ Source Code     │    │ Pipeline Mgmt   │    │ Docker Build    │
│ Dockerfile      │    │ Orchestration   │    │ ECR Push        │
│ buildspec.yml   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  AWS App Runner │◀───│   Amazon ECR    │    │  CloudFormation │
│                 │    │                 │    │                 │
│ Auto Deploy     │    │ Container       │    │ Infrastructure  │
│ Load Balancing  │    │ Registry        │    │ as Code         │
│ Auto Scaling    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🏛️ Component Architecture

### Frontend Layer (Next.js React)

```typescript
// Component Hierarchy
App
├── Layout
│   ├── Sidebar
│   │   ├── CategoryList
│   │   └── AddCategoryDialog
│   └── Header
│       ├── ThemeToggle
│       └── SearchBar
├── TodoList
│   ├── TodoItem
│   ├── Pagination
│   └── SortControls
└── AddTodoForm
```

**Key Components:**
- **SidebarProvider**: Context for sidebar state management
- **TodoApp**: Main application component with state management
- **UI Components**: Reusable components built with Radix UI
- **Theme Provider**: Dark/light mode management

### API Layer (Next.js API Routes)

```
/api/
├── todos/
│   ├── route.ts          # GET /api/todos, POST /api/todos
│   └── [id]/
│       └── route.ts      # PUT /api/todos/[id], DELETE /api/todos/[id]
└── categories/
    ├── route.ts          # GET /api/categories, POST /api/categories
    └── [id]/
        └── route.ts      # DELETE /api/categories/[id]
```

**API Features:**
- RESTful design principles
- Input validation and sanitization
- Error handling and logging
- Pagination and filtering support
- CORS configuration

### Database Layer (DynamoDB)

**Table Design:**

```javascript
// Todos Table
{
  TableName: "todos",
  KeySchema: [
    { AttributeName: "userId", KeyType: "HASH" },    // Partition Key
    { AttributeName: "todoId", KeyType: "RANGE" }    // Sort Key
  ],
  AttributeDefinitions: [
    { AttributeName: "userId", AttributeType: "S" },
    { AttributeName: "todoId", AttributeType: "S" }
  ]
}

// Categories Table
{
  TableName: "categories",
  KeySchema: [
    { AttributeName: "userId", KeyType: "HASH" },      // Partition Key
    { AttributeName: "categoryId", KeyType: "RANGE" }  // Sort Key
  ],
  AttributeDefinitions: [
    { AttributeName: "userId", AttributeType: "S" },
    { AttributeName: "categoryId", AttributeType: "S" }
  ]
}
```

## 🔧 Technology Stack

### Frontend Technologies
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **next-themes**: Theme management

### Backend Technologies
- **Next.js API Routes**: Serverless API endpoints
- **AWS SDK v3**: AWS service integration
- **DynamoDB**: NoSQL database

### Infrastructure & DevOps
- **AWS App Runner**: Container deployment platform
- **Amazon ECR**: Container registry
- **AWS CodePipeline**: CI/CD orchestration
- **AWS CodeBuild**: Build service
- **CloudFormation**: Infrastructure as Code
- **CloudWatch**: Monitoring and logging
- **Amazon SNS**: Notification service

### Development Tools
- **Docker**: Containerization
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Git**: Version control

## 🗄️ Data Model

### Entity Relationship

```
User (1) ──────── (N) Category
                      │
                      │ (1)
                      │
                      │ (N)
                     Todo
```

### Data Access Patterns

1. **Get all todos for a user**
   - Query: `userId = :userId`
   - Index: Primary Key

2. **Get todos by category**
   - Query: `userId = :userId` + Filter: `categoryId = :categoryId`
   - Index: Primary Key with filter

3. **Search todos by task content**
   - Query: `userId = :userId` + Filter: `contains(task, :searchTerm)`
   - Index: Primary Key with filter

4. **Get all categories for a user**
   - Query: `userId = :userId`
   - Index: Primary Key

### Data Consistency
- **Strong Consistency**: All reads return the most recent write
- **ACID Transactions**: Not required for this use case
- **Eventual Consistency**: Acceptable for non-critical operations

## 🚀 Deployment Architecture

### Container Strategy
```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS base
FROM base AS deps          # Install dependencies
FROM base AS builder       # Build application
FROM base AS runner        # Production runtime
```

### AWS App Runner Configuration
- **CPU**: 1 vCPU
- **Memory**: 2 GB
- **Auto Scaling**: Enabled
- **Health Checks**: HTTP endpoint monitoring
- **Environment Variables**: Secure configuration management

### Security Architecture
```
Internet Gateway
        │
        ▼
Application Load Balancer (HTTPS)
        │
        ▼
AWS App Runner (Private Network)
        │
        ▼
DynamoDB (VPC Endpoints)
```

## 📊 Monitoring & Observability

### Metrics Collection
- **Application Metrics**: Request count, response time, error rate
- **Infrastructure Metrics**: CPU, memory, network utilization
- **Business Metrics**: Todo creation rate, user activity

### Logging Strategy
```
Application Logs
├── Request/Response Logs
├── Error Logs
├── Performance Logs
└── Audit Logs
```

### Alerting Rules
1. **High Error Rate**: >5% 5xx errors in 5 minutes
2. **High Latency**: >2 seconds average response time
3. **Resource Utilization**: >80% CPU or memory usage
4. **Service Availability**: Health check failures

## 🔒 Security Architecture

### Authentication & Authorization
- **User Isolation**: Data segregated by `userId`
- **API Security**: Input validation and sanitization
- **Environment Variables**: Secure configuration management

### Network Security
- **HTTPS Only**: All traffic encrypted in transit
- **Private Networking**: App Runner in private subnet
- **VPC Endpoints**: Secure DynamoDB access

### Data Security
- **Encryption at Rest**: DynamoDB encryption enabled
- **Encryption in Transit**: TLS 1.2+ for all connections
- **Access Control**: IAM roles with least privilege

## 📈 Performance Considerations

### Frontend Optimization
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component
- **Caching**: Browser and CDN caching strategies
- **Bundle Size**: Tree shaking and minification

### Backend Optimization
- **Database Queries**: Efficient DynamoDB access patterns
- **Caching**: Consider Redis for frequently accessed data
- **Connection Pooling**: AWS SDK connection reuse
- **Serverless**: Auto-scaling with App Runner

### Scalability Patterns
- **Horizontal Scaling**: App Runner auto-scaling
- **Database Scaling**: DynamoDB on-demand billing
- **CDN**: CloudFront for static assets
- **Load Balancing**: Built-in with App Runner

## 🔄 Data Flow

### Create Todo Flow
```
1. User submits form
2. Frontend validates input
3. API route receives request
4. Server-side validation
5. DynamoDB write operation
6. Response sent to client
7. UI updates with new todo
```

### Search & Filter Flow
```
1. User types in search box
2. Debounced API call
3. Server queries DynamoDB
4. Apply filters and pagination
5. Return filtered results
6. Update UI with results
```

## 🧪 Testing Strategy

### Unit Testing
- Component testing with Jest and React Testing Library
- API route testing with supertest
- Database operation testing with DynamoDB Local

### Integration Testing
- End-to-end testing with Playwright
- API integration testing
- Database integration testing

### Performance Testing
- Load testing with Artillery
- Stress testing for scalability
- Database performance testing

## 🔮 Future Enhancements

### Technical Improvements
- **Caching Layer**: Redis for improved performance
- **Search Engine**: Elasticsearch for advanced search
- **Real-time Updates**: WebSocket integration
- **Mobile App**: React Native implementation

### Feature Enhancements
- **User Authentication**: Multi-user support
- **Collaboration**: Shared todos and categories
- **Notifications**: Due date reminders
- **Analytics**: Usage statistics and insights

### Infrastructure Improvements
- **Multi-Region**: Global deployment
- **CDN**: CloudFront integration
- **Backup Strategy**: Automated backups
- **Disaster Recovery**: Cross-region replication

---

This architecture provides a solid foundation for a scalable, maintainable, and secure todo application while demonstrating modern cloud-native development practices.