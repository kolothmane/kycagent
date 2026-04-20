import OpenAI from "openai";

const chatModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
const visionModel = process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini";
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
  return chatModel;
}

export function getOpenAIVisionModel() {
  return visionModel;
}
