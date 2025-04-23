import { AxiosRequestConfig } from 'axios';

// API Response Types
export interface WrikeApiResponse<T> {
  kind: string;
  data: T;
}

// Core Types
export interface WrikeSpace {
  id: string;
  title: string;
  avatarUrl?: string;
  accessType?: string;
  archived?: boolean;
  [key: string]: any;
}

export interface WrikeFolder {
  id: string;
  title: string;
  childIds?: string[];
  scope?: string;
  project?: {
    authorId: string;
    ownerIds: string[];
    status: string;
    startDate?: string;
    endDate?: string;
    createdDate: string;
  };
  description?: string;
  briefDescription?: string;
  color?: string;
  customFields?: { id: string; value: string | number | boolean | null }[];
  [key: string]: any;
}

export interface WrikeTask {
  id: string;
  accountId: string;
  title: string;
  description?: string;
  briefDescription?: string;
  parentIds: string[];
  superParentIds: string[];
  sharedIds?: string[];
  responsibleIds?: string[];
  status: string;
  importance: string;
  createdDate: string;
  updatedDate: string;
  dates?: {
    type: string;
    duration: number;
    start?: string;
    due?: string;
  };
  scope: string;
  authorIds: string[];
  customFields?: { id: string; value: string | number | boolean | null }[];
  [key: string]: any;
}

export interface WrikeComment {
  id: string;
  authorId: string;
  text: string;
  createdDate: string;
  taskId?: string;
  [key: string]: any;
}

export interface WrikeContact {
  id: string;
  firstName: string;
  lastName: string;
  type: string;
  profiles: {
    accountId: string;
    email: string;
    role: string;
    external: boolean;
  }[];
  avatarUrl?: string;
  timezone?: string;
  locale?: string;
  deleted: boolean;
  me?: boolean;
  [key: string]: any;
}

export interface WrikeTimelog {
  id: string;
  taskId: string;
  userId: string;
  categoryId?: string;
  hours: number;
  createdDate: string;
  trackedDate: string;
  comment?: string;
  [key: string]: any;
}

export interface WrikeTimelogCategory {
  id: string;
  name: string;
  [key: string]: any;
}

export interface WrikeCustomField {
  id: string;
  value: string | number | boolean | null;
  [key: string]: any;
}

// Request Types
export interface WrikeRequestParams {
  [key: string]: any;
}

export interface WrikeTaskParams extends WrikeRequestParams {
  status?: string;
  importance?: string;
  startDate?: string;
  dueDate?: string;
  scheduled?: boolean;
  [key: string]: any;
}

// カスタムフィールドの型（オプショナルプロパティ）
export interface WrikeCustomFieldOptional {
  id?: string;
  value?: string | number | boolean | null;
  [key: string]: any;
}

// Data Types for Creation/Update
export interface WrikeTaskData {
  title?: string;
  description?: string;
  status?: string;
  importance?: string;
  dates?: {
    start?: string;
    due?: string;
    type?: string;
    duration?: number;
  };
  responsibles?: string[];
  customFields?: { id: string; value: string | number | boolean | null }[];
  [key: string]: any;
}

export interface WrikeFolderData {
  title?: string;
  description?: string;
  shareds?: string[];
  project?: {
    ownerIds?: string[];
    status?: string;
    startDate?: string;
    endDate?: string;
  };
  customFields?: WrikeCustomField[];
  [key: string]: any;
}

export interface WrikeCommentData {
  text: string;
  plainText?: boolean;
  [key: string]: any;
}

export interface WrikeTimelogData {
  comment?: string;
  hours: number;
  trackedDate: string;
  categoryId?: string;
  [key: string]: any;
}

// ID Conversion Types
export interface WrikeIdConversion {
  id: string;
  permalink: string;
  type: string;
  [key: string]: any;
}
