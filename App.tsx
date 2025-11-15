import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { HistoryPanel } from './components/HistoryPanel';
import { ComparisonDisplay } from './components/ComparisonDisplay';
// FIX: Import GeminiServiceError to handle specific API errors.
import { checkAdPolicy, regenerateImage, regenerateLifestyleContent, editImage, generateThemeFromLogo, GeminiServiceError } from './services/geminiService';
import { fileToDataUrl, fileToBase64 } from './utils/imageUtils';
import type { PolicyAnalysisResult, ImageFile, HistoryEntry, HistoryFile, ThemeGenerationResult, AppError, ImageInput } from './types';
import { InfoCard } from './components/InfoCard';
import { LightBulbIcon, CheckCircleIcon } from './components/icons';
import { StyleGuide } from './components/StyleGuide';
import { ModeSwitcher } from './components/ModeSwitcher';
import { ImageGenerator } from './components/ImageGenerator';

const MAX_HISTORY_ITEMS = 10;
const HISTORY_STORAGE_KEY = 'adCheckHistory';

export default function App(): React.JSX.Element {
  // General state
  const [mode, setMode] = useState<'checker' | 'generator'>('checker');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);

  // Ad Checker state
  const [content, setContent] = useState<string>('');
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [logo, setLogo] = useState<File | null>(null);
  const [contentType, setContentType] = useState<string>('Chọn dạng content');
  const [checkType, setCheckType] = useState<string>('Chọn loại kiểm tra');
  const [isImageRegenerating, setIsImageRegenerating] = useState<boolean>(false);
  const [isContentRegenerating, setIsContentRegenerating] = useState<boolean>(false);
  const [isImageEditing, setIsImageEditing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<PolicyAnalysisResult | null>(null);
  const [themeResult, setThemeResult] = useState<ThemeGenerationResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);


  // Load history from localStorage on initial render
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
      setHistory([]);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  }, [history]);

  const handleCheckPolicy = useCallback(async () => {
    if (contentType === 'Chọn dạng content') {
      setError({ code: 'VALIDATION_ERROR', message: 'Vui lòng chọn dạng content.' });
      return;
    }
    if (checkType === 'Chọn loại kiểm tra') {
      setError({ code: 'VALIDATION_ERROR', message: 'Vui lòng chọn loại kiểm tra.' });
      return;
    }
    if (contentType === 'Quảng cáo hình ảnh' && files.length === 0) {
      setError({ code: 'VALIDATION_ERROR', message: 'Vui lòng tải lên ít nhất một hình ảnh khi chọn dạng "Quảng cáo hình ảnh".' });
      return;
    }
    if (!content.trim() && files.length === 0) {
      setError({ code: 'VALIDATION_ERROR', message: 'Vui lòng nhập nội dung hoặc tải lên ít nhất một hình ảnh để kiểm tra.' });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setThemeResult(null);

    try {
      const imageInputs: ImageInput[] = await Promise.all(
        files.map(async (imageFile) => ({
            data: await fileToBase64(imageFile.file),
            mimeType: imageFile.file.type || 'image/jpeg',
        }))
      );
      
      const policyPromise = checkAdPolicy(content, contentType, checkType, imageInputs);
      
      const themePromise = logo 
        ? generateThemeFromLogo(await fileToBase64(logo))
        : Promise.resolve(null);

      const [result, theme] = await Promise.all([policyPromise, themePromise]);

      setAnalysisResult(result);
      if (theme) {
          setThemeResult(theme);
      }

      // Save to history on success
      const historyFiles: HistoryFile[] = await Promise.all(
          files.map(async (f) => ({
              name: f.file.name,
              dataUrl: f.preview.startsWith('data:') ? f.preview : await fileToDataUrl(f.file)
          }))
      );
      
      const newEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        status: result.status,
        summary: result.summary,
        result,
        originalContent: content,
        originalContentType: contentType,
        originalCheckType: checkType,
        originalFiles: historyFiles,
      };
      setHistory(prev => [newEntry, ...prev].slice(0, MAX_HISTORY_ITEMS));

    } catch (err) {
        if (err instanceof GeminiServiceError) {
            setError(err.appError);
        } else {
            console.error("An unexpected error occurred:", err);
            setError({
                code: 'UNEXPECTED_ERROR',
                message: 'Đã có một lỗi không mong muốn xảy ra.',
                details: String(err),
                troubleshooting: ["Vui lòng thử tải lại trang và thực hiện lại thao tác."]
            });
        }
    } finally {
      setIsLoading(false);
    }
  }, [content, contentType, checkType, files, logo]);

  const handleRegenerateImage = useCallback(async () => {
    if (!analysisResult || !analysisResult.imageAnalysis || files.length === 0) return;
    
    setIsImageRegenerating(true);
    setError(null);

    try {
        const imageFile = files[0];
        let originalImageBase64: string;
        let mimeType: string;

        // For history items, file.size is 0, so we parse the dataUrl
        if (imageFile.file.size > 0) {
            originalImageBase64 = await fileToBase64(imageFile.file);
            mimeType = imageFile.file.type;
        } else {
            const parts = imageFile.preview.split(',');
            const mimeTypePart = parts[0].match(/:(.*?);/);
            mimeType = mimeTypePart ? mimeTypePart[1] : 'image/jpeg';
            originalImageBase64 = parts[1];
        }
        
        const { generatedImage } = await regenerateImage(originalImageBase64, mimeType, analysisResult.imageAnalysis);
        
        setAnalysisResult(prevResult => {
            if (!prevResult) return null;
            return {
                ...prevResult,
                generatedImage,
            };
        });

    } catch (err) {
        if (err instanceof GeminiServiceError) {
            setError(err.appError);
        } else {
            console.error("Failed to regenerate image:", err);
            setError({
                code: 'UNEXPECTED_ERROR',
                message: 'Đã có lỗi xảy ra khi tạo lại ảnh.',
                details: String(err)
            });
        }
    } finally {
        setIsImageRegenerating(false);
    }
  }, [analysisResult, files]);

  const handleEditImage = useCallback(async (prompt: string) => {
    if (!analysisResult || !analysisResult.generatedImage) return;

    setIsImageEditing(true);
    setError(null);

    try {
        const { editedImage } = await editImage(analysisResult.generatedImage, prompt);
        
        setAnalysisResult(prevResult => {
            if (!prevResult) return null;
            return {
                ...prevResult,
                generatedImage: editedImage || prevResult.generatedImage,
            };
        });

    } catch (err) {
        if (err instanceof GeminiServiceError) {
            setError(err.appError);
        } else {
            console.error("Failed to edit image:", err);
            setError({
                code: 'UNEXPECTED_ERROR',
                message: 'Đã có lỗi xảy ra khi chỉnh sửa ảnh.',
                details: String(err)
            });
        }
    } finally {
        setIsImageEditing(false);
    }
  }, [analysisResult]);

  const handleRegenerateContent = useCallback(async () => {
    if (!analysisResult || !analysisResult.imageAnalysis) return;

    setIsContentRegenerating(true);
    setError(null);

    try {
        const { lifestyleContent } = await regenerateLifestyleContent(analysisResult.imageAnalysis, content);
        
        setAnalysisResult(prevResult => {
            if (!prevResult) return null;
            return {
                ...prevResult,
                lifestyleContent,
            };
        });

    } catch (err) {
        if (err instanceof GeminiServiceError) {
            setError(err.appError);
        } else {
            console.error("Failed to regenerate content:", err);
            setError({
                code: 'UNEXPECTED_ERROR',
                message: 'Đã có lỗi xảy ra khi tạo lại nội dung.',
                details: String(err)
            });
        }
    } finally {
        setIsContentRegenerating(false);
    }
  }, [analysisResult, content]);
  
  const handleSelectHistoryEntry = useCallback((id: string) => {
    const entry = history.find(h => h.id === id);
    if (entry) {
        setAnalysisResult(entry.result);
        setContent(entry.originalContent);
        setContentType(entry.originalContentType);
        setCheckType(entry.originalCheckType);
        
        const imageFilesFromHistory: ImageFile[] = entry.originalFiles.map((hf, index) => ({
            id: `${entry.id}-file-${index}`,
            file: new File([], hf.name, {}),
            preview: hf.dataUrl,
            progress: 100, // Files from history are fully "uploaded"
        }));
        setFiles(imageFilesFromHistory);
        setLogo(null);
        setThemeResult(null);
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [history]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-body)] font-sans p-4 sm:p-6 lg:p-8 transition-colors duration-500" style={{backgroundImage: 'radial-gradient(circle at top right, rgba(29, 78, 216, 0.3), transparent 40%), radial-gradient(circle at bottom left, rgba(29, 78, 216, 0.2), transparent 50%)'}}>
      <div className="max-w-7xl mx-auto">
        <Header />

        <main className="mt-8">
          <ModeSwitcher mode={mode} setMode={(newMode) => {
              setMode(newMode);
              setError(null);
          }} />

          <div className="mt-8">
            {mode === 'checker' ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="flex flex-col gap-8 lg:col-span-7 order-1">
                    <InputForm 
                      content={content}
                      setContent={setContent}
                      files={files}
                      setFiles={setFiles}
                      logo={logo}
                      setLogo={setLogo}
                      contentType={contentType}
                      setContentType={setContentType}
                      checkType={checkType}
                      setCheckType={setCheckType}
                      onCheck={handleCheckPolicy}
                      isLoading={isLoading}
                      setError={setError}
                    />
                    <ComparisonDisplay 
                      result={analysisResult} 
                      originalFiles={files}
                      originalContent={content}
                      onRegenerateImage={handleRegenerateImage}
                      isImageRegenerating={isImageRegenerating}
                      onRegenerateContent={handleRegenerateContent}
                      isContentRegenerating={isContentRegenerating}
                      onEditImage={handleEditImage}
                      isImageEditing={isImageEditing}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-8 lg:col-span-5 order-2">
                     <ResultsDisplay 
                       isLoading={isLoading} 
                       result={analysisResult} 
                       error={error}
                     />
                     {themeResult && logo && (
                        <StyleGuide 
                            themeResult={themeResult}
                            logo={URL.createObjectURL(logo)}
                        />
                     )}
                  </div>
                </div>

                {analysisResult && analysisResult.suggestions.length > 0 && (
                    <aside className="mt-8">
                        <InfoCard title="Gợi ý chỉnh sửa chung" icon={<LightBulbIcon className="w-6 h-6 text-[var(--color-icon-warning)]" />}>
                            <ul className="space-y-2">
                                {analysisResult.suggestions.map((s, i) => (
                                    <li key={i} className="flex items-start">
                                        <CheckCircleIcon className="w-5 h-5 text-[var(--color-icon-success)] mr-2 flex-shrink-0 mt-0.5" />
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </InfoCard>
                    </aside>
                )}

                {history.length > 0 && (
                    <section className="mt-8">
                      <HistoryPanel 
                          history={history} 
                          onSelect={handleSelectHistoryEntry}
                      />
                    </section>
                )}
              </>
            ) : (
               <ImageGenerator
                  error={error}
                  setError={setError}
                />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}