import { NextRequest } from 'next/server'
import { DELETE } from '@/app/api/categories/[id]/route'
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

describe('/api/categories/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('DELETE /api/categories/[id]', () => {
    it('should delete category and associated todos', async () => {
      const mockTodos = [
        {
          userId: 'test-user',
          todoId: '1',
          task: 'Todo 1',
          categoryId: 'work',
        },
        {
          userId: 'test-user',
          todoId: '2',
          task: 'Todo 2',
          categoryId: 'work',
        },
      ]

      // Mock query for todos in category
      mockDynamodb.send.mockResolvedValueOnce({
        Items: mockTodos,
      })

      // Mock delete operations for todos and category
      mockDynamodb.send.mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/categories/work', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: 'work' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Should have called send 4 times: 1 query + 2 todo deletes + 1 category delete
      expect(mockDynamodb.send).toHaveBeenCalledTimes(4)
    })

    it('should delete category with no associated todos', async () => {
      // Mock query returns no todos
      mockDynamodb.send.mockResolvedValueOnce({
        Items: [],
      })

      // Mock category deletion
      mockDynamodb.send.mockResolvedValueOnce({})

      const request = new NextRequest('http://localhost:3000/api/categories/empty-category', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: 'empty-category' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Should have called send 2 times: 1 query + 1 category delete
      expect(mockDynamodb.send).toHaveBeenCalledTimes(2)
    })

    it('should handle database errors during deletion', async () => {
      mockDynamodb.send.mockRejectedValueOnce(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/categories/work', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: 'work' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to delete category')
    })
  })
})