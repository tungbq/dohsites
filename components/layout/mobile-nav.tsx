"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="mobile-nav-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:border-accent hover:text-accent"
      >
        {open ? (
          <X aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Menu aria-hidden="true" className="h-4 w-4" />
        )}
      </button>

      {open ? (
        <nav
          id="mobile-nav-menu"
          aria-label="Main"
          className="absolute right-0 top-11 z-50 flex w-44 flex-col gap-1 rounded-md border border-border bg-surface p-2 shadow-lg"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded px-3 py-2 text-sm text-foreground transition-colors hover:bg-background"
            >
              {link.label}
            </a>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
