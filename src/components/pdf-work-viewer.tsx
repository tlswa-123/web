import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { NavBar } from "./nav-bar";

const THUMB_HEIGHT = 56;
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const scrollBehavior = (): ScrollBehavior => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

type Props = {
  src: string;
  title: string;
  pageCount: number;
  onClose: () => void;
  onNavigate: (section: string) => void;
};

export function PdfWorkViewer({ src, title, pageCount, onClose, onNavigate }: Props) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Array<HTMLElement | null>>([]);
  const scrollFrameRef = useRef(0);
  const restoreOffsetRef = useRef<number | null>(null);
  const dragRef = useRef<{ pointerId: number; offsetY: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [failedPages, setFailedPages] = useState<Set<number>>(() => new Set());
  const workId = src.split("/").pop()?.replace(/\.pdf$/i, "") ?? "";

  const syncScrollState = useCallback(() => {
    const area = scrollRef.current;
    if (!area) return;
    const max = Math.max(0, area.scrollHeight - area.clientHeight);
    const progress = max ? (area.scrollTop >= max - 1 ? 1 : clamp(area.scrollTop / max)) : 0;
    setScrollProgress(progress);
    const top = area.getBoundingClientRect().top;
    let pageNumber = 1;
    pageRefs.current.forEach((page, index) => {
      if (page && page.getBoundingClientRect().top <= top + 2) pageNumber = index + 1;
    });
    setCurrentPage(max > 0 && area.scrollTop >= max - 1 ? pageCount : pageNumber);
  }, [pageCount]);

  const handleScroll = useCallback(() => {
    if (scrollFrameRef.current) return;
    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = 0;
      syncScrollState();
    });
  }, [syncScrollState]);

  useLayoutEffect(() => {
    const previousTitle = document.title;
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    window.scrollTo(0, 0);
    document.title = `${title} · 作品`;
    scrollRef.current?.focus({ preventScroll: true });
    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      document.title = previousTitle;
      cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = 0;
    };
  }, [title]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const area = scrollRef.current;
    const content = contentRef.current;
    if (!viewer || !area || !content) return;
    // 导航、背景留白、进度条上的滚轮也只交给这一个滚动容器。
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? area.clientHeight : 1;
      area.scrollBy({ top: event.deltaY * unit, behavior: "instant" });
    };
    viewer.addEventListener("wheel", onWheel, { passive: false });
    const observer = new ResizeObserver(syncScrollState);
    observer.observe(area);
    observer.observe(content);
    syncScrollState();
    return () => {
      viewer.removeEventListener("wheel", onWheel);
      observer.disconnect();
    };
  }, [syncScrollState]);

  const scrollToAdjacentPage = useCallback((direction: -1 | 1) => {
    const area = scrollRef.current;
    if (!area) return;
    // 不用 scrollIntoView，它会连同祖先文档一起滚动。
    const origin = area.getBoundingClientRect().top;
    const offsets = pageRefs.current.flatMap((page) => page ? [page.getBoundingClientRect().top - origin + area.scrollTop] : []);
    const top = direction < 0
      ? offsets.reverse().find((offset) => offset < area.scrollTop - 2) ?? 0
      : offsets.find((offset) => offset > area.scrollTop + 2) ?? area.scrollHeight;
    area.scrollTo({ top, behavior: scrollBehavior() });
  }, []);

  const scrollToProgress = useCallback((progress: number) => {
    const area = scrollRef.current;
    if (area) area.scrollTo({ top: clamp(progress) * (area.scrollHeight - area.clientHeight), behavior: "instant" });
  }, []);

  const handleTrackPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) return;
    event.preventDefault();
    const rect = track.getBoundingClientRect();
    const usable = Math.max(1, rect.height - THUMB_HEIGHT);
    const localY = event.clientY - rect.top;
    const thumb = (event.target as HTMLElement).closest("[data-scroll-thumb]");
    const offsetY = thumb ? localY - scrollProgress * usable : THUMB_HEIGHT / 2;
    dragRef.current = { pointerId: event.pointerId, offsetY };
    track.setPointerCapture(event.pointerId);
    if (!thumb) scrollToProgress((localY - offsetY) / usable);
  };

  const handleTrackPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const track = trackRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !track) return;
    const rect = track.getBoundingClientRect();
    scrollToProgress((event.clientY - rect.top - drag.offsetY) / Math.max(1, rect.height - THUMB_HEIGHT));
  };

  const handleTrackPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const setExpanded = useCallback((expanded: boolean) => {
    if (isExpanded === expanded) return;
    const area = scrollRef.current;
    const content = contentRef.current;
    if (area && content) restoreOffsetRef.current = area.scrollTop / Math.max(1, content.clientHeight);
    setIsExpanded(expanded);
  }, [isExpanded]);

  useLayoutEffect(() => {
    const ratio = restoreOffsetRef.current;
    if (ratio !== null && scrollRef.current && contentRef.current) {
      scrollRef.current.scrollTop = ratio * contentRef.current.clientHeight;
      restoreOffsetRef.current = null;
    }
    syncScrollState();
  }, [isExpanded, syncScrollState]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "Escape") {
        if (isExpanded) setExpanded(false);
        else onClose();
      } else if (event.key === "+" || event.key === "=") setExpanded(true);
      else if (event.key === "-") setExpanded(false);
      else {
        const area = scrollRef.current;
        if (!area) return;
        if (event.key === " " && (event.target as HTMLElement).closest("button, a")) return;
        const steps: Record<string, number> = {
          ArrowDown: 80, ArrowUp: -80, PageDown: area.clientHeight * .9,
          PageUp: -area.clientHeight * .9, " ": area.clientHeight * (event.shiftKey ? -.9 : .9),
          Home: -area.scrollHeight, End: area.scrollHeight,
        };
        if (!(event.key in steps)) return;
        area.scrollBy({ top: steps[event.key], behavior: scrollBehavior() });
      }
      event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isExpanded, setExpanded, onClose]);

  const controlClass = "grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/12 bg-[#111021]/78 text-white/65 transition hover:border-[#ff8a4c]/55 hover:text-white focus-visible:outline-2 focus-visible:outline-[#ff8a4c] disabled:opacity-25";
  const thumbTop = `calc(${scrollProgress * 100}% - ${scrollProgress * THUMB_HEIGHT}px)`;

  return (
    <div ref={viewerRef} data-reader-page className="relative isolate flex h-dvh flex-col overflow-hidden bg-[#090812] pt-20 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_13%_0%,rgba(127,119,221,0.17),transparent_35%),radial-gradient(circle_at_86%_100%,rgba(255,138,76,0.10),transparent_34%)]" />
      <NavBar onNavigate={onNavigate} />
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 px-6 pb-3 md:px-10">
        <button type="button" onClick={onClose} className="flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-xs text-white/70 transition hover:border-[#ff8a4c]/55 hover:text-white" aria-label="返回作品页">
          <span aria-hidden="true">←</span> 返回作品
        </button>
        <h1 className="truncate text-xs tracking-[0.12em] text-white/50">{title} <span className="text-white/25">/ PDF</span></h1>
      </header>

      <main className="relative flex min-h-0 flex-1" aria-label={`${title} PDF 作品页`}>
        <div ref={scrollRef} id="pdf-document-scroll" onScroll={handleScroll} tabIndex={0}
          role="region" aria-label="PDF 连续阅读区域"
          className="pdf-work-scroll min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-none outline-none">
          <div ref={contentRef} data-pdf-document className="mx-auto select-none bg-white shadow-[0_20px_80px_rgba(0,0,0,0.4)]"
            style={{ width: isExpanded ? "100%" : "90%", maxWidth: isExpanded ? "none" : 1520 }}>
            {Array.from({ length: pageCount }, (_, index) => {
              const number = index + 1;
              return (
                <section key={number} ref={(node) => { pageRefs.current[index] = node; }} data-pdf-page={number}
                  className="relative m-0 w-full p-0" aria-label={`第 ${number} 页，共 ${pageCount} 页`}>
                  {failedPages.has(number) ? (
                    <div className="grid aspect-[2800/990] place-content-center gap-3 bg-[#17152b] text-center text-sm text-white/70">
                      <p>第 {number} 页加载失败</p>
                      <button type="button" className="text-[#ff8a4c]" onClick={() => setFailedPages((previous) => {
                        const next = new Set(previous); next.delete(number); return next;
                      })}>重新加载这一页</button>
                    </div>
                  ) : (
                    <img src={`/works/pages/${workId}/page-${number}.jpg`} alt={`${title} 第 ${number} 页`}
                      width={2800} height={990} loading={number === 1 ? "eager" : "lazy"} decoding="async" draggable={false}
                      className="block h-auto w-full" onLoad={syncScrollState}
                      onError={() => setFailedPages((previous) => new Set(previous).add(number))} />
                  )}
                </section>
              );
            })}
          </div>
        </div>

        <aside className="relative flex w-14 shrink-0 flex-col items-center px-1 pb-28 pt-3 md:w-28 md:pb-20" aria-label="PDF 页面导航">
          <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-2">
            <button type="button" onClick={() => scrollToAdjacentPage(-1)} disabled={scrollProgress <= 0} className={controlClass} aria-label="上一页">↑</button>
            <div ref={trackRef} role="scrollbar" tabIndex={0} aria-label="拖动浏览 PDF" aria-controls="pdf-document-scroll"
              aria-orientation="vertical" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(scrollProgress * 100)}
              aria-valuetext={`第 ${currentPage} 页，共 ${pageCount} 页`}
              className="relative min-h-16 max-h-[430px] w-8 flex-1 touch-none rounded-full border border-white/10 bg-[#111021]/62"
              onPointerDown={handleTrackPointerDown} onPointerMove={handleTrackPointerMove} onPointerUp={handleTrackPointerEnd}
              onPointerCancel={handleTrackPointerEnd} onLostPointerCapture={() => { dragRef.current = null; }}>
              <span className="pointer-events-none absolute bottom-3 left-1/2 top-3 w-px bg-white/15" />
              <span data-scroll-thumb className="absolute left-1/2 grid h-14 w-5 -translate-x-1/2 cursor-grab place-items-center rounded-full border border-[#ffb08a]/35 bg-[#ff8a4c]/85 shadow-[0_0_24px_rgba(255,138,76,0.32)] active:cursor-grabbing" style={{ top: thumbTop }}>
                <span className="h-3 w-px rounded-full bg-[#29182e]/60" />
              </span>
            </div>
            <p className="shrink-0 text-center text-[10px] tracking-[0.1em] text-white/48 tabular-nums" aria-live="polite">{String(currentPage).padStart(2, "0")} / {String(pageCount).padStart(2, "0")}</p>
            <button type="button" onClick={() => scrollToAdjacentPage(1)} disabled={scrollProgress >= 1} className={controlClass} aria-label="下一页">↓</button>
          </div>
          <div className="absolute bottom-4 flex flex-col rounded-full border border-white/12 bg-[#111021]/82 p-1 md:flex-row">
            <button type="button" onClick={() => setExpanded(true)} disabled={isExpanded} aria-label="让 PDF 进入完整大屏" aria-pressed={isExpanded}
              className="grid h-10 w-10 place-items-center rounded-full text-2xl font-light text-white/75 transition hover:bg-white/10 disabled:bg-[#ff8a4c] disabled:text-[#24152b]">+</button>
            <button type="button" onClick={() => setExpanded(false)} disabled={!isExpanded} aria-label="让 PDF 退出完整大屏"
              className="grid h-10 w-10 place-items-center rounded-full text-2xl font-light text-white/75 transition hover:bg-white/10 disabled:opacity-25">−</button>
          </div>
        </aside>
      </main>
    </div>
  );
}
