import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WrikeTimelog } from '../types/wrike.js';
import { createWrikeClient, parseOptFields } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

// Define Zod schema for date range (for createdDate, updatedDate)
const DateTimeRangeSchema = z.object({
  start: z.string().optional().describe('Range start (YYYY-MM-DDThh:mm:ss) - time part is required'),
  end: z.string().optional().describe('Range end (YYYY-MM-DDThh:mm:ss) - time part is required'),
  equal: z.string().optional().describe('Date exact match value (YYYY-MM-DDThh:mm:ss) - time part is required')
}).optional();

// Schema for trackedDate (time part is optional)
const TrackedDateRangeSchema = z.object({
  start: z.string().optional().describe('Range start (YYYY-MM-DD[THH:mm:ss]) - time part is optional'),
  end: z.string().optional().describe('Range end (YYYY-MM-DD[THH:mm:ss]) - time part is optional'),
  equal: z.string().optional().describe('Date exact match value (YYYY-MM-DD[THH:mm:ss]) - time part is optional')
}).optional();

/**
 * Tool to retrieve timelogs
 * @param server McpServer instance
 */
export function registerWrikeGetTimelogsTool(server: McpServer): void {
  server.tool(
    'wrike_get_timelogs',
    {
      task_id: z.string().optional().describe('Task ID (retrieves timelogs for the task if specified)'),
      contact_id: z.string().optional().describe('Contact ID (retrieves timelogs for the contact if specified)'),
      folder_id: z.string().optional().describe('Folder ID (retrieves timelogs for the folder if specified)'),
      category_id: z.string().optional().describe('Category ID (retrieves timelogs for the category if specified)'),
      timelog_ids: z.array(z.string()).optional().describe('Array of timelog IDs to retrieve (up to 100)'),
      createdDate: z.string().or(DateTimeRangeSchema).optional().describe('Created date filter, exact match or range (example: {"start":"2024-01-01T00:00:00Z"} - time part is required)'),
      updatedDate: z.string().or(DateTimeRangeSchema).optional().describe('Last updated date filter, exact match or range (example: {"start":"2024-01-01T00:00:00Z"} - time part is required)'),
      trackedDate: z.string().or(TrackedDateRangeSchema).optional().describe('Tracked date filter, exact match or range (example: {"start":"2024-01-01"} - time part is optional)'),
      me: z.boolean().optional().describe('If true - only timelogs created by current user are returned'),
      descendants: z.boolean().optional().describe('Adds all descendant tasks to search scope (default: true)'),
      plain_text: z.boolean().optional().describe('Get comment text as plain text, HTML otherwise (default: false)'),
      timelog_categories: z.array(z.string()).optional().describe('Get timelog records for specified categories'),
      billing_types: z.array(z.enum(['Billable', 'NonBillable'])).optional().describe('Billing type filter (Billable, NonBillable)'),
      approval_statuses: z.array(z.enum(['Pending', 'Approved', 'Rejected', 'Cancelled', 'Draft'])).optional().describe('Approval status filter'),
      fields: z.array(z.string()).optional().describe('Optional fields to include in the response (e.g. approvalStatus, billingType)'),
      opt_fields: z.string().optional().describe('Comma-separated list of field names to include (legacy parameter)')
    },
    async ({
      task_id,
      contact_id,
      folder_id,
      category_id,
      timelog_ids,
      createdDate,
      updatedDate,
      trackedDate,
      me,
      descendants,
      plain_text,
      timelog_categories,
      billing_types,
      approval_statuses,
      fields,
      opt_fields
    }) => {
      try {
        const wrikeClient = createWrikeClient();

        // Add interceptor to process parameters before request
        wrikeClient.client.interceptors.request.use(config => {
          // Special handling for date parameters
          if (config.params) {
            const dateParams = ['createdDate', 'updatedDate', 'trackedDate'];

            dateParams.forEach(paramName => {
              if (config.params[paramName] && typeof config.params[paramName] === 'string') {
                const paramValue = config.params[paramName];

                // Date parameters need special handling to prevent URL encoding
                if (paramValue.startsWith('{') && paramValue.endsWith('}')) {
                  // Remove from params to avoid URL encoding
                  delete config.params[paramName];

                  // Add parameter directly to URL
                  if (config.url) {
                    const separator = config.url.includes('?') ? '&' : '?';
                    config.url += `${separator}${paramName}=${paramValue}`;
                    logger.debug(`Added ${paramName} directly to URL: ${config.url}`);
                  }
                }
                // Format: start:"2024-04-01T00:00:00Z" (without {})
                else if (paramValue.includes(':')) {
                  // Wrap with {} to match Wrike API expected format
                  const wrappedValue = `{${paramValue}}`;
                  delete config.params[paramName];

                  // Add parameter directly to URL
                  if (config.url) {
                    const separator = config.url.includes('?') ? '&' : '?';
                    config.url += `${separator}${paramName}=${wrappedValue}`;
                    logger.debug(`Added ${paramName} with wrapped value directly to URL: ${config.url}`);
                  }
                }
              }
            });
          }

          return config;
        });
        const params: Record<string, any> = {};
        let timelogs: WrikeTimelog[] = [];
        let responseText = '';

        // Process date parameters
        const processDateParam = (param: any, paramName: string, requireTime: boolean = false) => {
          if (!param || (typeof param === 'string' && param.trim() === '')) {
            return; // Skip empty parameters
          }

          if (typeof param === 'string') {
            // String parameter
            let paramValue: any;

            // 1. Format: {start:"2024-04-01T00:00:00Z"} or {"start":"2024-04-01T00:00:00Z"}
            if (param.startsWith('{') && param.endsWith('}')) {
              try {
                // Standard JSON format (with double quotes)
                paramValue = JSON.parse(param);
                logger.debug(`Standard JSON parsed for ${paramName}:`, paramValue);
              } catch (e) {
                // If standard JSON parsing fails
                try {
                  // Fix keys without quotes
                  // Example: {start:"2024-04-01T00:00:00Z"} → {"start":"2024-04-01T00:00:00Z"}
                  let fixedJson = param;

                  // Add quotes to keys
                  fixedJson = fixedJson.replace(/\{([^}]+)\}/g, function(match, contents) {
                    return '{' + contents
                      .split(',')
                      .map(pair => {
                        // Split key and value
                        const colonIndex = pair.indexOf(':');
                        if (colonIndex === -1) return pair;

                        const key = pair.substring(0, colonIndex).trim();
                        const value = pair.substring(colonIndex + 1).trim();

                        // Values need quotes
                        if (!value.startsWith('"') && !value.endsWith('"')) {
                          logger.debug(`Value needs quotes: ${value}`);
                          // Validate date format
                          if (key === 'start' || key === 'end' || key === 'equal') {
                            if (requireTime) {
                              // Date format with required time part (YYYY-MM-DDThh:mm:ss)
                              const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?$/;
                              if (dateTimeRegex.test(value)) {
                                return `"${key}":"${value}"`;
                              } else {
                                logger.debug(`Value is not a valid datetime format: ${value}`);
                                // 時刻部分がない場合は追加
                                if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                                  return `"${key}":"${value}T00:00:00Z"`;
                                }
                                return `"${key}":${value}`;
                              }
                            } else {
                              // 時刻部分がオプションの日付形式（YYYY-MM-DD または YYYY-MM-DDThh:mm:ss）
                              const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?)?$/;
                              if (dateRegex.test(value)) {
                                return `"${key}":"${value}"`;
                              } else {
                                logger.debug(`Value is not a valid date format: ${value}`);
                                return `"${key}":${value}`;
                              }
                            }
                          }
                          // その他のパラメータ
                          return `"${key}":"${value}"`;
                        }

                        return `"${key}":${value}`;
                      })
                      .join(',') + '}';
                  });

                  logger.debug(`Attempting to parse fixed JSON for ${paramName}:`, fixedJson);
                  paramValue = JSON.parse(fixedJson);
                  logger.debug(`Fixed JSON parsed for ${paramName}:`, paramValue);
                } catch (jsonError) {
                  // それでもパースできない場合は、元の文字列をそのまま使用
                  logger.debug(`Failed to parse as JSON for ${paramName}, using as is:`, param);
                  paramValue = param;
                }
              }
            }
            // 2. start:"2024-04-01T00:00:00Z",end:"2024-12-31T23:59:59Z" 形式の場合（{}なし）
            else if (param.includes(':')) {
              try {
                // {}で囲んでJSONとして解析
                const fixedJson = '{' + param + '}';
                logger.debug(`Converting to JSON format: ${fixedJson}`);

                // キーにクォーテーションを追加し、値のクォーテーションを確認
                const jsonWithQuotes = fixedJson
                  .replace(/\{([^}]+)\}/g, function(match, contents) {
                    return '{' + contents
                      .split(',')
                      .map(pair => {
                        // キーと値を分離
                        const colonIndex = pair.indexOf(':');
                        if (colonIndex === -1) return pair;

                        const key = pair.substring(0, colonIndex).trim();
                        const value = pair.substring(colonIndex + 1).trim();

                        // 値にクォーテーションがない場合は追加
                        if (!value.startsWith('"') && !value.endsWith('"')) {
                          logger.debug(`Value needs quotes: ${value}`);
                          // 日付形式の検証
                          if (key === 'start' || key === 'end' || key === 'equal') {
                            if (requireTime) {
                              // 時刻部分が必須の日付形式（YYYY-MM-DDThh:mm:ss）
                              const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?$/;
                              if (dateTimeRegex.test(value)) {
                                return `"${key}":"${value}"`;
                              } else {
                                logger.debug(`Value is not a valid datetime format: ${value}`);
                                // 時刻部分がない場合は追加
                                if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                                  return `"${key}":"${value}T00:00:00Z"`;
                                }
                                return `"${key}":${value}`;
                              }
                            } else {
                              // 時刻部分がオプションの日付形式（YYYY-MM-DD または YYYY-MM-DDThh:mm:ss）
                              const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?)?$/;
                              if (dateRegex.test(value)) {
                                return `"${key}":"${value}"`;
                              } else {
                                logger.debug(`Value is not a valid date format: ${value}`);
                                return `"${key}":${value}`;
                              }
                            }
                          }
                          // その他のパラメータ
                          return `"${key}":"${value}"`;
                        }

                        return `"${key}":${value}`;
                      })
                      .join(',') + '}';
                  });

                logger.debug(`Attempting to parse with quotes: ${jsonWithQuotes}`);
                paramValue = JSON.parse(jsonWithQuotes);
                logger.debug(`Parsed ${paramName} from key-value format:`, paramValue);
              } catch (e) {
                // パースに失敗した場合は、元の文字列をそのまま使用
                logger.debug(`Failed to parse key-value format for ${paramName}, using as is:`, param);
                paramValue = param;
              }
            }
            // 3. その他の形式（単純な文字列）
            else {
              logger.debug(`Using ${paramName} as plain string:`, param);
              paramValue = param;
            }

            params[paramName] = paramValue;
          } else {
            // オブジェクトの場合はそのまま使用
            params[paramName] = param;
            logger.debug(`Using ${paramName} as object:`, param);
          }
        };

        // Process date parameters
        processDateParam(createdDate, 'createdDate', true); // Time part is required
        processDateParam(updatedDate, 'updatedDate', true); // Time part is required
        processDateParam(trackedDate, 'trackedDate', false); // Time part is optional

        // Process other parameters
        if (me !== undefined) params.me = me;
        if (descendants !== undefined) params.descendants = descendants;
        if (plain_text !== undefined) params.plainText = plain_text;

        if (timelog_categories && timelog_categories.length > 0) {
          params.timelogCategories = timelog_categories;
        }

        if (billing_types && billing_types.length > 0) {
          params.billingTypes = billing_types;
        }

        if (approval_statuses && approval_statuses.length > 0) {
          params.approvalStatuses = approval_statuses;
        }

        // Process field parameters
        if (fields && fields.length > 0) {
          params.fields = fields.join(',');
        } else if (opt_fields) {
          // For backward compatibility
          Object.assign(params, parseOptFields(opt_fields));
        }

        // Finalize parameters
        // Wrike API expects date parameters in specific format
        const finalizeParams = () => {
          // Process date parameters
          ['createdDate', 'updatedDate', 'trackedDate'].forEach(paramName => {
            if (params[paramName]) {
              // For string parameters, special handling to prevent URL encoding
              if (typeof params[paramName] === 'string') {
                // If already in {...} format
                if (params[paramName].startsWith('{') && params[paramName].endsWith('}')) {
                  // Use as is
                  return;
                }
              }

              // For object parameters, convert to Wrike API expected format
              if (typeof params[paramName] === 'object') {
                const dateObj = params[paramName];

                // Convert date object to string for query parameter
                try {
                  // Wrike API expected format: {"start":"2024-04-01T00:00:00Z"}
                  let jsonStr = JSON.stringify(dateObj);

                  params[paramName] = jsonStr;
                  logger.debug(`Converted ${paramName} to string format:`, params[paramName]);
                } catch (e) {
                  logger.error(`Error converting ${paramName} to string:`, e);
                }
              }
            }
          });
        };

        finalizeParams();
        logger.debug('Final request params:', JSON.stringify(params, null, 2));

        // Convert empty string parameters to null
        const cleanEmptyParams = (id: string | undefined) => {
          return id && id.trim() !== '' ? id : null;
        };

        const cleanTaskId = cleanEmptyParams(task_id);
        const cleanContactId = cleanEmptyParams(contact_id);
        const cleanFolderId = cleanEmptyParams(folder_id);
        const cleanCategoryId = cleanEmptyParams(category_id);

        // Priority: timelog_ids > task_id > contact_id > folder_id > category_id > all
        if (timelog_ids && timelog_ids.length > 0) {
          if (timelog_ids.length > 100) {
            throw new Error('Maximum 100 timelog IDs can be requested at once');
          }

          logger.debug(`Getting timelogs by IDs: ${timelog_ids.join(',')}`);
          const response = await wrikeClient.client.get(`/timelogs/${timelog_ids.join(',')}`, { params });
          timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);
          responseText = `Timelogs by IDs: ${timelog_ids.join(',')}`;
        }
        else if (cleanTaskId) {
          logger.debug(`Getting timelogs for task: ${cleanTaskId}`);
          const response = await wrikeClient.client.get(`/tasks/${cleanTaskId}/timelogs`, { params });
          timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);
          responseText = `Timelogs for task: ${cleanTaskId}`;
        }
        else if (cleanContactId) {
          logger.debug(`Getting timelogs for contact: ${cleanContactId}`);
          const response = await wrikeClient.client.get(`/contacts/${cleanContactId}/timelogs`, { params });
          timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);
          responseText = `Timelogs for contact: ${cleanContactId}`;
        }
        else if (cleanFolderId) {
          logger.debug(`Getting timelogs for folder: ${cleanFolderId}`);
          const response = await wrikeClient.client.get(`/folders/${cleanFolderId}/timelogs`, { params });
          timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);
          responseText = `Timelogs for folder: ${cleanFolderId}`;
        }
        else if (cleanCategoryId) {
          logger.debug(`Getting timelogs for category: ${cleanCategoryId}`);
          const response = await wrikeClient.client.get(`/timelog_categories/${cleanCategoryId}/timelogs`, { params });
          timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);
          responseText = `Timelogs for category: ${cleanCategoryId}`;
        }
        else {
          logger.debug('Getting all timelogs');
          const response = await wrikeClient.client.get('/timelogs', { params });
          timelogs = wrikeClient.handleResponse<WrikeTimelog[]>(response);
          responseText = 'All timelogs';
        }

        return {
          content: [{
            type: 'text',
            text: `${responseText}\n${JSON.stringify(timelogs, null, 2)}`
          }]
        };
      } catch (error: any) {
        logger.error('Error in wrike_get_timelogs:', error);
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message || 'Unknown error'}`
          }]
        };
      }
    }
  );
}
