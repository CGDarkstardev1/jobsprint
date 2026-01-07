# Developer Documentation

Welcome to the Jobsprint developer documentation! This section covers everything you need to know to contribute to, develop, and extend Jobsprint.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style Guide](#code-style-guide)
- [Testing Guide](#testing-guide)
- [Contributing Guide](#contributing-guide)
- [Architecture Overview](#architecture-overview)
- [API Development](#api-development)
- [Custom Node Development](#custom-node-development)

## Getting Started

### Prerequisites

Before you start developing, ensure you have:

- **Node.js**: v18.x or higher
- **Docker**: Latest stable version
- **Docker Compose**: v2.x or higher
- **Git**: Latest version
- **Code Editor**: VS Code (recommended) with extensions
- **Linux**: Ubuntu 20.04+ or Debian 11+ (for development)

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "humao.rest-client",
    "ms-azuretools.vscode-docker",
    "eamodio.gitlens",
    "usernamehw.errorlens"
  ]
}
```

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/jobsprint.git
cd jobsprint

# Add upstream remote
git remote add upstream https://github.com/jobsprint/jobsprint.git
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install development dependencies
npm install --save-dev

# Install global tools (optional)
npm install -g eslint prettier typescript
```

### 3. Start Development Stack

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Verify services are running
docker-compose ps
```

### 4. Setup Development Database

```bash
# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Create development user
npm run user:create --email=dev@jobsprint.local --password=dev123
```

### 5. Start Development Server

```bash
# Backend (with hot reload)
npm run dev:backend

# Frontend (with hot reload)
npm run dev:frontend

# Or start both together
npm run dev
```

### 6. Run Tests

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

## Development Workflow

### 1. Create Feature Branch

```bash
# Update from upstream
git fetch upstream
git checkout master
git merge upstream/master

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Changes

```bash
# Make your changes
# Follow code style guidelines
# Write tests for new features
# Update documentation

# Check code style
npm run lint

# Run tests
npm test
```

### 3. Commit Changes

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat: add user authentication"

# Sign commit (optional)
git commit -S -m "feat: add user authentication"
```

**Commit Message Format**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Example**:
```
feat(auth): add JWT refresh token support

Implement JWT refresh token mechanism for improved security.
Tokens are refreshed automatically before expiration.

Closes #123
```

### 4. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Fill out PR template
# Link related issues
```

## Code Style Guide

### JavaScript/TypeScript

**Naming Conventions**:

```javascript
// Variables: camelCase
const userCount = 10;
const isActive = true;

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.jobsprint.io';

// Functions: camelCase
function getUserById(userId) {
  // ...
}

// Classes: PascalCase
class WorkflowExecutor {
  // ...
}

// Private properties: underscore prefix
class UserService {
  _cache = null;

  _validateUser(user) {
    // ...
  }
}
```

**Code Organization**:

```javascript
// 1. Imports
import express from 'express';
import { WorkflowService } from '../services';

// 2. Constants
const ROUTER = express.Router();
const DEFAULT_LIMIT = 20;

// 3. Middleware
function validateRequest(req, res, next) {
  // ...
}

// 4. Route handlers
async function getWorkflows(req, res) {
  // ...
}

// 5. Routes
ROUTER.get('/', validateRequest, getWorkflows);

// 6. Exports
export default ROUTER;
```

**Error Handling**:

```javascript
// Always handle errors
async function executeWorkflow(workflowId) {
  try {
    const workflow = await Workflow.findById(workflowId);

    if (!workflow) {
      throw new NotFoundError('Workflow not found');
    }

    return await workflow.execute();
  } catch (error) {
    logger.error('Workflow execution failed', {
      workflowId,
      error: error.message
    });

    throw new WorkflowExecutionError(
      'Failed to execute workflow',
      { cause: error }
    );
  }
}
```

### File Structure

```
src/
├── backend/
│   ├── api/
│   │   ├── routes/          # API route definitions
│   │   ├── middleware/      # Express middleware
│   │   └── controllers/     # Request handlers
│   ├── services/            # Business logic
│   ├── models/              # Data models
│   ├── utils/               # Utility functions
│   └── config/              # Configuration
├── frontend/
│   ├── js/
│   │   ├── core/            # Core functionality
│   │   ├── components/      # UI components
│   │   └── utils/           # Utilities
│   └── css/                 # Stylesheets
└── shared/                  # Shared code
    ├── types/               # TypeScript types
    └── constants/           # Constants
```

### Code Quality Standards

**ESLint Configuration**:

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

**Prettier Configuration**:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

## Testing Guide

### Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── services/
│   │   └── workflow.service.test.js
│   └── utils/
│       └── validation.test.js
├── integration/             # Integration tests
│   ├── api/
│   │   └── workflows.test.js
│   └── database/
│       └── migrations.test.js
└── e2e/                     # End-to-end tests
    └── user-flows.test.js
```

### Writing Tests

**Unit Tests (Jest)**:

```javascript
describe('WorkflowService', () => {
  describe('executeWorkflow', () => {
    it('should execute workflow successfully', async () => {
      // Arrange
      const workflow = createMockWorkflow();
      const service = new WorkflowService();

      // Act
      const result = await service.executeWorkflow(workflow.id);

      // Assert
      expect(result.status).toBe('success');
      expect(result.executionId).toBeDefined();
    });

    it('should throw error for invalid workflow', async () => {
      await expect(
        service.executeWorkflow('invalid-id')
      ).rejects.toThrow(NotFoundError);
    });
  });
});
```

**Integration Tests (Supertest)**:

```javascript
describe('Workflow API', () => {
  let app;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/v1/workflows', () => {
    it('should create workflow', async () => {
      const response = await request(app)
        .post('/api/v1/workflows')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Workflow',
          definition: { nodes: [] }
        })
        .expect(201);

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBe('Test Workflow');
    });
  });
});
```

**E2E Tests (Playwright)**:

```javascript
test('user can create and execute workflow', async ({ page }) => {
  // Navigate to dashboard
  await page.goto('http://localhost:5678');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Create workflow
  await page.click('text=Create Workflow');
  await page.fill('input[name="name"]', 'Test Workflow');
  await page.click('button:has-text("Save")');

  // Verify workflow created
  await expect(page.locator('text=Test Workflow')).toBeVisible();
});
```

### Test Coverage

**Minimum Requirements**:
- Unit tests: 80% coverage
- Integration tests: 70% coverage
- Overall: 75% coverage

**Generate Coverage Report**:

```bash
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

