"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { NewRelease } from "@/types/new-release";
import { ReleaseImage } from "./release-image";

interface PreviewReleaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  release: NewRelease | null;
}

export function PreviewReleaseModal({
  open,
  onOpenChange,
  release,
}: PreviewReleaseModalProps) {
  if (!release) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Release Preview</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <ReleaseImage imagePath={release.image_path} />

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {release.title}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{release.month_label}</p>
            </div>

            {release.bullets && release.bullets.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">
                  Highlights
                </h4>
                <ul className="space-y-2">
                  {release.bullets.map((bullet, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <span className="text-slate-400 mt-1">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2 pt-4">
              <Badge variant={release.published ? "default" : "secondary"}>
                {release.published ? "Published" : "Paused"}
              </Badge>
              <span className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded">
                {release.size.toUpperCase()}
              </span>
            </div>

            {release.kb_url && (
              <div>
                <a
                  href={release.kb_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {release.kb_url}
                </a>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
