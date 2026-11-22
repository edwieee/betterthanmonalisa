import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Header, Footer } from '../../../components/Chrome';
import ViewingRoom from '../../../components/ViewingRoom';
import { findPainting, paintings } from '../../../lib/museum';
import './room.css';

export const dynamicParams = false;
export const generateStaticParams = () => paintings.map(({ id }) => ({ id }));
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  const work = findPainting((await params).id);
  return { title: work?.title, description: work?.description };
}
export default async function PaintingPage({ params }: Props) {
  const work = findPainting((await params).id);
  if (!work) notFound();
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <main className="private-room">
            <h1>{work.title}</h1>
            <img src={'/art/' + work.id + '.webp'} alt={work.title} />
          </main>
        }
      >
        <ViewingRoom work={work} />
      </Suspense>
      <Footer />
    </>
  );
}
