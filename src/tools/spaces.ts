import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeSpace, WrikeRequestParams } from '../types/wrike.js';
import { createWrikeClient, parseOptFields } from './client.js';
import { logger } from '../utils/logger.js';

/**
 * スペース関連のツールを登録する関数
 * @param server McpServerインスタンス
 */
export function registerSpaceTools(server: McpServer): void {
  // スペース一覧を取得するツール
  server.tool(
    'wrike_list_spaces',
    {
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ opt_fields }) => {
      try {
        logger.debug('Listing Wrike spaces');
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get('/spaces', { params });
        const spaces = wrikeClient.handleResponse<WrikeSpace[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(spaces, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Error listing spaces:', error);
        return {
          content: [{
            type: 'text',
            text: `Error listing spaces: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // 特定のスペースを取得するツール
  server.tool(
    'wrike_get_space',
    {
      space_id: z.string().describe('取得するスペースのID'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ space_id, opt_fields }) => {
      try {
        logger.debug(`Getting Wrike space: ${space_id}`);
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get(`/spaces/${space_id}`, { params });
        const spaces = wrikeClient.handleResponse<WrikeSpace[]>(response);

        if (spaces.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `Space with ID ${space_id} not found`
            }],
            isError: true
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(spaces[0], null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error getting space ${space_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting space: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
