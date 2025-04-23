import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeTask } from '../types/wrike.js';
import { createWrikeClient } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Tool to create work (task) from a custom item type
 * @param server McpServer instance
 */
export function registerWrikeCreateWorkFromCustomItemTool(server: McpServer): void {
  server.tool(
    'wrike_create_work_from_custom_item',
    {
      custom_item_type_id: z.string().describe('ID of the custom item type to create work from'),
      parent_id: z.string().optional().describe('ID of parent folder or project. Either this parameter or super_task_id is required.'),
      super_task_id: z.string().optional().describe('ID of parent task. Set this to add work as a subtask. Either this parameter or parent_id is required.'),
      title: z.string().describe('Title of the task to create'),
      description: z.string().optional().describe('Description of the task'),
      status: z.string().optional().describe('Status of the task'),
      importance: z.string().optional().describe('Importance of the task (High, Normal, Low)'),
      dates: z.object({
        start: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
        due: z.string().optional().describe('Due date in ISO format (YYYY-MM-DD)'),
        type: z.string().optional().describe('Date type (Backlog, Milestone, Planned)'),
        duration: z.number().optional().describe('Duration in minutes')
      }).optional().describe('Task dates'),
      assignees: z.array(z.string()).optional().describe('Array of user IDs to assign to the task'),
      followers: z.array(z.string()).optional().describe('Array of user IDs to add as followers'),
      custom_fields: z.array(
        z.object({
          id: z.string().describe('Custom field ID'),
          value: z.union([z.string(), z.number(), z.boolean(), z.null()]).describe('Custom field value')
        })
      ).optional().describe('Custom fields for the task')
    },
    async ({ custom_item_type_id, parent_id, super_task_id, title, description, status, importance, dates, assignees, followers, custom_fields }) => {
      try {
        const wrikeClient = createWrikeClient();

        // Validate that either parent_id or super_task_id is provided
        if (!parent_id && !super_task_id) {
          throw new Error('Either parent_id or super_task_id must be provided');
        }

        if (parent_id && super_task_id) {
          throw new Error('parent_id and super_task_id cannot be set simultaneously');
        }

        // Prepare task data
        const taskData: any = {
          title
        };

        // Add parameters to query parameters
        const queryParams: any = {};

        if (parent_id) {
          queryParams.parentId = parent_id;
        }

        if (super_task_id) {
          queryParams.superTaskId = super_task_id;
        }

        if (description) {
          taskData.description = description;
        }

        if (status) {
          taskData.status = status;
        }

        if (importance) {
          taskData.importance = importance;
        }

        if (dates) {
          taskData.dates = {};
          if (dates.start) taskData.dates.start = dates.start;
          if (dates.due) taskData.dates.due = dates.due;
          if (dates.type) taskData.dates.type = dates.type;
          if (dates.duration !== undefined) taskData.dates.duration = dates.duration;
        }

        if (assignees && assignees.length > 0) {
          taskData.responsibles = assignees;
        }

        if (followers && followers.length > 0) {
          taskData.followers = followers;
        }

        if (custom_fields && custom_fields.length > 0) {
          taskData.customFields = custom_fields;
        }

        logger.debug(`Creating task from custom item type ${custom_item_type_id}`, { taskData, queryParams });

        // Make the API call to create the task using the correct endpoint
        const response = await wrikeClient.client.post(
          `/custom_item_types/${custom_item_type_id}/instantiate`,
          taskData,
          { params: queryParams }
        );
        const createdTask = wrikeClient.handleResponse<WrikeTask[]>(response);

        return {
          content: [{
            type: 'text',
            text: `Task created successfully from custom item type:\n${JSON.stringify(createdTask, null, 2)}`
          }]
        };
      } catch (error) {
        logger.error(`Error creating task from custom item type:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error creating task from custom item type: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
