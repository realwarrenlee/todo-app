const { DynamoDBClient } = require("@aws-sdk/client-dynamodb")
const { CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb")

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

async function createTable(tableName, keySchema, attributeDefinitions) {
  try {
    // Check if table already exists
    try {
      await client.send(new DescribeTableCommand({ TableName: tableName }))
      console.log(`Table ${tableName} already exists`)
      return
    } catch (error) {
      if (error.name !== "ResourceNotFoundException") {
        throw error
      }
    }

    // Create table
    const command = new CreateTableCommand({
      TableName: tableName,
      KeySchema: keySchema,
      AttributeDefinitions: attributeDefinitions,
      BillingMode: "PAY_PER_REQUEST",
    })

    await client.send(command)
    console.log(`Table ${tableName} created successfully`)
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, error)
  }
}

async function setupTables() {
  console.log("Setting up DynamoDB tables...")

  // Create todos table
  await createTable(
    "todos",
    [
      { AttributeName: "userId", KeyType: "HASH" },
      { AttributeName: "todoId", KeyType: "RANGE" },
    ],
    [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "todoId", AttributeType: "S" },
    ]
  )

  // Create categories table
  await createTable(
    "categories",
    [
      { AttributeName: "userId", KeyType: "HASH" },
      { AttributeName: "categoryId", KeyType: "RANGE" },
    ],
    [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "categoryId", AttributeType: "S" },
    ]
  )

  console.log("DynamoDB setup complete!")
}

setupTables().catch(console.error)