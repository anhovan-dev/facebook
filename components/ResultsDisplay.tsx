import React, { useState } from 'react';
import type { PolicyAnalysisResult, Violation, ImageAnalysis, AppError } from '../types';
import { RobotIcon, SparklesIcon, CheckCircleIcon, LightBulbIcon, PencilIcon, PhotoIcon, DownloadIcon, ExclamationTriangleIcon, ChevronDownIcon, ResizeIcon } from './icons';
import { InfoCard } from './InfoCard';
import { exportToCsv, exportToPdf } from '../utils/exportUtils';


export const ErrorState = ({ error }: { error: AppError }): React.JSX.Element => {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div className="bg-red-900/20 backdrop-blur-sm rounded-xl p-5 border border-red-500/50">
            <div className="flex items-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-400 flex-shrink-0" />
                <div className="ml-4">
                    <h3 className="text-lg font-semibold text-red-200">Đã xảy ra lỗi</h3>
                    <p className="mt-1 text-red-300">{error.message}</p>
                </div>
            </div>
            
            {(error.details || (error.troubleshooting && error.troubleshooting.length > 0)) && (
                <div className="mt-4">
                    <button onClick={() => setShowDetails(!showDetails)} className="flex items-center text-sm text-red-300 hover:text-red-200">
                        {showDetails ? 'Ẩn chi tiết' : 'Hiện chi tiết & Gợi ý khắc phục'}
                        <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                    </button>
                    {showDetails && (
                        <div className="mt-3 pl-4 border-l-2 border-red-500/50 space-y-4">
                            {error.troubleshooting && error.troubleshooting.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-red-200 flex items-center">
                                        <LightBulbIcon className="w-5 h-5 mr-2" />
                                        Gợi ý khắc phục
                                    </h4>
                                    <ul className="list-disc list-inside mt-2 space-y-1 text-red-300">
                                        {error.troubleshooting.map((tip, i) => <li key={i}>{tip}</li>)}
                                    </ul>
                                </div>
                            )}
                            {error.details && (
                                <div>
                                    <h4 className="font-semibold text-red-200">Chi tiết kỹ thuật</h4>
                                    <pre className="mt-2 text-xs bg-black/30 p-2 rounded-md whitespace-pre-wrap font-mono text-red-300/80">
                                        Error Code: {error.code}{'\n'}
                                        {error.details}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


const InitialState = (): React.JSX.Element => (
    <>
        <InfoCard title="Kết quả kiểm tra" icon={<RobotIcon className="w-6 h-6 text-[var(--color-icon-accent)]" />}>
            <div className="text-center py-8">
                <RobotIcon className="w-16 h-16 text-gray-600 mx-auto" />
                <p className="mt-4 font-semibold text-[var(--color-text-header)]">Kết quả sẽ hiển thị ở đây sau khi kiểm tra</p>
                <p className="mt-1 text-gray-400">AI sẽ phân tích nội dung và đưa ra đánh giá chính xác về tuân thủ chính sách.</p>
            </div>
        </InfoCard>
        <InfoCard title="Gợi ý chỉnh sửa" icon={<LightBulbIcon className="w-6 h-6 text-[var(--color-icon-warning)]" />}>
             <div className="text-center py-8">
                <SparklesIcon className="w-16 h-16 text-yellow-600 mx-auto" />
                <p className="mt-4 font-semibold text-[var(--color-text-header)]">Gợi ý tối ưu sẽ xuất hiện tại đây</p>
                <p className="mt-1 text-gray-400">Nhận được lời khuyên chuyên nghiệp để cải thiện nội dung và tránh vi phạm.</p>
            </div>
        </InfoCard>
    </>
);

const LoadingState = (): React.JSX.Element => (
    <div className="bg-[var(--color-surface-1)] backdrop-blur-sm rounded-xl p-5 border border-[var(--color-border)] h-full flex flex-col justify-center items-center text-center col-span-1 md:col-span-2 min-h-[300px]">
        <svg className="animate-spin h-10 w-10 text-[var(--color-icon-accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-[var(--color-text-header)] font-semibold">AI đang phân tích nội dung...</p>
        <p className="text-sm text-[var(--color-text-accent)]">Quá trình này có thể mất vài giây.</p>
    </div>
);

const getStatusPill = (status: PolicyAnalysisResult['status']): React.JSX.Element => {
    switch (status) {
        case 'compliant':
            return <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-900 text-green-300">Tuân thủ</span>;
        case 'non_compliant':
            return <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-900 text-red-300">Vi phạm</span>;
        case 'warning':
            return <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-yellow-900 text-yellow-300">Cảnh báo</span>;
        default:
            return <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-700 text-gray-300">Không xác định</span>;
    }
}

const getSeverityPill = (severity: Violation['severity']): React.JSX.Element => {
    switch (severity) {
        case 'high':
            return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-900 text-red-300">Cao</span>;
        case 'medium':
            return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-900 text-yellow-300">Trung bình</span>;
        case 'low':
            return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-900 text-blue-300">Thấp</span>;
    }
};

const ImageAnalysisCard = ({ analysis }: { analysis: ImageAnalysis }): React.JSX.Element => (
    <InfoCard title="Phân tích Hình ảnh & Bố cục" icon={<PhotoIcon className="w-6 h-6 text-purple-400" />}>
        <div className="space-y-4">
            {analysis.policyViolations.length > 0 && (
                <div>
                    <h4 className="font-semibold text-[var(--color-text-header)] mb-2">Vi phạm chính sách hình ảnh:</h4>
                    <ul className="space-y-2 list-disc list-inside text-red-300">
                        {analysis.policyViolations.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                </div>
            )}
            {analysis.layoutFeedback.length > 0 && (
                 <div>
                    <h4 className="font-semibold text-[var(--color-text-header)] mb-2">Góp ý Bố cục & Thiết kế:</h4>
                    <ul className="space-y-2">
                        {analysis.layoutFeedback.map((s, i) => (
                            <li key={i} className="flex items-start">
                                <CheckCircleIcon className="w-5 h-5 text-[var(--color-icon-accent)] mr-2 flex-shrink-0 mt-0.5" />
                                <span>{s}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
             {analysis.brandingFeedback.length > 0 && (
                 <div>
                    <h4 className="font-semibold text-[var(--color-text-header)] mb-2">Góp ý Nhận diện Thương hiệu:</h4>
                     <ul className="space-y-2">
                        {analysis.brandingFeedback.map((s, i) => (
                            <li key={i} className="flex items-start">
                                <CheckCircleIcon className="w-5 h-5 text-[var(--color-icon-success)] mr-2 flex-shrink-0 mt-0.5" />
                                <span>{s}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {analysis.layoutSuggestions && analysis.layoutSuggestions.length > 0 && (
                <div>
                    <h4 className="font-semibold text-[var(--color-text-header)] mb-2 flex items-center">
                        <SparklesIcon className="w-5 h-5 text-yellow-400 mr-2" />
                        Gợi ý Bố cục Sáng tạo:
                    </h4>
                    <div className="space-y-3 mt-2">
                        {analysis.layoutSuggestions.map((suggestion, i) => (
                            <div key={i} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                                <p className="font-semibold text-purple-300">{suggestion.name}</p>
                                <p className="mt-1 text-sm text-gray-300">{suggestion.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </InfoCard>
);

const ResultContent = ({ result }: { result: PolicyAnalysisResult }): React.JSX.Element => {
    const [isContentExpanded, setIsContentExpanded] = useState(false);

    const exportActions = (
        <div className="flex gap-2">
            <button
                onClick={() => exportToPdf(result)}
                title="Xuất ra PDF"
                className="flex items-center text-xs px-2 py-1 bg-transparent text-gray-300 hover:bg-[var(--color-surface-2)] hover:text-white rounded-md transition-colors border border-transparent hover:border-[var(--color-border-subtle)]"
            >
                <DownloadIcon className="w-4 h-4 mr-1.5" />
                PDF
            </button>
             <button
                onClick={() => exportToCsv(result)}
                title="Xuất ra CSV"
                className="flex items-center text-xs px-2 py-1 bg-transparent text-gray-300 hover:bg-[var(--color-surface-2)] hover:text-white rounded-md transition-colors border border-transparent hover:border-[var(--color-border-subtle)]"
            >
                <DownloadIcon className="w-4 h-4 mr-1.5" />
                CSV
            </button>
        </div>
    );

    const contentToggle = (
        <button
            onClick={() => setIsContentExpanded(!isContentExpanded)}
            className="flex items-center text-xs px-2 py-1 bg-transparent text-gray-300 hover:bg-[var(--color-surface-2)] hover:text-white rounded-md transition-colors border border-transparent hover:border-[var(--color-border-subtle)]"
        >
            <ResizeIcon className={`w-4 h-4 mr-1.5 transition-transform duration-300 ${isContentExpanded ? 'rotate-45' : ''}`} />
            {isContentExpanded ? 'Thu gọn' : 'Mở rộng'}
        </button>
    );
    
    return (
        <div className="flex flex-col gap-8">
            <InfoCard 
                title="Kết quả kiểm tra" 
                icon={<RobotIcon className="w-6 h-6 text-[var(--color-icon-accent)]" />}
                topRightContent={exportActions}
            >
                <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-[var(--color-text-header)]">Trạng thái:</span>
                    {getStatusPill(result.status)}
                </div>
                <p className="italic text-gray-300">{result.summary}</p>
                {result.violations.length > 0 && (
                    <div className="mt-4">
                        <h4 className="font-semibold text-[var(--color-text-header)] mb-2">Chi tiết vi phạm:</h4>
                        <ul className="space-y-3">
                            {result.violations.map((v, i) => (
                                <li key={i} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-red-400">{v.rule}</p>
                                        {getSeverityPill(v.severity)}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-300">{v.explanation}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </InfoCard>
            
            {result.imageAnalysis && <ImageAnalysisCard analysis={result.imageAnalysis} />}

            <InfoCard 
                title="Nội dung đã sửa (Văn bản)" 
                icon={<PencilIcon className="w-6 h-6 text-[var(--color-icon-success)]" />}
                topRightContent={contentToggle}
            >
                <div className="relative">
                    <pre className={`whitespace-pre-wrap bg-gray-800/50 rounded-lg p-3 text-sm text-gray-200 font-sans border border-gray-700 overflow-hidden transition-all duration-500 ease-in-out ${isContentExpanded ? 'max-h-[1000px]' : 'max-h-60'}`}>
                        {result.fixedContent}
                    </pre>
                     {!isContentExpanded && (
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--color-surface-1)] to-transparent pointer-events-none rounded-b-lg"></div>
                    )}
                </div>
            </InfoCard>
        </div>
    );
}

export const ResultsDisplay = ({ isLoading, result, error }: { isLoading: boolean; result: PolicyAnalysisResult | null, error: AppError | null }): React.JSX.Element => {
    if (error) {
        return <ErrorState error={error} />;
    }

    if (isLoading) {
        return <LoadingState />;
    }
    
    if (result) {
        return <ResultContent result={result} />;
    }

    return <InitialState />;
};