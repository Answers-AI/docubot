const { getChangedFiles } = require("./fileProcessor");
const { createChatCompletion } = require('./openai');
const {
  countTokens,
  compileCompletionPrompts,
  getCompletionModelBasedOnTokenSize,
  getEstimatedPricing,
} = require("./utils");

const createChangeLog = async ({addedFiles, modifiedFiles, deletedFiles }) => {
  const summaryArray = [];
  for (const file of modifiedFiles) {
    const { filePath, gitDiff } = file;
    console.log(`Processing modified file: ${filePath}`);

    // Use the createChatCompletion function with the gitDiff as the prompt
    const prompt = `Please write a very short, yet detailed summary of the changes in this git diff file: ${gitDiff}`;
    const tokens = await countTokens(prompt);
    const gptModel = getCompletionModelBasedOnTokenSize(tokens);
    const temperature = 0; // Adjust the temperature value as needed

    const completion = await createChatCompletion(gptModel, prompt, temperature);
    summaryArray.push({
      filePath,
      summary: completion?.data.choices[0]?.message?.content,
    })
    // Process the Summary Array
    
    // ...
  }
    


};



module.exports = {
  createChangeLog,
};