import mysql from 'mysql';
import { LoggerWithTarget } from 'probot/lib/wrap-logger';
import { SauceRule } from '../../models/sauce-rule';
import { SauceRulesService } from './rules.service';

export class MysqlRulesService implements SauceRulesService {
  constructor(private log: LoggerWithTarget) { }

  public async getRules(owner: string, repo: string): Promise<SauceRule[]> {
    return new Promise(async (resolve, reject) => {
      const client = await this.getClient();
      const query = `SELECT * FROM rules r WHERE r.owner='${owner}' and repo='${repo}'`;
      this.log(`Getting rules for ${owner}/${repo} with query: ${query}`);

      client.query(query, (err, result, __) => {
        if (err) {
          this.log.error(err.message);
          return reject(err);
        }

        resolve((result as any[]).map(x => this.toEntity(x)));
        client.destroy();
      });
    })
  }

  private toEntity(data: any): SauceRule {
    return {
      id: +data.id,
      owner: data.owner,
      repo: data.repo,
      branches: [new RegExp(data.targetBranches)],
      files: [new RegExp(data.fileNamePattern)],
      rule: new RegExp(data.rulePattern),
      comment: data.comment,
      threshold: data.threshold || 10
    };
  }

  private async getClient() {
    const connection = mysql.createConnection(process.env.CLEARDB_DATABASE_URL as string);
    connection.connect();
    return connection;
  }
}