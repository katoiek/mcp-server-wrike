import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeContact } from '../types/wrike.js';
import { createWrikeClient, parseOptFields } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Tool to retrieve contact information
 * @param server McpServer instance
 */
export function registerWrikeGetContactsTool(server: McpServer): void {
  server.tool(
    'wrike_get_contacts',
    {
      contact_ids: z.array(z.string()).optional().describe('Array of contact IDs (retrieves specific contacts if specified, maximum 100)'),
      me: z.boolean().optional().describe('Whether to retrieve only your own contact information'),
      opt_fields: z.string().optional().describe('Comma-separated list of field names to include')
    },
    async ({ contact_ids, me, opt_fields }) => {
      try {
        const wrikeClient = createWrikeClient();
        const params = parseOptFields(opt_fields);
        let contacts: WrikeContact[] = [];
        let responseText = '';

        if (me !== undefined) params.me = me;

        // 優先順位: contact_ids > 全体
        if (contact_ids && contact_ids.length > 0) {
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
          const response = await wrikeClient.client.get(`/contacts/${contact_ids.join(',')}`, { params });
          contacts = wrikeClient.handleResponse<WrikeContact[]>(response);
          responseText = `Contacts with IDs: ${contact_ids.join(', ')}`;
        }
        else {
          logger.debug('Getting all contacts');
          const response = await wrikeClient.client.get('/contacts', { params });
          contacts = wrikeClient.handleResponse<WrikeContact[]>(response);
          responseText = me ? 'My contact information' : 'All contacts';
        }

        return {
          content: [{
            type: 'text',
            text: `${responseText}\n${JSON.stringify(contacts, null, 2)}`
          }]
        };
      } catch (error) {
        logger.error('Error getting contacts:', error);
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
