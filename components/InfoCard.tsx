import React from 'react';

export const InfoCard = ({ title, icon, children, topRightContent }: { title: string, icon: React.ReactNode, children?: React.ReactNode, topRightContent?: React.ReactNode }): React.JSX.Element => (
    <div className="bg-[var(--color-surface-1)] backdrop-blur-sm rounded-xl p-5 border border-[var(--color-border)]">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                {icon}
                <h3 className="ml-3 text-lg font-semibold text-[var(--color-text-header)]">{title}</h3>
            </div>
            {topRightContent}
        </div>
        <div className="mt-4 text-[var(--color-text-accent)] text-sm">
            {children}
        </div>
    </div>
);