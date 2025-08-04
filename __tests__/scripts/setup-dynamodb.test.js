/**
 * Tests for the DynamoDB setup script
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb')

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({
    send: jest.fn(),
  })),
  CreateTableCommand: jest.fn(),
  DescribeTableCommand: jest.fn(),
}))

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
}

describe('DynamoDB Setup Script', () => {
  let mockClient
  let setupModule

  beforeEach(() => {
    jest.clearAllMocks()
    mockClient = {
      send: jest.fn(),
    }
    DynamoDBClient.mockReturnValue(mockClient)
    
    // Clear module cache to get fresh imports
    jest.resetModules()
    
    // Set up environment variables
    process.env.AWS_REGION = 'us-east-1'
    process.env.AWS_ACCESS_KEY_ID = 'test-key'
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret'
  })

  afterEach(() => {
    consoleSpy.log.mockClear()
    consoleSpy.error.mockClear()
  })

  afterAll(() => {
    consoleSpy.log.mockRestore()
    consoleSpy.error.mockRestore()
  })

  it('should create DynamoDB client with correct configuration', () => {
    require('../../scripts/setup-dynamodb.js')

    expect(DynamoDBClient).toHaveBeenCalledWith({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
      },
    })
  })

  it('should create tables when they do not exist', async () => {
    // Mock table not existing (DescribeTable throws ResourceNotFoundException)
    const notFoundError = new Error('Table not found')
    notFoundError.name = 'ResourceNotFoundException'
    mockClient.send
      .mockRejectedValueOnce(notFoundError) // todos table describe
      .mockResolvedValueOnce({}) // todos table create
      .mockRejectedValueOnce(notFoundError) // categories table describe
      .mockResolvedValueOnce({}) // categories table create

    // Import and run the setup
    const setupDynamodb = require('../../scripts/setup-dynamodb.js')

    // Wait for the setup to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockClient.send).toHaveBeenCalledTimes(4)
    expect(CreateTableCommand).toHaveBeenCalledWith({
      TableName: 'todos',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'todoId', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'todoId', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    })
    expect(CreateTableCommand).toHaveBeenCalledWith({
      TableName: 'categories',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'categoryId', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'categoryId', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    })
    expect(consoleSpy.log).toHaveBeenCalledWith('Table todos created successfully')
    expect(consoleSpy.log).toHaveBeenCalledWith('Table categories created successfully')
  })

  it('should skip creation when tables already exist', async () => {
    // Mock tables already existing
    mockClient.send
      .mockResolvedValueOnce({ Table: { TableName: 'todos' } }) // todos table exists
      .mockResolvedValueOnce({ Table: { TableName: 'categories' } }) // categories table exists

    // Import and run the setup
    require('../../scripts/setup-dynamodb.js')

    // Wait for the setup to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockClient.send).toHaveBeenCalledTimes(2)
    expect(CreateTableCommand).not.toHaveBeenCalled()
    expect(consoleSpy.log).toHaveBeenCalledWith('Table todos already exists')
    expect(consoleSpy.log).toHaveBeenCalledWith('Table categories already exists')
  })

  it('should handle errors during table creation', async () => {
    const createError = new Error('Access denied')
    
    // Mock table not existing, but creation fails
    const notFoundError = new Error('Table not found')
    notFoundError.name = 'ResourceNotFoundException'
    mockClient.send
      .mockRejectedValueOnce(notFoundError) // todos table describe
      .mockRejectedValueOnce(createError) // todos table create fails

    // Import and run the setup
    require('../../scripts/setup-dynamodb.js')

    // Wait for the setup to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(consoleSpy.error).toHaveBeenCalledWith('Error creating table todos:', createError)
  })

  it('should handle unexpected errors during table description', async () => {
    const unexpectedError = new Error('Network error')
    
    mockClient.send.mockRejectedValueOnce(unexpectedError)

    // Import and run the setup
    require('../../scripts/setup-dynamodb.js')

    // Wait for the setup to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(consoleSpy.error).toHaveBeenCalledWith('Error creating table todos:', unexpectedError)
  })

  it('should use default AWS region when not specified', () => {
    delete process.env.AWS_REGION

    require('../../scripts/setup-dynamodb.js')

    expect(DynamoDBClient).toHaveBeenCalledWith({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
      },
    })
  })
})