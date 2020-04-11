export interface SauceRule {
  id: number,
  owner: string,
  repo: string,
  fileNamePattern: RegExp;
  rulePattern: RegExp;
  targetBranches: RegExp;
  comment: string;
}