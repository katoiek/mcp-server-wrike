import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeContact } from '../types/wrike.js';
import { createWrikeClient, parseOptFields } from './client.js';
import { logger } from '../utils/logger.js';

/**
 * 連絡先関連のツールを登録する関数
 * @param server McpServerインスタンス
 */
export function registerContactTools(server: McpServer): void {
  // 連絡先一覧を取得するツール
  server.tool(
    'wrike_list_contacts',
    {
      me: z.boolean().optional().describe('自分の連絡先情報のみを取得するかどうか'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ me, opt_fields }) => {
      try {
        logger.debug('Listing Wrike contacts');
        const wrikeClient = createWrikeClient();

        const params = parseOptFields(opt_fields);
        if (me !== undefined) params.me = me;

        const response = await wrikeClient.client.get('/contacts', { params });
        const contacts = wrikeClient.handleResponse<WrikeContact[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(contacts, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Error listing contacts:', error);
        return {
          content: [{
            type: 'text',
            text: `Error listing contacts: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // 連絡先をIDで取得するツール
  server.tool(
    'wrike_get_contact',
    {
      contact_id: z.string().describe('連絡先ID'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ contact_id, opt_fields }) => {
      try {
        logger.debug(`Getting contact: ${contact_id}`);
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get(`/contacts/${contact_id}`, { params });
        const contacts = wrikeClient.handleResponse<WrikeContact[]>(response);

        if (contacts.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `Contact with ID ${contact_id} not found`
            }],
            isError: true
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(contacts[0], null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error getting contact ${contact_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting contact: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // 複数の連絡先をIDで取得するツール
  server.tool(
    'wrike_get_contacts_by_ids',
    {
      contact_ids: z.array(z.string()).describe('連絡先IDの配列（最大100件）'),
      opt_fields: z.string().optional().describe('カンマ区切りのフィールド名リスト')
    },
    async ({ contact_ids, opt_fields }) => {
      try {
        if (!contact_ids || contact_ids.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'Contact IDs are required'
            }],
            isError: true
          };
        }

        if (contact_ids.length > 100) {
          return {
            content: [{
              type: 'text',
              text: 'Maximum of 100 contact IDs allowed'
            }],
            isError: true
          };
        }

        logger.debug(`Getting contacts by IDs: ${contact_ids.join(',')}`);
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);

        const response = await wrikeClient.client.get(`/contacts/${contact_ids.join(',')}`, { params });
        const contacts = wrikeClient.handleResponse<WrikeContact[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(contacts, null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error getting contacts by IDs:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error getting contacts: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
