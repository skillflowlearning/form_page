import FlowArt, { FlowSection } from '@/components/ui/story-scroll';
import logoImg from '@/assets/image/logo_cropped.png';
import frontImg from '@/assets/image/frontimage_cropped.png';
import { Award, CheckCircle, Code, Sparkles, ArrowRight, BookOpen, Layers } from 'lucide-react';

export default function SkillFlowLanding() {
  const goToForm = () => {
    alert("Thank you for your interest! The registration form will open shortly.");
  };

  const scrollToStep1 = () => {
    const step1 = document.getElementById("step-1");
    if (step1) {
      step1.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    }
  };

  return (
    <FlowArt aria-label="SkillFlowLearn Journey">
      {/* 01 — HERO (MOBILE & DESKTOP OPTIMIZED) */}
      <section
        data-flow-section
        aria-label="SkillFlowLearn Hero"
        className="relative min-h-[100dvh] w-full overflow-hidden bg-[#0B0F19] text-white flex flex-col justify-between"
      >
        <div
          data-flow-inner
          className="flow-art-container relative flex min-h-[100dvh] w-full flex-col justify-between px-4 sm:px-10 lg:px-[70px] pt-4 sm:pt-9 pb-4 sm:pb-0 will-change-transform"
          style={{ transformOrigin: 'bottom left' }}
        >
          {/* Top Navbar */}
          <header className="w-full flex items-center justify-between z-30 pt-1">
            <a href="https://skillflowlearn.com/" className="inline-flex items-center transition-transform hover:scale-105 shrink-0">
              <img
                src={logoImg}
                alt="SkillFlow Logo"
                className="h-[28px] sm:h-[38px] md:h-[44px] w-auto object-contain"
              />
            </a>

            <nav className="flex items-center gap-3 sm:gap-7 md:gap-11 -translate-y-0.5 sm:-translate-y-1.5 mr-0 sm:mr-16 md:mr-28 lg:mr-40 xl:mr-56">
              <a
                href="https://skillflowlearn.com/"
                className="font-['Baskervville'] font-medium text-[13px] sm:text-[15px] md:text-[17px] leading-tight text-white hover:text-blue-400 transition-colors inline-flex items-center py-1"
              >
                Home
              </a>
              <button
                onClick={() => alert("Contact us at support@skillflowlearn.com")}
                className="font-['Rubik'] font-normal text-[13px] sm:text-[15px] md:text-[17px] leading-tight text-white hover:text-blue-400 transition-colors cursor-pointer inline-flex items-center py-1 whitespace-nowrap"
              >
                Contact us
              </button>
              <a
                href="https://skillflowlearning.edmingle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-['Rubik'] font-normal text-[13px] sm:text-[15px] md:text-[17px] leading-tight text-white hover:text-blue-400 transition-colors cursor-pointer inline-flex items-center py-1 whitespace-nowrap"
              >
                Log in
              </a>
            </nav>
          </header>

          {/* Left Content */}
          <div className="relative z-20 my-auto pt-4 sm:pt-2 pb-6 sm:pb-16 max-w-[540px] xl:max-w-[580px]">
            {/* Title */}
            <h1 className="font-sans font-extrabold text-white text-[clamp(2.4rem,7vw,5.6rem)] leading-[0.96] tracking-tight uppercase select-none">
              Skill
              <br />
              <span className="text-blue-500">Flow</span>
              <br />
              Learn
            </h1>

            {/* Description */}
            <p className="text-[clamp(0.875rem,1.2vw,1.15rem)] font-light leading-relaxed text-slate-300 mt-4 sm:mt-6 max-w-[44ch]">
              Not just theory, real skills. With SkillFlowLearn you move through 4 clear steps, from the basics all the way to a major project, and finish with a certificate that proves your hard work.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-5 sm:mt-8">
              <button
                onClick={goToForm}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all duration-200 shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
              >
                Register Now <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={scrollToStep1}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-normal border border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all duration-200 text-sm sm:text-base cursor-pointer text-center"
              >
                See How It Works
              </button>
            </div>
          </div>

          {/* Right: Boy Image */}
          <div className="absolute right-0 bottom-0 pointer-events-none z-10 flex items-end justify-end opacity-35 sm:opacity-100 transition-opacity">
            <img
              src={frontImg}
              alt="SkillFlow Student"
              className="h-[44vh] sm:h-[65vh] md:h-[75vh] lg:h-[84vh] xl:h-[90vh] max-h-[880px] w-auto object-contain object-bottom object-right select-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            />
          </div>

          {/* Bottom indicator */}
          <div className="relative z-20 pb-2 sm:pb-4 text-[11px] sm:text-sm text-slate-400 font-light flex items-center gap-2">
            <span>Scroll down to explore the 4 steps</span>
            <span className="animate-bounce">↓</span>
          </div>
        </div>
      </section>

      {/* 02 — STEP 1 */}
      <FlowSection
        aria-label="Step 1 - Basics"
        style={{ backgroundColor: '#fd5200', color: '#ffffff' }}
      >
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em]">01 — Step 1: Foundation</p>
        <hr className="my-2 sm:my-4 border-none border-t border-black/30" />

        <div>
          <p className="text-xs sm:text-sm md:text-base font-semibold tracking-wider uppercase opacity-90 mb-1 sm:mb-2">
            We Teach It The Easy Way
          </p>
          <h2 className="text-[clamp(2.2rem,6.5vw,8.5rem)] font-bold leading-[0.92] uppercase tracking-tight">
            Start
            <br />
            With The
            <br />
            Basics
          </h2>
        </div>

        <hr className="my-2 sm:my-4 border-none border-t border-black/30" />

        <p className="max-w-[52ch] text-[clamp(0.92rem,1.6vw,1.5rem)] font-normal leading-relaxed">
          In the first step we explain every concept from scratch. Simple language, live examples and doubt support help you build an unbreakable foundation.
        </p>

        <hr className="my-2 sm:my-4 border-none border-t border-black/30" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-5 rounded-xl bg-black/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <BookOpen className="w-4 h-4" />
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider">Zero Jargon</p>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed opacity-90">
              Clear, digestible explanations with interactive visual walkthroughs designed for absolute clarity.
            </p>
          </div>
          <div className="p-3.5 sm:p-5 rounded-xl bg-black/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <Code className="w-4 h-4" />
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider">Live Examples</p>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed opacity-90">
              Code along with real snippets rather than abstract formulas. Build muscle memory from day one.
            </p>
          </div>
          <div className="p-3.5 sm:p-5 rounded-xl bg-black/10 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4" />
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider">Doubt Support</p>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed opacity-90">
              Never get stuck. Direct answers and guidance whenever you hit a roadblock.
            </p>
          </div>
        </div>
      </FlowSection>

      {/* 03 — STEP 2 */}
      <FlowSection
        aria-label="Step 2 - Deep Learning"
        style={{ backgroundColor: '#090a0f', color: '#ffffff' }}
      >
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
          02 — Step 2: Mastery
        </p>
        <hr className="my-2 sm:my-4 border-none border-t border-white/20" />

        <div>
          <p className="text-xs sm:text-sm md:text-base font-semibold tracking-wider uppercase text-blue-300 mb-1 sm:mb-2">
            Understand Every Concept In Depth
          </p>
          <h2 className="text-[clamp(2.2rem,6.5vw,8.5rem)] font-bold leading-[0.92] uppercase tracking-tight">
            Go
            <br />
            Deeper
            <br />
            Always
          </h2>
        </div>

        <hr className="my-2 sm:my-4 border-none border-t border-white/20" />

        <p className="max-w-[52ch] text-[clamp(0.92rem,1.6vw,1.5rem)] font-light leading-relaxed text-slate-200">
          Now we build advanced topics on top of the basics. Each concept is studied in depth with practice questions and real-world cases, so you don&apos;t just memorize, you truly understand.
        </p>

        <hr className="my-2 sm:my-4 border-none border-t border-white/20" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-5 rounded-xl bg-white/5 border border-white/10">
            <p className="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-400">Architecture</p>
            <p className="text-xs sm:text-sm leading-relaxed opacity-80">
              Master state flows, performance bottlenecks, and scalable system patterns.
            </p>
          </div>
          <div className="p-3.5 sm:p-5 rounded-xl bg-white/5 border border-white/10">
            <p className="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-400">Real Cases</p>
            <p className="text-xs sm:text-sm leading-relaxed opacity-80">
              Analyze production-grade architectures and solve genuine engineering challenges.
            </p>
          </div>
          <div className="p-3.5 sm:p-5 rounded-xl bg-white/5 border border-white/10 sm:col-span-2 lg:col-span-1">
            <p className="mb-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-400">Mental Models</p>
            <p className="text-xs sm:text-sm leading-relaxed opacity-80">
              Develop intuition for complex code so you can debug like a senior engineer.
            </p>
          </div>
        </div>
      </FlowSection>

      {/* 04 — STEP 3 */}
      <FlowSection
        aria-label="Step 3 - Minor Projects"
        style={{ backgroundColor: '#F5F0E8', color: '#000000' }}
      >
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em]">03 — Step 3: Application</p>
        <hr className="my-2 sm:my-4 border-none border-t border-black/40" />

        <div>
          <p className="text-xs sm:text-sm md:text-base font-semibold tracking-wider uppercase opacity-75 mb-1 sm:mb-2">
            Put Your Learning To Use
          </p>
          <h2 className="text-[clamp(2.2rem,6.5vw,8.5rem)] font-bold leading-[0.92] uppercase tracking-tight">
            Minor
            <br />
            Projects
            <br />
            In Action
          </h2>
        </div>

        <hr className="my-2 sm:my-4 border-none border-t border-black/40" />

        <p className="max-w-[52ch] text-[clamp(0.92rem,1.6vw,1.5rem)] font-normal leading-relaxed">
          Apply what you&apos;ve learned in smaller, targeted projects. Every minor project builds your confidence and provides tangible, hands-on experience.
        </p>

        <hr className="my-2 sm:my-4 border-none border-t border-black/40" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-xl bg-black/5 border border-black/10">
            <div className="flex items-center gap-2 mb-1.5">
              <Layers className="w-4 h-4 text-orange-600" />
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider">Hands-on Practice</p>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed opacity-80">
              A small practical project after every module to cement your understanding immediately.
            </p>
          </div>
          <div className="p-4 sm:p-5 rounded-xl bg-black/5 border border-black/10">
            <div className="flex items-center gap-2 mb-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider">Mentor Feedback</p>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed opacity-80">
              Receive line-by-line review, optimization tips, and feedback from seasoned professionals.
            </p>
          </div>
          <div className="p-4 sm:p-5 rounded-xl bg-black/5 border border-black/10 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-1.5">
              <Code className="w-4 h-4 text-blue-600" />
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider">Portfolio Ready</p>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed opacity-80">
              Commit your code to GitHub with clean documentation and live deployed links.
            </p>
          </div>
        </div>
      </FlowSection>

      {/* 05 — STEP 4 */}
      <FlowSection
        aria-label="Step 4 - Major Project & Certificates"
        style={{ backgroundColor: '#1A3DE8', color: '#ffffff' }}
      >
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em]">04 — Step 4: Outcome</p>
        <hr className="my-2 sm:my-4 border-none border-t border-white/40" />

        <div>
          <p className="text-xs sm:text-sm md:text-base font-semibold tracking-wider uppercase opacity-90 mb-1 sm:mb-2">
            And Your Certificates
          </p>
          <h2 className="text-[clamp(2.2rem,6.5vw,8.5rem)] font-bold leading-[0.92] uppercase tracking-tight">
            Major
            <br />
            Project &amp;
            <br />
            Certified
          </h2>
        </div>

        <hr className="my-2 sm:my-4 border-none border-t border-white/40" />

        <p className="max-w-[55ch] text-[clamp(0.92rem,1.6vw,1.5rem)] font-light leading-relaxed">
          The final step of the course: a big, real-world major project for your portfolio. Once you complete it, you receive dual certificates that validate your expertise.
        </p>

        <hr className="my-2 sm:my-4 border-none border-t border-white/40" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-amber-300" />
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider">Certificate 1</p>
            </div>
            <h3 className="font-semibold text-sm sm:text-base mb-1">Course Completion Certificate</h3>
            <p className="text-xs sm:text-sm leading-relaxed opacity-80">
              Awarded when you complete all curriculum modules and code walkthroughs.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-amber-300" />
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider">Certificate 2</p>
            </div>
            <h3 className="font-semibold text-sm sm:text-base mb-1">Project / Internship Certificate</h3>
            <p className="text-xs sm:text-sm leading-relaxed opacity-80">
              Awarded upon successful review and submission of your full-scale major project.
            </p>
          </div>
        </div>

        <hr className="my-2 sm:my-4 border-none border-t border-white/40" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto">
          <p className="text-xs sm:text-sm md:text-base font-normal tracking-wide opacity-80">
            Fill out the form to register today and start building your future.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={goToForm}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold bg-white text-blue-900 hover:bg-slate-100 transition-all duration-200 shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
            >
              Fill The Form
            </button>
            <button
              onClick={() => alert("Our counselors are available. Reach out at support@skillflowlearn.com")}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-medium border border-white/30 bg-white/10 hover:bg-white/20 text-white transition-all duration-200 cursor-pointer text-center"
            >
              Talk To Us
            </button>
          </div>
        </div>
      </FlowSection>
    </FlowArt>
  );
}
