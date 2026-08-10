/** 固定顶部导航 —— 锚点用自定义滚动，避免原生 jump 破坏阻尼体验 */
import { useScroll } from "../lib/scroll-context";

export function NavBar() {
  const scroll = useScroll();

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + scroll.scrollTop;
    scroll.scrollTo(top);
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 mix-blend-difference md:px-10">
      <button
        onClick={() => goTo("top")}
        className="text-lg font-semibold tracking-wide text-white"
      >
        YourName
      </button>
      <div className="flex gap-6 text-sm text-white/90">
        <button onClick={() => goTo("resume")} className="hover:text-white">
          简历
        </button>
        <button onClick={() => goTo("work")} className="hover:text-white">
          作品
        </button>
        <button onClick={() => goTo("about")} className="hover:text-white">
          关于
        </button>
        <button onClick={() => goTo("contact")} className="hover:text-white">
          联系
        </button>
      </div>
    </nav>
  );
}
