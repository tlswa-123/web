import { useEffect, useState } from "react";

/**
 * 预加载图片，返回进度 0~1。
 * 加载完 + 最低展示时间到了才算 done，避免缓存太快动画一闪而过。
 */
export function usePreload(urls: string[], minDisplayMs = 1500) {
  const [loaded, setLoaded] = useState(0);
  const [minTimePassed, setMinTimePassed] = useState(false);

  const allLoaded = urls.length === 0 || loaded >= urls.length;
  const done = allLoaded && minTimePassed;

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), minDisplayMs);
    return () => clearTimeout(timer);
  }, [minDisplayMs]);

  useEffect(() => {
    let alive = true;
    let count = 0;
    urls.forEach((url) => {
      const img = new Image();
      const bump = () => {
        if (!alive) return;
        count += 1;
        setLoaded(count);
      };
      img.onload = bump;
      img.onerror = bump;
      img.src = url;
    });
    return () => {
      alive = false;
    };
  }, [urls.join("|")]);

  return { done, progress: urls.length ? loaded / urls.length : 1 };
}
