import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeComment, WrikeCommentData } from '../types/wrike.js';
import { createWrikeClient } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Tool to create a comment
 * @param server McpServer instance
 */
export function registerWrikeCreateCommentTool(server: McpServer): void {
  server.tool(
    'wrike_create_comment',
    {
      task_id: z.string().describe('Task ID'),
      text: z.string().describe('Comment text'),
      plain_text: z.boolean().optional().describe('Whether to treat as plain text')
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
