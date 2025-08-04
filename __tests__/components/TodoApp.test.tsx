import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TodoApp from '@/app/page'

// Mock fetch globally
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
}))

describe('TodoApp Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock responses
    mockFetch.mockImplementation((url) => {
      if (url.toString().includes('/api/todos')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            items: [
              {
                todoId: '1',
                task: 'Test todo 1',
                completed: false,
                categoryId: 'personal',
                created: '2024-01-01T00:00:00.000Z',
              },
              {
                todoId: '2',
                task: 'Test todo 2',
                completed: true,
                categoryId: 'work',
                created: '2024-01-02T00:00:00.000Z',
              },
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 2,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
          }),
        } as Response)
      }
      
      if (url.toString().includes('/api/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { categoryId: 'personal', name: 'Personal', color: 'bg-blue-500' },
            { categoryId: 'work', name: 'Work', color: 'bg-green-500' },
          ]),
        } as Response)
      }
      
      return Promise.reject(new Error('Unknown URL'))
    })
  })

  it('should render the todo app with initial data', async () => {
    render(<TodoApp />)
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
    
    // Check if todos are rendered
    expect(screen.getByText('Test todo 1')).toBeInTheDocument()
    expect(screen.getByText('Test todo 2')).toBeInTheDocument()
    
    // Check if categories are rendered in sidebar
    expect(screen.getByText('Personal')).toBeInTheDocument()
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('should add a new todo', async () => {
    const user = userEvent.setup()
    
    // Mock successful todo creation
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          todoId: '3',
          task: 'New test todo',
          completed: false,
          categoryId: 'personal',
          created: '2024-01-03T00:00:00.000Z',
        }),
      } as Response)
    )
    
    render(<TodoApp />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
    
    // Find and fill the input
    const input = screen.getByPlaceholderText('Add a new task...')
    await user.type(input, 'New test todo')
    
    // Click the add button
    const addButton = screen.getByRole('button', { name: /add/i })
    await user.click(addButton)
    
    // Verify the API was called
    expect(mockFetch).toHaveBeenCalledWith('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: 'New test todo',
        categoryId: 'all',
      }),
    })
  })

  it('should toggle todo completion', async () => {
    const user = userEvent.setup()
    
    // Mock successful todo update
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          todoId: '1',
          task: 'Test todo 1',
          completed: true,
          categoryId: 'personal',
          created: '2024-01-01T00:00:00.000Z',
        }),
      } as Response)
    )
    
    render(<TodoApp />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
    
    // Find the first todo's completion button
    const todoItems = screen.getAllByRole('button')
    const completionButton = todoItems.find(button => 
      button.className.includes('rounded-full')
    )
    
    if (completionButton) {
      await user.click(completionButton)
      
      // Verify the API was called
      expect(mockFetch).toHaveBeenCalledWith('/api/todos/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: true,
        }),
      })
    }
  })

  it('should delete a todo', async () => {
    const user = userEvent.setup()
    
    // Mock successful todo deletion
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response)
    )
    
    render(<TodoApp />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
    
    // Find and click the delete button for the first todo
    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg')?.getAttribute('class')?.includes('lucide-trash-2')
    )
    
    if (deleteButton) {
      await user.click(deleteButton)
      
      // Verify the API was called
      expect(mockFetch).toHaveBeenCalledWith('/api/todos/1', {
        method: 'DELETE',
      })
    }
  })

  it('should filter todos by search query', async () => {
    const user = userEvent.setup()
    
    render(<TodoApp />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
    
    // Find the search input
    const searchInput = screen.getByPlaceholderText('Search tasks...')
    await user.type(searchInput, 'test todo 1')
    
    // Wait for the search to trigger
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test%20todo%201'),
        expect.any(Object)
      )
    })
  })

  it('should handle category selection', async () => {
    const user = userEvent.setup()
    
    render(<TodoApp />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
    
    // Click on the Work category
    const workCategory = screen.getByText('Work')
    await user.click(workCategory)
    
    // Verify the API was called with category filter
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('categoryId=work'),
        expect.any(Object)
      )
    })
  })

  it('should handle pagination', async () => {
    const user = userEvent.setup()
    
    // Mock response with pagination
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          items: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 25,
            totalPages: 3,
            hasNext: true,
            hasPrev: false,
          },
        }),
      } as Response)
    )
    
    render(<TodoApp />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
    
    // Check if pagination controls are rendered
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
    
    // Click next page
    const nextButton = screen.getByText('Next')
    await user.click(nextButton)
    
    // Verify the API was called with page 2
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      )
    })
  })

  it('should handle loading state', () => {
    // Mock fetch to never resolve to keep loading state
    mockFetch.mockImplementation(() => new Promise(() => {}))
    
    render(<TodoApp />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should handle empty state', async () => {
    // Mock empty response
    mockFetch.mockImplementation((url) => {
      if (url.toString().includes('/api/todos')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            items: [],
            pagination: {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          }),
        } as Response)
      }
      
      if (url.toString().includes('/api/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
      }
      
      return Promise.reject(new Error('Unknown URL'))
    })
    
    render(<TodoApp />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
    
    expect(screen.getByText('No tasks yet. Add one above!')).toBeInTheDocument()
  })
})