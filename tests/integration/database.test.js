/**
 * Database Integration Tests
 *
 * Test database operations with PostgreSQL
 */

import { Pool } from 'pg';

describe('Database Integration', () => {
  let pool;

  beforeAll(async () => {
    // Setup test database connection
    pool = new Pool({
      host: process.env.TEST_DB_HOST || 'localhost',
      port: process.env.TEST_DB_PORT || 5432,
      database: process.env.TEST_DB_NAME || 'jobsprint_test',
      user: process.env.TEST_DB_USER || 'test',
      password: process.env.TEST_DB_PASSWORD || 'test',
    });

    // Run migrations
    await setupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await pool.end();
  });

  describe('User Operations', () => {
    let userId;

    it('should create user in database', async () => {
      const result = await pool.query(
        'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING *',
        ['test@example.com', 'testuser', 'hashedpassword']
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('id');
      expect(result.rows[0].email).toBe('test@example.com');

      userId = result.rows[0].id;
    });

    it('should retrieve user by ID', async () => {
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(userId);
    });

    it('should retrieve user by email', async () => {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].email).toBe('test@example.com');
    });

    it('should update user', async () => {
      await pool.query(
        'UPDATE users SET username = $1 WHERE id = $2',
        ['updateduser', userId]
      );

      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      expect(result.rows[0].username).toBe('updateduser');
    });

    it('should delete user', async () => {
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);

      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      expect(result.rows).toHaveLength(0);
    });

    it('should enforce unique email constraint', async () => {
      await pool.query(
        'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3)',
        ['unique@example.com', 'user1', 'hash1']
      );

      await expect(
        pool.query(
          'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3)',
          ['unique@example.com', 'user2', 'hash2']
        )
      ).rejects.toThrow('duplicate key');
    });
  });

  describe('Workflow Operations', () => {
    let workflowId;
    let userId;

    beforeEach(async () => {
      const userResult = await pool.query(
        'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING *',
        ['workflow@example.com', 'workflowuser', 'hash']
      );
      userId = userResult.rows[0].id;
    });

    it('should create workflow', async () => {
      const result = await pool.query(
        `INSERT INTO workflows (user_id, name, description, status, config)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, 'Test Workflow', 'A test workflow', 'active', '{}']
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('id');
      expect(result.rows[0].name).toBe('Test Workflow');

      workflowId = result.rows[0].id;
    });

    it('should retrieve workflows by user', async () => {
      await pool.query(
        'INSERT INTO workflows (user_id, name, status, config) VALUES ($1, $2, $3, $4)',
        [userId, 'Workflow 1', 'active', '{}']
      );
      await pool.query(
        'INSERT INTO workflows (user_id, name, status, config) VALUES ($1, $2, $3, $4)',
        [userId, 'Workflow 2', 'active', '{}']
      );

      const result = await pool.query(
        'SELECT * FROM workflows WHERE user_id = $1',
        [userId]
      );

      expect(result.rows.length).toBeGreaterThanOrEqual(2);
    });

    it('should update workflow status', async () => {
      const insertResult = await pool.query(
        'INSERT INTO workflows (user_id, name, status, config) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, 'Status Test', 'active', '{}']
      );

      await pool.query(
        'UPDATE workflows SET status = $1 WHERE id = $2',
        ['inactive', insertResult.rows[0].id]
      );

      const result = await pool.query(
        'SELECT * FROM workflows WHERE id = $1',
        [insertResult.rows[0].id]
      );

      expect(result.rows[0].status).toBe('inactive');
    });

    it('should store workflow execution history', async () => {
      const workflowResult = await pool.query(
        'INSERT INTO workflows (user_id, name, status, config) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, 'Execution Test', 'active', '{}']
      );

      const executionResult = await pool.query(
        `INSERT INTO workflow_executions (workflow_id, status, input_data, output_data)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [workflowResult.rows[0].id, 'success', '{}', '{}']
      );

      expect(executionResult.rows).toHaveLength(1);
      expect(executionResult.rows[0].status).toBe('success');
    });
  });

  describe('Integration Connections', () => {
    let userId;
    let connectionId;

    beforeEach(async () => {
      const userResult = await pool.query(
        'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING *',
        ['integration@example.com', 'integrationuser', 'hash']
      );
      userId = userResult.rows[0].id;
    });

    it('should store integration connection', async () => {
      const result = await pool.query(
        `INSERT INTO integration_connections (user_id, type, name, config, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, 'zapier', 'My Zapier', '{}', 'connected']
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].type).toBe('zapier');
      expect(result.rows[0].status).toBe('connected');

      connectionId = result.rows[0].id;
    });

    it('should retrieve user integrations', async () => {
      await pool.query(
        'INSERT INTO integration_connections (user_id, type, name, config, status) VALUES ($1, $2, $3, $4, $5)',
        [userId, 'zapier', 'Zapier 1', '{}', 'connected']
      );
      await pool.query(
        'INSERT INTO integration_connections (user_id, type, name, config, status) VALUES ($1, $2, $3, $4, $5)',
        [userId, 'n8n', 'n8n Instance', '{}', 'connected']
      );

      const result = await pool.query(
        'SELECT * FROM integration_connections WHERE user_id = $1',
        [userId]
      );

      expect(result.rows.length).toBeGreaterThanOrEqual(2);
    });

    it('should update connection status', async () => {
      const insertResult = await pool.query(
        'INSERT INTO integration_connections (user_id, type, name, config, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, 'zapier', 'Test Connection', '{}', 'connected']
      );

      await pool.query(
        'UPDATE integration_connections SET status = $1 WHERE id = $2',
        ['disconnected', insertResult.rows[0].id]
      );

      const result = await pool.query(
        'SELECT * FROM integration_connections WHERE id = $1',
        [insertResult.rows[0].id]
      );

      expect(result.rows[0].status).toBe('disconnected');
    });
  });

  describe('Transactions', () => {
    it('should rollback failed transaction', async () => {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        await client.query(
          'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3)',
          ['transaction@example.com', 'transuser', 'hash']
        );

        // Force error
        await client.query('SELECT * FROM non_existent_table');

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');

        const result = await client.query(
          'SELECT * FROM users WHERE email = $1',
          ['transaction@example.com']
        );

        expect(result.rows).toHaveLength(0);
      } finally {
        client.release();
      }
    });

    it('should commit successful transaction', async () => {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        await client.query(
          'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3)',
          ['commit@example.com', 'commituser', 'hash']
        );

        await client.query('COMMIT');

        const result = await client.query(
          'SELECT * FROM users WHERE email = $1',
          ['commit@example.com']
        );

        expect(result.rows).toHaveLength(1);
      } finally {
        client.release();
      }
    });
  });

  describe('Index Performance', () => {
    it('should use index on email lookups', async () => {
      const query = 'EXPLAIN ANALYZE SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, ['test@example.com']);

      const plan = result.rows.map(r => r['QUERY PLAN']).join(' ');
      expect(plan).toContain('Index');
    });

    it('should use index on user_id for workflows', async () => {
      const query = 'EXPLAIN ANALYZE SELECT * FROM workflows WHERE user_id = $1';
      const result = await pool.query(query, ['test-user-id']);

      const plan = result.rows.map(r => r['QUERY PLAN']).join(' ');
      expect(plan).toContain('Index');
    });
  });
});

async function setupDatabase() {
  // Create test tables
  await setupTables();
  await createIndexes();
}

async function cleanupDatabase() {
  // Drop test tables
  await pool.query('DROP TABLE IF EXISTS workflow_executions CASCADE');
  await pool.query('DROP TABLE IF EXISTS workflows CASCADE');
  await pool.query('DROP TABLE IF EXISTS integration_connections CASCADE');
  await pool.query('DROP TABLE IF EXISTS users CASCADE');
}

async function setupTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS workflows (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'active',
      config JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS workflow_executions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
      status VARCHAR(50) NOT NULL,
      input_data JSONB DEFAULT '{}',
      output_data JSONB DEFAULT '{}',
      error_message TEXT,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS integration_connections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      config JSONB DEFAULT '{}',
      status VARCHAR(50) DEFAULT 'disconnected',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function createIndexes() {
  await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON workflow_executions(workflow_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integration_connections(user_id)');
}
