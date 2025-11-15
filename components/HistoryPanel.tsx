
import React from 'react';
import type { HistoryEntry } from '../types';
import { ClockIcon, TrashIcon } from './icons';

interface HistoryPanelProps {
    history: HistoryEntry[];
    onSelect: (id: string) => void;
    onClear: () => void;
}

const getStatusPillClasses = (status: HistoryEntry['status']): string => {
    switch (status) {
        case 'compliant':
            return 'bg-green-900 text-green-300';
        case 'non_compliant':
            return 'bg-red-900 text-red-300';
        case 'warning':
            return 'bg-yellow-900 text-yellow-300';
        default:
            return 'bg-gray-700 text-gray-300';
    }
};

const getStatusText = (status: HistoryEntry['status']): string => {
    switch (status) {
        case 'compliant':
            return 'Tuân thủ';
        case 'non_compliant':
            return 'Vi phạm';
        case 'warning':
            return 'Cảnh báo';
        default:
            return 'Không rõ';
    }
}

interface HistoryItemProps {
    entry: HistoryEntry;
    onSelect: (id: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ entry, onSelect }) => {
    const date = new Date(entry.timestamp);
    const formattedDate = `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

    return (
        <li 
            onClick={() => onSelect(entry.id)}
            className="p-3 bg-gray-800/50 rounded-lg border border-transparent hover:border-[var(--color-border-focus)] hover:bg-gray-800/80 cursor-pointer transition-all w-72 flex-shrink-0"
        >
            <div className="flex justify-between items-center">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusPillClasses(entry.status)}`}>
                    {getStatusText(entry.status)}
                </span>
                <span className="text-xs text-gray-400">{formattedDate}</span>
            </div>
            <p className="mt-2 text-sm text-gray-200 truncate" title={entry.summary}>
                {entry.summary}
            </p>
        </li>
    );
};

export const HistoryPanel = ({ history, onSelect, onClear }: HistoryPanelProps): React.JSX.Element => {
    return (
        <div className="bg-[var(--color-surface-1)] backdrop-blur-sm rounded-xl p-5 border border-[var(--color-border)]">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <ClockIcon className="w-6 h-6 text-[var(--color-icon-accent)]" />
                    <h3 className="ml-3 text-lg font-semibold text-[var(--color-text-header)]">Lịch sử kiểm tra</h3>
                </div>
                <button 
                    onClick={onClear} 
                    className="flex items-center text-xs text-gray-400 hover:text-red-400 transition-colors"
                    title="Xóa lịch sử"
                >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    Xóa
                </button>
            </div>
            {history.length > 0 ? (
                <ul className="mt-4 flex gap-4 overflow-x-auto pb-4">
                    {history.map(entry => (
                        <HistoryItem key={entry.id} entry={entry} onSelect={onSelect} />
                    ))}
                </ul>
            ) : (
                <p className="mt-4 text-sm text-center text-gray-400 py-4">Chưa có lịch sử kiểm tra.</p>
            )}
        </div>
    );
};
