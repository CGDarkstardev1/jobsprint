/**
 * Zapier Workflow Templates
 *
 * Pre-built workflow templates for common automation scenarios.
 * Each template includes configuration, triggers, and actions.
 *
 * @module ZapierWorkflowTemplates
 */

class ZapierWorkflowTemplates {
  /**
   * Get all available templates
   *
   * @returns {Array} Array of template objects
   */
  static getAllTemplates() {
    return [
      this.getSlackNotificationTemplate(),
      this.getEmailAutomationTemplate(),
      this.getCRMSyncTemplate(),
      this.getSocialMediaTemplate(),
      this.getDataBackupTemplate(),
      this.getTaskManagementTemplate(),
      this.getCustomerSupportTemplate(),
      this.getDocumentGenerationTemplate(),
    ];
  }

  /**
   * Get template by ID
   *
   * @param {string} templateId - Template identifier
   * @returns {Object|null} Template object
   */
  static getTemplate(templateId) {
    const templates = this.getAllTemplates();
    return templates.find(t => t.id === templateId) || null;
  }

  /**
   * Slack Notification Template
   *
   * Sends notifications to Slack based on triggers
   */
  static getSlackNotificationTemplate() {
    return {
      id: 'slack-notification',
      name: 'Slack Notification Automation',
      description: 'Send notifications to Slack channels based on various triggers',
      category: 'communication',
      apps: ['slack'],
      triggers: [
        {
          id: 'new-email-trigger',
          appId: 'gmail',
          eventType: 'new_email',
          config: {
            filters: {
              from: 'important@example.com',
              subject: 'Urgent',
            },
          },
        },
        {
          id: 'schedule-trigger',
          appId: 'scheduler',
          eventType: 'time_based',
          config: {
            schedule: '0 9 * * 1', // Every Monday at 9 AM
          },
        },
      ],
      actions: [
        {
          id: 'send-slack-message',
          actionId: 'slack.chat.postMessage',
          params: {
            channel: '#general',
            text: 'New notification received',
          },
        },
      ],
      config: {
        retryPolicy: {
          maxRetries: 3,
          retryDelay: 1000,
        },
        rateLimiting: {
          maxPerMinute: 10,
        },
      },
    };
  }

  /**
   * Email Automation Template
   *
   * Automated email responses and follow-ups
   */
  static getEmailAutomationTemplate() {
    return {
      id: 'email-automation',
      name: 'Email Automation Workflow',
      description: 'Automate email responses, follow-ups, and organization',
      category: 'communication',
      apps: ['gmail', 'outlook'],
      triggers: [
        {
          id: 'new-inquiry-email',
          appId: 'gmail',
          eventType: 'new_email',
          config: {
            filters: {
              subject: 'inquiry',
              label: 'inbox',
            },
          },
        },
      ],
      actions: [
        {
          id: 'send-auto-reply',
          actionId: 'gmail.send',
          params: {
            to: '{{from}}',
            subject: 'Re: {{subject}}',
            body: 'Thank you for your inquiry. We will respond within 24 hours.',
          },
        },
        {
          id: 'add-label',
          actionId: 'gmail.modify',
          params: {
            addLabelIds: ['LABEL_INQUIRY'],
          },
        },
        {
          id: 'create-crm-record',
          actionId: 'salesforce.createLead',
          params: {
            email: '{{from}}',
            subject: '{{subject}}',
            description: '{{body}}',
          },
        },
      ],
      config: {
        retryPolicy: {
          maxRetries: 2,
          retryDelay: 2000,
        },
      },
    };
  }

