Summary:
This file is responsible for recursively counting the number of tokens in all files within a given directory. It imports the necessary dependencies and configuration file, and exports the main function responsible for counting the tokens.

Import statements:
- fs: a Node.js module for interacting with the file system
- path: a Node.js module for working with file paths
- GPT3Tokenizer: a third-party library for tokenizing text using GPT-3

Script Summary:
The script first checks if a local configuration file exists, and if not, copies the default configuration file to the local project. It then imports the configuration file and creates a new instance of the GPT3Tokenizer. The script defines two helper functions for checking if a file is a valid file type or name. The main function, countTokensRecursively, takes a directory path as input and recursively counts the number of tokens in all files within that directory. It skips any directories listed in the configuration file's INVALID_PATHS array. For each file, it checks if it has a valid file type and name, reads the file's contents, tokenizes the content using the GPT3Tokenizer, and counts the number of tokens. It returns an object containing the token counts for each file and the total number of tokens.

Internal Functions:
- isValidFileType(filename): checks if a file has a valid file type based on its extension. Parameters: filename (string). Returns: boolean.
- isValidFileName(filename): checks if a file has a valid file name based on the list of invalid file names in the configuration file. Parameters: filename (string). Returns: boolean.

External Functions:
- countTokensRecursively(directory): recursively counts the number of tokens in all files within a given directory. Parameters: directory (string). Returns: object containing the token counts for each file and the total number of tokens.

Interaction Summary:
This file interacts with the rest of the application by providing a function for counting the number of tokens in all files within a given directory. Other components of the application may call this function and use the returned token counts for various purposes, such as analyzing the complexity of the text or generating summaries.

Developer Questions:
- What is the format of the configuration file and what options does it provide?
- How does the GPT3Tokenizer library tokenize text and what are its limitations?
- What is the expected input and output format of the countTokensRecursively function?
- How does the function handle errors or exceptions, such as invalid file paths or unreadable files?