/** 固定顶部导航 —— 锚点用自定义滚动，避免原生 jump 破坏阻尼体验 */
import { useProximityNav } from "../hooks/use-proximity-nav";
import { useContext } from "react";
import { ScrollContext } from "../lib/scroll-context";
import { WORKS } from "../lib/works";

type NavBarProps = {
  onNavigate?: (id: string) => void;
  onOpenWork?: (id: string) => void;
};

type MenuLink = {
  label: string;
  id: string;
  workId?: string;
};

type MenuItem = {
  label: string;
  id: string;
  children: MenuLink[];
};

const MENU_ITEMS: MenuItem[] = [
  {
    label: "简历",
    id: "resume",
    children: [
      { label: "个人介绍", id: "resume" },
      { label: "腾讯 · 微信游戏", id: "experience-tencent" },
      { label: "兴趣岛", id: "experience-xingqudao" },
      { label: "MaiPal 脉伴", id: "experience-maipal" },
      { label: "更多经历", id: "experience-early" },
      { label: "技能", id: "skills" },
    ],
  },
  {
    label: "作品",
    id: "work",
    children: [
      { label: "作品总览", id: "work" },
      ...WORKS.map((work) => ({ label: work.title, id: "work", workId: work.id })),
    ],
  },
  {
    label: "关于",
    id: "about",
    children: [
      { label: "关于我", id: "resume" },
      { label: "经历与技能", id: "experience" },
      { label: "一起合作", id: "contact" },
    ],
  },
  {
    label: "联系",
    id: "contact",
    children: [
      { label: "邮箱", id: "contact" },
      { label: "微信", id: "contact" },
    ],
  },
];

export function NavBar({ onNavigate, onOpenWork }: NavBarProps) {
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
    const top = el.getBoundingClientRect().top + window.scrollY;
    scroll.scrollTo(top);
  };

  const goToChild = (link: MenuLink) => {
    if (link.workId && onOpenWork) {
      onOpenWork(link.workId);
      return;
    }
    goTo(link.id);
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
        金玺 JIN Xi
      </button>
      <div className="site-nav-menu">
        {MENU_ITEMS.map((item) => (
          <div key={item.id} className="site-nav-group">
            <button
              type="button"
              onClick={() => goTo(item.id)}
              className="nav-proximity-item site-nav-trigger"
              data-nav-proximity
              aria-haspopup="menu"
            >
              {item.label}
            </button>
            <div className="site-nav-dropdown" role="menu">
              {item.children.map((link) => (
                <button
                  key={`${item.id}-${link.label}`}
                  type="button"
                  role="menuitem"
                  onClick={() => goToChild(link)}
                  className="site-nav-dropdown-item"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
