// src/app/api/sync-rooms/route.ts
import { RoomServiceClient } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // 클라이언트용이지만, 여기선 서버 로직 대체용으로 씀 (실제론 서버용 키 권장)

// LiveKit 서버 관리 도구
const roomService = new RoomServiceClient(
  process.env.NEXT_PUBLIC_LIVEKIT_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function GET() {
  try {
    // 1. 현재 LiveKit 서버에 살아있는 방 목록을 가져옴
    const activeRooms = await roomService.listRooms();
    const activeRoomNames = activeRooms.map((room) => room.name);

    // 2. 데이터베이스(Supabase)에 있는 방 목록을 가져옴
    // 주의: 실제 프로덕션에서는 서버용 Supabase 클라이언트(service_role)를 써야 삭제 권한이 확실합니다.
    // 여기서는 로직 설명을 위해 일반 클라이언트 로직으로 구성하거나, 
    // DB의 모든 방을 가져와서 비교합니다.
    
    // *간단한 해결책*: 로비에서 이 API를 호출하면, 
    // DB에 있는 방 중 activeRoomNames에 없는 방은 삭제해버림.
    
    // (이 부분은 Supabase Admin 키가 없으면 클라이언트에서 처리해야 할 수도 있습니다.
    //  하지만 보안상 서버에서 처리하는 게 맞습니다. 
    //  편의상 '살아있는 방 목록'만 반환해서 클라이언트가 필터링하게 하겠습니다.)

    return NextResponse.json({ activeRoomNames });
  } catch (error) {
    return NextResponse.json({ error: '동기화 실패' }, { status: 500 });
  }
}