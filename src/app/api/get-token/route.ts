// src/app/api/get-token/route.ts
import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const room = searchParams.get('room');
  const username = searchParams.get('username');

  if (!room || !username) {
    return NextResponse.json({ error: '방 이름과 사용자 이름이 필요합니다.' }, { status: 400 });
  }

  // 입장권 제작 (identity + name 설정 시 채팅에 아이디가 표시됨)
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: username, name: username }
  );

  at.addGrant({ roomJoin: true, room: room, canPublish: true, canSubscribe: true });

  return NextResponse.json({ token: await at.toJwt() });
}