import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerSpaceTools } from './spaces.js';
import { registerFolderTools } from './folders.js';
import { registerTaskTools } from './tasks.js';
import { registerCommentTools } from './comments.js';
import { registerContactTools } from './contacts.js';
import { registerTimelogTools } from './timelogs.js';

/**
 * すべてのWrike関連ツールをMCPサーバーに登録する関数
 * @param server McpServerインスタンス
 */
export function registerAllWrikeTools(server: McpServer): void {
  // 各カテゴリのツールを登録
  registerSpaceTools(server);
  registerFolderTools(server);
  registerTaskTools(server);
  registerCommentTools(server);
  registerContactTools(server);
  registerTimelogTools(server);
}

// 個別のツールモジュールをエクスポート
export * from './spaces.js';
export * from './folders.js';
export * from './tasks.js';
export * from './comments.js';
export * from './contacts.js';
export * from './timelogs.js';
export * from './client.js';
