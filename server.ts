#!/usr/bin/env node
import dotenv from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { WrikeClient } from './src/wrikeClient.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { parseOptFields, convertTaskId, removeUndefinedValues } from './src/utils/helpers.js';
import {
  WrikeRequestParams,
  WrikeTaskData,
  WrikeFolderData,
  WrikeSpace,
  WrikeFolder,
  WrikeTask,
  WrikeComment,
  WrikeTimelog
} from './src/types/wrike.js';
import { ToolResponse, ServerResult } from './src/types/server.js';
import { tools } from './src/types/tools.js';
import { logger, LogLevel } from './src/utils/logger.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Initialize environment configuration
 */
function initializeEnvironment() {
  // Get the directory name in ESM
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Try to load from multiple possible locations
  const envPaths = [
    path.join(__dirname, '.env'),
    path.join(process.cwd(), '.env'),
    path.join(path.dirname(process.execPath), '.env')
  ];

  let envLoaded = false;
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      logger.info(`Loading environment from: ${envPath}`);
      dotenv.config({ path: envPath });
      envLoaded = true;
      break;
    }
  }

  if (!envLoaded) {
    logger.warn('No .env file found. Using environment variables directly.');
  }

  // Configure log level from environment
  configureLogLevel();

  // Validate required environment variables
  validateRequiredEnvVars();
}

/**
 * Configure log level based on environment variable
 */
function configureLogLevel() {
  if (!process.env.LOG_LEVEL) return;

  const logLevelMap = {
    'error': LogLevel.ERROR,
    'warn': LogLevel.WARN,
    'info': LogLevel.INFO,
    'debug': LogLevel.DEBUG,
    'trace': LogLevel.TRACE
  };

  const logLevelKey = process.env.LOG_LEVEL.toLowerCase();
  if (logLevelKey in logLevelMap) {
    logger.setLogLevel(logLevelMap[logLevelKey as keyof typeof logLevelMap]);
    logger.info(`Log level set to: ${process.env.LOG_LEVEL}`);
  } else {
    logger.warn(`Unknown log level: ${process.env.LOG_LEVEL}. Using default.`);
  }
}

/**
 * Validate that all required environment variables are present
 */
function validateRequiredEnvVars() {
  if (!process.env.WRIKE_ACCESS_TOKEN) {
    logger.error('WRIKE_ACCESS_TOKEN environment variable is required');
    logger.error('Please set it in .env file or in the Claude Desktop configuration');
    logger.debug('Current environment variables:', Object.keys(process.env));
    process.exit(1);
  }
}

// Initialize environment on startup
initializeEnvironment();

// Tool handler implementations
// Each handler is separated for better maintainability and performance

/**
 * Handle echo tool request
 */
async function handleEchoTool(_wrikeClient: WrikeClient, args: any): Promise<ToolResponse> {
  const { message } = args as { message: string };
  return {
    content: [{ type: 'text', text: `Echo: ${message}` }]
  };
}

/**
 * Handle wrike_list_spaces tool request
 */
async function handleListSpacesTool(wrikeClient: WrikeClient, args: any): Promise<ToolResponse> {
  const response = await wrikeClient.getSpaces(parseOptFields(args.opt_fields));
  return {
    content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
  };
}

/**
 * Handle wrike_create_folder tool request
 */
async function handleCreateFolderTool(wrikeClient: WrikeClient, args: any): Promise<ToolResponse> {
  const { parent_id, title, description, shareds, ...opts } = args as {
    parent_id: string;
    title: string;
    description?: string;
    shareds?: string[];
    opt_fields?: string;
  };

  if (!parent_id) {
    throw new Error('parent_id is required');
  }
  if (!title) {
    throw new Error('title is required');
  }

  const folderData: WrikeFolderData = {
    title,
    description,
    shareds
  };

  // Remove undefined values
  removeUndefinedValues(folderData);

  const folder = await wrikeClient.createFolder(parent_id, folderData);

  return {
    content: [{ type: 'text', text: JSON.stringify(folder, null, 2) }]
  };
}

/**
 * Handle wrike_search_projects tool request
 */
