/**
 * n8n Integration Unit Tests
 *
 * Test n8n workflow automation engine integration
 */

import N8nIntegration from '@/integrations/n8n';
import { n8nMock } from '@mocks/n8n.mock';

describe('N8nIntegration', () => {
  let n8n;

  beforeEach(() => {
    n8n = new N8nIntegration('http://localhost:5678');
    n8n.client = n8nMock;
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with base URL', () => {
      expect(n8n.baseUrl).toBe('http://localhost:5678');
      expect(n8n.client).toBeDefined();
    });

    it('should throw error without base URL', () => {
      expect(() => new N8nIntegration()).toThrow('Base URL is required');
    });
  });

  describe('Workflow Management', () => {
    it('should create new workflow', async () => {
      const workflowData = {
        name: 'Test Workflow',
        nodes: [
          {
            id: 'node-1',
            type: 'trigger',
            name: 'Webhook Trigger',
            config: {}
          }
        ],
        connections: {}
      };

      const response = await n8n.createWorkflow(workflowData);

      expect(response.success).toBe(true);
      expect(response.workflow).toBeDefined();
      expect(response.workflow.name).toBe('Test Workflow');
      expect(response.workflow.id).toBeDefined();
    });

    it('should get workflow by ID', async () => {
      const createResponse = await n8n.createWorkflow({ name: 'Test' });
      const workflow = await n8n.getWorkflow(createResponse.workflow.id);

      expect(workflow.success).toBe(true);
      expect(workflow.workflow.id).toBe(createResponse.workflow.id);
    });

    it('should list all workflows', async () => {
      await n8n.createWorkflow({ name: 'Workflow 1' });
      await n8n.createWorkflow({ name: 'Workflow 2' });

      const response = await n8n.listWorkflows();

      expect(response.success).toBe(true);
      expect(response.workflows.length).toBeGreaterThanOrEqual(2);
    });

    it('should update existing workflow', async () => {
      const createResponse = await n8n.createWorkflow({ name: 'Original Name' });
      const updateResponse = await n8n.updateWorkflow(createResponse.workflow.id, {
        name: 'Updated Name'
      });

      expect(updateResponse.success).toBe(true);
      expect(updateResponse.workflow.name).toBe('Updated Name');
    });

    it('should delete workflow', async () => {
      const createResponse = await n8n.createWorkflow({ name: 'To Delete' });
      const deleteResponse = await n8n.deleteWorkflow(createResponse.workflow.id);

      expect(deleteResponse.success).toBe(true);

      const getResponse = await n8n.getWorkflow(createResponse.workflow.id);
      expect(getResponse.success).toBe(false);
    });

    it('should validate workflow before creation', () => {
      const invalidWorkflow = {
        name: 'Invalid Workflow'
        // Missing required nodes
      };

      expect(() => n8n.validateWorkflow(invalidWorkflow))
        .toThrow('Workflow must have at least one node');
    });
  });

  describe('Workflow Execution', () => {
    it('should execute workflow', async () => {
      const workflowResponse = await n8n.createWorkflow({
        name: 'Executable Workflow',
        nodes: [{ id: 'node-1', type: 'trigger', name: 'Test' }]
      });

      const executionResponse = await n8n.executeWorkflow(workflowResponse.workflow.id);

      expect(executionResponse.success).toBe(true);
      expect(executionResponse.execution).toBeDefined();
      expect(executionResponse.execution.status).toBe('success');
    });

    it('should execute workflow with input data', async () => {
      const workflowResponse = await n8n.createWorkflow({
        name: 'Data Workflow',
        nodes: [{ id: 'node-1', type: 'trigger', name: 'Test' }]
      });

      const inputData = { message: 'Hello, World!' };
      const executionResponse = await n8n.executeWorkflow(
        workflowResponse.workflow.id,
        inputData
      );

      expect(executionResponse.success).toBe(true);
    });

    it('should get execution by ID', async () => {
      const workflowResponse = await n8n.createWorkflow({
        name: 'Test',
        nodes: [{ id: 'node-1', type: 'trigger', name: 'Test' }]
      });

      const executionResponse = await n8n.executeWorkflow(workflowResponse.workflow.id);
      const execution = await n8n.getExecution(executionResponse.execution.id);

      expect(execution.success).toBe(true);
      expect(execution.execution.id).toBe(executionResponse.execution.id);
    });

    it('should list workflow executions', async () => {
      const workflowResponse = await n8n.createWorkflow({
        name: 'Test',
        nodes: [{ id: 'node-1', type: 'trigger', name: 'Test' }]
      });

      await n8n.executeWorkflow(workflowResponse.workflow.id);
      await n8n.executeWorkflow(workflowResponse.workflow.id);

      const executions = await n8n.listExecutions(workflowResponse.workflow.id);

      expect(executions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Custom Nodes', () => {
    it('should register custom node', async () => {
      const customNode = {
        id: 'jobsprint-trigger',
        type: 'trigger',
        name: 'Jobsprint Trigger',
        version: 1,
        config: {}
      };

      const response = await n8n.registerNode(customNode);

      expect(response.success).toBe(true);
      expect(response.node.id).toBe('jobsprint-trigger');
    });

    it('should validate custom node schema', () => {
      const invalidNode = {
        id: 'invalid-node'
        // Missing required fields
      };

      expect(() => n8n.validateNodeSchema(invalidNode))
        .toThrow('Node must have type, name, and version');
    });

    it('should list available nodes', async () => {
      await n8n.registerNode({
        id: 'node-1',
        type: 'trigger',
        name: 'Node 1',
        version: 1
      });

      await n8n.registerNode({
        id: 'node-2',
        type: 'action',
        name: 'Node 2',
        version: 1
      });

      const nodes = await n8n.listNodes();

      expect(nodes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Workflow Templates', () => {
    it('should create workflow from template', async () => {
      const template = {
        name: 'Email Automation',
        description: 'Automate email workflows',
        nodes: [
          { id: 'trigger', type: 'trigger', name: 'Email Received' },
          { id: 'action', type: 'action', name: 'Send Reply' }
        ]
      };

      const workflow = await n8n.createFromTemplate(template, {
        name: 'My Email Workflow'
      });

      expect(workflow.success).toBe(true);
      expect(workflow.workflow.name).toBe('My Email Workflow');
    });

    it('should list available templates', () => {
      const templates = n8n.listTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle workflow execution failures', async () => {
      const workflowResponse = await n8n.createWorkflow({
        name: 'Failing Workflow',
        nodes: [{ id: 'node-1', type: 'trigger', name: 'Test' }]
      });

      n8nMock.executeWorkflow = jest.fn().mockResolvedValue({
        success: false,
        error: 'Execution failed'
      });

      const response = await n8n.executeWorkflow(workflowResponse.workflow.id);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should implement retry logic', async () => {
      const workflowResponse = await n8n.createWorkflow({
        name: 'Retry Workflow',
        nodes: [{ id: 'node-1', type: 'trigger', name: 'Test' }]
      });

      let attempts = 0;
      n8nMock.executeWorkflow = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { success: true, execution: { id: 'exec-1', status: 'success' } };
      });

      const response = await n8n.executeWorkflowWithRetry(
        workflowResponse.workflow.id,
        { maxRetries: 3 }
      );

      expect(response.success).toBe(true);
      expect(attempts).toBe(3);
    });
  });

  describe('Workflow Scheduling', () => {
    it('should schedule workflow execution', async () => {
      const workflowResponse = await n8n.createWorkflow({
        name: 'Scheduled Workflow',
        nodes: [{ id: 'node-1', type: 'trigger', name: 'Test' }]
      });

      const schedule = {
        cron: '0 0 * * *', // Daily at midnight
        timezone: 'UTC'
      };

      const response = await n8n.scheduleWorkflow(workflowResponse.workflow.id, schedule);

      expect(response.success).toBe(true);
      expect(response.schedule).toBeDefined();
    });

    it('should validate cron expression', () => {
      expect(n8n.validateCron('0 0 * * *')).toBe(true);
      expect(n8n.validateCron('invalid')).toBe(false);
    });

    it('should cancel scheduled execution', async () => {
      const workflowResponse = await n8n.createWorkflow({
        name: 'Scheduled Workflow',
        nodes: [{ id: 'node-1', type: 'trigger', name: 'Test' }]
      });

      const scheduleResponse = await n8n.scheduleWorkflow(
        workflowResponse.workflow.id,
        { cron: '0 0 * * *' }
      );

      const cancelResponse = await n8n.cancelSchedule(scheduleResponse.scheduleId);

      expect(cancelResponse.success).toBe(true);
    });
  });
});
