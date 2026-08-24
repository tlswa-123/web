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
      className="relative z-10 text-white"
    >
      {/* 内容 sticky 固定一屏，和背景一起定格 */}
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center px-6 text-center">
        <p className="mb-2 text-sm tracking-[0.3em] text-white/50 uppercase">
          Contact
        </p>
        <h2 className="mb-4 text-4xl font-semibold md:text-6xl">一起合作</h2>
        <p className="mb-12 max-w-md text-white/55">
          欢迎来联系我，无论是内推机会、合作想法，还是随便聊聊都可以。
        </p>

        <div className="flex flex-col items-center gap-10 md:flex-row md:items-start md:gap-16">
          {/* 联系方式列表 */}
          <div className="flex flex-col items-center gap-5 md:items-start">
            <a
              href="mailto:1821650572@qq.com"
              className="group flex items-center gap-3 rounded-full border border-white/25 px-6 py-3 text-base transition hover:border-white/60 hover:bg-white hover:text-black"
            >
              <span className="text-white/45 group-hover:text-black/50">邮箱</span>
              <span>1821650572@qq.com</span>
            </a>

            <a
              href="mailto:25093014g@connect.polyu.hk"
              className="group flex items-center gap-3 text-sm text-white/50 transition hover:text-white"
            >
              <span className="text-white/35 group-hover:text-white/60">学校邮箱</span>
              <span>25093014g@connect.polyu.hk</span>
            </a>

            <a
              href="tel:18985152208"
              className="group flex items-center gap-3 rounded-full border border-white/25 px-6 py-3 text-base transition hover:border-white/60 hover:bg-white hover:text-black"
            >
              <span className="text-white/45 group-hover:text-black/50">电话</span>
              <span>189 8515 2208</span>
            </a>

            <div className="flex items-center gap-3 rounded-full border border-white/25 px-6 py-3 text-base">
              <span className="text-white/45">微信</span>
              <span>noH2Sunxs238mlCX92ZY</span>
            </div>
          </div>

          {/* 微信二维码 */}
          <div className="flex flex-col items-center gap-3">
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white p-3">
              <img
                src="/contact/wechat-qr.png"
                alt="微信二维码"
                className="h-40 w-40 object-contain"
                draggable={false}
              />
            </div>
            <p className="text-xs tracking-[0.2em] text-white/35 uppercase">
              扫码添加微信
            </p>
          </div>
        </div>

        <p className="mt-16 text-xs text-white/30">
          © 2026 Jin Xi · Built with React
        </p>
      </div>
      {/* 保持一定高度让页面可滚到底 */}
      <div className="h-svh" aria-hidden />
    </section>
  );
}
