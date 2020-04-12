export interface SauceRule {
  id: number,
  owner: string,
  repo: string,
  files: RegExp[];
  rulePattern: RegExp;
  branches: RegExp[];
  comment: string;
}