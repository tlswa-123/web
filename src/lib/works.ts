import { assetPath } from "./asset-path";

export type Work = {
  id: string;
  title: string;
  image: string;
  pdf: string | null;
  pageCount: number;
};

export const WORKS: Work[] = [
  { id: "cardia", title: "ACarDiA", image: assetPath("/works/cardia.png"), pdf: assetPath("/works/cardia.pdf"), pageCount: 5 },
  { id: "lumobird", title: "Lumobird", image: assetPath("/works/lumobird.png"), pdf: null, pageCount: 0 },
  { id: "memory", title: "Memory", image: assetPath("/works/memory.png"), pdf: assetPath("/works/memory.pdf"), pageCount: 8 },
  { id: "moodoo", title: "Moodoo", image: assetPath("/works/moodoo.png"), pdf: assetPath("/works/moodoo.pdf"), pageCount: 8 },
  { id: "musaic", title: "Musaic", image: assetPath("/works/musaic.png"), pdf: assetPath("/works/musaic.pdf"), pageCount: 8 },
  { id: "scribe", title: "Scribe", image: assetPath("/works/scribe.png"), pdf: assetPath("/works/scribe.pdf"), pageCount: 8 },
];
