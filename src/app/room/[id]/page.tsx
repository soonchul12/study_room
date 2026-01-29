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
  useTracks
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StudyRoomPage({ params }: PageProps) {
  const { id } = use(params); 
  const [token, setToken] = useState("");
  const [roomTitle, setRoomTitle] = useState("공부방");
  const [isChatOpen, setIsChatOpen] = useState(false); 
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
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-slate-400 hover:text-white border border-white/5"
            >
              초대 링크
            </button>
          </div>

          {/* 메인 영역 */}
          <div className="flex-1 flex overflow-hidden relative">
            
            {/* 영상 영역 */}
            <div className="flex-1 flex flex-col relative bg-black/40 transition-all">
               <VideoGrid />
               
               {/* 하단 컨트롤바 */}
               <div className="h-24 flex items-center justify-center pointer-events-none absolute bottom-0 w-full z-20 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent">
                  <div className="flex items-center gap-2 bg-[#1e293b]/90 p-2.5 rounded-full border border-white/10 shadow-2xl backdrop-blur-md pointer-events-auto origin-bottom">
                    <TrackToggle source={Track.Source.Microphone} className="!bg-white/5 hover:!bg-white/10 !border-none !rounded-full !p-3.5" />
                    <TrackToggle source={Track.Source.Camera} className="!bg-white/5 hover:!bg-white/10 !border-none !rounded-full !p-3.5" />
                    <TrackToggle source={Track.Source.ScreenShare} className="!bg-white/5 hover:!bg-white/10 !border-none !rounded-full !p-3.5" />
                    <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
                    <button 
                      onClick={() => setIsChatOpen(!isChatOpen)}
                      className={`p-3.5 rounded-full transition-all ${isChatOpen ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </button>
                    <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
                    <DisconnectButton className="!bg-red-500/10 hover:!bg-red-600 !text-red-500 hover:!text-white !border-none !rounded-full !p-3.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </DisconnectButton>
                  </div>
               </div>
            </div>

            {/* 채팅창 영역 */}
            {isChatOpen && (
              <div className="w-[340px] border-l border-white/10 bg-[#0f172a] flex flex-col shrink-0 z-30 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
                
                {/* 💬 커스텀 헤더 (기본 헤더는 CSS로 죽이고 이것만 보여줍니다) */}
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-5 bg-[#1e293b]/30">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500 animate-pulse">●</span>
                    <span className="text-[13px] font-bold text-slate-200 tracking-wide">실시간 채팅</span>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/5">
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
      </LiveKitRoom>
    </div>
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