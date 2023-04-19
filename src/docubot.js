#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
// Copy the config file to the local project if it does not exist
const localConfigPath = path.join(process.cwd(), ".docubotrc");
const defaultConfigPath = path.join(__dirname, ".docubotrc");

if (!fs.existsSync(localConfigPath)) {
  fs.copyFileSync(defaultConfigPath, localConfigPath);
}


const GPT3Tokenizer = require("gpt3-tokenizer").default;
const dotenv = require("dotenv");
const { Configuration, OpenAIApi } = require("openai");
const countTokensRecursively = require("./tokencounter");
const readline = require("readline");

dotenv.config();



const config = require(localConfigPath);

// Use settings from config
const {
  PROMPT_FILES,
  CODE_BASE_PATH,
  MARKDOWN_DIRECTORY,
  PROMPT_TYPE_CONDITIONS,
  PROMPTS_FILE_PATH,
  TEMPLATE_FILE_PATH,
  DOCUBOT_DIRECTORY,
} = config;

function copyFolderSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Check if the prompts folder exists and copy it over if it doesn't
const localPromptsPath = path.join(DOCUBOT_DIRECTORY, "prompts");
const packagePromptsPath = path.join(__dirname, "prompts");
if (!fs.existsSync(localPromptsPath)) {
  copyFolderSync(packagePromptsPath, localPromptsPath);
}

// Check if the templates folder exists and copy it over if it doesn't
const localTemplatesPath = path.join(DOCUBOT_DIRECTORY, "templates");
const packageTemplatesPath = path.join(__dirname, "templates");
if (!fs.existsSync(localTemplatesPath)) {
  copyFolderSync(packageTemplatesPath, localTemplatesPath);
}

const tokenizer = new GPT3Tokenizer({ type: "gpt3" });
const RUN_GPT = process.env.RUN_GPT || false;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

function getFilenameFromPath(path) {
  // Split the path string by the path separator ("/")
  const parts = path.split("/");

  // Get the last element of the array, which is the filename
  const filename = parts[parts.length - 1];

  // Return the filename
  return filename;
}

// TODO: Need to do a better job about estimating the pricing
const getEstimatedPricing = async (sortedFilePathsByTokenCount) => {
  let gpt3Tokens = 0;
  let gpt4Tokens = 0;

  for (const [filePath, fileTokens] of sortedFilePathsByTokenCount) {
    if (fileTokens > 3800) {
      gpt4Tokens += fileTokens;
      console.warn(
        `Processed BIG gpt-4 file: ${filePath}, Tokens: ${fileTokens}`
      );
    } else {
      gpt3Tokens += fileTokens;
      console.log(
        `Processed gpt-3.5-turbo file: ${filePath}, Tokens: ${fileTokens}`
      );
    }
  }

  const totalCostGPT3 = ((gpt3Tokens / 1000) * 0.002).toFixed(2);
  const totalCostGPT4 = ((gpt4Tokens / 1000) * 0.12).toFixed(2);
  console.log(
    `Total prompt tokens for GPT-3.5-turbo $0.002/1k: ${gpt3Tokens}, $${totalCostGPT3}`
  );
  console.log(
    `Total prompt tokens for GPT-4: ~$0.12/1k ${gpt4Tokens}, $${totalCostGPT4}`
  );
  console.log(
    `Total estimated cost: $${(
      parseFloat(totalCostGPT3) + parseFloat(totalCostGPT4)
    ).toFixed(2)}`
  );
};

