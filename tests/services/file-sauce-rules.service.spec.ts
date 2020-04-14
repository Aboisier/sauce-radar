import * as fs from 'fs';
import { GitHubAPI } from 'probot';
import { BeforeEach, expect, Test, TestSuite } from 'testyts';
import { IMock, Mock } from 'typemoq';
import { FileRulesService } from '../../src/services/rules/file-rules.service';
import { nullLog } from '../log-mock';

@TestSuite()
export class FilesSauceRulesServiceTests {

  private rulesService!: FileRulesService;
  private ghApiMock!: IMock<GitHubAPI>;
  private configFilePath!: string;

  @BeforeEach()
  public beforeEach() {
    this.ghApiMock = Mock.ofType<GitHubAPI>();
    this.ghApiMock.setup(x => x.repos).returns(() => (
      {
        getContents: () => {
          const content = Base64.encode(fs.readFileSync(this.configFilePath).toString());
          return { data: { content: content } };
        }
      } as any
    ));
    this.rulesService = new FileRulesService(this.ghApiMock.object, nullLog);
  }

  @Test()
  public async getRules_normalYaml_shouldTransformToSauceRule() {
    // Arrange
    this.configFilePath = __dirname + '/configs/normal.yml';

    // Act
    const rules = await this.rulesService.getRules('someowner', 'somerepo');

    // Assert
    expect.toBeEqual(rules.length, 1);

    const rule = rules[0];
    expect.toBeEqual(rule.owner, 'someowner');
    expect.toBeEqual(rule.repo, 'somerepo');
    expect.toBeEqual(rule.comment, 'Hello {0}')
    this.expectRegex(rule.rule, 'testing someerror');
    
    expect.toBeEqual(rule.files.length, 1)
    this.expectRegex(rule.files[0], 'lel.html');

    expect.toBeEqual(rule.branches.length, 1)
    this.expectRegex(rule.branches[0], 'develop');
  }

  
  @Test()
  public async getRules_withComments_shouldTransformToSauceRule() {
    // Arrange
    this.configFilePath = __dirname + '/configs/with-comments.yml';

    // Act
    const rules = await this.rulesService.getRules('someowner', 'somerepo');

    // Assert
    expect.toBeEqual(rules.length, 1);

    const rule = rules[0];
    expect.toBeEqual(rule.owner, 'someowner');
    expect.toBeEqual(rule.repo, 'somerepo');
    expect.toBeEqual(rule.comment, 'Hello {0}')
    this.expectRegex(rule.rule, 'testing someerror');
    
    expect.toBeEqual(rule.files.length, 1)
    this.expectRegex(rule.files[0], 'lel.html');

    expect.toBeEqual(rule.branches.length, 1)
    this.expectRegex(rule.branches[0], 'develop');
  }

  //#region Helpers

  private expectRegex(regex: RegExp, str: string) {
    expect.toBeTrue(regex.test(str));
  }

  //#endregion
}