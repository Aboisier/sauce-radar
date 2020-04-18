export interface SauceRule {
  id: number,
  owner: string,
  repo: string,
  files: RegExp[];
  rule: RegExp;
  branches: RegExp[];
  comment: string;
  threshold: number;
}