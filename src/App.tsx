import { useCallback, useEffect, useState } from "react";
import { PdfWorkViewer } from "./components/pdf-work-viewer";
import { WORKS } from "./lib/works";
import { useScroll } from "./lib/scroll-context";
import { ScrollProvider } from "./components/scroll-provider";
import { Preloader } from "./components/preloader";
import { NavBar } from "./components/nav-bar";
import { GlobalBackground } from "./components/global-background";
import { HeroParallax } from "./sections/hero-parallax";
import { ResumeSection } from "./sections/resume-section";
import { ExperienceSection } from "./sections/experience-section";
import { WorkSection } from "./sections/work-section";
import {
  ContactSection,
} from "./sections/placeholder-sections";

function SectionDestination({ section }: { section: string }) {
  const scroll = useScroll();
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const element = document.getElementById(section);
      if (element) scroll.scrollTo(element.getBoundingClientRect().top + window.scrollY, true);
    });
    return () => cancelAnimationFrame(frame);
  }, [section, scroll]);
  return null;
}

export default function App() {
  const [location, setLocation] = useState(() => window.location.href);
  const url = new URL(location);
  const work = WORKS.find((item) => item.id === url.searchParams.get("work") && item.pdf);

  useEffect(() => {
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    const syncLocation = () => setLocation(window.location.href);
    window.addEventListener("popstate", syncLocation);
    window.addEventListener("hashchange", syncLocation);
    return () => {
      history.scrollRestoration = previousRestoration;
      window.removeEventListener("popstate", syncLocation);
      window.removeEventListener("hashchange", syncLocation);
    };
  }, []);

  const navigateToSection = useCallback((section: string, replace = false) => {
    const next = new URL(window.location.href);
    next.searchParams.delete("work");
    next.hash = section;
    history[replace ? "replaceState" : "pushState"]({}, "", next);
    setLocation(next.href);
  }, []);

  const openWork = useCallback((id: string) => {
    if (!WORKS.some((item) => item.id === id && item.pdf)) return;
    const origin = new URL(window.location.href);
    origin.hash = "work";
    history.replaceState(history.state, "", origin);
    const next = new URL(origin);
    next.hash = "";
    next.searchParams.set("work", id);
    history.pushState({ portfolioWorkViewer: true, portfolioReturnSection: "work" }, "", next);
    setLocation(next.href);
  }, []);

  const closeWork = useCallback(() => {
    if (history.state?.portfolioReturnSection === "work") history.back();
    else navigateToSection("work", true);
  }, [navigateToSection]);

  // 路由互斥：阅读页绝不挂载个人网站或它的全局滚轮控制器。
  if (work) {
    return <PdfWorkViewer key={work.id} src={work.pdf!} title={work.title}
      pageCount={work.pageCount} onClose={closeWork} onNavigate={navigateToSection} />;
  }

  return (
    <Preloader>
      <ScrollProvider>
        <SectionDestination section={url.hash.slice(1) || "top"} />
        {/* 全局唯一背景层：fixed定位，挂载一次，贯穿首页→简历→经历→作品全程 */}
        <GlobalBackground />
        <NavBar />
        <main id="top" className="relative">
          <HeroParallax />
          <ResumeSection />
          <ExperienceSection />
          <WorkSection onOpenWork={openWork} />
          <ContactSection />
        </main>
      </ScrollProvider>
    </Preloader>
  );
}