async function handleSearchProjectsTool(wrikeClient: WrikeClient, args: any): Promise<ToolResponse> {
  const { space_id, name_pattern, archived = false, ...opts } = args as {
    space_id: string;
    name_pattern: string;
    archived?: boolean;
    opt_fields?: string;
  };

  if (!space_id) {
    throw new Error('space_id is required');
  }
  if (!name_pattern) {
    throw new Error('name_pattern is required');
  }

  const params = {
    ...parseOptFields(opts.opt_fields)
  };

  // Get all folders in the space
  const folders = await wrikeClient.getFoldersBySpace(space_id, params);

  // Filter folders that are projects and match the name pattern
  const regex = new RegExp(name_pattern, 'i');
  const projects = folders.filter(folder => {
    const isProject = folder.project !== undefined;
    const nameMatches = regex.test(folder.title);
    const archiveMatches = archived ? folder.archived : !folder.archived;
    return isProject && nameMatches && archiveMatches;
  });

  return {
    content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }]
  };
}

/**
 * Handle wrike_search_tasks tool request
 */
async function handleSearchTasksTool(wrikeClient: WrikeClient, args: any): Promise<ToolResponse> {
  const { space_id, ...searchOpts } = args as {
    space_id: string;
    title?: string;
    status?: string;
    importance?: string;
    scheduled?: boolean;
    completed?: boolean;
    authors?: string[];
    responsibles?: string[];
    opt_fields?: string;
  };

  if (!space_id) {
    throw new Error('space_id is required');
  }

  // Get all tasks in the space
  const tasks = await wrikeClient.getTasks({
    spaceId: space_id,
    ...searchOpts,
    ...parseOptFields(searchOpts.opt_fields)
  });

  return {
    content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }]
  };
}

/**
 * Handle wrike_get_task tool request
 */
async function handleGetTaskTool(wrikeClient: WrikeClient, args: any): Promise<ToolResponse> {
  const { task_id, ...opts } = args as {
    task_id: string;
    opt_fields?: string;
  };

  if (!task_id) {
    throw new Error('task_id is required');
  }

  // Convert task ID if needed
  const apiTaskId = await convertTaskId(wrikeClient, task_id);

  const params = parseOptFields(opts.opt_fields);
  const task = await wrikeClient.getTask(apiTaskId, params);

  return {
    content: [{ type: 'text', text: JSON.stringify(task, null, 2) }]
  };
}

/**
 * Handle wrike_create_task tool request
 */
async function handleCreateTaskTool(wrikeClient: WrikeClient, args: any): Promise<ToolResponse> {
  const { folder_id, title, description, status, importance, dates, responsibles, ...opts } = args as {
    folder_id: string;
    title: string;
    description?: string;
    status?: string;
    importance?: string;
    dates?: {
      start?: string;
      due?: string;
    };
    responsibles?: string[];
    opt_fields?: string;
  };

  if (!folder_id) {
    throw new Error('folder_id is required');
  }
  if (!title) {
    throw new Error('title is required');
  }

  const taskData: WrikeTaskData = {
    title,
    description,
    status,
    importance,
    dates,
    responsibles
  };

  // Remove undefined values
  removeUndefinedValues(taskData);

  const task = await wrikeClient.createTask(folder_id, taskData, parseOptFields(opts.opt_fields));

  return {
    content: [{ type: 'text', text: JSON.stringify(task, null, 2) }]
  };
}

/**
 * Handle wrike_update_task tool request
 */
async function handleUpdateTaskTool(wrikeClient: WrikeClient, args: any): Promise<ToolResponse> {
  const { task_id, title, description, status, importance, dates, responsibles, ...opts } = args as {
    task_id: string;
    title?: string;
    description?: string;
    status?: string;
    importance?: string;
    dates?: {
      start?: string;
      due?: string;
    };
    responsibles?: string[];
    opt_fields?: string;
  };

  if (!task_id) {
    throw new Error('task_id is required');
  }

  // Convert task ID if needed
  const apiTaskId = await convertTaskId(wrikeClient, task_id);

  const taskData: WrikeTaskData = {
    title,
    description,
    status,
    importance,
    dates,
    responsibles
  };

  // Remove undefined values
  removeUndefinedValues(taskData);

  const task = await wrikeClient.updateTask(apiTaskId, taskData, parseOptFields(opts.opt_fields));

  return {
    content: [{ type: 'text', text: JSON.stringify(task, null, 2) }]
  };
}

/**
 * Handle wrike_get_comments tool request
 */
