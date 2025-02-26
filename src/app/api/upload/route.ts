// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pinata } from '../../../lib/pinataconfig';

export async function POST(req: NextRequest) {
  try {
    const data = await req.arrayBuffer();
    const buffer = Buffer.from(data);
    const file = new File([buffer], 'uploaded_image.png', { type: 'image/png' });

    // Upload the file to Pinata IPFS
    const result = await pinata.upload.file(file);
    console.log('IPFS Upload Success:', result);
    return NextResponse.json({ ipfsHash: result.IpfsHash });
  } catch (error) {
    console.error('IPFS Upload Failed:', error);
    return NextResponse.json({ error: 'IPFS Upload Failed' }, { status: 500 });
  }
}
