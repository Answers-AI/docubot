const fs = require("fs").promises;
const path = require("path");
const { PineconeClient } = require("@pinecone-database/pinecone");
const client = new PineconeClient();

const {
  countTokens,
  compileCompletionPrompts,
  getCompletionModelBasedOnTokenSize,
  getEstimatedPricing,
} = require("./utils");
const { createChatCompletion, createEmbedding } = require("./openai");

const getFileData = async (filePath, config) => {
  if (!isInvalidFile(filePath, config)) {
    const fileTypeObj = getFileType(filePath, config);
    let tokens = 0;
    let model = "";
    let cost = 0;
    const completionObj = await compileCompletionPrompts(
      filePath,
      fileTypeObj.prompt,
      fileTypeObj.skipCompletion,
      config
    );

    if (!fileTypeObj.skipCompletion) {
      tokens = await countTokens(completionObj.fullPrompt);
      model = getCompletionModelBasedOnTokenSize(tokens);
      cost = getEstimatedPricing(model, tokens);
    }

    // TODO: Send to the embedding api for classification
    return {
      filePath,
      type: fileTypeObj.type,
      prompt: fileTypeObj.prompt,
      template: fileTypeObj.template,
      skipCompletion: fileTypeObj.skipCompletion,
      fullPrompt: completionObj?.fullPrompt,
      fileContents: completionObj?.fileContents,
      tokens,
      model,
      cost,
    };
  } else {
    console.log(`Skipping file: ${filePath}`);
    return null;
  }
};

const fileProcessor = async (iPath, config) => {
  const filesData = [];
  const isDirectory = (await fs.stat(iPath)).isDirectory();
  const files = await (isDirectory ? fs.readdir(iPath) : [iPath]);
  // console.log({ iPath, isDirectory, files });

  for (const file of files) {
    const filePath = isDirectory ? path.join(iPath, file) : file;
    const fileStats = await fs.stat(filePath);

    if (fileStats.isDirectory()) {
      if (
        !config.invalidPaths.some((invalidPath) =>
          filePath.includes(invalidPath)
        )
      ) {
        filesData.push(...(await fileProcessor(filePath, config)));
      }
    } else {
      const fileData = await getFileData(filePath, config);
      if (fileData) {
        // TODO: Send to the embedding api for classification
        filesData.push(fileData);
      }
    }
  }

  return filesData;
};

const isInvalidFile = (filePath, config) => {
  const ext = path.extname(filePath);
  const fileParentDir = path.dirname(filePath);
  const cond1 = config.invalidPaths.some(
    (invalidPath) =>
      fileParentDir === path.join(config.codeBasePath, invalidPath)
  );

  const cond2 = config.invalidFileTypes.includes(ext);
  const cond3 = config.invalidFileNames.includes(path.basename(filePath));

  if (cond1 || cond2 || cond3) {
    console.log(`Skipping file: ${filePath}`, cond1, cond2, cond3);
    return true;
  }

  return false;
};

const getFileContents = async (filePath) => {
  try {
    const contents = await fs.readFile(`${filePath}.md`, "utf-8");
    return {
      contents,
      filePath,
    };
  } catch (error) {
    console.error(`Error reading file: ${filePath}`, error);
    return null;
  }
};

const getFileType = (filePath, config) => {
  for (const [type, fileType] of Object.entries(config.fileTypes)) {
    const ext = path.extname(filePath);

    if (fileType.fileTypes && fileType.fileTypes.includes(ext)) {
      return {
        type,
        prompt: fileType.prompt,
        template: fileType.template,
        skipCompletion: fileType.skipCompletion || false,
      };
    }

    if (
      fileType.pathIncludes &&
      fileType.pathIncludes.some((pathPart) => filePath.includes(pathPart))
    ) {
      return {
        type,
        prompt: fileType.prompt,
        template: fileType.template,
        skipCompletion: fileType.skipCompletion || false,
      };
    }
  }

  return {
    type: "default",
    prompt: config.fileTypes.default.prompt,
    template: config.fileTypes.default.template,
    skipCompletion: config.fileTypes.default.skipCompletion || false,
  };
};

const batchCompletionProcessor = async (files, config) => {
  const batchSize = 5;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const responses = await generateResponses(batch);
    await writeResponsesToFile(batch, responses, config);
  }
};

const getFilePathWithReplacedBase = (file, config) => {
  const relativePath = file?.filePath?.replace(config.codeBasePath, "");
  return path.join(config.markdownDirectory, relativePath);
};