async function handleGetCommentsTool(wrikeClient: WrikeClient, args: any): Promise<ToolResponse> {
  const { task_id, folder_id, comment_ids, ...opts } = args as {
    task_id?: string;
    folder_id?: string;
    comment_ids?: string[];
    opt_fields?: string;
  };

  let comments: WrikeComment[] = [];
  const params = parseOptFields(opts.opt_fields);

  if (task_id) {
    // Convert task ID if needed
    const apiTaskId = await convertTaskId(wrikeClient, task_id);
    comments = await wrikeClient.getCommentsByTask(apiTaskId, params);
  } else if (folder_id) {
    comments = await wrikeClient.getCommentsByFolder(folder_id, params);
  } else if (comment_ids && comment_ids.length > 0) {
    comments = await wrikeClient.getCommentsByIds(comment_ids, params);
  } else {
    comments = await wrikeClient.getAllComments(params);
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(comments, null, 2) }]
  };
}

/**
 * Handle wrike_get_task_comments tool request
 */
async function handleGetTaskCommentsTool(wrikeClient: WrikeClient, args: any): Promise<ToolResponse> {
  const { task_id, ...opts } = args as {
    task_id: string;
    opt_fields?: string;
  };

  if (!task_id) {
    throw new Error('task_id is required');
  }

  // Convert task ID if needed
  const apiTaskId = await convertTaskId(wrikeClient, task_id);

  const comments = await wrikeClient.getCommentsByTask(apiTaskId, parseOptFields(opts.opt_fields));

  return {
    content: [{ type: 'text', text: JSON.stringify(comments, null, 2) }]
  };
}

/**
 * Handle wrike_create_comment tool request
 */
async function handleCreateCommentTool(wrikeClient: WrikeClient, args: any): Promise<ToolResponse> {
  const { task_id, text, ...opts } = args as {
    task_id: string;
    text: string;
    opt_fields?: string;
  };

  if (!task_id) {
    throw new Error('task_id is required');
  }
  if (!text) {
    throw new Error('text is required');
  }

  // Convert task ID if needed
  const apiTaskId = await convertTaskId(wrikeClient, task_id);

  const comment = await wrikeClient.createComment(apiTaskId, text, parseOptFields(opts.opt_fields));

  return {
    content: [{ type: 'text', text: JSON.stringify(comment, null, 2) }]
  };
}

/**
 * Handle wrike_get_project tool request
 */
async function handleGetProjectTool(wrikeClient: WrikeClient, args: any): Promise<ToolResponse> {
  const { project_id, ...opts } = args as {
    project_id: string;
    opt_fields?: string;
  };

  if (!project_id) {
    throw new Error('project_id is required');
  }

  const folder = await wrikeClient.getFolder(project_id, parseOptFields(opts.opt_fields));

  if (!folder.project) {
    throw new Error(`Folder ${project_id} is not a project`);
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(folder, null, 2) }]
  };
}

/**
 * Handle wrike_get_contacts tool request
 */
async function handleGetContactsTool(wrikeClient: WrikeClient, args: any): Promise<ToolResponse> {
  const contacts = await wrikeClient.getContacts(parseOptFields(args.opt_fields));

  return {
    content: [{ type: 'text', text: JSON.stringify(contacts, null, 2) }]
  };
}

/**
 * Handle wrike_get_timelogs tool request
 */
