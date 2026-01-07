/**
 * Zapier MCP Integration - Usage Examples
 *
 * This file demonstrates various usage patterns for the Zapier MCP integration.
 *
 * @file zapier-examples.js
 */

const {
  createZapierIntegration,
  ZapierWorkflowTemplates,
} = require('../../src/frontend/js/integrations/index');

// ============================================================================
// Example 1: Basic Setup
// ============================================================================

async function basicSetup() {
  // Create integration instance
  const zapier = createZapierIntegration({
    endpointUrl: process.env.ZAPIER_MCP_ENDPOINT,
    apiKey: process.env.ZAPIER_MCP_API_KEY,
  });

  // Initialize
  await zapier.init();
  console.log('Zapier integration initialized');

  // Connect to Slack
  await zapier.connect('slack', {});
  console.log('Connected to Slack');

  // Send a message
  const result = await zapier.execute('slack.postMessage', {
    channel: '#general',
    text: 'Hello from Jobsprint!',
  });

  console.log('Message sent:', result);

  // Cleanup
  await zapier.destroy();
}

// ============================================================================
// Example 2: Customer Support Automation
// ============================================================================

async function customerSupportAutomation() {
  const zapier = createZapierIntegration();

  await zapier.init();

  // Connect to required apps
  await zapier.connect('zendesk', {});
  await zapier.connect('slack', {});
  await zapier.connect('salesforce', {});

  // Register trigger for new tickets
  zapier.onTrigger('new-ticket', {
    appId: 'zendesk',
    eventType: 'new_ticket',
  }, async (ticket) => {
    const { id, priority, subject, customerEmail } = ticket;

    // Route based on priority
    if (priority === 'urgent') {
      // Notify support team
      await zapier.execute('slack.postMessage', {
        channel: '#support-urgent',
        text: `🚨 Urgent ticket #${id}: ${subject}`,
      });

      // Assign to senior agent
      await zapier.execute('zendesk.updateTicket', {
        ticketId: id,
        assigneeId: 'senior-agent-id',
        priority: 'high',
      });
    } else {
      // Standard routing
      await zapier.execute('zendesk.updateTicket', {
        ticketId: id,
        assigneeId: 'agent-id',
      });
    }

    // Log in CRM
    await zapier.execute('salesforce.createCase', {
      subject,
      description: ticket.description,
      customerEmail,
      priority,
    });

    // Send confirmation to customer
    await zapier.execute('gmail.send', {
      to: customerEmail,
      subject: `Ticket Received: #${id}`,
      body: `Thank you for contacting us. Your ticket #${id} has been received.`,
    });

    return { success: true, ticketId: id };
  });

  console.log('Customer support automation registered');
}

// ============================================================================
// Example 3: Social Media Scheduling
// ============================================================================

async function socialMediaScheduler() {
  const zapier = createZapierIntegration();

  await zapier.init();

  // Connect to social platforms
  await zapier.connect('twitter', {});
  await zapier.connect('linkedin', {});
  await zapier.connect('facebook', {});

  // Schedule trigger
  zapier.onTrigger('scheduled-post', {
    appId: 'scheduler',
    eventType: 'time_based',
  }, async (schedule) => {
    const { postContent, platforms } = schedule;

    // Post to multiple platforms
    const actions = platforms.map(platform => ({
      actionId: `${platform}.createPost`,
      params: {
        content: postContent,
      },
    }));

    // Execute in batch
    const results = await zapier.executeBatch(actions, {
      concurrency: 3,
    });

    console.log(`Posted to ${results.length} platforms`);

    return { success: true, results };
  });
}

// ============================================================================
// Example 4: Lead Generation Workflow
// ============================================================================

