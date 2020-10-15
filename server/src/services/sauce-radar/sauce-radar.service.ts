import { LoggerWithTarget } from 'probot/lib/wrap-logger';
import { DiffParser } from '../diff-parser/diff-parser.service';
import { CommentsCacheService, SauceInfo } from '../comments-cache/comments-cache.service';
import { SauceRulesService } from '../rules/rules.service';
import { SauceRule } from '../../models/sauce-rule';
import { GitHubService } from '../github/github.service';

export class SauceRadar {
  constructor(
    private github: GitHubService,
    private diffParser: DiffParser,
    private sauceCache: CommentsCacheService,
    private sauceRulesService: SauceRulesService,
    private log: LoggerWithTarget
  ) { }

  public async detectSauce(pr: PrInfo) {
    this.log('Detecting sauce...');
    const postComment = this.commentFunc(pr);

    let rules: SauceRule[];
    try {
      this.log('Getting rules...');
      rules = (await this.sauceRulesService.getRules(pr.owner, pr.repo)).filter(x => x.branches.some(y => y.test(pr.base)));
      this.log(`The config file has ${rules.length} rules applicable to ${pr.base}`);
    } catch (err) {
      postComment(`An error occured while reading the rules config file 😶
      
      ${err}`);
      throw err;
    }

    const diff = this.diffParser.parse(pr.diff);
    this.log(`The diff has ${diff.length} files in it!`);


    const rulesCounter = new Map<SauceRule, number>();

    for (const file of diff) {
      const applicableRules = rules.filter(x => x.files.some(y => y.test(file.newPath)));
      this.log(`Inspecting file ${file.newPath}, for which ${applicableRules.length} rules are applicable`);

      for (const hunk of file.hunks) {
        this.log(`Inspecting hunk with ${hunk.changes} changes: ${hunk.content}`);

        for (const change of hunk.changes.filter(x => x.type === 'insert')) {
          this.log(`Inspecting change: ${change.content}`);

          for (const rule of applicableRules) {
            this.log(`Testing rule: ${rule.rule}`);
            rulesCounter.set(rule, (rulesCounter.get(rule) || 0) + 1);

            if (rulesCounter.get(rule) > rule.threshold) {
              this.log(`Rule ignored because it was applied too many times ${rulesCounter.get(rule)}/${rule.threshold}.`);
              continue;
            }

            // Check if the rule applies
            if (!rule.rule.test(change.content)) continue;

            const matches = change.content.match(rule.rule);
            let comment = rule.comment.slice();
            for (let i = 1; i < matches.length; ++i) {
              comment = comment.split(`{${i - 1}}`).join(matches[i]);
            }

            this.log(`Sauce found! ${comment}`);
            await postComment(comment, file.newPath, (change.newLineNumber || change.lineNumber) as number);
          }
        }
      }
    }
  }

  private commentFunc(pr: PrInfo) {
    let comments = 0;

    return async (comment: string, path?: string, line?: number) => {
      if (++comments > 50) {
        this.log(`Comment prevented because there were too many comments in this PR (#${pr.prNumber})`)
        return;
      }

      const sauceInfo: SauceInfo = {
        comment,
        owner: pr.owner,
        prNumber: pr.prNumber,
        repo: pr.repo,
        path,
        line
      };

      if (await this.sauceCache.exists(sauceInfo)) return;

      this.log('Commenting...');
      await this.github.comment({
        prNumber: pr.prNumber,
        owner: pr.owner,
        repo: pr.repo,
        body: comment,
        filePath: path,
        commitId: pr.commitId,
        line
      });

      await this.sauceCache.cache(sauceInfo);
    }
  }
}

export interface PrInfo {
  prNumber: number;
  owner: string,
  repo: string,
  commitId: string;
  base: string;
  diff: string;
}