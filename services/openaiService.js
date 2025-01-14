// services/openaiService.js (ES Modules)

import dotenv from 'dotenv';
dotenv.config();

import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

export async function getChatCompletion(messages, model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo') {
  try {
    const response = await openai.createChatCompletion({
      model,
      messages,
      max_tokens: 270,
      temperature: 0.5
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error con OpenAI:", error);
    throw error;
  }
}
