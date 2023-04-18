#!/usr/bin/env node
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Configuration, OpenAIApi } = require("openai");
const { PineconeClient } = require("@pinecone-database/pinecone");
const GPT3Tokenizer = require("gpt3-tokenizer").default;
const countTokensRecursively = require("./tokencounter");



// Copy the config file to the local project if it does not exist
const localConfigPath = path.join(process.cwd(), ".docubotrc");
const packageConfigPath = path.join(__dirname, ".docubotrc");

if (!fs.existsSync(localConfigPath)) {
  fs.copyFileSync(packageConfigPath, localConfigPath);
}

const config = require(localConfigPath);

const {
  MARKDOWN_DIRECTORY,
  CODE_BASE_PATH,
  PINECONE_INDEX_NAME,
  PINECONE_NAMESPACE,
} = config;

// Create the 'docubot' folder the first time the script is run
const docubotDirectory = path.join(process.cwd(), "docubot");
if (!fs.existsSync(docubotDirectory)) {
  fs.mkdirSync(docubotDirectory);
}

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

const client = new PineconeClient();
const tokenizer = new GPT3Tokenizer({ type: "gpt3" });

async function main() {
  console.log("Initializing Pinecone client...");
  console.log("MARKDOWN_DIRECTORY: ", MARKDOWN_DIRECTORY);
  console.log("PINECONE_INDEX_NAME: ", PINECONE_INDEX_NAME);
  console.log("PINECONE_NAMESPACE: ", PINECONE_NAMESPACE);
  try {
    await client.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    });
    console.log("Pinecone client initialized successfully");
    const { tokenCounts, totalTokens } = await countTokensRecursively(
      MARKDOWN_DIRECTORY
    );

    const indexName = PINECONE_INDEX_NAME;
    const dimensions = 1536; // Dimension of the OpenAI embedding model

    // Check if the index already exists
    let index;
    const existingIndexes = await client.listIndexes();
    if (existingIndexes.includes(indexName)) {
      console.log(`Index "${indexName}" already exists. Deleting all content.`);
      // Delete all content in the index
      index = client.Index(indexName);
    } else {
      // Create a new index if it doesn't exist
      index = await client.createIndex({
        createRequest: {
          name: indexName,
          dimension: dimensions,
          metric: "cosine",
        },
      });
    }

    index = client.Index(indexName);
    console.log("Index created successfully, Processing Markdown files...");

    await processMarkdownFiles(MARKDOWN_DIRECTORY, index);

    console.log("Total tokens:", totalTokens);
    console.log(
      "Total cost text-embedding-ada-002: $",
      ((totalTokens / 1000) * 0.0004).toFixed(4)
    );
    console.log("Markdown files processed successfully");
  } catch (err) {
    console.error(err);
  }
}

async function processMarkdownFiles(folderPath, index) {
  const files = fs.readdirSync(folderPath);
  console.log(`Processing markdown files: ${files}`);
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const fileStats = fs.statSync(filePath);

    const relativeFilePath = path
      .relative(MARKDOWN_DIRECTORY, filePath)
      .replace(".md", "");
    const fullCodePath = path.join(CODE_BASE_PATH, relativeFilePath);
    console.log(`Processing file: ${relativeFilePath}`);

    if (fileStats.isDirectory()) {
      await processMarkdownFiles(MARKDOWN_DIRECTORY, index); // Recursively process subfolders
    } else if (path.extname(file) === ".md") {
      const content = fs.readFileSync(filePath, "utf-8");
      const codeContent = fs.readFileSync(fullCodePath, "utf-8");

      // console.log("codeContent", codeContent);
      const tokens = tokenizer.encode(content).bpe;

      // Check if the RUN_GPT environment variable is set

      const response = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: content,
      });

      // Check if the response has the correct structure
      if (
        !response ||
        !response.data ||
        !response.data.data ||
        !response.data.data[0] ||
        !response.data.data[0].embedding
      ) {
        console.error("Unexpected response from the OpenAI API:", response);
        continue;
      }

      const embedding = response.data.data[0].embedding;
      const vectorId = `docubot_${PINECONE_NAMESPACE}_${relativeFilePath.replace(
        /\//g,
        "_"
      )}`;

      await index.upsert({
        upsertRequest: {
          vectors: [
            {
              id: vectorId,
              values: embedding,
              metadata: {
                text: content,
                tokens: tokens.length,
                filePath: relativeFilePath,
                datasource: "answers-ALPHA42",
                code: codeContent,
              },
            },
          ],
          namespace: PINECONE_NAMESPACE,
        },
      });

      console.log(`Upserted vector: ${vectorId}`);
    }
  }
}

module.exports = main().catch((error) => {
  console.error("Error Indexing in Pinecone:", error);
  console.error("Error Response:", error?.response?.data);
});
