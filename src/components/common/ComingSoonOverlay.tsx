"use client";

import React from "react";

interface ComingSoonOverlayProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function ComingSoonOverlay({
  children,
  title = "Coming Soon",
  subtitle = "This admin module is under development.",
}: ComingSoonOverlayProps) {
  React.useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  return (
    <div className="relative isolate">
      <div aria-hidden="true" className="pointer-events-none select-none opacity-40">
        {children}
      </div>

      {/* Content-area bounded overlay: viewport-height only, page behind can keep scrolling */}
      <div className="absolute inset-0 z-40 pointer-events-none">
        <div className="sticky top-0 h-[100dvh] w-full">
          <div className="absolute inset-0 bg-white/45 dark:bg-black/50 backdrop-blur-[6px]" />

          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="w-full max-w-md -translate-y-20 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 shadow-2xl text-center px-6 py-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
                Admin Module
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
