import OpenAI from "openai";

const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const apiKey = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;

let client: OpenAI | null = null;

export function getOpenAIClient() {
  if (!apiKey) {
    return null;
  }

  if (!client) {
    client = new OpenAI({
      apiKey,
    });
  }

  return client;
}

export function getOpenAIModel() {
  return model;
}
