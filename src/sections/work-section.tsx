import { useState } from "react";
import { CircularGallery, type GalleryItem } from "../components/circular-gallery";

/**
 * 作品区 —— 三段式交互
 *
 * 阶段 1 待机：三个分类卡片并排，带景深（悬停的前移变清晰，其余后退虚化）
 * 阶段 2 推进：点击后被选中的卡片 translateZ 冲向镜头并淡出，其余向两侧退散
 * 阶段 3 陈列：该分类作品以环形画廊呈现，可拖拽/滚轮浏览
 *
 * 景深全部由 CSS perspective + translateZ + blur 实现，不依赖 WebGL。
 */

type Category = {
  id: string;
  label: string;
  en: string;
  desc: string;
  items: GalleryItem[];
};

// 占位内容 —— 等你的真实作品替换（image 字段留空会显示占位块）
const CATEGORIES: Category[] = [
  {
    id: "internship",
    label: "实习",
    en: "Internship",
    desc: "在不同团队里练手的阶段",
    items: [
      { id: "i1", title: "某大厂设计中台", meta: "2023 · 交互设计实习" },
      { id: "i2", title: "电商活动专题页", meta: "2023 · 视觉设计" },
      { id: "i3", title: "内部工具重构", meta: "2022 · 产品设计" },
      { id: "i4", title: "品牌视觉延展", meta: "2022 · 平面设计" },
      { id: "i5", title: "用户调研项目", meta: "2022 · 用户研究" },
    ],
  },
  {
    id: "projects",
    label: "作品",
    en: "Projects",
    desc: "自己主导完成的完整项目",
    items: [
      { id: "p1", title: "音乐播放器概念设计", meta: "2024 · 个人项目" },
      { id: "p2", title: "城市漫步地图", meta: "2024 · 交互实验" },
      { id: "p3", title: "字体排印实验集", meta: "2023 · 平面" },
      { id: "p4", title: "低多边形插画系列", meta: "2023 · 插画" },
      { id: "p5", title: "动效练习合辑", meta: "2023 · 动效" },
      { id: "p6", title: "摄影集 · 山与海", meta: "2022 · 摄影" },
    ],
  },
  {
    id: "venture",
    label: "创业",
    en: "Venture",
    desc: "从零开始搭起来的东西",
    items: [
      { id: "v1", title: "独立产品 · 待补充", meta: "2025 · 联合创始人" },
      { id: "v2", title: "品牌从零搭建", meta: "2025 · 品牌设计" },
      { id: "v3", title: "增长落地页系列", meta: "2024 · 产品设计" },
      { id: "v4", title: "团队协作流程设计", meta: "2024 · 运营" },
    ],
  },
];

// 三张卡片的待机横向位置（用于景深错落）
const BASE_X = [-1, 0, 1];

export function WorkSection() {
  // null = 待机；string = 已进入某分类
  const [active, setActive] = useState<string | null>(null);
  // 正在推进中的分类（播放镜头动画）
  const [entering, setEntering] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const enter = (id: string) => {
    setEntering(id);
    // 镜头推进动画时长 900ms，结束后切换到画廊
    window.setTimeout(() => {
      setActive(id);
      setEntering(null);
    }, 900);
  };

  const back = () => {
    setActive(null);
    setHover(null);
  };

  const current = CATEGORIES.find((c) => c.id === active);

  return (
    <section
      id="work"
      className="relative z-10 min-h-svh overflow-hidden bg-[#080711] px-6 py-24 text-white"
    >
      <div className="mx-auto max-w-6xl">
        {/* 标题行 */}
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-sm tracking-[0.3em] text-white/45 uppercase">
              Selected Work
            </p>
            <h2 className="text-4xl font-semibold md:text-5xl">
              {current ? current.label : "作品"}
            </h2>
            {current && (
              <p className="mt-3 text-white/55">{current.desc}</p>
            )}
          </div>
          {current && (
            <button
              onClick={back}
              className="shrink-0 rounded-full border border-white/25 px-5 py-2 text-sm text-white/75 transition hover:border-white/60 hover:text-white"
            >
              ← 返回分类
            </button>
          )}
        </div>

        {/* 阶段 1 + 2：分类入口（景深 + 镜头推进） */}
        {!active && (
          <div
            className="relative h-[520px]"
            style={{ perspective: "1200px", perspectiveOrigin: "50% 50%" }}
            onMouseLeave={() => setHover(null)}
          >
            <div
              className="absolute inset-0 flex items-center justify-center gap-8"
              style={{ transformStyle: "preserve-3d" }}
            >
              {CATEGORIES.map((cat, i) => {
                const isHover = hover === cat.id;
                const isEntering = entering === cat.id;
                const othersEntering = entering !== null && !isEntering;

                // 待机景深：悬停的前移放大变清晰，其余后退虚化
                let z = isHover ? 120 : hover ? -140 : 0;
                let blur = isHover ? 0 : hover ? 3.5 : 0;
                let opacity = isHover ? 1 : hover ? 0.45 : 1;
                let x = BASE_X[i] * 0;
                let scale = 1;

                // 阶段 2 镜头推进：被点的冲向镜头淡出，其余向两侧退散
                if (isEntering) {
                  z = 900;
                  blur = 14;
                  opacity = 0;
                  scale = 1.15;
                } else if (othersEntering) {
                  x = BASE_X[i] * 520;
                  z = -420;
                  blur = 9;
                  opacity = 0;
                }

                return (
                  <button
                    key={cat.id}
                    onMouseEnter={() => !entering && setHover(cat.id)}
                    onClick={() => !entering && enter(cat.id)}
                    className="group relative h-[440px] w-[300px] shrink-0 overflow-hidden rounded-3xl border border-white/15 bg-[#1b1a2e] text-left"
                    style={{
                      transform: `translate3d(${x}px, 0, ${z}px) scale(${scale})`,
                      filter: `blur(${blur}px)`,
                      opacity,
                      transition:
                        "transform 900ms cubic-bezier(0.32,0.72,0,1), filter 700ms ease, opacity 700ms ease",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {/* 悬停高亮底 */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#ff8a4c]/0 transition-colors duration-500 group-hover:to-[#ff8a4c]/25" />

                    <div className="relative z-10 flex h-full flex-col justify-between p-8">
                      <div>
                        <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
                          {cat.en}
                        </p>
                        <h3 className="mt-3 text-3xl font-semibold">
                          {cat.label}
                        </h3>
                        <p className="mt-3 text-sm text-white/55">{cat.desc}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/45">
                          {cat.items.length} 个项目
                        </span>
                        <span className="text-lg text-white/70 transition-transform duration-300 group-hover:translate-x-1">
                          →
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {!entering && (
              <p className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs tracking-[0.25em] text-white/35">
                点击任一分类进入
              </p>
            )}
          </div>
        )}

        {/* 阶段 3：环形画廊（全宽显示，两侧卡片不被裁切） */}
        {current && (
          <div className="animate-[fadeIn_700ms_ease-out]">
            <div className="relative left-1/2 w-screen -translate-x-1/2">
              <CircularGallery items={current.items} bend={3} />
            </div>
            <p className="mt-6 text-center text-xs tracking-[0.25em] text-white/35">
              拖拽或滚动浏览 · 点击侧边作品居中
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
