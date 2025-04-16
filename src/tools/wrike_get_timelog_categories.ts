import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeTimelogCategory } from '../types/wrike.js';
import { createWrikeClient, parseOptFields } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * タイムログカテゴリ一覧を取得するツール
 * @param server McpServerインスタンス
 */
export function registerWrikeGetTimelogCategoriesTool(server: McpServer): void {
  server.tool(
    'wrike_get_timelog_categories',
    {
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ opt_fields }) => {
      try {
        logger.debug('Getting timelog categories');
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get('/timelog_categories', { params });
        const categories = wrikeClient.handleResponse<WrikeTimelogCategory[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(categories, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Error getting timelog categories:', error);
        return {
          content: [{
            type: 'text',
            text: `Error getting timelog categories: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
