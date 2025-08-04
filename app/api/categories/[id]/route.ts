import { NextRequest, NextResponse } from "next/server"
import { dynamodb, TABLES } from "@/lib/dynamodb"
import { DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb"

const USER_ID = process.env.DEFAULT_USER_ID || "default-user"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id

    // First, delete all todos in this category
    const todosQuery = new QueryCommand({
      TableName: TABLES.TODOS,
      KeyConditionExpression: "userId = :userId",
      FilterExpression: "categoryId = :categoryId",
      ExpressionAttributeValues: {
        ":userId": USER_ID,
        ":categoryId": categoryId,
      },
    })

    const todosResult = await dynamodb.send(todosQuery)
    
    // Delete each todo
    if (todosResult.Items) {
      for (const todo of todosResult.Items) {
        const deleteTodoCommand = new DeleteCommand({
          TableName: TABLES.TODOS,
          Key: {
            userId: USER_ID,
            todoId: todo.todoId,
          },
        })
        await dynamodb.send(deleteTodoCommand)
      }
    }

    // Then delete the category
    const deleteCategoryCommand = new DeleteCommand({
      TableName: TABLES.CATEGORIES,
      Key: {
        userId: USER_ID,
        categoryId,
      },
    })

    await dynamodb.send(deleteCategoryCommand)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}