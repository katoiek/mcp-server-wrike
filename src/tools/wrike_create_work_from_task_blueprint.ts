import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeTaskBlueprintLaunchData } from '../types/wrike.js';
import { createWrikeClient } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

// No custom schemas needed for task blueprint launch

/**
 * Tool to create work from a task blueprint in Wrike
 * @param server McpServer instance
 */
export function registerWrikeCreateWorkFromTaskBlueprintTool(server: McpServer): void {
  server.tool(
    'wrike_create_work_from_task_blueprint',
    {
      task_blueprint_id: z.string().describe('ID of the task blueprint to launch'),
      title: z.string().describe('Title for the created task'),
      parent_id: z.string().optional().describe('ID of parent folder or project (Either this parameter or super_task_id is required)'),
      super_task_id: z.string().optional().describe('ID of parent task to add work as a subtask (Either this parameter or parent_id is required)'),
      title_prefix: z.string().optional().describe('Title prefix for all copied tasks'),
      copy_descriptions: z.boolean().optional().describe('Copy descriptions or leave empty (default: true)'),
      notify_responsibles: z.boolean().optional().describe('Notify those responsible (default: true)'),
      copy_responsibles: z.boolean().optional().describe('Copy those responsible (default: true)'),
      copy_custom_fields: z.boolean().optional().describe('Copy custom fields (default: true)'),
      copy_attachments: z.boolean().optional().describe('Copy attachments (default: false)'),
      reschedule_date: z.string().optional().describe('Date to use in task rescheduling (format: YYYY-MM-DD)'),
      reschedule_mode: z.enum(['Start', 'start', 'End', 'end']).optional().describe('Mode for rescheduling: Start/start or End/end'),
      entry_limit: z.number().min(1).max(250).optional().describe('Maximum number of tasks/folders in tree for copy (1-250, default: 250)')
    },
    async ({ task_blueprint_id, title, parent_id, super_task_id, title_prefix, copy_descriptions, notify_responsibles, copy_responsibles, copy_custom_fields, copy_attachments, reschedule_date, reschedule_mode, entry_limit }) => {
      try {
        const wrikeClient = createWrikeClient();

        // Validate that either parent_id or super_task_id is provided
        if (!parent_id && !super_task_id) {
          throw new Error('Either parent_id or super_task_id must be provided');
        }

        logger.debug(`Launching task blueprint: ${task_blueprint_id}`);

        // Prepare launch data
        const launchData: WrikeTaskBlueprintLaunchData = {
          title
        };

        // Add required parameters
        if (parent_id) {
          launchData.parent = parent_id;
        }

        if (super_task_id) {
          launchData.superTask = super_task_id;
        }

        // Add optional parameters if provided
        if (title_prefix) {
          launchData.titlePrefix = title_prefix;
        }

        if (copy_descriptions !== undefined) {
          launchData.copyDescriptions = copy_descriptions;
        }

        if (notify_responsibles !== undefined) {
          launchData.notifyResponsibles = notify_responsibles;
        }

        if (copy_responsibles !== undefined) {
          launchData.copyResponsibles = copy_responsibles;
        }

        if (copy_custom_fields !== undefined) {
          launchData.copyCustomFields = copy_custom_fields;
        }

        if (copy_attachments !== undefined) {
          launchData.copyAttachments = copy_attachments;
        }

        if (reschedule_date) {
          launchData.rescheduleDate = reschedule_date;
        }

        if (reschedule_mode) {
          launchData.rescheduleMode = reschedule_mode;
        }

        if (entry_limit) {
          launchData.entryLimit = entry_limit;
        }

        logger.debug('Launch data:', launchData);

        // Launch the task blueprint asynchronously
        const asyncJobId = await wrikeClient.launchTaskBlueprint(task_blueprint_id, launchData);

        return {
          content: [{
            type: 'text',
            text: `Successfully launched task blueprint. Async job ID: ${asyncJobId}`
          }]
        };
      } catch (error) {
        logger.error('Error creating task from blueprint:', error);

        // Provide more detailed error information
        let errorMessage = (error as Error).message;
        if ((error as any).response && (error as any).response.data) {
          errorMessage += ` - Details: ${JSON.stringify((error as any).response.data)}`;
        }

        return {
          content: [{
            type: 'text',
            text: `Error creating task from blueprint: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );
}
