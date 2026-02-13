"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  validateMediaFile,
  generateMediaStoragePath,
  revokePreviewUrl,
  type MediaType,
} from "@/lib/media-upload";
import {
  buildMonthDate,
  formatMonthLabel,
  getAvailableYears,
  getMonthNames,
  type Language,
} from "@/lib/month-helpers";

interface CreateReleaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateReleaseModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateReleaseModalProps) {
  const [title, setTitle] = useState("");
  const [lang, setLang] = useState<"ES" | "EN" | "PT">("ES");
  const [monthNumber, setMonthNumber] = useState<string>(""); // 1-12
  const [year, setYear] = useState<string>(""); // e.g., "2026"
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");
  const [orderIndex, setOrderIndex] = useState("0");
  const [kbUrl, setKbUrl] = useState("");
  const [releaseType, setReleaseType] = useState<"feature" | "bug">("feature");
  const [hasCost, setHasCost] = useState(false);
  const [bullets, setBullets] = useState<string[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<MediaType | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      revokePreviewUrl(mediaPreviewUrl);
    };
  }, []);

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
    setMediaFile(file);
    setMediaType(validation.mediaType!);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(previewUrl);
  };

  const handleAddBullet = () => {
    if (bullets.length < 5) {
      setBullets([...bullets, ""]);
    }
  };

  const handleRemoveBullet = (idx: number) => {
    setBullets(bullets.filter((_, i) => i !== idx));
  };

  const handleBulletChange = (idx: number, value: string) => {
    const newBullets = [...bullets];
    newBullets[idx] = value;
    setBullets(newBullets);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!mediaFile || !mediaType) {
      toast.error("Media file (image or video) is required");
      return;
    }

    if (!monthNumber || !year) {
      toast.error("Debes seleccionar mes y año");
      return;
    }

    setLoading(true);

    try {
      // Generate storage path
      const mediaPath = generateMediaStoragePath(mediaFile, mediaType);

      // Upload media to Supabase
      const { error: uploadError } = await supabase.storage
        .from("new-releases")
        .upload(mediaPath, mediaFile, { upsert: false });

      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      // Build month_date and month_label
      const monthDateValue = buildMonthDate(parseInt(year), parseInt(monthNumber));
      const monthLabelValue = formatMonthLabel(lang as Language, parseInt(year), parseInt(monthNumber));

      // Create release record with group_id = id (will update after insert)
      const { data: insertData, error: insertError } = await supabase
        .from("new_releases")
        .insert([
          {
            title,
            lang,
            month_label: monthLabelValue,
            month_date: monthDateValue,
            size,
            order_index: parseInt(orderIndex),
            kb_url: kbUrl,
            media_path: mediaPath,
            media_type: mediaType,
            bullets: bullets.filter((b) => b.trim()),
            published: true,
            release_type: releaseType,
            has_cost: releaseType === "bug" ? false : hasCost,
            tenant: null,
            group_id: null,
          },
        ])
        .select();

      if (insertError) {
        // Try to delete the uploaded media
        await supabase.storage.from("new-releases").remove([mediaPath]).catch(() => {
          // Ignore delete errors
        });
        toast.error(`Failed to create release: ${insertError.message}`);
        setLoading(false);
        return;
      }

      // Update group_id to match id (for first release in group)
      if (insertData && insertData.length > 0) {
        const newId = insertData[0].id;
        const { error: updateError } = await supabase
          .from("new_releases")
          .update({ group_id: newId })
          .eq("id", newId);

        if (updateError) {
          toast.error(`Failed to set group: ${updateError.message}`);
          setLoading(false);
          return;
        }
      }

      toast.success("Release created successfully!");
      
      // Reset form
      setTitle("");
      setLang("ES");
      setMonthNumber("");
      setYear("");
      setSize("md");
      setOrderIndex("0");
      setKbUrl("");
      setReleaseType("feature");
      setHasCost(false);
      setBullets([]);
      revokePreviewUrl(mediaPreviewUrl);
      setMediaFile(null);
      setMediaType(null);
      setMediaPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Release</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="title"
              placeholder="Enter text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Lang */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Language</Label>
            <Select value={lang} onValueChange={(v) => setLang(v as "ES" | "EN" | "PT")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ES">ES</SelectItem>
                <SelectItem value="EN">EN</SelectItem>
                <SelectItem value="PT">PT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Media Upload (Image or Video) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Media (Image or Video)</Label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaSelect}
                disabled={loading}
                className="hidden"
                id="media-input"
              />
              <label
                htmlFor="media-input"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Choose file
              </label>
              {mediaFile && (
                <span className="text-sm text-slate-600">
                  {mediaFile.name} ({mediaType === "video" ? "Video" : "Image"})
                </span>
              )}
            </div>
            {mediaPreviewUrl && (
              <div className="mt-4 rounded-md overflow-hidden border border-slate-200">
                {mediaType === "video" ? (
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
          </div>

          {/* Bulletpoints */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Highlights</Label>
            <div className="space-y-2">
              {bullets.map((bullet, idx) => (
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
            {bullets.length < 5 && (
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

          {/* Tipo (Release Type) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo</Label>
            <Select value={releaseType} onValueChange={(v) => {
              const newType = v as "feature" | "bug";
              setReleaseType(newType);
              // Auto-disable has_cost for bugs
              if (newType === "bug") {
                setHasCost(false);
              }
            }}>
              <SelectTrigger>
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
                checked={hasCost}
                onCheckedChange={setHasCost}
                disabled={releaseType === "bug" || loading}
              />
              <span className="text-sm text-slate-600">
                {releaseType === "bug" ? "(Disabled for Bug releases)" : hasCost ? "Yes" : "No"}
              </span>
            </div>
          </div>

          {/* KB URL */}
          <div className="space-y-2">
            <Label htmlFor="kb-url" className="text-sm font-medium">
              KB URL
            </Label>
            <Input
              id="kb-url"
              type="url"
              placeholder="https://example.com"
              value={kbUrl}
              onChange={(e) => setKbUrl(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Status: Read-only (always published for new releases) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Badge className="bg-green-100 text-green-900 border border-green-200 w-fit">
              Publicado
            </Badge>
            <p className="text-xs text-slate-500 mt-1">Los nuevos releases se crean como publicados</p>
          </div>

          {/* Month and Year */}
          <div className="grid grid-cols-2 gap-4">
            {/* Month Dropdown */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Month *</Label>
              <Select value={monthNumber} onValueChange={setMonthNumber}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {getMonthNames(lang as Language).map((month, idx) => (
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

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Release"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
