"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { NewRelease } from "@/types/new-release";
import { ReleasesTable } from "@/components/releases/releases-table";
import { CreateReleaseModal } from "@/components/releases/create-release-modal";
import { PreviewReleaseModal } from "@/components/releases/preview-release-modal";
import { EditReleaseModal } from "@/components/releases/edit-release-modal";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [releases, setReleases] = useState<NewRelease[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<NewRelease | null>(null);
  const [selectedGroupRows, setSelectedGroupRows] = useState<NewRelease[] | null>(
    null
  );
  const [filterLang, setFilterLang] = useState<"ALL" | "ES" | "EN" | "PT">("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "published" | "paused">("ALL");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/");
        return;
      }

      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from("new_releases_admins")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        router.push("/");
        return;
      }

      fetchReleases();
    } catch (err) {
      router.push("/");
    }
  };

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("new_releases")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) {
        toast.error("Failed to load releases");
        return;
      }

      setReleases(data || []);
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handlePreview = (groupRows: NewRelease[]) => {
    setSelectedGroupRows(groupRows);
    setPreviewOpen(true);
  };

  const handleEdit = (release: NewRelease) => {
    setSelectedRelease(release);
    setEditOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-8 py-4">
          <h1 className="text-2xl font-bold text-slate-900">New Releases Admin</h1>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              New release
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-slate-200"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-600">Loading releases...</p>
          </div>
        ) : (
          <ReleasesTable
            releases={releases}
            onEdit={handleEdit}
            onPreview={handlePreview}
            onRefresh={fetchReleases}
            filterLang={filterLang}
            setFilterLang={setFilterLang}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
          />
        )}
      </main>

      {/* Modals */}
      <CreateReleaseModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchReleases}
      />

      <PreviewReleaseModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        groupRows={selectedGroupRows}
      />

      <EditReleaseModal
        open={editOpen}
        onOpenChange={setEditOpen}
        release={selectedRelease}
        onSuccess={fetchReleases}
      />
    </div>
  );
}