## Contributing Guide

### Ways to Contribute

1. **Bug Reports**: Report bugs using GitHub issues
2. **Feature Requests**: Suggest new features
3. **Code Contributions**: Submit pull requests
4. **Documentation**: Improve documentation
5. **Tests**: Add or improve tests
6. **Code Review**: Review pull requests

### Pull Request Guidelines

**Before Submitting**:
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All tests passing
- [ ] Commit messages follow convention
- [ ] PR description filled out

**PR Template**:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] E2E tests added
- [ ] All tests passing

## Checklist
- [ ] Code follows style guide
- [ ] Self-reviewed
- [ ] Documentation updated
- [ ] No merge conflicts
- [ ] Commits squashed

## Related Issues
Fixes #123
```

### Code Review Process

1. Automated checks run (CI/CD)
2. Request review from maintainers
3. Address review feedback
4. Update PR as needed
5. Approval from 1+ maintainer
6. Merge to master

### Getting Help

- **GitHub Discussions**: Ask questions
- **Discord**: Chat with community
- **Email**: dev@jobsprint.io

## Architecture Overview

### Technology Stack

**Backend**:
- Node.js with Express
- TypeScript
- PostgreSQL (database)
- Redis (cache)
- RabbitMQ (message queue)

**Frontend**:
- Puter.js SDK
- Vanilla JavaScript
- Modern CSS

**Infrastructure**:
- Docker & Docker Compose
- Nginx (reverse proxy)
- SSL/TLS (Let's Encrypt)

### Key Components

1. **API Gateway**: Nginx reverse proxy
2. **Backend Service**: Express.js REST API
3. **Workflow Engine**: n8n with custom nodes
4. **AI Service**: Puter.js integration
5. **Database Layer**: PostgreSQL with Redis cache

### Design Patterns

**Repository Pattern**:
```javascript
class WorkflowRepository {
  async findById(id) {
    return db.query('SELECT * FROM workflows WHERE id = $1', [id]);
  }

  async create(data) {
    return db.query('INSERT INTO workflows (...) VALUES (...) RETURNING *', [values]);
  }
}
```

**Service Layer Pattern**:
```javascript
class WorkflowService {
  constructor(repository, aiService) {
    this.repository = repository;
    this.aiService = aiService;
  }

  async executeWorkflow(id) {
    const workflow = await this.repository.findById(id);
    return await this.aiService.process(workflow);
  }
}
```

**Dependency Injection**:
```javascript
// container.js
export const container = {
  workflowRepository: new WorkflowRepository(db),
  workflowService: new WorkflowService(
    container.workflowRepository,
    container.aiService
  )
};
```

## API Development

### Creating New Endpoints

1. Define route in `/src/backend/api/routes/`:

```javascript
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createResource, getResource } from '../controllers/resource.js';

const router = express.Router();

router.post('/', authenticate, createResource);
router.get('/:id', authenticate, getResource);

export default router;
```

2. Implement controller in `/src/backend/api/controllers/`:

```javascript
export async function createResource(req, res, next) {
  try {
    const data = await resourceService.create(req.body);
    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}
```

3. Add validation:

```javascript
import { body, validationResult } from 'express-validator';

export const validateCreateResource = [
  body('name').trim().isLength({ min: 1, max: 255 }),
  body('type').isIn(['type1', 'type2']),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: errors.array()
        }
      });
    }
    next();
  }
];
```

## Custom Node Development

### Creating n8n Custom Nodes

1. Create node file in `/src/backend/n8n-custom-nodes/nodes/`:

```javascript
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties
} from 'n8n-workflow';

export class MyCustomNode {
  description: INodeProperties = {
    displayName: 'My Custom Node',
    name: 'myCustomNode',
    group: ['transform'],
    version: 1,
    description: 'Node description',
    defaults: {
      name: 'My Custom Node',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Parameter',
        name: 'parameter',
        type: 'string',
        required: true,
      }
    ]
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const parameter = this.getNodeParameter('parameter', 0) as string;

    return items.map(item => {
      return {
        json: {
          ...item.json,
          result: `Processed: ${parameter}`
        }
      };
    });
  }
}
```

2. Register node:

```javascript
// nodes/index.ts
import { MyCustomNode } from './MyCustomNode';

export const nodeClasses = [
  MyCustomNode,
  // ... other nodes
];
```

3. Add documentation:

```markdown
# My Custom Node

Description of what the node does.

## Parameters

- **Parameter**: Description

## Example

```json
{
  "parameter": "value"
}
```
```

## Next Steps

- Explore [Deployment Guide](../deployment/README.md)
- Read [Architecture Documentation](../architecture/README.md)
- Review [API Reference](../api/README.md)

Happy coding!
