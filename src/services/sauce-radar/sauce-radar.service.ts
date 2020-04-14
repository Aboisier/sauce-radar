import { GitHubAPI } from 'probot';
import { LoggerWithTarget } from 'probot/lib/wrap-logger';
import { DiffParser } from '../diff-parser/diff-parser.service';
import { CommentsCacheService, SauceInfo } from '../comments-cache/comments-cache.service';
import { SauceRulesService } from '../rules/rules.service';

export class SauceRadar {
  constructor(
    private api: GitHubAPI,
    private diffParser: DiffParser,
    private sauceCache: CommentsCacheService,
    private sauceRulesService: SauceRulesService,
    private log: LoggerWithTarget
  ) { }

  public async detectSauce(pr: PrInfo) {
    this.log('Detecting sauce...');
    const rules = (await this.sauceRulesService.getRules(pr.owner, pr.repo)).filter(x => x.branches.some(y => y.test(pr.base)));

    const diff = this.diffParser.parse(pr.diff);
    this.log(`The diff has ${diff.length} files in it!`);

    const postComment = this.commentFunc(pr);

    for (const file of diff) {
      const applicableRules = rules.filter(x => x.files.some(y => y.test(file.newPath)));
      this.log(`Inspecting file ${file.newPath}, for which ${applicableRules.length} rules are applicable`);

      for (const hunk of file.hunks) {
        this.log(`Inspecting hunk with ${hunk.changes} changes: ${hunk.content}`);

        for (const change of hunk.changes.filter(x => x.type === 'insert')) {
          this.log(`Inspecting change: ${change.content}`);

          for (const rule of applicableRules) {
            const matches = change.content.match(rule.rule);
            if (matches == null) continue;

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
    return async (comment: string, path: string, line: number) => {
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
      await this.api.pulls.createComment({
        pull_number: pr.prNumber,
        owner: pr.owner,
        repo: pr.repo,
        body: comment,
        path,
        commit_id: pr.commitId,
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