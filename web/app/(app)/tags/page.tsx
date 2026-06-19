"use client";

import { useState } from "react";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from "@/hooks/useTags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Tag, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tag as TagType } from "@/lib/api";

const TAG_COLORS = [
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#3b82f6", // blue
  "#f97316", // orange
  "#6366f1", // indigo
  "#14b8a6", // teal
];

interface TagDialogProps {
  open: boolean;
  onClose: () => void;
  tag?: TagType | null;
}

function TagDialog({ open, onClose, tag }: TagDialogProps) {
  const create = useCreateTag();
  const update = useUpdateTag();
  const [name, setName] = useState(tag?.name ?? "");
  const [color, setColor] = useState(tag?.color ?? TAG_COLORS[0]);

  const isEditing = !!tag;
  const loading = create.isPending || update.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      await update.mutateAsync({ id: tag!.id, data: { name, color } });
    } else {
      await create.mutateAsync({ name, color });
    }
    onClose();
    setName("");
    setColor(TAG_COLORS[0]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Tag" : "Create Tag"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tag Name</Label>
            <Input
              placeholder="e.g. rent, salary, food..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-muted/20"
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all border-2",
                    color === c
                      ? "border-white scale-110 shadow-lg"
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-6 h-6 rounded-full border border-border"
                style={{ backgroundColor: color }}
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-7 text-xs bg-muted/20 font-mono"
                placeholder="#hex"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-900 font-semibold"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TagsPage() {
  const { data: tags, isLoading } = useTags();
  const deleteTag = useDeleteTag();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tags</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize your transactions with tags
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-900 font-semibold shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          New Tag
        </Button>
      </div>

      {/* Tags Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : tags && tags.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="group relative flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/80 hover:border-opacity-60 hover:shadow-md transition-all duration-300"
              style={{
                borderColor: `${tag.color}30`,
              }}
            >
              <div
                className="absolute inset-0 rounded-xl opacity-5 group-hover:opacity-10 transition-opacity"
                style={{ backgroundColor: tag.color }}
              />
              <div className="relative flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${tag.color}20` }}
                >
                  <Tag className="w-4 h-4" style={{ color: tag.color }} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{tag.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{tag.color}</p>
                </div>
              </div>
              <div className="relative flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7"
                  onClick={() => {
                    setEditingTag(tag);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 hover:text-destructive"
                  onClick={() => setDeletingId(tag.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <Tag className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">No tags yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create tags to categorize your transactions
          </p>
          <Button onClick={() => setDialogOpen(true)} className="mt-4 gap-2">
            <Plus className="w-4 h-4" />
            Create Tag
          </Button>
        </div>
      )}

      {/* Dialog */}
      <TagDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingTag(null);
        }}
        tag={editingTag}
      />

      {/* Delete Confirm */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tag?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tag. It will be removed from all transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingId) {
                  deleteTag.mutate(deletingId);
                  setDeletingId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
