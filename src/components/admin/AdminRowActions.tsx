"use client";

import { Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminRowActionsProps {
  onView?: () => void;
  onDelete?: () => void;
  viewLabel?: string;
  deleteLabel?: string;
}

export function AdminRowActions({
  onView,
  onDelete,
  viewLabel = "View details",
  deleteLabel = "Delete record",
}: AdminRowActionsProps) {
  return (
    <div className="inline-flex items-center justify-end gap-1">
      {onView && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onView}
              aria-label={viewLabel}
              className="btn-icon-sm size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Eye className="size-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{viewLabel}</TooltipContent>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDelete}
              aria-label={deleteLabel}
              className="btn-icon-sm size-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{deleteLabel}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
