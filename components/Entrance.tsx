'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { findPainting, imageOf, plate } from '../lib/museum';
import { Header } from './Chrome';

const walls = ['50884', '52451', '165'].map(id => findPainting(id)!);
export default function Entrance() {
  const [wall, setWall] = useState(0);
  const root = useRef<HTMLElement>(null);
  const painting = walls[wall];
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const scroll = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('.wall-images', { yPercent: 12, ease: 'none', scrollTrigger: scroll });
      gsap.to('.entrance-copy', { yPercent: -12, opacity: 0.12, ease: 'none', scrollTrigger: scroll });
    }, root);
    return () => media.revert();
  }, []);
  return <section id="entrance" className="entrance" ref={root}>
    <div className="wall-images" aria-hidden="true">{walls.map((p,i) => <img key={p.id} className={wall === i ? 'wall active' : 'wall'} src={imageOf(p)} alt="" fetchPriority={i === 0 ? 'high' : 'low'} loading={i === 0 ? 'eager' : 'lazy'}/>)}</div>
    <div className="wall-wash"/><div className="draft-circle" aria-hidden="true"><i/><b/></div>
    <Header/>
    <div className="entrance-copy"><p className="overline with-ornament"><span/>An independent digital museum<span/></p>
    <h1>Better Than<br/><em>Mona Lisa.</em></h1>
    <p className="subhead">She’s iconic. These deserve your attention too.</p>
    <Link href="#gallery" className="enter-link">Enter the gallery <span aria-hidden="true">→</span></Link></div>
    <div className="wall-label"><span className="overline">On the wall</span><Link href={'/painting/'+painting.id+'?from=entrance'}>{painting.title}</Link><span>{painting.artist} <i>·</i> {painting.date}</span></div>
    <Link href="#about" className="scroll-link"><span className="scroll-line"/>Scroll to explore</Link>
    <div className="wall-pager"><span>{plate(wall + 1)} <i>/</i> 03</span><button aria-label="Previous entrance painting" onClick={()=>setWall((wall+2)%3)}>←</button><button aria-label="Next entrance painting" onClick={()=>setWall((wall+1)%3)}>→</button></div>
  </section>;
}
