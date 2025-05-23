import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeTask, WrikeTaskData, WrikeCustomField } from '../types/wrike.js';
import { createWrikeClient } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

// Define Zod schema for custom fields
const customFieldSchema = z.object({
  id: z.string().describe('Custom field ID'),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).describe('Custom field value')
}).strict();

/**
 * Tool to create a task
 * @param server McpServer instance
 */
export function registerWrikeCreateTaskTool(server: McpServer): void {
  const datesSchema = z.object({
    start: z.string().optional().describe('Start date in YYYY-MM-DD format'),
    due: z.string().optional().describe('Due date in YYYY-MM-DD format'),
    type: z.string().optional().describe('Date type'),
    duration: z.number().optional().describe('Duration in days')
  }).optional().describe('Task dates object with start and due dates');

  server.tool(
    'wrike_create_task',
    'Create a new task in a Wrike project or folder',
    {
      folder_id: z.string().describe('ID of the folder/project to create the task in'),
      title: z.string().describe('Title of the task'),
      description: z.string().optional().describe('Description of the task'),
      status: z.string().optional().describe('Status of the task (Active, Completed, Deferred, Cancelled)'),
      importance: z.string().optional().describe('Importance of the task (High, Normal, Low)'),
      dates: datesSchema,
      responsibles: z.array(z.string()).optional().describe('Array of user IDs to assign as responsibles'),
      followers: z.array(z.string()).optional().describe('Array of user IDs to add as followers'),
      parent_id: z.string().optional().describe('The parent task ID to set this task under (creates a subtask)'),
      custom_fields: z.array(customFieldSchema).optional().describe('Array of custom fields to set on the task')
    },
    async ({ folder_id, title, description, status, importance, dates, responsibles, followers, parent_id, custom_fields }) => {
      try {
        logger.debug(`Creating task in folder: ${folder_id}`);
        const wrikeClient = createWrikeClient();

        const data: WrikeTaskData = {
          title,
          description,
          status,
          importance,
          dates,
          responsibles
        };

        // フォロワーを設定
        if (followers && followers.length > 0) {
          data.followers = followers;
        }

        // 親タスクを設定（サブタスクとして作成）
        if (parent_id) {
          data.superTaskIds = [parent_id];
        }

        // カスタムフィールドを設定
        if (custom_fields && custom_fields.length > 0) {
          data.customFields = custom_fields as WrikeCustomField[];
        }

        const response = await wrikeClient.client.post(`/folders/${folder_id}/tasks`, data);
        const tasks = wrikeClient.handleResponse<WrikeTask[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(tasks[0], null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error creating task:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error creating task: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
