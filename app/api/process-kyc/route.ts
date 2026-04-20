import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

import { simulateKycProcess } from "@/lib/mock-kyc";
import { getOpenAIClient, getOpenAIModel } from "@/lib/openai";
import type { ExtractedData } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const extractedDataSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    documentType: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    documentNumber: { type: "string" },
    expiryDate: { type: "string" },
    dateOfBirth: { type: "string" },
    nationality: { type: "string" },
    address: { type: "string" },
  },
  required: [
    "documentType",
    "firstName",
    "lastName",
    "documentNumber",
    "expiryDate",
    "dateOfBirth",
    "nationality",
    "address",
  ],
} as const;

async function extractDocumentData(
  client: OpenAI,
  identityDataUrl: string,
  addressDataUrl: string,
): Promise<ExtractedData | null> {
  try {
    const response = await client.chat.completions.create({
      model: getOpenAIModel(),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "Extract information from these two KYC documents.",
                "The first image is an identity document, the second is a proof of address.",
                "Return a JSON object with exactly these fields:",
                "- documentType: type of identity document (e.g. Passport, National Identity Card, Residence Permit)",
                "- firstName: first name of the document holder",
                "- lastName: last name of the document holder",
                "- documentNumber: document or ID number",
                "- expiryDate: expiry date in YYYY-MM-DD format",
                "- dateOfBirth: date of birth in YYYY-MM-DD format",
                "- nationality: nationality or country of issue",
                "- address: full residential address from the proof of address document",
                "Use an empty string for any field that cannot be clearly read.",
              ].join("\n"),
            },
            {
              type: "image_url",
              image_url: { url: identityDataUrl, detail: "high" },
            },
            {
              type: "image_url",
              image_url: { url: addressDataUrl, detail: "high" },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "extracted_kyc_data",
          strict: true,
          schema: extractedDataSchema,
        },
      },
      max_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content ?? "";

    if (!content) {
      return null;
    }

    const parsed = JSON.parse(content) as Partial<ExtractedData>;

    return {
      documentType: parsed.documentType ?? "",
      firstName: parsed.firstName ?? "",
      lastName: parsed.lastName ?? "",
      documentNumber: parsed.documentNumber ?? "",
      expiryDate: parsed.expiryDate ?? "",
      dateOfBirth: parsed.dateOfBirth ?? "",
      nationality: parsed.nationality ?? "",
      address: parsed.address ?? "",
    };
  } catch (err) {
    console.error("[process-kyc] Vision extraction failed:", err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  let payload: {
    identityFileName?: string | null;
    addressFileName?: string | null;
    identityFileData?: string | null;
    addressFileData?: string | null;
  } = {};

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    payload = {};
  }

  const client = getOpenAIClient();

  if (client && payload.identityFileData && payload.addressFileData) {
    const extracted = await extractDocumentData(
      client,
      payload.identityFileData,
      payload.addressFileData,
    );

    if (extracted) {
      const mockResult = simulateKycProcess({
        identityFileName: payload.identityFileName,
        addressFileName: payload.addressFileName,
      });

      return NextResponse.json({ ...mockResult, extracted });
    }
  }

  // Fallback: mock simulation (no API key, no file data, or Vision call failed)
  await new Promise((resolve) => setTimeout(resolve, 1400));

  return NextResponse.json(
    simulateKycProcess({
      identityFileName: payload.identityFileName,
      addressFileName: payload.addressFileName,
    }),
  );
}
