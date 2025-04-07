import { AxiosInstance, AxiosResponse } from 'axios';

// Wrike API Response Types
export interface WrikeApiResponse<T> {
  kind: string;
  data: T;
}

// Wrike Entity Types
export interface WrikeSpace {
  id: string;
  title: string;
  avatarUrl?: string;
  [key: string]: any;
}

export interface WrikeFolder {
  id: string;
  title: string;
  childIds?: string[];
  scope: string;
  project?: {
    authorId: string;
    ownerIds: string[];
    status: string;
    startDate?: string;
    endDate?: string;
    createdDate: string;
    completedDate?: string;
  };
  description?: string;
  briefDescription?: string;
  color?: string;
  customFields?: WrikeCustomField[];
  customColumnIds?: string[];
  hasAttachments?: boolean;
  attachmentCount?: number;
  permalink?: string;
  workflowId?: string;
  metadata?: any[];
  accountId?: string;
  createdDate?: string;
  updatedDate?: string;
  completedDate?: string;
  archived?: boolean;
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
  completedDate?: string;
  dates?: {
    type: string;
    duration: number;
    start?: string;
    due?: string;
    workOnWeekends?: boolean;
  };
  scope: string;
  authorIds: string[];
  customStatusId?: string;
  hasAttachments?: boolean;
  attachmentCount?: number;
  permalink?: string;
  priority?: string;
  followedByMe?: boolean;
  followerIds?: string[];
  superTaskIds?: string[];
  subTaskIds?: string[];
  dependencyIds?: string[];
  metadata?: any[];
  customFields?: WrikeCustomField[];
  [key: string]: any;
}

export interface WrikeComment {
  id: string;
  authorId: string;
  text: string;
  createdDate: string;
  updatedDate?: string;
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
  deleted?: boolean;
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

export interface WrikeCustomField {
  id: string;
  value: string | number | boolean | null;
  [key: string]: any;
}

// Parameter Types
export interface WrikeRequestParams {
  fields?: string;
  [key: string]: any;
}

export interface WrikeTaskParams extends WrikeRequestParams {
  title?: string;
  status?: string;
  importance?: string;
  scheduled?: boolean;
  completed?: boolean;
  authors?: string[];
  responsibles?: string[];
  spaceId?: string;
  [key: string]: any;
}

export interface WrikeTaskData {
  title?: string;
  description?: string;
  status?: string;
  importance?: string;
  dates?: {
    start?: string;
    due?: string;
    type?: string;
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
    ownerIds: string[];
    status?: string;
    startDate?: string;
    endDate?: string;
  };
  customFields?: { id: string; value: string | number | boolean | null }[];
  [key: string]: any;
}

export interface WrikeCommentData {
  text: string;
  [key: string]: any;
}

// ID Conversion Types
export interface WrikeIdConversion {
  id: string;
  oldId: string;
}

// Client Configuration
export interface WrikeClientConfig {
  accessToken: string;
  host?: string;
}
