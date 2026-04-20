"use client";

import { useCallback, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import { ChatPanel } from "@/components/chat-panel";
import { RecordWorkspace } from "@/components/record-workspace";
import { SidebarNav } from "@/components/sidebar-nav";
import { TopHeader } from "@/components/top-header";
import type { KycProcessingResult } from "@/lib/types";
import { useKycStore } from "@/store/kyc-store";

const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg"]);

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export function KycConsole() {
  const identityInputRef = useRef<HTMLInputElement | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const bootstrappedRef = useRef(false);

  const {
    addMessage,
    addressUploaded,
    identityUploaded,
    rollbackProcessing,
    setActiveTab,
    setChatLoading,
    setProcessingResult,
    setProcessingStarted,
    uploadAddress,
    uploadIdentity,
  } = useKycStore(useShallow((state) => ({
    addMessage: state.addMessage,
    addressUploaded: state.addressUploaded,
    identityUploaded: state.identityUploaded,
    rollbackProcessing: state.rollbackProcessing,
    setActiveTab: state.setActiveTab,
    setChatLoading: state.setChatLoading,
    setProcessingResult: state.setProcessingResult,
    setProcessingStarted: state.setProcessingStarted,
    uploadAddress: state.uploadAddress,
    uploadIdentity: state.uploadIdentity,
  })));

  const requestAssistantReply = useCallback(
    async (processingResult?: KycProcessingResult | null, manageLoading = true) => {
      const state = useKycStore.getState();

      if (manageLoading) {
        setChatLoading(true);
      }

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: state.messages,
            uiState: {
              identityUploaded: state.identityUploaded,
              addressUploaded: state.addressUploaded,
              confirmReceived: state.confirmReceived,
            },
            processingResult,
          }),
        });

        if (!response.ok) {
          throw new Error("Unable to reach the KYC service agent.");
        }

        const payload = (await response.json()) as { message: string };
        addMessage("assistant", payload.message);
      } catch {
        addMessage(
          "assistant",
          "The KYC service remains available, but the latest request could not be completed. Please retry the current step.",
        );
      } finally {
        if (manageLoading) {
          setChatLoading(false);
        }
      }
    },
    [addMessage, setChatLoading],
  );

  useEffect(() => {
    if (bootstrappedRef.current) {
      return;
    }

    bootstrappedRef.current = true;
    void requestAssistantReply();
  }, [requestAssistantReply]);

  const handleFileSelection = async (file: File, type: "identity" | "address") => {
    if (!ACCEPTED_TYPES.has(file.type)) {
      addMessage(
        "assistant",
        "Only PNG or JPG files can be accepted for customer verification. Please upload a compliant document image.",
      );
      return;
    }

    const fileData = await readFileAsDataUrl(file);

    if (type === "identity") {
      uploadIdentity(file.name, fileData);
    } else {
      uploadAddress(file.name, fileData);
    }

    setActiveTab("uploaded-documents");
    await requestAssistantReply();
  };

  const handleSendMessage = async (value: string) => {
    const message = value.trim();

    if (!message) {
      return;
    }

    addMessage("user", message);

    const state = useKycStore.getState();
    const shouldProcess = message.trim().toUpperCase() === "CONFIRM" && state.identityUploaded && state.addressUploaded;

    if (!shouldProcess) {
      await requestAssistantReply();
      return;
    }

    setProcessingStarted();
    setActiveTab("activity-timeline");
    setChatLoading(true);

    try {
      const latestState = useKycStore.getState();
      const response = await fetch("/api/process-kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identityFileName: latestState.identityFileName,
          addressFileName: latestState.addressFileName,
          identityFileData: latestState.identityFileData,
          addressFileData: latestState.addressFileData,
        }),
      });

      if (response.status === 422 || response.status === 400) {
        const errorPayload = (await response.json()) as { error?: string };
        const reason =
          errorPayload.error && errorPayload.error.trim()
            ? errorPayload.error
            : "One or more documents could not be validated. Please ensure you have uploaded a valid identity document and a valid proof of address, then try again.";

        rollbackProcessing(reason);
        addMessage("assistant", reason);
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to process the verification package.");
      }

      const result = (await response.json()) as KycProcessingResult;
      setProcessingResult(result);
      setActiveTab("verification-results");
      await requestAssistantReply(result, false);
    } catch {
      rollbackProcessing(
        "Verification processing did not complete. The case remains available for resubmission.",
      );
      addMessage(
        "assistant",
        "Verification could not be completed at this time. Please type \"CONFIRM\" again to resubmit the current case package.",
      );
    } finally {
      setChatLoading(false);
    }
  };

  const handleAttachmentClick = () => {
    const state = useKycStore.getState();

    if (!state.identityUploaded) {
      identityInputRef.current?.click();
      return;
    }

    if (!state.addressUploaded) {
      addressInputRef.current?.click();
    }
  };

  const attachmentLabel = !identityUploaded
    ? "Identity document"
    : !addressUploaded
      ? "Proof of address"
      : "Documents complete";

  return (
    <div className="min-h-screen">
      <TopHeader />

      <div className="mx-auto flex max-w-[1600px] gap-4 px-4 py-4 lg:px-6">
        <SidebarNav />

        <main className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <RecordWorkspace
            identityInputRef={identityInputRef}
            addressInputRef={addressInputRef}
            onIdentitySelected={(file) => handleFileSelection(file, "identity")}
            onAddressSelected={(file) => handleFileSelection(file, "address")}
          />

          <ChatPanel
            onSendMessage={handleSendMessage}
            onAttachmentClick={handleAttachmentClick}
            attachmentLabel={attachmentLabel}
            canAttach={!identityUploaded || !addressUploaded}
          />
        </main>
      </div>
    </div>
  );
}
