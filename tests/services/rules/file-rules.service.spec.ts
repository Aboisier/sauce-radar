import * as fs from 'fs';
import { BeforeEach, expect, Test, TestSuite } from 'testyts';
import { IMock, It, Mock } from 'typemoq';
import { GitHubService } from '../../../src/services/github/github.service';
import { FileRulesService } from '../../../src/services/rules/file-rules.service';
import { nullLog } from '../../log-mock';

@TestSuite()
export class FilesSauceRulesServiceTests {

  private rulesService!: FileRulesService;
  private gitHubService!: IMock<GitHubService>;
  private configFilePath!: string;

  @BeforeEach()
  public beforeEach() {
    this.gitHubService = Mock.ofType<GitHubService>();
    this.gitHubService.setup(x => x.getFile(It.isAny(), It.isAny(), It.isAny())).returns(() => Promise.resolve(fs.readFileSync(this.configFilePath).toString()));
    this.rulesService = new FileRulesService(this.gitHubService.object, nullLog);
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
    expect.toBeEqual(rule.comment, 'Hello {0}')
    this.expectRegex(rule.rule, 'testing someerror');

    expect.toBeEqual(rule.files.length, 1)
    this.expectRegex(rule.files[0], 'lel.html');

    expect.toBeEqual(rule.branches.length, 1)
    this.expectRegex(rule.branches[0], 'develop');
  }

  @Test()
  public async getRules_multipleRules_shouldTransformToSauceRule() {
    // Arrange
    this.configFilePath = __dirname + '/configs/multiple-rules.yml';

    // Act
    const rules = await this.rulesService.getRules('someowner', 'somerepo');

    // Assert
    expect.toBeEqual(rules.length, 2, `Expected two rules but got ${rules.length}`);

    const rule1 = rules[0];
    expect.toBeEqual(rule1.comment, 'My first rule');
    this.expectRegex(rule1.rule, 'hello sometest hello');

    expect.toBeEqual(rule1.files.length, 2);
    this.expectRegex(rule1.files[0], 'lel.html');
    this.expectRegex(rule1.files[1], 'lel.xml');

    expect.toBeEqual(rule1.branches.length, 2)
    this.expectRegex(rule1.branches[0], 'develop');
    this.expectRegex(rule1.branches[1], 'master');

    const rule2 = rules[1];
    expect.toBeEqual(rule2.comment, 'SPAM!!!!!');
    this.expectRegex(rule2.rule, 'anything');

    expect.toBeEqual(rule2.files.length, 1);
    this.expectRegex(rule2.files[0], 'anything.anything');

    expect.toBeEqual(rule2.branches.length, 1)
    this.expectRegex(rule2.branches[0], 'anything');
  }

  //#region Helpers

  private expectRegex(regex: RegExp, str: string) {
    expect.toBeTrue(regex.test(str));
  }

  //#endregion
}