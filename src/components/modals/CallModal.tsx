import React, { useRef, useEffect, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Maximize2,
  Minimize2,
  Volume2
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const CallModal: React.FC = () => {
  const {
    currentCall,
    endCall,
    toggleCallMute,
    toggleCallVideo,
    toggleCallScreenShare,
    language,
  } = useChat();

  const isFa = language === 'fa';
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // Setup local camera video stream if video call
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (currentCall && currentCall.type === 'video' && !currentCall.isVideoOff) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
        .then(s => {
          stream = s;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = s;
          }
        })
        .catch(() => {
          // Camera permission denied or not available; fallback gracefully
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [currentCall?.type, currentCall?.isVideoOff]);

  if (!currentCall) return null;

  const durationMin = Math.floor(currentCall.durationSeconds / 60);
  const durationSec = currentCall.durationSeconds % 60;
  const timeFormatted = `${String(durationMin).padStart(2, '0')}:${String(durationSec).padStart(2, '0')}`;

  const isVideo = currentCall.type === 'video';

  return (
    <div
      className={`fixed z-50 transition-all select-none ${
        isMaximized
          ? 'inset-0 bg-slate-950 flex flex-col'
          : 'bottom-6 left-6 rtl:left-auto rtl:right-6 w-80 md:w-96 bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden'
      }`}
    >
      {/* Call Header */}
      <div className="p-3.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <h4 className="text-xs font-bold text-slate-100">
              {currentCall.recipient.name}
            </h4>
            <p className="text-[10px] text-slate-400">
              {currentCall.status === 'ringing'
                ? isFa ? 'در حال برقراری تماس...' : 'Calling...'
                : timeFormatted}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsMaximized(!isMaximized)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          title={isMaximized ? (isFa ? 'کوچک کردن' : 'Minimize') : (isFa ? 'بزرگ کردن' : 'Maximize')}
        >
          {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Screen Content */}
      <div className={`relative flex-1 flex items-center justify-center bg-slate-950 overflow-hidden ${isMaximized ? 'h-[75vh]' : 'h-64'}`}>
        {isVideo && !currentCall.isVideoOff ? (
          <>
            {/* Remote simulated video */}
            <div className="w-full h-full relative">
              <img
                src={currentCall.recipient.avatar}
                alt={currentCall.recipient.name}
                className="w-full h-full object-cover filter brightness-90"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>

            {/* Local webcam preview corner */}
            <div className="absolute top-4 right-4 w-24 h-32 md:w-32 md:h-44 bg-slate-800 rounded-2xl border-2 border-slate-700 overflow-hidden shadow-2xl">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            </div>
          </>
        ) : (
          /* Voice Call Avatar & Waveform Animation */
          <div className="flex flex-col items-center gap-4 p-6">
            <div className="relative">
              <img
                src={currentCall.recipient.avatar}
                alt={currentCall.recipient.name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-cyan-500/30 shadow-xl"
                referrerPolicy="no-referrer"
              />
              {currentCall.status === 'connected' && (
                <div className="absolute -inset-3 rounded-full border-2 border-cyan-400/40 animate-ping pointer-events-none" />
              )}
            </div>

            <div className="text-center">
              <h3 className="font-bold text-base text-slate-100">
                {currentCall.recipient.name}
              </h3>
              <p className="text-xs text-cyan-400 font-mono mt-1">
                {currentCall.status === 'connected'
                  ? isFa ? 'تماس صوتی باکیفیت بالا' : 'HD Voice Call'
                  : isFa ? 'در انتظار پاسخ...' : 'Ringing...'}
              </p>
            </div>

            {/* Audio Waves Simulation */}
            {currentCall.status === 'connected' && (
              <div className="flex items-center gap-1.5 h-8 mt-2">
                {[14, 28, 20, 32, 16, 26, 22, 30, 18, 24].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-cyan-400 rounded-full animate-pulse-wave"
                    style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Call Controls Footer */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-3">
        {/* Mute Mic */}
        <button
          onClick={toggleCallMute}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
            currentCall.isMuted
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title={currentCall.isMuted ? (isFa ? 'وصل میکروفون' : 'Unmute') : (isFa ? 'قطع میکروفون' : 'Mute')}
        >
          {currentCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Toggle */}
        {isVideo && (
          <button
            onClick={toggleCallVideo}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              currentCall.isVideoOff
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={currentCall.isVideoOff ? (isFa ? 'روشن کردن دوربین' : 'Turn on camera') : (isFa ? 'خاموش کردن دوربین' : 'Turn off camera')}
          >
            {currentCall.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        )}

        {/* Screen Share Toggle */}
        <button
          onClick={toggleCallScreenShare}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
            currentCall.isScreenSharing
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title={isFa ? 'اشتراک‌گذاری صفحه' : 'Share Screen'}
        >
          <Monitor className="w-5 h-5" />
        </button>

        {/* End Call Button */}
        <button
          onClick={endCall}
          className="w-12 h-11 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
          title={isFa ? 'پایان تماس' : 'End Call'}
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
