/**
 * Jest Configuration for Jobsprint
 */

module.exports = {
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
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/**/index.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },

    // Module paths
    moduleDirectories: ['node_modules', 'src'],

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

    // Transform configuration
    transform: {
        '^.+\\.js$': 'babel-jest'
    },

    // Ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/'
    ],

    // Module name mapper for imports
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@core/(.*)$': '<rootDir>/src/frontend/js/core/$1',
        '^@ai/(.*)$': '<rootDir>/src/frontend/js/ai/$1'
    },

    // Verbose output
    verbose: true,

    // Maximum number of workers
    maxWorkers: '50%'
};
