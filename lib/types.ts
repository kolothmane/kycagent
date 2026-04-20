export type KycStatus =
  | "PENDING"
  | "PROCESSING"
  | "APPROVED"
  | "MANUAL_REVIEW"
  | "REJECTED";

export type RecordTab =
  | "overview"
  | "uploaded-documents"
  | "verification-results"
  | "activity-timeline";

export interface ConversationMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
}

export interface ExtractedData {
  documentType: string;
  firstName: string;
  lastName: string;
  address: string;
  documentNumber: string;
  expiryDate: string;
  dateOfBirth: string;
  nationality: string;
}

export interface ActivityLogEntry {
  label: string;
  detail: string;
  timestamp: string;
}

export interface TimelineEntry {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  tone: "neutral" | "progress" | "success" | "warning";
}

export interface KycProcessingResult {
  status: Extract<KycStatus, "APPROVED" | "MANUAL_REVIEW" | "REJECTED">;
  complianceScore: number;
  salesforceRecordId: string;
  summary: string;
  extracted: ExtractedData;
  nextSteps: string[];
  referenceId: string;
  activityLog: ActivityLogEntry[];
}

export interface ChatRoutePayload {
  messages: ConversationMessage[];
  uiState: {
    identityUploaded: boolean;
    addressUploaded: boolean;
    confirmReceived: boolean;
  };
  processingResult?: KycProcessingResult | null;
}
