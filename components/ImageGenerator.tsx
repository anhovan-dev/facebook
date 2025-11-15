import React, { useState, useCallback, useEffect } from 'react';
import type { AppError } from '../types';
import { InfoCard } from './InfoCard';
import { SparklesIcon, CubeIcon, DownloadIcon, PhotoIcon, TrashIcon, CheckCircleIcon, UserIcon } from './icons';
import { ErrorState } from './ResultsDisplay';
import { downloadCollage, createCollage, CollageLayout, downloadIndividualImages } from '../utils/imageUtils';
import { fileToDataUrl, fileToBase64 } from '../utils/imageUtils';
import { generateProductAlbum } from '../services/geminiService';
import type { GeneratedAlbum } from '../utils/imageUtils';


interface ImageGeneratorProps {
    error: AppError | null;
    setError: (error: AppError | null) => void;
}

interface SourceImage {
    preview: string;
    base64: string;
    name: string;
    mimeType: string;
}

const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const layoutOptions: { id: CollageLayout; name: string; description: string }[] = [
    { id: 'showcase', name: 'Bố cục Showcase (4:5)', description: 'Tối ưu cho bài đăng feed, làm nổi bật ảnh chính.' },
    { id: 'story', name: 'Bố cục Story (9:16)', description: 'Bố cục dọc hoàn hảo cho Facebook & Instagram Story.' },
    { id: 'grid', name: 'Bố cục Lưới 2x2', description: 'Hiển thị 4 ảnh trong một lưới 2x2 vuông vắn.' },
];


const InitialState = () => (
    <div className="text-center py-8 h-full flex flex-col justify-center items-center min-h-[400px]">
        <CubeIcon className="w-16 h-16 text-gray-600 mx-auto" />
        <p className="mt-4 font-semibold text-[var(--color-text-header)]">Album ảnh AI sẽ được tạo tại đây</p>
        <p className="mt-1 text-gray-400">Tải lên một hình ảnh sản phẩm để AI tạo ra một bộ ảnh hoàn chỉnh.</p>
    </div>
);

const LoadingState = ({ text }: { text: string }) => (
    <div className="h-full flex flex-col justify-center items-center text-center min-h-[400px]">
        <svg className="animate-spin h-10 w-10 text-[var(--color-icon-accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-[var(--color-text-header)] font-semibold">{text}</p>
        <p className="text-sm text-[var(--color-text-accent)]">Quá trình này có thể mất một vài phút...</p>
    </div>
);


