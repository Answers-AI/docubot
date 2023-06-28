// openai-api.js
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const createAnswerAiChatCompletion = async ({
  model,
  messages,
  temperature,
  config,
}) => {
  console.log(
    "using answerAI chat completion",
    config.answerAI.chatCompletionUrl
  );
  const completion = await axios
    .post(
      config.answerAI.chatCompletionUrl,
      {
        model,
        messages,
        temperature: temperature,
      },
      {
        headers: {
          contentType: "application/json",
          authorization: `Bearer ${config.answerAI.apiKey}`,
        },
      }
    )
    .catch((error) => {
      console.error(
        "Error in createAnswerAiChatCompletion API:",
        error?.response?.data
      );
      // console.error('Error in createChatCompletion API:', error);
    });

  return completion;
};

const createOpenAiChatCompletion = async ({ model, messages, temperature }) => {
  const completion = await openai
    .createChatCompletion({
      model,
      messages,
      temperature: temperature,
    })
    .catch((error) => {
      console.error(
        "Error in createOpenAiChatCompletion API:",
        error?.response?.data
      );
      // console.error('Error in createChatCompletion API:', error);
    });

  return completion;
};

const createChatCompletion = async ({
  gptModel,
  prompt,
  temperature = 0,
  config,
}) => {
  // TODO: Make the system prompt dynamic
  if (!prompt) {
    return null;
  }
  try {
    const messages = [
      { role: "system", content: "You are a code documentation expert." },
      // { role: 'user', content: 'write me a readme file for vscode' }
      { role: "user", content: prompt },
    ];
    const completion = config.answerAI?.apiKey
      ? await createAnswerAiChatCompletion({
          model: gptModel,
          messages,
          temperature,
          config,
        })
      : await createOpenAiChatCompletion({
          model: gptModel,
          messages,
          temperature,
        });

    return completion;
  } catch (error) {
    console.error("Error in createChatCompletion:", error);
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
      console.error("Error in createEmbedding:", error);
    }
  } else {
    return {
      filePath: file?.filePath,
      response: null,
    };
  }
};

module.exports = {
  createEmbedding,
  createChatCompletion,
};
