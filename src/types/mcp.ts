import { z } from 'zod';

// McpServer tool method type definition
export interface McpServerToolOptions {
  description?: string;
  [key: string]: any;
}

export type McpServerToolHandler<T> = (args: T) => Promise<any>;

// Extend the McpServer type to include the correct tool method signature
declare module '@modelcontextprotocol/sdk/server/mcp.js' {
  interface McpServer {
    tool<T extends z.ZodRawShape>(
      name: string,
      schema: z.ZodObject<T>,
      handler: McpServerToolHandler<z.infer<z.ZodObject<T>>>,
      options?: McpServerToolOptions
    ): void;
  }
}
