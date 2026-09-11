import React from 'react';
import {
  HardDrive,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Folder,
  Shield,
  RefreshCw,
  LogOut,
  FolderOpen,
  PieChart,
} from 'lucide-react';
import { GoogleUser, DriveQuota, BackupFolderInfo } from '../types.ts';

interface ConnectionViewProps {
  user: GoogleUser | null;
  isConnected: boolean;
  isConnecting: boolean;
  quota: DriveQuota | null;
  folderInfo: BackupFolderInfo | null;
  folderName: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onRefreshDriveInfo: () => void;
  isLoadingQuota: boolean;
}

export const ConnectionView: React.FC<ConnectionViewProps> = ({
  user,
  isConnected,
  isConnecting,
  quota,
  folderInfo,
  folderName,
  onConnect,
  onDisconnect,
  onRefreshDriveInfo,
  isLoadingQuota,
}) => {
  return (
    <div id="connection-view-container" className="space-y-6 max-w-4xl mx-auto">
      {/* Account Connection Status Card */}
      <div
        id="account-status-card"
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            {isConnected && user ? (
              user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google Profile'}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/20 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-xs shrink-0">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'G'}
                </div>
              )
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center shadow-xs shrink-0">
                <HardDrive className="w-8 h-8" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isConnected && user ? user.displayName || 'Akun Google Terhubung' : 'Google Drive Belum Terhubung'}
                </h2>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Status: Connected</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Status: Disconnected</span>
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isConnected && user
                  ? user.email
                  : 'Hubungkan Google Drive Anda untuk mulai mencadangkan foto secara otomatis.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isConnected ? (
              <>
                <button
                  id="refresh-drive-info-btn"
                  type="button"
                  onClick={onRefreshDriveInfo}
                  disabled={isLoadingQuota}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  title="Perbarui Data Storage"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingQuota ? 'animate-spin' : ''}`} />
                </button>

                <button
                  id="disconnect-drive-btn"
                  type="button"
                  onClick={onDisconnect}
                  className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <button
                id="connect-drive-primary-btn"
                type="button"
                onClick={onConnect}
                disabled={isConnecting}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-60"
              >
                <HardDrive className="w-4 h-4" />
                <span>{isConnecting ? 'Menghubungkan...' : 'Connect Google Drive'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Storage Quota Card */}
      {isConnected && quota && (
        <div
          id="storage-quota-card"
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xs"
        >
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <PieChart className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Kapasitas Penyimpanan Google Drive
              </h3>
            </div>

            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {quota.percentUsed}% Terpakai
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                quota.percentUsed > 90
                  ? 'bg-rose-600'
                  : quota.percentUsed > 75
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${Math.max(2, quota.percentUsed)}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Terpakai: {quota.usageFormatted}</span>
            <span>Total: {quota.limitFormatted}</span>
          </div>
        </div>
      )}

      {/* Target Backup Folder Card */}
      <div
        id="backup-folder-card"
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <FolderOpen className="w-6 h-6" />
            </div>

            <div>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Folder Khusus Pencadangan
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {folderInfo ? folderInfo.name : folderName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Semua foto yang diupload otomatis tersimpan dan dikelompokkan ke dalam folder ini di Google Drive Anda.
              </p>
            </div>
          </div>

          {folderInfo?.webViewLink && (
            <a
              id="open-drive-folder-link"
              href={folderInfo.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>Buka di Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Security & Scopes Information */}
      <div
        id="security-info-card"
        className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-5 text-xs text-slate-600 dark:text-slate-400 space-y-2"
      >
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
          <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Keamanan & Izin Minimal (Least Privilege)</span>
        </div>
        <p className="leading-relaxed">
          Aplikasi ini menggunakan cakupan izin Google Drive resmi{' '}
          <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-blue-700 dark:text-blue-300 font-mono">
            https://www.googleapis.com/auth/drive.file
          </code>
          . Aplikasi hanya memiliki akses terhadap file dan folder yang dibuat melalui website ini. File pribadi Anda lainnya di Google Drive tetap aman dan tidak dapat diakses.
        </p>
      </div>
    </div>
  );
};
