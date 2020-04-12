import { GitHubAPI } from 'probot';
import { LoggerWithTarget } from 'probot/lib/wrap-logger';
import { SauceRule } from './models/sauce-rule';
import { SauceRulesService } from './sauce-rules.service';
import { Base64 } from 'js-base64';

export class FileSauceRulesService implements SauceRulesService {

  constructor(private api: GitHubAPI, private log: LoggerWithTarget) { }

  public async getRules(owner: string, repo: string): Promise<SauceRule[]> {
    const configFileResponse = await this.api.repos.getContents({
      owner,
      repo,
      path: '.github/sauce-radar.json'
    }) as any;

    const rules: SauceRule[] = [];
    try {
      const content = JSON.parse(Base64.decode(configFileResponse.data.content));
      for (const key in content) {
        rules.push(this.toEntity(content[key]))
      }
      this.log(`Found ${rules.length} keys in .github/sauce-radar.json for ${owner}/${repo}.`);
    } catch (err) {
      this.log.error('Could not parse config file', err)
    }


    return rules;
  }

  private toEntity(data: any): SauceRule {
    return {
      id: +data.id,
      owner: data.owner,
      repo: data.repo,
      targetBranches: new RegExp(data.targetBranches),
      fileNamePattern: new RegExp(data.fileNamePattern),
      rulePattern: new RegExp(data.rulePattern),
      comment: data.comment
    };
  }
}