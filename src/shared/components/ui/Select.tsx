import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  ariaLabel: string;
  /** Trigger 왼쪽 아이콘·번호. 사이트 선택 버튼과 같은 자리 */
  leading?: ReactNode;
  /** Trigger 오른쪽 상태 배지 */
  trailing?: ReactNode;
}

const triggerClass =
  "flex h-11 w-full cursor-pointer items-center gap-2 rounded border border-border-default bg-bg-surface-2 px-3 text-left text-body text-text-primary outline-none hover:border-text-tertiary focus-visible:border-primary-on-dark data-[state=open]:border-primary-on-dark";

/**
 * 사이트 선택 Trigger 와 같은 높이·테두리·배경의 선택 상자.
 * 펼친 목록도 같은 표면 색을 쓴다.
 */
export default function Select({
  value,
  onValueChange,
  options,
  ariaLabel,
  leading,
  trailing,
}: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger className={triggerClass} aria-label={ariaLabel}>
        {leading}

        <span className="min-w-0 flex-1 truncate text-label font-semibold">
          <SelectPrimitive.Value />
        </span>

        <span className="ml-auto flex shrink-0 items-center gap-2">
          {trailing}

          <SelectPrimitive.Icon className="text-text-tertiary">
            <ChevronDown size={14} />
          </SelectPrimitive.Icon>
        </span>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-80 overflow-hidden rounded border border-border-default bg-bg-surface shadow-lg"
        >
          <SelectPrimitive.Viewport
            className="p-1"
            style={{ minWidth: "var(--radix-select-trigger-width)" }}
          >
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "flex cursor-pointer items-center rounded px-3 py-2 text-label text-text-secondary outline-none select-none",
                  "data-[highlighted]:bg-bg-surface-2 data-[highlighted]:text-text-primary",
                  "data-[state=checked]:bg-primary-fill/16 data-[state=checked]:text-text-primary",
                )}
              >
                <SelectPrimitive.ItemText>
                  {option.label}
                </SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
