import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeComment } from '../types/wrike.js';
import { createWrikeClient, parseOptFields } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Tool to retrieve comments
 * @param server McpServer instance
 */
export function registerWrikeGetCommentsTool(server: McpServer): void {
  server.tool(
    'wrike_get_comments',
    {
      task_id: z.string().optional().describe('Task ID (retrieves comments for the task if specified)'),
      folder_id: z.string().optional().describe('Folder ID (retrieves comments for the folder if specified)'),
      comment_ids: z.array(z.string()).optional().describe('Array of comment IDs (retrieves specific comments if specified, maximum 100)'),
      opt_fields: z.string().optional().describe('Comma-separated list of field names to include')
    },
    async ({ task_id, folder_id, comment_ids, opt_fields }) => {
      try {
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);
        let comments: WrikeComment[] = [];
        let responseText = '';

        // 優先順位: comment_ids > task_id > folder_id > 全体
        if (comment_ids && comment_ids.length > 0) {
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
          const response = await wrikeClient.client.get(`/comments/${comment_ids.join(',')}`, { params });
          comments = wrikeClient.handleResponse<WrikeComment[]>(response);
          responseText = `Comments with IDs: ${comment_ids.join(', ')}`;
        }
        else if (task_id) {
          logger.debug(`Getting comments for task: ${task_id}`);
          const response = await wrikeClient.client.get(`/tasks/${task_id}/comments`, { params });
          comments = wrikeClient.handleResponse<WrikeComment[]>(response);
          responseText = `Comments for task: ${task_id}`;
        }
        else if (folder_id) {
          logger.debug(`Getting comments for folder: ${folder_id}`);
          const response = await wrikeClient.client.get(`/folders/${folder_id}/comments`, { params });
          comments = wrikeClient.handleResponse<WrikeComment[]>(response);
          responseText = `Comments for folder: ${folder_id}`;
        }
        else {
          logger.debug('Getting all comments');
          const response = await wrikeClient.client.get('/comments', { params });
          comments = wrikeClient.handleResponse<WrikeComment[]>(response);
          responseText = 'All comments';
        }

        return {
          content: [{
            type: 'text',
            text: `${responseText}\n${JSON.stringify(comments, null, 2)}`
          }]
        };
      } catch (error) {
        logger.error('Error getting comments:', error);
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
}
