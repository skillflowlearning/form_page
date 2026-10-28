import { useState, useEffect } from 'react';
import FlowArt, { FlowSection } from '@/components/ui/story-scroll';
import logoImg from '@/assets/image/logo_cropped.png';
import frontImg from '@/assets/image/frontimage_cropped.png';
import {
  Award,
  CheckCircle,
  Code,
  Sparkles,
  ArrowRight,
  BookOpen,
  Layers,
  Compass,
  Clock,
  Briefcase,
  UserCheck,
  FileText,
  FileCheck,
} from 'lucide-react';
import ContactWithGlobe from '@/components/ui/contact-with-globe';

export default function SkillFlowLanding() {
  const [showContactPage, setShowContactPage] = useState(false);

  useEffect(() => {
    const handleHash = () => {
      setShowContactPage(window.location.hash === '#contact');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const openContact = () => {
    window.location.hash = 'contact';
    setShowContactPage(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const closeContact = () => {
    setShowContactPage(false);
    if (window.location.hash === '#contact') {
      window.history.pushState(null, '', window.location.pathname);
    }
  };

  const goToForm = () => {
    openContact();
  };

  const scrollToStep1 = () => {
    const step1 = document.getElementById("step-1");
    if (step1) {
      step1.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    }
  };

  if (showContactPage) {
    return <ContactWithGlobe onBack={closeContact} isFullPage={true} />;
  }

  return (
    <FlowArt aria-label="SkillFlowLearn Journey">
      {/* 01 — HERO */}
      <section
        data-flow-section
        aria-label="SkillFlowLearn Hero"
        className="relative min-h-screen w-full overflow-hidden bg-[#0B0F19] text-white flex flex-col justify-between"
      >
        <div
          data-flow-inner
          className="flow-art-container relative flex min-h-screen w-full flex-col justify-between px-[4vw] pt-[clamp(2rem,8vw,4vw)] pb-[4vw] will-change-transform overflow-hidden"
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
                onClick={openContact}
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
                LMS Login
              </a>
            </nav>
          </header>

          {/* Left Content */}
          <div className="relative z-20 my-auto pt-[clamp(1rem,4vw,2rem)] pb-[clamp(2rem,6vw,4rem)] max-w-[540px] xl:max-w-[580px]">
            {/* Title */}
            <h1 className="font-sans font-extrabold text-white text-[clamp(2.75rem,5.6vw,5.6rem)] leading-[0.96] tracking-tight uppercase select-none">
              About
              <br />
              <span className="text-blue-500">SkillFlow</span>
              <br />
              Learning
            </h1>

            {/* Subtitle */}
            <p className="text-[clamp(0.9rem,1.3vw,1.25rem)] font-normal leading-snug text-white mt-3 sm:mt-5 max-w-[44ch]">
              We're Changing the Way the World Learns.
            </p>

            {/* Description */}
            <p className="text-[clamp(0.78rem,1.05vw,1.05rem)] font-light leading-relaxed text-slate-300 mt-2 sm:mt-3 max-w-[44ch]">
              SkillFlow was founded on a simple, powerful idea: everyone, everywhere deserves access to high-quality education. We are a team of passionate educators, technologists, and innovators dedicated to creating a global community of lifelong learners.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 mt-4 sm:mt-8">
              <button
                onClick={goToForm}
                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all duration-200 shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
              >
                Register Now <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={scrollToStep1}
                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-xl font-normal border border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all duration-200 text-sm sm:text-base cursor-pointer text-center"
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
              className="h-[48vh] sm:h-[58vh] md:h-[66vh] lg:h-[72vh] xl:h-[76vh] 2xl:h-[78vh] max-h-[740px] w-auto object-contain object-bottom select-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            />
          </div>

          {/* Bottom indicator */}
          <div className="relative z-20 pb-2 sm:pb-4 text-[10px] sm:text-sm text-slate-400 font-light flex items-center gap-1.5 sm:gap-2">
            <span>Scroll down to explore the 5 steps</span>
            <span className="animate-bounce">↓</span>
          </div>
        </div>
      </section>

      {/* 02 — STEP 1 */}
      <FlowSection
        aria-label="Step 1 - Before Training"
        style={{ backgroundColor: '#fd5200', color: '#ffffff' }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em]">01 — Step 1: Before Training</p>
        <hr className="my-3 border-none border-t border-black/30" />

        <div>
          <p className="text-sm font-semibold tracking-wider uppercase opacity-90 mb-1">
            No Prior Experience Required
          </p>
          <h2 className="text-[clamp(3rem,10vw,11rem)] font-bold leading-[0.92] uppercase tracking-tight">
            Before
            <br />
            Training
            <br />
            Begins
          </h2>
        </div>

        <hr className="my-3 border-none border-t border-black/30" />

        <p className="max-w-[55ch] text-[clamp(1.05rem,2.2vw,1.85rem)] font-normal leading-relaxed">
          Zero prior background needed. Whether you are from a non-tech stream or starting from absolute scratch, we guide you through domain selection and complete orientation before day one.
        </p>

        <hr className="my-3 border-none border-t border-black/30" />

        <div className="flex flex-wrap gap-[3vw]">
          <div className="p-4 rounded-xl bg-black/10 backdrop-blur-sm flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-1">
              <Compass className="w-4 h-4 shrink-0" />
              <p className="text-sm font-bold uppercase tracking-wider">Zero Prerequisites</p>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              No prior coding background needed. Designed for beginners from all degree branches.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-black/10 backdrop-blur-sm flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 shrink-0" />
              <p className="text-sm font-bold uppercase tracking-wider">Personalized Career Guidance</p>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              Get 1-on-1 counseling to find the domain that best matches your strengths and career aspirations.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-black/10 backdrop-blur-sm flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-1">
              <Code className="w-4 h-4 shrink-0" />
              <p className="text-sm font-bold uppercase tracking-wider">Setup &amp; Onboarding</p>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              Hands-on assistance for developer environment setup and instant LMS walk-through.
            </p>
          </div>
        </div>
      </FlowSection>

      {/* 03 — STEP 2 */}
      <FlowSection
        aria-label="Step 2 - Training"
        style={{ backgroundColor: '#090a0f', color: '#ffffff' }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
          02 — Step 2: Training
        </p>
        <hr className="my-3 border-none border-t border-white/20" />

        <div>
          <p className="text-sm font-semibold tracking-wider uppercase text-blue-300 mb-1">
            Mentor-Led Learning
          </p>
          <h2 className="text-[clamp(3rem,10vw,11rem)] font-bold leading-[0.92] uppercase tracking-tight">
            Master
            <br />
            Core
            <br />
            Skills
          </h2>
        </div>

        <hr className="my-3 border-none border-t border-white/20" />

        <p className="max-w-[55ch] text-[clamp(1.05rem,2.2vw,1.85rem)] font-light leading-relaxed text-slate-200">
          Learn in a flexible hybrid format: interactive live sessions combined with mentor-led doubt sessions, 24+ hours of content, and 6 months of LMS access.
        </p>

        <hr className="my-3 border-none border-t border-white/20" />

        <div className="flex flex-wrap gap-[3vw]">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-1">
              <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />
              <p className="text-sm font-bold uppercase tracking-wider text-blue-400">Mentor-Led</p>
            </div>
            <p className="text-xs leading-relaxed opacity-80">
              Interactive live mentor sessions for personalized guidance, real-world coding, and doubt solving.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-4 h-4 text-blue-400 shrink-0" />
              <p className="text-sm font-bold uppercase tracking-wider text-blue-400">24+ Hours Content</p>
            </div>
            <p className="text-xs leading-relaxed opacity-80">
              Curated, high-yield structured curriculum covering modern frameworks and production workflows.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-1">
              <Layers className="w-4 h-4 text-blue-400 shrink-0" />
              <p className="text-sm font-bold uppercase tracking-wider text-blue-400">6 Months LMS Access</p>
            </div>
            <p className="text-xs leading-relaxed opacity-80">
              Extended 6-month access to re-watch lectures, download source code, and track assignments.
            </p>
          </div>
        </div>
      </FlowSection>

      {/* 04 — STEP 3 */}
      <FlowSection
        aria-label="Step 3 - Projects"
        style={{ backgroundColor: '#F5F0E8', color: '#000000' }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em]">03 — Step 3: Projects</p>
        <hr className="my-3 border-none border-t border-black/40" />

        <div>
          <p className="text-sm font-semibold tracking-wider uppercase opacity-75 mb-1">
            Build Tangible, Real-World Systems
          </p>
          <h2 className="text-[clamp(3rem,10vw,11rem)] font-bold leading-[0.92] uppercase tracking-tight">
            Major &amp;
            <br />
            Minor
            <br />
            Projects
          </h2>
        </div>

        <hr className="my-3 border-none border-t border-black/40" />

        <p className="max-w-[55ch] text-[clamp(1.05rem,2.2vw,1.85rem)] font-normal leading-relaxed">
          Move from theory to genuine execution. Deliver 1 targeted Minor Project to cement fundamentals and 1 production-ready Major Project to showcase in technical interviews.
        </p>

        <hr className="my-3 border-none border-t border-black/40" />

        <div className="flex flex-wrap gap-[3vw]">
          <div className="p-4 rounded-xl bg-black/5 border border-black/10 flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-1">
              <Layers className="w-4 h-4 text-orange-600 shrink-0" />
              <p className="text-sm font-bold uppercase tracking-wider">1 Minor Project</p>
            </div>
            <p className="text-xs leading-relaxed opacity-80">
              Targeted sprint project testing foundational concepts, state management, and API handling.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-black/5 border border-black/10 flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-1">
              <Code className="w-4 h-4 text-blue-600 shrink-0" />
              <p className="text-sm font-bold uppercase tracking-wider">1 Major Project</p>
            </div>
            <p className="text-xs leading-relaxed opacity-80">
              Comprehensive end-to-end application designed to solve real-world problems for your portfolio.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-black/5 border border-black/10 flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-sm font-bold uppercase tracking-wider">Mentor Code Review</p>
            </div>
            <p className="text-xs leading-relaxed opacity-80">
              Live GitHub pull request reviews, architecture guidance, and industry-grade deployment tips.
            </p>
          </div>
        </div>
      </FlowSection>

      {/* 05 — STEP 4 */}
      <FlowSection
        aria-label="Step 4 - After Training"
        style={{ backgroundColor: '#1A3DE8', color: '#ffffff' }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em]">04 — Step 4: After Training</p>
        <hr className="my-3 border-none border-t border-white/40" />

        <div>
          <p className="text-sm font-semibold tracking-wider uppercase opacity-90 mb-1">
            Certifications &amp; Recommendations
          </p>
          <h2 className="text-[clamp(3rem,10vw,11rem)] font-bold leading-[0.92] uppercase tracking-tight">
            Dual
            <br />
            Certificates
            <br />
            &amp; LOR
          </h2>
        </div>

        <hr className="my-3 border-none border-t border-white/40" />

        <p className="max-w-[55ch] text-[clamp(1.05rem,2.2vw,1.85rem)] font-light leading-relaxed">
          Earn verified proof of your hard work. Receive dual certifications validating course completion and internship project delivery, plus a performance-backed Letter of Recommendation.
        </p>

        <hr className="my-3 border-none border-t border-white/40" />

        <div className="flex flex-wrap gap-[3vw]">
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-1">
              <Award className="w-5 h-5 text-amber-300 shrink-0" />
              <p className="text-sm font-bold uppercase tracking-wider">Training Certificate</p>
            </div>
            <p className="text-xs leading-relaxed opacity-80">
              Official credential awarded upon successful completion of curriculum modules and assignments.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-1">
              <Award className="w-5 h-5 text-amber-300 shrink-0" />
              <p className="text-sm font-bold uppercase tracking-wider">Internship Certificate</p>
            </div>
            <p className="text-xs leading-relaxed opacity-80">
              Industry internship certificate validating practical project execution and milestone delivery.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-1">
              <FileCheck className="w-5 h-5 text-emerald-300 shrink-0" />
              <p className="text-sm font-bold uppercase tracking-wider">LOR (Recommendation)</p>
            </div>
            <p className="text-xs leading-relaxed opacity-80">
              Formal Letter of Recommendation highlighting your project performance for job and masters applications.
            </p>
          </div>
        </div>
      </FlowSection>

      {/* 06 — STEP 5 */}
      <FlowSection
        aria-label="Step 5 - Add-ons"
        style={{ backgroundColor: '#0B132B', color: '#ffffff' }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">05 — Step 5: Add-Ons</p>
        <hr className="my-3 border-none border-t border-cyan-400/30" />

        <div>
          <p className="text-sm font-semibold tracking-wider uppercase text-cyan-300 mb-1">
            Complete Career Acceleration
          </p>
          <h2 className="text-[clamp(3rem,10vw,11rem)] font-bold leading-[0.92] uppercase tracking-tight">
            Career
            <br />
            Support &amp;
            <br />
            Add-Ons
          </h2>
        </div>

        <hr className="my-3 border-none border-t border-cyan-400/30" />

        <p className="max-w-[55ch] text-[clamp(1.05rem,2.2vw,1.85rem)] font-light leading-relaxed text-slate-200">
          We bridge the gap from learning to getting hired. Benefit from dedicated placement assistance, real-time mock interview rounds, and professional ATS resume optimization.
        </p>

        <hr className="my-3 border-none border-t border-cyan-400/30" />

        <div className="flex flex-wrap gap-[3vw]">
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-cyan-400/20 flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-1">
              <Briefcase className="w-5 h-5 text-cyan-300 shrink-0" />
              <p className="text-sm font-bold uppercase tracking-wider text-cyan-300">Job Assistance</p>
            </div>
            <p className="text-xs leading-relaxed opacity-80">
              Dedicated placement assistance, partner company referrals, and active hiring updates.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-cyan-400/20 flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-1">
              <UserCheck className="w-5 h-5 text-cyan-300 shrink-0" />
              <p className="text-sm font-bold uppercase tracking-wider text-cyan-300">Mock Interviews</p>
            </div>
            <p className="text-xs leading-relaxed opacity-80">
              1-on-1 technical and HR mock interviews with detailed constructive feedback from senior mentors.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-cyan-400/20 flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-5 h-5 text-cyan-300 shrink-0" />
              <p className="text-sm font-bold uppercase tracking-wider text-cyan-300">Resume Building</p>
            </div>
            <p className="text-xs leading-relaxed opacity-80">
              ATS-compliant resume reviews, GitHub portfolio polishing, and LinkedIn profile optimization.
            </p>
          </div>
        </div>

        <hr className="my-3 border-none border-t border-cyan-400/30" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-auto">
          <p className="text-base font-normal tracking-wide opacity-80">
            Fill out the form to register today and start building your future.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={goToForm}
              className="px-8 py-3.5 rounded-xl font-bold bg-white text-blue-900 hover:bg-slate-100 transition-all duration-200 shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
            >
              Fill The Form
            </button>
            <button
              onClick={openContact}
              className="px-8 py-3.5 rounded-xl font-medium border border-white/30 bg-white/10 hover:bg-white/20 text-white transition-all duration-200 cursor-pointer text-center"
            >
              Talk To Us
            </button>
          </div>
        </div>
      </FlowSection>
    </FlowArt>
  );
}
