import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/todos/route'
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

describe('/api/todos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/todos', () => {
    it('should return paginated todos', async () => {
      const mockTodos = [
        {
          userId: 'test-user',
          todoId: '1',
          task: 'Test todo 1',
          completed: false,
          categoryId: 'personal',
          created: '2024-01-01T00:00:00.000Z',
        },
        {
          userId: 'test-user',
          todoId: '2',
          task: 'Test todo 2',
          completed: true,
          categoryId: 'work',
          created: '2024-01-02T00:00:00.000Z',
        },
      ]

      mockDynamodb.send.mockResolvedValueOnce({
        Items: mockTodos,
      })

      const request = new NextRequest('http://localhost:3000/api/todos?page=1&limit=10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toHaveLength(2)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })
    })

    it('should filter todos by search query', async () => {
      const mockTodos = [
        {
          userId: 'test-user',
          todoId: '1',
          task: 'Buy groceries',
          completed: false,
          categoryId: 'personal',
          created: '2024-01-01T00:00:00.000Z',
        },
        {
          userId: 'test-user',
          todoId: '2',
          task: 'Write report',
          completed: false,
          categoryId: 'work',
          created: '2024-01-02T00:00:00.000Z',
        },
      ]

      mockDynamodb.send.mockResolvedValueOnce({
        Items: mockTodos,
      })

      const request = new NextRequest('http://localhost:3000/api/todos?search=groceries')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toHaveLength(1)
      expect(data.items[0].task).toBe('Buy groceries')
    })

    it('should filter todos by category', async () => {
      const mockTodos = [
        {
          userId: 'test-user',
          todoId: '1',
          task: 'Personal task',
          completed: false,
          categoryId: 'personal',
          created: '2024-01-01T00:00:00.000Z',
        },
        {
          userId: 'test-user',
          todoId: '2',
          task: 'Work task',
          completed: false,
          categoryId: 'work',
          created: '2024-01-02T00:00:00.000Z',
        },
      ]

      mockDynamodb.send.mockResolvedValueOnce({
        Items: mockTodos,
      })

      const request = new NextRequest('http://localhost:3000/api/todos?categoryId=work')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toHaveLength(1)
      expect(data.items[0].categoryId).toBe('work')
    })

    it('should sort todos by creation date descending by default', async () => {
      const mockTodos = [
        {
          userId: 'test-user',
          todoId: '1',
          task: 'Older task',
          completed: false,
          categoryId: 'personal',
          created: '2024-01-01T00:00:00.000Z',
        },
        {
          userId: 'test-user',
          todoId: '2',
          task: 'Newer task',
          completed: false,
          categoryId: 'personal',
          created: '2024-01-02T00:00:00.000Z',
        },
      ]

      mockDynamodb.send.mockResolvedValueOnce({
        Items: mockTodos,
      })

      const request = new NextRequest('http://localhost:3000/api/todos')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items[0].task).toBe('Newer task')
      expect(data.items[1].task).toBe('Older task')
    })

    it('should handle database errors', async () => {
      mockDynamodb.send.mockRejectedValueOnce(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/todos')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch todos')
    })
  })

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const newTodo = {
        task: 'New test todo',
        categoryId: 'personal',
      }

      mockDynamodb.send.mockResolvedValueOnce({})

      const request = new NextRequest('http://localhost:3000/api/todos', {
        method: 'POST',
        body: JSON.stringify(newTodo),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.task).toBe(newTodo.task)
      expect(data.categoryId).toBe(newTodo.categoryId)
      expect(data.completed).toBe(false)
      expect(data.userId).toBe('test-user')
      expect(data.todoId).toBeDefined()
      expect(data.created).toBeDefined()
    })

    it('should handle database errors during creation', async () => {
      mockDynamodb.send.mockRejectedValueOnce(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/todos', {
        method: 'POST',
        body: JSON.stringify({
          task: 'Test todo',
          categoryId: 'personal',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create todo')
    })
  })
})