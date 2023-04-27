Summary:
This file contains functions that initialize and copy configuration files, prompts, and templates for a Docubot project.

Import statements:
- fs: a Node.js module for interacting with the file system
- path: a Node.js module for working with file paths

Script Summary:
This script exports four functions: init, initConfigFile, initPromptsFolder, and initTemplatesFolder. init is the main function that initializes a Docubot project by calling initConfigFile, initPromptsFolder, and initTemplatesFolder.

Internal Functions:
- initConfigFile: a function that copies the default config file to the project folder if it doesn't exist and returns the configuration object
  - Parameters: folderPath (string) - the path to the project folder
  - Returns: fileConfig (object) - the configuration object
- copyFolderSync: a helper function that copies a folder recursively
  - Parameters: src (string) - the source folder path, dest (string) - the destination folder path
- initPromptsFolder: a function that copies the prompts folder to the project folder if it doesn't exist
  - Parameters: config (object) - the configuration object, folderPath (string) - the path to the project folder
- initTemplatesFolder: a function that copies the templates folder to the project folder if it doesn't exist
  - Parameters: config (object) - the configuration object, folderPath (string) - the path to the project folder

External Functions:
- init: the main function that initializes a Docubot project
  - Parameters: folderPath (string) - the path to the project folder
  - Returns: a Promise that resolves with the configuration object
- initConfigFile: a function that copies the default config file to the project folder if it doesn't exist and returns the configuration object
  - Parameters: folderPath (string) - the path to the project folder
  - Returns: fileConfig (object) - the configuration object
- initPromptsFolder: a function that copies the prompts folder to the project folder if it doesn't exist
  - Parameters: config (object) - the configuration object, folderPath (string) - the path to the project folder
- initTemplatesFolder: a function that copies the templates folder to the project folder if it doesn't exist
  - Parameters: config (object) - the configuration object, folderPath (string) - the path to the project folder

Interaction Summary:
This file interacts with the rest of the Docubot application by providing functions that initialize and copy configuration files, prompts, and templates for a Docubot project.

Developer Questions:
- What is the structure of the configuration object returned by initConfigFile?
- What happens if the default config file is missing or invalid?
- How can I customize the prompts and templates for my Docubot project?
- Are there any known issues with copying large folders using copyFolderSync?