export type Work = {
  id: string;
  title: string;
  image: string;
  pdf: string | null;
  pageCount: number;
};

export const WORKS: Work[] = [
  { id: "cardia", title: "ACarDiA", image: "/works/cardia.png", pdf: "/works/cardia.pdf", pageCount: 5 },
  { id: "lumobird", title: "Lumobird", image: "/works/lumobird.png", pdf: null, pageCount: 0 },
  { id: "memory", title: "Memory", image: "/works/memory.png", pdf: "/works/memory.pdf", pageCount: 8 },
  { id: "moodoo", title: "Moodoo", image: "/works/moodoo.png", pdf: "/works/moodoo.pdf", pageCount: 8 },
  { id: "musaic", title: "Musaic", image: "/works/musaic.png", pdf: "/works/musaic.pdf", pageCount: 8 },
  { id: "scribe", title: "Scribe", image: "/works/scribe.png", pdf: "/works/scribe.pdf", pageCount: 8 },
];
