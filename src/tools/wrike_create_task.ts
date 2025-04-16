import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeTask, WrikeTaskData, WrikeCustomField } from '../types/wrike.js';
import { createWrikeClient } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

// カスタムフィールドのZodスキーマを定義
const customFieldSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()])
}).strict();

/**
 * タスクを作成するツール
 * @param server McpServerインスタンス
 */
export function registerWrikeCreateTaskTool(server: McpServer): void {
  server.tool(
    'wrike_create_task',
    {
      folder_id: z.string().describe('フォルダID'),
      title: z.string().describe('タスクのタイトル'),
      description: z.string().optional().describe('タスクの説明'),
      status: z.string().optional().describe('タスクのステータス'),
      importance: z.string().optional().describe('タスクの重要度'),
      dates: z.object({
        start: z.string().optional(),
        due: z.string().optional(),
        type: z.string().optional(),
        duration: z.number().optional()
      }).optional().describe('タスクの日付情報'),
      responsible_ids: z.array(z.string()).optional().describe('担当者のID配列'),
      custom_fields: z.array(customFieldSchema).optional().describe('カスタムフィールドの配列')
    },
    async ({ folder_id, title, description, status, importance, dates, responsible_ids, custom_fields }) => {
      try {
        logger.debug(`Creating task in folder: ${folder_id}`);
        const wrikeClient = createWrikeClient();

        const data: WrikeTaskData = {
          title,
          description,
          status,
          importance,
          dates,
          responsibles: responsible_ids
        };

        // カスタムフィールドを設定
        if (custom_fields) {
          data.customFields = custom_fields as WrikeCustomField[];
        }

        const response = await wrikeClient.client.post(`/folders/${folder_id}/tasks`, data);
        const tasks = wrikeClient.handleResponse<WrikeTask[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(tasks[0], null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error creating task:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error creating task: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
