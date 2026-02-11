"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewRelease } from "@/types/new-release";
import { ReleaseImage } from "./release-image";

interface PreviewReleaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupRows: NewRelease[] | null;
}

export function PreviewReleaseModal({
  open,
  onOpenChange,
  groupRows,
}: PreviewReleaseModalProps) {
  if (!groupRows || groupRows.length === 0) return null;

  // Get principal row (EN > ES > first)
  const principalRow = useMemo(() => {
    const enRow = groupRows.find((r) => r.lang === "EN");
    if (enRow) return enRow;
    const esRow = groupRows.find((r) => r.lang === "ES");
    if (esRow) return esRow;
    return groupRows[0];
  }, [groupRows]);

  // Get languages sorted (ES, EN, PT)
  const languages = useMemo(() => {
    return Array.from(new Set(groupRows.map((r) => r.lang)))
      .sort((a, b) => {
        const order = ["ES", "EN", "PT"];
        return (order.indexOf(a) ?? 999) - (order.indexOf(b) ?? 999);
      });
  }, [groupRows]);

  // Get default tab (EN > ES > first)
  const defaultTab = useMemo(() => {
    if (languages.includes("EN")) return "EN";
    if (languages.includes("ES")) return "ES";
    return languages[0];
  }, [languages]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Release Preview</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="w-full pt-4">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${languages.length}, 1fr)` }}>
            {languages.map((lang) => {
              let badgeClasses = "";
              if (lang === "ES") {
                badgeClasses = "bg-yellow-100 text-yellow-900 border border-yellow-200";
              } else if (lang === "EN") {
                badgeClasses = "bg-blue-100 text-blue-900 border border-blue-200";
              } else if (lang === "PT") {
                badgeClasses = "bg-green-100 text-green-900 border border-green-200";
              }
              return (
                <TabsTrigger key={lang} value={lang} className={badgeClasses}>
                  {lang === "PT" ? "PT/BR" : lang}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {languages.map((lang) => {
            const releaseRow = groupRows.find((r) => r.lang === lang);
            if (!releaseRow) return null;

            // Use media from this row, fallback to principal if missing
            const mediaPath = releaseRow.media_path || principalRow.media_path;
            const mediaType = releaseRow.media_type || principalRow.media_type;
            const legacyImagePath = releaseRow.image_path || principalRow.image_path;

            return (
              <TabsContent key={lang} value={lang} className="space-y-6 py-4">
                <ReleaseImage 
                  mediaPath={mediaPath} 
                  mediaType={mediaType}
                  legacyImagePath={legacyImagePath}
                />

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {releaseRow.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {releaseRow.month_label}
                    </p>
                  </div>

                  {releaseRow.bullets && releaseRow.bullets.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">
                        Highlights
                      </h4>
                      <ul className="space-y-2">
                        {releaseRow.bullets.map((bullet, idx) => (
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
                    <Badge
                      className={
                        releaseRow.published
                          ? "bg-green-100 text-green-900 border border-green-200"
                          : "bg-slate-100 text-slate-900 border border-slate-200"
                      }
                    >
                      {releaseRow.published ? "Published" : "Paused"}
                    </Badge>
                    <span className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded">
                      {releaseRow.size.toUpperCase()}
                    </span>
                  </div>

                  {releaseRow.kb_url && (
                    <div>
                      <a
                        href={releaseRow.kb_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {releaseRow.kb_url}
                      </a>
                    </div>
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
