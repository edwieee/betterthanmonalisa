'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { imageOf, paintings, plate } from '../lib/museum';
import type { GalleryPosition, mountGallery } from '../lib/gallery-scene';
import './gallery.css';

export default function Gallery() {
  const router = useRouter();
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<ReturnType<typeof mountGallery> | null>(null);
  const [centre, setCentre] = useState(0),
    [hover, setHover] = useState<number | null>(null);
  const [spatial, setSpatial] = useState(false);
  const startX = useRef(0);
  const select = useCallback(
    (i: number) => {
      try {
        sessionStorage.setItem('museum-position', String(i));
        const position = api.current?.position();
        if (position) sessionStorage.setItem('museum-camera', JSON.stringify(position));
        else sessionStorage.removeItem('museum-camera');
      } catch {}
      router.push('/painting/' + paintings[i].id + '?from=gallery');
    },
    [router],
  );
  useEffect(() => {
    const element = host.current!;
    let cancelled = false,
      generation = 0;
    let initial = 0;
    try {
      initial = Math.max(
        0,
        Math.min(paintings.length - 1, Number(sessionStorage.getItem('museum-position')) || 0),
      );
    } catch {}
    const preference = matchMedia('(max-width: 680px), (prefers-reduced-motion: reduce)');
    let saved: GalleryPosition | undefined;
    try {
      const position = JSON.parse(sessionStorage.getItem('museum-camera') || 'null');
      if (Number.isFinite(position?.column) && Number.isFinite(position?.level)) saved = position;
    } catch {}
    let inRange = false;
    function dispose() {
      generation++;
      api.current?.dispose();
      api.current = null;
      setSpatial(false);
      setHover(null);
    }
    async function configure() {
      dispose();
      setCentre(initial);
      if (preference.matches || !inRange) return;
      const version = generation;
      try {
        const { mountGallery } = await import('../lib/gallery-scene');
        if (cancelled || generation !== version) return;
        api.current = mountGallery(
          element,
          initial,
          {
            select,
            caption: (h, c) => {
              setHover(h);
              setCentre(c);
              initial = c;
            },
            lost: () => {
              if (!cancelled) dispose();
            },
          },
          saved,
        );
        saved = undefined;
        setSpatial(true);
      } catch {
        if (!cancelled) setSpatial(false);
      }
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !inRange) {
          inRange = true;
          void configure();
          observer.disconnect();
        }
      },
      { rootMargin: '250px' },
    );
    observer.observe(element);
    preference.addEventListener('change', configure);
    return () => {
      cancelled = true;
      generation++;
      observer.disconnect();
      preference.removeEventListener('change', configure);
      api.current?.dispose();
      api.current = null;
    };
  }, [select]);
  const active = hover ?? centre,
    work = paintings[active];
  function step(d: number) {
    const i = (centre + d + paintings.length) % paintings.length;
    setHover(null);
    setCentre(i);
    api.current?.go(i);
  }
  function open() {
    if (api.current) api.current.open(active);
    else select(active);
  }
  return (
    <section id="gallery" className="exhibition" aria-labelledby="gallery-title">
      <div className="exhibition-head">
        <div>
          <p className="overline">Permanent exhibition</p>
          <h2 id="gallery-title">The gallery.</h2>
        </div>
        <Link href="/collection/all" className="text-link">
          View art index ↗
        </Link>
      </div>
      <div
        className="exhibition-stage"
        tabIndex={0}
        role="region"
        aria-label="Painting gallery. Use left and right arrows to browse and Enter to view a painting."
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            step(e.key === 'ArrowRight' ? 1 : -1);
          }
          if (e.key === 'Enter') open();
        }}
      >
        <div className="scene-host" ref={host} />
        {!spatial && (
          <button
            className="plate-fallback"
            aria-label={'View ' + work.title}
            onPointerDown={(e) => {
              startX.current = e.clientX;
            }}
            onPointerUp={(e) => {
              const dx = e.clientX - startX.current;
              if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
            }}
            onClick={(e) => {
              if (e.detail === 0 || Math.abs(e.clientX - startX.current) < 20) open();
            }}
          >
            <img src={imageOf(work)} alt={work.title} loading="lazy" />
          </button>
        )}
      </div>
      <div className="exhibition-controls">
        <div className="gallery-hint">
          {spatial ? 'Drag to explore · Scroll to travel' : 'Browse the exhibition'}
        </div>
        <button className="gallery-caption" onClick={open}>
          <i>{work.title}</i>
          <span>
            {work.artist} · {work.date} ↗
          </span>
        </button>
        <div className="panel-step">
          <span>
            {plate(active + 1)} / {paintings.length}
          </span>
          <button
            className="round-button"
            aria-label="Previous gallery painting"
            onClick={() => step(-1)}
          >
            ←
          </button>
          <button
            className="round-button"
            aria-label="Next gallery painting"
            onClick={() => step(1)}
          >
            →
          </button>
        </div>
      </div>
      <Link className="gallery-exit text-link" href="#collections">
        Continue to collections ↓
      </Link>
    </section>
  );
}
