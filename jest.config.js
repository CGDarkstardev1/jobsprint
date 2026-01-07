/**
 * Jest Configuration for Jobsprint
 *
 * Target: 90%+ code coverage
 */

export default {
  // Test environment
  testEnvironment: 'node',

  // Root directory for tests
  roots: ['<rootDir>/tests'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/**/index.js',
    '!src/frontend/vendor/**',
  ],

  // Coverage thresholds (90%+ target)
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },

  // Coverage reporters
  coverageReporters: [
    'html',
    'lcov',
    'text',
    'text-summary',
    'json'
  ],

  // Module paths
  moduleDirectories: ['node_modules', 'src'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/setup.js'],

  // Module name mapper for absolute imports
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/frontend/js/core/$1',
    '^@ai/(.*)$': '<rootDir>/src/frontend/js/ai/$1',
    '^@integrations/(.*)$': '<rootDir>/src/frontend/js/integrations/$1',
    '^@ui/(.*)$': '<rootDir>/src/frontend/js/ui/$1',
    '^@backend/(.*)$': '<rootDir>/src/backend/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@helpers/(.*)$': '<rootDir>/tests/helpers/$1',
    '^@fixtures/(.*)$': '<rootDir>/tests/fixtures/$1',
  },

  // Transform configuration
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },

  // Global setup/teardown
  globalSetup: '<rootDir>/tests/helpers/global-setup.js',
  globalTeardown: '<rootDir>/tests/helpers/global-teardown.js',

  // Test timeout (30 seconds for integration tests)
  testTimeout: 30000,

  // Parallel execution
  maxWorkers: '50%',

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Coverage collection
  collectCoverage: false,

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/performance/'
  ],

  // Coverage path ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/e2e/',
    '/performance/'
  ]
};
