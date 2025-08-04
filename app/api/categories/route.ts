import { NextRequest, NextResponse } from "next/server"
import { dynamodb, TABLES } from "@/lib/dynamodb"
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb"

const USER_ID = process.env.DEFAULT_USER_ID || "default-user"

const defaultCategories = [
  { categoryId: "personal", name: "Personal", color: "bg-blue-500" },
  { categoryId: "work", name: "Work", color: "bg-green-500" },
  { categoryId: "shopping", name: "Shopping", color: "bg-purple-500" },
]

export async function GET() {
  try {
    const command = new QueryCommand({
      TableName: TABLES.CATEGORIES,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": USER_ID,
      },
    })

    const result = await dynamodb.send(command)
    let categories = result.Items || []

    // If no categories exist, create default ones
    if (categories.length === 0) {
      for (const category of defaultCategories) {
        const categoryItem = {
          userId: USER_ID,
          ...category,
          created: new Date().toISOString(),
        }

        const putCommand = new PutCommand({
          TableName: TABLES.CATEGORIES,
          Item: categoryItem,
        })

        await dynamodb.send(putCommand)
        categories.push(categoryItem)
      }
    }

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, color } = body

    const category = {
      userId: USER_ID,
      categoryId: Date.now().toString(),
      name,
      color,
      created: new Date().toISOString(),
    }

    const command = new PutCommand({
      TableName: TABLES.CATEGORIES,
      Item: category,
    })

    await dynamodb.send(command)
    return NextResponse.json(category)
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}