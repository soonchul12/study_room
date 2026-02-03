'use client';

import { useEffect, useRef, useState } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

const STORAGE_KEY_TARGET = 'study_room_timer_target_minutes';

export default function AIStudyTimer({
  videoTrack,
  onShareToChat,
}: {
  videoTrack: MediaStreamTrack | null;
  onShareToChat?: (message: string) => void;
}) {
  const [isStudying, setIsStudying] = useState(false);
  const [studyTime, setStudyTime] = useState(0);
  const [detector, setDetector] = useState<FaceDetector | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [targetMinutes, setTargetMinutes] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const v = localStorage.getItem(STORAGE_KEY_TARGET);
    return v ? parseInt(v, 10) || null : null;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInput, setSettingsInput] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);

  useEffect(() => {
    if (targetMinutes != null && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_TARGET, String(targetMinutes));
    }
  }, [targetMinutes]);

  // 1. AI 모델 로딩
  useEffect(() => {
    const loadModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const faceDetector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
          minSuppressionThreshold: 0.5
        });
        setDetector(faceDetector);
        setIsModelLoading(false); // 로딩 완료
      } catch (error) {
        console.error("AI 모델 로딩 실패:", error);
        setIsModelLoading(false);
      }
    };
    loadModel();
  }, []);

  // 2. 비디오 연결
  useEffect(() => {
    if (videoTrack && videoRef.current) {
      const stream = new MediaStream([videoTrack]);
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("비디오 재생 실패:", e));
    } else {
      setIsStudying(false);
    }
  }, [videoTrack]);

  // 3. 감지 루프
  useEffect(() => {
    if (!detector || !videoRef.current || !videoTrack) return;

    const detect = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = videoRef.current.currentTime;
          const results = detector.detectForVideo(videoRef.current, performance.now());
          
          if (results.detections.length > 0) {
            setIsStudying(true);
          } else {
            setIsStudying(false);
          }
        }
      }
      animationRef.current = requestAnimationFrame(detect);
    };

    detect();
    return () => cancelAnimationFrame(animationRef.current);
  }, [detector, videoTrack]);

  // 4. 시간 측정
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStudying) {
      interval = setInterval(() => {
        setStudyTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStudying]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const formatTarget = (minutes: number) => {
    if (minutes < 60) return `${minutes}분`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return `${h}시간`;
    return `${h}시간 ${m}분`;
  };

  const handleShareToChat = () => {
    onShareToChat?.(`⏱ 지금까지 공부 시간: ${formatTime(studyTime)}`);
  };

  const handleSaveTarget = () => {
    const val = parseInt(settingsInput.trim(), 10);
    if (!Number.isNaN(val) && val > 0) {
      setTargetMinutes(val);
      setIsSettingsOpen(false);
      setSettingsInput('');
    } else {
      alert('1 이상의 숫자(분)를 입력해주세요.');
    }
  };

  return (
    <>
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 backdrop-blur-md shadow-xl w-64 transition-all duration-300">
        <video ref={videoRef} className="absolute opacity-0 pointer-events-none w-1 h-1" muted playsInline autoPlay />

        <div className="flex items-center justify-between w-full mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Focus Timer</span>
            {isStudying ? (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <span className={`h-2 w-2 rounded-full ${!videoTrack ? 'bg-slate-500' : 'bg-red-500 animate-pulse'}`}></span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleShareToChat}
              disabled={!onShareToChat}
              title="채팅에 현재 공부 시간 보내기"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              title="목표 공부 시간 설정"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
          </div>
        </div>

        <div className={`text-4xl font-black tabular-nums tracking-tight transition-colors duration-300 ${isStudying ? 'text-white' : 'text-slate-600'}`}>
          {formatTime(studyTime)}
        </div>

        {targetMinutes != null && (
          <div className="text-xs text-slate-500 font-medium">
            목표 {formatTarget(targetMinutes)}
          </div>
        )}

        <div className="text-xs font-medium text-center h-4">
          {isModelLoading ? (
            <span className="text-yellow-400">⚡ AI 로딩 중...</span>
          ) : !videoTrack ? (
            <span className="text-slate-500">📷 카메라를 켜주세요</span>
          ) : isStudying ? (
            <span className="text-emerald-400">🔥 열공 중!</span>
          ) : (
            <span className="text-red-400">👀 얼굴이 안 보여요!</span>
          )}
        </div>
      </div>

      {/* 목표 시간 설정 모달 */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}>
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">목표 공부 시간</h3>
            <p className="text-slate-400 text-sm mb-3">목표 시간(분)을 입력하세요. 타이머 박스에 작게 표시됩니다.</p>
            <input
              type="number"
              min={1}
              placeholder="예: 60"
              value={settingsInput}
              onChange={e => setSettingsInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveTarget()}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-blue-500"
            />
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => { setIsSettingsOpen(false); setSettingsInput(''); }}
                className="flex-1 py-2.5 rounded-xl text-slate-400 font-medium hover:bg-white/5"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveTarget}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500"
              >
                설정
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}