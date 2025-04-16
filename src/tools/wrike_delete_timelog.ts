import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createWrikeClient } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * タイムログを削除するツール
 * @param server McpServerインスタンス
 */
export function registerWrikeDeleteTimelogTool(server: McpServer): void {
  server.tool(
    'wrike_delete_timelog',
    {
      timelog_id: z.string().describe('タイムログID')
    },
    async ({ timelog_id }) => {
      try {
        logger.debug(`Deleting timelog: ${timelog_id}`);
        const wrikeClient = createWrikeClient();

        await wrikeClient.client.delete(`/timelogs/${timelog_id}`);

        return {
          content: [{
            type: 'text',
            text: `Timelog ${timelog_id} deleted successfully`
          }]
        };
      } catch (error) {
        logger.error(`Error deleting timelog ${timelog_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error deleting timelog: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
