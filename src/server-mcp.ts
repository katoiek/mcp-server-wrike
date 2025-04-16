import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllWrikeTools } from './tools/index.js';
import { logger } from './utils/logger.js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables / 環境変数を読み込む
dotenv.config();

/**
 * Function to create and start the MCP server
 * MCPサーバーを作成して起動する関数
 */
async function startServer() {
  try {
    // Create MCP server / MCPサーバーを作成
    const server = new McpServer({
      name: 'Wrike MCP Server',
      version: '1.0.0',
      description: 'Model Context Protocol server for Wrike API integration'
    });

    // Register all Wrike-related tools / すべてのWrike関連ツールを登録
    registerAllWrikeTools(server);

    // Start the server using standard input/output
    // Only log to file, not to standard output
    // 標準入出力を使用してサーバーを起動
    // ファイルにのみログを記録し、標準出力には書き込まない
    logger.info('Starting Wrike MCP Server...');

    // Use StdioServerTransport for JSON-RPC communication
    // StdioServerTransportを使用してJSON-RPC通信を行う
    const transport = new StdioServerTransport();

    // Connect the server / サーバーを接続
    await server.connect(transport);

    // Log successful connection (do not write to standard output)
    // 接続成功をログに記録（標準出力には書き込まない）
    logger.info('Wrike MCP Server started successfully');
  } catch (error) {
    // エラーをログファイルに記録（標準エラー出力には書き込まない）
    logger.error('Error starting Wrike MCP Server:', error);

    // 標準エラー出力にJSON形式でエラーを出力
    // これによりMCPクライアントがエラーを適切に処理できる
    const errorMessage = {
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: `Server initialization error: ${error instanceof Error ? error.message : String(error)}`
      },
      id: null
    };

    // 標準エラー出力にJSON形式でエラーを書き込む
    // ファイルディスクリプタ2は標準エラー出力
    fs.writeSync(2, JSON.stringify(errorMessage) + '\n');

    process.exit(1);
  }
}

// サーバーを起動
startServer();
