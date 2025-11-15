
import React, { useCallback } from 'react';
import { DocumentIcon, ScaleIcon, PencilIcon, CheckCircleIcon, PhotoIcon, XCircleIcon } from './icons';
import { CONTENT_TYPE_OPTIONS, CHECK_TYPE_OPTIONS } from '../constants';
import type { ImageFile } from '../types';

interface InputFormProps {
  content: string;
  setContent: (value: string) => void;
  files: ImageFile[];
  setFiles: React.Dispatch<React.SetStateAction<ImageFile[]>>;
  contentType: string;
  setContentType: (value: string) => void;
  checkType: string;
  setCheckType: (value: string) => void;
  onCheck: () => void;
  isLoading: boolean;
  setError: (value: string | null) => void;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;


const CustomSelect = ({ label, icon, value, onChange, options }: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}): React.JSX.Element => (
  <div className="flex-1 min-w-[200px]">
    <label className="flex items-center text-sm font-medium text-[var(--color-text-accent)] mb-2">
      {icon}
      <span className="ml-2">{label}</span>
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] rounded-md py-2.5 px-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  </div>
);

export const InputForm = ({
  content,
  setContent,
  files,
  setFiles,
  contentType,
  setContentType,
  checkType,
  setCheckType,
  onCheck,
  isLoading,
  setError,
}: InputFormProps): React.JSX.Element => {

  const handleFileChange = useCallback((newFiles: FileList | null) => {
    setError(null);
    if (newFiles) {
       if (files.length + newFiles.length > MAX_FILES) {
        setError(`Bạn chỉ có thể tải lên tối đa ${MAX_FILES} hình ảnh.`);
        return;
      }

      const addedFiles: ImageFile[] = [];
      const oversizedFiles: string[] = [];

      Array.from(newFiles).forEach(file => {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          oversizedFiles.push(file.name);
          return;
        }
        addedFiles.push({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
        });
      });
      
      if (oversizedFiles.length > 0) {
        setError(`Các tệp sau vượt quá giới hạn ${MAX_FILE_SIZE_MB}MB: ${oversizedFiles.join(', ')}`);
      }

      setFiles(prev => [...prev, ...addedFiles]);
    }
  }, [setFiles, files.length, setError]);

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFileChange(event.dataTransfer.files);
  }, [handleFileChange]);

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeFile = (idToRemove: string) => {
    setFiles(currentFiles => {
      const fileToRemove = currentFiles.find(f => f.id === idToRemove);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return currentFiles.filter(f => f.id !== idToRemove);
    });
  };


  return (
    <div className="bg-[var(--color-surface-1)] backdrop-blur-sm rounded-xl p-6 border border-[var(--color-border)] h-full">
      <h2 className="text-xl font-semibold text-[var(--color-text-header)]">Thông tin kiểm tra</h2>
      <p className="text-[var(--color-text-accent)] mt-1">Điền đầy đủ thông tin bên dưới</p>

      <div className="mt-6 flex flex-col sm:flex-row gap-6 flex-wrap">
        <CustomSelect 
          label="Dạng content"
          icon={<DocumentIcon className="w-5 h-5 text-[var(--color-icon-accent)]" />}
          value={contentType}
          onChange={(e) => { setContentType(e.target.value); setError(null); }}
          options={CONTENT_TYPE_OPTIONS}
        />
        <CustomSelect 
          label="Loại kiểm tra"
          icon={<ScaleIcon className="w-5 h-5 text-[var(--color-icon-accent)]" />}
          value={checkType}
          onChange={(e) => { setCheckType(e.target.value); setError(null); }}
          options={CHECK_TYPE_OPTIONS}
        />
      </div>

      <div className="mt-6">
        <label className="flex items-center text-sm font-medium text-[var(--color-text-accent)] mb-2">
          <PencilIcon className="w-5 h-5 text-[var(--color-icon-warning)]" />
          <span className="ml-2">Nội dung content</span>
        </label>
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setError(null);}}
            placeholder="Nhập nội dung cần kiểm tra tại đây..."
            className="w-full h-40 bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] rounded-md p-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] resize-y"
          />
          <span className="absolute bottom-3 right-3 text-xs text-gray-400">{content.length} ký tự</span>
        </div>
      </div>
      
      <div className="mt-6">
        <label className="flex items-center text-sm font-medium text-[var(--color-text-accent)] mb-2">
          <PhotoIcon className="w-5 h-5 text-purple-400" />
           <span className="ml-2">Đính kèm hình ảnh ({contentType === 'Quảng cáo hình ảnh' ? <span className="text-yellow-300 font-semibold">bắt buộc</span> : 'tùy chọn'})</span>
        </label>
        <div 
          onDrop={onDrop}
          onDragOver={onDragOver}
          className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-600 hover:border-[var(--color-border-focus)] transition-colors px-6 py-10"
        >
          <div className="text-center">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-500" />
            <div className="mt-4 flex text-sm leading-6 text-gray-400">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:ring-offset-2 focus-within:ring-offset-gray-900"
              >
                <span>Tải lên một tệp</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={(e) => handleFileChange(e.target.files)} accept="image/png, image/jpeg, image/webp" />
              </label>
              <p className="pl-1">hoặc kéo và thả</p>
            </div>
            <p className="text-xs leading-5 text-gray-500">Tối đa {MAX_FILES} ảnh, mỗi ảnh tối đa {MAX_FILE_SIZE_MB}MB</p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((imageFile) => (
              <div key={imageFile.id} className="relative group">
                <img src={imageFile.preview} alt={imageFile.file.name} className="h-24 w-full object-cover rounded-md" />
                <button
                  onClick={() => removeFile(imageFile.id)}
                  className="absolute top-1 right-1 bg-black/50 p-0.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove file"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <button
          onClick={onCheck}
          disabled={isLoading}
          className="w-full flex items-center justify-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold py-3 px-4 rounded-md transition-colors disabled:bg-[var(--color-primary-disabled)] disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang kiểm tra...
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-6 h-6 mr-2" />
              Kiểm tra ngay
            </>
          )}
        </button>
      </div>
    </div>
  );
};
