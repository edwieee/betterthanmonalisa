import Link from 'next/link';
import { findPainting,imageOf,paintings,plate,rooms } from '../lib/museum';
import './editorial.css';

export function Introduction() {
  const feature=findPainting('1225')!;
  return <section id="about" className="introduction"><div><p className="overline">About the museum</p><h2>There’s a crowd<br/>around one painting.<br/><em>Walk past it.</em></h2><p className="intro-text">An independent collection of {paintings.length} paintings worth spending time with. Pick a wall, follow a mood, or stay with one work.</p></div>
  <figure><Link href={'/painting/'+feature.id}><img src={imageOf(feature)} alt={feature.title} loading="lazy" width={feature.width} height={feature.height}/><figcaption><i>{feature.title}</i><span>{feature.artist} · {feature.date} ↗</span></figcaption></Link></figure></section>;
}
const covers=['50884','130555','5','50299','52452','12147','12198','166436'];
export function Collections() {
  return <section id="collections" className="collections"><div className="collection-heading"><div><p className="overline">Eight ways to look</p><h2>The collections.</h2></div><Link className="text-link" href="/collection/all">All {paintings.length} paintings ↗</Link></div>
   <div className="room-directory">{rooms.map(([name,slug],i)=>{const cover=findPainting(covers[i])!; const count=paintings.filter(p=>p.category===i).length;
   return <Link key={slug} href={'/collection/'+slug}><img src={imageOf(cover,true)} alt="" loading="lazy"/><span><strong>{name}</strong><small>{plate(count)} paintings</small></span><b aria-hidden="true">↗</b></Link>;})}</div>
  </section>;
}
