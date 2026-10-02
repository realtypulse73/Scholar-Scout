import { NextResponse } from 'next/server';
import { getReleasedContributorMedia } from '@/lib/server/contributor-media';

export async function GET(
  _request: Request,
  context: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await context.params;
  try {
    const media = await getReleasedContributorMedia(publicId);
    if (!media) return new NextResponse(null, { status: 404 });
    return new NextResponse(media.stream, {
      headers: {
        'Content-Type': media.contentType,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
