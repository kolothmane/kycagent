"use client";

import type { RefObject } from "react";
import {
  BadgeCheck,
  CalendarClock,
  FileText,
  FolderKanban,
  IdCard,
  MapPinned,
  Shield,
  UserRound,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { StatusBadge } from "@/components/status-badge";
import { UploadZone } from "@/components/upload-zone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKycStore } from "@/store/kyc-store";
import { cn } from "@/lib/utils";
import type { RecordTab, TimelineEntry } from "@/lib/types";

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1 rounded-xl border border-white/60 bg-slate-50/80 p-3 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function TimelineList({ entries }: { entries: TimelineEntry[] }) {
  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <div key={entry.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "mt-1 h-3 w-3 rounded-full",
                entry.tone === "success" && "bg-emerald-500",
                entry.tone === "progress" && "bg-accent",
                entry.tone === "warning" && "bg-amber-500",
                entry.tone === "neutral" && "bg-slate-400",
              )}
            />
            {index !== entries.length - 1 ? <span className="mt-1 h-full w-px bg-border" /> : null}
          </div>
          <div className="min-w-0 flex-1 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-foreground">{entry.title}</div>
              <div className="text-xs text-muted-foreground">{entry.timestamp}</div>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{entry.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface RecordWorkspaceProps {
  identityInputRef: RefObject<HTMLInputElement | null>;
  addressInputRef: RefObject<HTMLInputElement | null>;
  onIdentitySelected: (file: File) => void | Promise<void>;
  onAddressSelected: (file: File) => void | Promise<void>;
}

export function RecordWorkspace({
  identityInputRef,
  addressInputRef,
  onIdentitySelected,
  onAddressSelected,
}: RecordWorkspaceProps) {
  const {
    activeTab,
    activityLog,
    addressFileName,
    addressUploaded,
    complianceScore,
    confirmReceived,
    extractedData,
    identityFileName,
    identityUploaded,
    kycStatus,
    nextSteps,
    processingSummary,
    referenceId,
    salesforceRecordId,
    setActiveTab,
    timeline,
  } = useKycStore(useShallow((state) => ({
    activeTab: state.activeTab,
    activityLog: state.activityLog,
    addressFileName: state.addressFileName,
    addressUploaded: state.addressUploaded,
    complianceScore: state.complianceScore,
    confirmReceived: state.confirmReceived,
    extractedData: state.extractedData,
    identityFileName: state.identityFileName,
    identityUploaded: state.identityUploaded,
    kycStatus: state.kycStatus,
    nextSteps: state.nextSteps,
    processingSummary: state.processingSummary,
    referenceId: state.referenceId,
    salesforceRecordId: state.salesforceRecordId,
    setActiveTab: state.setActiveTab,
    timeline: state.timeline,
  })));

  const applicantName = extractedData
    ? `${extractedData.firstName} ${extractedData.lastName}`
    : identityUploaded
      ? "Customer profile pending validation"
      : "Awaiting identity document";

  const journeyStage = !identityUploaded
    ? "Document collection"
    : !addressUploaded
      ? "Address confirmation"
      : !confirmReceived
        ? "Authorization pending"
        : kycStatus === "PROCESSING"
          ? "Verification running"
          : "Case cleared";

  const scoreBarColor =
    kycStatus === "APPROVED"
      ? "bg-emerald-500"
      : kycStatus === "PROCESSING"
        ? "bg-accent"
        : kycStatus === "REJECTED"
          ? "bg-rose-500"
          : "bg-amber-500";

  return (
    <div className="space-y-4">
      <Card className="surface-panel border-white/80 bg-white/85">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="section-title">KYC Case Record</div>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">KYC Service Agent</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Customer Verification Workspace
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-slate-50/80 p-4 shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Current Status
                  </div>
                  <div className="mt-3">
                    <StatusBadge status={kycStatus} />
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-slate-50/80 p-4 shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Salesforce Record ID
                  </div>
                  <div className="mt-3 font-mono text-sm font-semibold text-foreground">
                    {salesforceRecordId ?? "Pending record creation"}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-2xl border border-border bg-slate-50/80 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-foreground">Compliance posture</div>
                  <div className="text-sm font-semibold text-foreground">{complianceScore}</div>
                </div>
                <Progress
                  value={complianceScore}
                  indicatorClassName={scoreBarColor}
                  className="mt-3 h-2.5 bg-slate-200"
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <DetailItem label="Queue" value="KYC Cases / Paris Retail" />
                  <DetailItem label="Journey Stage" value={journeyStage} />
                  <DetailItem label="Reference ID" value={referenceId ?? "Assigned on completion"} />
                </div>
              </div>

              <div className="rounded-2xl border border-accent/10 bg-gradient-to-br from-accent/10 via-white to-white p-5 shadow-sm">
                <div className="section-title">Processing Summary</div>
                <div className="mt-3 text-sm leading-6 text-foreground">{processingSummary}</div>
                <div className="mt-4 grid gap-3">
                  <DetailItem label="Document Package" value={`${identityUploaded ? "Identity" : "Identity pending"} / ${addressUploaded ? "Address" : "Address pending"}`} />
                  <DetailItem label="Operational Path" value={confirmReceived ? "Active verification workflow" : "Waiting for customer confirmation"} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="record-grid">
        <Card className="surface-panel">
          <CardHeader>
            <CardTitle>Applicant Summary</CardTitle>
            <CardDescription>Primary customer data aligned to the active onboarding case.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Applicant Name" value={applicantName} />
            <DetailItem label="Service Channel" value="Digital onboarding" />
            <DetailItem
              label="Residence Address"
              value={extractedData?.address ?? "Pending proof-of-address verification"}
            />
            <DetailItem
              label="Date of Birth"
              value={extractedData?.dateOfBirth ?? "Available after document validation"}
            />
            <DetailItem
              label="Nationality"
              value={extractedData?.nationality ?? "Available after document validation"}
            />
            <DetailItem label="Case Owner" value="KYC Service Agent Queue" />
          </CardContent>
        </Card>

        <Card className="surface-panel">
          <CardHeader>
            <CardTitle>KYC Details</CardTitle>
            <CardDescription>Validation signals, reference fields, and extracted metadata.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Document Type" value={extractedData?.documentType ?? "Awaiting identity capture"} />
            <DetailItem
              label="Document Number"
              value={extractedData?.documentNumber ?? "Available after OCR extraction"}
            />
            <DetailItem
              label="Expiry Date"
              value={extractedData?.expiryDate ?? "Available after OCR extraction"}
            />
            <DetailItem label="Reference ID" value={referenceId ?? "Issued during processing"} />
            <DetailItem label="Salesforce Record ID" value={salesforceRecordId ?? "Generated after approval"} />
            <DetailItem label="Compliance Score" value={`${complianceScore} / 100`} />
          </CardContent>
        </Card>
      </div>

      <Card className="surface-panel">
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Collect the required identity and address evidence for the case package.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <UploadZone
              title="Identity document"
              description="Primary customer identity image used for extraction and validation."
              uploaded={identityUploaded}
              fileName={identityFileName}
              inputRef={identityInputRef}
              onFileAccepted={onIdentitySelected}
            />
            <UploadZone
              title="Proof of address"
              description="Recent address evidence linked to the residential verification check."
              uploaded={addressUploaded}
              fileName={addressFileName}
              inputRef={addressInputRef}
              onFileAccepted={onAddressSelected}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <DetailItem label="Accepted Formats" value="PNG / JPG" />
            <DetailItem
              label="Submission State"
              value={
                !identityUploaded
                  ? "Identity document pending"
                  : !addressUploaded
                    ? "Proof of address pending"
                    : "Documentation complete"
              }
            />
            <DetailItem label="Retention Policy" value="Active case file retention enabled" />
          </div>
        </CardContent>
      </Card>

      <Card className="surface-panel">
        <CardHeader>
          <CardTitle>Processing Summary</CardTitle>
          <CardDescription>Operational output, routing guidance, and case activity.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-2xl border border-border bg-slate-50/80 p-5">
            <div className="section-title">Case Overview</div>
            <div className="mt-3 text-sm leading-6 text-foreground">{processingSummary}</div>
            <div className="mt-5 space-y-3">
              {nextSteps.map((step) => (
                <div key={step} className="flex gap-3 rounded-xl border border-white/70 bg-white/80 p-3 shadow-sm">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div className="text-sm text-foreground">{step}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-slate-50/80 p-5">
            <div className="section-title">Recent Activity</div>
            <div className="mt-4 space-y-3">
              {activityLog.map((entry) => (
                <div key={`${entry.label}-${entry.timestamp}`} className="rounded-xl border border-white/70 bg-white/80 p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold text-foreground">{entry.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{entry.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-panel">
        <CardHeader>
          <CardTitle>Record Workspace</CardTitle>
          <CardDescription>Structured case views for onboarding, verification, and audit activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as RecordTab)}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="uploaded-documents">Uploaded Documents</TabsTrigger>
              <TabsTrigger value="verification-results">Verification Results</TabsTrigger>
              <TabsTrigger value="activity-timeline">Activity Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-border bg-slate-50/80 p-5">
                  <UserRound className="h-5 w-5 text-accent" />
                  <div className="mt-4 text-sm font-semibold text-foreground">Applicant Focus</div>
                  <div className="mt-2 text-sm leading-6 text-muted-foreground">
                    The active case is aligned to a digital onboarding workflow for a retail financial services customer profile.
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-slate-50/80 p-5">
                  <Shield className="h-5 w-5 text-accent" />
                  <div className="mt-4 text-sm font-semibold text-foreground">Control Posture</div>
                  <div className="mt-2 text-sm leading-6 text-muted-foreground">
                    Document validation, identity checks, compliance scoring, and CRM synchronization are all captured within the active verification workspace.
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-slate-50/80 p-5">
                  <FolderKanban className="h-5 w-5 text-accent" />
                  <div className="mt-4 text-sm font-semibold text-foreground">Operational Routing</div>
                  <div className="mt-2 text-sm leading-6 text-muted-foreground">
                    Cleared profiles move directly to onboarding operations, while exceptions can remain available for analyst review without leaving the console.
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="uploaded-documents">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-slate-50/80 p-5">
                  <div className="flex items-center gap-3">
                    <IdCard className="h-5 w-5 text-accent" />
                    <div className="text-sm font-semibold text-foreground">Identity document</div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {identityFileName
                      ? `${identityFileName} is attached to the active case package and ready for verification intake.`
                      : "No identity document has been attached yet."}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-slate-50/80 p-5">
                  <div className="flex items-center gap-3">
                    <MapPinned className="h-5 w-5 text-accent" />
                    <div className="text-sm font-semibold text-foreground">Proof of address</div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {addressFileName
                      ? `${addressFileName} is attached to the active case package and linked to the address validation control.`
                      : "No proof of address has been attached yet."}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="verification-results">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-slate-50/80 p-5">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-accent" />
                    <div className="text-sm font-semibold text-foreground">Extracted Data</div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <DetailItem
                      label="Full Name"
                      value={extractedData ? `${extractedData.firstName} ${extractedData.lastName}` : "Pending verification"}
                    />
                    <DetailItem label="Document Type" value={extractedData?.documentType ?? "Pending verification"} />
                    <DetailItem label="Document Number" value={extractedData?.documentNumber ?? "Pending verification"} />
                    <DetailItem label="Address" value={extractedData?.address ?? "Pending verification"} />
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-slate-50/80 p-5">
                  <div className="flex items-center gap-3">
                    <CalendarClock className="h-5 w-5 text-accent" />
                    <div className="text-sm font-semibold text-foreground">Decision Outcome</div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {extractedData
                      ? "Verification output is complete and the case record includes extracted document fields, a compliance score, and the generated Salesforce record."
                      : "Verification results will appear here as soon as processing completes."}
                  </div>
                  <div className="mt-5 grid gap-3">
                    <DetailItem label="KYC Status" value={kycStatus} />
                    <DetailItem label="Compliance Score" value={`${complianceScore} / 100`} />
                    <DetailItem label="Salesforce Record ID" value={salesforceRecordId ?? "Pending completion"} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity-timeline">
              <TimelineList entries={timeline} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
