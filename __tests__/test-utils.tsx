/**
 * Test utilities and custom render functions
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Mock providers that might be needed
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Common test data
export const mockTodo = {
  userId: 'test-user',
  todoId: '1',
  task: 'Test todo',
  completed: false,
  categoryId: 'personal',
  created: '2024-01-01T00:00:00.000Z',
}

export const mockCategory = {
  userId: 'test-user',
  categoryId: 'personal',
  name: 'Personal',
  color: 'bg-blue-500',
  created: '2024-01-01T00:00:00.000Z',
}

// Mock API responses
export const mockTodosResponse = {
  items: [mockTodo],
  pagination: {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },
}

export const mockCategoriesResponse = [mockCategory]

// Helper function to create mock fetch responses
export const createMockResponse = (data: any, ok = true) => ({
  ok,
  json: () => Promise.resolve(data),
  status: ok ? 200 : 500,
})

// Helper to setup fetch mocks
export const setupFetchMocks = () => {
  const mockFetch = jest.fn()
  global.fetch = mockFetch
  
  mockFetch.mockImplementation((url) => {
    if (url.toString().includes('/api/todos')) {
      return Promise.resolve(createMockResponse(mockTodosResponse))
    }
    if (url.toString().includes('/api/categories')) {
      return Promise.resolve(createMockResponse(mockCategoriesResponse))
    }
    return Promise.reject(new Error('Unknown URL'))
  })
  
  return mockFetch
}