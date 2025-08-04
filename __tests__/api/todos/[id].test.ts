import { NextRequest } from 'next/server'
import { PUT, DELETE } from '@/app/api/todos/[id]/route'
import { dynamodb } from '@/lib/dynamodb'

// Mock the DynamoDB client
jest.mock('@/lib/dynamodb', () => ({
  dynamodb: {
    send: jest.fn(),
  },
  TABLES: {
    TODOS: 'todos',
    CATEGORIES: 'categories',
  },
}))

const mockDynamodb = dynamodb as jest.Mocked<typeof dynamodb>

describe('/api/todos/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('PUT /api/todos/[id]', () => {
    it('should update todo completion status', async () => {
      const updatedTodo = {
        userId: 'test-user',
        todoId: '123',
        task: 'Test todo',
        completed: true,
        categoryId: 'personal',
        created: '2024-01-01T00:00:00.000Z',
      }

      mockDynamodb.send.mockResolvedValueOnce({
        Attributes: updatedTodo,
      })

      const request = new NextRequest('http://localhost:3000/api/todos/123', {
        method: 'PUT',
        body: JSON.stringify({ completed: true }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: { id: '123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.completed).toBe(true)
      expect(data.todoId).toBe('123')
    })

    it('should update todo task', async () => {
      const updatedTodo = {
        userId: 'test-user',
        todoId: '123',
        task: 'Updated task',
        completed: false,
        categoryId: 'personal',
        created: '2024-01-01T00:00:00.000Z',
      }

      mockDynamodb.send.mockResolvedValueOnce({
        Attributes: updatedTodo,
      })

      const request = new NextRequest('http://localhost:3000/api/todos/123', {
        method: 'PUT',
        body: JSON.stringify({ task: 'Updated task' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: { id: '123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.task).toBe('Updated task')
    })

    it('should update both task and completion status', async () => {
      const updatedTodo = {
        userId: 'test-user',
        todoId: '123',
        task: 'Updated completed task',
        completed: true,
        categoryId: 'personal',
        created: '2024-01-01T00:00:00.000Z',
      }

      mockDynamodb.send.mockResolvedValueOnce({
        Attributes: updatedTodo,
      })

      const request = new NextRequest('http://localhost:3000/api/todos/123', {
        method: 'PUT',
        body: JSON.stringify({ 
          task: 'Updated completed task',
          completed: true 
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: { id: '123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.task).toBe('Updated completed task')
      expect(data.completed).toBe(true)
    })

    it('should handle database errors during update', async () => {
      mockDynamodb.send.mockRejectedValueOnce(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/todos/123', {
        method: 'PUT',
        body: JSON.stringify({ completed: true }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: { id: '123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update todo')
    })
  })

  describe('DELETE /api/todos/[id]', () => {
    it('should delete a todo', async () => {
      mockDynamodb.send.mockResolvedValueOnce({})

      const request = new NextRequest('http://localhost:3000/api/todos/123', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: '123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle database errors during deletion', async () => {
      mockDynamodb.send.mockRejectedValueOnce(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/todos/123', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: '123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to delete todo')
    })
  })
})