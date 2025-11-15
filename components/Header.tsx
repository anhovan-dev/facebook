
import React from 'react';

export const Header = (): React.JSX.Element => {
  return (
    <header className="text-center bg-[var(--color-surface-1)] backdrop-blur-sm rounded-xl py-8 px-4 border border-[var(--color-border)]">
      <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-header)] tracking-tight">
        Kiểm tra chính sách quảng cáo Facebook
      </h1>
      <p className="mt-3 text-base sm:text-lg text-[var(--color-text-accent)] max-w-3xl mx-auto">
        Công cụ AI thông minh kiểm tra vi phạm chính sách Facebook và luật quảng cáo tại Việt Nam
      </p>
    </header>
  );
};
