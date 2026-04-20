import { create } from "zustand";

import type {
  ActivityLogEntry,
  ConversationMessage,
  KycProcessingResult,
  KycStatus,
  RecordTab,
  TimelineEntry,
} from "@/lib/types";

const formatTimestamp = (date = new Date()) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

const generateLocalId = () =>
  globalThis.crypto?.randomUUID?.() ?? `id-${Math.random().toString(36).slice(2, 10)}`;

const buildMessage = (
  role: ConversationMessage["role"],
  content: string,
): ConversationMessage => ({
  id: generateLocalId(),
  role,
  content,
  createdAt: formatTimestamp(),
});

const buildTimelineEntry = (
  title: string,
  description: string,
  tone: TimelineEntry["tone"],
): TimelineEntry => ({
  id: generateLocalId(),
  title,
  description,
  tone,
  timestamp: formatTimestamp(),
});

interface KycStoreState {
  identityUploaded: boolean;
  addressUploaded: boolean;
  confirmReceived: boolean;
  identityFileName: string | null;
  addressFileName: string | null;
  identityFileData: string | null;
  addressFileData: string | null;
  kycStatus: KycStatus;
  complianceScore: number;
  extractedData: KycProcessingResult["extracted"] | null;
  salesforceRecordId: string | null;
  processingSummary: string;
  referenceId: string | null;
  nextSteps: string[];
  activityLog: ActivityLogEntry[];
  messages: ConversationMessage[];
  timeline: TimelineEntry[];
  activeTab: RecordTab;
  isChatLoading: boolean;
  addMessage: (role: ConversationMessage["role"], content: string) => void;
  setChatLoading: (value: boolean) => void;
  setActiveTab: (tab: RecordTab) => void;
  /** Accepts a `data:image/...;base64,...` data URL produced by FileReader.readAsDataURL. */
  uploadIdentity: (fileName: string, fileData: string) => void;
  /** Accepts a `data:image/...;base64,...` data URL produced by FileReader.readAsDataURL. */
  uploadAddress: (fileName: string, fileData: string) => void;
  setProcessingStarted: () => void;
  setProcessingResult: (result: KycProcessingResult) => void;
  rollbackProcessing: (message: string) => void;
}

export const useKycStore = create<KycStoreState>((set) => ({
  identityUploaded: false,
  addressUploaded: false,
  confirmReceived: false,
  identityFileName: null,
  addressFileName: null,
  identityFileData: null,
  addressFileData: null,
  kycStatus: "PENDING",
  complianceScore: 18,
  extractedData: null,
  salesforceRecordId: null,
  processingSummary: "Awaiting identity document submission to begin customer verification.",
  referenceId: null,
  nextSteps: ["Collect required onboarding documentation to initiate verification."],
  activityLog: [],
  messages: [],
  timeline: [],
  activeTab: "overview",
  isChatLoading: false,
  addMessage: (role, content) =>
    set((state) => ({
      messages: [...state.messages, buildMessage(role, content)],
    })),
  setChatLoading: (value) => set({ isChatLoading: value }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  uploadIdentity: (fileName, fileData) =>
    set((state) => ({
      identityUploaded: true,
      identityFileName: fileName,
      identityFileData: fileData,
      timeline: [
        ...state.timeline,
        buildTimelineEntry(
          "Identity document attached",
          `${fileName} received and staged for document intake.`,
          "progress",
        ),
      ],
      activityLog: [
        ...state.activityLog,
        {
          label: "Identity document received",
          detail: `${fileName} added to the active case file.`,
          timestamp: new Date().toISOString(),
        },
      ],
    })),
  uploadAddress: (fileName, fileData) =>
    set((state) => ({
      addressUploaded: true,
      addressFileName: fileName,
      addressFileData: fileData,
      timeline: [
        ...state.timeline,
        buildTimelineEntry(
          "Proof of address attached",
          `${fileName} accepted and linked to the verification package.`,
          "progress",
        ),
      ],
      activityLog: [
        ...state.activityLog,
        {
          label: "Address document received",
          detail: `${fileName} added to the active case file.`,
          timestamp: new Date().toISOString(),
        },
      ],
    })),
  setProcessingStarted: () =>
    set((state) => ({
      confirmReceived: true,
      kycStatus: "PROCESSING",
      processingSummary:
        "Verification request accepted. OCR extraction, validation, compliance scoring, and CRM synchronization are in progress.",
      timeline: [
        ...state.timeline,
        buildTimelineEntry(
          "Verification submitted",
          'User confirmation received and processing has started for the active KYC package.',
          "progress",
        ),
      ],
      activityLog: [
        ...state.activityLog,
        {
          label: "Processing started",
          detail: "Verification flow promoted from intake to active compliance processing.",
          timestamp: new Date().toISOString(),
        },
      ],
    })),
  setProcessingResult: (result) =>
    set((state) => ({
      kycStatus: result.status,
      complianceScore: result.complianceScore,
      extractedData: result.extracted,
      salesforceRecordId: result.salesforceRecordId,
      processingSummary: result.summary,
      referenceId: result.referenceId,
      nextSteps: result.nextSteps,
      activityLog: result.activityLog,
      timeline: [
        ...state.timeline,
        buildTimelineEntry(
          "Verification completed",
          `Case ${result.referenceId} cleared with status ${result.status}.`,
          "success",
        ),
        buildTimelineEntry(
          "CRM synchronization completed",
          `Salesforce record ${result.salesforceRecordId} created and routed to onboarding operations.`,
          "success",
        ),
      ],
    })),
  rollbackProcessing: (message) =>
    set((state) => ({
      confirmReceived: false,
      kycStatus: "PENDING",
      processingSummary:
        "The latest verification request did not complete. The case remains open and ready for resubmission.",
      timeline: [
        ...state.timeline,
        buildTimelineEntry("Processing retry required", message, "warning"),
      ],
    })),
}));
