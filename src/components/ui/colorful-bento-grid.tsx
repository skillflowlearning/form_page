import { cn } from "@/lib/utils";
import { Gift, Trophy, Crown, Target, BookOpen, Zap, ArrowUpRight } from "lucide-react";
import type { RankedStudent } from "@/lib/leaderboard";

export interface ColorfulBentoGridProps {
  totalScore: number;
  myRank: number | null;
  top3: RankedStudent[];
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
  top3,
  playedCount,
  totalQuizzes,
  availableCount,
  currentUserId,
  onOpenQuizzes,
  className,
}: ColorfulBentoGridProps) => {
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
        <div className="flex flex-col my-6 md:my-10 w-full items-start justify-start gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end w-full justify-between">
            <h2 className="relative text-3xl sm:text-4xl md:text-5xl font-sans font-semibold max-w-xl text-left leading-[1.05] text-[#0A0A0A]">
              Your skill progress, <br />
              <span>
                <Gift
                  className="inline-flex text-[#439775] fill-[#439775]/10 rotate-12 mr-2"
                  size={36}
                  strokeWidth={2}
                />
              </span>
              live &amp; ranked.
            </h2>
            <p className="max-w-sm font-semibold text-sm sm:text-base text-[#222222]/55">
              Compete in live skill quizzes, review your answers instantly, and climb to the top of the student leaderboard.
            </p>
          </div>

          <div className="flex flex-wrap flex-row text-[#439775] gap-6 items-start justify-start">
            <p className="text-sm sm:text-base whitespace-nowrap font-medium">
              +{totalScore} Total Points
            </p>
            <p className="text-sm sm:text-base whitespace-nowrap font-medium">
              Rank #{myRank ?? "--"} Globally
            </p>
            <p className="text-sm sm:text-base whitespace-nowrap font-medium">
              {playedCount} Quizzes Played
            </p>
          </div>
        </div>
      </div>

      {/* 5-Card Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 md:items-start md:justify-start gap-4">
        {/* Card 1 (2-col span, Mint Green): Your Score */}
        <div
          onClick={onOpenQuizzes}
          className="md:col-span-2 overflow-hidden hover:scale-[1.01] hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] hover:rotate-1 transition-all duration-200 ease-in-out min-h-[290px] sm:h-[330px] relative bg-[#439775]/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between px-6 py-6 cursor-pointer"
        >
          <div className="relative flex flex-col items-start justify-center gap-0">
            <p className="-rotate-1 ml-3 mb-1.5 text-sm font-medium text-[#0A0A0A]">
              Current Score
            </p>
            <h3 className="-rotate-1 text-2xl sm:text-3xl whitespace-nowrap font-semibold text-center px-6 py-2.5 bg-[#0A0A0A]/90 text-white rounded-full">
              {totalScore} Points
            </h3>
            <p className="mt-4 ml-1 text-xs font-medium text-[#222222]/70 max-w-xs">
              Rank Progress: {Math.min(totalScore, 100)} / 100 pts to next milestone
            </p>
          </div>

          <div className="w-full sm:w-56 bg-white/75 backdrop-blur-sm rounded-2xl p-5 flex flex-col gap-3 border border-[#0A0A0A]/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#222222]/60">
                Total Score
              </span>
              <Trophy className="w-5 h-5 text-[#439775] rotate-12" />
            </div>
            <div className="text-4xl font-bold text-[#0A0A0A]">
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

        {/* Card 2 (Lavender): Top 3 Leaderboard */}
        <div className="overflow-hidden md:hover:scale-105 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] hover:rotate-3 transition-all duration-200 ease-in-out relative bg-[#454ADE]/20 min-h-[300px] sm:h-[330px] rounded-xl flex flex-col items-center justify-between px-4 py-6">
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="rotate-6 mb-1 text-sm font-medium text-[#0A0A0A]">
              Live Standings
            </p>
            <h3 className="rotate-6 text-xl sm:text-2xl font-semibold text-center px-6 py-2 bg-[#0A0A0A]/90 text-white rounded-full inline-flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#FFF07C]" />
              Top 3 Leaders
            </h3>
          </div>

          <div className="w-full flex flex-col gap-2 mt-3">
            {top3.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "w-full px-3.5 py-2 rounded-xl flex items-center justify-between text-xs font-medium bg-white/80 text-[#0A0A0A]",
                  entry.id === currentUserId && "ring-2 ring-[#454ADE]"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-[#454ADE]">#{entry.rank}</span>
                  <span className="truncate font-semibold">{entry.name}</span>
                </div>
                <span className="font-bold shrink-0">{entry.total_score} pts</span>
              </div>
            ))}
            {top3.length === 0 && (
              <p className="text-xs text-[#222222]/60 text-center py-4">
                No scores recorded yet.
              </p>
            )}
          </div>
        </div>

        {/* Card 3 (Butter Yellow): Your Rank */}
        <div className="overflow-hidden md:hover:scale-105 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] hover:-rotate-3 transition-all duration-200 ease-in-out relative bg-[#FFF07C]/25 min-h-[290px] sm:h-[330px] rounded-xl flex flex-col items-center justify-between px-5 py-6">
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="-rotate-3 mb-1 text-sm font-medium text-[#0A0A0A]">
              Global Standing
            </p>
            <h3 className="-rotate-3 text-xl sm:text-2xl font-semibold text-center px-6 py-2 bg-[#0A0A0A]/90 text-white rounded-full inline-flex items-center gap-2">
              <Target className="w-4 h-4 text-[#FFF07C]" />
              Your Rank
            </h3>
          </div>

          <div className="w-full bg-white/75 rounded-2xl p-5 flex flex-col items-center justify-center gap-1">
            <span className="text-5xl font-bold text-[#0A0A0A]">
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
          className="overflow-hidden md:hover:scale-105 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] hover:rotate-4 transition-all duration-200 ease-in-out relative bg-[#f0f0f0] min-h-[290px] sm:h-[330px] rounded-xl flex flex-col items-center justify-center gap-3 px-5 py-6 cursor-pointer"
        >
          <p className="-rotate-3 mb-1 text-sm font-medium text-[#0A0A0A]">
            {playedCount} of {totalQuizzes} Completed
          </p>
          <h3 className="-rotate-3 text-xl sm:text-2xl font-semibold text-center px-6 py-2 bg-white/85 text-[#0A0A0A] rounded-full shadow-sm inline-flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#439775]" />
            Quizzes Played
          </h3>
          <span className="text-xs font-medium text-[#222222]/60 mt-2 inline-flex items-center gap-1">
            View history <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Card 5 (Blush Pink): Play Active Contests */}
        <div
          onClick={onOpenQuizzes}
          className="overflow-hidden md:hover:scale-105 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.25)] hover:-rotate-6 transition-all duration-200 ease-in-out relative bg-[#FF0F67]/20 min-h-[290px] sm:h-[330px] rounded-xl flex flex-col items-center justify-center gap-3 px-5 py-6 cursor-pointer"
        >
          <p className="rotate-6 mb-1 text-sm font-medium text-[#0A0A0A]">
            {availableCount} Active Contests
          </p>
          <h3 className="rotate-6 text-xl sm:text-2xl font-semibold text-center px-6 py-2 bg-white/85 text-[#0A0A0A] rounded-full shadow-sm inline-flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#FF0F67]" />
            Play Quizzes
          </h3>
          <span className="text-xs font-medium text-[#222222]/60 mt-2 inline-flex items-center gap-1">
            Start a challenge <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </section>
  );
};

export default ColorfulBentoGrid;