  /**
   * CRM Sync Template
   *
   * Synchronize customer data across platforms
   */
  static getCRMSyncTemplate() {
    return {
      id: 'crm-sync',
      name: 'CRM Data Synchronization',
      description: 'Keep customer data in sync across CRM platforms',
      category: 'sales',
      apps: ['salesforce', 'hubspot', 'pipedrive'],
      triggers: [
        {
          id: 'new-lead',
          appId: 'webform',
          eventType: 'form_submission',
          config: {
            formId: 'lead-capture-form',
          },
        },
        {
          id: 'crm-update',
          appId: 'salesforce',
          eventType: 'record_updated',
          config: {
            objectType: 'Contact',
          },
        },
      ],
      actions: [
        {
          id: 'create-salesforce-lead',
          actionId: 'salesforce.createLead',
          params: {
            firstName: '{{firstName}}',
            lastName: '{{lastName}}',
            email: '{{email}}',
            company: '{{company}}',
          },
        },
        {
          id: 'sync-to-hubspot',
          actionId: 'hubspot.createContact',
          params: {
            email: '{{email}}',
            firstname: '{{firstName}}',
            lastname: '{{lastName}}',
          },
        },
      ],
      config: {
        retryPolicy: {
          maxRetries: 3,
          retryDelay: 1500,
        },
        batchProcessing: {
          enabled: true,
          batchSize: 10,
        },
      },
    };
  }

  /**
   * Social Media Template
   *
   * Automate social media posting and engagement
   */
  static getSocialMediaTemplate() {
    return {
      id: 'social-media',
      name: 'Social Media Automation',
      description: 'Schedule and post content across social platforms',
      category: 'marketing',
      apps: ['twitter', 'linkedin', 'facebook'],
      triggers: [
        {
          id: 'scheduled-post',
          appId: 'scheduler',
          eventType: 'time_based',
          config: {
            schedule: '0 10,14,18 * * *', // 10 AM, 2 PM, 6 PM daily
          },
        },
        {
          id: 'new-blog-post',
          appId: 'cms',
          eventType: 'content_published',
          config: {
            contentType: 'blog_post',
          },
        },
      ],
      actions: [
        {
          id: 'post-twitter',
          actionId: 'twitter.createTweet',
          params: {
            status: '{{postContent}} {{shortUrl}}',
          },
        },
        {
          id: 'post-linkedin',
          actionId: 'linkedin.share',
          params: {
            comment: '{{postContent}}',
            title: '{{postTitle}}',
            url: '{{postUrl}}',
          },
        },
        {
          id: 'post-facebook',
          actionId: 'facebook.post',
          params: {
            message: '{{postContent}}',
            link: '{{postUrl}}',
          },
        },
      ],
      config: {
        rateLimiting: {
          maxPerHour: 5,
        },
      },
    };
  }

  /**
   * Data Backup Template
   *
   * Automated backup and data synchronization
   */
  static getDataBackupTemplate() {
    return {
      id: 'data-backup',
      name: 'Automated Data Backup',
      description: 'Backup important data to cloud storage',
      category: 'data-management',
      apps: ['google-drive', 'dropbox', 'onedrive'],
      triggers: [
        {
          id: 'daily-backup',
          appId: 'scheduler',
          eventType: 'time_based',
          config: {
            schedule: '0 2 * * *', // 2 AM daily
          },
        },
      ],
      actions: [
        {
          id: 'backup-database',
          actionId: 'database.export',
          params: {
            format: 'sql',
            compress: true,
          },
        },
        {
          id: 'upload-to-drive',
          actionId: 'google-drive.upload',
          params: {
            file: '{{backupFile}}',
            folderId: 'backup_folder_id',
            name: `backup-{{date}}.sql.gz`,
          },
        },
        {
          id: 'send-confirmation',
          actionId: 'slack.chat.postMessage',
          params: {
            channel: '#notifications',
            text: 'Daily backup completed successfully',
          },
        },
      ],
      config: {
        retryPolicy: {
          maxRetries: 5,
          retryDelay: 5000,
        },
      },
    };
  }

