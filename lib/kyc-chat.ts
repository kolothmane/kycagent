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
    '4. Once identityUploaded and addressUploaded are both true and confirmReceived is false, instruct the user to type EXACTLY "CONFIRM" to begin verification.',
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
}: Pick<ChatRoutePayload, "uiState" | "processingResult">) {
  if (processingResult) {
    return formatResultMessage(processingResult);
  }

  if (!uiState.identityUploaded) {
    return "Welcome to the KYC Service Agent. Please upload the identity document to begin verification.";
  }

  if (!uiState.addressUploaded) {
    return "Identity document received. Please upload the proof of address.";
  }

  if (!uiState.confirmReceived) {
    return 'Identity document and proof of address are on file. Please type EXACTLY "CONFIRM" to begin verification.';
  }

  return "Verification request accepted. Processing is underway.";
}
