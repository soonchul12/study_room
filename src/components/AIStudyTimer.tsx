'use client';

import { useEffect, useRef, useState } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

export default function AIStudyTimer({ videoTrack }: { videoTrack: MediaStreamTrack | null }) {
  const [isStudying, setIsStudying] = useState(false);
  const [studyTime, setStudyTime] = useState(0);
  const [detector, setDetector] = useState<FaceDetector | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true); // 모델 로딩 상태 추가
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);

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

  // ⭐ 변경점: videoTrack이 없어도 UI를 렌더링해서 상태를 알려줍니다.
  return (
    <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 backdrop-blur-md shadow-xl w-64 transition-all duration-300">
      <video ref={videoRef} className="absolute opacity-0 pointer-events-none w-1 h-1" muted playsInline autoPlay />
      
      <div className="flex items-center gap-2 mb-1">
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

      <div className={`text-4xl font-black tabular-nums tracking-tight transition-colors duration-300 ${isStudying ? 'text-white' : 'text-slate-600'}`}>
        {formatTime(studyTime)}
      </div>

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
  );
}