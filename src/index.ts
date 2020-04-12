import { Application, Context } from 'probot';
import { DiffParser } from './diff-parser';
import { FileSauceRulesService } from './file-sauce-rules.service';
import { SauceCache } from './sauce-cache';
import { SauceRadar } from './sauce-radar';

log('Just booting, hooking things up');

export = async (app: Application) => {
  app.on('pull_request', async (context) => handlePr(context));
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


  const diffParser = new DiffParser();
  const sauceCache = new SauceCache(context.log);
  const sauceRulesServices = new FileSauceRulesService(context.github, context.log);
  const sauceRadar = new SauceRadar(context.github, diffParser, sauceCache, sauceRulesServices, context.log);
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
