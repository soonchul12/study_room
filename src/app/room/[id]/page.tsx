// src/app/room/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { 
  LiveKitRoom, 
  VideoConference, 
  RoomAudioRenderer, 
  ControlBar 
} from '@livekit/components-react';
import '@livekit/components-styles';
import { supabase } from '@/lib/supabase';

export default function StudyRoomPage({ params }: { params: { id: string } }) {
  const [token, setToken] = useState("");
  const [roomTitle, setRoomTitle] = useState("공부방");

  useEffect(() => {
    const initRoom = async () => {
      // 1. 데이터베이스에서 방 제목 가져오기
      const { data } = await supabase
        .from('rooms')
        .select('title')
        .eq('id', params.id)
        .single();
      
      if (data) setRoomTitle(data.title);

      // 2. 사용자 정보 가져오기
      const { data: userData } = await supabase.auth.getUser();
      const userName = userData.user?.user_metadata.full_name || "익명회원";

      // 3. LiveKit 입장권(Token) 요청하기
      const resp = await fetch(`/api/get-token?room=${params.id}&username=${userName}`);
      const tokenData = await resp.json();
      setToken(tokenData.token);
    };

    initRoom();
  }, [params.id]);

  // 초대 링크 복사 함수
  const copyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("초대 링크가 복사되었습니다! 친구에게 보내보세요.");
  };

  if (token === "") return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
      입장권을 확인 중입니다...
    </div>
  );

  return (
    <div className="h-screen bg-slate-950 flex flex-col">
      {/* 상단바: 방 제목과 초대 버튼 */}
      <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center px-8">
        <h2 className="text-white font-bold text-lg">📝 {roomTitle}</h2>
        <button 
          onClick={copyInviteLink}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
        >
          🔗 초대 링크 복사
        </button>
      </div>

      {/* 메인 영상 영역 */}
      <div className="flex-1 relative">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          connect={true}
          data-lk-theme="default"
        >
          <VideoConference />
          <ControlBar />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>

      {/* 하단 광고 자리 (수익화 포인트 ⭐) */}
      <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-center text-slate-500 text-xs">
        {/* 나중에 여기에 구글 애드센스 코드를 넣으면 됩니다 */}
        광고 영역 (Google AdSense)
      </div>
    </div>
  );
}