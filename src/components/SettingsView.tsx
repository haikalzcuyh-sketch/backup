import React, { useState } from 'react';
import {
  Settings,
  Folder,
  Copy,
  Zap,
  Moon,
  Sun,
  Shield,
  Save,
  Check,
  Info,
  HelpCircle,
} from 'lucide-react';
import { AppSettings } from '../types.ts';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  toggleTheme: () => void;
  onClearLocalHistory: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  toggleTheme,
  onClearLocalHistory,
}) => {
  const [folderName, setFolderName] = useState(settings.folderName);
  const [duplicateAction, setDuplicateAction] = useState(settings.duplicateAction);
  const [autoUpload, setAutoUpload] = useState(settings.autoUpload);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      folderName: folderName.trim() || 'Website Photo Backup',
      duplicateAction,
      autoUpload,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div id="settings-view-container" className="space-y-6 max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Backup Destination Settings */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Folder Backup Google Drive
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tentukan nama folder di Google Drive tempat semua foto Anda akan disimpan.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="settings-folder-input"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
            >
              Nama Folder Google Drive
            </label>
            <input
              id="settings-folder-input"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Contoh: Website Photo Backup"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Jika folder belum ada di Google Drive, sistem akan otomatis membuatnya saat Anda mengunggah foto.
            </p>
          </div>
        </div>

        {/* Duplicate Handling & Auto-upload */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Penanganan File Duplikat
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih aksi yang dilakukan jika file dengan nama yang sama sudah ada di folder Google Drive.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                duplicateAction === 'rename'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Rename Otomatis</span>
                <input
                  type="radio"
                  name="duplicateAction"
                  value="rename"
                  checked={duplicateAction === 'rename'}
                  onChange={() => setDuplicateAction('rename')}
                  className="accent-blue-600"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Menambahkan timestamp unik pada nama file agar kedua foto tetap tersimpan.
              </p>
            </label>

            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                duplicateAction === 'overwrite'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Overwrite (Timpa)</span>
                <input
                  type="radio"
                  name="duplicateAction"
                  value="overwrite"
                  checked={duplicateAction === 'overwrite'}
                  onChange={() => setDuplicateAction('overwrite')}
                  className="accent-blue-600"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Memperbarui isi file yang sudah ada di Google Drive dengan foto terbaru.
              </p>
            </label>

            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                duplicateAction === 'skip'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Skip (Lewati)</span>
                <input
                  type="radio"
                  name="duplicateAction"
                  value="skip"
                  checked={duplicateAction === 'skip'}
                  onChange={() => setDuplicateAction('skip')}
                  className="accent-blue-600"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mengabaikan proses upload jika file sudah pernah dicadangkan sebelumnya.
              </p>
            </label>
          </div>

          {/* Auto Upload Toggle */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Auto-Upload Saat File Dipilih
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Langsung mulai upload ke Google Drive segera setelah foto dipilih atau di-drop.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                id="auto-upload-checkbox"
                type="checkbox"
                checked={autoUpload}
                onChange={(e) => setAutoUpload(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Appearance & Preferences */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {settings.theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Mode Gelap (Dark Mode)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ubah tema tampilan antara mode terang dan gelap.
                </p>
              </div>
            </div>

            <button
              id="settings-theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {settings.theme === 'dark' ? 'Aktif (Gelap)' : 'Non-aktif (Terang)'}
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Bersihkan Cache Riwayat Lokal
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Menghapus catatan riwayat di browser ini (foto di Google Drive tidak akan terhapus).
              </p>
            </div>

            <button
              id="clear-local-history-btn"
              type="button"
              onClick={onClearLocalHistory}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors shrink-0"
            >
              Hapus Cache
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isSaved && (
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fade-in">
              <Check className="w-4 h-4" />
              <span>Pengaturan Berhasil Disimpan!</span>
            </span>
          )}

          <button
            id="save-settings-btn"
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
