import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

import { simulateKycProcess } from "@/lib/mock-kyc";
import { getOpenAIClient, getOpenAIVisionModel } from "@/lib/openai";
import type { ExtractedData } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const REQUIRED_FIELDS: (keyof ExtractedData)[] = [
  "documentType",
  "firstName",
  "lastName",
  "documentNumber",
  "expiryDate",
  "dateOfBirth",
  "nationality",
  "address",
];

async function extractDocumentData(
  client: OpenAI,
  identityDataUrl: string,
  addressDataUrl: string,
): Promise<ExtractedData | null> {
  try {
    const response = await client.chat.completions.create({
      model: getOpenAIVisionModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "You are a KYC document reader. Extract data from the two images below.",
                "The FIRST image is an identity document (passport, ID card, or residence permit).",
                "The SECOND image is a proof of address (utility bill, bank statement, etc.).",
                "",
                "Return ONLY a JSON object with exactly these fields (use an empty string when a field cannot be read):",
                '  "documentType"  — type of identity document (e.g. "Passport", "National Identity Card", "Residence Permit")',
                '  "firstName"     — first / given name from the identity document',
                '  "lastName"      — last / family name from the identity document',
                '  "documentNumber"— document or ID number from the identity document',
                '  "expiryDate"    — expiry date in YYYY-MM-DD format',
                '  "dateOfBirth"   — date of birth in YYYY-MM-DD format',
                '  "nationality"   — nationality or country of issue',
                '  "address"       — full residential address from the proof of address document',
                "",
                "Do not include any explanation, markdown, or extra keys. Return only the JSON object.",
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
      max_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content?.trim() ?? "";

    if (!content) {
      return null;
    }

    const parsed = JSON.parse(content) as Record<string, unknown>;

    // Validate all required fields are present
    for (const field of REQUIRED_FIELDS) {
      if (typeof parsed[field] !== "string") {
        console.error(`[process-kyc] Vision response missing field: ${field}`);
        return null;
      }
    }

    return {
      documentType: parsed.documentType as string,
      firstName: parsed.firstName as string,
      lastName: parsed.lastName as string,
      documentNumber: parsed.documentNumber as string,
      expiryDate: parsed.expiryDate as string,
      dateOfBirth: parsed.dateOfBirth as string,
      nationality: parsed.nationality as string,
      address: parsed.address as string,
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
