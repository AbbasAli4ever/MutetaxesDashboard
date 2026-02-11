import React from "react";

interface ComingSoonProps {
  title: string;
  subtitle?: string;
}

export default function ComingSoon({ title, subtitle }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Coming Soon
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">{title}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
