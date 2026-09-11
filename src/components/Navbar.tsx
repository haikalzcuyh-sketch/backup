import React from 'react';
import {
  CloudUpload,
  HardDrive,
  History,
  Settings,
  Moon,
  Sun,
  CheckCircle2,
  AlertCircle,
  LogOut,
  FolderSync,
} from 'lucide-react';
import { GoogleUser } from '../types.ts';

interface NavbarProps {
  activeTab: 'upload' | 'connection' | 'history' | 'settings';
  setActiveTab: (tab: 'upload' | 'connection' | 'history' | 'settings') => void;
  user: GoogleUser | null;
  isConnected: boolean;
  folderName: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onConnectClick: () => void;
  onDisconnectClick: () => void;
  isConnecting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  isConnected,
  folderName,
  theme,
  toggleTheme,
  onConnectClick,
  onDisconnectClick,
  isConnecting,
}) => {
  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="brand-logo-button"
              onClick={() => setActiveTab('upload')}
              className="flex items-center gap-3 text-left focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <CloudUpload className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    Drive Photo Backup
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-md border border-blue-200/60 dark:border-blue-800">
                    Full-Stack
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate max-w-[200px]">
                  Folder: {folderName}
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav
            id="navbar-tabs-container"
            className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60"
          >
            <button
              id="tab-upload-btn"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CloudUpload className="w-4 h-4" />
              <span>Upload Foto</span>
            </button>

            <button
              id="tab-connection-btn"
              onClick={() => setActiveTab('connection')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'connection'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Koneksi Google Drive</span>
              {isConnected ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Terhubung" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500" title="Belum Terhubung" />
              )}
            </button>

            <button
              id="tab-history-btn"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Riwayat Upload</span>
            </button>

            <button
              id="tab-settings-btn"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Pengaturan</span>
            </button>
          </nav>

          {/* Right Action: Auth / Status & Dark Mode */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              id="theme-toggle-button"
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Google Drive Status & User Profile */}
            {isConnected && user ? (
              <div
                id="user-connected-pill"
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google User'}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border border-white dark:border-slate-600"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'G'}
                    </div>
                  )}
                  <div className="hidden lg:block text-left pr-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[120px]">
                      {user.displayName || 'Google User'}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Connected
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  id="nav-disconnect-btn"
                  onClick={onDisconnectClick}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors"
                  title="Disconnect Google Drive"
                  aria-label="Disconnect Google Drive"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="nav-connect-drive-btn"
                type="button"
                onClick={onConnectClick}
                disabled={isConnecting}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all disabled:opacity-60"
              >
                <FolderSync className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
                <span>{isConnecting ? 'Menghubungkan...' : 'Connect Google Drive'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
          <button
            id="mobile-tab-upload-btn"
            onClick={() => setActiveTab('upload')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium ${
              activeTab === 'upload'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <CloudUpload className="w-5 h-5" />
            <span>Upload</span>
          </button>

          <button
            id="mobile-tab-connection-btn"
            onClick={() => setActiveTab('connection')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium ${
              activeTab === 'connection'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <HardDrive className="w-5 h-5" />
            <span>Koneksi</span>
          </button>

          <button
            id="mobile-tab-history-btn"
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium ${
              activeTab === 'history'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <History className="w-5 h-5" />
            <span>Riwayat</span>
          </button>

          <button
            id="mobile-tab-settings-btn"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium ${
              activeTab === 'settings'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Pengaturan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
