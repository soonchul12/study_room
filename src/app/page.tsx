// src/app/page.tsx
'use client'; // 이 코드는 브라우저에서 실행된다는 뜻입니다.

import { supabase } from '@/lib/supabase';

export default function Home() {
  // 1. 구글 로그인 기능을 실행하는 함수
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // 로그인이 끝나면 다시 우리 사이트로 돌아오게 합니다.
        redirectTo: window.location.origin, 
      },
    });

    if (error) {
      alert('로그인 중 오류가 발생했습니다: ' + error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
          Study <span className="text-blue-600">Room</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-md mx-auto">
          친구들과 화면을 공유하며 함께 공부하세요. <br />
          실시간 감시(?) 기능으로 집중력을 높여보세요!
        </p>

        {/* 구글 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 w-full max-w-xs mx-auto bg-white border border-slate-300 text-slate-700 font-bold py-3 px-6 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 transition-all cursor-pointer"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          구글로 1초 만에 시작하기
        </button>

        <p className="text-sm text-slate-400">
          로그인 시 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}