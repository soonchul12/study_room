'use client';

import { useEffect, useState, use } from 'react';
import { 
  LiveKitRoom, 
  GridLayout, 
  ParticipantTile, 
  RoomAudioRenderer, 
  TrackToggle, 
  Chat, 
  DisconnectButton, 
  LayoutContextProvider, 
  useTracks, 
  useLocalParticipant 
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AIStudyTimer from '@/components/AIStudyTimer';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StudyRoomPage({ params }: PageProps) {
  const { id } = use(params); 
  const [token, setToken] = useState("");
  const [roomTitle, setRoomTitle] = useState("공부방");
  const router = useRouter();

  useEffect(() => {
    const initRoom = async () => {
      const { data } = await supabase.from('rooms').select('title').eq('id', id).single();
      if (data) setRoomTitle(data.title);

      const { data: userData } = await supabase.auth.getUser();
      const userName = userData.user?.user_metadata.full_name || "Guest";

      const resp = await fetch(`/api/get-token?room=${id}&username=${userName}`);
      const tokenData = await resp.json();
      setToken(tokenData.token);
    };
    initRoom();
  }, [id]);

  if (token === "") return (
    <div className="h-screen bg-[#020617] flex items-center justify-center text-white">Loading...</div>
  );

  return (
    <div className="h-screen bg-[#020617] flex flex-col overflow-hidden text-slate-200">
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        connect={true}
        data-lk-theme="default"
        className="flex-1 flex flex-col min-h-0"
        onDisconnected={() => router.push('/lobby')}
      >
        <StudyRoomContent roomTitle={roomTitle} />
      </LiveKitRoom>
    </div>
  );
}

function StudyRoomContent({ roomTitle }: { roomTitle: string }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // 상태 확인용 훅
  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();

  // ⭐ [핵심 수정] 카메라 트랙을 더 확실하게 가져오는 방법 (useTracks 사용)
  const videoTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  // 내 카메라 트랙 찾기
  const localVideoTrack = videoTracks.find(t => t.participant.isLocal)?.publication?.videoTrack?.mediaStreamTrack || null;

  // 버튼 설정
  const controls = [
    { source: Track.Source.Microphone, enabled: isMicrophoneEnabled, iconOn: <MicrophoneIcon />, iconOff: <MicrophoneOffIcon /> },
    { source: Track.Source.Camera, enabled: isCameraEnabled, iconOn: <CameraIcon />, iconOff: <CameraOffIcon /> },
    { source: Track.Source.ScreenShare, enabled: isScreenShareEnabled, iconOn: <ScreenShareIcon />, iconOff: <ScreenShareIcon /> }
  ];

  return (
    <LayoutContextProvider>
      {/* 상단바 */}
      <div className="h-14 border-b border-white/10 flex justify-between items-center px-6 bg-[#0f172a] shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <h2 className="font-bold text-sm tracking-wide text-slate-100">{roomTitle}</h2>
        </div>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("링크 복사 완료!");
          }}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-slate-400 hover:text-white border border-white/5 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          초대 링크
        </button>
      </div>

      {/* 메인 영역 */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col relative bg-black/40 transition-all">
            
            {/* ⭐ AI 타이머 (localVideoTrack을 전달합니다) */}
            <div className="absolute top-6 left-6 z-30 animate-in fade-in zoom-in duration-500">
              <AIStudyTimer videoTrack={localVideoTrack} />
            </div>

            <VideoGrid />
            
            {/* 하단 컨트롤바 */}
            <div className="h-24 flex items-center justify-center pointer-events-none absolute bottom-0 w-full z-20 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent">
              <div className="flex items-center gap-3 bg-[#1e293b]/90 p-3 rounded-full border border-white/10 shadow-2xl backdrop-blur-md pointer-events-auto origin-bottom">
                
                {controls.map((item, idx) => (
                  <TrackToggle 
                    key={idx}
                    source={item.source} 
                    className={`!border-none !rounded-full !p-3.5 transition-all active:scale-95 duration-200 ${
                      item.enabled 
                        ? '!bg-white !text-slate-900 shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                        : '!bg-white/5 !text-slate-400 hover:!bg-white/10 hover:!text-slate-200'
                    }`}
                    showIcon={false}
                  >
                    {item.enabled ? item.iconOn : item.iconOff}
                  </TrackToggle>
                ))}

                <div className="w-[1px] h-6 bg-white/10 mx-1"></div>

                <button 
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className={`p-3.5 rounded-full transition-all active:scale-95 ${
                    isChatOpen 
                      ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' 
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <ChatIcon />
                </button>

                <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
                
                <DisconnectButton className="!bg-red-500/10 hover:!bg-red-600 !text-red-500 hover:!text-white !border-none !rounded-full !p-3.5 transition-all active:scale-95">
                  <ExitIcon />
                </DisconnectButton>
              </div>
            </div>
        </div>

        {/* 채팅창 */}
        {isChatOpen && (
          <div className="w-[340px] border-l border-white/10 bg-[#0f172a] flex flex-col shrink-0 z-30 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-5 bg-[#1e293b]/30">
              <div className="flex items-center gap-2">
                <span className="text-blue-500 animate-pulse">●</span>
                <span className="text-[13px] font-bold text-slate-200 tracking-wide">실시간 채팅</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden relative">
                <Chat style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        )}
      </div>
      <RoomAudioRenderer />
    </LayoutContextProvider>
  );
}

function VideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, attach: true },
      { source: Track.Source.ScreenShare, attach: true },
    ],
    { onlySubscribed: false },
  );

  return (
    <div className="w-full h-full p-4 pb-24 overflow-hidden">
      <GridLayout tracks={tracks} style={{ height: '100%' }}>
        <ParticipantTile />
      </GridLayout>
    </div>
  );
}

const MicrophoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const MicrophoneOffIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const CameraOffIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><path d="M15.13 15.13A4 4 0 0 1 9.88 9.88"/></svg>;
const ScreenShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3"/><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><polyline points="17 8 22 3 17 3"/><line x1="22" y1="3" x2="15" y2="10"/></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const ExitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;