import { useState, useRef, useCallback, useEffect } from "react";

/**
 * 悬挂技能卡片 —— 鼠标靠近时产生物理拨动效果
 *
 * 每张卡片从顶部"悬挂"（transform-origin: top center），
 * 鼠标进入时根据鼠标相对卡片中心的位置产生 rotateY + rotateX 倾斜，
 * 离开后弹性回弹到初始微晃角度。
 */

type SkillCategory = {
  label: string;
  color: string; // tailwind bg class
  skills: string[];
};

const SKILL_DATA: SkillCategory[] = [
  {
    label: "产品",
    color: "from-blue-500/80 to-blue-600/80",
    skills: ["PRD撰写", "用户研究", "竞品分析", "需求拆解", "数据埋点"],
  },
  {
    label: "设计",
    color: "from-purple-500/80 to-purple-600/80",
    skills: ["Figma", "Sketch", "原型设计", "交互设计", "设计系统"],
  },
  {
    label: "前端",
    color: "from-emerald-500/80 to-emerald-600/80",
    skills: ["React", "TypeScript", "Tailwind", "Next.js", "Vite"],
  },
  {
    label: "AI & 开发",
    color: "from-amber-500/80 to-amber-600/80",
    skills: ["Python", "Prompt Engineering", "Agent", "MCP", "LLM"],
  },
  {
    label: "工具",
    color: "from-rose-500/80 to-rose-600/80",
    skills: ["Git", "Jira", "飞书", "Notion", "Vercel"],
  },
];

function SkillCard({
  skill,
  categoryColor,
  delay,
}: {
  skill: string;
  categoryColor: string;
  delay: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const animRef = useRef<number>(0);
  const swingRef = useRef(0);

  // 自然微晃动画
  useEffect(() => {
    const startTime = Date.now() + delay * 100;
    const animate = () => {
      if (!isHovered) {
        const t = (Date.now() - startTime) / 1000;
        swingRef.current = Math.sin(t * 1.2 + delay * 0.7) * 3;
        setTilt({ x: 0, y: swingRef.current });
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isHovered, delay]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: -dy * 15, y: dx * 25 });
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={cardRef}
      className="group relative cursor-default select-none"
      style={{
        perspective: "600px",
        transformOrigin: "top center",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 悬挂线 */}
      <div className="mx-auto h-4 w-px bg-gradient-to-b from-white/0 to-white/30" />
      {/* 卡片本体 */}
      <div
        className={`rounded-lg bg-gradient-to-br ${categoryColor} px-3 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-sm transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-white/10`}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: isHovered
            ? "transform 0.1s ease-out"
            : "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          transformOrigin: "top center",
        }}
      >
        {skill}
      </div>
    </div>
  );
}

export function HangingSkillCards() {
  return (
    <div className="flex h-full flex-col justify-center gap-4 py-6">
      {SKILL_DATA.map((category) => (
        <div key={category.label}>
          <p className="mb-1.5 text-[10px] font-semibold tracking-[0.2em] text-white/40 uppercase">
            {category.label}
          </p>
          <div className="flex flex-wrap gap-x-1.5 gap-y-0">
            {category.skills.map((skill, i) => (
              <SkillCard
                key={skill}
                skill={skill}
                categoryColor={category.color}
                delay={i}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