async function leadGenerationWorkflow() {
  const zapier = createZapierIntegration();

  await zapier.init();

  // Connect to apps
  await zapier.connect('webform', {});
  await zapier.connect('salesforce', {});
  await zapier.connect('hubspot', {});
  await zapier.connect('slack', {});

  // Webhook for form submissions
  zapier.onWebhook('form-submission', {
    path: '/webhooks/lead-form',
    method: 'POST',
    appId: 'webform',
    eventType: 'form_submit',
    requireAuth: true,
  }, async (submission) => {
    const { name, email, company, interest } = submission;

    // Create Salesforce lead
    const salesforceResult = await zapier.execute('salesforce.createLead', {
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' '),
      email,
      company,
      leadSource: 'Web Form',
    });

    // Sync to HubSpot
    await zapier.execute('hubspot.createContact', {
      email,
      firstname: name.split(' ')[0],
      lastname: name.split(' ').slice(1).join(' '),
      company,
    });

    // Notify sales team
    await zapier.execute('slack.postMessage', {
      channel: '#sales-leads',
      text: `🎉 New lead from ${company}! Interested in ${interest}`,
    });

    // Send email confirmation
    await zapier.execute('gmail.send', {
      to: email,
      subject: 'Thank you for your interest',
      body: `Hi ${name},\n\nThank you for your interest in ${interest}. Our team will contact you shortly.`,
    });

    return { success: true, leadId: salesforceResult.id };
  });
}

// ============================================================================
// Example 5: Data Backup Automation
// ============================================================================

async function dataBackupAutomation() {
  const zapier = createZapierIntegration();

  await zapier.init();

  // Connect to storage apps
  await zapier.connect('database', {});
  await zapier.connect('google-drive', {});
  await zapier.connect('dropbox', {});

  // Scheduled backup
  zapier.onTrigger('daily-backup', {
    appId: 'scheduler',
    eventType: 'time_based',
  }, async () => {
    // Export database
    const backupResult = await zapier.execute('database.export', {
      format: 'sql',
      compress: true,
    });

    // Upload to Google Drive
    await zapier.execute('google-drive.upload', {
      file: backupResult.file,
      folderId: 'backup-folder-id',
      name: `backup-${new Date().toISOString().split('T')[0]}.sql.gz`,
    });

    // Upload to Dropbox (redundancy)
    await zapier.execute('dropbox.upload', {
      file: backupResult.file,
      path: `/backups/backup-${Date.now()}.sql.gz`,
    });

    // Send confirmation
    await zapier.execute('slack.postMessage', {
      channel: '#notifications',
      text: '✅ Daily backup completed successfully',
    });

    return { success: true };
  });
}

// ============================================================================
// Example 6: Using Workflow Templates
// ============================================================================

async function useWorkflowTemplates() {
  const zapier = createZapierIntegration();

  await zapier.init();

  // Get Slack notification template
  const template = ZapierWorkflowTemplates.getTemplate('slack-notification');

  // Connect to required apps
  for (const trigger of template.triggers) {
    await zapier.connect(trigger.appId, {});
  }

  // Register triggers from template
  for (const trigger of template.triggers) {
    zapier.onTrigger(trigger.id, trigger.config, async (payload) => {
      // Execute all actions from template
      const results = [];
      for (const action of template.actions) {
        const result = await zapier.execute(
          action.actionId,
          action.params,
          template.config
        );
        results.push(result);
      }

      return { success: true, results };
    });
  }

  console.log('Slack notification template activated');
}

// ============================================================================
// Example 7: E-commerce Order Processing
// ============================================================================

async function ecommerceOrderProcessing() {
  const zapier = createZapierIntegration();

  await zapier.init();

  // Connect to e-commerce and business apps
  await zapier.connect('shopify', {});
  await zapier.connect('stripe', {});
  await zapier.connect('slack', {});
  await zapier.connect('gmail', {});

  // Register new order trigger
  zapier.onTrigger('new-order', {
    appId: 'shopify',
    eventType: 'order_created',
  }, async (order) => {
    const { id, customer, items, total } = order;

    // Verify payment
    const payment = await zapier.execute('stripe.charge', {
      amount: total,
      currency: 'usd',
      customer: customer.email,
    });

    if (!payment.paid) {
      // Notify about payment failure
      await zapier.execute('slack.postMessage', {
        channel: '#orders',
        text: `❌ Payment failed for order #${id}`,
      });

      return { success: false, error: 'Payment failed' };
    }

    // Update order status
    await zapier.execute('shopify.updateOrder', {
      orderId: id,
      status: 'paid',
    });

    // Notify fulfillment team
    await zapier.execute('slack.postMessage', {
      channel: '#fulfillment',
      text: `📦 New order #${id} - ${items.length} items - $${total}`,
    });

    // Send confirmation email
    await zapier.execute('gmail.send', {
      to: customer.email,
      subject: `Order Confirmation #${id}`,
      body: `Thank you for your order! Your order #${id} has been received and is being processed.`,
    });

    // Add to CRM
    await zapier.execute('salesforce.createOrder', {
      customerId: customer.id,
      orderId: id,
      total,
      items: items.length,
    });

    return { success: true, orderId: id };
  });
}

