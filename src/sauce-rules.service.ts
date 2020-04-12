import { SauceRule } from './models/sauce-rule';

export interface SauceRulesService {
  getRules(owner: string, repo: string): Promise<SauceRule[]>;
}