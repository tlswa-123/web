import { useState, useEffect, useCallback } from "react";
import { CircularGallery } from "../components/circular-gallery";

/**
 * 作品区—— 环形画廊 + 点击弹出 PDF
 *
 * 6 个作品以环形画廊展示（可拖拽/滚轮横向浏览），
 * 点击居中的卡片弹出对应 PDF 全屏查看（背景加黑+模糊，可上下滚动 PDF，ESC/叉/遮罩关闭）。
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

// 转换为画廊所需格式
const GALLERY_ITEMS = WORKS.map((w) => ({
  id: w.id,
  title: w.title,
  meta: "",
  image: w.image,
}));

export function WorkSection() {
  const [viewing, setViewing] = useState<Work | null>(null);

  const close = useCallback(() => setViewing(null), []);

  // ESC 关闭
  useEffect(() => {
    if (!viewing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewing, close]);

  // 弹窗时禁止背景滚动
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

  // 画廊中居中卡片被点击的回调
  const handleItemClick = useCallback((id: string) => {
    const work = WORKS.find((w) => w.id === id);
    if (work?.pdf) {
      setViewing(work);
    }
  }, []);

  return (
    <section
      id="work"
    className="relative z-10 min-h-svh overflow-hidden px-6 py-24 text-white"
    >
      {/* 背景：场景图第二个白框区域 + 暗层 */}
      <div className="absolute inset-0 -z-10">
    <img
    src="/works/work-bg.png"
          alt=""
     className="h-full w-full object-cover"
     draggable={false}
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>
      <div className="mx-auto max-w-6xl">
        {/* 标题 */}
        <div className="mb-12">
          <p className="mb-2 text-sm tracking-[0.3em] text-white/45 uppercase">
            Selected Work
          </p>
          <h2 className="text-4xl font-semibold md:text-5xl">作品</h2>
        </div>

        {/* 环形画廊 */}
        <div className="relative left-1/2 w-screen -translate-x-1/2">
          <CircularGallery
            items={GALLERY_ITEMS}
            bend={3}
            onItemClick={handleItemClick}
          />
        </div>
        <p className="mt-6 text-center text-xs tracking-[0.25em] text-white/35">
          拖拽或滚动浏览 · 点击作品查看详情
        </p>
      </div>

      {/* PDF 弹窗遮罩 */}
      {viewing && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={close}
          style={{ isolation: "isolate" }}
        >
          {/* PDF 容器 */}
          <div
            className="relative h-[90svh] w-[90vw] max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
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

            {/* PDF iframe */}
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
