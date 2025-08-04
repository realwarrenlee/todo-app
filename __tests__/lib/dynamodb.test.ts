import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { dynamodb, TABLES } from '@/lib/dynamodb'

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb')
jest.mock('@aws-sdk/lib-dynamodb')

const mockDynamoDBClient = DynamoDBClient as jest.MockedClass<typeof DynamoDBClient>
const mockDynamoDBDocumentClient = DynamoDBDocumentClient as jest.Mocked<typeof DynamoDBDocumentClient>

describe('DynamoDB Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create DynamoDB client with correct configuration', () => {
    expect(mockDynamoDBClient).toHaveBeenCalledWith({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
      },
    })
  })

  it('should create document client from DynamoDB client', () => {
    expect(mockDynamoDBDocumentClient.from).toHaveBeenCalled()
  })

  it('should export correct table names', () => {
    expect(TABLES.TODOS).toBe('todos')
    expect(TABLES.CATEGORIES).toBe('categories')
  })

  it('should use environment variables for table names when available', () => {
    // Test with environment variables
    const originalTodosTable = process.env.DYNAMODB_TODOS_TABLE
    const originalCategoriesTable = process.env.DYNAMODB_CATEGORIES_TABLE

    process.env.DYNAMODB_TODOS_TABLE = 'custom-todos'
    process.env.DYNAMODB_CATEGORIES_TABLE = 'custom-categories'

    // Re-import to get updated values
    jest.resetModules()
    const { TABLES: updatedTables } = require('@/lib/dynamodb')

    expect(updatedTables.TODOS).toBe('custom-todos')
    expect(updatedTables.CATEGORIES).toBe('custom-categories')

    // Restore original values
    process.env.DYNAMODB_TODOS_TABLE = originalTodosTable
    process.env.DYNAMODB_CATEGORIES_TABLE = originalCategoriesTable
  })

  it('should use default region when AWS_REGION is not set', () => {
    const originalRegion = process.env.AWS_REGION
    delete process.env.AWS_REGION

    jest.resetModules()
    require('@/lib/dynamodb')

    expect(mockDynamoDBClient).toHaveBeenCalledWith(
      expect.objectContaining({
        region: 'us-east-1',
      })
    )

    // Restore original value
    process.env.AWS_REGION = originalRegion
  })
})