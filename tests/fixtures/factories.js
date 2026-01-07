/**
 * Test Data Factories
 *
 * Generate consistent test data
 */

import { faker } from '@faker-js/faker';

/**
 * Generate a valid user object
 */
export function createUser(overrides = {}) {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    username: faker.internet.userName(),
    password: faker.internet.password(12, true),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

/**
 * Generate a workflow object
 */
export function createWorkflow(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    status: faker.helpers.arrayElement(['active', 'inactive', 'draft']),
    userId: faker.string.uuid(),
    nodes: createNodes(faker.number.int({ min: 1, max: 5 })),
    triggers: createTriggers(faker.number.int({ min: 1, max: 3 })),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

/**
 * Generate workflow nodes
 */
export function createNodes(count = 1) {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    type: faker.helpers.arrayElement(['trigger', 'action', 'condition']),
    name: faker.lorem.word(),
    config: createNodeConfig(),
    position: {
      x: faker.number.int({ min: 0, max: 1000 }),
      y: faker.number.int({ min: 0, max: 1000 }),
    },
  }));
}

/**
 * Generate node configuration
 */
export function createNodeConfig() {
  return {
    service: faker.helpers.arrayElement(['zapier', 'n8n', 'puter']),
    action: faker.lorem.word(),
    parameters: {
      [faker.lorem.word()]: faker.lorem.word(),
    },
  };
}

/**
 * Generate workflow triggers
 */
export function createTriggers(count = 1) {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    type: faker.helpers.arrayElement(['webhook', 'schedule', 'event']),
    config: createTriggerConfig(),
  }));
}

/**
 * Generate trigger configuration
 */
export function createTriggerConfig() {
  return {
    schedule: faker.helpers.arrayElement(['0 0 * * *', '0 */6 * * *', '@hourly']),
    webhookUrl: faker.internet.url(),
    eventType: faker.lorem.word(),
  };
}

/**
 * Generate an API response object
 */
export function createApiResponse(overrides = {}) {
  return {
    success: faker.datatype.boolean(),
    data: faker.lorem.paragraph(),
    error: null,
    timestamp: faker.date.recent(),
    ...overrides,
  };
}

/**
 * Generate AI chat message
 */
export function createChatMessage(overrides = {}) {
  return {
    id: faker.string.uuid(),
    role: faker.helpers.arrayElement(['user', 'assistant', 'system']),
    content: faker.lorem.paragraph(),
    timestamp: faker.date.recent(),
    ...overrides,
  };
}

/**
 * Generate integration connection
 */
export function createIntegration(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    type: faker.helpers.arrayElement(['zapier', 'n8n', 'custom']),
    status: faker.helpers.arrayElement(['connected', 'disconnected', 'error']),
    config: createIntegrationConfig(),
    lastSync: faker.date.recent(),
    ...overrides,
  };
}

/**
 * Generate integration configuration
 */
export function createIntegrationConfig() {
  return {
    apiKey: faker.string.alphanumeric(32),
    webhookUrl: faker.internet.url(),
    settings: {
      [faker.lorem.word()]: faker.lorem.word(),
    },
  };
}

/**
 * Generate test file data
 */
export function createFileData(overrides = {}) {
  return {
    name: faker.system.fileName(),
    size: faker.number.int({ min: 100, max: 10000000 }),
    type: faker.system.mimeType(),
    content: faker.lorem.paragraphs(3),
    createdAt: faker.date.past(),
    ...overrides,
  };
}

/**
 * Generate database record
 */
export function createDbRecord(tableName, overrides = {}) {
  const record = {
    id: faker.string.uuid(),
    created_at: faker.date.past(),
    updated_at: faker.date.recent(),
    ...overrides,
  };

  // Add table-specific fields
  switch (tableName) {
    case 'users':
      record.email = faker.internet.email();
      record.username = faker.internet.userName();
      break;
    case 'workflows':
      record.name = faker.lorem.words(3);
      record.status = faker.helpers.arrayElement(['active', 'inactive']);
      break;
    default:
      break;
  }

  return record;
}

/**
 * Generate pagination metadata
 */
export function createPaginationMeta(overrides = {}) {
  return {
    page: faker.number.int({ min: 1, max: 10 }),
    limit: faker.helpers.arrayElement([10, 20, 50, 100]),
    total: faker.number.int({ min: 0, max: 1000 }),
    totalPages: faker.number.int({ min: 1, max: 50 }),
    ...overrides,
  };
}

/**
 * Generate error response
 */
export function createErrorResponse(overrides = {}) {
  return {
    success: false,
    error: {
      code: faker.string.alphanumeric(10),
      message: faker.lorem.sentence(),
      details: faker.lorem.paragraph(),
    },
    timestamp: faker.date.recent(),
    ...overrides,
  };
}
