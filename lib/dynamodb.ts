import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export const dynamodb = DynamoDBDocumentClient.from(client)

export const TABLES = {
  TODOS: process.env.DYNAMODB_TODOS_TABLE || "todos",
  CATEGORIES: process.env.DYNAMODB_CATEGORIES_TABLE || "categories",
}