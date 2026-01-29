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
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.push('/');
      setUser(data.user);
    };
    getUser();
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    const { data } = await supabase.from('rooms').select('*').order('created_at', { ascending: false });
    setRooms(data || []);
  };

  const createRoom = async () => {
    if (!newRoomTitle.trim()) return alert("방 제목을 입력해주세요!");
    const { data, error } = await supabase.from('rooms').insert([{ title: newRoomTitle, creator_id: user?.id }]).select();
    if (data) router.push(`/room/${data[0].id}`);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              STUDY LOBBY
            </h1>
            <p className="text-slate-500 mt-2 font-medium">현재 활성화된 공부방에 참여하세요.</p>
          </div>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-slate-400 hover:text-white transition-colors">
            로그아웃
          </button>
        </div>

        {/* 방 생성 카드 */}
        <div className="bg-slate-800/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-700/50 mb-12 shadow-2xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            새로운 공부방 만들기
          </h2>
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              value={newRoomTitle}
              onChange={(e) => setNewRoomTitle(e.target.value)}
              placeholder="어떤 공부를 하실 건가요?"
              className="flex-1 bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button onClick={createRoom} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20">
              방 만들기
            </button>
          </div>
        </div>

        {/* 방 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div key={room.id} className="group bg-slate-800/30 border border-slate-700/50 p-8 rounded-[2rem] hover:bg-slate-800/60 transition-all hover:scale-[1.02] cursor-pointer" onClick={() => router.push(`/room/${room.id}`)}>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400">
                  📚
                </div>
                <span className="bg-slate-700/50 text-slate-400 text-xs px-3 py-1 rounded-full">ACTIVE</span>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">{room.title}</h3>
              <p className="text-slate-500 text-sm mb-6">함께 열공할 친구들을 기다리고 있어요.</p>
              <div className="w-full py-4 bg-slate-700/30 text-center rounded-xl font-bold group-hover:bg-blue-600 transition-all">
                입장하기
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}