import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * メッセージをエコーするシンプルなツール
 * @param server McpServerインスタンス
 */
export function registerEchoTool(server: McpServer): void {
  server.tool(
    'echo',
    'Echo a message back to the user',
    {
      message: z.string().describe('Message to echo back')
    },
    async ({ message }) => {
      return {
        content: [{
          type: 'text',
          text: message
        }]
      };
    }
  );
}
