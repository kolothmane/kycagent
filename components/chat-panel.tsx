"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Paperclip, SendHorizontal } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useKycStore } from "@/store/kyc-store";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  onSendMessage: (value: string) => void | Promise<void>;
  onAttachmentClick: () => void;
  attachmentLabel: string;
  canAttach: boolean;
}

export function ChatPanel({
  onSendMessage,
  onAttachmentClick,
  attachmentLabel,
  canAttach,
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const {
    confirmReceived,
    identityUploaded,
    addressUploaded,
    isChatLoading,
    kycStatus,
    messages,
  } = useKycStore((state) => ({
    confirmReceived: state.confirmReceived,
    identityUploaded: state.identityUploaded,
    addressUploaded: state.addressUploaded,
    isChatLoading: state.isChatLoading,
    kycStatus: state.kycStatus,
    messages: state.messages,
  }));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isChatLoading, messages]);

  const nextStepLabel = !identityUploaded
    ? "Awaiting identity document"
    : !addressUploaded
      ? "Awaiting proof of address"
      : !confirmReceived
        ? 'Awaiting "CONFIRM"'
        : "Verification in progress";

  return (
    <Card className="surface-panel overflow-hidden xl:sticky xl:top-[88px] xl:h-[calc(100vh-112px)]">
      <CardHeader className="border-b border-border bg-white/80">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">KYC Service Agent</CardTitle>
              <div className="mt-1 text-sm text-muted-foreground">AI-assisted onboarding</div>
            </div>
          </div>
          <StatusBadge status={kycStatus} />
        </div>
        <div className="mt-4 rounded-2xl border border-border bg-slate-50/80 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Next Required Step
          </div>
          <div className="mt-1 text-sm font-medium text-foreground">{nextStepLabel}</div>
        </div>
      </CardHeader>

      <CardContent className="flex h-full flex-col p-0">
        <ScrollArea className="h-[420px] flex-1 xl:h-auto">
          <div className="space-y-4 p-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-fade-up",
                  message.role === "user" && "justify-end",
                )}
              >
                {message.role === "assistant" ? (
                  <Avatar className="h-9 w-9 border border-white/70 shadow-sm">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                ) : null}

                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                    message.role === "assistant"
                      ? "border border-border bg-white text-foreground"
                      : "bg-accent text-accent-foreground",
                  )}
                >
                  <div className="whitespace-pre-line">{message.content}</div>
                  <div
                    className={cn(
                      "mt-2 text-[11px]",
                      message.role === "assistant" ? "text-muted-foreground" : "text-white/70",
                    )}
                  >
                    {message.createdAt}
                  </div>
                </div>
              </div>
            ))}

            {isChatLoading ? (
              <div className="flex gap-3">
                <Avatar className="h-9 w-9 border border-white/70 shadow-sm">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm">
                  {[0, 1, 2].map((index) => (
                    <span
                      key={index}
                      className="h-2 w-2 rounded-full bg-accent/70 animate-pulse-dot"
                      style={{ animationDelay: `${index * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-border bg-white/80 p-4">
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();

              if (!draft.trim() || isChatLoading) {
                return;
              }

              const currentDraft = draft;
              setDraft("");
              await onSendMessage(currentDraft);
            }}
          >
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-xl"
                onClick={onAttachmentClick}
                disabled={!canAttach || isChatLoading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={
                  confirmReceived
                    ? "Verification is being processed"
                    : `Type your message or attach ${attachmentLabel.toLowerCase()}`
                }
                disabled={isChatLoading}
                className="h-11 rounded-xl bg-slate-50/80"
              />
              <Button
                type="submit"
                size="icon"
                className="rounded-xl"
                disabled={!draft.trim() || isChatLoading}
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Follow the document sequence in the workspace, then type EXACTLY{" "}
              <span className="font-semibold text-foreground">CONFIRM</span> to start verification.
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
