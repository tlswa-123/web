import { ScrollProvider } from "./components/scroll-provider";
import { Preloader } from "./components/preloader";
import { NavBar } from "./components/nav-bar";
import { GlobalBackground } from "./components/global-background";
import { HeroParallax } from "./sections/hero-parallax";
import { ResumeSection } from "./sections/resume-section";
import { WorkSection } from "./sections/work-section";
import {
  AboutSection,
  ContactSection,
} from "./sections/placeholder-sections";

export default function App() {
  return (
    <Preloader>
      <ScrollProvider>
        {/* 全局唯一背景层：fixed定位，挂载一次，贯穿首页→简历→作品全程，
            见 global-background.tsx 顶部注释说明为何必须做成单一实例 */}
        <GlobalBackground />
        <NavBar />
        <main id="top" className="relative">
          <HeroParallax />
          <ResumeSection />
          <WorkSection />
          <AboutSection />
          <ContactSection />
        </main>
      </ScrollProvider>
    </Preloader>
  );
}
