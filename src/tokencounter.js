const fs = require("fs");
const path = require("path");
const GPT3Tokenizer = require("gpt3-tokenizer").default;

// Copy the config file to the local project if it does not exist
const localConfigPath = path.join(process.cwd(), ".docubotrc");
const defaultConfigPath = path.join(__dirname, ".docubotrc");

if (!fs.existsSync(localConfigPath)) {
  fs.copyFileSync(defaultConfigPath, localConfigPath);
}
const config = require(localConfigPath);

const tokenizer = new GPT3Tokenizer({ type: "gpt3" });
const { INVALID_PATHS, INVALID_FILE_TYPES, INVALID_FILE_NAMES } = config;

function isValidFileType(filename) {
  const ext = path.extname(filename);
  return !INVALID_FILE_TYPES.includes(ext);
}

function isValidFileName(filename) {
  return !INVALID_FILE_NAMES.includes(filename);
}

async function countTokensRecursively(directory) {
  console.log("Processing directory:", directory);
  console.log("Configuration file path:", config);

  const tokenCounts = {};
  let totalTokens = 0;

  // Check if the current directory is in the INVALID_PATHS array
  if (INVALID_PATHS.some((invalidPath) => directory.includes(invalidPath))) {
    console.log("Skipping invalid directory:", directory);
    return { tokenCounts, totalTokens };
  }

  console.log("Reading directory entries:", directory);
  const entries = await fs.promises.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      console.log("Processing subdirectory:", fullPath);
      const { tokenCounts: subdirTokenCounts, totalTokens: subdirTotalTokens } =
        await countTokensRecursively(fullPath);
      Object.assign(tokenCounts, subdirTokenCounts);
      totalTokens += subdirTotalTokens;
      console.log("Finished processing subdirectory:", fullPath);
    } else if (
      entry.isFile() &&
      isValidFileType(entry.name) &&
      isValidFileName(entry.name)
    ) {
      console.log("Processing file:", fullPath);
      const content = await fs.promises.readFile(fullPath, "utf8");
      const encoded = tokenizer.encode(content);
      const tokensInFile = encoded.bpe.length;
      tokenCounts[fullPath] = tokensInFile;
      totalTokens += tokensInFile;
      console.log("Processed file:", fullPath, "with", tokensInFile, "tokens.");
    }
  }

  console.log("Finished processing directory:", directory);
  return { tokenCounts, totalTokens };
}

module.exports = countTokensRecursively;
