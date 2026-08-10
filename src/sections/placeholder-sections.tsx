/**
 * 占位内容区块 —— 供后续逐步填充。
 * 作品区已独立到 work-section.tsx。
 */

export function AboutSection() {
  return (
    <section
      id="about"
      className="relative z-10 min-h-svh bg-[#141327] px-6 py-24 text-white"
    >
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm tracking-[0.3em] text-white/50 uppercase">
            About
          </p>
          <h2 className="text-4xl font-semibold md:text-5xl">关于我</h2>
        </div>
        <div className="space-y-4 text-white/70">
          <p>这里放你的个人介绍。可以讲你的背景、擅长的领域、设计理念。</p>
          <p>后续把真实内容发给我，我逐段替换进来。</p>
        </div>
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <section
      id="contact"
      className="relative z-10 flex min-h-[70svh] flex-col items-center justify-center bg-[#0a0912] px-6 py-24 text-center text-white"
    >
      <p className="mb-2 text-sm tracking-[0.3em] text-white/50 uppercase">
        Contact
      </p>
      <h2 className="mb-6 text-4xl font-semibold md:text-6xl">一起合作</h2>
      <a
        href="mailto:you@example.com"
        className="rounded-full border border-white/30 px-8 py-3 text-lg transition hover:bg-white hover:text-black"
      >
        you@example.com
      </a>
      <p className="mt-16 text-xs text-white/30">
        © 2026 你的名字 · Built with React
      </p>
    </section>
  );
}
