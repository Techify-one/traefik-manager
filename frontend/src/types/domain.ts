export interface DomainSummary {
  filename: string;
  type: 'ssl-termination' | 'passthrough';
  domain: string;
  ip: string;
  isWildcard: boolean;
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
  };
}

export interface DomainListResponse {
  domains: DomainSummary[];
}
