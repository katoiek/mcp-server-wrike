import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeTask, WrikeTaskParams, WrikeTaskData, WrikeCustomField, WrikeCustomFieldOptional } from '../types/wrike.js';
import { createWrikeClient, parseOptFields } from './client.js';
import { logger } from '../utils/logger.js';

// カスタムフィールドのZodスキーマを定義
export const customFieldSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()])
}).strict();

/**
 * タスク関連のツールを登録する関数
 * @param server McpServerインスタンス
 */
export function registerTaskTools(server: McpServer): void {
  // タスク一覧を取得するツール
  server.tool(
    'wrike_list_tasks',
    {
      status: z.string().optional().describe('タスクのステータス（Active, Completed, Deferred, Cancelled）'),
      importance: z.string().optional().describe('タスクの重要度（High, Normal, Low）'),
      start_date: z.string().optional().describe('開始日（YYYY-MM-DD）'),
      due_date: z.string().optional().describe('期限日（YYYY-MM-DD）'),
      scheduled: z.boolean().optional().describe('スケジュールされているかどうか'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ status, importance, start_date, due_date, scheduled, opt_fields }) => {
      try {
        logger.debug('Listing Wrike tasks');
        const wrikeClient = createWrikeClient();

        const params: WrikeTaskParams = parseOptFields(opt_fields);
        if (status) params.status = status;
        if (importance) params.importance = importance;
        if (start_date) params.startDate = start_date;
        if (due_date) params.dueDate = due_date;
        if (scheduled !== undefined) params.scheduled = scheduled;

        const response = await wrikeClient.client.get('/tasks', { params });
        const tasks = wrikeClient.handleResponse<WrikeTask[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(tasks, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Error listing tasks:', error);
        return {
          content: [{
            type: 'text',
            text: `Error listing tasks: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // フォルダ内のタスクを取得するツール
  server.tool(
    'wrike_get_tasks_by_folder',
    {
      folder_id: z.string().describe('フォルダID'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ folder_id, opt_fields }) => {
      try {
        logger.debug(`Getting tasks for folder: ${folder_id}`);
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get(`/folders/${folder_id}/tasks`, { params });
        const tasks = wrikeClient.handleResponse<WrikeTask[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(tasks, null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error getting tasks for folder ${folder_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting tasks: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // 単一のタスクを取得するツール
  server.tool(
    'wrike_get_task',
    {
      task_id: z.string().describe('タスクID'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ task_id, opt_fields }) => {
      try {
        logger.debug(`Getting task: ${task_id}`);
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get(`/tasks/${task_id}`, { params });
        const tasks = wrikeClient.handleResponse<WrikeTask[]>(response);

        if (tasks.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `Task with ID ${task_id} not found`
            }],
            isError: true
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(tasks[0], null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error getting task ${task_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting task: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // タスクを作成するツール
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

  // タスクを更新するツール
  server.tool(
    'wrike_update_task',
    {
      task_id: z.string().describe('タスクID'),
      title: z.string().optional().describe('タスクのタイトル'),
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
    async ({ task_id, title, description, status, importance, dates, responsible_ids, custom_fields }) => {
      try {
        logger.debug(`Updating task: ${task_id}`);
        const wrikeClient = createWrikeClient();

        const data: WrikeTaskData = {};
        if (title !== undefined) data.title = title;
        if (description !== undefined) data.description = description;
        if (status !== undefined) data.status = status;
        if (importance !== undefined) data.importance = importance;
        if (dates !== undefined) data.dates = dates;
        if (responsible_ids !== undefined) data.responsibles = responsible_ids;
        if (custom_fields !== undefined) data.customFields = custom_fields as WrikeCustomField[];

        const response = await wrikeClient.client.put(`/tasks/${task_id}`, data);
        const tasks = wrikeClient.handleResponse<WrikeTask[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(tasks[0], null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error updating task ${task_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error updating task: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // タスクを削除するツール
  server.tool(
    'wrike_delete_task',
    {
      task_id: z.string().describe('タスクID')
    },
    async ({ task_id }) => {
      try {
        logger.debug(`Deleting task: ${task_id}`);
        const wrikeClient = createWrikeClient();

        await wrikeClient.client.delete(`/tasks/${task_id}`);

        return {
          content: [{
            type: 'text',
            text: `Task ${task_id} deleted successfully`
          }]
        };
      } catch (error) {
        logger.error(`Error deleting task ${task_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error deleting task: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // タスク履歴を取得するツール
  server.tool(
    'wrike_get_tasks_history',
    {
      task_ids: z.union([
        z.string().describe('単一のタスクID'),
        z.array(z.string()).describe('タスクIDの配列（最大100件）')
      ]).describe('タスクID'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ task_ids, opt_fields }) => {
      try {
        // 配列に変換
        const ids = Array.isArray(task_ids) ? task_ids : [task_ids];

        if (ids.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'Task IDs are required'
            }],
            isError: true
          };
        }

        if (ids.length > 100) {
          return {
            content: [{
              type: 'text',
              text: 'Maximum of 100 task IDs allowed'
            }],
            isError: true
          };
        }

        logger.debug(`Getting history for tasks: ${ids.join(',')}`);
        const wrikeClient = createWrikeClient();

        // 履歴を取得するためのパラメータを設定
        const params = parseOptFields(opt_fields);
        params.history = true;

        const response = await wrikeClient.client.get(`/tasks/${ids.join(',')}/history`, { params });
        const history = wrikeClient.handleResponse<any[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(history, null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error getting task history:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting task history: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
