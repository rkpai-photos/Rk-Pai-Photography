"use client";

import { ImageIcon, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  onAdd: () => void;
}

export default function EmptyState({ onAdd }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="size-16 rounded-full bg-stone-100 flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-stone-400" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-stone-900">
        No photos yet
      </h3>
      <p className="mt-2 text-stone-500 max-w-sm">
        Add your first photograph — it&apos;ll appear on the public site under{" "}
        <code className="text-xs font-mono">/stories</code>.
      </p>
      <Button onClick={onAdd} className="mt-6">
        <Plus className="w-4 h-4 mr-2" />
        Add your first photo
      </Button>
    </div>
  );
}
