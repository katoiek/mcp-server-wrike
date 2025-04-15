import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Logger module for MCP Server Wrike integration
 * Provides logging functionality with log rotation, level filtering, and rate limiting
 */

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Log levels enum
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

// Default log level
let currentLogLevel = LogLevel.INFO;

// Rate limiting configuration for MCP messages
const MAX_MCP_MESSAGES_PER_MINUTE = 5;
let mcpMessageCount = 0;
let mcpMessageResetTime = Date.now();

// Log file configuration
const LOG_DIR = path.join(__dirname, '../../log');
const LOG_FILE = path.join(LOG_DIR, 'mcp-server-wrike.log');
const MAX_LOG_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_LOG_FILES = 5;

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Rotate log files when the current log file exceeds the maximum size
 * Implements a rolling file strategy where:
 * - The current log file is renamed to .1
 * - Existing log files are shifted up (.1 -> .2, .2 -> .3, etc.)
 * - The oldest log file is deleted if it exceeds MAX_LOG_FILES
 */
function rotateLogsIfNeeded() {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return;
    }

    const stats = fs.statSync(LOG_FILE);
    if (stats.size < MAX_LOG_SIZE) {
      return;
    }

    // Rotate log files
    for (let i = MAX_LOG_FILES - 1; i > 0; i--) {
      const oldFile = `${LOG_FILE}.${i}`;
      const newFile = `${LOG_FILE}.${i + 1}`;

      if (fs.existsSync(oldFile)) {
        if (i === MAX_LOG_FILES - 1) {
          // Delete the oldest log file
          fs.unlinkSync(oldFile);
        } else {
          // Rename the log file
          fs.renameSync(oldFile, newFile);
        }
      }
    }

    // Rename the current log file
    fs.renameSync(LOG_FILE, `${LOG_FILE}.1`);
  } catch (error) {
    console.error('Error rotating log files:', error);
  }
}

/**
 * Truncate large objects for logging to prevent excessive log file growth
 * Handles special cases for MCP protocol messages
 *
 * @param obj - The object to truncate
 * @param maxLength - Maximum length for string values
 * @returns Truncated version of the object
 */
function truncateObject(obj: any, maxLength = 500): any {
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle string values
  if (typeof obj === 'string') {
    return truncateString(obj, maxLength);
  }

  // Handle non-object values
  if (typeof obj !== 'object') {
    return obj;
  }

  // Special handling for MCP messages
  if (obj.jsonrpc === '2.0') {
    return summarizeMcpMessage(obj);
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return truncateArray(obj, maxLength);
  }

  // Handle regular objects
  return truncateRegularObject(obj, maxLength);
}

/**
 * Truncate a string value, with special handling for JSON-RPC messages
 */
function truncateString(str: string, maxLength: number): string {
  // Check if this is a JSON-RPC message
  if (str.includes('"jsonrpc":"2.0"') && str.length > maxLength) {
    try {
      // Try to parse it as JSON
      const jsonObj = JSON.parse(str);
      // If it's an MCP message, create a summary
      if (jsonObj.jsonrpc === '2.0') {
        let summary = `MCP ${jsonObj.method || 'response'}`;
        if (jsonObj.id !== undefined) {
          summary += ` (id: ${jsonObj.id})`;
        }
        if (jsonObj.method) {
          summary += ` - method: ${jsonObj.method}`;
        }
        if (jsonObj.result && typeof jsonObj.result === 'object') {
          const resultKeys = Object.keys(jsonObj.result);
          if (resultKeys.length > 0) {
            summary += ` - result contains: ${resultKeys.join(', ')}`;
          }
        }
        return summary + ` [full message length: ${str.length} chars]`;
      }
    } catch (e) {
      // Not valid JSON, proceed with normal truncation
    }
  }

  // Standard string truncation
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + '... [truncated]';
  }

  return str;
}

/**
 * Create a summary of an MCP message object
 */
function summarizeMcpMessage(obj: any): Record<string, any> {
  const summary: Record<string, any> = {
    type: obj.method ? 'request' : 'response',
    id: obj.id
  };

  if (obj.method) {
    summary.method = obj.method;
  }

  if (obj.params) {
    summary.params = 'present';
    // For tool calls, include the tool name
    if (obj.method === 'tools/call' && obj.params.name) {
      summary.tool = obj.params.name;
    }
  }

  if (obj.result) {
    if (typeof obj.result === 'object') {
      summary.result = `object with keys: ${Object.keys(obj.result).join(', ')}`;
    } else {
      summary.result = 'present';
    }
  }

  return summary;
}

/**
 * Truncate an array, limiting the number of items shown
 */
function truncateArray(arr: any[], maxLength: number): any[] {
  const MAX_ARRAY_ITEMS = 10;

  if (arr.length > MAX_ARRAY_ITEMS) {
    return [
      ...arr.slice(0, MAX_ARRAY_ITEMS).map(item => truncateObject(item, maxLength)),
      `... and ${arr.length - MAX_ARRAY_ITEMS} more items [truncated]`
    ];
  }

  return arr.map(item => truncateObject(item, maxLength));
}

