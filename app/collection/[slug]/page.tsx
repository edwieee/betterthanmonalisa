import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header,Footer } from '../../../components/Chrome';
import { imageOf,paintings,plate,rooms } from '../../../lib/museum';
import './catalog.css';

export const dynamicParams=false;
export const generateStaticParams=()=>['all',...rooms.map(([,slug])=>slug)].map(slug=>({slug}));
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props) {
  const {slug}=await params;
  return {title:rooms.find(r=>r[1]===slug)?.[0]||'Art index'};
}
export default async function CollectionPage({params}:Props) {
  const {slug}=await params;
  const room=rooms.findIndex(r=>r[1]===slug),all=slug==='all';
  if(!all && room<0)notFound();
  const selection=all?paintings:paintings.filter(p=>p.category===room);
  return <><Header/><main className="catalog"><Link className="catalog-back" href="/#collections">← Collections</Link>
  <div className="catalog-heading"><div><p className="overline">{all?'Permanent collection':'Collection '+plate(room+1)}</p><h1>{all?'Art index.':rooms[room][0]+'.'}</h1></div><span>{plate(selection.length)} paintings</span></div>
  <nav className="catalog-nav" aria-label="Collection filter">{[['All works','all'],...rooms].map(([name,value])=><Link key={value} aria-current={slug===value?'page':undefined} href={'/collection/'+value}>{name}</Link>)}</nav>
  <div className="catalog-works">{selection.map(p=><figure key={p.id}><Link href={'/painting/'+p.id+'?from='+slug}><div className="catalog-image"><img src={imageOf(p)} alt={p.title} width={p.width} height={p.height} loading="lazy"/></div><figcaption><span>{p.date}</span><h2>{p.title}</h2><p>{p.artist}</p></figcaption></Link></figure>)}</div></main><Footer/></>;
}
