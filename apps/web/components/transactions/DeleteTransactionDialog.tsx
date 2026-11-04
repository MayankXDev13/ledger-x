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
import { Trash2 } from "lucide-react";

interface DeleteTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteTransactionDialog({
  open,
  onClose,
  onConfirm,
}: DeleteTransactionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="border-border/60 bg-card sm:max-w-sm">
        <div className="absolute top-0 left-0 right-0 h-px rounded-t-lg bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-red-500/12 text-red-400 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <AlertDialogTitle className="text-base font-bold">
              Delete transaction?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            This will permanently remove this transaction from the ledger. The
            balance will be recalculated. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="flex-1 h-10 border-border/60">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="flex-1 h-10 bg-destructive text-white font-bold hover:bg-destructive/90 shadow-sm shadow-red-500/20"
            onClick={onConfirm}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}