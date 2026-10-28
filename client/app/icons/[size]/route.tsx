// Generates the PWA PNG icons from code at build time (no binary assets to maintain).
import { ImageResponse } from 'next/og';

const SIZES = ['192', '512'];

export function generateStaticParams() {
  return SIZES.map((size) => ({ size }));
}

export const dynamicParams = false;

export async function GET(_request: Request, { params }: RouteContext<'/icons/[size]'>) {
  const { size } = await params;
  const px = Number(size);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f8b7e' }}>
        <svg width={px * 0.7} height={px * 0.7} viewBox="0 0 64 64">
          <path d="M32 14 L52 8 L52 22 Z" fill="#ffc857" opacity="0.55" />
          <path d="M32 14 L12 8 L12 22 Z" fill="#ffc857" opacity="0.55" />
          <circle cx="32" cy="16" r="6" fill="#ffc857" />
          <path d="M26 24 h12 l3 30 h-18 z" fill="#ffffff" />
          <path d="M25.2 34 h13.6 l0.6 6 h-14.8 z" fill="#ffc857" />
        </svg>
      </div>
    ),
    { width: px, height: px },
  );
}
