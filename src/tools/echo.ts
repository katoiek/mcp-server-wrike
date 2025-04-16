import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * メッセージをエコーするシンプルなツール
 * @param server McpServerインスタンス
 */
export function registerEchoTool(server: McpServer): void {
  server.tool(
    'echo',
    {
      message: z.string().describe('エコーするメッセージ')
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
