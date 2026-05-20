'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { innerApi } from '@/lib/api';

type AdminDeleteButtonProps = {
  endpoint: string;
  entityName: string;
  queryKey: readonly unknown[];
};

export function AdminDeleteButton({
  endpoint,
  entityName,
  queryKey,
}: AdminDeleteButtonProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await innerApi.delete(endpoint);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      toast.success(`${entityName} deleted`);
    },
    onError: () => {
      toast.error(`Failed to delete ${entityName.toLowerCase()}`);
    },
  });

  function handleDelete() {
    deleteMutation.mutate();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={deleteMutation.isPending} size="sm" variant="ghost">
          <Trash2 data-icon="inline-start" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {entityName.toLowerCase()}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The selected{' '}
            {entityName.toLowerCase()} will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
