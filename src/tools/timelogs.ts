import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeTimelog, WrikeTimelogCategory, WrikeTimelogData } from '../types/wrike.js';
import { createWrikeClient, parseOptFields } from './client.js';
import { logger } from '../utils/logger.js';

/**
 * タイムログ関連のツールを登録する関数
 * @param server McpServerインスタンス
 */
export function registerTimelogTools(server: McpServer): void {
  // タイムログ一覧を取得するツール
  server.tool(
    'wrike_list_timelogs',
    {
      start_date: z.string().optional().describe('開始日（YYYY-MM-DD）'),
      end_date: z.string().optional().describe('終了日（YYYY-MM-DD）'),
      me: z.boolean().optional().describe('自分のタイムログのみを取得するかどうか'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ start_date, end_date, me, opt_fields }) => {
      try {
        logger.debug('Listing Wrike timelogs');
        const wrikeClient = createWrikeClient();

        const params = parseOptFields(opt_fields);
        if (start_date) params.startDate = start_date;
        if (end_date) params.endDate = end_date;
        if (me !== undefined) params.me = me;

        const response = await wrikeClient.client.get('/timelogs', { params });
        const timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(timelogs, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Error listing timelogs:', error);
        return {
          content: [{
            type: 'text',
            text: `Error listing timelogs: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // タスクのタイムログを取得するツール
  server.tool(
    'wrike_get_timelogs_by_task',
    {
      task_id: z.string().describe('タスクID'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ task_id, opt_fields }) => {
      try {
        logger.debug(`Getting timelogs for task: ${task_id}`);
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get(`/tasks/${task_id}/timelogs`, { params });
        const timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(timelogs, null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error getting timelogs for task ${task_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting timelogs: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // 連絡先のタイムログを取得するツール
  server.tool(
    'wrike_get_timelogs_by_contact',
    {
      contact_id: z.string().describe('連絡先ID'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ contact_id, opt_fields }) => {
      try {
        logger.debug(`Getting timelogs for contact: ${contact_id}`);
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get(`/contacts/${contact_id}/timelogs`, { params });
        const timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(timelogs, null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error getting timelogs for contact ${contact_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting timelogs: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // フォルダのタイムログを取得するツール
  server.tool(
    'wrike_get_timelogs_by_folder',
    {
      folder_id: z.string().describe('フォルダID'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ folder_id, opt_fields }) => {
      try {
        logger.debug(`Getting timelogs for folder: ${folder_id}`);
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get(`/folders/${folder_id}/timelogs`, { params });
        const timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(timelogs, null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error getting timelogs for folder ${folder_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting timelogs: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // カテゴリのタイムログを取得するツール
  server.tool(
    'wrike_get_timelogs_by_category',
    {
      category_id: z.string().describe('カテゴリID'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ category_id, opt_fields }) => {
      try {
        logger.debug(`Getting timelogs for category: ${category_id}`);
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get(`/timelog_categories/${category_id}/timelogs`, { params });
        const timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(timelogs, null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error getting timelogs for category ${category_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting timelogs: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // タイムログカテゴリ一覧を取得するツール
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

  // タイムログを作成するツール
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

  // タイムログを更新するツール
  server.tool(
    'wrike_update_timelog',
    {
      timelog_id: z.string().describe('タイムログID'),
      hours: z.number().optional().describe('時間数'),
      comment: z.string().optional().describe('コメント'),
      tracked_date: z.string().optional().describe('記録日（YYYY-MM-DD）'),
      timelog_category_id: z.string().optional().describe('タイムログカテゴリID')
    },
    async ({ timelog_id, hours, comment, tracked_date, timelog_category_id }) => {
      try {
        logger.debug(`Updating timelog: ${timelog_id}`);
        const wrikeClient = createWrikeClient();

        // WrikeTimelogDataには必須フィールドがあるため、更新時にも必要
        const data: Partial<WrikeTimelogData> = {};
        if (hours !== undefined) data.hours = hours;
        if (comment !== undefined) data.comment = comment;
        if (tracked_date !== undefined) data.trackedDate = tracked_date;
        if (timelog_category_id !== undefined) data.categoryId = timelog_category_id;

        const response = await wrikeClient.client.put(`/timelogs/${timelog_id}`, data);
        const timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(timelogs[0], null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error updating timelog ${timelog_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error updating timelog: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // タイムログを削除するツール
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
