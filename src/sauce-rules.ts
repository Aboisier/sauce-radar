import mysql from 'mysql';
import { SauceRule } from './models/sauce-rule';

export class SauceRulesService {

  public async getRules(owner: string, repo: string): Promise<SauceRule[]> {
    return new Promise(async (resolve, reject) => {
      const client = await this.getClient();
      const query = `SELECT * FROM rules r WHERE r.owner='${owner}' and repo='${repo}'`;
      this.log(`Getting rules for ${owner}/${repo} with query: ${query}`);

      client.query(query, (err, result, __) => {
        if (err) {
          this.logError(err.message);
          return reject(err);
        }

        resolve((result as any[]).map(x => this.toEntity(x)));
      });
    })
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

  private async getClient() {
    const connection = mysql.createConnection(process.env.CLEARDB_DATABASE_URL as string);
    connection.connect();
    return connection;
  }

  private log(msg: string) {
    console.error(`[SauceRulesService] ${msg}`);
  }

  private logError(msg: string) {
    console.error(`[SauceRulesService] ${msg}`);
  }
}