import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  ArrowUpDown,
  ExternalLink,
  Trash2,
  RefreshCw,
  FileImage,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Filter,
} from 'lucide-react';
import { UploadHistoryItem } from '../types.ts';

interface HistoryViewProps {
  history: UploadHistoryItem[];
  isConnected: boolean;
  folderName: string;
  onRefreshDriveFiles: () => void;
  isRefreshing: boolean;
  onDeleteItem: (item: UploadHistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  isConnected,
  folderName,
  onRefreshDriveFiles,
  isRefreshing,
  onDeleteItem,
  onClearHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc'>('newest');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed'>('all');

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const filteredAndSortedHistory = useMemo(() => {
    return history
      .filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
          statusFilter === 'all' ? true : item.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOption === 'newest') return b.timestamp - a.timestamp;
        if (sortOption === 'oldest') return a.timestamp - b.timestamp;
        if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
        if (sortOption === 'name-desc') return b.name.localeCompare(a.name);
        if (sortOption === 'size-desc') return (b.size || 0) - (a.size || 0);
        if (sortOption === 'size-asc') return (a.size || 0) - (b.size || 0);
        return 0;
      });
  }, [history, searchQuery, sortOption, statusFilter]);

  return (
    <div id="history-view-container" className="space-y-6 max-w-5xl mx-auto">
      {/* Search, Filter, and Action Bar */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-history-input"
              type="text"
              placeholder="Cari foto berdasarkan nama file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-700 dark:text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                id="sort-history-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="bg-transparent focus:outline-hidden text-xs font-medium cursor-pointer"
              >
                <option value="newest" className="dark:bg-slate-800">Waktu: Terbaru</option>
                <option value="oldest" className="dark:bg-slate-800">Waktu: Terlama</option>
                <option value="name-asc" className="dark:bg-slate-800">Nama: A - Z</option>
                <option value="name-desc" className="dark:bg-slate-800">Nama: Z - A</option>
                <option value="size-desc" className="dark:bg-slate-800">Ukuran Terbesar</option>
                <option value="size-asc" className="dark:bg-slate-800">Ukuran Terkecil</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-700 dark:text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                id="status-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent focus:outline-hidden text-xs font-medium cursor-pointer"
              >
                <option value="all" className="dark:bg-slate-800">Semua Status</option>
                <option value="completed" className="dark:bg-slate-800">Berhasil</option>
                <option value="failed" className="dark:bg-slate-800">Gagal</option>
              </select>
            </div>

            {/* Sync with Google Drive button */}
            {isConnected && (
              <button
                id="sync-drive-history-btn"
                type="button"
                onClick={onRefreshDriveFiles}
                disabled={isRefreshing}
                className="px-3.5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors flex items-center gap-1.5"
                title="Sinkronkan live data dari folder Google Drive"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Sinkron Drive</span>
              </button>
            )}

            {history.length > 0 && (
              <button
                id="clear-all-history-btn"
                type="button"
                onClick={onClearHistory}
                className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Bersihkan riwayat tampilan lokal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Counter Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span>Menampilkan {filteredAndSortedHistory.length} dari {history.length} foto tercatat</span>
          <span>Folder: <span className="font-semibold text-slate-700 dark:text-slate-300">{folderName}</span></span>
        </div>
      </div>

      {/* History Items Grid / List */}
      {filteredAndSortedHistory.length === 0 ? (
        <div
          id="empty-history-state"
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center shadow-xs"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700/60 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <FileImage className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Belum Ada Riwayat Upload
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Tidak ditemukan foto yang cocok dengan pencarian Anda.'
              : 'Foto yang Anda upload akan tercatat di sini dan tersimpan langsung di Google Drive Anda.'}
          </p>
        </div>
      ) : (
        <div id="history-items-list" className="space-y-3">
          {filteredAndSortedHistory.map((item) => (
            <div
              key={item.id}
              id={`history-row-${item.id}`}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Thumbnail / Icon */}
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileImage className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                    <span>{formatFileSize(item.size)}</span>
                    <span>&bull;</span>
                    <span>{formatDate(item.timestamp)}</span>
                    <span>&bull;</span>
                    <span className="text-slate-400 truncate max-w-[120px]">{item.folderName}</span>
                  </div>
                </div>
              </div>

              {/* Status & Action */}
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {item.status === 'completed' && (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Berhasil</span>
                  </span>
                )}

                {item.status === 'failed' && (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1" title={item.error}>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Gagal</span>
                  </span>
                )}

                {item.driveViewLink && (
                  <a
                    id={`open-drive-file-${item.id}`}
                    href={item.driveViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <span>Google Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <button
                  id={`delete-history-btn-${item.id}`}
                  onClick={() => onDeleteItem(item)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Hapus foto ini (Meminta konfirmasi)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
