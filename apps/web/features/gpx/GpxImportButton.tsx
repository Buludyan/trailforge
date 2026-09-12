'use client';

import { GpxParseError, parseGpx } from '@trailforge/gpx';
import { useId, useState } from 'react';
import type { ChangeEvent } from 'react';

import { trackImported } from '@/features/route-builder/routeSlice';
import { useAppDispatch } from '@/store/hooks';

export function GpxImportButton() {
  const dispatch = useAppDispatch();
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const document = parseGpx(await file.text());
      const track = document.tracks.find((candidate) =>
        candidate.segments.some((segment) => segment.points.length > 0),
      );

      if (!track) {
        setError('This GPX file has no track points');
        return;
      }

      setError(null);
      dispatch(trackImported({ track, fileName: file.name }));
    } catch (cause) {
      setError(cause instanceof GpxParseError ? cause.message : 'Could not read this file');
    }
  };

  return (
    <div>
      <label
        htmlFor={inputId}
        style={{
          display: 'inline-block',
          padding: '6px 10px',
          borderRadius: 4,
          border: '1px solid #171717',
          cursor: 'pointer',
        }}
      >
        Import GPX
      </label>
      <input
        id={inputId}
        type="file"
        accept=".gpx,application/gpx+xml"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      {error ? (
        <p style={{ margin: '6px 0 0', color: '#b3261e', maxWidth: 260 }}>{error}</p>
      ) : null}
    </div>
  );
}
