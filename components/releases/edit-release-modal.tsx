"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewRelease } from "@/types/new-release";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { X, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  buildMonthDate,
  formatMonthLabel,
  getAvailableYears,
  getMonthNames,
  parseMonthDate,
  type Language,
} from "@/lib/month-helpers";
import {
  validateMediaFile,
  generateMediaStoragePath,
  revokePreviewUrl,
  type MediaType,
} from "@/lib/media-upload";

interface EditReleaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  release: NewRelease | null;
  onSuccess: () => void;
}

export function EditReleaseModal({
  open,
  onOpenChange,
  release,
  onSuccess,
}: EditReleaseModalProps) {
  // Shared fields
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");
  const [orderIndex, setOrderIndex] = useState("0");
  const [kbUrl, setKbUrl] = useState("");
  const [status, setStatus] = useState("published");
  const [mediaPath, setMediaPath] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType | null>(null);
  const [newMediaFile, setNewMediaFile] = useState<File | null>(null);
  const [newMediaType, setNewMediaType] = useState<MediaType | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [monthNumber, setMonthNumber] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Group data
  const [groupRows, setGroupRows] = useState<NewRelease[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showTranslationForm, setShowTranslationForm] = useState(false);
  const [newTranslationLang, setNewTranslationLang] = useState<"ES" | "EN" | "PT">("EN");
  
  // Per-language state for active tab
  const [tabTitle, setTabTitle] = useState("");
  const [tabBullets, setTabBullets] = useState<string[]>([]);
  const [tabReleaseType, setTabReleaseType] = useState<"feature" | "bug">("feature");
  const [tabHasCost, setTabHasCost] = useState(false);
  
  // Translation form draft
  const [translationDraft, setTranslationDraft] = useState({
    title: "",
    monthNumber: "",
    year: "",
    bullets: [] as string[],
  });

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      revokePreviewUrl(mediaPreviewUrl);
    };
  }, [mediaPreviewUrl]);

  useEffect(() => {
    if (release && open) {
      setOrderIndex(release.order_index?.toString() || "0");
      setSize(release.size);
      setKbUrl(release.kb_url);
      setStatus(release.published ? "published" : "paused");
      setMediaPath(release.media_path || null);
      setMediaType(release.media_type || null);
      setNewMediaFile(null);
      setNewMediaType(null);
      revokePreviewUrl(mediaPreviewUrl);
      setMediaPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Parse month_date to get month and year
      if (release.month_date) {
        try {
          const { monthNumber: m, year: y } = parseMonthDate(release.month_date);
          setMonthNumber(m.toString());
          setYear(y.toString());
        } catch (err) {
          console.error("Error parsing month_date:", err);
          setMonthNumber("");
          setYear("");
        }
      } else {
        setMonthNumber("");
        setYear("");
      }
      
      fetchGroupRows(release.group_id || release.id);
      setShowTranslationForm(false);
    }
  }, [release, open]);

  const fetchGroupRows = async (groupKey: string) => {
    try {
      // Fetch all rows with this group_id
      const { data: groupData, error: groupError } = await supabase
        .from("new_releases")
        .select("*")
        .eq("group_id", groupKey);

      if (groupError) {
        console.error("Error fetching group rows:", groupError);
        return;
      }

      if (groupData && groupData.length > 0) {
        setGroupRows(groupData);
        // Set first language as active
        if (groupData.length > 0) {
          setActiveTab(groupData[0].lang);
          loadTabData(groupData[0]);
        }
      } else {
        // No group_id rows found, try fetching by id
        const { data: idData, error: idError } = await supabase
          .from("new_releases")
          .select("*")
          .eq("id", groupKey);

        if (idError) {
          console.error("Error fetching row:", idError);
          return;
        }

        if (idData && idData.length > 0) {
          setGroupRows(idData);
          setActiveTab(idData[0].lang);
          loadTabData(idData[0]);
        }
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const loadTabData = (row: NewRelease) => {
    setTabTitle(row.title);
    setTabBullets(row.bullets || []);
    setTabReleaseType(row.release_type || "feature");
    setTabHasCost(row.has_cost || false);
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate the file
    const validation = validateMediaFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Revoke old preview URL
    revokePreviewUrl(mediaPreviewUrl);

    // Set new media
    setNewMediaFile(file);
    setNewMediaType(validation.mediaType!);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(previewUrl);
  };

  const handleAddBullet = () => {
    if (tabBullets.length < 5) {
      setTabBullets([...tabBullets, ""]);
    }
  };

  const handleRemoveBullet = (idx: number) => {
    setTabBullets(tabBullets.filter((_, i) => i !== idx));
  };

  const handleBulletChange = (idx: number, value: string) => {
    const newBullets = [...tabBullets];
    newBullets[idx] = value;
    setTabBullets(newBullets);
  };

  const handleTranslationBulletChange = (idx: number, value: string) => {
    const newBullets = [...translationDraft.bullets];
    newBullets[idx] = value;
    setTranslationDraft({ ...translationDraft, bullets: newBullets });
  };

  const handleTranslationAddBullet = () => {
    if (translationDraft.bullets.length < 5) {
      setTranslationDraft({
        ...translationDraft,
        bullets: [...translationDraft.bullets, ""],
      });
    }
  };

  const handleTranslationRemoveBullet = (idx: number) => {
    setTranslationDraft({
      ...translationDraft,
      bullets: translationDraft.bullets.filter((_, i) => i !== idx),
    });
  };

  const handleCancelTranslation = () => {
    setShowTranslationForm(false);
    setTranslationDraft({
      title: "",
      monthNumber: "",
      year: "",
      bullets: [],
    });
    setNewTranslationLang("EN");
  };

  const handleTabChange = (lang: string) => {
    // Save current tab data
    if (activeTab) {
      const activeRow = groupRows.find((r) => r.lang === activeTab);
      if (activeRow) {
        // This is just for UI, we don't update yet
      }
    }
    
    // Load new tab data
    setActiveTab(lang);
    const newRow = groupRows.find((r) => r.lang === lang);
    if (newRow) {
      loadTabData(newRow);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (groupRows.length === 0) return;

    if (!monthNumber || !year) {
      toast.error("Debes seleccionar mes y año");
      return;
    }

    setLoading(true);

    try {
      let finalMediaPath = mediaPath;
      let finalMediaType = mediaType;
      const oldMediaPath = mediaPath;

      // If user selected a new media file, upload it
      if (newMediaFile && newMediaType) {
        const uploadPath = generateMediaStoragePath(newMediaFile, newMediaType);

        const { error: uploadError } = await supabase.storage
          .from("new-releases")
          .upload(uploadPath, newMediaFile, { upsert: false });

        if (uploadError) {
          toast.error(`Upload failed: ${uploadError.message}`);
          setLoading(false);
          return;
        }

        finalMediaPath = uploadPath;
        finalMediaType = newMediaType;

        // Optionally delete old media file (after successful upload and DB update)
        // We'll do this at the end
      }

      // Build month_date and month_label from selected month/year
      const monthDateValue = buildMonthDate(parseInt(year), parseInt(monthNumber));
      
      // Save current tab data to groupRows
      const updatedRows = groupRows.map((row) => {
        if (row.lang === activeTab) {
          return {
            ...row,
            title: tabTitle,
            bullets: tabBullets.filter((b) => b.trim()),
            month_date: monthDateValue,
            release_type: tabReleaseType,
            has_cost: tabReleaseType === "bug" ? false : tabHasCost,
          };
        }
        return row;
      });

      // Update all rows in the group (share has_cost across all translations)
      const updatePromises = updatedRows.map((row) =>
        supabase
          .from("new_releases")
          .update({
            title: row.title,
            bullets: row.bullets,
            month_date: monthDateValue,
            size,
            order_index: parseInt(orderIndex),
            kb_url: kbUrl,
            published: status === "published",
            media_path: finalMediaPath,
            media_type: finalMediaType,
            release_type: row.release_type,
            has_cost: row.has_cost,
          })
          .eq("id", row.id)
      );

      const results = await Promise.all(updatePromises);

      // Check for errors
      for (const result of results) {
        if (result.error) {
          // If upload was done, try to delete the new media file on error
          if (newMediaFile && finalMediaPath && finalMediaPath !== oldMediaPath) {
            await supabase.storage
                .from("new-releases")
              .remove([finalMediaPath])
              .catch(() => {
                // Ignore delete errors
              });
          }
          toast.error(`Failed to update: ${result.error.message}`);
          setLoading(false);
          return;
        }
      }

      // If we uploaded new media and there was old media, try to delete it
      if (newMediaFile && oldMediaPath && oldMediaPath !== finalMediaPath) {
        await supabase.storage
          .from("new-releases")
          .remove([oldMediaPath])
          .catch(() => {
            // Ignore delete errors
          });
      }

      toast.success("Release updated successfully!");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableLanguages = () => {
    const used = new Set(groupRows.map((r) => r.lang));
    return (["ES", "EN", "PT"] as const).filter((l) => !used.has(l));
  };

  const handleAddTranslation = async () => {
    if (!translationDraft.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const filteredBullets = translationDraft.bullets.filter((b) => b.trim());
    if (filteredBullets.length === 0) {
      toast.error("At least 1 bullet point is required");
      return;
    }

    if (!translationDraft.monthNumber || !translationDraft.year) {
      toast.error("Debes seleccionar mes y año");
      return;
    }

    setLoading(true);

    try {
      let groupIdToUse = groupRows[0]?.group_id;

      // If no group_id, generate one
      if (!groupIdToUse) {
        groupIdToUse = crypto.randomUUID();

        // Update existing rows with new group_id
        const updatePromises = groupRows.map((row) =>
          supabase
            .from("new_releases")
            .update({ group_id: groupIdToUse })
            .eq("id", row.id)
        );

        const results = await Promise.all(updatePromises);
        for (const result of results) {
          if (result.error) {
            toast.error(`Failed to set group: ${result.error.message}`);
            setLoading(false);
            return;
          }
        }
      }

      // Build month_date from translation draft
      const monthDateValue = buildMonthDate(
        parseInt(translationDraft.year),
        parseInt(translationDraft.monthNumber)
      );
      const monthLabelValue = formatMonthLabel(
        newTranslationLang as Language,
        parseInt(translationDraft.year),
        parseInt(translationDraft.monthNumber)
      );

      // Insert new translation
      const { error: insertError } = await supabase
        .from("new_releases")
        .insert([
          {
            title: translationDraft.title,
            lang: newTranslationLang,
            month_label: monthLabelValue,
            month_date: monthDateValue,
            size,
            order_index: parseInt(orderIndex),
            kb_url: kbUrl,
            media_path: mediaPath,
            media_type: mediaType,
            bullets: filteredBullets,
            published: status === "published",
            release_type: groupRows[0]?.release_type || "feature",
            has_cost: (groupRows[0]?.release_type === "bug") ? false : (groupRows[0]?.has_cost || false),
            tenant: groupRows[0]?.tenant,
            group_id: groupIdToUse,
          },
        ]);

      if (insertError) {
        toast.error(`Failed to create translation: ${insertError.message}`);
        setLoading(false);
        return;
      }

      toast.success("Translation created successfully!");

      // Reload group rows
      fetchGroupRows(groupIdToUse);
      setShowTranslationForm(false);
      setTranslationDraft({
        title: "",
        monthNumber: "",
        year: "",
        bullets: [],
      });
      setNewTranslationLang("EN");
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTranslation = async (langToDelete: string) => {
    if (groupRows.length === 1) {
      toast.error("Cannot delete the only translation");
      return;
    }

    setLoading(true);

    try {
      const rowToDelete = groupRows.find((r) => r.lang === langToDelete);
      if (!rowToDelete) return;

      const { error } = await supabase
        .from("new_releases")
        .delete()
        .eq("id", rowToDelete.id);

      if (error) {
        toast.error(`Failed to delete: ${error.message}`);
        setLoading(false);
        return;
      }

      toast.success("Translation deleted successfully!");
      
      // Reload group rows
      fetchGroupRows(groupRows[0]?.group_id || groupRows[0]?.id);
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (groupRows.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Release</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* SHARED SETTINGS SECTION */}
          <div className="space-y-4 border-b border-slate-200 pb-4">
            <h3 className="text-sm font-semibold text-slate-900">Shared Settings</h3>

            {/* Published Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order Index */}
            <div className="space-y-2">
              <Label htmlFor="order" className="text-sm font-medium">
                Order Index
              </Label>
              <Input
                id="order"
                type="number"
                value={orderIndex}
                onChange={(e) => setOrderIndex(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Size */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Size</Label>
              <Select value={size} onValueChange={(v) => setSize(v as "sm" | "md" | "lg")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* KB URL */}
            <div className="space-y-2">
              <Label htmlFor="kb-url" className="text-sm font-medium">
                KB URL
              </Label>
              <Input
                id="kb-url"
                type="url"
                value={kbUrl}
                onChange={(e) => setKbUrl(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Media (Image or Video) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Media (Image or Video)</Label>
              
              {/* Existing media display */}
              {mediaPath && (
                <div className="p-2 bg-slate-50 rounded border border-slate-200 text-sm text-slate-600">
                  <p className="font-medium">{mediaType === "video" ? "📹" : "🖼️"} {mediaPath}</p>
                  <p className="text-xs mt-1 text-slate-500">Current media (select new file to replace)</p>
                </div>
              )}

              {/* Media upload for replacement */}
              <div className="flex items-center gap-4 pt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaSelect}
                  disabled={loading}
                  className="hidden"
                  id="edit-media-input"
                />
                <label
                  htmlFor="edit-media-input"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {newMediaFile ? "Change file" : "Replace media"}
                </label>
                {newMediaFile && (
                  <span className="text-sm text-slate-600">
                    {newMediaFile.name} ({newMediaType === "video" ? "Video" : "Image"})
                  </span>
                )}
              </div>

              {/* New media preview */}
              {mediaPreviewUrl && (
                <div className="mt-4 rounded-md overflow-hidden border border-slate-200">
                  {newMediaType === "video" ? (
                    <video
                      src={mediaPreviewUrl}
                      controls
                      className="w-full h-auto max-h-96 bg-slate-100"
                    />
                  ) : (
                    <div className="aspect-[1400/732] w-full bg-slate-100">
                      <img
                        src={mediaPreviewUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-xs text-slate-500">
                Same media used for all translations in this group
              </p>
            </div>

            {/* Month and Year */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              {/* Month Dropdown */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Month *</Label>
                <Select value={monthNumber} onValueChange={setMonthNumber}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMonthNames("EN").map((month, idx) => (
                      <SelectItem key={idx} value={(idx + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Dropdown */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Year *</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableYears().map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* TRANSLATIONS SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Translations</h3>
              {getAvailableLanguages().length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTranslationForm(!showTranslationForm)}
                  disabled={loading}
                >
                  {showTranslationForm ? "Cancel" : "Add Language"}
                </Button>
              )}
            </div>

            {/* Tabs for existing translations */}
            {groupRows.length > 0 && (
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${groupRows.length}, 1fr)` }}>
                  {groupRows.map((row) => (
                    <TabsTrigger key={row.lang} value={row.lang}>
                      {row.lang}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {groupRows.map((row) => (
                  <TabsContent key={row.lang} value={row.lang} className="space-y-4 mt-4">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor={`title-${row.lang}`} className="text-sm font-medium">
                        Title
                      </Label>
                      <Input
                        id={`title-${row.lang}`}
                        value={activeTab === row.lang ? tabTitle : ""}
                        onChange={(e) => activeTab === row.lang && setTabTitle(e.target.value)}
                        disabled={loading || activeTab !== row.lang}
                      />
                    </div>

                    {/* Tipo (Release Type) */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tipo</Label>
                      <Select 
                        value={activeTab === row.lang ? tabReleaseType : ""} 
                        onValueChange={(v) => {
                          if (activeTab === row.lang) {
                            const newType = v as "feature" | "bug";
                            setTabReleaseType(newType);
                            // Auto-disable has_cost for bugs
                            if (newType === "bug") {
                              setTabHasCost(false);
                            }
                          }
                        }}
                      >
                        <SelectTrigger disabled={loading || activeTab !== row.lang}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="feature">Feature</SelectItem>
                          <SelectItem value="bug">Bug</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Has Cost */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tiene costo asociado</Label>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={activeTab === row.lang ? tabHasCost : false}
                          onCheckedChange={(checked) => activeTab === row.lang && setTabHasCost(checked)}
                          disabled={loading || activeTab !== row.lang || tabReleaseType === "bug"}
                        />
                        <span className="text-sm text-slate-600">
                          {activeTab === row.lang ? (
                            tabReleaseType === "bug" 
                              ? "(Disabled for Bug releases)" 
                              : tabHasCost ? "Yes" : "No"
                          ) : ""}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Shared across all translations in this group</p>
                    </div>

                    {/* Month Label */}
                    <div className="space-y-2">
                      <Label htmlFor={`month-display-${row.lang}`} className="text-sm font-medium">
                        Month & Year
                      </Label>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200 text-sm text-slate-600">
                        {monthNumber && year ? formatMonthLabel("EN", parseInt(year), parseInt(monthNumber)) : "(Select in Shared Settings)"}
                      </div>
                      <p className="text-xs text-slate-500">Set in shared settings above</p>
                    </div>

                    {/* Bullets */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Highlights</Label>
                      <div className="space-y-2">
                        {activeTab === row.lang && tabBullets.map((bullet, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              placeholder={`Bullet ${idx + 1}`}
                              value={bullet}
                              onChange={(e) => handleBulletChange(idx, e.target.value)}
                              disabled={loading}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveBullet(idx)}
                              disabled={loading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      {activeTab === row.lang && tabBullets.length < 5 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddBullet}
                          disabled={loading}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add highlight
                        </Button>
                      )}
                    </div>

                    {/* Delete Translation Button */}
                    {groupRows.length > 1 && (
                      <div className="pt-2 border-t border-slate-200">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTranslation(row.lang)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete this translation
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}

            {/* Add Translation Form */}
            {showTranslationForm && getAvailableLanguages().length > 0 && (
              <div className="space-y-3 p-3 rounded border border-slate-200 bg-slate-50">
                {/* Language Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Language</Label>
                  <Select value={newTranslationLang} onValueChange={(v) => setNewTranslationLang(v as "ES" | "EN" | "PT")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableLanguages().map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Title</Label>
                  <Input
                    placeholder="Enter title"
                    value={translationDraft.title}
                    onChange={(e) => setTranslationDraft({ ...translationDraft, title: e.target.value })}
                    disabled={loading}
                  />
                </div>

                {/* Month and Year */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Month Dropdown */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Month *</Label>
                    <Select
                      value={translationDraft.monthNumber}
                      onValueChange={(v) => setTranslationDraft({ ...translationDraft, monthNumber: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {getMonthNames("EN").map((month, idx) => (
                          <SelectItem key={idx} value={(idx + 1).toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Year Dropdown */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Year *</Label>
                    <Select
                      value={translationDraft.year}
                      onValueChange={(v) => setTranslationDraft({ ...translationDraft, year: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableYears().map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Bullets */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Highlights</Label>
                  <div className="space-y-2">
                    {translationDraft.bullets.map((bullet, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder={`Bullet ${idx + 1}`}
                          value={bullet}
                          onChange={(e) => handleTranslationBulletChange(idx, e.target.value)}
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTranslationRemoveBullet(idx)}
                          disabled={loading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {translationDraft.bullets.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTranslationAddBullet}
                      disabled={loading}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add highlight
                    </Button>
                  )}
                </div>

                {/* Info text */}
                <p className="text-xs text-slate-500">
                  The image, size, KB URL, and other shared properties will be copied from this release.
                </p>

                {/* Action buttons */}
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelTranslation}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddTranslation}
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Translation"}
                  </Button>
                </div>
              </div>
            )}

            {getAvailableLanguages().length === 0 && (
              <p className="text-xs text-slate-500">All languages have translations</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