async function handleGetTimelogsTool(wrikeClient: WrikeClient, args: any): Promise<ToolResponse> {
  const { task_id, contact_id, folder_id, category_id, timelog_ids, start_date, end_date, ...opts } = args as {
    task_id?: string;
    contact_id?: string;
    folder_id?: string;
    category_id?: string;
    timelog_ids?: string;
    start_date?: string;
    end_date?: string;
    opt_fields?: string;
  };

  let timelogs: WrikeTimelog[] = [];
  const params: WrikeRequestParams = {
    ...parseOptFields(opts.opt_fields)
  };

  // Add date filters if provided
  if (start_date || end_date) {
    // Format: trackedDate={start:YYYY-MM-DD,end:YYYY-MM-DD}
    const dateFilter: string[] = [];

    if (start_date) {
      dateFilter.push(`start:${start_date}`);
    }

    if (end_date) {
      dateFilter.push(`end:${end_date}`);
    }

    params.trackedDate = `{${dateFilter.join(',')}}`;
  }

  // Get timelogs based on provided filters - prioritize in this order:
  // 1. Specific timelog IDs
  // 2. Task ID
  // 3. Folder ID
  // 4. Contact ID
  // 5. Category ID
  // 6. All timelogs (no filter)
  if (timelog_ids) {
    timelogs = await wrikeClient.getTimelogsById(timelog_ids, params);
  } else if (task_id) {
    // Convert task ID if needed
    const apiTaskId = await convertTaskId(wrikeClient, task_id);
    timelogs = await wrikeClient.getTimelogsByTask(apiTaskId, params);
  } else if (folder_id) {
    timelogs = await wrikeClient.getTimelogsByFolder(folder_id, params);
  } else if (contact_id) {
    timelogs = await wrikeClient.getTimelogsByContact(contact_id, params);
  } else if (category_id) {
    timelogs = await wrikeClient.getTimelogsByCategory(category_id, params);
  } else {
    timelogs = await wrikeClient.getTimelogs(params);
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(timelogs, null, 2) }]
  };
}

// Type definitions for request handlers
type ToolHandlerRequest = {
  params: {
    name: string;
    arguments?: Record<string, any>;
    _meta?: Record<string, any>;
  };
  method: string;
};

type ToolHandlerResponse = ServerResult | Record<string, unknown>;

/**
 * Create a memory-efficient tool handler with improved error handling and timeout
 */
function toolHandler(wrikeClient: WrikeClient) {
  return async (request: ToolHandlerRequest): Promise<ToolHandlerResponse> => {
    // Set a timeout to ensure the function doesn't run indefinitely
    const TIMEOUT_MS = 30000; // 30 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Tool execution timed out after ${TIMEOUT_MS/1000} seconds`));
      }, TIMEOUT_MS);
    });

    try {
      if (!request.params.arguments) {
        throw new Error('No arguments provided');
      }

      // Store arguments in a local variable that can be garbage collected
      const args = request.params.arguments;

      // Log tool request (debug level)
      logger.debug(`Tool request received: ${request.params.name}`, {
        tool: request.params.name,
        args: Object.keys(args)
      });

      // Use Promise.race to implement timeout
      const result = await Promise.race([
        (async () => {
          // Use a map of handlers for better maintainability and performance
          const handlers: Record<string, (client: WrikeClient, args: any) => Promise<ToolResponse>> = {
            'echo': handleEchoTool,
            'wrike_list_spaces': handleListSpacesTool,
            'wrike_create_folder': handleCreateFolderTool,
            'wrike_search_projects': handleSearchProjectsTool,
            'wrike_search_tasks': handleSearchTasksTool,
            'wrike_get_task': handleGetTaskTool,
            'wrike_create_task': handleCreateTaskTool,
            'wrike_update_task': handleUpdateTaskTool,
            'wrike_get_comments': handleGetCommentsTool,
            'wrike_get_task_comments': handleGetTaskCommentsTool,
            'wrike_create_comment': handleCreateCommentTool,
            'wrike_get_project': handleGetProjectTool,
            'wrike_get_contacts': handleGetContactsTool,
            'wrike_get_timelogs': handleGetTimelogsTool
          };

          const handler = handlers[request.params.name];
          if (!handler) {
            throw new Error(`Unknown tool: ${request.params.name}`);
          }

          return await handler(wrikeClient, args);
        })(),
        timeoutPromise
      ]);

      // Return the result with the correct type for MCP SDK
      // Convert to unknown first to avoid TypeScript error
      return result as unknown as ToolHandlerResponse;
    } catch (error) {
      logger.error('Tool execution error:', error);
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }]
      } as ToolHandlerResponse;
    }
  };
}

/**
 * Set up console logging to use our logger
 */
