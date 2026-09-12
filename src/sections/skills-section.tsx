import { useEffect, useRef } from "react";

type SkillGroup = {
  label: string;
  tone: "product" | "technical" | "tools" | "ai";
  items: string[];
};

const SKILL_GROUPS: SkillGroup[] = [
  {
    label: "产品技能",
    tone: "product",
    items: ["需求分析", "用户调研", "功能设计", "交互流程设计", "数据驱动迭代", "跨团队协作", "产品文档撰写"],
  },
  {
    label: "技术技能",
    tone: "technical",
    items: ["C#", "Python", "SQL（基础）"],
  },
  {
    label: "工具",
    tone: "tools",
    items: ["Figma", "Arduino", "Axure", "PS", "AI", "AE", "PR", "Fusion 360", "Blender", "C4D", "Unity", "UE", "Rhino", "Maya"],
  },
  {
    label: "AI 工具",
    tone: "ai",
    items: ["Codex", "WorkBuddy", "Agent", "GPT", "Claude", "Kimi", "GLM", "DeepSeek", "Seedance", "混元 3D", "Suno"],
  },
];

type WordState = {
  element: HTMLSpanElement;
  phase: number;
  speed: number;
  amplitude: number;
  left: number;
  top: number;
  centerX: number;
  centerY: number;
};

export function SkillsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const pointerRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const words: WordState[] = wordsRef.current.flatMap((element, index) => element ? [{
      element,
      phase: index * .81,
      speed: .46 + (index % 4) * .07,
      amplitude: 1.4 + (index % 4) * .45,
      left: 0,
      top: 0,
      centerX: 0,
      centerY: 0,
    }] : []);
    let frame = 0;
    let startedAt = performance.now();

    const measure = () => {
      words.forEach((word) => {
        const rect = word.element.getBoundingClientRect();
        word.left = rect.left;
        word.top = rect.top;
        word.centerX = rect.left + rect.width / 2;
        word.centerY = rect.top + rect.height / 2;
      });
    };

    const animate = (now: number) => {
      const time = (now - startedAt) / 1000;
      words.forEach((word) => {
        const floatX = reducedMotion.matches ? 0 : Math.sin(time * word.speed + word.phase) * word.amplitude;
        const floatY = reducedMotion.matches ? 0 : Math.cos(time * word.speed * .78 + word.phase * 1.4) * word.amplitude * .72;
        const dx = pointerRef.current.x - word.centerX;
        const dy = pointerRef.current.y - word.centerY;
        const distance = pointerRef.current.active ? Math.hypot(dx, dy) : Number.POSITIVE_INFINITY;
        const raw = Math.max(0, Math.min(1, 1 - distance / 165));
        const glow = raw * raw * (3 - 2 * raw);
        const localX = pointerRef.current.x - word.left;
        const localY = pointerRef.current.y - word.top;
        word.element.style.setProperty("--light-x", `${localX.toFixed(1)}px`);
        word.element.style.setProperty("--light-y", `${localY.toFixed(1)}px`);
        word.element.style.setProperty("--skill-glow", glow.toFixed(3));
        word.element.dataset.glowing = glow > .04 ? "true" : "false";
        word.element.style.transform = `translate3d(${floatX.toFixed(2)}px, ${floatY.toFixed(2)}px, 0) rotateX(${(glow * Math.max(-4, Math.min(4, -dy / 25))).toFixed(2)}deg) rotateY(${(glow * Math.max(-5, Math.min(5, dx / 20))).toFixed(2)}deg) translateZ(${(glow * 7).toFixed(2)}px)`;
      });
      frame = requestAnimationFrame(animate);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches || event.pointerType === "touch") return;
      pointerRef.current = { x: event.clientX, y: event.clientY, active: true };
      const rect = section.getBoundingClientRect();
      section.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
      section.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
      section.style.setProperty("--panel-light", "1");
    };

    const onPointerLeave = () => {
      pointerRef.current.active = false;
      section.style.setProperty("--panel-light", "0");
    };

    measure();
    window.addEventListener("resize", measure, { passive: true });
    section.addEventListener("pointermove", onPointerMove, { passive: true });
    section.addEventListener("pointerleave", onPointerLeave);
    document.fonts?.ready.then(measure);
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerleave", onPointerLeave);
      words.forEach((word) => {
        word.element.style.removeProperty("transform");
        word.element.style.removeProperty("--skill-glow");
        word.element.dataset.glowing = "false";
      });
    };
  }, []);

  return (
    <section ref={sectionRef} id="skills" className="skills-section text-white">
      <div className="skills-section-inner">
        <header className="skills-section-header">
          <p>Capability</p>
          <h2>技能</h2>
          <span>从产品、技术到工具与 AI。每个词都在持续使用和更新。</span>
        </header>
        <div className="skills-section-grid">
          {SKILL_GROUPS.map((group, groupIndex) => (
            <section key={group.label} className="skill-category-light" data-tone={group.tone}>
              <h3>{group.label}</h3>
              <div className="skill-word-cloud">
                {group.items.map((item, itemIndex) => (
                  <span
                    key={item}
                    ref={(element) => { wordsRef.current[groupIndex * 20 + itemIndex] = element; }}
                    className="skill-word"
                    data-glowing="false"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