const CollageResultDisplay = ({
    album,
    sourceImage,
    onBack
}: {
    album: GeneratedAlbum;
    sourceImage: SourceImage;
    onBack: () => void;
}) => {
    const [selectedLayout, setSelectedLayout] = useState<CollageLayout>('showcase');
    const [previews, setPreviews] = useState<Record<CollageLayout, string> | null>(null);
    const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloadingIndividually, setIsDownloadingIndividually] = useState(false);

    useEffect(() => {
        let isCancelled = false;
        const generatePreviews = async () => {
            setIsGeneratingPreviews(true);
            try {
                const previewPromises = layoutOptions.map(opt =>
                    createCollage(opt.id, album, { finalWidth: 300 })
                );
                const generatedPreviews = await Promise.all(previewPromises);
                if (!isCancelled) {
                    const previewMap = layoutOptions.reduce((acc, opt, index) => {
                        acc[opt.id] = generatedPreviews[index];
                        return acc;
                    }, {} as Record<CollageLayout, string>);
                    setPreviews(previewMap);
                }
            } catch (err) {
                console.error("Failed to generate collage previews:", err);
            } finally {
                if (!isCancelled) {
                    setIsGeneratingPreviews(false);
                }
            }
        };
        generatePreviews();
        return () => { isCancelled = true; };
    }, [album]);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const collageDataUrl = await createCollage(selectedLayout, album, { finalWidth: 1080 });
            const nameWithoutExt = sourceImage.name.split('.').slice(0, -1).join('.') || 'album';
            downloadCollage(collageDataUrl, `${nameWithoutExt}-${selectedLayout}-collage.jpg`);
        } catch (e) {
            console.error('Download failed', e);
            alert('Đã xảy ra lỗi khi tải album. Vui lòng thử lại.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadIndividual = () => {
        setIsDownloadingIndividually(true);
        try {
            const nameWithoutExt = sourceImage.name.split('.').slice(0, -1).join('.') || 'album';
            downloadIndividualImages(album, nameWithoutExt);
        } catch (e) {
            console.error('Individual download failed', e);
            alert('Đã xảy ra lỗi khi tải các ảnh. Vui lòng thử lại.');
        } finally {
            setTimeout(() => setIsDownloadingIndividually(false), 1000);
        }
    };

    if (isGeneratingPreviews) {
        return <LoadingState text="Đang tạo các bố cục..." />;
    }

    if (!previews) {
        return <p>Không thể tạo bản xem trước bố cục.</p>;
    }

    return (
        <div className="w-full">
            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-[var(--color-text-header)]">
                    Hoàn tất! Chọn một bố cục Album
                </h3>
                <p className="text-sm text-gray-400">Chọn bố cục phù hợp nhất với kênh quảng cáo của bạn.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {layoutOptions.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => setSelectedLayout(opt.id)}
                        className={`p-2 rounded-lg transition-all duration-200 border-2 ${selectedLayout === opt.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-transparent hover:border-gray-600'}`}
                    >
                        <img src={previews[opt.id]} alt={`${opt.name} preview`} className="w-full rounded-md object-contain" />
                        <h4 className="font-semibold text-sm mt-3 text-[var(--color-text-header)]">{opt.name}</h4>
                        <p className="text-xs text-gray-400">{opt.description}</p>
                    </button>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={handleDownload} disabled={isDownloading || isDownloadingIndividually} className="w-full sm:w-auto flex items-center justify-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {isDownloading ? 'Đang tải...' : (
                        <>
                            <DownloadIcon className="w-5 h-5 mr-2" />
                            Tải Bố cục Collage
                        </>
                    )}
                </button>
                <button onClick={handleDownloadIndividual} disabled={isDownloadingIndividually || isDownloading} className="w-full sm:w-auto flex items-center justify-center bg-transparent hover:bg-[var(--color-surface-2)] text-white font-bold py-3 px-4 rounded-md transition-colors border border-[var(--color-border)] disabled:opacity-50 disabled:cursor-not-allowed">
                    {isDownloadingIndividually ? 'Đang chuẩn bị...' : (
                        <>
                            <PhotoIcon className="w-5 h-5 mr-2" />
                            Tải 4 ảnh riêng lẻ
                        </>
                    )}
                </button>
            </div>
             <div className="mt-4 text-center">
                 <button onClick={onBack} className="text-sm text-[var(--color-text-accent)] hover:text-white">
                    ← Quay lại chọn ảnh
                </button>
             </div>
        </div>
    );
};

