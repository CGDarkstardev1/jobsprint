/**
 * E2E Tests: User Workflow
 *
 * Test complete user journeys from signup to workflow execution
 */

import { test, expect } from '@playwright/test';

test.describe('User Onboarding Flow', () => {
  test('should complete signup process', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Click signup button
    await page.click('button:has-text("Sign Up")');

    // Fill signup form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome');
  });

  test('should validate form inputs', async ({ page }) => {
    await page.goto('/signup');

    // Submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Username is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();

    // Test invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid email format')).toBeVisible();

    // Test password mismatch
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Workflow Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create simple workflow', async ({ page }) => {
    // Navigate to workflows page
    await page.click('a:has-text("Workflows")');
    await expect(page).toHaveURL('/workflows');

    // Click create workflow button
    await page.click('button:has-text("Create Workflow")');

    // Fill workflow details
    await page.fill('input[name="name"]', 'My First Workflow');
    await page.fill('textarea[name="description"]', 'This is a test workflow');

    // Add trigger node
    await page.click('button:has-text("Add Trigger")');
    await page.click('text=Webhook');
    await page.fill('input[name="webhook-url"]', 'https://example.com/webhook');

    // Add action node
    await page.click('button:has-text("Add Action")');
    await page.click('text=Send Email');

    // Save workflow
    await page.click('button:has-text("Save")');

    // Should show success message
    await expect(page.locator('text=Workflow created successfully')).toBeVisible();

    // Should be in workflows list
    await expect(page.locator('text=My First Workflow')).toBeVisible();
  });

  test('should edit existing workflow', async ({ page }) => {
    // Go to workflows
    await page.click('a:has-text("Workflows")');

    // Click on workflow
    await page.click('text=My First Workflow');

    // Click edit button
    await page.click('button:has-text("Edit")');

    // Update name
    await page.fill('input[name="name"]', 'Updated Workflow Name');

    // Save changes
    await page.click('button:has-text("Save")');

    // Should show success message
    await expect(page.locator('text=Workflow updated')).toBeVisible();
    await expect(page.locator('text=Updated Workflow Name')).toBeVisible();
  });

  test('should delete workflow', async ({ page }) => {
    await page.click('a:has-text("Workflows")');

    // Click workflow menu
    await page.click('[data-testid="workflow-menu"]');

    // Click delete
    await page.click('text=Delete');

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Should show success message
    await expect(page.locator('text=Workflow deleted')).toBeVisible();

    // Workflow should not be in list
    await expect(page.locator('text=My First Workflow')).not.toBeVisible();
  });

  test('should execute workflow', async ({ page }) => {
    await page.click('a:has-text("Workflows")');
    await page.click('text=Test Workflow');

    // Click execute button
    await page.click('button:has-text("Execute")');

    // Fill execution data if needed
    await page.fill('textarea[name="inputData"]', JSON.stringify({ test: 'data' }));

    // Confirm execution
    await page.click('button:has-text("Run")');

    // Should show execution status
    await expect(page.locator('text=Executing workflow')).toBeVisible();

    // Should complete successfully
    await expect(page.locator('text=Execution completed')).toBeVisible({ timeout: 10000 });
  });

  test('should view execution history', async ({ page }) => {
    await page.click('a:has-text("Workflows")');
    await page.click('text=Test Workflow');

    // Click executions tab
    await page.click('button:has-text("Executions")');

    // Should show execution history
    await expect(page.locator('[data-testid="execution-list"]')).toBeVisible();

    // Click on execution
    await page.click('[data-testid="execution-item"]:first-child');

    // Should show execution details
    await expect(page.locator('[data-testid="execution-details"]')).toBeVisible();
    await expect(page.locator('text=Input Data')).toBeVisible();
    await expect(page.locator('text=Output Data')).toBeVisible();
  });
});

