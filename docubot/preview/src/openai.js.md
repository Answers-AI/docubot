Analyze the given code, written in [Javascript], which utilizes [Nodejs, OpenAI, Pinecone, VSCode, MacOS], and generate a summary of the document that will be relevant for vector databases. The summary should provide a brief overview of the code's purpose and functionality, including any notable features or functions that it contains.
Code:
"""
// openai-api.js
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

const createChatCompletion = async (gptModel, prompt, temperature = 0) => {
  // TODO: Make the system prompt dynamic
  if (!prompt) {
    return null;
  }
  try {
    const messages = [
      { role: 'system', content: 'You are a code documentation expert.' },
      // { role: 'user', content: 'write me a readme file for vscode' }
      { role: 'user', content: prompt }
    ];
    const completion = await openai
      .createChatCompletion({
        model: gptModel,
        messages,
        temperature: temperature
      })
      .catch((error) => {
        console.error('Error in createChatCompletion API:', error?.response?.data);
        // console.error('Error in createChatCompletion API:', error);
      });

    return completion;
  } catch (error) {
    console.error('Error in createChatCompletion:', error);
    // console.error('Error in createChatCompletion:', error);
  }
};

const createEmbedding = async (model, file) => {
    if (file?.contents) {
      try {
        const response = await openai.createEmbedding({
          model,
          input: file.contents,
        });
  
        return {
          filePath: file.filePath,
          response,
        };
      } catch (error) {
        console.error('Error in createEmbedding:', error);
      }
    } else { 
        return {
            filePath: file?.filePath,
            response: null
        }
    }
  };
  

module.exports = {
  createEmbedding,
  createChatCompletion
};

"""