"use client";

import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/context";
import { CloudUpload, FileText, Trash2, X } from "lucide-react";
import { useRef } from "react";

export type PendingFile = { id: string; file: File };

export function FileDropzone({
  files,
  onChange,
  accept = "image/*,.pdf,.doc,.docx",
  hint,
}: {
  files: PendingFile[];
  onChange: (files: PendingFile[]) => void;
  accept?: string;
  hint?: string;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const hintText = hint ?? t.form.dropHint;

  function add(list: FileList | null) {
    if (!list?.length) return;
    const next = [...files];
    Array.from(list).forEach((file) => {
      if (file.size > 12 * 1024 * 1024) return;
      next.push({ id: `${file.name}-${file.size}-${file.lastModified}`, file });
    });
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          add(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-[12px] border border-dashed border-[#e10600]/45 bg-red-50/40 px-4 py-7 text-center",
        )}
      >
        <CloudUpload className="h-7 w-7 text-[#e10600]" />
        <div className="mt-2 text-sm font-bold">{t.form.dropzone}</div>
        <div className="mt-1 text-xs text-gray-500">{hintText}</div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept={accept}
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </button>

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-2 rounded-[10px] border border-[#e8eaee] bg-white px-3 py-2 text-sm"
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-[#e10600]" />
                <span className="truncate font-semibold">{f.file.name}</span>
                <span className="shrink-0 text-xs text-gray-400">
                  {(f.file.size / 1024).toFixed(0)} Ko
                </span>
              </span>
              <button
                type="button"
                className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                onClick={() => onChange(files.filter((x) => x.id !== f.id))}
                aria-label={t.form.remove}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AttachmentList({
  items,
  onDownload,
  onDelete,
}: {
  items: { id: string; originalName: string; sizeBytes: number; label?: string | null }[];
  onDownload: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const { t } = useI18n();

  if (!items.length) {
    return <div className="text-sm text-gray-500">{t.form.noAttachments}</div>;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((d) => (
        <li
          key={d.id}
          className="flex items-center justify-between gap-2 rounded-[10px] border border-[#e8eaee] bg-[#fafbfc] px-3 py-2 text-sm"
        >
          <button type="button" className="inline-flex min-w-0 items-center gap-2 text-start hover:text-[#e10600]" onClick={() => onDownload(d.id)}>
            <FileText className="h-4 w-4 shrink-0 text-[#e10600]" />
            <span className="truncate font-semibold">{d.label || d.originalName}</span>
            <span className="shrink-0 text-xs text-gray-400">{(d.sizeBytes / 1024).toFixed(0)} Ko</span>
          </button>
          {onDelete && (
            <button
              type="button"
              className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
              onClick={() => onDelete(d.id)}
              aria-label={t.form.remove}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}