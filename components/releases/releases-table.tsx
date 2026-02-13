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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { MoreHorizontal, Eye, Trash2, Zap, Bug, Tag } from "lucide-react";
import { toast } from "sonner";

interface ReleaseGroup {
  groupKey: string;
  principalRow: NewRelease;
  languages: string[];
  allRows: NewRelease[];
}

interface ReleasesTableProps {
  releases: NewRelease[];
  onEdit: (release: NewRelease) => void;
  onPreview: (groupRows: NewRelease[]) => void;
  onRefresh: () => void;
  filterLang: "ALL" | "ES" | "EN" | "PT";
  setFilterLang: (lang: "ALL" | "ES" | "EN" | "PT") => void;
  filterStatus: "ALL" | "published" | "paused";
  setFilterStatus: (status: "ALL" | "published" | "paused") => void;
}

export function ReleasesTable({
  releases,
  onEdit,
  onPreview,
  onRefresh,
  filterLang,
  setFilterLang,
  filterStatus,
  setFilterStatus,
}: ReleasesTableProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState({
    order: true,
    month: true,
    lang: true,
    status: true,
    type: true,
    preview: true,
    updated: true,
    actions: true,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Group releases by groupKey = group_id ?? id
  const groupReleases = (): Map<string, NewRelease[]> => {
    const groupMap = new Map<string, NewRelease[]>();
    releases.forEach((release) => {
      const groupKey = release.group_id || release.id;
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(release);
    });
    return groupMap;
  };

  // Get principal row for a group (EN > ES > first)
  const getPrincipalRow = (rows: NewRelease[]): NewRelease => {
    const enRow = rows.find((r) => r.lang === "EN");
    if (enRow) return enRow;
    const esRow = rows.find((r) => r.lang === "ES");
    if (esRow) return esRow;
    return rows[0];
  };

  // Build grouped rows
  const buildGroupedRows = (): ReleaseGroup[] => {
    const groupMap = groupReleases();
    const groups: ReleaseGroup[] = [];

    groupMap.forEach((rows, groupKey) => {
      const principalRow = getPrincipalRow(rows);
      const languages = Array.from(new Set(rows.map((r) => r.lang)))
        .sort((a, b) => {
          const order = ["ES", "EN", "PT"];
          return (order.indexOf(a) ?? 999) - (order.indexOf(b) ?? 999);
        });

      groups.push({
        groupKey,
        principalRow,
        languages,
        allRows: rows,
      });
    });

    // Sort by order_index ASC (nulls last), then last_updated DESC
    groups.sort((a, b) => {
      const aOrder = a.principalRow.order_index ?? 999;
      const bOrder = b.principalRow.order_index ?? 999;
      if (aOrder !== bOrder) return aOrder - bOrder;

      const aUpdated = new Date(a.principalRow.updated_at).getTime();
      const bUpdated = new Date(b.principalRow.updated_at).getTime();
      return bUpdated - aUpdated;
    });

    return groups;
  };

  // Filter groups at group level
  const filterGroups = (groups: ReleaseGroup[]): ReleaseGroup[] => {
    return groups.filter((group) => {
      // Search: match any translation in group
      const matchesSearch =
        search === "" ||
        group.allRows.some(
          (r) =>
            r.title.toLowerCase().includes(search.toLowerCase()) ||
            r.month_label.toLowerCase().includes(search.toLowerCase())
        );

      // Language filter
      const matchesLang =
        filterLang === "ALL" || group.languages.includes(filterLang);

      // Status filter on principal row
      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "published" && group.principalRow.published) ||
        (filterStatus === "paused" && !group.principalRow.published);

      return matchesSearch && matchesLang && matchesStatus;
    });
  };

  const groupedRows = buildGroupedRows();
  const filteredGroups = filterGroups(groupedRows);

  const handleSelectAll = () => {
    if (selectedIds.size === filteredGroups.length) {
      setSelectedIds(new Set());
    } else {
      // Select all rows from all filtered groups
      const allRowIds = new Set<string>();
      filteredGroups.forEach((group) => {
        group.allRows.forEach((row) => {
          allRowIds.add(row.id);
        });
      });
      setSelectedIds(allRowIds);
    }
  };

  const handleSelectRow = (groupKey: string) => {
    const group = filteredGroups.find((g) => g.groupKey === groupKey);
    if (!group) return;

    const newSelected = new Set(selectedIds);
    const groupRowIds = group.allRows.map((r) => r.id);

    // Check if all rows of this group are selected
    const allSelected = groupRowIds.every((id) => newSelected.has(id));

    if (allSelected) {
      groupRowIds.forEach((id) => newSelected.delete(id));
    } else {
      groupRowIds.forEach((id) => newSelected.add(id));
    }

    setSelectedIds(newSelected);
  };

  const handleDeleteSingle = (groupKey: string) => {
    setDeleteTarget(groupKey);
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
      const idsToDelete: string[] = [];

      if (deleteTarget === "multiple") {
        // Get all IDs from selected rows
        idsToDelete.push(...Array.from(selectedIds));
      } else if (deleteTarget) {
        // Get all row IDs from the group
        const group = groupedRows.find((g) => g.groupKey === deleteTarget);
        if (group) {
          idsToDelete.push(...group.allRows.map((r) => r.id));
        }
      }

      if (idsToDelete.length === 0) return;

      // Delete media files from storage
      const releasesToDelete = releases.filter((r) => idsToDelete.includes(r.id));
      const mediaPathsToDelete = Array.from(
        new Set(releasesToDelete.map((r) => r.media_path).filter(Boolean))
      ) as string[];

      for (const mediaPath of mediaPathsToDelete) {
        await supabase.storage
          .from("new-releases")
          .remove([mediaPath])
          .catch(() => {
            // Ignore delete errors
          });
      }

      // Delete from database
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
      <div className="space-y-4">
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
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={filterLang} onValueChange={(v) => setFilterLang(v as "ALL" | "ES" | "EN" | "PT")}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Languages</SelectItem>
              <SelectItem value="ES">ES</SelectItem>
              <SelectItem value="EN">EN</SelectItem>
              <SelectItem value="PT">PT</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as "ALL" | "published" | "paused")}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
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
                    filteredGroups.length > 0 &&
                    filteredGroups.every((g) =>
                      g.allRows.every((r) => selectedIds.has(r.id))
                    )
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
              {visibleColumns.type && (
                <TableHead className="w-20">Type</TableHead>
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
            {filteredGroups.map((group) => {
              const isGroupSelected = group.allRows.every((r) =>
                selectedIds.has(r.id)
              );
              const lastUpdated = new Date(
                Math.max(
                  ...group.allRows.map((r) =>
                    new Date(r.updated_at).getTime()
                  )
                )
              ).toISOString();

              return (
                <TableRow
                  key={group.groupKey}
                  className="border-b border-slate-200 hover:bg-slate-50"
                >
                  <TableCell>
                    <Checkbox
                      checked={isGroupSelected}
                      onChange={() => handleSelectRow(group.groupKey)}
                    />
                  </TableCell>
                  {visibleColumns.order && (
                    <TableCell className="text-sm text-slate-900">
                      {group.principalRow.order_index}
                    </TableCell>
                  )}
                  {visibleColumns.month && (
                    <TableCell className="text-sm text-slate-900">
                      {group.principalRow.month_label}
                    </TableCell>
                  )}
                  {visibleColumns.lang && (
                    <TableCell className="text-sm text-slate-900">
                      <div className="flex gap-1 flex-wrap">
                        {group.languages.map((lang) => {
                          let badgeClasses = "";
                          if (lang === "ES") {
                            badgeClasses = "bg-yellow-100 text-yellow-900 border border-yellow-200";
                          } else if (lang === "EN") {
                            badgeClasses = "bg-blue-100 text-blue-900 border border-blue-200";
                          } else if (lang === "PT") {
                            badgeClasses = "bg-green-100 text-green-900 border border-green-200";
                          }
                          return (
                            <Badge key={lang} className={`${badgeClasses} px-2 py-1`}>
                              {lang === "PT" ? "PT/BR" : lang}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.status && (
                    <TableCell>
                      <Badge
                        variant="default"
                        className={
                          group.principalRow.published
                            ? "bg-green-100 text-green-900 border border-green-200"
                            : "bg-slate-100 text-slate-900 border border-slate-200"
                        }
                      >
                        {group.principalRow.published ? "Published" : "Paused"}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.type && (
                    <TableCell>
                      <div className="flex gap-2 flex-wrap items-center">
                        <Badge
                          variant="default"
                          className={
                            group.principalRow.release_type === "bug"
                              ? "bg-red-100 text-red-900 border border-red-200"
                              : "bg-blue-100 text-blue-900 border border-blue-200"
                          }
                        >
                          {group.principalRow.release_type === "bug" ? (
                            <>
                              <Bug className="h-3 w-3 mr-1 inline" />
                              Bug
                            </>
                          ) : (
                            <>
                              <Zap className="h-3 w-3 mr-1 inline" />
                              Feature
                            </>
                          )}
                        </Badge>
                        {group.principalRow.release_type === "feature" && group.principalRow.has_cost && (
                          <Badge className="bg-blue-50 text-blue-700 border border-blue-200">
                            <Tag className="h-3 w-3 mr-1 inline" />
                            Con costo
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.preview && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPreview(group.allRows)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                  {visibleColumns.updated && (
                    <TableCell className="text-sm text-slate-600">
                      {formatDate(lastUpdated)}
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
                          <DropdownMenuItem
                            onClick={() => onEdit(group.principalRow)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteSingle(group.groupKey)}
                            className="text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredGroups.length === 0 && (
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
              Confirm deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              ¿Estás seguro que deseas eliminar los items seleccionados?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-white text-slate-900 border border-slate-300 hover:bg-slate-100"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
