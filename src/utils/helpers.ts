import { WrikeClient } from './wrikeClient.js';
import { WrikeRequestParams, WrikeTimelogData } from '../types/wrike.js';
import { logger } from './logger.js';

/**
 * Parse optional fields from a comma-separated string
 * @param optFields Optional fields as a comma-separated string
 * @returns WrikeRequestParams object with fields property
 */
export const parseOptFields = (optFields?: string): WrikeRequestParams => {
  if (!optFields) return {};

  const fields = optFields.split(',').map(field => field.trim()).filter(Boolean);
  return fields.length > 0 ? { fields: fields.join(',') } : {};
};

/**
 * Convert task ID to API v4 format
 * @param wrikeClient WrikeClient instance
 * @param taskId Task ID to convert (can be permalink or numeric ID)
 * @returns Promise resolving to API v4 format task ID
 */
export const convertTaskId = async (wrikeClient: WrikeClient, taskId: string): Promise<string> => {
  let apiTaskId = taskId;

  if (taskId.includes('open.htm?id=') || /^\d+$/.test(taskId)) {
    try {
      logger.debug('Converting permalink ID', { task_id: taskId });

      apiTaskId = await wrikeClient.convertPermalinkId(taskId, 'task');

      logger.debug('Converted to API v4 ID', { api_task_id: apiTaskId });
    } catch (error) {
      logger.error('Error converting permalink ID', { error: (error as Error).message });
      throw new Error(`Failed to convert permalink ID: ${(error as Error).message}`);
    }
  }

  return apiTaskId;
};

/**
 * Remove undefined values from an object
 * This is a utility function to clean up objects before sending to API
 * @param obj The object to clean
 * @returns The same object with undefined values removed
 */
export const removeUndefinedValues = <T extends Record<string, any>>(obj: T): T => {
  Object.keys(obj).forEach(key => {
    if (obj[key] === undefined) {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      removeUndefinedValues(obj[key]);
    }
  });
  return obj;
};

/**
 * Create a Wrike client instance
 * @returns A new WrikeClient instance
 * @throws Error if WRIKE_ACCESS_TOKEN is not set
 */
export const createWrikeClient = (): WrikeClient => {
  const accessToken = process.env.WRIKE_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('WRIKE_ACCESS_TOKEN environment variable is not set');
  }

  const host = process.env.WRIKE_HOST || 'www.wrike.com';
  return new WrikeClient(accessToken, host);
};

/**
 * Create a timelog data object from parameters
 * @param hours Number of hours
 * @param tracked_date Date when the time was spent (YYYY-MM-DD format)
 * @param comment Comment for the timelog
 * @param category_id ID of the timelog category
 * @returns WrikeTimelogData object with undefined values removed
 */
export const createTimelogData = (
  hours?: number,
  tracked_date?: string,
  comment?: string,
  category_id?: string
): WrikeTimelogData => {
  return removeUndefinedValues<WrikeTimelogData>({
    hours,
    trackedDate: tracked_date,
    comment,
    categoryId: category_id
  });
};

/**
 * Format a date to YYYY-MM-DD format
 * @param date Date to format (Date object or ISO string)
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

/**
 * Validate that required parameters are present
 * @param params Object containing parameters
 * @param requiredParams Array of required parameter names
 * @throws Error if any required parameter is missing
 */
export const validateRequiredParams = (
  params: Record<string, any>,
  requiredParams: string[]
): void => {
  for (const param of requiredParams) {
    if (params[param] === undefined || params[param] === null || params[param] === '') {
      throw new Error(`Required parameter '${param}' is missing`);
    }
  }
};
