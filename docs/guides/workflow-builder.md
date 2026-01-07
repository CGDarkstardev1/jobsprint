# Workflow Builder Guide

Master the visual workflow builder to create powerful automations without code.

## Introduction to the Workflow Builder

The Jobsprint workflow builder is a visual, drag-and-drop interface for creating automations. It combines the simplicity of visual programming with the power of AI and third-party integrations.

### Key Features

- **Visual Node-based Editor**: Drag, drop, and connect nodes
- **Real-time Validation**: Instant feedback on workflow logic
- **Built-in Testing**: Test workflows before deployment
- **Version Control**: Track changes and rollback if needed
- **AI-powered Suggestions**: Get intelligent recommendations

## Understanding the Interface

### Canvas

The main workspace where you build your workflow.

- **Add Nodes**: Drag from the left panel or double-click
- **Connect Nodes**: Drag from one node's output to another's input
- **Move Nodes**: Drag to reposition
- **Delete**: Select and press Delete or use context menu
- **Zoom**: Use mouse wheel or zoom controls

### Node Panel (Left Sidebar)

Browse and add nodes to your workflow.

**Categories**:
- Triggers: Webhooks, Schedules, Events
- Actions: Send email, Update database, Call API
- AI: Text generation, Code generation, Embeddings
- Logic: Conditionals, Loops, Filters
- Integrations: Zapier, Custom apps

### Properties Panel (Right Sidebar)

Configure the selected node.

**Settings vary by node type**:
- Name and description
- Parameters and options
- Input/output mappings
- Error handling
- Retry policy

### Bottom Panel

View logs, test results, and execution details.

**Tabs**:
- Output: Execution results
- Logs: Detailed execution logs
- JSON: Raw data view
- Errors: Error messages and stack traces

## Node Types

### Trigger Nodes

Start workflows based on events.

#### Webhook Trigger

Receives HTTP requests to start workflows.

**Use Cases**:
- GitHub push events
- Stripe webhooks
- Custom integrations

**Configuration**:
```
Method: POST/GET/PUT/DELETE
Path: /webhooks/custom-path
Authentication: None/API Key/Signature
```

**Example**:
```json
{
  "type": "webhook",
  "path": "github-push",
  "method": "POST",
  "auth": {
    "type": "signature",
    "header": "X-Hub-Signature"
  }
}
```

#### Schedule Trigger

Run workflows on a schedule.

**Use Cases**:
- Daily reports
- Hourly data sync
- Weekly backups

**Configuration**:
```
Cron Expression: 0 * * * *
Timezone: UTC
```

**Examples**:
```
0 * * * *           # Every hour
0 9 * * 1-5         # 9 AM weekdays
*/15 * * * *        # Every 15 minutes
0 0 * * 0           # Midnight Sunday
```

#### Event Trigger

Respond to system events.

**Events**:
- `workflow.completed`: Another workflow finished
- `integration.connected`: New integration added
- `user.created`: New user registered

**Configuration**:
```
Event Type: workflow.completed
Filters:
  - workflow.status: success
```

### Action Nodes

Perform actions and process data.

#### HTTP Request Node

Make HTTP requests to external APIs.

**Configuration**:
```
Method: POST
URL: https://api.example.com/endpoint
Headers:
  Authorization: Bearer {{token}}
Body:
  key: {{input.value}}
```

**Features**:
- All HTTP methods supported
- Custom headers
- Request body templates
- Response parsing
- Error handling

#### Email Node

Send emails via SMTP or integrations.

**Configuration**:
```
To: {{email.address}}
From: noreply@jobsprint.io
Subject: {{email.subject}}
Body: {{email.body}}
```

**Features**:
- HTML and plain text
- Attachments
- Templates
- CC/BCC support

#### Database Node

Execute database operations.

**Configuration**:
```
Operation: INSERT
Table: workflow_results
Data:
  workflow_id: {{workflow.id}}
  result: {{output}}
  created_at: NOW()
```

