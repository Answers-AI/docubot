Summary:
This file contains tests for various utility functions used in the larger application.

Import statements:
- countTokens
- compileCompletionPrompts
- getCompletionModelBasedOnTokenSize
- getEstimatedPricing
- generateCostSummary
- fs
- Handlebars
- GPT3Tokenizer

Script Summary:
This file contains tests for various utility functions used in the larger application. The tests cover functions that count the number of tokens in a sentence, determine the appropriate GPT-3 model based on token size, estimate pricing for GPT-3 models, and generate a cost summary for a list of files.

Internal Functions:
None

External Functions:
- countTokens(content: string): Promise&lt;number&gt;
  - This function takes in a string and returns the number of tokens in the string.
- compileCompletionPrompts(filePath: string, prompt: string, options: object): Promise&lt;string&gt;
  - This function takes in a file path, a prompt, and an options object and returns a compiled prompt string.
- getCompletionModelBasedOnTokenSize(tokenCount: number): string | null
  - This function takes in a token count and returns the appropriate GPT-3 model based on the token count.
- getEstimatedPricing(model: string, tokenCount: number): string | null
  - This function takes in a GPT-3 model and a token count and returns the estimated pricing for the model and token count.
- generateCostSummary(files: array): string
  - This function takes in an array of files and returns a cost summary for the files.

Interaction Summary:
This file does not interact with the larger application directly, but it tests utility functions that are used in other parts of the application.

Developer Questions:
- What is the purpose of the GPT3Tokenizer and how is it used in the countTokens function?
- What is the purpose of the Handlebars library and how is it used in the compileCompletionPrompts function?
- What is the format of the options object passed to the compileCompletionPrompts function?
- What is the expected output format of the generateCostSummary function?
- What is the purpose of the TODO comments in the code and what needs to be done to address them?