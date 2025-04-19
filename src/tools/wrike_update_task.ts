import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeTask, WrikeTaskData, WrikeCustomField } from '../types/wrike.js';
import { createWrikeClient } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

// Define Zod schema for custom fields
const customFieldSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()])
}).strict();

/**
 * Tool to update a task
 * @param server McpServer instance
 */
export function registerWrikeUpdateTaskTool(server: McpServer): void {
  server.tool(
    'wrike_update_task',
    {
      task_id: z.string().describe('Task ID'),
      title: z.string().optional().describe('Task title'),
      description: z.string().optional().describe('Task description'),
      status: z.string().optional().describe('Task status'),
      importance: z.string().optional().describe('Task importance'),
      dates: z.object({
        start: z.string().optional(),
        due: z.string().optional(),
        type: z.string().optional(),
        duration: z.number().optional()
      }).optional().describe('Task date information'),
      responsible_ids: z.array(z.string()).optional().describe('Array of responsible user IDs'),
      custom_fields: z.array(customFieldSchema).optional().describe('Array of custom fields')
    },
    async ({ task_id, title, description, status, importance, dates, responsible_ids, custom_fields }) => {
      try {
        logger.debug(`Updating task: ${task_id}`);
        const wrikeClient = createWrikeClient();

        const data: WrikeTaskData = {};
        if (title !== undefined) data.title = title;
        if (description !== undefined) data.description = description;
        if (status !== undefined) data.status = status;
        if (importance !== undefined) data.importance = importance;
        if (dates !== undefined) data.dates = dates;
        if (responsible_ids !== undefined) data.responsibles = responsible_ids;
        if (custom_fields !== undefined) data.customFields = custom_fields as WrikeCustomField[];

        const response = await wrikeClient.client.put(`/tasks/${task_id}`, data);
        const tasks = wrikeClient.handleResponse<WrikeTask[]>(response);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(tasks[0], null, 2)
          }]
        };
      } catch (error) {
        logger.error(`Error updating task ${task_id}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error updating task: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );
}
