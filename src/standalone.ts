#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { WrikeClient } from './utils/wrikeClient.js';
import { parseOptFields, convertTaskId } from './utils/helpers.js';
import { tools } from './types/tools.js';
import { z } from 'zod';
import { ToolResponse } from './types/server.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Initialize environment variables

// Check for required environment variables
if (!process.env.WRIKE_ACCESS_TOKEN) {
  console.error(JSON.stringify({
    message: 'Error: WRIKE_ACCESS_TOKEN environment variable is required'
  }));
  process.exit(1);
}

// Initialize Wrike client
const wrikeClient = new WrikeClient(
  process.env.WRIKE_ACCESS_TOKEN as string,
  process.env.WRIKE_HOST || 'www.wrike.com'
);

// Define the CallToolRequest interface
interface CallToolRequest {
  params: {
    name: string;
    arguments?: any;
    _meta?: {
      progressToken?: string | number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  method: string;
}

// Create tool handler
function toolHandler(wrikeClient: WrikeClient) {
  return async (request: any) => {
    console.error(JSON.stringify({
      message: 'Received CallToolRequest',
      tool: request.params.name
    }));

    try {
      if (!request.params.arguments) {
        throw new Error('No arguments provided');
      }

      const args = request.params.arguments || {};

      switch (request.params.name) {
        case 'echo': {
          const { message } = args as { message: string };
          return {
            content: [{ type: 'text', text: `Echo: ${message}` }]
          } as any;
        }

        case 'wrike_list_spaces': {
          const { opt_fields } = args as { opt_fields?: string };
          const response = await wrikeClient.getSpaces(parseOptFields(opt_fields));
          return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
          } as any;
        }

        case 'wrike_get_space': {
          const { space_id, opt_fields } = args as { space_id: string; opt_fields?: string };
          if (!space_id) {
            throw new Error('space_id is required');
          }
          const response = await wrikeClient.getSpace(space_id, parseOptFields(opt_fields));
          return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
          } as any;
        }

        case 'wrike_get_task': {
          const { task_id, opt_fields } = args as { task_id: string; opt_fields?: string };
          if (!task_id) {
            throw new Error('task_id is required');
          }
          const response = await wrikeClient.getTask(task_id, parseOptFields(opt_fields));
          return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
          } as any;
        }

        case 'wrike_get_tasks_history': {
          const { task_ids, opt_fields } = args as { task_ids: string[] | string; opt_fields?: string };
          if (!task_ids || (Array.isArray(task_ids) && task_ids.length === 0)) {
            throw new Error('task_ids is required');
          }
          const response = await wrikeClient.getTasksHistory(task_ids, parseOptFields(opt_fields));
          return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
          } as any;
        }

        // Add other tool handlers here...

        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    } catch (error) {
      console.error(JSON.stringify({
        message: 'Error handling tool request',
        error: (error as Error).message,
        stack: (error as Error).stack
      }));

      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }]
      } as any;
    }
  };
}

// Initialize server
console.error(JSON.stringify({
  message: "Initializing server..."
}));

// Convert tool schemas to string names for the Server constructor
const toolSchemas = tools.map(tool => ({
  ...tool,
  schema: tool.schema.describe(tool.name)
}));

// Create server
const server = new Server({
  name: 'wrike-mcp-server',
  version: '1.0.0'
});

// Register request handlers
server.setRequestHandler(CallToolRequestSchema, toolHandler(wrikeClient));
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: toolSchemas }));
server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: [] }));
server.setRequestHandler(GetPromptRequestSchema, async () => {
  throw new Error('Prompts not supported');
});
server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: [] }));
server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({ templates: [] }));
server.setRequestHandler(ReadResourceRequestSchema, async () => {
  throw new Error('Resources not supported');
});

console.error(JSON.stringify({
  message: "Server initialized and ready to handle requests"
}));

// Keep the process alive
process.stdin.resume();

// Handle process termination
process.on('SIGINT', () => {
  console.error(JSON.stringify({
    message: "Server shutting down..."
  }));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error(JSON.stringify({
    message: "Server shutting down..."
  }));
  process.exit(0);
});

// Log any unhandled errors
process.on('uncaughtException', (error) => {
  console.error(JSON.stringify({
    message: "Uncaught exception",
    error: error.message,
    stack: error.stack
  }));
});

process.on('unhandledRejection', (reason) => {
  console.error(JSON.stringify({
    message: "Unhandled promise rejection",
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined
  }));
});
