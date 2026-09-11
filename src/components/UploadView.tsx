import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  ExternalLink,
  Folder,
  Trash2,
  Play,
  StopCircle,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';
import { UploadQueueItem, AppSettings, GoogleUser } from '../types.ts';

interface UploadViewProps {
  queue: UploadQueueItem[];
  setQueue: React.Dispatch<React.SetStateAction<UploadQueueItem[]>>;
  isConnected: boolean;
  user: GoogleUser | null;
  settings: AppSettings;
  onConnectGoogleDrive: () => void;
  onStartUploadAll: () => void;
  onCancelUpload: (id: string) => void;
  onRetryUpload: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClearCompleted: () => void;
  isUploadingAny: boolean;
  onFilesSelected: (files: FileList | File[]) => void;
}

export const UploadView: React.FC<UploadViewProps> = ({
  queue,
  setQueue,
  isConnected,
  user,
  settings,
  onConnectGoogleDrive,
  onStartUploadAll,
  onCancelUpload,
  onRetryUpload,
  onRemoveItem,
  onClearCompleted,
  isUploadingAny,
  onFilesSelected,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      // Reset input value so same files can be selected again if needed
      e.target.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const completedCount = queue.filter((i) => i.status === 'completed').length;
  const failedCount = queue.filter((i) => i.status === 'failed').length;
  const inProgressCount = queue.filter((i) => i.status === 'uploading').length;
  const pendingCount = queue.filter((i) => i.status === 'idle').length;

  return (
    <div id="upload-view-container" className="space-y-6 max-w-5xl mx-auto">
      {/* Alert banner if Google Drive is not connected yet */}
      {!isConnected && (
        <div
          id="connect-drive-prompt-card"
          className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 rounded-2xl p-5 shadow-xs transition-colors"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-amber-900 dark:text-amber-200">
                  Google Drive Belum Terhubung
                </h3>
                <p className="text-sm text-amber-800/90 dark:text-amber-300/80 mt-0.5">
                  Hubungkan akun Google Anda untuk menyimpan dan membuat folder otomatis{' '}
                  <span className="font-semibold underline">"{settings.folderName}"</span> di
                  Google Drive Anda.
                </p>
              </div>
            </div>

            <button
              id="prompt-connect-drive-btn"
              type="button"
              onClick={onConnectGoogleDrive}
              className="w-full sm:w-auto shrink-0 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Connect Google Drive</span>
            </button>
          </div>
        </div>
      )}

      {/* Target Folder & Mode Indicator Banner */}
      <div
        id="folder-info-strip"
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 px-5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-sm"
      >
        <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Folder Tujuan Google Drive
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {settings.folderName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
            <span>Duplikat:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              {settings.duplicateAction}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
            <span>Auto-Upload:</span>
            <span
              className={`font-semibold ${
                settings.autoUpload
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {settings.autoUpload ? 'Aktif' : 'Manual'}
            </span>
          </div>
        </div>
      </div>

      {/* Central Large Drag & Drop Upload Zone */}
      <div
        id="drag-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all bg-white dark:bg-slate-800 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[1.008]'
            : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500/70 hover:bg-slate-50/70 dark:hover:bg-slate-800/80'
        } shadow-xs`}
      >
        <input
          ref={fileInputRef}
          id="photo-file-input"
          type="file"
          accept="image/*,.heic,.heif,.svg"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />

        <div className="flex flex-col items-center justify-center max-w-md mx-auto pointer-events-none">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-transform ${
              isDragOver
                ? 'bg-blue-600 text-white scale-110'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-105'
            }`}
          >
            <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <h2 className="mt-4 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Pilih atau Tarik Foto ke Sini
          </h2>

          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Dapat memilih banyak foto sekaligus (Multiple upload). Format JPEG, PNG, WEBP, HEIC, GIF.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              id="browse-files-button"
              type="button"
              className="px-6 py-2.5 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Pilih Foto dari Perangkat</span>
            </button>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Maksimal ukuran 50 MB per foto &bull; Langsung tersimpan di Google Drive</span>
          </div>
        </div>
      </div>

      {/* Queue & Status Area */}
      {queue.length > 0 && (
        <div
          id="upload-queue-section"
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs space-y-4"
        >
          {/* Header & Batch Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Daftar Foto Dipilih</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {queue.length}
                </span>
              </h3>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                {completedCount > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ {completedCount} Berhasil
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="text-rose-600 dark:text-rose-400 font-medium">
                    ✗ {failedCount} Gagal
                  </span>
                )}
                {inProgressCount > 0 && (
                  <span className="text-blue-600 dark:text-blue-400 font-medium animate-pulse">
                    ⟳ {inProgressCount} Mengupload...
                  </span>
                )}
                {pendingCount > 0 && <span>{pendingCount} Menunggu</span>}
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
              {completedCount > 0 && (
                <button
                  id="clear-completed-btn"
                  onClick={onClearCompleted}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Bersihkan yang Selesai</span>
                </button>
              )}

              {pendingCount > 0 && !isUploadingAny && (
                <button
                  id="start-upload-all-btn"
                  onClick={onStartUploadAll}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Upload Semua Foto</span>
                </button>
              )}

              <button
                id="clear-all-queue-btn"
                onClick={() => setQueue([])}
                className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua</span>
              </button>
            </div>
          </div>

          {/* Queue Item List */}
          <div id="queue-items-grid" className="space-y-3">
            {queue.map((item) => (
              <div
                key={item.id}
                id={`queue-item-${item.id}`}
                className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  {/* Thumbnail Preview */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-600 relative">
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Metadata and progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="min-w-0 pr-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatFileSize(item.size)}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0 flex items-center gap-2">
                        {item.status === 'idle' && (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            Menunggu
                          </span>
                        )}

                        {item.status === 'uploading' && (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 flex items-center gap-1.5 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                            <span>Mengupload ({Math.round(item.progress)}%)</span>
                          </span>
                        )}

                        {item.status === 'completed' && (
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Berhasil Tersimpan</span>
                            </span>
                            {item.driveViewLink && (
                              <a
                                href={item.driveViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                              >
                                <span>Buka</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}

                        {item.status === 'failed' && (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Gagal</span>
                          </span>
                        )}

                        {item.status === 'cancelled' && (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                            Dibatalkan
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {item.status === 'uploading' && (
                      <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Error message */}
                    {item.status === 'failed' && item.error && (
                      <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                        {item.error}
                      </p>
                    )}
                  </div>

                  {/* Actions (Cancel, Retry, Remove) */}
                  <div className="flex items-center gap-1 shrink-0">
                    {item.status === 'uploading' && (
                      <button
                        id={`cancel-upload-${item.id}`}
                        onClick={() => onCancelUpload(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Batalkan Upload"
                      >
                        <StopCircle className="w-4 h-4" />
                      </button>
                    )}

                    {item.status === 'failed' && (
                      <button
                        id={`retry-upload-${item.id}`}
                        onClick={() => onRetryUpload(item.id)}
                        className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors flex items-center gap-1 text-xs font-semibold"
                        title="Coba Upload Lagi"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span className="hidden sm:inline">Retry</span>
                      </button>
                    )}

                    {item.status !== 'uploading' && (
                      <button
                        id={`remove-item-${item.id}`}
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Hapus dari daftar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
