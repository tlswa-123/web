import { createContext, useContext } from "react";
import type { DampedScroll } from "./scroll";

/** 全局滚动实例上下文，供各 section 读取 */
export const ScrollContext = createContext<DampedScroll | null>(null);

export function useScroll() {
  const s = useContext(ScrollContext);
  if (!s) throw new Error("useScroll must be inside <ScrollProvider>");
  return s;
}
