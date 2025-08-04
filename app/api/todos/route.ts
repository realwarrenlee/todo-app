import { NextRequest, NextResponse } from "next/server"
import { dynamodb, TABLES } from "@/lib/dynamodb"
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb"

const USER_ID = process.env.DEFAULT_USER_ID || "default-user"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'created'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId') || ''

    const command = new QueryCommand({
      TableName: TABLES.TODOS,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": USER_ID,
      },
    })

    const result = await dynamodb.send(command)
    let items = result.Items || []

    // Apply search filter
    if (search) {
      items = items.filter(item => 
        item.task.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Apply category filter
    if (categoryId && categoryId !== 'all') {
      items = items.filter(item => item.categoryId === categoryId)
    }

    // Apply sorting
    items.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === 'created') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedItems = items.slice(startIndex, endIndex)

    return NextResponse.json({
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total: items.length,
        totalPages: Math.ceil(items.length / limit),
        hasNext: endIndex < items.length,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error("Error fetching todos:", error)
    return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { task, categoryId } = body

    const todo = {
      userId: USER_ID,
      todoId: Date.now().toString(),
      task,
      completed: false,
      categoryId,
      created: new Date().toISOString(),
    }

    const command = new PutCommand({
      TableName: TABLES.TODOS,
      Item: todo,
    })

    await dynamodb.send(command)
    return NextResponse.json(todo)
  } catch (error) {
    console.error("Error creating todo:", error)
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 })
  }
}