function setupConsoleLogging(): void {
  const originalDebug = console.debug;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;

  // Override console methods to use our logger
  console.debug = function(message: any, ...args: any[]) {
    logger.debug(String(message));
    originalDebug(message, ...args);
  };

  console.info = function(message: any, ...args: any[]) {
    // Filter MCP messages
    if (typeof message === 'string' &&
        (message.includes('Message from client') || message.includes('Message from server'))) {
      logger.debug(message); // Downgrade to debug
    } else {
      logger.info(String(message));
    }
    originalInfo(message, ...args);
  };

  console.warn = function(message: any, ...args: any[]) {
    logger.warn(String(message));
    originalWarn(message, ...args);
  };

  console.error = function(message: any, ...args: any[]) {
    // Use a direct string check to avoid infinite recursion with logger.error
    if (typeof message === 'string' && message.includes('Maximum call stack size exceeded')) {
      // Use originalError directly for stack overflow errors
      originalError(message, ...args);
    } else {
      logger.error(String(message));
      originalError(message, ...args);
    }
  };
}

/**
 * Create prompt handlers
 */
function createPromptHandlers() {
  return {
    listPrompts: async () => ({
      prompts: []
    }),
    getPrompt: async () => {
      throw new Error('Prompts not supported');
    }
  };
}

/**
 * Create resource handlers
 */
function createResourceHandlers() {
  return {
    listResources: async () => ({
      resources: []
    }),
    listResourceTemplates: async () => ({
      templates: []
    }),
    readResource: async () => {
      throw new Error('Resources not supported');
    }
  };
}

/**
 * Process tool schemas to make them compatible with MCP
 */
function processToolSchemas() {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: {
      type: 'object',
      properties: tool.schema.shape
    }
  }));
}

/**
 * Set up error handling for the process
 */
function setupErrorHandling() {
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection:', { reason, promise });
  });

  // Handle termination signals
  const cleanup = () => {
    logger.info('Cleaning up resources...');
    // Let the process exit naturally which will clean up all resources
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', () => {
    logger.info('Process exiting...');
  });
}

/**
 * Main function to start the server
 */
async function main(): Promise<void> {
  // Create server
  const server = new Server(
    {
      name: 'wrike-mcp-server',
      version: '1.0.0',
      description: 'Wrike API integration for MCP'
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {}
      }
    }
  );

  // Initialize Wrike client
  const accessToken = process.env.WRIKE_ACCESS_TOKEN as string;
  const host = process.env.WRIKE_HOST || 'www.wrike.com';

  if (!accessToken || accessToken === 'YOUR_ACTUAL_WRIKE_ACCESS_TOKEN' || accessToken === 'YOUR_WRIKE_ACCESS_TOKEN_HERE') {
    logger.error('Invalid Wrike API token. Please set a valid token in your Claude Desktop configuration.');
    logger.error('You can generate a token in your Wrike account under Apps & Integrations > API.');
    throw new Error('Invalid Wrike API token. Please set a valid token in your Claude Desktop configuration.');
  }

  logger.info('Creating Wrike client');

  const wrikeClient = new WrikeClient(accessToken, host);

  // Test the connection
  logger.info('Testing Wrike API connection...');
  try {
    await wrikeClient.getSpaces();
    logger.info('Wrike API connection successful');
  } catch (error) {
    logger.error('Wrike API connection test failed');
    // If it's an authentication error, we should stop
    if (error instanceof Error && error.message.includes('Authentication Error')) {
      throw error;
    }
    // For other errors, continue anyway
  }

  // Set up custom logging for MCP messages
  setupConsoleLogging();

  // Set up error handling
  setupErrorHandling();

  // Set request handlers
  server.setRequestHandler(CallToolRequestSchema, toolHandler(wrikeClient));

  // Process tool schemas to make them compatible with MCP
  const processedTools = processToolSchemas();

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: processedTools
  }));

  // Add prompt handlers
  const promptHandlers = createPromptHandlers();
  server.setRequestHandler(ListPromptsRequestSchema, promptHandlers.listPrompts);
  server.setRequestHandler(GetPromptRequestSchema, promptHandlers.getPrompt);

  // Add resource handlers
  const resourceHandlers = createResourceHandlers();
  server.setRequestHandler(ListResourcesRequestSchema, resourceHandlers.listResources);
  server.setRequestHandler(ListResourceTemplatesRequestSchema, resourceHandlers.listResourceTemplates);
  server.setRequestHandler(ReadResourceRequestSchema, resourceHandlers.readResource);

  // Start server with stdio transport
  const transport = new StdioServerTransport();

  // Connect to the transport
  await server.connect(transport);

  // The transport will automatically disconnect when the client closes
  logger.info('Server connected and ready to process requests');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  console.error('Error stack:', error.stack);
  process.exit(1);
});
