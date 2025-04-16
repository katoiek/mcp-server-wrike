import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeComment } from '../types/wrike.js';
import { createWrikeClient, parseOptFields } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * タスクのコメントを取得するツール（レガシーメソッド）
 * @param server McpServerインスタンス
 */
export function registerWrikeGetTaskCommentsTool(server: McpServer): void {
  server.tool(
    'wrike_get_task_comments',
    {
      task_id: z.string().describe('タスクID'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ task_id, opt_fields }) => {
      try {
        logger.debug(`Getting comments for task: ${task_id}`);
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get(`/tasks/${task_id}/comments`, { params });
        const comments = wrikeClient.handleResponse<WrikeComment[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(comments, null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error getting comments for task ${task_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting task comments: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
