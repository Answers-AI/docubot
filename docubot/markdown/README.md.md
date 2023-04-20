# Docubot

Docubot is a bot that helps you document your code. It allows you to save your code into memory and chat with it using AnswerAI.

## Usage

To use Docubot, you need to install it globally and then run it. Once it's running, you can chat with it using AnswerAI.

### First time
```bash
npm install -g docubot
docubot start -full
```

It will then count the tokens and give you a cost estimate. When you say yes, it will go through all of your files and magic... automated documentation!

### Configuration
| Constant name          | Description                                                      |
|------------------------|------------------------------------------------------------------|
| `CONFIG_FILE_TYPES`     | An array of strings representing valid configuration file types. |
| `REACT_FILE_TYPES`      | An array of strings representing valid React file types.         |
| `SCRIPT_FILE_TYPES`     | An array of strings representing valid script file types.        |
| `API_FILE_TYPE_PATHS`   | An array of strings representing valid API file paths.           |
| `INVALID_PATHS`         | An array of strings representing invalid file paths.             |
| `INVALID_FILE_TYPES`    | An array of strings representing invalid file types.             |
| `INVALID_FILE_NAMES`    | An array of strings representing invalid file names.             |
| `PROMPT_TYPE_CONDITIONS`| An object containing key-value pairs representing prompt types and their associated conditions. |
| `PROMPTS_FILE_PATH`     | A string representing the file path of the prompts file.         |
| `TEMPLATE_FILE_PATH`    | A string representing the file path of the template file.        |
| `PROMPT_FILES`          | An object containing key-value pairs representing prompt types and their associated prompt and template files. |
| `CODE_BASE_PATH`        | A string representing the base path of the code.                 |
| `DOCUBOT_DIRECTORY`     | A string representing the file path of the Docubot directory.    |
| `PINECONE_INDEX_NAME`   | A string representing the name of the Pinecone index.            |
| `PINECONE_NAMESPACE`    | A string representing the namespace of the Pinecone index.       |
| `MARKDOWN_DIRECTORY`    | A string representing the file path of the Markdown directory.   |
| `DOCUBOT_DIRECTORY_NAME`| A string representing the name of the Docubot directory.         |


To execute the commond on a single file
```bash
docubot start /path/to/file
```

 however if you want to force a full

## Commands

Docubot has several commands that you can use to interact with it.

### `docubot save`

The `save` command allows you to save your code into pinecone memory

```bash
docubot save 
```

### `docubot list`

The `list` command allows you to list all of the files that you have saved.

```bash
docubot list
```
## TODO
- Fix the pricing per token so that it can be the estimated amount, then return the final amount from OpenAI
- Enable automated syncing to pincone on code changes