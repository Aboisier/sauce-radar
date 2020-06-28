import { Base64 } from 'js-base64';
import { GitHubAPI } from 'probot';
import { Comment } from '../../models/comment.model';

export class GitHubService {
  constructor(private api: GitHubAPI) { }

  public async comment(comment: Comment) {
    const params = {
      pull_number: comment.prNumber,
      owner: comment.owner,
      repo: comment.repo,
      body: comment.body,
      commit_id: comment.commitId,
    } as any;

    if (comment.filePath) {
      params.path = comment.filePath;
    }

    if(comment.line) {
      params.line = comment.line;
    }

    await this.api.pulls.createComment(params);
  }

  public async getFile(owner: string, repo: string, path: string): Promise<string> {
    const file = await this.api.repos.getContents({
      owner,
      repo,
      path
    }) as any;

    return Base64.decode(file.data.content);
  }
}