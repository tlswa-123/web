/** 固定顶部导航 —— 锚点用自定义滚动，避免原生 jump 破坏阻尼体验 */
import { useProximityNav } from "../hooks/use-proximity-nav";
import { useContext } from "react";
import { ScrollContext } from "../lib/scroll-context";

export function NavBar({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const scroll = useContext(ScrollContext);
  const navRef = useProximityNav<HTMLElement>();

  const goTo = (id: string) => {
    // “关于”的个人介绍位于简历区；站内与阅读页使用同一个目的地。
    const destination = id === "about" ? "resume" : id;
    if (onNavigate) {
      onNavigate(destination);
      return;
    }
    const el = document.getElementById(destination);
    if (!el || !scroll) return;
    const top = el.getBoundingClientRect().top + scroll.scrollTop;
    scroll.scrollTo(top);
  };

  return (
    <nav
      ref={navRef}
      aria-label="主导航"
      className="fixed inset-x-0 top-0 z-40 flex items-start justify-between px-6 py-5 mix-blend-difference md:px-10"
    >
      <button
        onClick={() => goTo("top")}
        className="nav-proximity-item text-lg font-semibold tracking-wide text-white"
        data-nav-proximity
      >
        YourName
      </button>
      <div className="flex items-start gap-6 pt-1 text-sm text-white/90">
        <button
          onClick={() => goTo("resume")}
          className="nav-proximity-item"
          data-nav-proximity
        >
          简历
        </button>
        <button
          onClick={() => goTo("work")}
          className="nav-proximity-item"
          data-nav-proximity
        >
          作品
        </button>
        <button
          onClick={() => goTo("about")}
          className="nav-proximity-item"
          data-nav-proximity
        >
          关于
        </button>
        <button
          onClick={() => goTo("contact")}
          className="nav-proximity-item"
          data-nav-proximity
        >
          联系
        </button>
      </div>
    </nav>
  );
}
