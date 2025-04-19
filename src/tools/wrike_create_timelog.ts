import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeTimelog, WrikeTimelogData } from '../types/wrike.js';
import { createWrikeClient } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Tool to create a timelog
 * @param server McpServer instance
 */
export function registerWrikeCreateTimelogTool(server: McpServer): void {
  server.tool(
    'wrike_create_timelog',
    {
      task_id: z.string().describe('Task ID'),
      hours: z.number().describe('Number of hours'),
      comment: z.string().optional().describe('Comment'),
      tracked_date: z.string().optional().describe('Tracked date (YYYY-MM-DD)'),
      timelog_category_id: z.string().optional().describe('Timelog category ID')
    },
    async ({ task_id, hours, comment, tracked_date, timelog_category_id }) => {
      try {
        logger.debug(`Creating timelog for task: ${task_id}`);
        const wrikeClient = createWrikeClient();

        const data: WrikeTimelogData = {
          hours,
          comment,
          trackedDate: tracked_date,
          categoryId: timelog_category_id
        };

        const response = await wrikeClient.client.post(`/tasks/${task_id}/timelogs`, data);
        const timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(timelogs[0], null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error creating timelog:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error creating timelog: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
