import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeTask } from '../types/wrike.js';
import { createWrikeClient, parseOptFields } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Tool to retrieve task information
 * @param server McpServer instance
 */
export function registerWrikeGetTaskTool(server: McpServer): void {
  server.tool(
    'wrike_get_task',
    {
      task_id: z.string().optional().describe('Task ID (retrieves a specific task if specified)'),
      folder_id: z.string().optional().describe('Folder ID (retrieves tasks within the folder if specified)'),
      opt_fields: z.string().optional().describe('Comma-separated list of field names to include')
    },
    async ({ task_id, folder_id, opt_fields }) => {
      try {
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);
        let tasks: WrikeTask[] = [];
        let responseText = '';

        // 優先順位: task_id > folder_id > 全体
        if (task_id) {
          logger.debug(`Getting task: ${task_id}`);
          const response = await wrikeClient.client.get(`/tasks/${task_id}`, { params });
          tasks = wrikeClient.handleResponse<WrikeTask[]>(response);
          responseText = `Task with ID: ${task_id}`;
        }
        else if (folder_id) {
          logger.debug(`Getting tasks for folder: ${folder_id}`);
          const response = await wrikeClient.client.get(`/folders/${folder_id}/tasks`, { params });
          tasks = wrikeClient.handleResponse<WrikeTask[]>(response);
          responseText = `Tasks in folder: ${folder_id}`;
        }
        else {
          logger.debug('Getting all tasks');
          const response = await wrikeClient.client.get('/tasks', { params });
          tasks = wrikeClient.handleResponse<WrikeTask[]>(response);
          responseText = 'All tasks';
        }

        if (tasks.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No tasks found for the given criteria`
            }],
            isError: false
          };
        }

        return {
          content: [{
            type: 'text',
            text: `${responseText}\n${JSON.stringify(tasks, null, 2)}`
          }]
        };
      } catch (error) {
        logger.error(`Error getting task:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting task: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
