import { GitHubAPI } from 'probot';
import { DiffParser } from './diff-parser';
import { SauceRule } from './sauce-rule';
import { SauceCache, SauceInfo } from './sauce-cache';

export class SauceRadar {
  constructor(private api: GitHubAPI, private diffParser: DiffParser, private sauceCache: SauceCache) { }

  public async detectSauce(pr: PrInfo, rule: SauceRule[]) {
    this.log('Detecting sauce...');

    const diff = this.diffParser.parse(pr.diff);
    this.log(`The diff has ${diff.length} files in it!`);

    const postComment = this.commentFunc(pr);

    for (const file of diff) {
      const applicableRules = rule.filter(x => x.fileNamePattern.test(file.newPath));
      this.log(`Inspecting file ${file.newPath}, for which ${applicableRules.length} rules are applicable`);

      for (const hunk of file.hunks) {
        this.log(`Inspecting hunk with ${hunk.changes} changes: ${hunk.content}`);

        for (const change of hunk.changes.filter(x => x.type === 'insert')) {
          this.log(`Inspecting change: ${change.content}`);

          for (const rule of applicableRules) {
            const matches = change.content.match(rule.rulePattern);
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

  private log(msg: string) {
    console.log(`[SauceRadar] ${msg}`);
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