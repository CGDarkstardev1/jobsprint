/**
 * API Endpoints Unit Tests
 *
 * Test REST API endpoints
 */

import request from 'supertest';
import express from 'express';
import apiRouter from '@/backend/api';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

describe('API Endpoints', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('User Endpoints', () => {
    describe('POST /api/users', () => {
      it('should create new user', async () => {
        const newUser = {
          email: 'test@example.com',
          username: 'testuser',
          password: 'SecurePassword123!'
        };

        const response = await request(app)
          .post('/api/users')
          .send(newUser)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('email', newUser.email);
        expect(response.body).toHaveProperty('username', newUser.username);
        expect(response.body).not.toHaveProperty('password');
      });

      it('should validate required fields', async () => {
        const invalidUser = { email: 'test@example.com' }; // Missing username, password

        const response = await request(app)
          .post('/api/users')
          .send(invalidUser)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('required');
      });

      it('should validate email format', async () => {
        const invalidUser = {
          email: 'invalid-email',
          username: 'testuser',
          password: 'SecurePassword123!'
        };

        const response = await request(app)
          .post('/api/users')
          .send(invalidUser)
          .expect(400);

        expect(response.body.error).toContain('email');
      });

      it('should prevent duplicate emails', async () => {
        const user = {
          email: 'test@example.com',
          username: 'testuser',
          password: 'SecurePassword123!'
        };

        await request(app).post('/api/users').send(user).expect(201);

        const response = await request(app)
          .post('/api/users')
          .send(user)
          .expect(409);

        expect(response.body.error).toContain('already exists');
      });
    });

    describe('GET /api/users/:id', () => {
      it('should get user by ID', async () => {
        const createUser = await request(app)
          .post('/api/users')
          .send({
            email: 'get@example.com',
            username: 'getuser',
            password: 'Password123!'
          });

        const response = await request(app)
          .get(`/api/users/${createUser.body.id}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', createUser.body.id);
        expect(response.body).toHaveProperty('email', 'get@example.com');
      });

      it('should return 404 for non-existent user', async () => {
        const response = await request(app)
          .get('/api/users/non-existent-id')
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('PUT /api/users/:id', () => {
      it('should update user', async () => {
        const createUser = await request(app)
          .post('/api/users')
          .send({
            email: 'update@example.com',
            username: 'updateuser',
            password: 'Password123!'
          });

        const updates = { username: 'updateduser' };

        const response = await request(app)
          .put(`/api/users/${createUser.body.id}`)
          .send(updates)
          .expect(200);

        expect(response.body).toHaveProperty('username', 'updateduser');
      });

      it('should prevent updating email to existing one', async () => {
        const user1 = await request(app)
          .post('/api/users')
          .send({
            email: 'user1@example.com',
            username: 'user1',
            password: 'Password123!'
          });

        const user2 = await request(app)
          .post('/api/users')
          .send({
            email: 'user2@example.com',
            username: 'user2',
            password: 'Password123!'
          });

        const response = await request(app)
          .put(`/api/users/${user2.body.id}`)
          .send({ email: 'user1@example.com' })
          .expect(409);

        expect(response.body.error).toContain('already exists');
      });
    });

    describe('DELETE /api/users/:id', () => {
      it('should delete user', async () => {
        const createUser = await request(app)
          .post('/api/users')
          .send({
            email: 'delete@example.com',
            username: 'deleteuser',
            password: 'Password123!'
          });

        await request(app)
          .delete(`/api/users/${createUser.body.id}`)
          .expect(204);

        await request(app)
          .get(`/api/users/${createUser.body.id}`)
          .expect(404);
      });
    });
  });

  describe('Workflow Endpoints', () => {
    describe('POST /api/workflows', () => {
      it('should create workflow', async () => {
        const workflow = {
          name: 'Test Workflow',
          description: 'A test workflow',
          nodes: [
            {
              id: 'node-1',
              type: 'trigger',
              name: 'Webhook'
            }
          ]
        };

        const response = await request(app)
          .post('/api/workflows')
          .send(workflow)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name', workflow.name);
      });

      it('should validate workflow structure', async () => {
        const invalidWorkflow = {
          name: 'Invalid Workflow'
          // Missing nodes
        };

        const response = await request(app)
          .post('/api/workflows')
          .send(invalidWorkflow)
          .expect(400);

        expect(response.body.error).toContain('nodes');
      });
    });

    describe('GET /api/workflows', () => {
      it('should list workflows with pagination', async () => {
        const response = await request(app)
          .get('/api/workflows?page=1&limit=10')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('meta');
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.meta).toHaveProperty('page', 1);
        expect(response.body.meta).toHaveProperty('limit', 10);
      });

      it('should filter workflows by status', async () => {
        const response = await request(app)
          .get('/api/workflows?status=active')
          .expect(200);

        expect(response.body.data.every(w => w.status === 'active')).toBe(true);
      });
    });

    describe('POST /api/workflows/:id/execute', () => {
      it('should execute workflow', async () => {
        const workflow = await request(app)
          .post('/api/workflows')
          .send({
            name: 'Executable Workflow',
            nodes: [{ id: 'node-1', type: 'trigger', name: 'Test' }]
          });

        const response = await request(app)
          .post(`/api/workflows/${workflow.body.id}/execute`)
          .send({ data: { test: 'data' } })
          .expect(200);

        expect(response.body).toHaveProperty('executionId');
        expect(response.body).toHaveProperty('status', 'started');
      });
    });
  });

  describe('Integration Endpoints', () => {
    describe('GET /api/integrations', () => {
      it('should list available integrations', async () => {
        const response = await request(app)
          .get('/api/integrations')
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
      });
    });

    describe('POST /api/integrations/:type/connect', () => {
      it('should connect to integration', async () => {
        const credentials = {
          apiKey: 'test-api-key',
          workspaceId: 'test-workspace'
        };

        const response = await request(app)
          .post('/api/integrations/zapier/connect')
          .send(credentials)
          .expect(200);

        expect(response.body).toHaveProperty('status', 'connected');
      });

      it('should validate credentials', async () => {
        const invalidCredentials = { apiKey: '' };

        const response = await request(app)
          .post('/api/integrations/zapier/connect')
          .send(invalidCredentials)
          .expect(400);

        expect(response.body.error).toContain('credentials');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    it('should handle server errors', async () => {
      // This would normally test actual server errors
      // For now, we'll just verify the structure
      const response = await request(app)
        .get('/api/error-test')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Authentication', () => {
    it('should require authentication for protected routes', async () => {
      const response = await request(app)
        .get('/api/protected')
        .expect(401);

      expect(response.body.error).toContain('authenticated');
    });

    it('should accept valid authentication token', async () => {
      const token = 'valid-token';

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should reject invalid authentication token', async () => {
      const token = 'invalid-token';

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.error).toContain('Unauthorized');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = Array.from({ length: 101 }, () =>
        request(app).get('/api/health')
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });
});
