import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/categories/route'
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

describe('/api/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/categories', () => {
    it('should return existing categories', async () => {
      const mockCategories = [
        {
          userId: 'test-user',
          categoryId: 'personal',
          name: 'Personal',
          color: 'bg-blue-500',
          created: '2024-01-01T00:00:00.000Z',
        },
        {
          userId: 'test-user',
          categoryId: 'work',
          name: 'Work',
          color: 'bg-green-500',
          created: '2024-01-01T00:00:00.000Z',
        },
      ]

      mockDynamodb.send.mockResolvedValueOnce({
        Items: mockCategories,
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0].name).toBe('Personal')
      expect(data[1].name).toBe('Work')
    })

    it('should create default categories when none exist', async () => {
      // First call returns empty array (no existing categories)
      mockDynamodb.send.mockResolvedValueOnce({
        Items: [],
      })

      // Subsequent calls for creating default categories
      mockDynamodb.send.mockResolvedValue({})

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(3) // Should have 3 default categories
      expect(data.some((cat: any) => cat.name === 'Personal')).toBe(true)
      expect(data.some((cat: any) => cat.name === 'Work')).toBe(true)
      expect(data.some((cat: any) => cat.name === 'Shopping')).toBe(true)
    })

    it('should handle database errors', async () => {
      mockDynamodb.send.mockRejectedValueOnce(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch categories')
    })
  })

  describe('POST /api/categories', () => {
    it('should create a new category', async () => {
      const newCategory = {
        name: 'Health',
        color: 'bg-red-500',
      }

      mockDynamodb.send.mockResolvedValueOnce({})

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify(newCategory),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe(newCategory.name)
      expect(data.color).toBe(newCategory.color)
      expect(data.userId).toBe('test-user')
      expect(data.categoryId).toBeDefined()
      expect(data.created).toBeDefined()
    })

    it('should handle database errors during creation', async () => {
      mockDynamodb.send.mockRejectedValueOnce(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Category',
          color: 'bg-blue-500',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create category')
    })
  })
})