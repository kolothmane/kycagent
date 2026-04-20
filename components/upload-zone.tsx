"use client";

import { useState } from "react";
import type { RefObject } from "react";
import { CheckCircle2, FileImage, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  title: string;
  description: string;
  uploaded: boolean;
  fileName: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onFileAccepted: (file: File) => void | Promise<void>;
}

export function UploadZone({
  title,
  description,
  uploaded,
  fileName,
  inputRef,
  onFileAccepted,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) {
      return;
    }

    await onFileAccepted(file);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed p-5 transition-all",
        uploaded
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-border bg-slate-50/70",
        isDragging && "border-accent bg-accent/5",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={async (event) => {
        event.preventDefault();
        setIsDragging(false);
        await handleFile(event.dataTransfer.files?.[0] ?? null);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={async (event) => {
          await handleFile(event.target.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
      />

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            uploaded ? "bg-emerald-100 text-emerald-700" : "bg-white text-accent shadow-sm",
          )}
        >
          {uploaded ? <CheckCircle2 className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {uploaded ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                Uploaded
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-sm text-muted-foreground">{description}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={uploaded ? "secondary" : "default"}
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <FileImage className="h-4 w-4" />
              {uploaded ? "Replace file" : "Upload file"}
            </Button>
            <span className="text-xs text-muted-foreground">PNG or JPG only</span>
          </div>

          <div className="mt-4 rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm shadow-sm">
            {fileName ? (
              <span className="font-medium text-foreground">{fileName}</span>
            ) : (
              <span className="text-muted-foreground">
                Drag and drop the document here or select a file from your device.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
