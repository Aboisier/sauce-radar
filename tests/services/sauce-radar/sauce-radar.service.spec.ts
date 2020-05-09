import { BeforeEach, TestSuite, Test } from 'testyts';
import { IMock, Mock } from 'typemoq';
import { CommentsCacheService } from '../../../src/services/comments-cache/comments-cache.service';
import { DiffParser } from '../../../src/services/diff-parser/diff-parser.service';
import { GitHubService } from '../../../src/services/github/github.service';
import { FileRulesService } from '../../../src/services/rules/file-rules.service';
import { SauceRadar } from '../../../src/services/sauce-radar/sauce-radar.service';
import { nullLog } from '../../log-mock';

@TestSuite()
export class SauceRadarServiceTests {
  private radar: SauceRadar;
  private gitHubServiceMock: IMock<GitHubService>;
  private diffParser: DiffParser;
  private cacheServiceMock: IMock<CommentsCacheService>;
  private rulesService: FileRulesService;

  @BeforeEach()
  public async beforeEach() {
    this.gitHubServiceMock = Mock.ofType<GitHubService>();
    this.diffParser = new DiffParser();
    this.cacheServiceMock = Mock.ofType<CommentsCacheService>();
    this.rulesService = new FileRulesService(this.gitHubServiceMock.object, nullLog);

    this.radar = new SauceRadar(
      this.gitHubServiceMock.object,
      this.diffParser,
      this.cacheServiceMock.object,
      this.rulesService,
      nullLog
    );
  }
}