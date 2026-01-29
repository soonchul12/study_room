// src/app/lobby/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LobbyPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // 1. 로그인한 사용자 정보 가져오기
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/'); // 로그인 안 되어 있으면 메인으로 쫓아내기
      }
      setUser(data.user);
    };
    getUser();

    // 2. 방 목록 실시간으로 가져오기
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error("방 목록 로드 실패:", error);
    else setRooms(data || []);
  };

  // 3. 새 방 만들기 함수
  const createRoom = async () => {
    if (!newRoomTitle.trim()) {
      alert("방 제목을 입력해주세요!");
      return;
    }

    const { data, error } = await supabase
      .from('rooms')
      .insert([
        { 
          title: newRoomTitle,
          creator_id: user?.id 
        }
      ])
      .select();

    if (error) {
      alert("방 생성 실패: " + error.message);
    } else if (data) {
      // 방이 만들어지면 해당 방의 고유 ID 주소로 바로 이동
      router.push(`/room/${data[0].id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-slate-900">🏫 공부방 로비</h1>
          <button 
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-slate-600 font-medium"
          >
            메인으로 돌아가기
          </button>
        </div>

        {/* 방 만들기 섹션 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-10 flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            value={newRoomTitle}
            onChange={(e) => setNewRoomTitle(e.target.value)}
            placeholder="자바스크립트 빡공방 🔥"
            className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 font-medium"
          />
          <button 
            onClick={createRoom}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 whitespace-nowrap"
          >
            새 방 만들기
          </button>
        </div>

        {/* 방 목록 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rooms.length > 0 ? (
            rooms.map((room) => (
              <div 
                key={room.id} 
                className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
              >
                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {room.title}
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  생성일: {new Date(room.created_at).toLocaleDateString()}
                </p>
                <button 
                  onClick={() => router.push(`/room/${room.id}`)}
                  className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                >
                  입장하기
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-slate-400 font-medium">
              아직 열린 공부방이 없어요. 첫 번째 방을 만들어보세요!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}