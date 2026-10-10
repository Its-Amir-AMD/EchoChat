import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface MediaViewerModalProps {
  url: string | null;
  onClose: () => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({ url, onClose }) => {
  if (!url) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl select-none">
      <div className="absolute inset-0" onClick={onClose} />

      {/* Controls Bar */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white flex items-center gap-1.5 text-xs font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          <span>باز کردن اصلی</span>
        </a>

        <div className="flex items-center gap-2">
          <a
            href={url}
            download="echochat_media.jpg"
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white"
            title="دانلود"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image Preview */}
      <div className="relative max-w-4xl max-h-[85vh] z-10">
        <img
          src={url}
          alt="Preview"
          className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};
