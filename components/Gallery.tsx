'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Arch } from './Chrome';
import { imageOf, paintings, rooms } from '../lib/museum';
import type { GalleryPosition } from '../lib/gallery-scene';
import './gallery.css';

type Visit = { category: number; position: GalleryPosition; id?: string };
const entry: Visit = { category: -1, position: { x: 1.07, y: 1.02 } };

const subscribe = () => () => {};
function savedVisit() {
  try {
    return sessionStorage.getItem('gallery-visit') ?? '';
  } catch {
    return '';
  }
}
function remember(visit: Visit) {
  try {
    sessionStorage.setItem('gallery-visit', JSON.stringify(visit));
  } catch {}
}

function readVisit(value: string): Visit {
  try {
    const saved = JSON.parse(value || 'null');
    if (
      Number.isInteger(saved?.category) &&
      saved.category >= -1 &&
      saved.category < rooms.length &&
      Number.isFinite(saved.position?.x) &&
      Number.isFinite(saved.position.y)
    )
      return saved;
  } catch {}
  return entry;
}

export default function Gallery() {
  const router = useRouter();
  const host = useRef<HTMLDivElement>(null);
  const plates = useRef<HTMLDivElement>(null);
  const filter = useRef<HTMLDialogElement>(null);
  const saved = useSyncExternalStore(subscribe, savedVisit, () => '');
  const [selection, setSelection] = useState<Visit | null>(null);
  const visit = useMemo(() => selection ?? readVisit(saved), [selection, saved]);
  const [spatial, setSpatial] = useState(false);
  const [caption, setCaption] = useState<number | null>(null);
  const category = visit.category;
  const works = useMemo(
    () => (category === -1 ? paintings : paintings.filter((p) => p.category === category)),
    [category],
  );
  const open = useCallback(
    (index: number, position: GalleryPosition) => {
      const work = works[index];
      remember({ category, position, id: work.id });
      router.push('/painting/' + work.id + '?from=gallery');
    },
    [works, category, router],
  );

  useEffect(() => {
    if (!spatial && visit.id) {
      plates.current
        ?.querySelector<HTMLElement>('[data-id="' + CSS.escape(visit.id) + '"]')
        ?.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [visit, spatial]);

  useEffect(() => {
    if (!host.current) return;
    const element = host.current;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let dispose: (() => void) | undefined;
    let generation = 0;
    function fallback() {
      dispose?.();
      dispose = undefined;
      setSpatial(false);
      setCaption(null);
    }
    async function configure() {
      const version = ++generation;
      fallback();
      if (motion.matches) return;
      try {
        const { mountGallery } = await import('../lib/gallery-scene');
        if (generation !== version) return;
        dispose = mountGallery(element, works, visit.position, {
          open,
          caption: setCaption,
          ready: () => setSpatial(true),
          lost: fallback,
        });
      } catch {
        fallback();
      }
    }
    void configure();
    motion.addEventListener('change', configure);
    return () => {
      generation++;
      motion.removeEventListener('change', configure);
      dispose?.();
    };
  }, [visit, works, open]);

  function choose(next: number) {
    filter.current?.close();
    if (next === category) return;
    setSpatial(false);
    setCaption(null);
    setSelection({ category: next, position: entry.position });
  }
  const listHref = '/collection/' + (category < 0 ? 'all' : rooms[category][1]);
  return (
    <main className="exhibition" aria-labelledby="gallery-title">
      <h1 className="sr-only" id="gallery-title">
        Painting gallery
      </h1>
      <div
        className="scene-host"
        ref={host}
        tabIndex={spatial ? 0 : -1}
        role="region"
        aria-hidden={!spatial}
        aria-label="Painting grid. Drag or use the arrow keys to explore. Press Enter to view the centre painting."
      />
      {!spatial && (
        <div className="gallery-plates" aria-label="Paintings" ref={plates}>
          {works.map((p, i) => (
            <Link
              key={p.id}
              data-id={p.id}
              href={'/painting/' + p.id + '?from=gallery'}
              onClick={() => {
                const columns = Math.ceil(Math.sqrt(works.length));
                remember({
                  category,
                  id: p.id,
                  position: { x: (i % columns) + 0.5, y: Math.floor(i / columns) + 0.5 },
                });
              }}
            >
              <span>{p.artist}</span>
              <img src={imageOf(p, true)} alt={p.title} loading={i < 10 ? 'eager' : 'lazy'} />
              <small>
                {p.title} · {p.date}
              </small>
            </Link>
          ))}
        </div>
      )}
      <header className="gallery-head">
        <Link className="gallery-mark" href="/" aria-label="Museum entrance">
          <Arch />
        </Link>
        <span className="gallery-instruction">
          {spatial ? 'Drag to explore' : 'Scroll to explore'}
        </span>
        <span className="gallery-name">
          Better Than Mona Lisa
          <br />
          Independent digital museum
        </span>
        <span className="gallery-count">
          {works.length} paintings
          <br />
          {category < 0 ? 'Permanent exhibition' : rooms[category][0]}
        </span>
        <Link href="/" className="gallery-exit">
          Exit gallery
        </Link>
      </header>
      <div className="view-switch" aria-label="Gallery views">
        <span aria-label="Grid view" aria-current="page">
          <i className="grid-icon" />
        </span>
        <Link href={listHref} aria-label="Browse art index">
          <i className="list-icon" />
        </Link>
      </div>
      <nav className="gallery-dock" aria-label="Museum">
        <span aria-current="page">Gallery</span>
        <Link href="/#collections">Collections</Link>
        <Link href="/#about">About</Link>
      </nav>
      <button
        className="gallery-filter"
        onClick={() => filter.current?.showModal()}
        aria-haspopup="dialog"
      >
        Filter{category >= 0 ? ' (1)' : ''}
      </button>
      <dialog
        className="filter-menu"
        ref={filter}
        aria-labelledby="filter-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) filter.current?.close();
        }}
      >
        <div>
          <header>
            <h2 id="filter-title">Filter by collection</h2>
            <button aria-label="Close filters" onClick={() => filter.current?.close()}>
              ×
            </button>
          </header>
          {['All paintings', ...rooms.map(([name]) => name)].map((name, i) => (
            <button key={name} onClick={() => choose(i - 1)} aria-pressed={i - 1 === category}>
              {name}
              <span aria-hidden="true">{i - 1 === category ? '●' : '○'}</span>
            </button>
          ))}
        </div>
      </dialog>
      <span className="sr-only" aria-live="polite">
        {caption !== null ? works[caption]?.title : ''}
      </span>
    </main>
  );
}
