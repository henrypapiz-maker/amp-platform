"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

/**
 * HelpTip — inline ? icon that expands to show help text on click.
 * Use for contextual guidance throughout the app.
 */
export function HelpTip({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="text-stone-500 hover:text-amber-400 transition-colors p-0.5 rounded-full hover:bg-stone-700/50"
        aria-label="Help"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-6 left-0 w-72 bg-stone-800 border border-stone-600 rounded-lg shadow-xl p-3 text-xs">
            {title && (
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-amber-400 font-medium text-xs">{title}</span>
                <button onClick={() => setOpen(false)} className="text-stone-500 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="text-stone-300 leading-relaxed space-y-1.5">{children}</div>
          </div>
        </>
      )}
    </span>
  );
}

/**
 * PageHelp — instruction banner at the top of a page section.
 * Dismissible, shows guidance for the current context.
 */
export function PageHelp({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className={`bg-stone-800/50 border border-stone-700/50 rounded-lg p-3 mb-4 flex items-start gap-3 ${className}`}>
      <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1 text-stone-400 text-xs leading-relaxed">{children}</div>
      <button onClick={() => setDismissed(true)} className="text-stone-600 hover:text-stone-400 shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/**
 * TabHelp — small instruction line shown at the top of a tab content area.
 */
export function TabHelp({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-stone-500 text-xs mb-3 flex items-start gap-1.5">
      <HelpCircle className="w-3 h-3 text-stone-600 shrink-0 mt-0.5" />
      <span>{children}</span>
    </p>
  );
}
