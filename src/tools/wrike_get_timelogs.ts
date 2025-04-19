import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeTimelog } from '../types/wrike.js';
import { createWrikeClient, parseOptFields } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Tool to retrieve timelogs
 * @param server McpServer instance
 */
export function registerWrikeGetTimelogsTool(server: McpServer): void {
  server.tool(
    'wrike_get_timelogs',
    {
      task_id: z.string().optional().describe('Task ID (retrieves timelogs for the task if specified)'),
      contact_id: z.string().optional().describe('Contact ID (retrieves timelogs for the contact if specified)'),
      folder_id: z.string().optional().describe('Folder ID (retrieves timelogs for the folder if specified)'),
      category_id: z.string().optional().describe('Category ID (retrieves timelogs for the category if specified)'),
      start_date: z.string().optional().describe('開始日（YYYY-MM-DD）'),
      end_date: z.string().optional().describe('終了日（YYYY-MM-DD）'),
      me: z.boolean().optional().describe('Whether to retrieve only your own timelogs'),
      opt_fields: z.string().optional().describe('Comma-separated list of field names to include')
    },
    async ({ task_id, contact_id, folder_id, category_id, start_date, end_date, me, opt_fields }) => {
      try {
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);
        let timelogs: WrikeTimelog[] = [];
        let responseText = '';

        if (start_date) params.startDate = start_date;
        if (end_date) params.endDate = end_date;
        if (me !== undefined) params.me = me;

        // 優先順位: task_id > contact_id > folder_id > category_id > 全体
        if (task_id) {
          logger.debug(`Getting timelogs for task: ${task_id}`);
          const response = await wrikeClient.client.get(`/tasks/${task_id}/timelogs`, { params });
          timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);
          responseText = `Timelogs for task: ${task_id}`;
        }
        else if (contact_id) {
          logger.debug(`Getting timelogs for contact: ${contact_id}`);
          const response = await wrikeClient.client.get(`/contacts/${contact_id}/timelogs`, { params });
          timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);
          responseText = `Timelogs for contact: ${contact_id}`;
        }
        else if (folder_id) {
          logger.debug(`Getting timelogs for folder: ${folder_id}`);
          const response = await wrikeClient.client.get(`/folders/${folder_id}/timelogs`, { params });
          timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);
          responseText = `Timelogs for folder: ${folder_id}`;
        }
        else if (category_id) {
          logger.debug(`Getting timelogs for category: ${category_id}`);
          const response = await wrikeClient.client.get(`/timelog_categories/${category_id}/timelogs`, { params });
          timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);
          responseText = `Timelogs for category: ${category_id}`;
        }
        else {
          logger.debug('Getting all timelogs');
          const response = await wrikeClient.client.get('/timelogs', { params });
          timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);
          responseText = 'All timelogs';
        }

        return {
          content: [{
            type: 'text',
            text: `${responseText}\n${JSON.stringify(timelogs, null, 2)}`
          }]
        };
      } catch (error) {
        logger.error('Error getting timelogs:', error);
        return {
          content: [{
            type: 'text',
            text: `Error getting timelogs: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
