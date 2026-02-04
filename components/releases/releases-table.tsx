"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { NewRelease } from "@/types/new-release";
import { formatDate } from "@/lib/format";
import { supabase } from "@/lib/supabase/client";
import { MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ReleasesTableProps {
  releases: NewRelease[];
  onEdit: (release: NewRelease) => void;
  onPreview: (release: NewRelease) => void;
  onRefresh: () => void;
}

export function ReleasesTable({
  releases,
  onEdit,
  onPreview,
  onRefresh,
}: ReleasesTableProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState({
    order: true,
    month: true,
    lang: true,
    status: true,
    preview: true,
    updated: true,
    actions: true,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredReleases = releases.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.month_label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedIds.size === filteredReleases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReleases.map((r) => r.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSingle = (id: string) => {
    setDeleteTarget(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteMultiple = () => {
    if (selectedIds.size === 0) return;
    setDeleteTarget("multiple");
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const idsToDelete = deleteTarget === "multiple" ? Array.from(selectedIds) : [deleteTarget!];

      for (const id of idsToDelete) {
        const release = releases.find((r) => r.id === id);
        if (release) {
          // Delete image from storage
          await supabase.storage
            .from("new-releases")
            .remove([release.image_path]);
        }
      }

      const { error } = await supabase
        .from("new_releases")
        .delete()
        .in("id", idsToDelete);

      if (error) {
        toast.error(`Delete failed: ${error.message}`);
      } else {
        toast.success("Release(s) deleted successfully!");
        setSelectedIds(new Set());
        onRefresh();
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by title or month..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteMultiple}
            >
              Delete ({selectedIds.size})
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(visibleColumns).map(([col, visible]) => (
                <DropdownMenuItem
                  key={col}
                  onClick={() => toggleColumn(col as keyof typeof visibleColumns)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox checked={visible} onChange={() => {}} />
                  <span className="capitalize">{col}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200 hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedIds.size === filteredReleases.length &&
                    filteredReleases.length > 0
                  }
                  onChange={handleSelectAll}
                />
              </TableHead>
              {visibleColumns.order && (
                <TableHead className="w-20">Order</TableHead>
              )}
              {visibleColumns.month && (
                <TableHead className="w-32">Month</TableHead>
              )}
              {visibleColumns.lang && <TableHead className="w-16">Lang</TableHead>}
              {visibleColumns.status && (
                <TableHead className="w-24">Status</TableHead>
              )}
              {visibleColumns.preview && (
                <TableHead className="w-20">Preview</TableHead>
              )}
              {visibleColumns.updated && (
                <TableHead className="w-40">Last updated</TableHead>
              )}
              {visibleColumns.actions && (
                <TableHead className="w-16 text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReleases.map((release) => (
              <TableRow
                key={release.id}
                className="border-b border-slate-200 hover:bg-slate-50"
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(release.id)}
                    onChange={() => handleSelectRow(release.id)}
                  />
                </TableCell>
                {visibleColumns.order && (
                  <TableCell className="text-sm text-slate-900">
                    {release.order_index}
                  </TableCell>
                )}
                {visibleColumns.month && (
                  <TableCell className="text-sm text-slate-900">
                    {release.month_label}
                  </TableCell>
                )}
                {visibleColumns.lang && (
                  <TableCell className="text-sm text-slate-900">
                    {release.lang}
                  </TableCell>
                )}
                {visibleColumns.status && (
                  <TableCell>
                    <Badge variant={release.published ? "default" : "secondary"}>
                      {release.published ? "Published" : "Paused"}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.preview && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPreview(release)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
                {visibleColumns.updated && (
                  <TableCell className="text-sm text-slate-600">
                    {formatDate(release.updated_at)}
                  </TableCell>
                )}
                {visibleColumns.actions && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(release)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteSingle(release.id)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredReleases.length === 0 && (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <p className="text-sm">No releases found</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-slate-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Are you sure you want to delete the selected item(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel className="border-slate-200 text-slate-700 hover:bg-slate-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
