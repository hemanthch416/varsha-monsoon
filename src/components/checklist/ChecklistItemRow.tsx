import { memo } from "react";
import { Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { ChecklistItem } from "@/types";

export interface ChecklistItemRowProps {
  item: ChecklistItem;
  removable: boolean;
  onToggle: (item: ChecklistItem) => void;
  onRemove: (id: string) => void;
}

/**
 * Row for a single checklist item. Memoized so toggling one item — which only
 * produces new object references for the changed row — doesn't force every other
 * row to re-render. `onToggle`/`onRemove` are `useCallback`'d in the parent so
 * their identities stay stable across renders.
 */
export const ChecklistItemRow = memo(function ChecklistItemRow({
  item, removable, onToggle, onRemove,
}: ChecklistItemRowProps) {
  return (
    <li className="group flex items-start gap-4">
      <Checkbox
        checked={item.done}
        onCheckedChange={() => onToggle(item)}
        id={item.id}
        className="mt-1 print:hidden"
      />
      <span className="hidden print:inline mt-0.5">☐</span>
      <label
        htmlFor={item.id}
        className={`flex-1 text-sm md:text-base leading-relaxed cursor-pointer ${item.done ? "line-through text-muted-foreground" : ""}`}
      >
        {item.label}
      </label>
      {removable && (
        <button
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.label}`}
          className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition print:hidden"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
        </button>
      )}
    </li>
  );
});
