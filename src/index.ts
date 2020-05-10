import { Application, Context } from 'probot';
import { DiffParser } from './services/diff-parser/diff-parser.service';
import { FileRulesService } from './services/rules/file-rules.service';
import { CommentsCacheService } from './services/comments-cache/comments-cache.service';
import { SauceRadar } from './services/sauce-radar/sauce-radar.service';
import { GitHubService } from './services/github/github.service';

log('Just booting, hooking things up');

export = async (app: Application) => {
  app.on('pull_request.opened', async (context) => handlePr(context));
  app.on('pull_request.reopened', async (context) => handlePr(context));
  const router = app.route('/home');
  router.use(require('express').static(__dirname + '/public'));
}

async function handlePr(context: Context) {
  log('Received PR event');

  const pr = context.payload.pull_request;

  // Get the diff
  const diff = await context.github.pulls.get({
    pull_number: pr.number,
    owner: context.issue().owner,
    repo: context.issue().repo,
    mediaType: { format: "diff" }
  }) as any;

  const githubService = new GitHubService(context.github);
  const diffParser = new DiffParser();
  const sauceCache = new CommentsCacheService(context.log);
  const sauceRulesServices = new FileRulesService(githubService, context.log);
  const sauceRadar = new SauceRadar(githubService, diffParser, sauceCache, sauceRulesServices, context.log);
  sauceRadar.detectSauce({
    prNumber: pr.number,
    owner: context.issue().owner,
    repo: context.issue().repo,
    base: pr.base.ref,
    commitId: pr.head.sha,
    diff: diff.data,
  });
}


function log(msg: string) {
  console.log(`[Index] ${msg}`);
}
