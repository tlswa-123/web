import { ScrollProvider } from "./components/scroll-provider";
import { Preloader } from "./components/preloader";
import { NavBar } from "./components/nav-bar";
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
        <NavBar />
        <main id="top">
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
