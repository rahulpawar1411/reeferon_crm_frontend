import React, { useEffect, useMemo, useState } from 'react';
import { buildMediaSrcCandidates } from '../../utils/resolveMediaSrc';

/**
 * <img> with Cloudinary → local /uploads fallback when CDN 404s.
 */
export default function FallbackImg({ src, alt = '', className, style, onClick, ...rest }) {
  const candidates = useMemo(() => buildMediaSrcCandidates(src), [src]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [src]);

  const current = candidates[index];
  if (!current) return null;

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      style={style}
      onClick={onClick}
      onError={() => {
        setIndex((i) => (i + 1 < candidates.length ? i + 1 : i));
      }}
      {...rest}
    />
  );
}

export function resolveLightboxSrc(path) {
  return buildMediaSrcCandidates(path)[0] || null;
}
