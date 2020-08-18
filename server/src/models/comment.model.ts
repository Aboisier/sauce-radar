export interface Comment {
  prNumber: number;
  owner: string;
  repo: string;
  body: string;
  filePath?: string;
  commitId: string;
  line?: number;
}