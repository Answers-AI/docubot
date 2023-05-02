const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const readline = require("readline");
const { init } = require("./inititalize");
const {
  fileProcessor,
  batchCompletionProcessor,
  batchEmbeddingsProcessor,
  splitFiles,
  writeResponsesToFile,
  writePreviewMarkdownToFile,
} = require("./fileProcessor");
const { generateCostSummary } = require("./utils");

async function main(filePath, full, dirPath) {
  const codeBasePath = process.env.CODE_BASE_PATH || process.cwd();
  const folderPath = filePath
    ? path.dirname(filePath)
    : dirPath || codeBasePath;

  const finalConfig = await init(codeBasePath);

  let allFilesToProcess;
  if (filePath) {
    allFilesToProcess = await fileProcessor(
      path.resolve(filePath),
      finalConfig
    );
  } else if (full) {
    allFilesToProcess = await fileProcessor(folderPath, finalConfig);
  } else if (dirPath) {
    allFilesToProcess = await fileProcessor(dirPath, finalConfig);
  } else {
    console.error(
      "Error: You must specify exactly one of --file, --full, or --dir."
    );
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    "Do you want to preview the the prompts before proceeding? (y/n): ",
    async (previewAnswer) => {
      if (previewAnswer.toLowerCase() === "y") {
        // Write the final prompts as markdown files to the markdown directory so you can preview them
        await writePreviewMarkdownToFile(allFilesToProcess, finalConfig);
        console.log(
          "Preview markdown files written to your docubot folder. Please review them and make any changes you want in the prompts/templates folders. When you are ready, run this script again to proceed with the magic ..."
        );
      }

      const summary = generateCostSummary(allFilesToProcess);

      console.log("\nSummary:");
      console.log(summary);

      rl.question("Do you want to proceed? (y/n): ", async (answer) => {
        if (answer.toLowerCase() === "y") {
          // Add your code to proceed with the operation here
          console.log("Proceeding with magic...");
          // Split files into skipCompletionFiles and filesForDocumentation
          // This removes any files that dont need to be sent to GPT-3 but you still want to be memorized
          const [skipCompletionFiles, filesForDocumentation] =
            splitFiles(allFilesToProcess);

          // Send skipCompletionFiles directly to writeResponsesToFile
          console.log("Writing markdown files directly...");
          await writeResponsesToFile(skipCompletionFiles, [], finalConfig);

          console.log(
            `Sending ${filesForDocumentation.length} files for documentation...`
          );
          // Send filesForDocumentation to get OpenAI docs
          await batchCompletionProcessor(filesForDocumentation, finalConfig);

          console.log(
            `Memorizing ${allFilesToProcess.length} new documentation files... that was easy!`
          );
          // Process markdown folder and get Embeddings
          const embeddings = await batchEmbeddingsProcessor(
            allFilesToProcess,
            finalConfig
          );

          console.log(`All files memorized!`);
        } else {
          console.log("Documenation canceled.");
        }
        rl.close();
      });
    }
  );
}

module.exports = {
  main,
};

if (require.main === module) {
  main();
}
