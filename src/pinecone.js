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
  PACKAGE_JSON_PATH,
} = config;

const packageJson = require(path.join(CODE_BASE_PATH, 'package.json'));

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
      console.log(`Index "${indexName}" already exists.`);
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

async function getAllFiles(folderPath, fileList = []) {
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const fileStats = fs.statSync(filePath);

    if (fileStats.isDirectory()) {
      await getAllFiles(filePath, fileList);
    } else if (path.extname(file) === ".md") {
      fileList.push(filePath);
    }
  }

  return fileList;
}

async function processEmbeddings(files) {
  const fileBatches = [];
  while (files.length) {
    fileBatches.push(files.splice(0, 50));
  }

  const embeddingBatches = await Promise.all(
    fileBatches.map(async (batch) => {
      const embeddings = await Promise.all(
        batch.map(async (filePath) => {
          const content = fs.readFileSync(filePath, "utf-8");
          const response = await openai.createEmbedding({
            model: "text-embedding-ada-002",
            input: content,
          });

          return {
            filePath,
            embedding: response.data.data[0].embedding,
          };
        })
      );

      return embeddings;
    })
  );

  return embeddingBatches.flat();
}

async function upsertEmbeddingsToPinecone(embeddings, index) {
  console.log("Upserting embeddings to Pinecone...");
  await Promise.all(
    embeddings.map(async ({ filePath, embedding }) => {
      const relativeFilePath = path
        .relative(MARKDOWN_DIRECTORY, filePath)
        .replace(".md", "");
      const fullCodePath = path.join(CODE_BASE_PATH, relativeFilePath);
      
      
      const content = fs.readFileSync(filePath, "utf-8");
      const codeContent = fs.readFileSync(fullCodePath, "utf-8");
      const tokens = tokenizer.encode(content).bpe;

      const vectorId = `docubot_${packageJson.name}_v${packageJson.version}_${relativeFilePath.replace(
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
                datasource: `docubot-${packageJson.name}-v${packageJson.version}`,
                code: codeContent,
              },
            },
          ],
          namespace: PINECONE_NAMESPACE,
        },
      }).catch((error) => {
        console.error("Error upserting embeddings to Pinecone:", error);
        console.error("Error Response:", error?.response?.data);
      });

      console.log(`Upserted vector: ${vectorId} with datasource 'docubot-${packageJson.name}-v${packageJson.version}'`);
    })
  ).catch((error) => {
    console.error("Error upserting embeddings to Pinecone:", error);
    console.error("Error Response:", error?.response?.data);
  });
}


async function processMarkdownFiles(folderPath, index) {
  const files = await getAllFiles(folderPath);
  console.log(`Processing markdown files: ${files}`);

  const embeddings = await processEmbeddings(files);
  console.log("Embeddings processed successfully");

  await upsertEmbeddingsToPinecone(embeddings, index);
  console.log("Embeddings upserted to Pinecone successfully");
}


if (require.main === module) {
  main().catch((error) => {
    console.error("Error Indexing in Pinecone:", error);
    console.error("Error Response:", error?.response?.data);
  });
}
module.exports = {
  main,
}
