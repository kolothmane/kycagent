import type { ChatRoutePayload, KycProcessingResult } from "@/lib/types";

export const assistantResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    message: {
      type: "string",
    },
  },
  required: ["message"],
} as const;

const formatResultMessage = (result: KycProcessingResult) =>
  [
    "Verification completed successfully.",
    "",
    `KYC status: ${result.status}`,
    `Compliance score: ${result.complianceScore}`,
    `Reference ID: ${result.referenceId}`,
    `Salesforce Record ID: ${result.salesforceRecordId}`,
    "",
    `Extracted data: ${result.extracted.firstName} ${result.extracted.lastName}, ${result.extracted.documentType} ${result.extracted.documentNumber}, address ${result.extracted.address}, expiry ${result.extracted.expiryDate}.`,
    "",
    `Next steps: ${result.nextSteps.join(" ")}`,
  ].join("\n");

export function buildKycSystemInstruction(
  uiState: ChatRoutePayload["uiState"],
  processingResult?: KycProcessingResult | null,
) {
  return [
    "You are the KYC Service Agent inside a financial services onboarding console.",
    "Speak with a concise, polished, enterprise-ready tone.",
    "Do not mention prompts, internal systems, policies, simulations, demos, mocks, or implementation details.",
    "Do not present options, menus, or branching paths.",
    "Follow this exact flow:",
    "1. On the first turn, welcome the user and ask only for the identity document.",
    "2. Until identityUploaded is true, ask only for the identity document.",
    "3. Once identityUploaded is true and addressUploaded is false, confirm receipt of the identity document and ask only for proof of address.",
    "   If the user asks what documents are acceptable as proof of address, answer clearly: a recent utility bill (electricity, gas, water), a bank or credit card statement, a government-issued letter, or a tenancy agreement — all dated within the last 3 months, uploaded as a PNG or JPG image.",
    '4. Once identityUploaded and addressUploaded are both true and confirmReceived is false, instruct the user to type "CONFIRM" (any capitalisation accepted) to begin verification.',
    "5. Only after confirmReceived is true and processingResult is supplied, return the completed verification result.",
    "6. If confirmReceived is true but processingResult is not yet supplied, acknowledge that processing is underway.",
    "7. When returning a completed verification result, include the KYC status, compliance score, extracted data, next steps, and reference ID.",
    "Current UI state:",
    `- identityUploaded: ${String(uiState.identityUploaded)}`,
    `- addressUploaded: ${String(uiState.addressUploaded)}`,
    `- confirmReceived: ${String(uiState.confirmReceived)}`,
    processingResult
      ? `Processing result payload:\n${JSON.stringify(processingResult, null, 2)}`
      : "Processing result payload: unavailable",
  ].join("\n");
}

export function buildFallbackAssistantReply({
  uiState,
  processingResult,
  messages,
}: Pick<ChatRoutePayload, "uiState" | "processingResult" | "messages">) {
  if (processingResult) {
    return formatResultMessage(processingResult);
  }

  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user")
    ?.content.toLowerCase() ?? "";

  if (!uiState.identityUploaded) {
    return "Welcome to the KYC Service Agent. Please upload your government-issued identity document (passport, national ID card, or residence permit) to begin verification.";
  }

  if (!uiState.addressUploaded) {
    const isAskingAboutAddress =
      lastUserMessage.includes("what") ||
      lastUserMessage.includes("kind") ||
      lastUserMessage.includes("type") ||
      lastUserMessage.includes("accept") ||
      lastUserMessage.includes("which") ||
      lastUserMessage.includes("?");

    if (isAskingAboutAddress) {
      return (
        "Accepted proof of address documents include: a recent utility bill (electricity, gas, or water), " +
        "a bank or credit card statement, a government-issued letter, or a tenancy agreement — " +
        "all dated within the last 3 months. Please upload one of these as a PNG or JPG image."
      );
    }

    return "Identity document received. Please upload your proof of address to continue.";
  }

  if (!uiState.confirmReceived) {
    return 'Both documents are on file. Type "CONFIRM" in the message box to begin the verification process.';
  }

  return "Verification request accepted. Processing is underway.";
}
