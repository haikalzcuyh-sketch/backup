export interface GoogleUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface DriveQuota {
  limit: number;
  usage: number;
  usageInDrive: number;
  usageInDriveTrash: number;
  usageFormatted: string;
  limitFormatted: string;
  percentUsed: number;
}

export interface BackupFolderInfo {
  id: string;
  name: string;
  webViewLink?: string;
  createdTime?: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  status?: 'completed' | 'uploading' | 'failed';
}

export interface UploadQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  type: string;
  status: 'idle' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  error?: string;
  driveFileId?: string;
  driveViewLink?: string;
  timestamp: number;
}

export interface UploadHistoryItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  timestamp: number;
  status: 'completed' | 'failed' | 'cancelled';
  driveFileId?: string;
  driveViewLink?: string;
  thumbnailUrl?: string;
  error?: string;
  folderName: string;
}

export interface AppSettings {
  folderName: string;
  duplicateAction: 'rename' | 'overwrite' | 'skip';
  autoUpload: boolean;
  theme: 'light' | 'dark';
}