**Features**:
- CRUD operations
- Transactions
- Batch operations
- Query builder

### AI Nodes

Leverage AI models for intelligent processing.

#### AI Chat Node

Generate responses using conversation context.

**Configuration**:
```
Model: gpt-3.5-turbo-free
System Prompt: You are a helpful assistant
Messages:
  - Role: user
    Content: {{input.question}}
Temperature: 0.7
Max Tokens: 500
```

**Best Practices**:
- Clear system prompts
- Provide context in messages
- Use appropriate temperature
- Set token limits

#### AI Code Node

Generate or complete code.

**Configuration**:
```
Model: code-davinci-free
Prompt: |
  Write a function to {{task}}:
  {{context}}
Language: javascript
Temperature: 0.3
```

**Use Cases**:
- Code generation
- Code completion
- Bug fixes
- Refactoring

#### AI Text Node

Complete and generate text.

**Configuration**:
```
Model: text-davinci-free-002
Prompt: {{input.prefix}}
Temperature: 0.7
Max Tokens: 300
Stop Sequences:
  - "\n\n"
  - "END"
```

### Logic Nodes

Control workflow flow and logic.

#### Condition Node

Branch workflow logic based on conditions.

**Configuration**:
```
Condition: {{input.status}} == 'urgent'
True Branch: Send alert
False Branch: Log and continue
```

**Advanced Conditions**:
```
{{input.value}} > 100 && {{input.type}} == 'priority'
{{email.subject}}.includes('urgent')
{{workflow.executions}} >= 10
```

#### Loop Node

Iterate over arrays and lists.

**Configuration**:
```
Iterable: {{input.items}}
Variable Name: item
Max Iterations: 100
```

**Example**:
```javascript
// Input: {items: [1, 2, 3]}
// Loop will execute 3 times
// item = 1, then 2, then 3
```

#### Filter Node

Filter data based on conditions.

**Configuration**:
```
Input Array: {{input.results}}
Filter Condition: item.status == 'active'
Output: filtered_results
```

#### Transform Node

Transform and map data.

**Configuration**:
```
Input: {{input.data}}
Transformation:
  output.name: input.first_name + ' ' + input.last_name
  output.email: input.email.toLowerCase()
  output.created: new Date().toISOString()
```

### Integration Nodes

Connect to external services.

#### Zapier Action Node

Execute Zapier actions.

**Configuration**:
```
Integration: Slack
Action: Send Message
Parameters:
  channel: #alerts
  text: {{message}}
```

#### Custom Integration Node

Call custom integrations.

**Configuration**:
```
Integration ID: int_abc123
Action: custom_action
Parameters:
  param1: {{input.value}}
  param2: {{input.other}}
```

## Building Workflows

### Step 1: Plan Your Workflow

Before building, map out the flow:

```
Trigger → Data Processing → AI Enrichment → Action
```

Example:
```
Webhook → Extract Data → AI Summary → Send Email
```

### Step 2: Add Trigger Node

1. Drag "Webhook Trigger" to canvas
2. Configure webhook path and auth
3. Test webhook with sample data

### Step 3: Add Processing Nodes

1. Add "HTTP Request" node to fetch data
2. Add "Filter" node to process data
3. Add "Transform" node to format data

### Step 4: Add AI Node

1. Add "AI Chat" node
2. Configure model and prompt
3. Map input data to prompt

### Step 5: Add Action Node

1. Add "Email" node
2. Configure recipient and template
3. Map AI output to email body

### Step 6: Connect Nodes

1. Connect webhook → HTTP request
2. Connect HTTP request → Filter
3. Connect filter → Transform
4. Connect transform → AI chat
5. Connect AI chat → Email

### Step 7: Test Workflow

1. Click "Test" button
2. Enter sample input data
3. Step through execution
4. Verify outputs

### Step 8: Deploy

