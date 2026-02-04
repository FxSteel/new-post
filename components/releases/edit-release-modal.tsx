"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { X } from "lucide-react";

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
  const [title, setTitle] = useState("");
  const [lang, setLang] = useState<"ES" | "EN" | "PT/BR">("ES");
  const [monthLabel, setMonthLabel] = useState("");
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");
  const [orderIndex, setOrderIndex] = useState("0");
  const [kbUrl, setKbUrl] = useState("");
  const [status, setStatus] = useState("published");
  const [bullets, setBullets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (release && open) {
      setTitle(release.title);
      setLang(release.lang);
      setMonthLabel(release.month_label);
      setSize(release.size);
      setOrderIndex(release.order_index.toString());
      setKbUrl(release.kb_url);
      setStatus(release.published ? "published" : "paused");
      setBullets(release.bullets || []);
    }
  }, [release, open]);

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

    if (!release) return;

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("new_releases")
        .update({
          title,
          lang,
          month_label: monthLabel,
          size,
          order_index: parseInt(orderIndex),
          kb_url: kbUrl,
          bullets: bullets.filter((b) => b.trim()),
          published: status === "published",
        })
        .eq("id", release.id);

      if (error) {
        toast.error(`Failed to update: ${error.message}`);
        setLoading(false);
        return;
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

  if (!release) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Release</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="title"
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
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
