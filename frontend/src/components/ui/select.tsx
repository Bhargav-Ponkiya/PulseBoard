'use client';

import { useCallback, useRef, useState, useEffect, KeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
}

export function Select({ value, onValueChange, options, placeholder, label }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listboxId = useRef(`select-listbox-${Math.random().toString(36).slice(2, 9)}`).current;
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectOption = useCallback(
    (option: SelectOption) => {
      onValueChange(option.value);
      setOpen(false);
      setHighlightedIndex(-1);
      triggerRef.current?.focus();
    },
    [onValueChange],
  );

  const handleTriggerKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setOpen(false);
          setHighlightedIndex(-1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          setOpen((prev) => !prev);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!open) {
            setOpen(true);
          } else {
            setHighlightedIndex((prev) =>
              prev < options.length - 1 ? prev + 1 : 0,
            );
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!open) {
            setOpen(true);
          } else {
            setHighlightedIndex((prev) =>
              prev > 0 ? prev - 1 : options.length - 1,
            );
          }
          break;
      }
    },
    [open, options.length],
  );

  const handleOptionKeyDown = useCallback(
    (e: KeyboardEvent, option: SelectOption) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          selectOption(option);
          break;
        case 'Escape':
          setOpen(false);
          setHighlightedIndex(-1);
          triggerRef.current?.focus();
          break;
      }
    },
    [selectOption],
  );

  useEffect(() => {
    if (open && highlightedIndex >= 0) {
      const optionEl = listRef.current?.children[highlightedIndex] as HTMLElement | undefined;
      optionEl?.focus();
    }
  }, [open, highlightedIndex]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={label ?? placeholder ?? 'Select'}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={selected ? '' : 'text-muted-foreground'}>
          {selected?.label ?? placeholder ?? 'Select...'}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={selected?.label ?? placeholder ?? 'Options'}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover shadow-md"
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              tabIndex={-1}
              className={`flex w-full cursor-pointer items-center px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${
                option.value === value ? 'bg-accent text-accent-foreground' : ''
              } ${highlightedIndex === index ? 'bg-accent/50' : ''}`}
              onClick={() => selectOption(option)}
              onKeyDown={(e) => handleOptionKeyDown(e, option)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
