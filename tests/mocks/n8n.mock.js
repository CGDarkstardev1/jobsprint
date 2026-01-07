/**
 * n8n Mock
 *
 * Mock the n8n workflow automation engine for testing
 */

class N8nMock {
  constructor() {
    this.workflows = new Map();
    this.executions = new Map();
    this.nodes = [];
  }

  /**
   * Mock workflow creation
   */
  async createWorkflow(workflowData) {
    const workflow = {
      id: `workflow-${Date.now()}`,
      name: workflowData.name,
      nodes: workflowData.nodes || [],
      connections: workflowData.connections || {},
      settings: workflowData.settings || {},
      staticData: null,
      tags: [],
      pinData: {},
      versionId: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.workflows.set(workflow.id, workflow);
    return { success: true, workflow };
  }

  /**
   * Mock workflow execution
   */
  async executeWorkflow(workflowId, data = {}) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return {
        success: false,
        error: 'Workflow not found',
      };
    }

    const execution = {
      id: `exec-${Date.now()}`,
      workflowId,
      finished: true,
      mode: 'manual',
      retryOf: null,
      retrySuccessId: null,
      startedAt: new Date().toISOString(),
      stoppedAt: new Date().toISOString(),
      status: 'success',
      data: {
        resultData: {
          runData: {},
        },
      },
    };

    this.executions.set(execution.id, execution);
    return { success: true, execution };
  }

  /**
   * Mock getting workflow by ID
   */
  async getWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return {
        success: false,
        error: 'Workflow not found',
      };
    }
    return { success: true, workflow };
  }

  /**
   * Mock listing workflows
   */
  async listWorkflows() {
    return {
      success: true,
      workflows: Array.from(this.workflows.values()),
    };
  }

  /**
   * Mock updating workflow
   */
  async updateWorkflow(workflowId, updates) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return {
        success: false,
        error: 'Workflow not found',
      };
    }

    const updated = {
      ...workflow,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.workflows.set(workflowId, updated);
    return { success: true, workflow: updated };
  }

  /**
   * Mock deleting workflow
   */
  async deleteWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return {
        success: false,
        error: 'Workflow not found',
      };
    }

    this.workflows.delete(workflowId);
    return { success: true };
  }

  /**
   * Mock getting execution by ID
   */
  async getExecution(executionId) {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return {
        success: false,
        error: 'Execution not found',
      };
    }
    return { success: true, execution };
  }

  /**
   * Mock custom node registration
   */
  async registerNode(node) {
    this.nodes.push(node);
    return { success: true, node };
  }

  /**
   * Set mock workflow
   */
  setMockWorkflow(workflow) {
    this.workflows.set(workflow.id, workflow);
  }

  /**
   * Set mock execution
   */
  setMockExecution(execution) {
    this.executions.set(execution.id, execution);
  }

  /**
   * Clear all mocks
   */
  clear() {
    this.workflows.clear();
    this.executions.clear();
    this.nodes = [];
  }
}

export const n8nMock = new N8nMock();
export default n8nMock;
