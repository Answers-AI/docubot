Summary:
This file contains test cases for functions in the `utils.js` file. It imports necessary dependencies and third-party libraries, and defines test cases for the functions `countTokens`, `compileCompletionPrompts`, `getCompletionModelBasedOnTokenSize`, `getEstimatedPricing`, and `generateCostSummary`.

Import statements:
- `countTokens`, `compileCompletionPrompts`, `getCompletionModelBasedOnTokenSize`, `getEstimatedPricing`, and `generateCostSummary` are imported from `./utils`.
- `fs` is imported from the Node.js `fs` module to handle file system operations.
- `Handlebars` is imported from the `handlebars` library to compile templates.
- `GPT3Tokenizer` is imported from the `gpt3-tokenizer` library to tokenize text using the GPT-3 model.

Script Summary:
This script defines test cases for functions in the `utils.js` file. It uses Jest as the testing framework.

Internal Functions:
None.

External Functions:
- `countTokens(content: string): Promise<number>`: This function takes a string `content` as input and returns a Promise that resolves to the number of tokens in the content after encoding it using the GPT-3 tokenizer.
- `compileCompletionPrompts(filePath: string, prompt: string, options: { templateFilePath: string, promptsFilePath: string }): Promise<string>`: This function takes a file path `filePath`, a string `prompt`, and an options object containing `templateFilePath` and `promptsFilePath` as input. It returns a Promise that resolves to a compiled prompt string after reading the template and prompts files and compiling them using Handlebars.
- `getCompletionModelBasedOnTokenSize(tokenCount: number): string | null`: This function takes a number `tokenCount` as input and returns a string representing the GPT-3 model to use for completion based on the token count. If the token count is greater than 5000, it returns `'gpt-4'`. If the token count is greater than 1000, it returns `'gpt-3.5-turbo'`. Otherwise, it returns `null`.
- `getEstimatedPricing(model: string, tokenCount: number): string | null`: This function takes a string `model` and a number `tokenCount` as input and returns a string representing the estimated cost of using the model for completion. If the model is `'gpt-3.5-turbo'`, it returns `'0.0020'` multiplied by the token count. If the model is `'gpt-4'`, it returns `'0.0600'` multiplied by the token count. Otherwise, it returns `null`.
- `generateCostSummary(files: { model?: string, tokens: number, skipCompletion?: boolean }[]): string`: This function takes an array of file objects as input and returns a string representing the cost summary of using different GPT-3 models for completion. It calculates the total cost for each model based on the number of tokens and the estimated pricing, and returns a formatted string.

Interaction Summary:
This file does not have any direct interaction with the rest of the application. It only defines test cases for functions in the `utils.js` file.

Developer Questions:
- What is the purpose of the `GPT3Tokenizer` library and how is it used in the `countTokens` function?
- What is the purpose of the `Handlebars` library and how is it used in the `compileCompletionPrompts` function?
- What is the expected output of the `getCompletionModelBasedOnTokenSize` function for different input values?
- What is the expected output of the `getEstimatedPricing` function for different input values?
- What is the expected output of the `generateCostSummary` function for different input values?
- What are the mocked dependencies that need to be implemented for the `compileCompletionPrompts` and `generateCostSummary` test cases?
- What are the known issues or bugs with the `generateCostSummary` function and what needs to be done to fix them?