import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  return new Response('Hello, world!',request);
}

export const runtime = 'edge';