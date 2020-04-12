import { GitHubAPI } from 'probot';
import { LoggerWithTarget } from 'probot/lib/wrap-logger';
import { SauceRule } from './models/sauce-rule';
import { SauceRulesService } from './sauce-rules.service';

export class FileSauceRulesService implements SauceRulesService {

  constructor(private api: GitHubAPI, private log: LoggerWithTarget) { }

  public async getRules(owner: string, repo: string): Promise<SauceRule[]> {
    const configFileResponse = await this.api.repos.getContents({
      owner,
      repo,
      path: '.github/sauce-radar.json'
    });

    this.log(JSON.stringify(configFileResponse.data));

    return [];
  }
}