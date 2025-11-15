

import React, { useState } from 'react';
import type { PolicyAnalysisResult, ImageFile } from '../types';
import { SparklesIcon, DownloadIcon, ClipboardIcon, CheckIcon, PencilIcon, RefreshIcon, QuestionMarkCircleIcon } from './icons';
import { InfoCard } from './InfoCard';

const GeneratedImageDisplay = ({ 
    originalFile, 
    generatedImageBase64,
    onRegenerateImage,
    isImageRegenerating,
    onEditImage,
    isImageEditing
}: { 
    originalFile: ImageFile, 
    generatedImageBase64: string,
    onRegenerateImage: () => void,
    isImageRegenerating: boolean,
    onEditImage: (prompt: string) => Promise<void>,
    isImageEditing: boolean
}): React.JSX.Element => {
    const [isEditing, setIsEditing] = useState(false);
    const [editPrompt, setEditPrompt] = useState('');
    const generatedImageUrl = `data:image/png;base64,${generatedImageBase64}`;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = generatedImageUrl;
        link.download = 'ai-generated-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEdit = async () => {
        if (!editPrompt.trim()) return;
        await onEditImage(editPrompt);
        setIsEditing(false);
        setEditPrompt('');
    };

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 className="font-semibold text-center text-[var(--color-text-header)] mb-2">Ảnh Gốc</h4>
                    <img src={originalFile.preview} alt="Original upload" className="w-full h-auto rounded-lg border-2 border-[var(--color-border-subtle)]" />
                </div>
                <div>
                    <h4 className="font-semibold text-center text-[var(--color-text-header)] mb-2">Ảnh Demo AI</h4>
                    <img src={generatedImageUrl} alt="AI generated demo" className="w-full h-auto rounded-lg border-2 border-[var(--color-border-focus)]" />
                </div>
            </div>
             <p className="text-xs text-center mt-3 text-gray-400">AI đã tạo ảnh demo dựa trên các gợi ý về bố cục và thiết kế.</p>
             <div className="flex justify-center mt-4 gap-4 flex-wrap">
                <button
                    onClick={onRegenerateImage}
                    disabled={isImageRegenerating || isEditing}
                    className="flex items-center justify-center bg-transparent hover:bg-[var(--color-surface-2)] text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-[var(--color-border)]"
                >
                    {isImageRegenerating ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang tạo lại...
                        </>
                    ) : (
                        <>
                           <SparklesIcon className="w-5 h-5 mr-2" />
                           Tạo lại ảnh
                        </>
                    )}
                </button>
                <button
                    onClick={handleDownload}
                    className="flex items-center justify-center bg-transparent hover:bg-[var(--color-surface-2)] text-white font-bold py-2 px-4 rounded-md transition-colors border border-[var(--color-border)]"
                >
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Tải ảnh AI
                </button>
                <button
                    onClick={() => setIsEditing(prev => !prev)}
                    disabled={isImageRegenerating}
                    className="flex items-center justify-center bg-transparent hover:bg-[var(--color-surface-2)] text-white font-bold py-2 px-4 rounded-md transition-colors border border-[var(--color-border)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <PencilIcon className="w-5 h-5 mr-2" />
                    {isEditing ? 'Hủy' : 'Chỉnh sửa'}
                </button>
             </div>
             {isEditing && (
                <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700 transition-all duration-300">
                    <label htmlFor="image-edit-prompt" className="block text-sm font-medium text-[var(--color-text-accent)] mb-2">Mô tả chỉnh sửa của bạn:</label>
                    <div className="flex gap-2">
                        <input
                            id="image-edit-prompt"
                            type="text"
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            placeholder="Ví dụ: thêm một chiếc nơ màu đỏ"
                            className="flex-grow bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
                        />
                        <button
                            onClick={handleEdit}
                            disabled={isImageEditing || !editPrompt.trim()}
                            className="flex items-center justify-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-[var(--color-primary-disabled)] disabled:cursor-not-allowed"
                        >
                            {isImageEditing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang sửa...
                                </>
                            ) : (
                                'Gửi'
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ContentComparisonDisplay = ({ 
    originalContent, 
    lifestyleContent,
    onRegenerateContent,
    isContentRegenerating 
}: { 
    originalContent: string, 
    lifestyleContent: string,
    onRegenerateContent: () => void,
    isContentRegenerating: boolean
}): React.JSX.Element => {
    const [copied, setCopied] = useState(false);
    const [showStyleExamples, setShowStyleExamples] = useState(false);

    const styleExamples = [
        'TỚI CÔNG CHIỆN‼️',
        'NHÀ D’ALBA BẤT NGỜ FLASH SÊU CHỈ CÒN NỬA ZÁ 👇🏻😱',
        'Inbox ngay để có full combo giá tốt nhất!',
        'Khăn lụa LV màu camel hay màu mật ong yêu quá 🍃'
    ];

    const handleCopy = () => {
        if (copied || !lifestyleContent) return;
        navigator.clipboard.writeText(lifestyleContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 className="font-semibold text-center text-gray-400 mb-2">Nội dung gốc</h4>
                    <pre className="whitespace-pre-wrap bg-gray-800/30 rounded-lg p-3 text-sm text-gray-400 font-sans border border-gray-700 h-48 overflow-y-auto">
                        {originalContent || "Không có nội dung văn bản gốc."}
                    </pre>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-2">
                         <div className="flex items-center gap-2">
                             <h4 className="font-semibold text-center text-[var(--color-text-header)]">Nội dung AI đề xuất</h4>
                             <button
                                onClick={() => setShowStyleExamples(!showStyleExamples)}
                                className="text-gray-400 hover:text-white transition-colors"
                                title="Xem ví dụ về phong cách viết"
                            >
                                <QuestionMarkCircleIcon className="w-5 h-5" />
                            </button>
                         </div>
                         <button
                            onClick={onRegenerateContent}
                            disabled={isContentRegenerating}
                            className="flex items-center text-xs px-2 py-1 bg-transparent hover:bg-[var(--color-surface-2)] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Tạo nội dung khác"
                        >
                            {isContentRegenerating ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang tạo...
                                </>
                            ) : (
                                <>
                                    <RefreshIcon className="w-4 h-4 mr-1.5" />
                                    Tạo nội dung khác
                                </>
                            )}
                        </button>
                    </div>
                    {showStyleExamples && (
                        <div className="mb-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700 text-xs transition-all duration-300">
                            <p className="font-semibold text-gray-300 mb-2">Ví dụ về phong cách "đời thường, độc lạ":</p>
                            <ul className="list-disc list-inside space-y-1 text-gray-400">
                                {styleExamples.map((example, index) => (
                                    <li key={index}><em>{example}</em></li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <pre className="whitespace-pre-wrap bg-gray-800/50 rounded-lg p-3 text-sm text-gray-200 font-sans border border-gray-700 h-48 overflow-y-auto">
                        {lifestyleContent}
                    </pre>
                    <div className="mt-2 flex justify-end">
                        <button
                            onClick={handleCopy}
                            className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 transition-colors disabled:opacity-50"
                            aria-label="Copy AI content"
                            title="Sao chép nội dung AI"
                            disabled={copied}
                        >
                            {copied ? <CheckIcon className="w-5 h-5 text-[var(--color-icon-success)]" /> : <ClipboardIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const ComparisonDisplay = ({ 
    result, 
    originalFiles, 
    originalContent, 
    onRegenerateImage, 
    isImageRegenerating,
    onRegenerateContent,
    isContentRegenerating,
    onEditImage,
    isImageEditing
}: { 
    result: PolicyAnalysisResult | null, 
    originalFiles: ImageFile[], 
    originalContent: string, 
    onRegenerateImage: () => void, 
    isImageRegenerating: boolean,
    onRegenerateContent: () => void,
    isContentRegenerating: boolean,
    onEditImage: (prompt: string) => Promise<void>,
    isImageEditing: boolean,
}): React.JSX.Element | null => {
    if (!result || (!result.generatedImage && !result.lifestyleContent)) {
        return null;
    }

    const showImageComparison = result.generatedImage && originalFiles.length > 0;
    const showContentComparison = !!result.lifestyleContent;

    return (
        <InfoCard title="So sánh Sáng tạo" icon={<PencilIcon className="w-6 h-6 text-[var(--color-icon-accent)]" />}>
            {showImageComparison && (
                 <GeneratedImageDisplay 
                    originalFile={originalFiles[0]} 
                    generatedImageBase64={result.generatedImage!} 
                    onRegenerateImage={onRegenerateImage} 
                    isImageRegenerating={isImageRegenerating}
                    onEditImage={onEditImage}
                    isImageEditing={isImageEditing}
                />
            )}
            
            {showImageComparison && showContentComparison && (
                <div className="my-6 border-t border-[var(--color-border)]" />
            )}

            {showContentComparison && (
                <ContentComparisonDisplay 
                    originalContent={originalContent} 
                    lifestyleContent={result.lifestyleContent!}
                    onRegenerateContent={onRegenerateContent}
                    isContentRegenerating={isContentRegenerating}
                />
            )}
        </InfoCard>
    );
};
