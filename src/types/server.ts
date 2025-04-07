// Define custom types for the MCP SDK Server
import { z } from 'zod';

// Define the ToolResponse type
export interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

// Define the ServerResult type for MCP SDK compatibility
export interface ServerResult {
  [key: string]: unknown;
  _meta?: {
    [key: string]: unknown;
  };
  tools?: Array<{
    [key: string]: unknown;
    description?: string;
    name?: string;
    inputSchema?: {
      [key: string]: unknown;
      type?: 'object';
      properties?: {
        [key: string]: unknown;
      };
    };
  }>;
  nextCursor?: string;
}

// Define the Server configuration
export interface ServerConfig {
  name: string;
  version: string;
  transport: any;
  handlers: {
    [key: string]: any;
  };
}

// Define the request schemas as constants with string names
export const REQUEST_SCHEMAS = {
  CALL_TOOL: 'tools/call',
  LIST_TOOLS: 'tools/list',
  LIST_PROMPTS: 'prompts/list',
  GET_PROMPT: 'prompts/get',
  LIST_RESOURCES: 'resources/list',
  LIST_RESOURCE_TEMPLATES: 'resources/templates/list',
  READ_RESOURCE: 'resources/read'
};
