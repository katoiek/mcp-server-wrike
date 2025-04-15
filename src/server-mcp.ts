import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllWrikeTools } from './tools/index.js';
import { logger } from './utils/logger.js';
import dotenv from 'dotenv';

// 環境変数を読み込む
dotenv.config();

/**
 * MCPサーバーを作成して起動する関数
 */
async function startServer() {
  try {
    // MCPサーバーを作成
    const server = new McpServer({
      name: 'Wrike MCP Server',
      version: '1.0.0',
      description: 'Model Context Protocol server for Wrike API integration'
    });

    // すべてのWrike関連ツールを登録
    registerAllWrikeTools(server);

    // 標準入出力を使用してサーバーを起動
    logger.info('Starting Wrike MCP Server...');
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('Wrike MCP Server started successfully');
  } catch (error) {
    logger.error('Error starting Wrike MCP Server:', error);
    process.exit(1);
  }
}

// サーバーを起動
startServer();