  /**
   * Task Management Template
   *
   * Automated task creation and updates
   */
  static getTaskManagementTemplate() {
    return {
      id: 'task-management',
      name: 'Task Management Automation',
      description: 'Create and update tasks based on triggers',
      category: 'productivity',
      apps: ['asana', 'trello', 'jira', 'todoist'],
      triggers: [
        {
          id: 'new-ticket',
          appId: 'zendesk',
          eventType: 'new_ticket',
          config: {
            priority: 'high',
          },
        },
        {
          id: 'email-task',
          appId: 'gmail',
          eventType: 'new_email',
          config: {
            filters: {
              subject: 'task:',
            },
          },
        },
      ],
      actions: [
        {
          id: 'create-asana-task',
          actionId: 'asana.createTask',
          params: {
            name: '{{subject}}',
            notes: '{{body}}',
            assignee: 'assignee_id',
            project: 'project_id',
          },
        },
        {
          id: 'create-trello-card',
          actionId: 'trello.createCard',
          params: {
            name: '{{subject}}',
            desc: '{{body}}',
            idList: 'list_id',
          },
        },
      ],
      config: {
        batchProcessing: {
          enabled: true,
        },
      },
    };
  }

  /**
   * Customer Support Template
   *
   * Automated customer support workflows
   */
  static getCustomerSupportTemplate() {
    return {
      id: 'customer-support',
      name: 'Customer Support Automation',
      description: 'Automate support ticket routing and responses',
      category: 'support',
      apps: ['zendesk', 'intercom', 'slack', 'salesforce'],
      triggers: [
        {
          id: 'new-support-ticket',
          appId: 'zendesk',
          eventType: 'new_ticket',
        },
        {
          id: 'urgent-request',
          appId: 'intercom',
          eventType: 'message_received',
          config: {
            priority: 'urgent',
          },
        },
      ],
      actions: [
        {
          id: 'assign-agent',
          actionId: 'zendesk.updateTicket',
          params: {
            assigneeId: 'agent_id',
            priority: 'high',
          },
        },
        {
          id: 'notify-slack',
          actionId: 'slack.chat.postMessage',
          params: {
            channel: '#support',
            text: 'New urgent ticket: {{ticketSubject}}',
          },
        },
        {
          id: 'send-auto-reply',
          actionId: 'intercom.reply',
          params: {
            message: 'Thank you for contacting us. A support agent will respond shortly.',
          },
        },
        {
          id: 'log-in-crm',
          actionId: 'salesforce.createCase',
          params: {
            subject: '{{ticketSubject}}',
            description: '{{ticketDescription}}',
            origin: 'Zendesk',
          },
        },
      ],
      config: {
        retryPolicy: {
          maxRetries: 2,
        },
        rateLimiting: {
          maxPerMinute: 20,
        },
      },
    };
  }

  /**
   * Document Generation Template
   *
   * Automated document creation and sharing
   */
  static getDocumentGenerationTemplate() {
    return {
      id: 'document-generation',
      name: 'Document Generation Automation',
      description: 'Generate and share documents from templates',
      category: 'productivity',
      apps: ['google-docs', 'notion', 'pdf-generator', 'email'],
      triggers: [
        {
          id: 'new-client-onboarding',
          appId: 'crm',
          eventType: 'new_client',
        },
        {
          id: 'contract-request',
          appId: 'webform',
          eventType: 'form_submission',
          config: {
            formId: 'contract-request',
          },
        },
      ],
      actions: [
        {
          id: 'create-document',
          actionId: 'google-docs.create',
          params: {
            title: 'Contract - {{clientName}}',
            templateId: 'contract_template_id',
            values: {
              clientName: '{{clientName}}',
              startDate: '{{startDate}}',
              endDate: '{{endDate}}',
            },
          },
        },
        {
          id: 'generate-pdf',
          actionId: 'pdf-generator.convert',
          params: {
            sourceUrl: '{{documentUrl}}',
            filename: 'Contract-{{clientName}}.pdf',
          },
        },
        {
          id: 'send-email',
          actionId: 'gmail.send',
          params: {
            to: '{{clientEmail}}',
            subject: 'Your Contract is Ready',
            body: 'Please find attached your contract.',
            attachments: ['{{pdfFile}}'],
          },
        },
      ],
      config: {
        retryPolicy: {
          maxRetries: 3,
        },
      },
    };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZapierWorkflowTemplates };
}
