import { useState, useEffect, useCallback, useRef } from "react";
import { CircularGallery } from "../components/circular-gallery";
import { HangingSkillCards } from "../components/hanging-skill-cards";
import { useEntryReveal } from "../hooks/use-entry-reveal";

/**
 * 作品区 —— 环形画廊 + 点击弹出 PDF
 *
 * 【重要】背景已迁移到全局唯一的 GlobalBackground。本组件只渲染画廊内容，
 * 不再自己渲染场景图或暗层。镜头此时已经稳定停在白框2（由
 * use-global-camera.ts 统一驱动），本组件只负责内容的渐显。
 */

type Work = {
  id: string;
  title: string;
  image: string;
  pdf: string | null;
};

const WORKS: Work[] = [
  { id: "cardia", title: "ACarDiA", image: "/works/cardia.png", pdf: "/works/cardia.pdf" },
  { id: "lumobird", title: "Lumobird", image: "/works/lumobird.png", pdf: null },
  { id: "memory", title: "Memory", image: "/works/memory.png", pdf: "/works/memory.pdf" },
  { id: "moodoo", title: "Moodoo", image: "/works/moodoo.png", pdf: "/works/moodoo.pdf" },
  { id: "musaic", title: "Musaic", image: "/works/musaic.png", pdf: "/works/musaic.pdf" },
  { id: "scribe", title: "Scribe", image: "/works/scribe.png", pdf: "/works/scribe.pdf" },
];

const GALLERY_ITEMS = WORKS.map((w) => ({
  id: w.id,
  title: w.title,
  meta: "",
  image: w.image,
}));

export function WorkSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reveal = useEntryReveal(sectionRef);

  const [viewing, setViewing] = useState<Work | null>(null);
  const close = useCallback(() => setViewing(null), []);

  useEffect(() => {
    if (!viewing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewing, close]);

  useEffect(() => {
    if (viewing) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [viewing]);

  const handleItemClick = useCallback((id: string) => {
    const work = WORKS.find((w) => w.id === id);
    if (work?.pdf) {
      setViewing(work);
    }
  }, []);

  const contentReveal = Math.min(1, Math.max(0, (reveal - 0.15) / 0.4));

  return (
    <section ref={sectionRef} id="work" className="relative z-10 text-white">
      {/* 内容区域 sticky 固定一屏 */}
      <div className="sticky top-0 flex h-svh overflow-hidden">
        {/* 左侧 + 中间：画廊 */}
        <div
          className="flex flex-1 flex-col items-center justify-center"
          style={{
            opacity: contentReveal,
            transform: `translateY(${(1 - contentReveal) * 20}px)`,
          }}
        >
          <div className="mx-auto w-full max-w-4xl px-6">
            <div className="mb-6">
              <p className="mb-2 text-sm tracking-[0.3em] text-white/45 uppercase">
                Selected Work
              </p>
              <h2 className="text-4xl font-semibold md:text-5xl">作品</h2>
            </div>
          </div>

          <div className="w-full max-w-[70vw]">
            <CircularGallery
              items={GALLERY_ITEMS}
              bend={3}
              onItemClick={handleItemClick}
            />
          </div>
          <p className="mt-4 text-center text-xs tracking-[0.25em] text-white/35">
            拖拽或滚动浏览 · 点击作品查看详情
          </p>
        </div>

        {/* 右侧：悬挂技能卡片 */}
        <div
          className="hidden w-64 shrink-0 pr-6 lg:block"
          style={{
            opacity: contentReveal,
            transform: `translateY(${(1 - contentReveal) * 30}px)`,
          }}
        >
          <HangingSkillCards />
        </div>
      </div>

      {/* 滚动高度保持不变，确保镜头阶段划分正常 */}
      <div className="h-svh" aria-hidden />

      {/* 推进缓冲区 BOX3→BOX4 的标记和空间 */}
      <div id="work-end" aria-hidden />
      <div className="h-[230svh]" aria-hidden />

      {/* PDF弹窗 */}
      {viewing && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="relative h-[90svh] w-[90vw] max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/90"
              aria-label="关闭"
              type="button"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="4" y1="4" x2="14" y2="14" />
                <line x1="14" y1="4" x2="4" y2="14" />
              </svg>
            </button>
            <iframe
              src={viewing.pdf!}
              title={viewing.title}
              className="h-full w-full border-0"
            />
          </div>
        </div>
      )}
    </section>
  );
}
