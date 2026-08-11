import { useState, useEffect, useCallback, useRef } from "react";
import { CircularGallery } from "../components/circular-gallery";
import { useScrollProgress } from "../hooks/use-scroll-progress";

/**
 * 作品区—— 镜头从 BOX1 推进到 BOX2 + 暗层淡入 + 环形画廊
 *
 * 架构与 hero 完全一致：
 * - section 给足滚动高度（280svh）
 * - sticky 容器 h-svh + overflow-hidden
 * - 内部放 absolute 场景图，用 transform驱动推进
 * - 用 useScrollProgress 读取 section滚动进度
 */

const CW = 1280;
const CH = 2692;

// 两个白框
const BOX1 = { x: 239, y: 1064, w: 865, h: 606 };
const BOX2 = { x: 435, y: 1920, w: 701, h: 468 };

// 缩放：让白框宽度填满视窗
const SCALE1 = CW / BOX1.w;
const SCALE2 = CW / BOX2.w;

// 白框中心的百分比
const CX1 = (BOX1.x + BOX1.w / 2) / CW;
const CY1 = (BOX1.y + BOX1.h / 2) / CH;
const CX2 = (BOX2.x + BOX2.w / 2) / CW;
const CY2 = (BOX2.y + BOX2.h / 2) / CH;

// 场景图高度基准：让BOX1 高度对应 100svh
const SCENE_H_RATIO = CH / BOX1.h; // ≈ 4.44

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

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
  const progress = useScrollProgress(sectionRef);

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

  // === 推进动画 ===
  // 0~0.3:镜头从 BOX1 推进到 BOX2
  // 0.3~0.8: 停留（画廊可交互）
  // 0.8~1.0: 淡出
  const pushRaw = Math.min(progress / 0.3, 1);
  const pushP = easeInOut(pushRaw);

  const cx = lerp(CX1, CX2, pushP);
  const cy = lerp(CY1, CY2, pushP);
  const scale = lerp(SCALE1, SCALE2, pushP);

  // translate: 让(cx, cy)对齐视窗中心
  //元素 left:50% top:50% → 左上角在视窗中心
  // translate(-cx*100%, -cy*100%) → 画布的(cx,cy)点移到元素左上角位置=视窗中心
  const txPct = -cx * 100;
  const tyPct = -cy * 100;

  //暗层：推进到 60%~100%渐入
  const darkOpacity = pushRaw > 0.6 ? ((pushRaw - 0.6) / 0.4) * 0.78 : 0;

  // 画廊内容：推进完后渐入
  const contentShow = progress > 0.3 ? Math.min((progress - 0.3) / 0.08, 1) : 0;

  // 退出淡出
  const exitFade = progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1;

  return (
    <section
      ref={sectionRef}
      id="work"
      className="relative z-10 h-[280svh]"
    >
      {/* sticky 视窗容器 */}
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {/* 场景图：absolute + transform 推进 */}
        <div
          className="absolute left-1/2 top-1/2 will-change-transform"
          style={{
            height: `calc(100svh * ${SCENE_H_RATIO})`,
            aspectRatio: `${CW} / ${CH}`,
            transform: `translate(${txPct}%, ${tyPct}%) scale(${scale})`,
            opacity: exitFade,
          }}
        >
          <img
            src="/parallax/scene.webp"
            alt=""
            className="absolute inset-0 h-full w-full"
            draggable={false}
          />
        </div>

        {/* 暗层 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: `rgba(8, 7, 17, ${darkOpacity * exitFade})`,
          }}
        />

        {/* 画廊内容 */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none"
          style={{ opacity: contentShow * exitFade }}
        >
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="mb-8">
              <p className="mb-2 text-sm tracking-[0.3em] text-white/45 uppercase">
                Selected Work
              </p>
              <h2 className="text-4xl font-semibold md:text-5xl">作品</h2>
            </div>
          </div>

          {/* 画廊需要能交互 */}
          <div className="w-screen pointer-events-auto">
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
      </div>

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
