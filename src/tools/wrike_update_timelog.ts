import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeTimelog, WrikeTimelogData } from '../types/wrike.js';
import { createWrikeClient } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Tool to update a timelog
 * @param server McpServer instance
 */
export function registerWrikeUpdateTimelogTool(server: McpServer): void {
  server.tool(
    'wrike_update_timelog',
    {
      timelog_id: z.string().describe('Timelog ID'),
      hours: z.number().optional().describe('Number of hours'),
      comment: z.string().optional().describe('Comment'),
      tracked_date: z.string().optional().describe('Tracked date (YYYY-MM-DD)'),
      timelog_category_id: z.string().optional().describe('Timelog category ID')
    },
    async ({ timelog_id, hours, comment, tracked_date, timelog_category_id }) => {
      try {
        logger.debug(`Updating timelog: ${timelog_id}`);
        const wrikeClient = createWrikeClient();

        // WrikeTimelogDataには必須フィールドがあるため、更新時にも必要
        const data: Partial<WrikeTimelogData> = {};
        if (hours !== undefined) data.hours = hours;
        if (comment !== undefined) data.comment = comment;
        if (tracked_date !== undefined) data.trackedDate = tracked_date;
        if (timelog_category_id !== undefined) data.categoryId = timelog_category_id;

        const response = await wrikeClient.client.put(`/timelogs/${timelog_id}`, data);
        const timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(timelogs[0], null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error updating timelog ${timelog_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error updating timelog: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
