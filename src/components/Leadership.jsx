import { Calendar, Palette, ShieldCheck, Users } from "lucide-react";
import { memo } from "react";
import { leadership } from "../constants";
import { SectionWrapper } from "../hoc";

const leadershipTags = {
  1: [
    "Visual Identity",
    "Event Collateral",
    "Fintech Workshops",
    "Brand Architecture",
  ],
  2: [
    "UI Deliverables",
    "Competitive Recruitment",
    "Cross-Functional Collaboration",
  ],
};

const LeadershipCard = memo(({ item }) => {
  const { id, title, organization, period, highlights, profilePic } = item;
  const tags = leadershipTags[id] || ["Design Direction", "Community Impact"];

  return (
    <div className="group relative rounded-3xl bg-zinc-900/60 border border-white/10 p-4 sm:p-8 backdrop-blur-xl hover:border-cyan-400/40 transition-all duration-300 shadow-2xl overflow-hidden flex flex-col justify-between">
      {/* Specular top reflection line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Ambient optical flare */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 group-hover:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-700 -mr-16 -mt-16" />

      <div className="relative z-10 space-y-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {profilePic ? (
              <div className="w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] rounded-2xl bg-zinc-900/90 border border-white/15 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-lg group-hover:border-cyan-400/40 transition-colors">
                <img
                  src={profilePic}
                  alt={organization}
                  className="w-full h-full max-w-full max-h-full object-contain"
                  width={48}
                  height={48}
                />
              </div>
            ) : (
              <div className="w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] rounded-2xl bg-zinc-900/90 border border-white/15 flex items-center justify-center shrink-0">
                <Palette size={22} className="text-cyan-400" />
              </div>
            )}

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                <Users size={12} />
                <span>Executive Role</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                {organization}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-zinc-300 flex items-center gap-1.5 shadow-sm">
              <Calendar size={12} className="text-cyan-400" />
              <span>{period}</span>
            </span>
            {period.includes("Present") && (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Leadership
              </span>
            )}
          </div>
        </div>

        {/* Skill/Role Badges */}
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded-md bg-white/[0.04] border border-white/5 text-[11px] font-mono text-zinc-400 group-hover:text-zinc-300 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Deliverables / Highlights List */}
        <div className="space-y-2.5 pt-2 border-t border-white/10">
          {highlights.map((highlight, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal"
            >
              <span className="text-cyan-400 font-mono font-bold mt-0.5 shrink-0 select-none">
                ›
              </span>
              <span>{highlight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card Footer Status */}
      <div className="relative z-10 pt-4 mt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-500">
        <span className="flex items-center gap-1.5 text-zinc-400">
          <ShieldCheck size={13} className="text-cyan-400" />
          Verified Campus Record
        </span>
        <span className="text-zinc-500">VIT Bhopal University</span>
      </div>
    </div>
  );
});

LeadershipCard.displayName = "LeadershipCard";

const Leadership = () => {
  return (
    <div className="space-y-10" id="leadership">
      {/* Editorial Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-400">
            <span className="text-cyan-400 font-bold">07</span>
            <span>&bull;</span>
            <span>Leadership &amp; Impact</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Leadership &amp; Community Direction
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl font-normal">
            Creative direction, visual branding architecture for student fintech
            organizations, and campus initiatives.
          </p>
        </div>
      </div>

      {/* Structured Leadership Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {leadership.map((item, idx) => (
          <LeadershipCard key={item.id || idx} item={item} />
        ))}
      </div>
    </div>
  );
};

const WrappedLeadership = SectionWrapper(memo(Leadership), "leadership");
WrappedLeadership.displayName = "WrappedLeadership";
export default WrappedLeadership;
