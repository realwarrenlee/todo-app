# DynamoDB Integration Setup

## Prerequisites

1. **AWS Account**: You need an AWS account with DynamoDB access
2. **AWS Credentials**: Set up your AWS credentials

## Setup Steps

### 1. Configure AWS Credentials

Update the `.env.local` file with your AWS credentials:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_actual_access_key_here
AWS_SECRET_ACCESS_KEY=your_actual_secret_key_here
DYNAMODB_TODOS_TABLE=todos
DYNAMODB_CATEGORIES_TABLE=categories
DEFAULT_USER_ID=default-user
```

### 2. Create DynamoDB Tables

Run the setup script to create the required tables:

```bash
node scripts/setup-dynamodb.js
```

This will create two tables:
- `todos`: Stores todo items with userId (partition key) and todoId (sort key)
- `categories`: Stores categories with userId (partition key) and categoryId (sort key)

### 3. Start the Application

```bash
npm run dev
```

## Table Structure

### Todos Table
- **Partition Key**: `userId` (String)
- **Sort Key**: `todoId` (String)
- **Attributes**: `task`, `completed`, `categoryId`, `created`

### Categories Table
- **Partition Key**: `userId` (String)
- **Sort Key**: `categoryId` (String)
- **Attributes**: `name`, `color`, `created`

## API Endpoints

- `GET /api/todos` - Get all todos for the user
- `POST /api/todos` - Create a new todo
- `PUT /api/todos/[id]` - Update a todo (toggle completion, edit task)
- `DELETE /api/todos/[id]` - Delete a todo

- `GET /api/categories` - Get all categories for the user
- `POST /api/categories` - Create a new category
- `DELETE /api/categories/[id]` - Delete a category and all its todos

## Security Notes

- Currently using a default user ID for simplicity
- For production, implement proper authentication (NextAuth.js, AWS Cognito, etc.)
- Store AWS credentials securely (AWS IAM roles, environment variables)
- Consider using AWS SDK credential chain for production deployments

## Troubleshooting

1. **AWS Credentials Error**: Make sure your AWS credentials are correct and have DynamoDB permissions
2. **Table Not Found**: Run the setup script to create tables
3. **Region Mismatch**: Ensure your AWS region matches in both credentials and table creation