// test.js
const fs = require('fs');
const path = require('path');
const { init, initConfigFile, initPromptsFolder, initTemplatesFolder } = require('./inititalize');

// Helper function to delete the test folder if it exists
const deleteTestFolder = (folderPath) => {
  if (fs.existsSync(folderPath)) {
    fs.rmdirSync(folderPath, { recursive: true });
  }
};

describe('Docubot initialization', () => {
  const testFolder = path.join(__dirname, 'test-docubot-folder');
  const docubotRcPath = path.join(testFolder, '.docubotrc');

  beforeEach(() => {
    // Clean up the test folder before each test
    deleteTestFolder(testFolder);
    if (!fs.existsSync(testFolder)) {
      fs.mkdirSync(testFolder);
    }
  });

  afterEach(() => {
    // Clean up the test folder after each test
    deleteTestFolder(testFolder);
  });

  test('initConfigFile initializes docubot successfully by creating a .docubotrc file with default configurations in the root directory', async () => {
    const config = await initConfigFile(testFolder);
    expect(fs.existsSync(docubotRcPath)).toBe(true);
  });

  test('initPromptsFolder creates the prompt folder with default prompts', async () => {
    const config = await initConfigFile(testFolder);
    initPromptsFolder(config, testFolder);
    const promptsPath = path.join(testFolder, config.docubotDirectoryName, 'prompts');
    expect(fs.existsSync(promptsPath)).toBe(true);
  });

  test('initTemplatesFolder creates the templates folder with default templates', async () => {
    const config = await initConfigFile(testFolder);
    initTemplatesFolder(config, testFolder);
    const templatesPath = path.join(testFolder, config.docubotDirectoryName, 'templates');
    expect(fs.existsSync(templatesPath)).toBe(true);
  });

  test('init initializes docubot with the correct folder structure and user config', async () => {
    const config = await init(testFolder);
    const docubotFolderPath = path.join(testFolder, config.docubotDirectoryName);
    const promptsPath = path.join(docubotFolderPath, 'prompts');
    const templatesPath = path.join(docubotFolderPath, 'templates');
    expect(fs.existsSync(docubotFolderPath)).toBe(true);
    expect(fs.existsSync(promptsPath)).toBe(true);
    expect(fs.existsSync(templatesPath)).toBe(true);
  });
});
