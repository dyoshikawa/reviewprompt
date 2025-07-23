export interface PRComment {
  id: number;
  body: string;
  path?: string | undefined;
  line?: number | undefined;
  startLine?: number | undefined;
  user: {
    login: string;
  };
  htmlUrl: string;
  position: number | null;
  originalPosition: number | null;
  diffHunk?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface FilteredComment {
  id: number;
  body: string;
  path?: string | undefined;
  line?: number | undefined;
  startLine?: number | undefined;
  user: string;
  htmlUrl: string;
  position: number | null;
  originalPosition: number | null;
  diffHunk?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface PRInfo {
  owner: string;
  repo: string;
  pullNumber: number;
}

export interface CliOptions {
  interactive?: boolean;
  resolve?: boolean;
  delete?: boolean;
  mention?: string;
  clipboard?: boolean;
  all?: boolean;
}

export interface PromptSection {
  comment: FilteredComment;
  content: string;
}
