import { ScrollProvider } from "./components/scroll-provider";
import { Preloader } from "./components/preloader";
import { NavBar } from "./components/nav-bar";
import { GlobalBackground } from "./components/global-background";
import { HeroParallax } from "./sections/hero-parallax";
import { ResumeSection } from "./sections/resume-section";
import { ExperienceSection } from "./sections/experience-section";
import { WorkSection } from "./sections/work-section";
import {
  AboutSection,
  ContactSection,
} from "./sections/placeholder-sections";

export default function App() {
  return (
    <Preloader>
      <ScrollProvider>
        {/* 全局唯一背景层：fixed定位，挂载一次，贯穿首页→简历→经历→作品全程 */}
        <GlobalBackground />
        <NavBar />
        <main id="top" className="relative">
          <HeroParallax />
          <ResumeSection />
          <ExperienceSection />
          <WorkSection />
          <AboutSection />
          <ContactSection />
        </main>
      </ScrollProvider>
    </Preloader>
  );
}
