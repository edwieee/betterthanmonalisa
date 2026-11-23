import Link from 'next/link';

export function Arch() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 44"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
    >
      <path d="M2 41V21a18 18 0 0 1 36 0v20M6 41V21a14 14 0 0 1 28 0v20M10 41V21a10 10 0 0 1 20 0v20M14 41V21a6 6 0 0 1 12 0v20M18 41V21a2 2 0 0 1 4 0v20M0 41h40" />
    </svg>
  );
}
export function Wordmark() {
  return (
    <Link href="/" className="wordmark" aria-label="Better Than Mona Lisa home">
      <Arch />
      <span>
        Better Than
        <br />
        Mona Lisa
      </span>
    </Link>
  );
}
export function Header() {
  return (
    <header className="mast">
      <Wordmark />
      <nav aria-label="Primary">
        <Link href="/gallery">Gallery</Link>
        <Link href="/#collections">Collections</Link>
        <Link href="/#about">About</Link>
      </nav>
      <Link className="index-link" href="/collection/all">
        <span className="index-icon" aria-hidden="true">
          ⊞
        </span>{' '}
        Art index
      </Link>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="museum-footer">
      <Wordmark />
      <span>An independent digital museum</span>
      <Link href="/#entrance">Back to entrance ↑</Link>
    </footer>
  );
}
