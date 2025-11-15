
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { HistoryPanel } from './components/HistoryPanel';
import { ComparisonDisplay } from './components/ComparisonDisplay';
import { checkAdPolicy, regenerateImage, regenerateLifestyleContent } from './services/geminiService';
import { fileToDataUrl } from './utils/imageUtils';
import type { PolicyAnalysisResult, ImageFile, HistoryEntry, HistoryFile } from './types';
import { InfoCard } from './components/InfoCard';
import { LightBulbIcon, CheckCircleIcon } from './components/icons';

const MAX_HISTORY_ITEMS = 10;
const HISTORY_STORAGE_KEY = 'adCheckHistory';

export default function App(): React.JSX.Element {
  const [content, setContent] = useState<string>('');
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [contentType, setContentType] = useState<string>('Chọn dạng content');
  const [checkType, setCheckType] = useState<string>('Chọn loại kiểm tra');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImageRegenerating, setIsImageRegenerating] = useState<boolean>(false);
  const [isContentRegenerating, setIsContentRegenerating] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<PolicyAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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
      setError('Vui lòng chọn dạng content.');
      return;
    }
    if (checkType === 'Chọn loại kiểm tra') {
      setError('Vui lòng chọn loại kiểm tra.');
      return;
    }
    if (contentType === 'Quảng cáo hình ảnh' && files.length === 0) {
      setError('Vui lòng tải lên ít nhất một hình ảnh khi chọn dạng "Quảng cáo hình ảnh".');
      return;
    }
    if (!content.trim() && files.length === 0) {
      setError('Vui lòng nhập nội dung hoặc tải lên ít nhất một hình ảnh để kiểm tra.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const imageBase64s = await Promise.all(
        files.map(imageFile => fileToDataUrl(imageFile.file).then(dataUrl => dataUrl.split(',')[1]))
      );
      const result = await checkAdPolicy(content, contentType, checkType, imageBase64s);
      setAnalysisResult(result);

      // Save to history on success
      const historyFiles: HistoryFile[] = await Promise.all(
          files.map(async (f) => ({
              name: f.file.name,
              dataUrl: await fileToDataUrl(f.file)
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
        console.error("Failed to check policy:", err);
        // FIX: The caught error `err` is of type `unknown` and cannot be used in a template string directly. Convert it to a string.
        setError(`Đã có lỗi xảy ra khi phân tích: ${String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }, [content, contentType, checkType, files]);

  const handleRegenerateImage = useCallback(async () => {
    if (!analysisResult || !analysisResult.imageAnalysis || files.length === 0) return;
    
    setIsImageRegenerating(true);
    setError(null);

    try {
        const originalImageBase64 = await fileToDataUrl(files[0].file).then(dataUrl => dataUrl.split(',')[1]);
        const { generatedImage } = await regenerateImage(originalImageBase64, analysisResult.imageAnalysis);
        
        setAnalysisResult(prevResult => {
            if (!prevResult) return null;
            return {
                ...prevResult,
                generatedImage,
            };
        });

    } catch (err) {
        console.error("Failed to regenerate image:", err);
        // FIX: The caught error `err` is of type `unknown` and cannot be used in a template string directly. Convert it to a string.
        setError(`Đã có lỗi xảy ra khi tạo lại ảnh: ${String(err)}`);
    } finally {
        setIsImageRegenerating(false);
    }
  }, [analysisResult, files]);

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
        console.error("Failed to regenerate content:", err);
        // FIX: The caught error `err` is of type `unknown` and cannot be used in a template string directly. Convert it to a string.
        setError(`Đã có lỗi xảy ra khi tạo lại nội dung: ${String(err)}`);
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
            preview: hf.dataUrl
        }));
        setFiles(imageFilesFromHistory);
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [history]);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  useEffect(() => {
    const previews = files.map(f => f.preview);
    return () => {
      previews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [files]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-body)] font-sans p-4 sm:p-6 lg:p-8 transition-colors duration-500" style={{backgroundImage: 'radial-gradient(circle at top right, rgba(29, 78, 216, 0.3), transparent 40%), radial-gradient(circle at bottom left, rgba(29, 78, 216, 0.2), transparent 50%)'}}>
      <div className="max-w-7xl mx-auto">
        <Header />

        <main className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="flex flex-col gap-8 lg:col-span-7 order-1">
            <InputForm 
              content={content}
              setContent={setContent}
              files={files}
              setFiles={setFiles}
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
            />
          </div>
          
          <div className="flex flex-col gap-8 lg:col-span-5 order-2">
             <ResultsDisplay 
               isLoading={isLoading} 
               result={analysisResult} 
               error={error}
             />
          </div>
        </main>
        
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
                  onClear={handleClearHistory}
              />
            </section>
        )}
      </div>
    </div>
  );
}
