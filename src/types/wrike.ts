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

export interface WrikeCustomItemType {
  id: string;
  title: string;
  hidden: boolean;
  avatarUrl?: string;
  settings?: {
    workflow?: {
      id: string;
      name: string;
    };
    inheritanceType?: string;
    customStatuses?: {
      id: string;
      name: string;
      standardId?: string;
      hidden?: boolean;
      color?: string;
      group?: string;
    }[];
  };
  [key: string]: any;
}

export interface WrikeCustomField {
  id: string;
  value: string | number | boolean | null;
  [key: string]: any;
}

export interface WrikeCustomFieldDefinition {
  id: string;
  accountId: string;
  title: string;
  type: string;
  sharedIds?: string[];
  settings?: {
    inheritanceType?: string;
    values?: {
      id: string;
      value: string;
      color?: string;
    }[];
    decimalPlaces?: number;
    useThousandsSeparator?: boolean;
    aggregation?: string;
    currency?: string;
    allowOtherValues?: boolean;
  };
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

export interface WrikeCustomItemTypeData {
  title?: string;
  hidden?: boolean;
  settings?: {
    workflow?: {
      id: string;
    };
    inheritanceType?: string;
    customStatuses?: {
      id?: string;
      name?: string;
      standardId?: string;
      hidden?: boolean;
      color?: string;
      group?: string;
    }[];
  };
  [key: string]: any;
}

// ID Conversion Types
export interface WrikeIdConversion {
  id: string;
  permalink: string;
  type: string;
  [key: string]: any;
}

// Folder Blueprint Types
export interface WrikeFolderBlueprint {
  id: string;
  title: string;
  childIds?: string[];
  scope?: string;
  description?: string;
  briefDescription?: string;
  color?: string;
  [key: string]: any;
}

// Task Blueprint Types
export interface WrikeTaskBlueprint {
  id: string;
  title: string;
  description?: string;
  briefDescription?: string;
  createdDate?: string;
  updatedDate?: string;
  scope?: string;
  [key: string]: any;
}

export interface WrikeFolderBlueprintLaunchData {
  title: string;
  parent?: string;  // Changed from object to string
  titlePrefix?: string;
  description?: string;
  copyDescriptions?: boolean;
  notifyResponsibles?: boolean;
  copyResponsibles?: boolean;
  copyCustomFields?: boolean;
  copyAttachments?: boolean;
  rescheduleDate?: string;  // 日付の再スケジュール（YYYY-MM-DD形式）
  rescheduleMode?: 'Start' | 'End' | 'start' | 'end';  // 再スケジュールモード（Start/start または End/end）
  entryLimit?: number;  // 1..250
  [key: string]: any;
}

export interface WrikeTaskBlueprintLaunchData {
  title: string;
  parent?: string;  // ID of parent folder (parentId in API)
  superTask?: string;  // ID of parent task (superTaskId in API)
  titlePrefix?: string;
  copyDescriptions?: boolean;
  notifyResponsibles?: boolean;
  copyResponsibles?: boolean;
  copyCustomFields?: boolean;
  copyAttachments?: boolean;
  rescheduleDate?: string;  // Format: YYYY-MM-DD
  rescheduleMode?: string;  // 'Start' or 'End'
  entryLimit?: number;
  [key: string]: any;
}
