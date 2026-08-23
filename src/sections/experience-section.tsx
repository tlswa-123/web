import { useRef, useMemo } from "react";
import { useScrollProgress } from "../hooks/use-scroll-progress";

/**
 * 实习经历页 —— 4屏全屏 sticky 翻页 + 右上角时间线导航
 *
 * 放在简历页和作品页之间，镜头锁定在 BOX2 期间展示。
 * 尾部留出推进缓冲区（BOX2→BOX3），供 use-global-camera 推进到作品页。
 */

type ExperienceItem = {
  id: string;
  company: string;
  role: string;
  location: string;
  period: string;
  headline: string;
  modules: {
    title: string;
    bullets: string[];
  }[];
  tags: string[];
  screenshotPlaceholder?: string; // 截图占位描述
};

const EXPERIENCES: ExperienceItem[] = [
  {
    id: "tencent",
    company: "腾讯 · 微信游戏",
    role: "产品策划实习生",
    location: "深圳",
    period: "2026.3 - 至今",
    headline: "在 AI 生成游戏平台从 0 到 1 的过程中，定义产品体验标准与质量评估体系",
    modules: [
      {
        title: "平台产品设计",
        bullets: [
          "主导移动端（游戏盒子）的核心交互体验设计",
          "负责气泡消息改版、单聊、素材管理等核心页面",
          "承接 PC → 小程序的全链路闭环流转",
        ],
      },
      {
        title: "AI 质量治理",
        bullets: [
          "独立设计 AI 生成游戏的多维能力测评体系",
          "覆盖整体质量 + 素材两类维度",
          "持续迭代 4 轮评测，打分方差减少 50%",
        ],
      },
    ],
    tags: ["AI产品", "从0到1", "UGC平台", "质量标准", "移动端产品"],
    screenshotPlaceholder: "PC首页 + 手机端界面",
  },
  {
    id: "xingqudao",
    company: "兴趣岛",
    role: "产品经理实习生",
    location: "广州",
    period: "2025.3 - 2025.8",
    headline: "在 3000 万用户平台上，主导核心功能从工具到平台的三版演进，驱动课程转化率提升 30%",
    modules: [
      {
        title: "唱歌工具 1.0 → 3.0 演进",
        bullets: [
          "1.0：课程用户的打卡工具，替代手机录音的笨方案",
          "2.0：脱离课程，独立功能化——自选歌单、自由练习、社区发布",
          "3.0：AI 评分 + 美颜 + 自选模板，课程转化率 +30%",
        ],
      },
      {
        title: "其他模块",
        bullets: [
          "散步地图：覆盖散步/太极/轻运动场景",
          "AI 太极跟练：轮廓引导替代识别，模块化训练流程",
        ],
      },
    ],
    tags: ["功能演进", "数据驱动", "用户增长", "3000万用户", "团队协作"],
    screenshotPlaceholder: "唱歌工具界面截图",
  },
  {
    id: "maipal",
    company: "MaiPal 脉伴",
    role: "联合创始人 & 产品负责人",
    location: "AI中医养生陪伴Agent",
    period: "2025 - 至今",
    headline: "从 0 到 1 打造 AI 中医 Agent 产品，完成技术验证、用户增长与商业化初步落地",
    modules: [
      {
        title: "产品",
        bullets: [
          "多轮对话构建长期健康画像",
          "个性化调理计划生成",
          "Web + iOS App + 小程序",
        ],
      },
      {
        title: "技术",
        bullets: [
          "接入面部/舌部识别模型（望闻问诊）",
          "RAG + 中医知识库搭建",
          "规范化报告生成框架",
        ],
      },
      {
        title: "商业",
        bullets: [
          "180+ 注册用户 · 1400+ 对话",
          "80% 留存意愿",
          "九州通 / 同仁堂合作意向",
        ],
      },
    ],
    tags: ["0→1", "Agent", "RAG", "创业", "已上线"],
    screenshotPlaceholder: "App主界面 + 官网链接",
  },
  {
    id: "early",
    company: "更多经历",
    role: "",
    location: "",
    period: "2023",
    headline: "很早就在各种领域实践 —— 从 B 端系统到独立游戏到竞赛",
    modules: [
      {
        title: "志诚慧远 · UI/UX 实习",
        bullets: ["企业级 B 端系统，30+ 页面信息架构，交互效率 +10%"],
      },
      {
        title: "2D 叙事解谜游戏",
        bullets: ["独立开发 5 章节，集成 ChatGPT 作为游戏内 NPC"],
      },
      {
        title: "广横走数字创意",
        bullets: ["创始团队，20+ 活动执行，100+ 设计需求"],
      },
      {
        title: "iGEM 银奖",
        bullets: ["设计组长，主导 20+ 页面网站搭建"],
      },
    ],
    tags: ["B端系统", "独立游戏", "ChatGPT", "iGEM银奖", "发明专利×3"],
    screenshotPlaceholder: "",
  },
];

