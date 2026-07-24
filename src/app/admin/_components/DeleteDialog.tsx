"use client";

// Confirm-before-delete dialog. Receives a `photo` (null = closed). On confirm,
// fires the `remove` mutation, toasts on success/failure, then closes.

import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "../../../../convex/_generated/api";
import type { PhotoRow } from "./types";

interface Props {
  photo: PhotoRow | null;
  onClose: () => void;
}

export default function DeleteDialog({ photo, onClose }: Props) {
  const removePhoto = useMutation(api.photos.remove);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (!photo) return;
    setBusy(true);
    try {
      await removePhoto({ id: photo._id });
      toast.success(`Deleted "${photo.alt || photo.slug}"`);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog
      open={!!photo}
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes{" "}
            <span className="font-medium text-stone-900">
              {photo?.alt || photo?.slug}
            </span>{" "}
            and its image file from storage. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {photo?.imageUrl && (
          <div className="my-2 rounded-lg overflow-hidden bg-stone-100 aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={busy}
            className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
          >
            {busy ? "Deleting…" : "Delete photo"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
