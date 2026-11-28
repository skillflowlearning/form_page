import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Gift,
  Trophy,
  Crown,
  Target,
  BookOpen,
  Zap,
  ArrowUpRight,
  Sparkles,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import type { WeeklyRankedStudent } from "@/lib/quiz-backend";
import { SOCIAL_LINKS } from "@/lib/constants";

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export interface ColorfulBentoGridProps {
  totalScore: number;
  myRank: number | null;
  weeklyWinners: WeeklyRankedStudent[];
  playedCount: number;
  totalQuizzes: number;
  availableCount: number;
  currentUserId?: string;
  onOpenQuizzes: () => void;
  className?: string;
}

export const ColorfulBentoGrid = ({
  totalScore,
  myRank,
  weeklyWinners,
  playedCount,
  totalQuizzes,
  availableCount,
  currentUserId,
  onOpenQuizzes,
  className,
}: ColorfulBentoGridProps) => {
  const [hasSharedLinkedIn, setHasSharedLinkedIn] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sf_linkedin_shared") === "true";
  });

  const handleLinkedInShare = () => {
    window.open(SOCIAL_LINKS.linkedinShareUrl, "_blank", "noopener,noreferrer");
    setHasSharedLinkedIn(true);
    localStorage.setItem("sf_linkedin_shared", "true");
  };

  const handleWhatsAppProof = () => {
    if (!hasSharedLinkedIn) return;
    window.open(SOCIAL_LINKS.whatsappProofUrl, "_blank", "noopener,noreferrer");
  };

  const handleInstagramFollow = () => {
    window.open(SOCIAL_LINKS.instagramUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      id="quiz-bento-hub"
      className={cn(
        "bg-white rounded-3xl p-4 sm:p-6 md:p-8 max-w-6xl mx-auto text-[#0A0A0A]",
        className
      )}
    >
      {/* Top Intro Header */}
      <div className="flex flex-col md:flex-row items-end justify-between w-full">
        <div className="flex flex-col my-3 sm:my-6 md:my-10 w-full items-start justify-start gap-3 sm:gap-4">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-start md:items-end w-full justify-between">
            <h2 className="relative text-2xl sm:text-4xl md:text-5xl font-sans font-semibold max-w-xl text-left leading-[1.1] text-[#0A0A0A]">
              Your skill progress, <br />
              <span>
                <Gift
                  className="inline-flex text-[#439775] fill-[#439775]/10 rotate-12 mr-1.5 w-7 h-7 sm:w-9 sm:h-9"
                  strokeWidth={2}
                />
              </span>
              live &amp; ranked.
            </h2>
            <p className="max-w-sm font-semibold text-xs sm:text-base text-[#222222]/55">
              Compete in live skill quizzes, review your answers instantly, and climb to the top of the student leaderboard.
            </p>
          </div>

          <div className="flex flex-wrap flex-row text-[#439775] gap-3 sm:gap-6 items-start justify-start">
            <p className="text-xs sm:text-base whitespace-nowrap font-medium">
              +{totalScore} Total Points
            </p>
            <p className="text-xs sm:text-base whitespace-nowrap font-medium">
              Rank #{myRank ?? "--"} Globally
            </p>
            <p className="text-xs sm:text-base whitespace-nowrap font-medium">
              {playedCount} Quizzes Played
            </p>
          </div>
        </div>
      </div>

      {/* 7-Card Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 md:items-start md:justify-start gap-4">
        {/* Card 1 (2-col span, Mint Green): Your Score */}
        <div
          onClick={onOpenQuizzes}
          className="md:col-span-2 overflow-hidden hover:scale-[1.01] hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] hover:rotate-1 transition-all duration-200 ease-in-out min-h-[220px] sm:h-[330px] relative bg-[#439775]/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 justify-between p-5 sm:px-6 sm:py-6 cursor-pointer"
        >
          <div className="relative flex flex-col items-start justify-center gap-0">
            <p className="-rotate-1 ml-2 sm:ml-3 mb-1.5 text-xs sm:text-sm font-medium text-[#0A0A0A]">
              Current Score
            </p>
            <h3 className="-rotate-1 text-xl sm:text-3xl whitespace-nowrap font-semibold text-center px-5 sm:px-6 py-2 sm:py-2.5 bg-[#0A0A0A]/90 text-white rounded-full">
              {totalScore} Points
            </h3>
            <p className="mt-3 sm:mt-4 ml-1 text-xs font-medium text-[#222222]/70 max-w-xs">
              Rank Progress: {Math.min(totalScore, 100)} / 100 pts to next milestone
            </p>
          </div>

          <div className="w-full sm:w-56 bg-white/75 backdrop-blur-sm rounded-2xl p-4 sm:p-5 flex flex-col gap-2.5 sm:gap-3 border border-[#0A0A0A]/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#222222]/60">
                Total Score
              </span>
              <Trophy className="w-5 h-5 text-[#439775] rotate-12" />
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-[#0A0A0A]">
              {totalScore}
            </div>
            <div className="h-2 w-full bg-[#0A0A0A]/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#439775] rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalScore / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2 (Lavender): Weekly Winners */}
        <div className="overflow-hidden md:hover:scale-105 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] hover:rotate-3 transition-all duration-200 ease-in-out relative bg-[#454ADE]/20 min-h-[240px] sm:h-[330px] rounded-xl flex flex-col items-center justify-between px-4 py-5 sm:py-6">
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="rotate-6 mb-1 text-xs sm:text-sm font-medium text-[#0A0A0A]">
              Weekly Winners
            </p>
            <h3 className="rotate-6 text-lg sm:text-2xl font-semibold text-center px-5 sm:px-6 py-2 bg-[#0A0A0A]/90 text-white rounded-full inline-flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#FFF07C]" />
              Weekly Winners
            </h3>
          </div>

          <div className="w-full flex flex-col gap-2 mt-4">
            {weeklyWinners.map((entry) => (
              <div
                key={entry.student_id}
                className={cn(
                  "w-full px-3.5 py-2 rounded-xl flex items-center justify-between text-xs font-medium bg-white/80 text-[#0A0A0A]",
                  entry.student_id === currentUserId && "ring-2 ring-[#454ADE]"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-[#454ADE]">#{entry.rank}</span>
                  <span className="truncate font-semibold">{entry.name}</span>
                </div>
                <span className="font-bold shrink-0">{entry.weekly_score} pts</span>
              </div>
            ))}
            {weeklyWinners.length === 0 && (
              <p className="text-xs text-[#222222]/60 text-center py-4">
                No weekly scores yet.
              </p>
            )}
          </div>
        </div>

        {/* Card 3 (Butter Yellow): Your Rank */}
        <div className="overflow-hidden md:hover:scale-105 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] hover:-rotate-3 transition-all duration-200 ease-in-out relative bg-[#FFF07C]/25 min-h-[210px] sm:h-[330px] rounded-xl flex flex-col items-center justify-between px-5 py-5 sm:py-6 gap-4">
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="-rotate-3 mb-1 text-xs sm:text-sm font-medium text-[#0A0A0A]">
              Global Standing
            </p>
            <h3 className="-rotate-3 text-lg sm:text-2xl font-semibold text-center px-5 sm:px-6 py-2 bg-[#0A0A0A]/90 text-white rounded-full inline-flex items-center gap-2">
              <Target className="w-4 h-4 text-[#FFF07C]" />
              Your Rank
            </h3>
          </div>

          <div className="w-full bg-white/75 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center gap-1">
            <span className="text-4xl sm:text-5xl font-bold text-[#0A0A0A]">
              #{myRank ?? "--"}
            </span>
            <span className="text-xs font-medium text-[#222222]/60">
              Score: {totalScore} pts
            </span>
          </div>
        </div>

        {/* Card 4 (Soft Gray): Quizzes Played */}
        <div
          onClick={onOpenQuizzes}
          className="overflow-hidden md:hover:scale-105 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] hover:rotate-4 transition-all duration-200 ease-in-out relative bg-[#f0f0f0] min-h-[190px] sm:h-[330px] rounded-xl flex flex-col items-center justify-center gap-3 px-5 py-5 sm:py-6 cursor-pointer"
        >
          <p className="-rotate-3 mb-1 text-xs sm:text-sm font-medium text-[#0A0A0A]">
            {playedCount} of {totalQuizzes} Completed
          </p>
          <h3 className="-rotate-3 text-lg sm:text-2xl font-semibold text-center px-5 sm:px-6 py-2 bg-white/85 text-[#0A0A0A] rounded-full shadow-sm inline-flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#439775]" />
            Quizzes Played
          </h3>
          <span className="text-xs font-medium text-[#222222]/60 mt-1 sm:mt-2 inline-flex items-center gap-1">
            View history <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Card 5 (Blush Pink): Play Active Contests */}
        <div
          onClick={onOpenQuizzes}
          className="overflow-hidden md:hover:scale-105 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] hover:-rotate-6 transition-all duration-200 ease-in-out relative bg-[#FF0F67]/20 min-h-[190px] sm:h-[330px] rounded-xl flex flex-col items-center justify-center gap-3 px-5 py-5 sm:py-6 cursor-pointer"
        >
          <p className="rotate-6 mb-1 text-xs sm:text-sm font-medium text-[#0A0A0A]">
            {availableCount} Active Contests
          </p>
          <h3 className="rotate-6 text-lg sm:text-2xl font-semibold text-center px-5 sm:px-6 py-2 bg-white/85 text-[#0A0A0A] rounded-full shadow-sm inline-flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#FF0F67]" />
            Play Quizzes
          </h3>
          <span className="text-xs font-medium text-[#222222]/60 mt-1 sm:mt-2 inline-flex items-center gap-1">
            Start a challenge <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* NEW CARD 1 (2-col span, Soft Sky/Cyan): Share & Earn 10 Points */}
        <div className="md:col-span-2 overflow-hidden md:rotate-1 md:hover:scale-[1.01] hover:shadow-[-6px_6px_32px_8px_rgba(58,191,248,0.25)] hover:-rotate-1 transition-all duration-200 ease-in-out min-h-[250px] sm:h-[330px] relative bg-[#3ABFF8]/20 rounded-xl flex flex-col justify-between p-5 sm:px-6 sm:py-6 gap-3">
          <div className="flex flex-col items-start gap-2">
            <span className="-rotate-2 text-xs sm:text-base font-semibold px-4 sm:px-5 py-1.5 bg-[#0A0A0A]/90 text-white rounded-full inline-flex items-center gap-2">
              <LinkedinIcon className="w-4 h-4 text-[#3ABFF8]" />
              Earn 10 Points
            </span>
            <p className="text-sm sm:text-base font-semibold text-[#0A0A0A] max-w-lg mt-1.5">
              Share this dashboard screenshot on LinkedIn and earn 10 points!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 my-1">
            <button
              type="button"
              onClick={handleLinkedInShare}
              className="px-5 py-3 rounded-full bg-[#0A0A0A]/90 hover:bg-[#0A0A0A] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <LinkedinIcon className="w-4 h-4 text-[#3ABFF8]" />
              Share on LinkedIn
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </button>

            <button
              type="button"
              onClick={handleWhatsAppProof}
              disabled={!hasSharedLinkedIn}
              className={cn(
                "px-5 py-3 rounded-full text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all",
                hasSharedLinkedIn
                  ? "bg-[#439775] hover:opacity-90 text-white cursor-pointer shadow-sm"
                  : "bg-white/60 text-[#222222]/40 cursor-not-allowed"
              )}
              title={
                hasSharedLinkedIn
                  ? "Submit your LinkedIn post screenshot on WhatsApp"
                  : "Share on LinkedIn first to unlock this button"
              }
            >
              <MessageCircle className="w-4 h-4" />
              Submit Proof on WhatsApp
            </button>
          </div>

          <p className="text-[11px] font-medium text-[#222222]/65">
            Points will be added manually by admin after verification
          </p>
        </div>

        {/* NEW CARD 2 (Soft Amber/Peach): What's Next */}
        <div className="overflow-hidden md:-rotate-2 md:hover:scale-105 hover:shadow-[-6px_6px_32px_8px_rgba(251,189,35,0.25)] hover:rotate-3 transition-all duration-200 ease-in-out relative bg-[#FBBD23]/20 min-h-[220px] sm:h-[330px] rounded-xl flex flex-col items-center justify-between px-5 py-5 sm:py-6 text-center gap-3">
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="rotate-3 mb-1 text-xs font-semibold uppercase tracking-wider text-[#0A0A0A]">
              What&apos;s Next
            </p>
            <h3 className="rotate-3 text-xl sm:text-2xl font-semibold text-center px-6 py-2 bg-[#0A0A0A]/90 text-white rounded-full inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FBBD23]" />
              Coming Soon
            </h3>
          </div>

          <p className="text-xs sm:text-sm font-medium text-[#222222]/80 leading-relaxed max-w-[230px]">
            New quiz formats, more rewards, and exciting updates coming soon!
          </p>

          <button
            type="button"
            onClick={handleInstagramFollow}
            className="w-full py-2.5 px-4 rounded-full bg-white/85 hover:bg-white text-[#0A0A0A] text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
          >
            <InstagramIcon className="w-4 h-4 text-[#FF0F67]" />
            Follow us on Instagram
          </button>
        </div>
      </div>
    </section>
  );
};

export default ColorfulBentoGrid;
