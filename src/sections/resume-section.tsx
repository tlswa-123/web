import { useRef } from "react";
import { useScrollProgress } from "../hooks/use-scroll-progress";
import { useEntryReveal } from "../hooks/use-entry-reveal";

/**
 * 简历页 —— 卡片堆叠
 *
 * 【重要】背景已迁移到全局唯一的 GlobalBackground。本组件只渲染内容
 * （标题/头像/卡片），不再自己渲染场景图或暗层。
 *
 * 卡片堆叠区末尾放一个不可见的标记元素 `#resume-cards-end`，
 * use-global-camera.ts 会读取它的位置，作为"镜头开始从白框1推进到白框2"
 * 的起点——卡片翻完的同一屏内，背景（唯一的那个背景）就开始自然推进，
 * 不会有任何独立的空白区块。
 */

const TITLE_BAR = 100;
const CARD_H = "54svh";

type ResumeItem = {
  title: string;
  subtitle: string;
  desc: string;
  tags: string[];
};

const RESUME_ITEMS: ResumeItem[] = [
  {
    title: "产品 × 创业 · 跨学科",
    subtitle: "工业设计出身，做产品策划的路",
    desc: "本科学的是怎么造东西，后来发现更想定义「造什么」。从设计转产品，从大厂到创业，一直在做从模糊到清晰的事。",
    tags: ["产品策划", "AI应用", "从0到1"],
  },
  {
    title: "华南理工 → 香港理工",
    subtitle: "工业设计（本科）→ 多媒体娱乐（硕士）",
    desc: "本科在华工学工业设计，练的是系统化拆解问题的能力。研究生去港理工读多媒体方向，补产品和技术的交叉视角。",
    tags: ["985", "QS54", "GPA 3.72"],
  },
  {
    title: "腾讯 WXG · 兴趣岛 · B端起步",
    subtitle: "三段实习，从画界面到定方向",
    desc: "在腾讯做 AI 游戏生成平台的产品策划，负责核心页面和测评体系设计。在兴趣岛主导唱歌工具三个版本从规划到上线。最早从 B 端系统入行，学会拆需求和跑流程。",
    tags: ["AI 产品", "工具迭代", "全流程"],
  },
  {
    title: "MaiPal脉伴",
    subtitle: "联合创始人 · AI 中医陪伴 Agent",
    desc: "从用户研究到产品上线全程主导。用多轮对话和中医知识图谱做了一个能陪人调理养生的 AI，拿到港理大创业基金支持。",
    tags: ["0→1", "Agent", "已上线"],
  },
  {
    title: "专利 · 竞赛 · 独立开发",
    subtitle: "闲不住的那种",
    desc: "自己做过完整的 2D叙事解谜游戏，带队给 iGEM 做网站拿了全球银奖，手上有 3 项发明专利在审。",
    tags: ["发明专利×3", "iGEM 银奖", "独立游戏"],
  },
];

