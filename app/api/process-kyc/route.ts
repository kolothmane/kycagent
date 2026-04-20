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

class ValidationError extends Error {
  readonly validationError = true as const;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

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
                "You are a KYC document validator and data extractor.",
                "You will receive two images.",
                "The FIRST image must be an identity document (passport, national ID card, or residence permit).",
                "The SECOND image must be a proof of address (utility bill, bank statement, government-issued letter, or tenancy agreement).",
                "",
                "Always return a single JSON object with a top-level 'valid' boolean field.",
                "",
                "If either image is NOT a valid document (e.g. a random photo, a blank page,",
                "or an image that cannot be recognised as the required document type), return:",
                '{',
                '  "valid": false,',
                '  "reason": "<brief explanation of which document failed and why>",',
                '  "documentType": "", "firstName": "", "lastName": "", "documentNumber": "",',
                '  "expiryDate": "", "dateOfBirth": "", "nationality": "", "address": ""',
                '}',
                "",
                "If both images are valid documents, extract data and return:",
                '{',
                '  "valid": true,',
                '  "reason": "",',
                '  "documentType": "<type: Passport / National Identity Card / Residence Permit>",',
                '  "firstName": "<given name from identity document>",',
                '  "lastName": "<family name from identity document>",',
                '  "documentNumber": "<ID or document number>",',
                '  "expiryDate": "<YYYY-MM-DD>",',
                '  "dateOfBirth": "<YYYY-MM-DD>",',
                '  "nationality": "<nationality or country of issue>",',
                '  "address": "<full address from proof of address document>"',
                '}',
                "",
                "Use an empty string for any field that cannot be clearly read.",
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

    // Document validation failed — propagate the rejection reason
    if (parsed.valid === false) {
      const reason =
        typeof parsed.reason === "string" && parsed.reason.trim()
          ? parsed.reason
          : "One or more uploaded images could not be recognised as valid KYC documents.";

      throw new ValidationError(reason);
    }

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
    // Re-throw validation errors so the route can return a proper 422
    if (err instanceof ValidationError) {
      throw err;
    }

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

  // Reject the request immediately if either file is missing
  if (!payload.identityFileData || !payload.addressFileData) {
    return NextResponse.json(
      { error: "Both documents must be uploaded before starting verification." },
      { status: 400 },
    );
  }

  const client = getOpenAIClient();

  if (client) {
    try {
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
    } catch (err) {
      if (err instanceof ValidationError) {
        const reason = (err as Error).message;
        console.error("[process-kyc] Document validation rejected:", reason);
        return NextResponse.json({ error: reason }, { status: 422 });
      }

      console.error("[process-kyc] Unexpected error during extraction:", err);
    }
  }

  // Fallback: mock simulation (no API key or Vision call failed without validation error)
  await new Promise((resolve) => setTimeout(resolve, 1400));

  return NextResponse.json(
    simulateKycProcess({
      identityFileName: payload.identityFileName,
      addressFileName: payload.addressFileName,
    }),
  );
}
