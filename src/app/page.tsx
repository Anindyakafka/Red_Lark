import Link from "next/link";
import { Catalogue } from "@/features/catalog/catalogue";

export default function Home() {
  return <>
    <section className="hero"><div className="hero-copy"><p className="eyebrow"><span className="live-dot" /> Independent art. Shared freely.</p><h1>Ideas belong<br />out in the <em>open.</em></h1><p className="hero-description">A growing archive of posters and stickers for public walls. Find something that speaks to you. Make it your own. Take it outside.</p><div className="hero-actions"><a className="button dark" href="#collection">Explore the posters <span aria-hidden="true">↓</span></a><Link href="/studio" className="text-link">Make your own ↗</Link></div><p className="small-note">An archive taking shape. Sample artwork shown below.</p></div><div className="hero-art" aria-label="Illustrative Mirafra poster studies"><div className="art-label">THE WALL / STUDY NO. 001</div><img className="hero-poster back" src="/samples/sky.svg" alt="Blue poster study with an abstract bird" /><img className="hero-poster front" src="/samples/voice.svg" alt="Cream and red typographic poster: A voice in the open" /><span className="art-caption">Made to be seen.<br />Made to be shared.</span><span className="registration-mark" aria-hidden="true">+</span></div></section>
    <div className="manifesto-strip"><span>DOWNLOAD</span><span aria-hidden="true">↗</span><span>CUSTOMISE</span><span aria-hidden="true">↗</span><span>PRINT</span><span aria-hidden="true">↗</span><span>PUT IT OUT THERE</span></div>
    <Catalogue kind="poster" home />
    <section className="studio-invitation"><div><p className="eyebrow">A little room for your ideas</p><h2>The archive is a<br />starting point.</h2></div><div><p>Pick a few elements. Change the words. Move things around. Our studio is a place to turn a shared visual language into something of your own.</p><Link href="/studio" className="button dark">Step into the studio ↗</Link></div></section>
  </>;
}
