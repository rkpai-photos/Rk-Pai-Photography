"use client";

// Slide-out form for adding or editing a photo. `photo` prop drives the mode
// (null = create, populated = edit).
//
// Hydration pattern: the inner <FormBody/> is mounted only when `open` is
// true and is keyed on `photo?._id ?? "new"`. React's `key` does the reset —
// no `useEffect(() => setState(prop))` pattern, which the React Compiler's
// `react-hooks/set-state-in-effect` rule (rightly) forbids. Auto-fill of
// width/height from the new file's natural dimensions happens in the file-
// change event handler, not an effect.

import { FormEvent, useState } from "react";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import ImageDropzone from "./ImageDropzone";
import type { PhotoRow } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a PhotoRow to edit; null for create mode. */
  photo: PhotoRow | null;
}

type FormState = {
  slug: string;
  alt: string;
  story: string;
  location: string;
  createdAt: string;
  width: string;
  height: string;
  order: string;
};

const EMPTY: FormState = {
  slug: "",
  alt: "",
  story: "",
  location: "",
  createdAt: "",
  width: "",
  height: "",
  order: "",
};

function fromPhoto(p: PhotoRow): FormState {
  return {
    slug: p.slug,
    alt: p.alt,
    story: p.story,
    location: p.location ?? "",
    createdAt: p.createdAt ?? "",
    width: String(p.width),
    height: String(p.height),
    order: String(p.order),
  };
}

function readImageMeta(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({
        width: img.naturalWidth || 0,
        height: img.naturalHeight || 0,
      });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

// Tiny LQIP for next/image's blur placeholder: draw the file onto a ~16px
// canvas and export a low-quality JPEG data URL (~400-700 bytes). Returns
// undefined on any failure so a missing blur never blocks an upload.
function makeBlurDataURL(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const w = 16;
        const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(undefined);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.5));
      } catch {
        resolve(undefined);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      resolve(undefined);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

function imageTypeFromFile(file: File): string {
  const fromMime = file.type.split("/")[1];
  if (fromMime) return fromMime.toLowerCase();
  const ext = file.name.split(".").pop();
  return (ext || "jpeg").toLowerCase();
}

export default function PhotoFormSheet({ open, onOpenChange, photo }: Props) {
  return (
    <Sheet open={open} onOpenChange={(v) => onOpenChange(v)}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto bg-stone-50"
      >
        {/* Re-key on photo id (or "new") so the inner state resets when the
            user switches between editing different photos or between Edit and
            Add. {open && …} unmounts the body on close so we never carry
            half-typed state into the next session. */}
        {open && (
          <FormBody
            key={photo?._id ?? "new"}
            photo={photo}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function FormBody({
  photo,
  onClose,
}: {
  photo: PhotoRow | null;
  onClose: () => void;
}) {
  const isEdit = !!photo;
  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const createPhoto = useMutation(api.photos.create);
  const updatePhoto = useMutation(api.photos.update);

  const [form, setForm] = useState<FormState>(() =>
    photo ? fromPhoto(photo) : EMPTY,
  );
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFileChange = (f: File | null) => {
    setFile(f);
    if (!f) return;
    // Auto-fill width/height from the natural dimensions, but only if the
    // user hasn't already typed something — don't clobber their edits.
    readImageMeta(f).then((meta) => {
      setForm((prev) => ({
        ...prev,
        width: prev.width || String(meta.width),
        height: prev.height || String(meta.height),
      }));
    });
  };

  const uploadFile = async (f: File): Promise<Id<"_storage">> => {
    const uploadUrl = await generateUploadUrl({});
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": f.type || "application/octet-stream" },
      body: f,
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const { storageId } = await res.json();
    return storageId as Id<"_storage">;
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEdit && !file) {
      toast.error("Pick an image to upload.");
      return;
    }
    setBusy(true);
    try {
      let imageId: Id<"_storage"> | undefined;
      let imageType: string | undefined;
      let blurDataURL: string | undefined;
      if (file) {
        imageId = await uploadFile(file);
        imageType = imageTypeFromFile(file);
        blurDataURL = await makeBlurDataURL(file);
      }
      const width = Number(form.width) || photo?.width || 300;
      const height = Number(form.height) || photo?.height || 200;

      if (isEdit && photo) {
        await updatePhoto({
          id: photo._id,
          slug: form.slug.trim() || undefined,
          alt: form.alt.trim() || undefined,
          story: form.story,
          location: form.location.trim() || undefined,
          createdAt: form.createdAt.trim() || undefined,
          order: form.order !== "" ? Number(form.order) : undefined,
          width,
          height,
          imageId,
          imageType,
          blurDataURL,
        });
        toast.success("Photo updated");
      } else {
        if (!imageId || !imageType) throw new Error("Image is required");
        await createPhoto({
          slug: form.slug.trim(),
          alt: form.alt.trim(),
          story: form.story.trim(),
          location: form.location.trim() || undefined,
          createdAt: form.createdAt.trim() || undefined,
          width,
          height,
          imageType,
          imageId,
          blurDataURL,
        });
        toast.success("Photo added");
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{isEdit ? "Edit photo" : "Add a photo"}</SheetTitle>
        <SheetDescription>
          {isEdit
            ? "Update the details. Replace the image only if you want a new one."
            : "Drop an image and fill in the details. Width and height auto-fill once the image loads."}
        </SheetDescription>
      </SheetHeader>

      <form onSubmit={onSubmit} className="space-y-6 mt-6">
        <ImageDropzone
          file={file}
          onFileChange={handleFileChange}
          existingImageUrl={photo?.imageUrl ?? null}
          disabled={busy}
        />

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              required={!isEdit}
              placeholder="great-hornbill"
              disabled={busy}
            />
            <p className="text-xs text-stone-500">
              URL path:{" "}
              <span className="font-mono">
                /stories/{form.slug || "<slug>"}
              </span>
            </p>
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="alt">Title</Label>
            <Input
              id="alt"
              value={form.alt}
              onChange={(e) => update("alt", e.target.value)}
              required={!isEdit}
              placeholder="Great Hornbill in flight"
              disabled={busy}
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="story">Story</Label>
            <Textarea
              id="story"
              value={form.story}
              onChange={(e) => update("story", e.target.value)}
              rows={5}
              placeholder="What's the story behind this photograph?"
              disabled={busy}
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="Western Ghats, India"
              disabled={busy}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="width">Width</Label>
            <Input
              id="width"
              type="number"
              value={form.width}
              onChange={(e) => update("width", e.target.value)}
              placeholder="auto"
              disabled={busy}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="height">Height</Label>
            <Input
              id="height"
              type="number"
              value={form.height}
              onChange={(e) => update("height", e.target.value)}
              placeholder="auto"
              disabled={busy}
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="createdAt">
              Created at{" "}
              <span className="text-stone-500 font-normal">
                (ISO, optional)
              </span>
            </Label>
            <Input
              id="createdAt"
              value={form.createdAt}
              onChange={(e) => update("createdAt", e.target.value)}
              placeholder="2026-05-12T00:00:00.000Z"
              disabled={busy}
            />
          </div>

          {isEdit && (
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                value={form.order}
                onChange={(e) => update("order", e.target.value)}
                disabled={busy}
              />
              <p className="text-xs text-stone-500">
                Lower numbers appear first in the gallery.
              </p>
            </div>
          )}
        </div>

        <SheetFooter className="flex flex-row justify-end gap-3 pt-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {busy ? "Saving…" : isEdit ? "Save changes" : "Add photo"}
          </Button>
        </SheetFooter>
      </form>
    </>
  );
}
