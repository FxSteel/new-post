"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { X } from "lucide-react";

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
  const [lang, setLang] = useState<"ES" | "EN" | "PT/BR">("ES");
  const [monthLabel, setMonthLabel] = useState("");
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");
  const [orderIndex, setOrderIndex] = useState("0");
  const [kbUrl, setKbUrl] = useState("");
  const [status, setStatus] = useState("published");
  const [bullets, setBullets] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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

    if (!imageFile) {
      toast.error("Image is required");
      return;
    }

    setLoading(true);

    try {
      // Upload image
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `cards/${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("new-releases")
        .upload(fileName, imageFile);

      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      // Create release record
      const { error: insertError } = await supabase
        .from("new_releases")
        .insert([
          {
            title,
            lang,
            month_label: monthLabel,
            size,
            order_index: parseInt(orderIndex),
            kb_url: kbUrl,
            image_path: fileName,
            bullets: bullets.filter((b) => b.trim()),
            published: status === "published",
            tenant: null,
          },
        ]);

      if (insertError) {
        toast.error(`Failed to create release: ${insertError.message}`);
        setLoading(false);
        return;
      }

      toast.success("Release created successfully!");
      
      // Reset form
      setTitle("");
      setLang("ES");
      setMonthLabel("");
      setSize("md");
      setOrderIndex("0");
      setKbUrl("");
      setStatus("published");
      setBullets([]);
      setImageFile(null);
      setImagePreview(null);
      
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
            <Select value={lang} onValueChange={(v) => setLang(v as "ES" | "EN" | "PT/BR")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ES">ES</SelectItem>
                <SelectItem value="EN">EN</SelectItem>
                <SelectItem value="PT/BR">PT/BR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Image</Label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                disabled={loading}
                className="hidden"
                id="image-input"
              />
              <label
                htmlFor="image-input"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Choose file
              </label>
              {imageFile && <span className="text-sm text-slate-600">{imageFile.name}</span>}
            </div>
            {imagePreview && (
              <div className="mt-4 rounded-md overflow-hidden border border-slate-200">
                <div className="aspect-[1400/732] w-full bg-slate-100">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
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
                + Add highlight
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

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="paused" disabled>
                  Paused
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Month Label */}
          <div className="space-y-2">
            <Label htmlFor="month" className="text-sm font-medium">
              Month Label (optional)
            </Label>
            <Input
              id="month"
              placeholder="e.g., Nov 2025"
              value={monthLabel}
              onChange={(e) => setMonthLabel(e.target.value)}
              disabled={loading}
            />
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
