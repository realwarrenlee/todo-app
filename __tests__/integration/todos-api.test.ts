/**
 * Integration tests for the Todos API
 * These tests simulate real API calls and test the full request/response cycle
 */

import { NextRequest } from 'next/server'
import { GET as getTodos, POST as createTodo } from '@/app/api/todos/route'
import { PUT as updateTodo, DELETE as deleteTodo } from '@/app/api/todos/[id]/route'
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

describe('Todos API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete CRUD workflow', () => {
    it('should handle complete todo lifecycle', async () => {
      // 1. Create a new todo
      mockDynamodb.send.mockResolvedValueOnce({}) // Create todo

      const createRequest = new NextRequest('http://localhost:3000/api/todos', {
        method: 'POST',
        body: JSON.stringify({
          task: 'Integration test todo',
          categoryId: 'personal',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const createResponse = await createTodo(createRequest)
      const createdTodo = await createResponse.json()

      expect(createResponse.status).toBe(200)
      expect(createdTodo.task).toBe('Integration test todo')
      expect(createdTodo.completed).toBe(false)

      // 2. Fetch todos (should include the created one)
      mockDynamodb.send.mockResolvedValueOnce({
        Items: [createdTodo],
      })

      const getRequest = new NextRequest('http://localhost:3000/api/todos')
      const getResponse = await getTodos(getRequest)
      const todosData = await getResponse.json()

      expect(getResponse.status).toBe(200)
      expect(todosData.items).toHaveLength(1)
      expect(todosData.items[0].task).toBe('Integration test todo')

      // 3. Update the todo
      const updatedTodo = { ...createdTodo, completed: true }
      mockDynamodb.send.mockResolvedValueOnce({
        Attributes: updatedTodo,
      })

      const updateRequest = new NextRequest(`http://localhost:3000/api/todos/${createdTodo.todoId}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: true }),
        headers: { 'Content-Type': 'application/json' },
      })

      const updateResponse = await updateTodo(updateRequest, { params: { id: createdTodo.todoId } })
      const updatedTodoData = await updateResponse.json()

      expect(updateResponse.status).toBe(200)
      expect(updatedTodoData.completed).toBe(true)

      // 4. Delete the todo
      mockDynamodb.send.mockResolvedValueOnce({})

      const deleteRequest = new NextRequest(`http://localhost:3000/api/todos/${createdTodo.todoId}`, {
        method: 'DELETE',
      })

      const deleteResponse = await deleteTodo(deleteRequest, { params: { id: createdTodo.todoId } })
      const deleteData = await deleteResponse.json()

      expect(deleteResponse.status).toBe(200)
      expect(deleteData.success).toBe(true)
    })
  })

  describe('Search and filtering integration', () => {
    it('should handle complex search and filter scenarios', async () => {
      const mockTodos = [
        {
          userId: 'test-user',
          todoId: '1',
          task: 'Buy groceries for dinner',
          completed: false,
          categoryId: 'personal',
          created: '2024-01-01T00:00:00.000Z',
        },
        {
          userId: 'test-user',
          todoId: '2',
          task: 'Finish project report',
          completed: true,
          categoryId: 'work',
          created: '2024-01-02T00:00:00.000Z',
        },
        {
          userId: 'test-user',
          todoId: '3',
          task: 'Buy birthday gift',
          completed: false,
          categoryId: 'personal',
          created: '2024-01-03T00:00:00.000Z',
        },
      ]

      mockDynamodb.send.mockResolvedValue({ Items: mockTodos })

      // Test search functionality
      const searchRequest = new NextRequest('http://localhost:3000/api/todos?search=buy')
      const searchResponse = await getTodos(searchRequest)
      const searchData = await searchResponse.json()

      expect(searchResponse.status).toBe(200)
      expect(searchData.items).toHaveLength(2)
      expect(searchData.items.every((todo: any) => 
        todo.task.toLowerCase().includes('buy')
      )).toBe(true)

      // Test category filtering
      const filterRequest = new NextRequest('http://localhost:3000/api/todos?categoryId=work')
      const filterResponse = await getTodos(filterRequest)
      const filterData = await filterResponse.json()

      expect(filterResponse.status).toBe(200)
      expect(filterData.items).toHaveLength(1)
      expect(filterData.items[0].categoryId).toBe('work')

      // Test combined search and filter
      const combinedRequest = new NextRequest('http://localhost:3000/api/todos?search=buy&categoryId=personal')
      const combinedResponse = await getTodos(combinedRequest)
      const combinedData = await combinedResponse.json()

      expect(combinedResponse.status).toBe(200)
      expect(combinedData.items).toHaveLength(2)
      expect(combinedData.items.every((todo: any) => 
        todo.task.toLowerCase().includes('buy') && todo.categoryId === 'personal'
      )).toBe(true)
    })
  })

  describe('Pagination integration', () => {
    it('should handle pagination correctly', async () => {
      // Create 25 mock todos for pagination testing
      const mockTodos = Array.from({ length: 25 }, (_, i) => ({
        userId: 'test-user',
        todoId: (i + 1).toString(),
        task: `Todo ${i + 1}`,
        completed: i % 2 === 0,
        categoryId: 'personal',
        created: new Date(2024, 0, i + 1).toISOString(),
      }))

      mockDynamodb.send.mockResolvedValue({ Items: mockTodos })

      // Test first page
      const page1Request = new NextRequest('http://localhost:3000/api/todos?page=1&limit=10')
      const page1Response = await getTodos(page1Request)
      const page1Data = await page1Response.json()

      expect(page1Response.status).toBe(200)
      expect(page1Data.items).toHaveLength(10)
      expect(page1Data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      })

      // Test second page
      const page2Request = new NextRequest('http://localhost:3000/api/todos?page=2&limit=10')
      const page2Response = await getTodos(page2Request)
      const page2Data = await page2Response.json()

      expect(page2Response.status).toBe(200)
      expect(page2Data.items).toHaveLength(10)
      expect(page2Data.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      })

      // Test last page
      const page3Request = new NextRequest('http://localhost:3000/api/todos?page=3&limit=10')
      const page3Response = await getTodos(page3Request)
      const page3Data = await page3Response.json()

      expect(page3Response.status).toBe(200)
      expect(page3Data.items).toHaveLength(5)
      expect(page3Data.pagination).toEqual({
        page: 3,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: false,
        hasPrev: true,
      })
    })
  })

  describe('Error handling integration', () => {
    it('should handle various error scenarios gracefully', async () => {
      // Test database connection error
      mockDynamodb.send.mockRejectedValueOnce(new Error('Connection timeout'))

      const request = new NextRequest('http://localhost:3000/api/todos')
      const response = await getTodos(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch todos')

      // Test invalid JSON in POST request
      const invalidRequest = new NextRequest('http://localhost:3000/api/todos', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      })

      const invalidResponse = await createTodo(invalidRequest)
      expect(invalidResponse.status).toBe(500)
    })
  })
})