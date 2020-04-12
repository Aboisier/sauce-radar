import { GitHubAPI } from 'probot';
import { LoggerWithTarget } from 'probot/lib/wrap-logger';
import { SauceRule } from './models/sauce-rule';
import { SauceRulesService } from './sauce-rules.service';
import { Base64 } from 'js-base64';
import * as yaml from 'yaml';

export class FileSauceRulesService implements SauceRulesService {

  constructor(private api: GitHubAPI, private log: LoggerWithTarget) { }

  public async getRules(owner: string, repo: string): Promise<SauceRule[]> {
    const configFileResponse = await this.api.repos.getContents({
      owner,
      repo,
      path: '.github/sauceradar.yml'
    }) as any;

    const rules: SauceRule[] = [];
    try {
      const content = yaml.parse(Base64.decode(configFileResponse.data.content));
      let id = 0;
      for (const key in content) {
        rules.push(this.toEntity(content[key], ++id, owner, repo))
      }
      this.log(`Found ${rules.length} keys in .github/sauce-radar.json for ${owner}/${repo}.`);
    } catch (err) {
      this.log.error('Could not parse config file', err)
    }


    return rules;
  }

  private toEntity(data: any, id: number, owner: string, repo: string): SauceRule {
    return {
      id: id,
      owner,
      repo,
      targetBranches: new RegExp(data.branches[0]),
      fileNamePattern: new RegExp(data.files),
      rulePattern: new RegExp(data.rule),
      comment: data.comment
    };
  }
}