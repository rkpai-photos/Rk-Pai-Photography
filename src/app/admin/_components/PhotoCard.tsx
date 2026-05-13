"use client";

// Single photo card in the admin grid. Image cover on top, metadata below.
// Hover surfaces a dropdown menu (Edit / View on site / Delete).

import NextImage from "next/image";
import { ExternalLink, MoreVertical, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PhotoRow } from "./types";

interface Props {
  photo: PhotoRow;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PhotoCard({ photo, onEdit, onDelete }: Props) {
  return (
    <div className="group relative bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] relative bg-stone-100 overflow-hidden">
        {photo.imageUrl ? (
          <NextImage
            src={photo.imageUrl}
            alt={photo.alt || "Photo"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-sm">
            No image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/90 backdrop-blur shadow-sm hover:bg-white"
                aria-label="Photo actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={`/stories/${photo.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on site
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-600 focus:text-red-700 focus:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-medium text-stone-900 truncate">
          {photo.alt || "Untitled"}
        </h3>
        <p className="text-xs text-stone-500 font-mono truncate">
          /stories/{photo.slug}
        </p>
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {photo.location && (
            <Badge variant="secondary" className="font-normal">
              {photo.location}
            </Badge>
          )}
          <Badge variant="outline" className="font-normal text-stone-500">
            {photo.width}×{photo.height}
          </Badge>
        </div>
      </div>
    </div>
  );
}
