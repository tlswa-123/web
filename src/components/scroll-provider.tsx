import { useEffect, useState, type ReactNode } from "react";
import { DampedScroll } from "../lib/scroll";
import { ScrollContext } from "../lib/scroll-context";

/**
 * 全站滚动提供者：
 * 页面保持正常文档流（sticky / 布局完全原生），
 * 内核只接管滚轮增量，做阻尼插值后 window.scrollTo 驱动，
 * 既得到丝滑手感，又不破坏 position: sticky。
 */
export function ScrollProvider({ children }: { children: ReactNode }) {
  const [instance] = useState(() => new DampedScroll(0.12));

  useEffect(() => {
    instance.attach();
    return () => instance.detach();
  }, [instance]);

  return (
    <ScrollContext.Provider value={instance}>{children}</ScrollContext.Provider>
  );
}
