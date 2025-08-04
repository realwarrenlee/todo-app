import { NextRequest, NextResponse } from "next/server"
import { dynamodb, TABLES } from "@/lib/dynamodb"
import { UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb"

const USER_ID = process.env.DEFAULT_USER_ID || "default-user"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { completed, task } = body
    const todoId = params.id

    const updateExpression = []
    const expressionAttributeValues: any = {}

    if (completed !== undefined) {
      updateExpression.push("completed = :completed")
      expressionAttributeValues[":completed"] = completed
    }

    if (task !== undefined) {
      updateExpression.push("#task = :task")
      expressionAttributeValues[":task"] = task
    }

    const command = new UpdateCommand({
      TableName: TABLES.TODOS,
      Key: {
        userId: USER_ID,
        todoId,
      },
      UpdateExpression: `SET ${updateExpression.join(", ")}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: task !== undefined ? { "#task": "task" } : undefined,
      ReturnValues: "ALL_NEW",
    })

    const result = await dynamodb.send(command)
    return NextResponse.json(result.Attributes)
  } catch (error) {
    console.error("Error updating todo:", error)
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const todoId = params.id

    const command = new DeleteCommand({
      TableName: TABLES.TODOS,
      Key: {
        userId: USER_ID,
        todoId,
      },
    })

    await dynamodb.send(command)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting todo:", error)
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 })
  }
}