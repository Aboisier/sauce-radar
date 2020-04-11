import gitdiffParser, { File } from 'gitdiff-parser';

export class DiffParser {
    public parse(diff: string): File[] {
        return gitdiffParser.parse(diff);
    }
}