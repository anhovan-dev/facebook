export interface AppError {
  code: string;
  message: string;
  details?: string;
  troubleshooting?: string[];
}

export interface Violation {
  rule: string;
  explanation: string;
  severity: 'high' | 'medium' | 'low';
}

export interface LayoutSuggestion {
  name: string;
  description: string;
}

export interface ImageAnalysis {
  policyViolations: string[];
  layoutFeedback: string[];
  brandingFeedback: string[];
  layoutSuggestions?: LayoutSuggestion[];
}

export interface PolicyAnalysisResult {
  status: 'compliant' | 'non_compliant' | 'warning';
  summary: string;
  violations: Violation[];
  suggestions: string[];
  fixedContent: string;
  imageAnalysis?: ImageAnalysis;
  generatedImage?: string;
  lifestyleContent?: string;
}

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
}

export interface HistoryFile {
  name: string;
  dataUrl: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  summary: string;
  status: 'compliant' | 'non_compliant' | 'warning';
  result: PolicyAnalysisResult;
  originalFiles: HistoryFile[];
  originalContent: string;
  originalContentType: string;
  originalCheckType: string;
}

export interface ImageInput {
  data: string; // base64 encoded
  mimeType: string;
}

export interface ThemeGenerationResult {
  colors: { [key: string]: string };
  explanation: string;
}