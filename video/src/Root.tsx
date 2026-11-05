import { Composition, Still } from "remotion";
import { Reklama } from "./Reklama";
import { Meta, MetaSlika } from "./Meta";
import { MEMEOVI, Meme, trajanje } from "./Memes";
import { KVIZ_TRAJANJE, Kviz } from "./Kviz";
import { PREMIUM_TRAJANJE, Premium } from "./Premium";
export const Root = () => (
  <>
    <Composition id="Reklama" component={Reklama} durationInFrames={660} fps={30} width={1080} height={1920} />
    <Composition id="MetaFeed" component={Meta} defaultProps={{ fmt: "feed" as const }} durationInFrames={450} fps={30} width={1080} height={1350} />
    <Composition id="MetaStory" component={Meta} defaultProps={{ fmt: "story" as const }} durationInFrames={450} fps={30} width={1080} height={1920} />
    <Composition id="JelenFeed" component={Meta} defaultProps={{ fmt: "feed" as const, v: "jelen" as const }} durationInFrames={450} fps={30} width={1080} height={1350} />
    <Composition id="JelenStory" component={Meta} defaultProps={{ fmt: "story" as const, v: "jelen" as const }} durationInFrames={450} fps={30} width={1080} height={1920} />
    {Object.keys(MEMEOVI).map((ime) => (
      <Composition key={ime} id={`meme-${ime}`} component={Meme} defaultProps={{ ime }} durationInFrames={trajanje(ime)} fps={30} width={1080} height={1920} />
    ))}
    <Composition id="Kviz" component={Kviz} durationInFrames={KVIZ_TRAJANJE} fps={30} width={1080} height={1920} />
    <Composition id="Premium" component={Premium} durationInFrames={PREMIUM_TRAJANJE} fps={30} width={1080} height={1920} />
    <Still id="MetaSlika" component={MetaSlika} width={1080} height={1350} />
  </>
);
