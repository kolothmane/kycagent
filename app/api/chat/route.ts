import { NextRequest, NextResponse } from "next/server";

import {
  assistantResponseSchema,
  buildFallbackAssistantReply,
  buildKycSystemInstruction,
} from "@/lib/kyc-chat";
import { getOpenAIClient, getOpenAIModel } from "@/lib/openai";
import type { ChatRoutePayload, ConversationMessage } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const sanitizeMessages = (value: unknown): ConversationMessage[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((message): message is Partial<ConversationMessage> => Boolean(message))
    .filter(
      (message) =>
        (message.role === "assistant" || message.role === "user") &&
        typeof message.content === "string",
    )
    .map((message, index) => ({
      id: typeof message.id === "string" ? message.id : `message-${index}`,
      role: message.role as ConversationMessage["role"],
      content: message.content as string,
      createdAt:
        typeof message.createdAt === "string" ? message.createdAt : new Date().toISOString(),
    }));
};

const sanitizePayload = (value: unknown): ChatRoutePayload => {
  const payload = (value ?? {}) as Partial<ChatRoutePayload>;

  return {
    messages: sanitizeMessages(payload.messages),
    uiState: {
      identityUploaded: Boolean(payload.uiState?.identityUploaded),
      addressUploaded: Boolean(payload.uiState?.addressUploaded),
      confirmReceived: Boolean(payload.uiState?.confirmReceived),
    },
    processingResult: payload.processingResult ?? null,
  };
};

export async function POST(request: NextRequest) {
  let rawBody: unknown = null;

  try {
    rawBody = await request.json();
  } catch {
    rawBody = null;
  }

  const payload = sanitizePayload(rawBody);
  const fallbackMessage = buildFallbackAssistantReply(payload);
  const client = getOpenAIClient();

  if (!client) {
    return NextResponse.json({ message: fallbackMessage });
  }

  try {
    const requestBody: Parameters<typeof client.responses.create>[0] = {
      model: getOpenAIModel(),
      input: [
        {
          role: "system",
          content: buildKycSystemInstruction(payload.uiState, payload.processingResult),
        },
        ...payload.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
      text: {
        format: {
          type: "json_schema",
          name: "kyc_chat_response",
          strict: true,
          schema: assistantResponseSchema,
        },
      },
    };

    const response = await client.responses.create(requestBody);
    const outputText =
      "output_text" in response && typeof response.output_text === "string"
        ? response.output_text.trim()
        : "";

    if (!outputText) {
      return NextResponse.json({ message: fallbackMessage });
    }

    try {
      const parsed = JSON.parse(outputText) as { message?: string };

      return NextResponse.json({
        message:
          typeof parsed.message === "string" && parsed.message.trim()
            ? parsed.message
            : fallbackMessage,
      });
    } catch {
      return NextResponse.json({ message: outputText });
    }
  } catch {
    return NextResponse.json({ message: fallbackMessage });
  }
}
