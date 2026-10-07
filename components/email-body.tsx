import { FileText, Paperclip } from "lucide-react";
import type { AttachmentInfo } from "@/lib/types";
import { attachmentUrl, formatBytes, isImageAttachment, splitEmailText } from "@/lib/email-display";

/**
 * An email's text with its images. Inline images ("[cid:...]" in the text) appear where they were
 * in the email; other attachments are listed underneath. Files load from Outlook on demand.
 */
export function EmailBody({ text, attachments = [], compact = false, className = "" }: { text: string; attachments?: AttachmentInfo[]; compact?: boolean; className?: string }) {
  const { segments, others } = splitEmailText(text, attachments);
  const images = others.filter(isImageAttachment);
  const files = others.filter((item) => !isImageAttachment(item));
  return (
    <div className={className}>
      <div className={`whitespace-pre-wrap ${compact ? "text-xs leading-5" : "text-sm leading-7"}`}>
        {segments.map((segment, index) => segment.kind === "text"
          ? <span key={index}>{segment.value}</span>
          : (
            <a key={index} href={attachmentUrl(segment.attachment)} target="_blank" rel="noreferrer" className="my-1 inline-block align-middle">
              {/* eslint-disable-next-line @next/next/no-img-element -- streamed from Outlook, not a static asset */}
              <img src={attachmentUrl(segment.attachment)} alt={segment.attachment.filename} loading="lazy" className="rounded-md" style={{ maxWidth: "100%", maxHeight: compact ? 96 : 240 }} />
            </a>
          ))}
      </div>
      {images.length || files.length ? (
        <div className="mt-3 border-t divider pt-3">
          <p className="label mb-2 flex items-center gap-1.5"><Paperclip size={12} aria-hidden="true" />Attachments</p>
          {images.length ? (
            <div className="mb-2 flex flex-wrap gap-2">
              {images.map((image) => (
                <a key={image.id} href={attachmentUrl(image)} target="_blank" rel="noreferrer" title={`${image.filename} (${formatBytes(image.sizeBytes)})`} className="block overflow-hidden rounded-lg border divider bg-[var(--ink-3)]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- streamed from Outlook, not a static asset */}
                  <img src={attachmentUrl(image)} alt={image.filename} loading="lazy" className="block object-cover" style={{ width: compact ? 72 : 112, height: compact ? 72 : 112 }} />
                </a>
              ))}
            </div>
          ) : null}
          {files.length ? (
            <div className="flex flex-wrap gap-2">
              {files.map((file) => (
                <a key={file.id} href={attachmentUrl(file)} target="_blank" rel="noreferrer" className="chip inline-flex min-h-[36px] items-center gap-2 no-underline">
                  <FileText size={13} aria-hidden="true" />
                  <span className="max-w-[220px] truncate">{file.filename}</span>
                  <span className="muted text-[10px]">{formatBytes(file.sizeBytes)}</span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
