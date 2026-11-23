'use client';
import Link from 'next/link';
import { useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { imageOf, paintings, plate, rooms } from '../lib/museum';
import type { Painting } from '../lib/museum';

export default function ViewingRoom({ work }: { work: Painting }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useSearchParams();
  const from = search.get('from') || 'gallery';
  const room = rooms.find(([, slug]) => slug === from);
  const sequence = room ? paintings.filter((p) => rooms[p.category][1] === from) : paintings;
  const list = sequence.some((p) => p.id === work.id) ? sequence : paintings;
  const position = list.findIndex((p) => p.id === work.id);
  const back =
    room || from === 'all'
      ? '/collection/' + from
      : from === 'entrance'
        ? '/#entrance'
        : '/gallery';
  const neighbor = (offset: number) =>
    '/painting/' +
    list[(position + offset + list.length) % list.length].id +
    '?from=' +
    encodeURIComponent(from);
  const openFull = () => {
    const el = dialog.current;
    if (!el) return;
    el.showModal();
    el.requestFullscreen?.().catch(() => {});
  };
  const closeFull = () => {
    if (document.fullscreenElement === dialog.current) document.exitFullscreen().catch(() => {});
    dialog.current?.close();
  };
  return (
    <main className="private-room">
      <div className="room-toolbar">
        <Link href={back}>
          ← Back to{' '}
          {room
            ? 'collection'
            : from === 'all'
              ? 'art index'
              : from === 'entrance'
                ? 'entrance'
                : 'gallery'}
        </Link>
        <span className="overline">Private viewing room</span>
      </div>
      <div className="room-spread">
        <figure className="room-art">
          <button onClick={openFull} aria-label={'View ' + work.title + ' fullscreen'}>
            <img src={imageOf(work)} width={work.width} height={work.height} alt={work.title} />
          </button>
          <figcaption>
            <span>{work.accession} · National Gallery of Art</span>
            <button onClick={openFull}>Fullscreen ⛶</button>
          </figcaption>
        </figure>
        <article className="room-text">
          <Link href={'/collection/' + rooms[work.category][1]} className="overline">
            {rooms[work.category][0]} ↗
          </Link>
          <h1>{work.title}</h1>
          <p className="artist-line">{work.artist}</p>
          <p className="room-date">
            {work.date} <span>·</span> {work.period}
          </p>
          <p className="description">{work.description}</p>
          <aside>
            <h2 className="overline">Curator’s note</h2>
            <p>{work.note}</p>
          </aside>
          <p className="credit">
            {work.medium}
            <br />
            National Gallery of Art, Washington
            <br />
            {work.credit}
          </p>
          <a className="text-link" href={work.source} target="_blank" rel="noopener noreferrer">
            View original artwork ↗
          </a>
        </article>
      </div>
      <nav className="room-pagination" aria-label="Painting navigation">
        <Link href={neighbor(-1)}>← Previous painting</Link>
        <span>
          {plate(position + 1)} / {plate(list.length)}
        </span>
        <Link href={neighbor(1)}>Next painting →</Link>
      </nav>
      <dialog
        ref={dialog}
        className="lightbox"
        onCancel={(e) => {
          e.preventDefault();
          closeFull();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeFull();
        }}
        aria-label={work.title}
      >
        <button autoFocus onClick={closeFull}>
          Close ×
        </button>
        <img src={imageOf(work)} alt={work.title} />
      </dialog>
    </main>
  );
}
