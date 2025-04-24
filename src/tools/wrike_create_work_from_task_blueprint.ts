import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeTaskBlueprintLaunchData, WrikeCustomField } from '../types/wrike.js';
import { createWrikeClient } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

// Custom field schema for validation
const customFieldSchema = z.object({
  id: z.string().describe('Custom field ID'),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).describe('Custom field value')
});

// Dates schema for validation
const datesSchema = z.object({
  type: z.string().optional().describe('Date type (Backlog, Milestone, Planned)'),
  duration: z.number().optional().describe('Duration in minutes'),
  start: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
  due: z.string().optional().describe('Due date in ISO format (YYYY-MM-DD)')
});

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
      description: z.string().optional().describe('Description of the task'),
      status: z.string().optional().describe('Status of the task'),
      importance: z.string().optional().describe('Importance of the task (High, Normal, Low)'),
      dates: datesSchema.optional().describe('Task dates with properties like start, due, type, duration'),
      responsibles: z.array(z.string()).optional().describe('Array of user IDs to assign to the task'),
      followers: z.array(z.string()).optional().describe('Array of user IDs to add as followers'),
      custom_fields: z.array(customFieldSchema).optional().describe('Array of custom fields')
    },
    async ({ task_blueprint_id, title, parent_id, super_task_id, description, status, importance, dates, responsibles, followers, custom_fields }) => {
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

        // Add optional parameters if provided
        if (parent_id) {
          launchData.parent = parent_id;
        }

        if (super_task_id) {
          launchData.superTask = super_task_id;
        }

        if (description) {
          launchData.description = description;
        }

        if (status) {
          launchData.status = status;
        }

        if (importance) {
          launchData.importance = importance;
        }

        if (dates) {
          launchData.dates = {};
          if (dates.type) launchData.dates.type = dates.type;
          if (dates.duration !== undefined) launchData.dates.duration = dates.duration;
          if (dates.start) launchData.dates.start = dates.start;
          if (dates.due) launchData.dates.due = dates.due;
        }

        if (responsibles && responsibles.length > 0) {
          launchData.responsibles = responsibles;
        }

        if (followers && followers.length > 0) {
          launchData.followers = followers;
        }

        if (custom_fields && custom_fields.length > 0) {
          launchData.customFields = custom_fields as WrikeCustomField[];
        }

        logger.debug('Launch data:', launchData);

        // Launch the task blueprint
        const createdTask = await wrikeClient.launchTaskBlueprint(task_blueprint_id, launchData);

        return {
          content: [{
            type: 'text',
            text: `Successfully created task from blueprint:\n${JSON.stringify(createdTask, null, 2)}`
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
