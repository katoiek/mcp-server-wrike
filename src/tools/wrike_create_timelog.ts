import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeTimelog, WrikeTimelogData } from '../types/wrike.js';
import { createWrikeClient } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * タイムログを作成するツール
 * @param server McpServerインスタンス
 */
export function registerWrikeCreateTimelogTool(server: McpServer): void {
  server.tool(
    'wrike_create_timelog',
    {
      task_id: z.string().describe('タスクID'),
      hours: z.number().describe('時間数'),
      comment: z.string().optional().describe('コメント'),
      tracked_date: z.string().optional().describe('記録日（YYYY-MM-DD）'),
      timelog_category_id: z.string().optional().describe('タイムログカテゴリID')
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
