'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LobbyPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 방 만들기 입력값들
  const [title, setTitle] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [password, setPassword] = useState("");

  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.push('/');
      setUser(data.user);
      fetchAndCleanRooms(); // 로비 들어오면 청소 시작!
    };
    init();

    // 실시간으로 새 방이 생기면 바로 반영
    const channel = supabase.channel('room_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchAndCleanRooms)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 🧹 방 목록 가져오기 & 유령 방 청소
  const fetchAndCleanRooms = async () => {
    // 1. DB에서 방 목록 가져오기
    const { data: dbRooms } = await supabase.from('rooms').select('*').order('created_at', { ascending: false });
    if (!dbRooms) return;

    // 2. 실제 라이브 서버 상태 확인 (API 호출)
    const resp = await fetch('/api/sync-rooms');
    const { activeRoomNames } = await resp.json();

    // 3. 유령 방 걸러내기 (DB에는 있는데 라이브 서버엔 없는 방)
    // 실제 삭제는 서버에서 하는 게 좋지만, 여기선 화면에서 안 보이게 필터링하거나
    // 방 만든 사람이 나중에 접속할 때 지우는 방식을 씁니다.
    // 이번 코드에서는 '화면 필터링' 방식을 적용해 즉각적인 반응을 보여줍니다.
    
    // *중요*: 방금 만든 방은 아직 라이브 서버에 없을 수 있으니 
    // 생성된 지 10초가 지난 방들 중에서만 필터링합니다.
    const validRooms = dbRooms.filter(room => {
      const isNew = (new Date().getTime() - new Date(room.created_at).getTime()) < 10000; 
      return isNew || activeRoomNames.includes(room.id);
    });

    setRooms(validRooms);
  };

  const createRoom = async () => {
    if (!title.trim()) return alert("방 제목을 입력해주세요!");

    // 방 ID를 미리 생성 (랜덤 문자열)
    const roomId = Math.random().toString(36).substring(7);

    const { error } = await supabase.from('rooms').insert([{ 
      id: roomId,
      title, 
      max_participants: maxParticipants,
      password: password || null, // 비번 없으면 null
      creator_id: user?.id 
    }]);

    if (error) {
      alert("방 생성 실패: " + error.message);
    } else {
      router.push(`/room/${roomId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-6 md:p-12 relative">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              STUDY LOBBY
            </h1>
            <p className="text-slate-500 mt-2 font-medium">함께 공부할 동료를 찾아보세요.</p>
          </div>
          <div className="flex gap-4">
             <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2">
               <span>+</span> 방 만들기
             </button>
             <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-slate-400 hover:text-white px-4 py-2">
               로그아웃
             </button>
          </div>
        </div>

        {/* 방 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.length > 0 ? (
            rooms.map((room) => (
              <div key={room.id} onClick={() => router.push(`/room/${room.id}`)} className="group bg-slate-800/30 border border-slate-700/50 p-6 rounded-[2rem] hover:bg-slate-800/60 transition-all hover:scale-[1.02] cursor-pointer relative overflow-hidden">
                {room.password && (
                  <div className="absolute top-6 right-6 text-slate-500">
                    🔒
                  </div>
                )}
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center text-blue-400 font-bold text-xl">
                    📝
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20">
                    모집중
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors truncate">{room.title}</h3>
                <div className="flex items-center gap-4 text-slate-500 text-sm mb-6">
                  <span className="flex items-center gap-1">👥 최대 {room.max_participants}명</span>
                  {room.password && <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">비공개</span>}
                </div>
                <div className="w-full py-4 bg-slate-700/30 text-center rounded-xl font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                  입장하기
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-40 text-slate-600">
              <div className="text-6xl mb-4">텅...</div>
              <p>아직 열린 공부방이 없어요. 첫 번째 방장이 되어보세요!</p>
            </div>
          )}
        </div>
      </div>

      {/* 방 만들기 모달 (디스코드 스타일) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] w-full max-w-md p-8 rounded-[2rem] border border-white/10 shadow-2xl animate-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-white mb-6">방 만들기</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase mb-2">방 제목</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 오늘 밤 샐 사람 구함 🌙"
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase mb-2">최대 인원 ({maxParticipants}명)</label>
                <input 
                  type="range" 
                  min="2" 
                  max="10" 
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                  className="w-full accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>2명</span>
                  <span>10명</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase mb-2">비밀번호 (선택)</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비워두면 공개방이 됩니다"
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-400 font-bold hover:text-white transition-colors">취소</button>
              <button onClick={createRoom} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20">만들기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}