1. Click "Activate" button
2. Review summary
3. Confirm activation
4. Monitor first executions

## Advanced Features

### Sub-Workflows

Call other workflows from within workflows.

**Configuration**:
```
Workflow ID: wf_sub_workflow
Input Data:
  data: {{input.value}}
  config: {{settings}}
```

### Error Handling

Handle errors gracefully.

**Try-Catch Pattern**:
```
Try:
  - Risky Operation
Catch:
  - Log Error
  - Send Alert
  - Retry with Fallback
```

**Configuration**:
```
Error Handler:
  Type: Continue
  Fallback Value: {{default.value}}
  Notify: true
```

### Parallel Execution

Execute multiple nodes in parallel.

**Configuration**:
```
Parallel Nodes:
  - Task 1
  - Task 2
  - Task 3
Wait For: All
```

### Data Persistence

Store data between workflow executions.

**Configuration**:
```
Storage: Redis
Key: workflow_{{workflow.id}}_state
TTL: 3600
```

## Best Practices

### 1. Modular Design

Break complex workflows into smaller, reusable sub-workflows.

**Good**:
```
Main Workflow → Data Fetch → Data Process → Data Save
```

**Bad**:
```
Main Workflow → (100 nodes in one flow)
```

### 2. Error Handling

Always implement error handling:

- Add timeout configurations
- Implement retry logic
- Provide fallback values
- Send error notifications

### 3. Data Validation

Validate data at each step:

```
Webhook → Validate → Process → Validate Output → Save
```

### 4. Logging

Add log nodes for debugging:

```
Start → Log "Starting" → Process → Log "Processed" → End
```

### 5. Documentation

Document your workflows:

- Add descriptions to each node
- Comment on complex logic
- Document input/output formats
- Provide example data

## Common Patterns

### 1. Request-Response Pattern

Handle webhooks with immediate response:

```
Webhook → Process → Response → End
```

### 2. Batch Processing

Process items in batches:

```
Trigger → Split → Process Each → Aggregate → Save
```

### 3. Conditional Routing

Route based on conditions:

```
Input → Condition → [True Branch / False Branch] → Merge
```

### 4. Retry Pattern

Retry failed operations:

```
Operation → [Success → Continue / Failure → Retry] → Check Retry Count
```

### 5. Fan-Out/Fan-In

Parallel processing with aggregation:

```
Input → Split → [Parallel Tasks] → Aggregate → Output
```

## Tips and Tricks

### Keyboard Shortcuts

- `Ctrl+N`: Add new node
- `Ctrl+S`: Save workflow
- `Ctrl+Z`: Undo
- `Ctrl+Y`: Redo
- `Ctrl+D`: Duplicate selected
- `Delete`: Remove selected
- `Ctrl+Shift+D`: Toggle debug mode

### Quick Actions

- Double-click canvas to add node
- Drag from connection points to connect
- Right-click for context menu
- Shift+click to select multiple

### Performance Tips

- Minimize node connections
- Use sub-workflows for reuse
- Cache expensive operations
- Use parallel execution when possible
- Monitor execution time

## Troubleshooting

### Workflow Not Executing

1. Check trigger is active
2. Verify webhook URL
3. Review execution logs
4. Test with sample data

### Data Not Passing Between Nodes

1. Check connection mappings
2. Verify variable names
3. Inspect input/output data
4. Check data types

### AI Node Errors

1. Verify prompt format
2. Check token limits
3. Review model availability
4. Test with simpler prompt

### Performance Issues

1. Profile execution time
2. Identify slow nodes
3. Optimize queries
4. Add caching
5. Consider parallel execution

## Next Steps

Now that you've mastered the workflow builder:

1. Explore [Workflow Templates](./templates.md)
2. Learn [AI Integration](./ai-models.md)
3. Build [Custom Nodes](./n8n-nodes.md)
4. Study [Advanced Patterns](./advanced-patterns.md)

Happy building!