test.describe('Integration Setup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should connect Zapier integration', async ({ page }) => {
    await page.click('a:has-text("Integrations")');
    await expect(page).toHaveURL('/integrations');

    // Click Zapier card
    await page.click('[data-testid="integration-zapier"]');

    // Click connect button
    await page.click('button:has-text("Connect")');

    // Fill API key
    await page.fill('input[name="apiKey"]', 'test-api-key-12345');

    // Submit
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Integration connected')).toBeVisible();

    // Should show as connected
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');
  });

  test('should connect n8n integration', async ({ page }) => {
    await page.click('a:has-text("Integrations")');

    // Click n8n card
    await page.click('[data-testid="integration-n8n"]');

    // Click connect button
    await page.click('button:has-text("Connect")');

    // Fill connection details
    await page.fill('input[name="url"]', 'http://localhost:5678');
    await page.fill('input[name="apiKey"]', 'n8n-api-key');

    // Test connection
    await page.click('button:has-text("Test Connection")');

    // Should show connection successful
    await expect(page.locator('text=Connection successful')).toBeVisible();

    // Save
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=Integration connected')).toBeVisible();
  });

  test('should test integration connection', async ({ page }) => {
    await page.click('a:has-text("Integrations")');
    await page.click('[data-testid="integration-zapier"]');

    // Should already be connected from previous test
    // Click test button
    await page.click('button:has-text("Test Connection")');

    // Should show connection status
    await expect(page.locator('text=Connection is active')).toBeVisible();
  });

  test('should disconnect integration', async ({ page }) => {
    await page.click('a:has-text("Integrations")');
    await page.click('[data-testid="integration-zapier"]');

    // Click disconnect button
    await page.click('button:has-text("Disconnect")');

    // Confirm
    await page.click('button:has-text("Confirm")');

    // Should show success message
    await expect(page.locator('text=Integration disconnected')).toBeVisible();

    // Should show as disconnected
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Disconnected');
  });
});

test.describe('AI Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should send chat message and receive response', async ({ page }) => {
    await page.click('a:has-text("AI Assistant")');

    // Type message
    await page.fill('textarea[name="message"]', 'Hello, how can you help me?');

    // Send message
    await page.click('button:has-text("Send")');

    // Should show user message
    await expect(page.locator('text=Hello, how can you help me?')).toBeVisible();

    // Should show AI response
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
  });

  test('should maintain conversation context', async ({ page }) => {
    await page.click('a:has-text("AI Assistant")');

    // Send first message
    await page.fill('textarea[name="message"]', 'My name is Chris');
    await page.click('button:has-text("Send")');
    await expect(page.locator('[data-testid="ai-response"]')).isVisible();

    // Send follow-up message
    await page.fill('textarea[name="message"]', 'What is my name?');
    await page.click('button:has-text("Send")');

    // Should respond with name
    await expect(page.locator('[data-testid="ai-response"]')).toContainText('Chris', { timeout: 10000 });
  });

  test('should clear conversation', async ({ page }) => {
    await page.click('a:has-text("AI Assistant")');

    // Send message
    await page.fill('textarea[name="message"]', 'Test message');
    await page.click('button:has-text("Send")');
    await expect(page.locator('[data-testid="ai-response"]')).isVisible();

    // Clear conversation
    await page.click('button:has-text("Clear Conversation")');

    // Confirm
    await page.click('button:has-text("Confirm")');

    // Should not show previous messages
    await expect(page.locator('text=Test message')).not.toBeVisible();
  });
});

test.describe('User Settings Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should update profile', async ({ page }) => {
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Settings');

    // Update profile
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="bio"]', 'Automation enthusiast');

    // Save
    await page.click('button:has-text("Save")');

    // Should show success message
    await expect(page.locator('text=Profile updated')).toBeVisible();

    // Should show updated name
    await expect(page.locator('[data-testid="user-name"]')).toContainText('John Doe');
  });

  test('should change password', async ({ page }) => {
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Settings');
    await page.click('button:has-text("Security")');

    // Fill password change form
    await page.fill('input[name="currentPassword"]', 'SecurePassword123!');
    await page.fill('input[name="newPassword"]', 'NewSecurePassword456!');
    await page.fill('input[name="confirmNewPassword"]', 'NewSecurePassword456!');

    // Submit
    await page.click('button:has-text("Change Password")');

    // Should show success message
    await expect(page.locator('text=Password changed')).toBeVisible();

    // Login with new password
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'NewSecurePassword456!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });

  test('should logout', async ({ page }) => {
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');

    // Should redirect to login
    await expect(page).toHaveURL('/login');

    // Should not be able to access protected routes
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});
