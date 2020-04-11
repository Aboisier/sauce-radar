import { Application, Context } from 'probot';
import { DiffParser } from './diff-parser';
import { rules } from './rules';
import { SauceRadar } from './sauce-radar';

export = (app: Application) => {
  app.on('pull_request', async (context) => handlePr(context));
}

async function handlePr(context: Context) {
  console.log('Received PR event.');

  const pr = context.payload.pull_request;

  // Get the diff
  const diff = await context.github.pulls.get({
    pull_number: pr.number,
    owner: context.issue().owner,
    repo: context.issue().repo,
    mediaType: { format: "diff" }
  }) as any;


  const diffParser = new DiffParser();
  const sauceRadar = new SauceRadar(context.github, diffParser);
  sauceRadar.detectSauce({
    prNumber: pr.number,
    owner: context.issue().owner,
    repo: context.issue().repo,
    base: pr.base.ref,
    commitId: pr.head.sha,
    diff: diff.data,
  }, rules);
}

