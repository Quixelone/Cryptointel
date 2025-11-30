import { NextResponse } from 'next/server'

export async function GET() {
    console.log('✅ TEST endpoint called successfully');
    return NextResponse.json({ message: 'Test endpoint works!' });
}
