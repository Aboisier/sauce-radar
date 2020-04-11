export interface SauceRule {
    fileNamePattern: RegExp;
    rulePattern: RegExp;
    targetBranches: RegExp;
    comment: string;
}