const ImageSelection = ({ 
    images, 
    onConfirm 
}: { 
    images: GeneratedAlbum, 
    onConfirm: (album: GeneratedAlbum) => void 
}) => {
    const [selectedDetails, setSelectedDetails] = useState<string[]>([]);
    const heroImage = images.hero;
    const detailOptions = images.details;

    const toggleSelection = (image: string) => {
        setSelectedDetails(prev => {
            if (prev.includes(image)) {
                return prev.filter(item => item !== image);
            }
            if (prev.length < 3) {
                return [...prev, image];
            }
            return prev; // Max 3 selected
        });
    };

    const handleConfirm = () => {
        if (selectedDetails.length === 3) {
            onConfirm({
                hero: heroImage,
                details: selectedDetails
            });
        }
    };
    
    return (
        <div>
             <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-[var(--color-text-header)]">
                   Chọn 3 ảnh chi tiết bạn thích nhất
                </h3>
                <p className="text-sm text-gray-400">AI đã tạo ra nhiều góc chụp chi tiết để bạn lựa chọn.</p>
            </div>
            
            <div className="mb-6">
                 <h4 className="font-semibold text-sm mb-2 text-[var(--color-text-accent)]">Ảnh chính (Lifestyle):</h4>
                 <img src={`data:image/png;base64,${heroImage}`} alt="Hero" className="rounded-lg w-full" />
            </div>

            <div>
                <h4 className="font-semibold text-sm mb-2 text-[var(--color-text-accent)]">Ảnh chi tiết (Chọn 3):</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {detailOptions.map((detail, index) => {
                        const isSelected = selectedDetails.includes(detail);
                        return (
                             <button key={index} onClick={() => toggleSelection(detail)} className="relative aspect-square rounded-md overflow-hidden group focus:outline-none">
                                <img src={`data:image/png;base64,${detail}`} alt={`Detail ${index+1}`} className="w-full h-full object-cover" />
                                <div className={`absolute inset-0 transition-all duration-200 ${isSelected ? 'bg-black/50' : 'bg-black/70 opacity-0 group-hover:opacity-100'}`}></div>
                                {isSelected && (
                                    <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                                        <CheckCircleIcon className="w-5 h-5" />
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                <button 
                    onClick={handleConfirm}
                    disabled={selectedDetails.length !== 3}
                    className="w-full flex items-center justify-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold py-3 px-4 rounded-md transition-colors disabled:bg-[var(--color-primary-disabled)] disabled:cursor-not-allowed"
                >
                    Tạo Album với {selectedDetails.length}/3 ảnh đã chọn
                </button>
            </div>
        </div>
    );
};

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ error, setError }) => {
    const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
    const [rawGeneratedImages, setRawGeneratedImages] = useState<GeneratedAlbum | null>(null);
    const [finalAlbum, setFinalAlbum] = useState<GeneratedAlbum | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState(false);
    const [includeModel, setIncludeModel] = useState(true);
    const [currentView, setCurrentView] = useState<'uploader' | 'selection' | 'collage'>('uploader');


    const handleFileChange = useCallback(async (files: FileList | null) => {
        setError(null);
        setFinalAlbum(null);
        setRawGeneratedImages(null);
        setCurrentView('uploader');
        if (!files || files.length === 0) return;

        const file = files[0];

        if (file.size > MAX_FILE_SIZE_BYTES) {
            setError({ code: 'VALIDATION_ERROR', message: `Tệp vượt quá giới hạn dung lượng ${MAX_FILE_SIZE_MB}MB.` });
            return;
        }

        if (!file.type.startsWith('image/')) {
             setError({ code: 'VALIDATION_ERROR', message: `Tệp không phải là hình ảnh.` });
            return;
        }

        try {
            const preview = await fileToDataUrl(file);
            const base64 = await fileToBase64(file);
            setSourceImage({ preview, base64, name: file.name, mimeType: file.type || 'image/png' });
        } catch (err) {
            console.error("Error processing file:", err);
            setError({ code: 'FILE_READ_ERROR', message: 'Không thể đọc hoặc xử lý tệp hình ảnh.' });
            setSourceImage(null);
        }
    }, [setError]);
    
    const handleGenerateAlbum = useCallback(async () => {
        if (!sourceImage) return;

        setIsLoading(true);
        setError(null);
        setRawGeneratedImages(null);
        setFinalAlbum(null);

        try {
            const album = await generateProductAlbum(sourceImage.base64, sourceImage.mimeType, includeModel);
            setRawGeneratedImages(album);
            setCurrentView('selection');
        } catch (err: any) {
            if (err.appError) {
                setError(err.appError as AppError);
            } else {
                 setError({
                    code: 'GENERATION_FAILED',
                    message: 'Không thể tạo album ảnh.',
                    details: String(err),
                });
            }
            setCurrentView('uploader');
        } finally {
            setIsLoading(false);
        }
    }, [sourceImage, includeModel, setError]);


    const handleRemoveImage = () => {
        setSourceImage(null);
        setRawGeneratedImages(null);
        setFinalAlbum(null);
        setError(null);
        setCurrentView('uploader');
    }

    const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); };
    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileChange(e.dataTransfer.files);
    }, [handleFileChange]);

    const renderContent = () => {
        if (isLoading) return <LoadingState text="AI đang thực hiện photoshoot..." />;
        if (error) return <ErrorState error={error} />;

        switch (currentView) {
            case 'selection':
                if (rawGeneratedImages) {
                    return <ImageSelection images={rawGeneratedImages} onConfirm={(album) => {
                        setFinalAlbum(album);
                        setCurrentView('collage');
                    }} />;
                }
                // Fallback if state is inconsistent
                setCurrentView('uploader');
                return <InitialState />;
            case 'collage':
                 if (finalAlbum && sourceImage) {
                    return <CollageResultDisplay album={finalAlbum} sourceImage={sourceImage} onBack={() => setCurrentView('selection')} />;
                }
                // Fallback if state is inconsistent
                setCurrentView('uploader');
                return <InitialState />;
            case 'uploader':
            default:
                return <InitialState />;
        }
    };


    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 flex flex-col">
                <InfoCard title="Tải lên Hình ảnh Sản phẩm" icon={<SparklesIcon className="w-6 h-6 text-[var(--color-icon-accent)]" />}>
                     <p className="text-sm text-gray-400 mb-4">
                        Chọn một hình ảnh sản phẩm để AI phân tích và tạo ra một bộ ảnh album theo phong cách đời thường, tự nhiên.
                    </p>
                    {!sourceImage ? (
                        <div 
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onDragEnter={onDragEnter}
                            onDragLeave={onDragLeave}
                            className={`mt-2 flex justify-center rounded-lg border border-dashed transition-colors px-6 py-10 ${isDragging ? 'bg-blue-900/30 border-[var(--color-border-focus)]' : 'border-gray-600 hover:border-[var(--color-border-focus)]'}`}
                        >
                            <div className="text-center">
                                <PhotoIcon className="mx-auto h-12 w-12 text-gray-500" />
                                <div className="mt-4 flex text-sm leading-6 text-gray-400">
                                <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer rounded-md font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:ring-offset-2 focus-within:ring-offset-gray-900"
                                >
                                    <span>Tải lên một tệp</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e.target.files)} accept="image/png, image/jpeg, image/webp" />
                                </label>
                                <p className="pl-1">hoặc kéo và thả</p>
                                </div>
                                <p className="text-xs leading-5 text-gray-500">PNG, JPG, WEBP. Tối đa {MAX_FILE_SIZE_MB}MB</p>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 flex flex-col items-center gap-4">
                             <img
                                src={sourceImage.preview}
                                alt="Source"
                                className="rounded-lg border-2 border-[var(--color-border-focus)] w-full max-w-sm"
                            />
                            <div className="w-full max-w-sm flex flex-col gap-3">
                                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <label className="text-sm font-medium text-white mb-2 block">Phong cách Chụp ảnh</label>
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        <button
                                            onClick={() => setIncludeModel(false)}
                                            className={`flex flex-col items-center justify-center text-center p-3 rounded-md border-2 transition-colors h-24 ${!includeModel ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'}`}
                                        >
                                            <CubeIcon className="w-6 h-6 text-[var(--color-text-accent)]" />
                                            <span className="text-xs font-semibold mt-1 text-white">Chỉ Sản phẩm</span>
                                        </button>
                                        <button
                                            onClick={() => setIncludeModel(true)}
                                            className={`flex flex-col items-center justify-center text-center p-3 rounded-md border-2 transition-colors h-24 ${includeModel ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'}`}
                                        >
                                            <UserIcon className="w-6 h-6 text-[var(--color-text-accent)]" />
                                            <span className="text-xs font-semibold mt-1 text-white">Cùng Người mẫu</span>
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={handleGenerateAlbum}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold py-3 px-4 rounded-md transition-colors disabled:bg-[var(--color-primary-disabled)] disabled:cursor-not-allowed"
                                >
                                    <SparklesIcon className="w-5 h-5 mr-2" />
                                    {isLoading ? 'Đang tạo...' : 'Bắt đầu Photoshoot AI'}
                                </button>
                                <button
                                    onClick={handleRemoveImage}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center bg-gray-700/50 hover:bg-gray-700/80 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                                >
                                    <TrashIcon className="w-5 h-5 mr-2" />
                                    Chọn lại ảnh khác
                                </button>
                            </div>
                        </div>
                    )}
                </InfoCard>
            </div>

            <div className="lg:col-span-7 flex flex-col">
                <InfoCard title="Kết quả Album" icon={<CubeIcon className="w-6 h-6 text-[var(--color-icon-accent)]" />}>
                   {renderContent()}
                </InfoCard>
            </div>
        </div>
    );
};