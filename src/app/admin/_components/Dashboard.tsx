"use client";

// Authenticated admin dashboard — the actual photo CRUD UI. Lives behind the
// <Authenticated> gate in page.tsx, so by the time this renders we have a
// session. Authorization (ADMIN_EMAILS allow-list) is still enforced by the
// Convex mutations themselves; we surface those failures via toast.

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { LogOut, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { api } from "../../../../convex/_generated/api";
import PhotoCard from "./PhotoCard";
import PhotoFormSheet from "./PhotoFormSheet";
import DeleteDialog from "./DeleteDialog";
import EmptyState from "./EmptyState";
import LoadingGrid from "./LoadingGrid";
import type { PhotoRow } from "./types";

export default function Dashboard() {
  const { signOut } = useAuthActions();
  const photos = useQuery(api.photos.list, {}) as PhotoRow[] | undefined;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PhotoRow | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<PhotoRow | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!photos) return [];
    if (!search.trim()) return photos;
    const q = search.toLowerCase();
    return photos.filter(
      (p) =>
        p.alt.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.location?.toLowerCase().includes(q) ?? false) ||
        p.story.toLowerCase().includes(q),
    );
  }, [photos, search]);

  const openAdd = () => {
    setEditingPhoto(null);
    setSheetOpen(true);
  };

  const openEdit = (p: PhotoRow) => {
    setEditingPhoto(p);
    setSheetOpen(true);
  };

  return (
    <main className="min-h-screen bg-stone-100">
      <div className="border-b border-stone-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-stone-900">
              Photos
            </h1>
            <p className="text-xs text-stone-500">
              {photos === undefined
                ? "Loading…"
                : `${photos.length} ${photos.length === 1 ? "photo" : "photos"}`}
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add photo</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9"
                  aria-label="Account menu"
                >
                  <div className="size-8 rounded-full bg-stone-900 text-white text-xs font-semibold flex items-center justify-center">
                    A
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
        {photos !== undefined && photos.length > 0 && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <Input
              type="search"
              placeholder="Search title, slug, location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {photos === undefined ? (
          <LoadingGrid />
        ) : photos.length === 0 ? (
          <EmptyState onAdd={openAdd} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-500">
            No photos match{" "}
            <span className="font-medium text-stone-700">
              &ldquo;{search}&rdquo;
            </span>
            .
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => (
              <PhotoCard
                key={p._id}
                photo={p}
                onEdit={() => openEdit(p)}
                onDelete={() => setDeletingPhoto(p)}
              />
            ))}
          </div>
        )}
      </div>

      <PhotoFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        photo={editingPhoto}
      />
      <DeleteDialog
        photo={deletingPhoto}
        onClose={() => setDeletingPhoto(null)}
      />
    </main>
  );
}