export function ResumeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef);
  const reveal = useEntryReveal(sectionRef);

  const outerRing = progress * 360;
  const innerRing = progress * -360;

  const headerReveal = Math.min(1, Math.max(0, (reveal - 0.15) / 0.4));

  return (
    <section ref={sectionRef} id="resume" className="relative z-10 text-white">
      <div
        className="mx-auto max-w-6xl px-6 pt-24 pb-6"
        style={{
          opacity: headerReveal,
          transform: `translateY(${(1 - headerReveal) * 24}px)`,
        }}
      >
        <p className="mb-2 text-sm tracking-[0.3em] text-white/45 uppercase">
          About
        </p>
        <h2 className="text-3xl font-semibold md:text-5xl">
          产品策划，也是造东西的人
        </h2>
        <p className="mt-4 max-w-xl text-base text-white/50">
          在腾讯做 AI 产品，也从零搭过自己的创业项目。习惯在模糊地带找方向，把想法落成能用的东西。
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 md:grid-cols-[280px_1fr] md:gap-12">
        {/* 左栏：头像 + 旋转环 + 基本信息（sticky） */}
        <div className="hidden md:block">
          <div
            className="sticky top-[18svh] flex flex-col items-center pt-4"
            style={{
              opacity: headerReveal,
              transform: `translateY(${(1 - headerReveal) * 24}px)`,
            }}
          >
            <div className="relative flex items-center justify-center">
              <div
                className="absolute h-[200px] w-[200px] rounded-full border border-dashed border-[#ff8a4c]/50"
                style={{ transform: `rotate(${outerRing}deg)` }}
              />
              <div
                className="absolute h-[168px] w-[168px] rounded-full border border-dashed border-[#7F77DD]/60"
                style={{ transform: `rotate(${innerRing}deg)` }}
              />
              <div className="relative z-10 flex h-[130px] w-[130px] items-center justify-center rounded-full bg-[#1b1a2e] border-2 border-white/15">
                <span className="text-sm text-white/35">头像</span>
              </div>
            </div>

            <div className="mt-8 text-center">
              <h3 className="text-2xl font-semibold">金玺</h3>
              <p className="mt-1 text-sm text-white/45">Jin Xi</p>
              <div className="mt-5 flex flex-col gap-2 text-sm text-white/55">
                <span>港理工MSc 在读</span>
                <span>腾讯 WXG 产品策划</span>
                <span>MaiPal 联合创始人</span>
              </div>
            </div>
          </div>
        </div>

        {/* 右栏：卡片堆叠 */}
        <div className="relative">
          <div className="mb-10 flex items-center gap-4 md:hidden">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1b1a2e] border border-white/15">
              <span className="text-xs text-white/35">头像</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold">金玺</h3>
              <p className="text-xs text-white/45">产品策划 · 创业者</p>
            </div>
          </div>

          {RESUME_ITEMS.map((item, index) => (
            <article
              key={item.title}
              className="group sticky overflow-hidden rounded-2xl border border-white/12 bg-[#1b1a2e] transition-colors duration-300 hover:border-white/35"
              style={{
                top: `calc(14svh + ${index * TITLE_BAR}px)`,
                height: CARD_H,
                zIndex: index + 1,
                marginBottom:
                  index === RESUME_ITEMS.length - 1 ? 0 : "5svh",
                opacity: index === 0 ? headerReveal : 1,
                transform:
                  index === 0
                    ? `translateY(${(1 - headerReveal) * 24}px)`
                    : undefined,
              }}
            >
              <div className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-[#ff8a4c]/80 to-[#ff5e62]/80 transition-transform duration-500 ease-out group-hover:scale-x-100" />

              <div className="relative z-10 flex h-full flex-col px-7 pt-6 pb-7 md:px-9 md:pb-9">
                <div style={{ minHeight: TITLE_BAR - 48 }}>
                  <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-white/55 transition-colors group-hover:text-white/80">
                    {item.subtitle}
                  </p>
                </div>

                <div className="mt-5 flex flex-1 flex-col justify-between">
                  <p className="max-w-xl text-base leading-relaxed text-white/70 transition-colors group-hover:text-white md:text-lg">
                    {item.desc}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-white/18 px-3 py-1 text-xs text-white/60 transition-colors group-hover:border-white/45 group-hover:text-white"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}

          {/* 推进起点标记：不可见，仅供 use-global-camera 读取位置。
              卡片堆叠结束后立即开始推进，卡片全部翻完 sticky 解钉的同一屏
              内，背景就自然开始移动，不会有独立的"空白过渡区" */}
          <div id="resume-cards-end" aria-hidden />

          {/* 推进缓冲：给背景推进动画留出的滚动距离，不含任何可见内容。
              高度与 use-global-camera.ts 里 PUSH_DISTANCE_VH 保持一致语义
              （这里用固定 120svh，略大于推进实际所需的 1.2屏，留一点余量） */}
          <div className="h-[120svh]" aria-hidden />
        </div>
      </div>
    </section>
  );
}