// ============================================================================
// Example 8: Content Publishing Pipeline
// ============================================================================

async function contentPublishingPipeline() {
  const zapier = createZapierIntegration();

  await zapier.init();

  // Connect to CMS and social platforms
  await zapier.connect('wordpress', {});
  await zapier.connect('twitter', {});
  await zapier.connect('linkedin', {});
  await zapier.connect('mailchimp', {});

  // New content published trigger
  zapier.onTrigger('content-published', {
    appId: 'wordpress',
    eventType: 'post_published',
  }, async (post) => {
    const { id, title, url, excerpt, tags } = post;

    // Generate short URL
    const shortUrl = await zapier.execute('bitly.shorten', {
      url,
    });

    // Create social media posts
    const socialPosts = [
      {
        actionId: 'twitter.createTweet',
        params: {
          status: `New blog post: ${title}\n\n${shortUrl.shortUrl}\n\n#${tags.join(' #')}`,
        },
      },
      {
        actionId: 'linkedin.share',
        params: {
          title,
          url: shortUrl.shortUrl,
          comment: `Check out our latest article: ${title}`,
        },
      },
    ];

    // Post to social media
    await zapier.executeBatch(socialPosts);

    // Send to newsletter list
    await zapier.execute('mailchimp.sendCampaign', {
      subject: title,
      body: excerpt,
      url: shortUrl.shortUrl,
    });

    // Log analytics
    await zapier.execute('google-analytics.trackEvent', {
      category: 'Content',
      action: 'Published',
      label: title,
    });

    return { success: true, postId: id };
  });
}

// ============================================================================
// Example 9: Error Handling with Retries
// ============================================================================

async function errorHandlingExample() {
  const zapier = createZapierIntegration({
    errorHandling: {
      maxRetries: 5,
      initialRetryDelay: 2000,
      circuitBreakerThreshold: 10,
    },
  });

  await zapier.init();

  try {
    // This will automatically retry on failure
    const result = await zapier.execute('some-api.action', {
      param: 'value',
    });

    console.log('Success:', result);
  } catch (error) {
    // All retries exhausted
    console.error('Failed after retries:', error);

    // Check error stats
    const stats = zapier.errorHandler.getErrorStats('some-api.action');
    console.log('Error statistics:', stats);
  }
}

// ============================================================================
// Example 10: Monitoring and Health Checks
// ============================================================================

async function monitoringExample() {
  const zapier = createZapierIntegration();

  await zapier.init();

  // Periodic health check
  setInterval(async () => {
    const status = zapier.getStatus();

    console.log('=== Zapier Integration Status ===');
    console.log('Client:', status.client);
    console.log('Connections:', status.connections.length);
    console.log('Triggers:', status.triggers.length);
    console.log('Webhooks:', status.webhooks.length);
    console.log('Queue:', status.dispatcher);

    // Check connection health
    for (const conn of status.connections) {
      const isHealthy = await zapier.connectionManager.testConnection(conn.appId);
      console.log(`  ${conn.appId}: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    }
  }, 60000); // Every minute
}

// ============================================================================
// Example 11: Using Integration Class
// ============================================================================

async function usingIntegrationClass() {
  const { ZapierIntegration } = require('../../src/frontend/js/integrations/index');

  // Create integration instance
  const zapier = new ZapierIntegration({
    endpointUrl: process.env.ZAPIER_MCP_ENDPOINT,
    apiKey: process.env.ZAPIER_MCP_API_KEY,
  });

  // Initialize
  await zapier.init();

  // Connect to app
  await zapier.connect('slack', {});

  // Execute action
  await zapier.execute('slack.postMessage', {
    channel: '#general',
    text: 'Hello from ZapierIntegration class!',
  });

  // Get status
  const status = zapier.getStatus();
  console.log('Status:', status);

  // Cleanup
  await zapier.destroy();
}

// ============================================================================
// Export all examples
// ============================================================================

module.exports = {
  basicSetup,
  customerSupportAutomation,
  socialMediaScheduler,
  leadGenerationWorkflow,
  dataBackupAutomation,
  useWorkflowTemplates,
  ecommerceOrderProcessing,
  contentPublishingPipeline,
  errorHandlingExample,
  monitoringExample,
  usingIntegrationClass,
};
