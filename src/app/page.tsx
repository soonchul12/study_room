'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. 페이지 로드 시 사용자의 로그인 상태를 확인합니다.
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };
    checkUser();

    // 로그인 상태가 변할 때(로그인/로그아웃)를 실시간으로 감지합니다.
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 2. 구글 로그인 실행 함수
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // 로그인이 완료되면 현재 페이지(메인)로 돌아옵니다.
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      alert('로그인 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 3. 로그아웃 함수
  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert('로그아웃 되었습니다.');
  };

  // 4. 로비(방 목록)로 이동하는 함수
  const goToLobby = () => {
    router.push('/lobby');
  };

  // 로딩 중일 때 보여줄 화면
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
      {/* 상단 디자인 섹션 */}
      <div className="text-center space-y-6 p-10 bg-white rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 max-w-lg w-full">
        <h1 className="text-6xl font-black text-slate-900 tracking-tighter">
          Study <span className="text-blue-600 italic">Room</span>
        </h1>
        
        {user ? (
          /* [로그인 후 나타나는 화면] */
          <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="py-4">
              <p className="text-xl text-slate-600">
                열공할 준비 되셨나요?
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {user.user_metadata.full_name}님, 환영합니다!
              </p>
            </div>

            <button
              onClick={goToLobby}
              className="w-full bg-blue-600 text-white font-bold py-5 px-8 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all cursor-pointer transform hover:-translate-y-1 active:scale-95 text-lg"
            >
              🚀 공부방 목록 보기
            </button>

            <button 
              onClick={handleLogout}
              className="text-sm text-slate-400 hover:text-red-400 transition-colors underline underline-offset-4"
            >
              다른 계정으로 로그인할래요 (로그아웃)
            </button>
          </div>
        ) : (
          /* [로그인 전 나타나는 화면] */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-lg text-slate-500 leading-relaxed">
              디스코드처럼 친구들과 화면을 공유하며<br /> 
              서로의 공부 모습을 실시간으로 확인하세요.
            </p>
            
            <button
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-4 w-full bg-white border-2 border-slate-100 text-slate-700 font-bold py-5 px-8 rounded-2xl shadow-sm hover:shadow-xl hover:bg-slate-50 transition-all cursor-pointer transform hover:-translate-y-1 active:scale-95 text-lg"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
              구글로 1초 만에 시작하기
            </button>

            <div className="pt-4 border-t border-slate-50">
              <p className="text-xs text-slate-400">
                로그인 시 서비스 이용약관 및 <br />
                개인정보 처리방침에 동의하는 것으로 간주됩니다.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 하단 푸터 영역 (수익화 시 광고가 들어갈 수 있는 공간) */}
      <p className="mt-12 text-slate-400 text-sm font-medium">
        © 2026 Study Room. All rights reserved.
      </p>
    </div>
  );
}