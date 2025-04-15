import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeComment, WrikeCommentData } from '../types/wrike.js';
import { createWrikeClient, parseOptFields } from './client.js';
import { logger } from '../utils/logger.js';

/**
 * コメント関連のツールを登録する関数
 * @param server McpServerインスタンス
 */
export function registerCommentTools(server: McpServer): void {
  // すべてのコメントを取得するツール
  server.tool(
    'wrike_list_comments',
    {
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ opt_fields }) => {
      try {
        logger.debug('Listing all Wrike comments');
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get('/comments', { params });
        const comments = wrikeClient.handleResponse<WrikeComment[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(comments, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Error listing comments:', error);
        return {
          content: [{
            type: 'text',
            text: `Error listing comments: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // タスクのコメントを取得するツール
  server.tool(
    'wrike_get_comments_by_task',
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
            text: `Error getting comments: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // フォルダのコメントを取得するツール
  server.tool(
    'wrike_get_comments_by_folder',
    {
      folder_id: z.string().describe('フォルダID'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ folder_id, opt_fields }) => {
      try {
        logger.debug(`Getting comments for folder: ${folder_id}`);
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get(`/folders/${folder_id}/comments`, { params });
        const comments = wrikeClient.handleResponse<WrikeComment[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(comments, null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error getting comments for folder ${folder_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting comments: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // 複数のコメントをIDで取得するツール
  server.tool(
    'wrike_get_comments_by_ids',
    {
      comment_ids: z.array(z.string()).describe('コメントIDの配列（最大100件）'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ comment_ids, opt_fields }) => {
      try {
        if (!comment_ids || comment_ids.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'Comment IDs are required'
            }],
            isError: true
          };
        }

        if (comment_ids.length > 100) {
          return {
            content: [{
              type: 'text',
              text: 'Maximum of 100 comment IDs allowed'
            }],
            isError: true
          };
        }

        logger.debug(`Getting comments by IDs: ${comment_ids.join(',')}`);
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get(`/comments/${comment_ids.join(',')}`, { params });
        const comments = wrikeClient.handleResponse<WrikeComment[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(comments, null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error getting comments by IDs:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting comments: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // コメントを作成するツール
  server.tool(
    'wrike_create_comment',
    {
      task_id: z.string().describe('タスクID'),
      text: z.string().describe('コメントのテキスト'),
      plain_text: z.boolean().optional().describe('プレーンテキストとして扱うかどうか')
    },
    async ({ task_id, text, plain_text }) => {
      try {
        logger.debug(`Creating comment for task: ${task_id}`);
        const wrikeClient = createWrikeClient();

        const data: WrikeCommentData = {
          text,
          plainText: plain_text
        };

        const response = await wrikeClient.client.post(`/tasks/${task_id}/comments`, data);
        const comments = wrikeClient.handleResponse<WrikeComment[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(comments[0], null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error creating comment:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error creating comment: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
