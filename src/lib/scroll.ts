/**
 * 阻尼滚动内核（借鉴 komato3 手写方案，去掉库依赖）
 * - 接管 wheel / touch，维护 current / target 两个滚动值
 * - rAF 中做指数阻尼插值，收敛后自动停机（省电）
 * - 提供 onScroll 订阅，供各动效模块读取 scrollTop
 */
export type ScrollListener = (scrollTop: number) => void;

export class DampedScroll {
  private target = 0;
  private current = 0;
  private max = 0;
  private raf = 0;
  private running = false;
  private listeners = new Set<ScrollListener>();
  private ease: number;

  constructor(ease = 0.12) {
    this.ease = ease;
  }

  attach() {
    this.current = window.scrollY;
    this.target = this.current;
    window.addEventListener("wheel", this.onWheel, { passive: false });
    window.addEventListener("resize", this.onResize);
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("scroll", this.onScroll, { passive: true });
    this.onResize();
    this.emit();
  }

  detach() {
    window.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("scroll", this.onScroll);
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.running = false;
  }

  subscribe(fn: ScrollListener) {
    this.listeners.add(fn);
    fn(this.current);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /** 平滑滚动到指定 Y（供锚点导航使用） */
  scrollTo(y: number, immediate = false) {
    this.onResize();
    this.target = this.clamp(y);
    if (immediate) {
      cancelAnimationFrame(this.raf);
      this.running = false;
      this.current = this.target;
      window.scrollTo(0, this.current);
      this.emit();
      return;
    }
    this.ensureRunning();
  }

  private onResize = () => {
    this.max = Math.max(0, document.body.scrollHeight - window.innerHeight);
    this.target = this.clamp(this.target);
  };

  // 外部触发的滚动（滚动条拖动、程序化 scrollTo、锚点）与内核状态同步
  private onScroll = () => {
    if (this.running) return; // 自己驱动时忽略
    const y = window.scrollY;
    if (Math.abs(y - this.current) > 2) {
      this.current = y;
      this.target = y;
      this.emit();
    }
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.target = this.clamp(this.target + e.deltaY);
    this.ensureRunning();
  };

  // 保留键盘可访问性（手写滚动会破坏它，这里补回）
  private onKey = (e: KeyboardEvent) => {
    const step = window.innerHeight * 0.9;
    const map: Record<string, number> = {
      PageDown: step,
      PageUp: -step,
      ArrowDown: 80,
      ArrowUp: -80,
      Home: -this.max,
      End: this.max,
      " ": step,
    };
    if (e.key in map) {
      e.preventDefault();
      this.target = this.clamp(this.target + map[e.key]);
      this.ensureRunning();
    }
  };

  private clamp(v: number) {
    return Math.min(this.max, Math.max(0, v));
  }

  private ensureRunning() {
    if (!this.running) {
      this.running = true;
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  private tick = () => {
    const diff = this.target - this.current;
    this.current += diff * this.ease;
    // 真正驱动页面滚动（保留原生 sticky/布局），再通知订阅者
    window.scrollTo(0, this.current);
    this.emit();
    // 收敛退出，避免 rAF 空转
    if (Math.abs(diff) < 0.4) {
      this.current = this.target;
      window.scrollTo(0, this.current);
      this.emit();
      this.running = false;
      return;
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  private emit() {
    for (const fn of this.listeners) fn(this.current);
  }

  get scrollTop() {
    return this.current;
  }
  get maxScroll() {
    return this.max;
  }
}
