export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type EnhancementType = 'upscale' | 'face-restore' | 'sharpen' | 'denoise' | 'background-remove' | 'compress' | 'convert' | 'color-restore' | 'artifact-remove' | 'text-enhance' | 'low-light';

export interface UpscaleSettings {
  scale: 2 | 4 | 8;
  model: 'real-esrgan' | 'swinir';
  faceEnhance: boolean;
}

export interface FaceRestoreSettings {
  model: 'gfpgan' | 'codeformer';
  fidelity: number;
  backgroundEnhance: boolean;
  upscale: number;
}

export interface SharpenSettings {
  strength: number;
}

export interface DenoiseSettings {
  strength: number;
}

export interface BackgroundRemoveSettings {
  returnMask: boolean;
  alphaMatting: boolean;
}

export interface CompressSettings {
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
}

export interface ConvertSettings {
  format: 'jpeg' | 'png' | 'webp';
  quality: number;
}

export interface JobSettings {
  type: EnhancementType;
  upscale?: UpscaleSettings;
  faceRestore?: FaceRestoreSettings;
  sharpen?: SharpenSettings;
  denoise?: DenoiseSettings;
  backgroundRemove?: BackgroundRemoveSettings;
  compress?: CompressSettings;
  convert?: ConvertSettings;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  exif?: Record<string, unknown>;
  channels?: number;
  hasAlpha?: boolean;
  density?: number;
}

export interface JobResponse {
  id: string;
  status: JobStatus;
  imageId: string;
  type: EnhancementType;
  outputUrl?: string;
  outputPath?: string;
  errorMessage?: string;
  processingTime?: number;
  outputWidth?: number;
  outputHeight?: number;
  outputSize?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadResponse {
  id: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  format?: string;
  url: string;
  createdAt: Date;
}

export interface HistoryItem {
  id: string;
  imageId: string;
  jobId: string;
  enhancement: string;
  settings?: JobSettings;
  originalSize?: number;
  finalSize?: number;
  processingTime?: number;
  outputPath?: string;
  originalImage: {
    id: string;
    originalName: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    width?: number;
    height?: number;
  };
  outputUrl?: string;
  createdAt: Date;
  isFavorite?: boolean;
}

export interface DashboardStats {
  totalProcessed: number;
  avgProcessingTime: number;
  storageUsed: number;
  successRate: number;
  failedJobs: number;
  activeJobs: number;
  processingHistory: Array<{ date: string; count: number; avgTime: number }>;
}

export interface BatchJobRequest {
  imageIds: string[];
  enhancement: EnhancementType;
  settings: JobSettings;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}
