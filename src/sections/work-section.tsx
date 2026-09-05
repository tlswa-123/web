import { useRef } from "react";
import { CircularGallery } from "../components/circular-gallery";
import { HangingSkillCards } from "../components/hanging-skill-cards";
import { WORKS } from "../lib/works";
import { useEntryReveal } from "../hooks/use-entry-reveal";

/**
 * 作品区 —— 环形画廊 + 点击进入独立 PDF 阅读页
 *
 * 【重要】背景已迁移到全局唯一的 GlobalBackground。本组件只渲染画廊内容，
 * 不再自己渲染场景图或暗层。镜头此时已经稳定停在白框2（由
 * use-global-camera.ts 统一驱动），本组件只负责内容的渐显。
 */

const GALLERY_ITEMS = WORKS.map((w) => ({
  id: w.id,
  title: w.title,
  meta: "",
  image: w.image,
}));

export function WorkSection({ onOpenWork }: { onOpenWork: (id: string) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const reveal = useEntryReveal(sectionRef);

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
              onItemClick={onOpenWork}
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

    </section>
  );
}