const batchEmbeddingsProcessor = async (allFilesToProcess, config) => {
  const batchSize = 20;
  for (let i = 0; i < allFilesToProcess.length; i += batchSize) {
    const batch = allFilesToProcess.slice(i, i + batchSize);
    const batchWithReplacedBase = batch.map((file) =>
      getFilePathWithReplacedBase(file, config)
    );

    const fileContentsPromises = batchWithReplacedBase.map(getFileContents);
    const fileContentsArray = await Promise.all(fileContentsPromises);

    const embeddings = await generateEmbeddings(fileContentsArray);
    await upsertEmbeddingsToPinecone(embeddings, config);
  }
};

const writeResponsesToFile = async (files, responses, config) => {
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(
      config.markdownDirectory,
      files[i].filePath.replace(config.codeBasePath, "")
    );
    const fileDir = path.dirname(filePath);
    const fileContent =
      responses[i]?.data?.choices[0]?.message?.content ||
      files[i]?.fileContents;
    await fs.mkdir(fileDir, { recursive: true });
    await fs.writeFile(`${filePath}.md`, fileContent);
    console.log(`Documentation written to: ${filePath}`);
  }
};

const writePreviewMarkdownToFile = async (files, config) => {
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(
      config.markdownDirectory,
      files[i].filePath.replace(config.codeBasePath, "")
    );
    const fileDir = path.dirname(filePath);
    const fileContent = files[i]?.fullPrompt || files[i]?.fileContents;
    await fs.mkdir(fileDir, { recursive: true });
    await fs.writeFile(`${filePath}.md`, fileContent);
    console.log(`Documentation written to: ${filePath}`);
  }
};

const upsertEmbeddingsToPinecone = async (embeddings, config) => {
  await client.init({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
  });
  const index = client.Index(config.pineconeIndexName);
  for (let i = 0; i < embeddings.length; i++) {
    const embedding = embeddings[i];
    if (embedding?.response) {
      const relativeFilePath = path
        .relative(config.markdownDirectory, embedding.filePath)
        .replace(".md.md", ".md"); // TODO: This is a hack to fix the double extension
      const fullCodePath = path.join(config.codeBasePath, relativeFilePath);
      // TODO: This only works for npm projects. This should work with all types of projects.
      // Only using it to namespace the repo and its versions
      const packageJson = require(path.join(
        config.codeBasePath,
        "package.json"
      ));

      const content = await fs.readFile(`${embedding.filePath}.md`, "utf-8");
      const codeContent = await fs.readFile(fullCodePath, "utf-8");
      // TODO: have different tokens for code and text content
      const tokens = embedding?.response?.data?.usage?.total_tokens;

      const vectorId = `docubot_${packageJson.name}_v${
        packageJson.version
      }_${relativeFilePath.replace(/\//g, "_")}`;

      // Send the embedding to Pinecone
      await index
        .upsert({
          upsertRequest: {
            namespace: config.pineconeNamespace,
            vectors: [
              {
                id: vectorId,
                values: embedding.response.data.data[0].embedding,
                metadata: {
                  text: content,
                  tokens,
                  filePath: relativeFilePath,
                  source: `docubot`,
                  repo: `${packageJson.name}-v${packageJson.version}`,
                  code: codeContent,
                },
              },
            ],
          },
        })
        .catch((error) => {
          console.error("Error upserting embeddings to Pinecone:", error);
          console.error("Error Response:", error?.response?.data);
        });

      console.log(
        `Upserted vector: ${vectorId} with source: 'docubot', repo: '${packageJson.name}-v${packageJson.version}'`
      );
    }
  }
};

const generateResponses = async (files, gptModel) => {
  return await Promise.all(
    files.map((file) => createChatCompletion(file.model, file.fullPrompt))
  );
};
const generateEmbeddings = async (fileContentsArray) => {
  const embeddingPromises = fileContentsArray
    .filter((item) => item?.contents !== null)
    .map((item) => createEmbedding("text-embedding-ada-002", item));

  return await Promise.all(embeddingPromises);
};

const splitFiles = (files) => {
  const skipCompletionFiles = [];
  const otherFiles = [];

  for (const file of files) {
    if (file.skipCompletion) {
      skipCompletionFiles.push(file);
    } else {
      otherFiles.push(file);
    }
  }

  return [skipCompletionFiles, otherFiles];
};

module.exports = {
  fileProcessor,
  batchCompletionProcessor,
  batchEmbeddingsProcessor,
  getFileType,
  isInvalidFile,
  splitFiles,
  writeResponsesToFile,
  writePreviewMarkdownToFile,
};
