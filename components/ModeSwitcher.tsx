import React from 'react';
import { CheckCircleIcon, CubeIcon } from './icons';

interface ModeSwitcherProps {
  mode: 'checker' | 'generator';
  setMode: (mode: 'checker' | 'generator') => void;
}

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ mode, setMode }) => {
  const getButtonClasses = (buttonMode: 'checker' | 'generator') => {
    const base = 'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] focus-visible:ring-white';
    const active = 'bg-white/10 text-white shadow-md';
    const inactive = 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200';
    return `${base} ${mode === buttonMode ? active : inactive}`;
  };

  return (
    <div className="flex w-full max-w-md mx-auto p-1.5 bg-black/20 rounded-xl border border-white/10">
      <button onClick={() => setMode('checker')} className={getButtonClasses('checker')}>
        <CheckCircleIcon className="w-5 h-5" />
        Kiểm tra Chính sách
      </button>
      <button onClick={() => setMode('generator')} className={getButtonClasses('generator')}>
        <CubeIcon className="w-5 h-5" />
        Tạo Hình ảnh (AI)
      </button>
    </div>
  );
};
