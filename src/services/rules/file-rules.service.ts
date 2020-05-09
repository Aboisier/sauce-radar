import { LoggerWithTarget } from 'probot/lib/wrap-logger';
import { SauceRule } from '../../models/sauce-rule';
import { SauceRulesService } from './rules.service';
import * as yaml from 'yaml';
import { GitHubService } from '../github/github.service';

export class FileRulesService implements SauceRulesService {

  constructor(private github: GitHubService, private log: LoggerWithTarget) { }

  public async getRules(owner: string, repo: string): Promise<SauceRule[]> {
    const file = await this.github.getFile(
      owner,
      repo,
      '.github/sauceradar.yml'
    );

    const rules: SauceRule[] = [];
    try {
      const content = yaml.parse(file);
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
    const targetBranches = typeof data.branches == 'object' ? data.branches.map((x: string) => new RegExp(x)) : [new RegExp(data.branches)];
    const fileNamePattern = typeof data.files == 'object' ? data.files.map((x: string) => new RegExp(x)) : [new RegExp(data.files)];
    return {
      id: id,
      owner,
      repo,
      branches: targetBranches,
      files: fileNamePattern,
      rule: new RegExp(data.rule),
      comment: data.comment,
      threshold: data.threshold || 10
    };
  }
}