#!/usr/bin/env node
const docubot = require("./src/docubot.js");
const pinecone = require("./src/pinecone.js");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

// Check if the script is being run directly (not being imported as a module)
if (require.main === module) {
  // Define the CLI using yargs
  const argv = yargs(hideBin(process.argv))
    .command(
      "start [file]",
      "Start Docubot",
      (yargs) => {
        yargs.positional("file", {
          describe: "Path to the file to be documented",
          type: "string",
        });
      },
      async (argv) => {
        // Start Docubot
        const filePath = argv.file;
        console.log(`Documenting code from file '${filePath}' using magic...`);
        await docubot.main(filePath); // Pass the file path to the main function
      }
    )
    .command(
      "save",
      "Save code into pinecone memory",
      {},
      async () => {
        // Save code into pinecone memory
        console.log("Saving code into pinecone memory...");
        await pinecone.main();
      }
    )
    .command(
      "list",
      "List all saved files",
      {},
      () => {
        // List all saved files
        console.log("Listing all saved files...");
        // TODO: Implement the list functionality
      }
    )
    .demandCommand(1, "You need to specify a command to run.")
    .help()
    .alias("h", "help")
    .argv;

  // If no subcommand is provided, show help
  if (argv.length === 0) {
    yargs.showHelp();
  }
}
