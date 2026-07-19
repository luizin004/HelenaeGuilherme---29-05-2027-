import { Nav } from "@/components/public/Nav";
import { Hero } from "@/components/public/Hero";
import { Countdown } from "@/components/public/Countdown";
import { Story } from "@/components/public/Story";
import { Details } from "@/components/public/Details";
import { Gallery } from "@/components/public/Gallery";
import { Kids } from "@/components/public/Kids";
import { Gifts } from "@/components/public/Gifts";
import { Rsvp } from "@/components/public/Rsvp";
import { Footer } from "@/components/public/Footer";
import { getGallery, getSettings, getStory, getVenues, resolveCouple } from "@/lib/data";
import { WEDDING } from "@/lib/constants";

export const revalidate = 60;

export default async function HomePage() {
  const [settings, venues, story, gallery] = await Promise.all([
    getSettings(),
    getVenues(),
    getStory(),
    getGallery(),
  ]);

  const couple = resolveCouple(settings);
  const dataLinha = new Date(couple.dataISO)
    .toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" })
    .replace(/ de /g, " · ");

  return (
    <main>
      <Nav />
      <Hero noiva={couple.noiva} noivo={couple.noivo} dataLinha={dataLinha} />
      <Countdown dataISO={couple.dataISO} />
      <Story historia={couple.historia} eventos={story} />
      <Details venues={venues} />
      <Gallery fotos={gallery} />
      <Kids />
      <Gifts />
      <Rsvp />
      <Footer noiva={couple.noiva} noivo={couple.noivo} dataExtenso={WEDDING.dataExtenso} />
    </main>
  );
}
