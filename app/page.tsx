import Entrance from '../components/Entrance';
import { Introduction, Collections } from '../components/Editorial';
import { Footer } from '../components/Chrome';

export default function Home() {
  return (
    <>
      <main>
        <Entrance />
        <Introduction />
        <Collections />
      </main>
      <Footer />
    </>
  );
}
