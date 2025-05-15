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
      trackedDate: z.string().optional().describe('Date for which timelog was recorded. Format: yyyy-MM-dd'),
      timelog_category_id: z.string().optional().describe('Timelog category ID')
    },
    async ({ timelog_id, hours, comment, trackedDate, timelog_category_id }) => {
      try {
        logger.debug(`Updating timelog: ${timelog_id}`);
        const wrikeClient = createWrikeClient();

        // WrikeTimelogData has required fields, so we need to specify only what we want to update
        const data: Partial<WrikeTimelogData> = {};
        if (hours !== undefined) data.hours = hours;
        if (comment !== undefined) data.comment = comment;
        if (trackedDate !== undefined) data.trackedDate = trackedDate;
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