async function main(filePath) {
  console.log("Running GPT-3 on codebase...");
  console.log("CODE_BASE_PATH: ", CODE_BASE_PATH);
  console.log("Counting Tokens .....");
  
  console.log("Done counting tokens");
  let sortedFilePathsByTokenCount;
  if(filePath) {
    sortedFilePathsByTokenCount = [[filePath, 100]]
  } else {
    const { tokenCounts, totalTokens } = await countTokensRecursively(
      CODE_BASE_PATH
    );
    sortedFilePathsByTokenCount = Object.entries(tokenCounts).sort(
      ([, a], [, b]) => a - b
    );
  }

  // console.log("sortedFilePathsByTokenCount", sortedFilePathsByTokenCount)
  getEstimatedPricing(sortedFilePathsByTokenCount);

  // Ask the user if they want to create markdown files
  const createMarkdownFiles = await promptUser(
    "Do you want to create markdown files? (yes/y): "
  );

  if (
    createMarkdownFiles.toLowerCase() === "yes" ||
    createMarkdownFiles.toLowerCase() === "y"
  ) {
    let gpt3Tokens = 0;
    let gpt4Tokens = 0;

    const batchSize = 10;
    for (let i = 0; i < sortedFilePathsByTokenCount.length; i += batchSize) {
      const batch = sortedFilePathsByTokenCount.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(([filePath]) => processFile(filePath))
      );

      for (const {
        filePath,
        gptResponseMessage,
        tokensInPrompt,
        gptModel,
      } of batchResults) {
        const relativeFilePath = path.relative(CODE_BASE_PATH, filePath);
        const outputFile = `${MARKDOWN_DIRECTORY}/${relativeFilePath}.md`;

        // Create the directories if they do not exist
        await fs.promises.mkdir(path.dirname(outputFile), { recursive: true });
        // Write the file
        await fs.promises.writeFile(
          outputFile,
          gptResponseMessage.choices[0].message.content,
          "utf8"
        );

        if (gptResponseMessage.model.indexOf("gpt-3.5")) {
          gpt3Tokens += gptResponseMessage.usage.total_tokens;
          console.log(
            `Processed gpt-3.5-turbo file: ${filePath}, Tokens: ${tokensInPrompt}`
          );
        } else if (gptModel === "gpt-4") {
          gpt4Tokens += gptResponseMessage.usage.total_tokens;
          console.warn(
            `Processed BIG gpt-4 file: ${filePath}, Tokens: ${tokensInPrompt}`
          );
        }
      }
    }

    console.log(`Summaries written to ${MARKDOWN_DIRECTORY}`);
  }
}

async function getPromptType(filePath) {
  const ext = path.extname(filePath);

  for (const [promptType, conditions] of Object.entries(
    PROMPT_TYPE_CONDITIONS
  )) {
    if (
      (conditions.fileExt && conditions.fileExt.includes(ext)) ||
      (conditions.pathIncludes &&
        conditions.pathIncludes.some((path) => filePath.includes(path)))
    ) {
      return promptType;
    }
  }

  return "default";
}

async function getPromptAndExample(filePath) {
  const promptType = await getPromptType(filePath);
  const { prompt, template } = PROMPT_FILES[promptType];

  return {
    prePrompt: await fs.promises.readFile(
      `${PROMPTS_FILE_PATH}/${prompt}`,
      "utf8"
    ),
    template: await fs.promises.readFile(
      `${TEMPLATE_FILE_PATH}/${template}`,
      "utf8"
    ),
  };
}

async function processFile(filePath) {
  const { prePrompt, template } = await getPromptAndExample(filePath);
  const code = await fs.promises.readFile(filePath, "utf8");
  console.log("processingFile: ", filePath);

  const relativeFilePath = path.relative(CODE_BASE_PATH, filePath);
  // console.log("relativeFilePath: ", relativeFilePath);

  const prompt = `${prePrompt} \n\nFilepath: ${relativeFilePath}\n\nContext: ${code}\n\nTemplate for Documentation: ${template}`;
  const encoded = tokenizer.encode(prompt);
  const tokensInPrompt = encoded.bpe.length;

  const gptModel = tokensInPrompt < 3200 ? "gpt-3.5-turbo" : "gpt-4";

  let gptResponseMessage = {};

  const completion = await openai.createChatCompletion({
    model: gptModel,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });
  gptResponseMessage = completion.data;
  //   console.log("gpt_reponse_message:", gptResponseMessage);

  return {
    filePath: filePath,
    gptResponseMessage: gptResponseMessage,
    tokensInPrompt: tokensInPrompt,
    gptModel: gptModel,
  };
}

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

module.exports = {
  main,
  getFilenameFromPath,
  getEstimatedPricing,
  getPromptType,
  getPromptAndExample,
  processFile,
  copyFolderSync,
};

if (require.main === module) {
  main();
}