export function ExperienceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef);

  // 根据进度确定当前活跃的经历索引
  const activeIndex = useMemo(() => {
    // 把进度均分成 N 段（最后一屏多给一点空间）
    const total = EXPERIENCES.length;
    // 滚动区域的前 80% 用于4屏翻页，后 20% 是推进缓冲区
    const contentProgress = Math.min(1, progress / 0.75);
    const idx = Math.floor(contentProgress * total);
    return Math.min(idx, total - 1);
  }, [progress]);

  return (
    <section
      ref={sectionRef}
      id="experience"
      className="relative z-10 text-white"
    >
      {/* 4屏 sticky 容器 */}
      <div className="relative" style={{ height: `${EXPERIENCES.length * 100 + 50}svh` }}>
        {/* 右上角时间线导航 — sticky 固定 */}
        <div className="sticky top-0 z-30 pointer-events-none h-0">
          <nav className="pointer-events-auto absolute right-6 top-8 md:right-12 md:top-12 flex flex-col gap-3">
            {EXPERIENCES.map((exp, i) => (
              <button
                key={exp.id}
                className={`text-right transition-all duration-300 ${
                  i === activeIndex
                    ? "opacity-100 scale-100"
                    : "opacity-40 scale-95"
                }`}
              >
                <div
                  className={`text-sm font-medium transition-colors ${
                    i === activeIndex ? "text-white" : "text-white/50"
                  }`}
                >
                  {exp.company}
                </div>
                <div className="text-xs text-white/40">{exp.period}</div>
              </button>
            ))}
          </nav>
        </div>

        {/* 各经历全屏卡片 — sticky 堆叠 */}
        {EXPERIENCES.map((exp, index) => {
          const isActive = index === activeIndex;
          const isPast = index < activeIndex;

          return (
            <div
              key={exp.id}
              className="sticky top-0 h-svh flex items-center justify-start overflow-hidden"
              style={{ zIndex: index + 1 }}
            >
              <div
                className={`w-full max-w-5xl mx-auto px-6 md:px-16 transition-all duration-500 ${
                  isActive
                    ? "opacity-100 translate-y-0"
                    : isPast
                    ? "opacity-0 -translate-y-12"
                    : "opacity-0 translate-y-12"
                }`}
              >
                {/* 身份头 */}
                <div className="mb-8">
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                    {exp.company}
                  </h2>
                  {exp.role && (
                    <p className="mt-2 text-lg text-white/60">
                      {exp.role}
                      {exp.location && ` · ${exp.location}`} · {exp.period}
                    </p>
                  )}
                </div>

                {/* 核心一句话 */}
                <p className="text-lg md:text-xl text-white/80 max-w-3xl leading-relaxed mb-10 border-l-2 border-[#ff8a4c]/60 pl-5">
                  {exp.headline}
                </p>

                {/* 模块内容 */}
                <div className={`grid gap-8 ${
                  exp.modules.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"
                }`}>
                  {exp.modules.map((mod) => (
                    <div key={mod.title}>
                      <h4 className="text-sm font-semibold text-[#ff8a4c] uppercase tracking-wide mb-3">
                        {mod.title}
                      </h4>
                      <ul className="space-y-2">
                        {mod.bullets.map((bullet, bi) => (
                          <li
                            key={bi}
                            className="text-sm md:text-base text-white/70 leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-[0.6em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-white/30"
                          >
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {/* 截图占位 */}
                  {exp.screenshotPlaceholder && (
                    <div className="md:col-span-full mt-4">
                      <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-white/30 text-sm">
                        📷 截图占位：{exp.screenshotPlaceholder}
                      </div>
                    </div>
                  )}
                </div>

                {/* 标签 */}
                <div className="mt-8 flex flex-wrap gap-2">
                  {exp.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/55"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 推进缓冲区 BOX2→BOX3 的标记和空间 */}
      <div id="experience-end" aria-hidden />
      <div className="h-[230svh]" aria-hidden />
    </section>
  );
}
