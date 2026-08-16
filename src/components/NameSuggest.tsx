"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Guest } from "@/lib/guests";
import { searchGuests } from "@/lib/guests";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (guest: Guest) => void;
  guests: Guest[];
  placeholder?: string;
  required?: boolean;
  excludeIds?: string[];
  customActionLabel?: string;
  onCustomAction?: (typedName: string) => void;
};

export function NameSuggest({
  label,
  value,
  onChange,
  onSelect,
  guests,
  placeholder,
  required,
  excludeIds = [],
  customActionLabel,
  onCustomAction,
}: Props) {
  const inputId = useId();
  const listId = useId();
  const rootRef = useRef<HTMLLabelElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const available = useMemo(
    () => guests.filter((guest) => !excludeIds.includes(guest.id)),
    [excludeIds, guests],
  );

  const matches = useMemo(
    () => (value.trim() ? searchGuests(value, available) : []),
    [available, value],
  );

  const showCustom = Boolean(customActionLabel && onCustomAction && value.trim());
  const itemCount = matches.length + (showCustom ? 1 : 0);
  const visible = open && itemCount > 0;

  useEffect(() => {
    setActive(0);
  }, [value]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function chooseGuest(guest: Guest) {
    onSelect(guest);
    setOpen(false);
  }

  function chooseCustom() {
    onCustomAction?.(value.trim());
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!visible) {
      if (event.key === "ArrowDown" && itemCount > 0) setOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % itemCount);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current - 1 + itemCount) % itemCount);
    } else if (event.key === "Enter") {
      if (active < matches.length) {
        event.preventDefault();
        chooseGuest(matches[active]);
      } else if (showCustom) {
        event.preventDefault();
        chooseCustom();
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <label className="field name-suggest" ref={rootRef}>
      <span>{label}</span>
      <input
        id={inputId}
        role="combobox"
        aria-expanded={visible}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {visible && (
        <ul id={listId} className="name-suggest-list" role="listbox">
          {matches.map((guest, index) => (
            <li key={guest.id} role="option" aria-selected={active === index}>
              <button
                type="button"
                className={active === index ? "is-active" : undefined}
                onMouseEnter={() => setActive(index)}
                onClick={() => chooseGuest(guest)}
              >
                <strong>{guest.name}</strong>
                <em>{guest.groupLabel}</em>
              </button>
            </li>
          ))}
          {showCustom && (
            <li role="option" aria-selected={active === matches.length}>
              <button
                type="button"
                className={`name-suggest-custom${active === matches.length ? " is-active" : ""}`}
                onMouseEnter={() => setActive(matches.length)}
                onClick={chooseCustom}
              >
                {customActionLabel}
              </button>
            </li>
          )}
        </ul>
      )}
    </label>
  );
}