/**
 * Truncate a regular object, limiting the number of properties shown
 */
function truncateRegularObject(obj: any, maxLength: number): Record<string, any> {
  const MAX_OBJECT_PROPERTIES = 20;
  const keys = Object.keys(obj);

  if (keys.length > MAX_OBJECT_PROPERTIES) {
    const truncatedObj: Record<string, any> = {};
    keys.slice(0, MAX_OBJECT_PROPERTIES).forEach(key => {
      truncatedObj[key] = truncateObject(obj[key], maxLength);
    });
    truncatedObj['__truncated'] = `... and ${keys.length - MAX_OBJECT_PROPERTIES} more properties [truncated]`;
    return truncatedObj;
  }

  const result: Record<string, any> = {};
  for (const key of keys) {
    result[key] = truncateObject(obj[key], maxLength);
  }

  return result;
}

/**
 * Check if a message is an MCP protocol message
 *
 * @param message - The message to check
 * @returns True if the message is related to MCP protocol
 */
function isMcpMessage(message: string): boolean {
  return message.includes('Message from client') ||
         message.includes('Message from server') ||
         message.includes('jsonrpc');
}

/**
 * Rate limit MCP messages to prevent log flooding
 * Implements a sliding window rate limiter
 *
 * @returns True if the message should be logged, false if it should be rate-limited
 */
function shouldLogMcpMessage(): boolean {
  const now = Date.now();
  const ONE_MINUTE_MS = 60000;

  // Reset counter every minute
  if (now - mcpMessageResetTime > ONE_MINUTE_MS) {
    mcpMessageCount = 0;
    mcpMessageResetTime = now;
  }

  // Check if we've exceeded the rate limit
  if (mcpMessageCount >= MAX_MCP_MESSAGES_PER_MINUTE) {
    return false;
  }

  // Increment counter and allow logging
  mcpMessageCount++;
  return true;
}

/**
 * Main logging function
 * Handles log level filtering, rate limiting for MCP messages,
 * log rotation, and writing to both file and console
 *
 * @param level - The log level
 * @param message - The log message
 * @param data - Optional data to include in the log
 */
function log(level: LogLevel, message: string, data?: any) {
  // Skip if below current log level
  if (level > currentLogLevel) {
    return;
  }

  // Special handling for MCP protocol messages
  if (isMcpMessage(message)) {
    // Only log MCP messages at DEBUG level or higher
    if (level > LogLevel.DEBUG && currentLogLevel < LogLevel.DEBUG) {
      return;
    }

    // Apply rate limiting to MCP messages
    if (!shouldLogMcpMessage()) {
      return;
    }

    // For MCP messages, use more aggressive truncation
    if (data && typeof data === 'object') {
      data = truncateObject(data, 200); // Use a smaller max length for MCP messages
    }
  }

  // Format the log message
  const timestamp = new Date().toISOString();
  const levelName = LogLevel[level];
  let logMessage = `${timestamp} [${levelName}] ${message}`;

  // Add data if provided
  if (data !== undefined) {
    try {
      const truncatedData = truncateObject(data);
      const dataStr = typeof truncatedData === 'string'
        ? truncatedData
        : JSON.stringify(truncatedData);
      logMessage += ` ${dataStr}`;
    } catch (error) {
      logMessage += ` [Error serializing data: ${error}]`;
    }
  }

  // Rotate logs if needed
  rotateLogsIfNeeded();

  // Write to log file
  try {
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
  } catch (error) {
    console.error(`Failed to write to log file: ${error}`);
  }

  // Disable console output for MCP compatibility
  // Only write to log file, not to stdout/stderr
}

/**
 * Logger interface
 * Provides methods for different log levels and configuration
 */
export const logger = {
  /**
   * Log an error message
   * @param message - The error message
   * @param data - Optional data to include
   */
  error: (message: string, data?: any) => log(LogLevel.ERROR, message, data),

  /**
   * Log a warning message
   * @param message - The warning message
   * @param data - Optional data to include
   */
  warn: (message: string, data?: any) => log(LogLevel.WARN, message, data),

  /**
   * Log an informational message
   * @param message - The info message
   * @param data - Optional data to include
   */
  info: (message: string, data?: any) => log(LogLevel.INFO, message, data),

  /**
   * Log a debug message
   * @param message - The debug message
   * @param data - Optional data to include
   */
  debug: (message: string, data?: any) => log(LogLevel.DEBUG, message, data),

  /**
   * Log a trace message (most verbose)
   * @param message - The trace message
   * @param data - Optional data to include
   */
  trace: (message: string, data?: any) => log(LogLevel.TRACE, message, data),

  /**
   * Set the current log level
   * @param level - The log level to set
   */
  setLogLevel: (level: LogLevel) => {
    currentLogLevel = level;
    logger.info(`Log level changed to: ${LogLevel[level]}`);
  },

  /**
   * Get the current log level
   * @returns The current log level
   */
  getLogLevel: () => currentLogLevel
};
