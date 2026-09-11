import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { UploadView } from './components/UploadView.tsx';
import { ConnectionView } from './components/ConnectionView.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './lib/firebase.ts';
import {
  GoogleUser,
  DriveQuota,
  BackupFolderInfo,
  UploadQueueItem,
  UploadHistoryItem,
  AppSettings,
} from './types.ts';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  folderName: 'Website Photo Backup',
  duplicateAction: 'rename',
  autoUpload: true,
  theme: 'light',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'connection' | 'history' | 'settings'>('upload');
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [quota, setQuota] = useState<DriveQuota | null>(null);
  const [folderInfo, setFolderInfo] = useState<BackupFolderInfo | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(false);
  const [isRefreshingDrive, setIsRefreshingDrive] = useState(false);

  // Settings state (persisted)
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('photo_backup_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // History state (persisted)
  const [history, setHistory] = useState<UploadHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('photo_backup_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load history:', e);
    }
    return [];
  });

  // Upload Queue
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const activeControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Confirm delete modal
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<UploadHistoryItem | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Sync dark mode class
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('photo_backup_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [settings]);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem('photo_backup_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  }, [history]);

  // Google Auth initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, token) => {
        setUser({
          uid: authUser.uid,
          displayName: authUser.displayName,
          email: authUser.email,
          photoURL: authUser.photoURL,
        });
        setIsConnected(true);
        fetchDriveDetails(token);
      },
      () => {
        setIsConnected(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Fetch Drive Storage Quota and Backup Folder
  const fetchDriveDetails = async (tokenOverride?: string) => {
    const token = tokenOverride || getAccessToken();
    if (!token) return;

    setIsLoadingQuota(true);
    try {
      // 1. Fetch quota & profile
      const quotaRes = await fetch('/api/drive/about', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (quotaRes.ok) {
        const data = await quotaRes.json();
        setQuota(data.quota);
        if (data.user) {
          setUser((prev) => ({
            uid: prev?.uid || 'google-user',
            displayName: data.user.displayName || prev?.displayName || null,
            email: data.user.emailAddress || prev?.email || null,
            photoURL: data.user.photoLink || prev?.photoURL || null,
          }));
        }
      }

      // 2. Fetch or create folder
      const folderRes = await fetch(`/api/drive/folder?folderName=${encodeURIComponent(settings.folderName)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (folderRes.ok) {
        const fData = await folderRes.json();
        setFolderInfo(fData.folder);
      }
    } catch (error) {
      console.error('Error fetching drive details:', error);
    } finally {
      setIsLoadingQuota(false);
    }
  };

  // Connect Google Drive
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser({
          uid: res.user.uid,
          displayName: res.user.displayName,
          email: res.user.email,
          photoURL: res.user.photoURL,
        });
        setIsConnected(true);
        showToast('Google Drive berhasil terhubung!', 'success');
        await fetchDriveDetails(res.accessToken);
      }
    } catch (error: any) {
      console.error('Sign-in error:', error);
      showToast(error.message || 'Gagal menghubungkan Google Drive', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Google Drive
  const handleDisconnect = async () => {
    try {
      await logout();
      setIsConnected(false);
      setUser(null);
      setQuota(null);
      setFolderInfo(null);
      showToast('Koneksi Google Drive telah diputus.', 'info');
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  // Toggle Theme
  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  // Files selected (via file input or drag-and-drop)
  const handleFilesSelected = (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    const validImageFiles = fileArray.filter(
      (f) => f.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|heic|svg)$/i.test(f.name)
    );

    if (validImageFiles.length === 0) {
      showToast('File yang dipilih bukan foto/gambar yang didukung.', 'error');
      return;
    }

    const newItems: UploadQueueItem[] = validImageFiles.map((file) => ({
      id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type || 'image/jpeg',
      status: 'idle',
      progress: 0,
      timestamp: Date.now(),
    }));

    setQueue((prev) => [...newItems, ...prev]);

    // If auto-upload is enabled, upload right away
    if (settings.autoUpload) {
      setTimeout(() => {
        newItems.forEach((item) => {
          uploadSingleItem(item);
        });
      }, 100);
    }
  };

  // Upload single item to Google Drive via backend
  const uploadSingleItem = async (item: UploadQueueItem) => {
    const token = getAccessToken();
    if (!token) {
      // Need connection
      showToast('Harap hubungkan akun Google Drive Anda terlebih dahulu.', 'error');
      setActiveTab('connection');
      setQueue((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: 'failed', error: 'Google Drive belum terhubung' } : i
        )
      );
      return;
    }

    // Set uploading state
    setQueue((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, status: 'uploading', progress: 15, error: undefined } : i
      )
    );

    const abortController = new AbortController();
    activeControllersRef.current.set(item.id, abortController);

    try {
      const formData = new FormData();
      formData.append('photo', item.file);
      formData.append('folderName', settings.folderName);
      formData.append('duplicateAction', settings.duplicateAction);

      // Simulate progress progression for smooth UX
      const progressInterval = setInterval(() => {
        setQueue((prev) =>
          prev.map((i) => {
            if (i.id === item.id && i.status === 'uploading' && i.progress < 88) {
              return { ...i, progress: i.progress + 12 };
            }
            return i;
          })
        );
      }, 250);

      const response = await fetch('/api/drive/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal: abortController.signal,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Gagal mengupload foto' }));
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const result = await response.json();
      const uploadedFile = result.file;

      // Update queue item
      setQueue((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'completed',
                progress: 100,
                driveFileId: uploadedFile?.id,
                driveViewLink: uploadedFile?.webViewLink,
              }
            : i
        )
      );

      // Add to history
      const historyEntry: UploadHistoryItem = {
        id: uploadedFile?.id || `hist_${Date.now()}`,
        name: uploadedFile?.name || item.name,
        size: uploadedFile?.size || item.size,
        mimeType: item.type,
        timestamp: Date.now(),
        status: 'completed',
        driveFileId: uploadedFile?.id,
        driveViewLink: uploadedFile?.webViewLink,
        thumbnailUrl: item.previewUrl,
        folderName: settings.folderName,
      };

      setHistory((prev) => [historyEntry, ...prev.filter((h) => h.id !== historyEntry.id)]);

      // Refresh storage quota asynchronously
      fetchDriveDetails();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setQueue((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'cancelled', progress: 0 } : i))
        );
      } else {
        console.error('Upload error for item:', item.name, error);
        setQueue((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'failed',
                  error: error.message || 'Terjadi kegagalan upload',
                }
              : i
          )
        );

        // Record failed entry in history
        const failedEntry: UploadHistoryItem = {
          id: `hist_fail_${Date.now()}`,
          name: item.name,
          size: item.size,
          mimeType: item.type,
          timestamp: Date.now(),
          status: 'failed',
          error: error.message || 'Gagal mengupload',
          thumbnailUrl: item.previewUrl,
          folderName: settings.folderName,
        };
        setHistory((prev) => [failedEntry, ...prev]);
      }
    } finally {
      activeControllersRef.current.delete(item.id);
    }
  };

  // Start upload for all pending / failed items
  const handleStartUploadAll = () => {
    const pendingItems = queue.filter((i) => i.status === 'idle' || i.status === 'failed');
    if (pendingItems.length === 0) return;

    pendingItems.forEach((item) => {
      uploadSingleItem(item);
    });
  };

  // Cancel active upload
  const handleCancelUpload = (id: string) => {
    const controller = activeControllersRef.current.get(id);
    if (controller) {
      controller.abort();
      activeControllersRef.current.delete(id);
    }
  };

  // Retry failed upload
  const handleRetryUpload = (id: string) => {
    const item = queue.find((i) => i.id === id);
    if (item) {
      uploadSingleItem(item);
    }
  };

  // Remove single item from queue
  const handleRemoveItem = (id: string) => {
    handleCancelUpload(id);
    setQueue((prev) => prev.filter((i) => i.id !== id));
  };

  // Clear completed items from queue
  const handleClearCompleted = () => {
    setQueue((prev) => prev.filter((i) => i.status !== 'completed'));
  };

  // Sync history live from Google Drive folder
  const handleRefreshDriveFiles = async () => {
    const token = getAccessToken();
    if (!token) {
      showToast('Harap hubungkan Google Drive terlebih dahulu.', 'error');
      return;
    }

    setIsRefreshingDrive(true);
    try {
      const res = await fetch(`/api/drive/files?folderName=${encodeURIComponent(settings.folderName)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Gagal mengambil daftar file dari Google Drive');
      }

      const data = await res.json();
      const driveFiles = data.files || [];

      // Merge Drive files with existing history
      const mappedDriveItems: UploadHistoryItem[] = driveFiles.map((df: any) => ({
        id: df.id,
        name: df.name,
        size: df.size || 0,
        mimeType: df.mimeType || 'image/jpeg',
        timestamp: df.createdTime ? new Date(df.createdTime).getTime() : Date.now(),
        status: 'completed',
        driveFileId: df.id,
        driveViewLink: df.webViewLink,
        thumbnailUrl: df.thumbnailLink || undefined,
        folderName: settings.folderName,
      }));

      // Combine ensuring no duplicates by id or driveFileId
      const existingNonDrive = history.filter(
        (h) => !mappedDriveItems.some((m) => m.driveFileId === h.driveFileId)
      );

      const merged = [...mappedDriveItems, ...existingNonDrive].sort((a, b) => b.timestamp - a.timestamp);
      setHistory(merged);
      showToast(`Berhasil menyinkronkan ${mappedDriveItems.length} foto dari Google Drive!`, 'success');
    } catch (error: any) {
      console.error('Error syncing Drive files:', error);
      showToast(error.message || 'Gagal sinkronisasi Google Drive', 'error');
    } finally {
      setIsRefreshingDrive(false);
    }
  };

  // Prompt delete file (Destructive action with confirmation)
  const promptDeleteItem = (item: UploadHistoryItem) => {
    setDeleteConfirmItem(item);
  };

  // Execute delete after confirmation
  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    const itemToDelete = deleteConfirmItem;
    setDeleteConfirmItem(null);

    const token = getAccessToken();
    if (itemToDelete.driveFileId && token) {
      try {
        const res = await fetch(`/api/drive/files/${itemToDelete.driveFileId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error('Gagal menghapus file di Google Drive.');
        }
        showToast(`File "${itemToDelete.name}" berhasil dihapus dari Google Drive.`, 'success');
      } catch (error: any) {
        showToast(error.message || 'Gagal menghapus file di Google Drive', 'error');
      }
    }

    setHistory((prev) => prev.filter((i) => i.id !== itemToDelete.id));
    fetchDriveDetails();
  };

  const isUploadingAny = queue.some((i) => i.status === 'uploading');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans selection:bg-blue-500/20">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        isConnected={isConnected}
        folderName={settings.folderName}
        theme={settings.theme}
        toggleTheme={toggleTheme}
        onConnectClick={handleConnect}
        onDisconnectClick={handleDisconnect}
        isConnecting={isConnecting}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'upload' && (
          <UploadView
            queue={queue}
            setQueue={setQueue}
            isConnected={isConnected}
            user={user}
            settings={settings}
            onConnectGoogleDrive={handleConnect}
            onStartUploadAll={handleStartUploadAll}
            onCancelUpload={handleCancelUpload}
            onRetryUpload={handleRetryUpload}
            onRemoveItem={handleRemoveItem}
            onClearCompleted={handleClearCompleted}
            isUploadingAny={isUploadingAny}
            onFilesSelected={handleFilesSelected}
          />
        )}

        {activeTab === 'connection' && (
          <ConnectionView
            user={user}
            isConnected={isConnected}
            isConnecting={isConnecting}
            quota={quota}
            folderInfo={folderInfo}
            folderName={settings.folderName}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onRefreshDriveInfo={() => fetchDriveDetails()}
            isLoadingQuota={isLoadingQuota}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            history={history}
            isConnected={isConnected}
            folderName={settings.folderName}
            onRefreshDriveFiles={handleRefreshDriveFiles}
            isRefreshing={isRefreshingDrive}
            onDeleteItem={promptDeleteItem}
            onClearHistory={() => {
              setHistory([]);
              showToast('Riwayat tampilan lokal berhasil dibersihkan.', 'info');
            }}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={(newSettings) => {
              setSettings(newSettings);
              showToast('Pengaturan berhasil diperbarui.', 'success');
              if (isConnected) {
                fetchDriveDetails();
              }
            }}
            toggleTheme={toggleTheme}
            onClearLocalHistory={() => {
              setHistory([]);
              showToast('Cache riwayat lokal telah dikosongkan.', 'info');
            }}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div
          id="global-toast-notification"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm animate-slide-up"
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}

          <p className="text-slate-800 dark:text-slate-200 font-medium">{toast.text}</p>

          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation Modal for Destructive Delete */}
      <ConfirmModal
        isOpen={deleteConfirmItem !== null}
        title="Hapus Foto dari Google Drive?"
        message={`Apakah Anda yakin ingin menghapus "${deleteConfirmItem?.name}"? Tindakan ini akan menghapus file dari Google Drive dan tidak dapat dibatalkan.`}
        confirmLabel="Hapus Permanen"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmItem(null)}
      />

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 py-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs mt-auto text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>&copy; {new Date().getFullYear()} Google Drive Photo Backup &bull; Full-Stack Application</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Official Google Drive API v3</span>
            <span>&bull;</span>
            <span>Firebase OAuth 2.0</span>
            <span>&bull;</span>
            <span>Zero Server File Retention</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
