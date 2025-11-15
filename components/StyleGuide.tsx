
import React from 'react';
import { PaletteIcon, SparklesIcon } from './icons';
import type { ThemeGenerationResult } from '../types';

interface StyleGuideProps {
    themeResult: ThemeGenerationResult;
    logo: string | null;
}

interface ColorSwatchProps {
    name: string;
    hex: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ name, hex }) => {
    // A simple way to get a readable text color on a dynamic background
    const getTextColor = (hexColor: string): string => {
        try {
            const r = parseInt(hexColor.slice(1, 3), 16);
            const g = parseInt(hexColor.slice(3, 5), 16);
            const b = parseInt(hexColor.slice(5, 7), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return (yiq >= 128) ? '#000000' : '#FFFFFF';
        } catch(e) {
            return '#FFFFFF';
        }
    };

    const formattedName = name.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
    const textColor = getTextColor(hex);

    return (
        <div className="flex flex-col items-center">
            <div
                className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center text-xs font-mono"
                style={{ backgroundColor: hex, color: textColor }}
                title={hex}
            >
                Aa
            </div>
            <p className="mt-2 text-xs font-medium text-center text-[var(--color-text-accent)]">{formattedName}</p>
            <p className="text-xs text-gray-500">{hex}</p>
        </div>
    );
};

export const StyleGuide = ({ themeResult, logo }: StyleGuideProps): React.JSX.Element => {
    const { colors, explanation } = themeResult;

    return (
        <div className="bg-[var(--color-surface-1)] backdrop-blur-sm rounded-xl p-5 border border-[var(--color-border)]">
            <div className="flex items-center">
                <PaletteIcon className="w-6 h-6 text-[var(--color-icon-accent)]" />
                <h3 className="ml-3 text-lg font-semibold text-[var(--color-text-header)]">Visual Style Guide</h3>
            </div>

            <div className="mt-4 space-y-6">
                
                <div>
                    <h4 className="font-semibold text-[var(--color-text-header)] mb-3">Color Palette</h4>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                        {Object.entries(colors).map(([name, hex]) => (
                             <ColorSwatch key={name} name={name} hex={hex} />
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-[var(--color-text-header)] mb-2 flex items-center">
                        <SparklesIcon className="w-5 h-5 text-yellow-400 mr-2" />
                        Design Rationale & Recommendations
                    </h4>
                     <div className="flex items-start gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                        {logo && <img src={logo} alt="Brand Logo" className="w-12 h-12 object-contain flex-shrink-0 mt-1" />}
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{explanation}</p>
                    </div>
                </div>

            </div>
        </div>
    );
};
