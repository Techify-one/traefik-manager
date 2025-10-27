export interface DomainSummary {
  filename: string;
  type: 'ssl-termination' | 'passthrough';
  domain: string;
  ip: string;
  isWildcard: boolean;
  enableHttps: boolean;
  tags: string[];
  folder: string;
  size: number;
  modified: number;
}

export interface DomainDetails {
  filename: string;
  content: string;
  info: {
    domain: string;
    ip: string;
    type: 'ssl-termination' | 'passthrough';
    isWildcard: boolean;
    enableHttps?: boolean;
    port?: number;
    path?: string;
  };
}

export interface DomainListResponse {
  domains: DomainSummary[];
}

export interface TagInfo {
  name: string;
  count: number;
}

export interface TagsListResponse {
  tags: TagInfo[];
}

export interface FolderListResponse {
  folders: string[];
}
