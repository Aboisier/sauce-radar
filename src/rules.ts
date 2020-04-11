import { SauceRule } from './sauce-rule';

export const rules: SauceRule[] = [
  {
    targetBranches: /develop/,
    comment: `On dirait que t'as utilisé un good ol' \`(click)\`. Faudrait-il plutôt utiliser un \`gretaDebouncedClick\`?

Le template devrait ressembler à ça:
\`\`\`html
[gretaDebouncedClick]="{0}"
\`\`\`

Il faut aussi transformer le .ts pour garder le contexte de la fonction.
\`\`\`ts
public {0} = (...) => {
  ...
}
\`\`\`
`,
    fileNamePattern: /.*\.html/,
    rulePattern: /\(click\)="([^()]*).*"/,
  }
];