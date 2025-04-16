import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Simple tool to echo a message back
 * メッセージをエコーするシンプルなツール
 * @param server McpServer instance / McpServerインスタンス
 */
export function registerEchoTool(server: McpServer): void {
  server.tool(
    'echo',
    'Echo a message back to the user',
    {
      message: z.string().describe('Message to echo back / エコーバックするメッセージ')
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
