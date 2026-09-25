import clsx from "clsx";
import { AnimatePresence, motion as Motion } from "framer-motion";
import {
  ArrowUpRight,
  Briefcase,
  Check,
  CheckCircle,
  Clock,
  Coffee,
  Copy,
  Cpu,
  ExternalLink,
  Github,
  GraduationCap,
  Linkedin,
  Loader,
  Mail,
  MapPin,
  MessageSquare,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import React, { memo, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { profile } from "../assets";
import { SectionWrapper } from "../hoc";
import DodgeButton from "./interactive/DodgeButton";

const TOPIC_PRESETS = [
  {
    icon: GraduationCap,
    label: "Internship",
    subject: "Internship Opportunity",
  },
  {
    icon: Briefcase,
    label: "Full-Time Role",
    subject: "Full-Time Software Engineering Role",
  },
  {
    icon: Cpu,
    label: "Applied AI / Systems Collab",
    subject: "Applied AI / Distributed Systems Project Collaboration",
  },
  {
    icon: Coffee,
    label: "Engineering Chat",
    subject: "Engineering Coffee Chat / Technical Discussion",
  },
];

const ContactForm = memo(() => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      name: "",
      reply_to: "",
      title: "",
      message: "",
    },
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const messageValue = watch("message", "");
  const currentTitle = watch("title", "");
  const messageLength = messageValue.length;

  const handleSelectTopic = useCallback(
    (subject) => {
      setValue("title", subject, { shouldValidate: true, shouldDirty: true });
    },
    [setValue],
  );

  // Builds formatted direct mailto URL for resilient client-side fallback
  const buildMailtoUrl = useCallback((data) => {
    const mailtoSubject = encodeURIComponent(
      data.title || "Portfolio Direct Inquiry",
    );
    const mailtoBody = encodeURIComponent(
      `Hi Saksham,\n\n${data.message || ""}\n\nBest regards,\n${data.name || "Colleague / Recruiter"}\nContact Email: ${data.reply_to || "Not provided"}`,
    );
    return `mailto:sakmmm07@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;
  }, []);

  // Builds formatted Gmail Web composer URL
  const buildGmailUrl = useCallback((data) => {
    const mailtoSubject = encodeURIComponent(
      data.title || "Portfolio Direct Inquiry",
    );
    const mailtoBody = encodeURIComponent(
      `Hi Saksham,\n\n${data.message || ""}\n\nBest regards,\n${data.name || "Colleague / Recruiter"}\nContact Email: ${data.reply_to || "Not provided"}`,
    );
    return `https://mail.google.com/mail/?view=cm&fs=1&to=sakmmm07@gmail.com&su=${mailtoSubject}&body=${mailtoBody}`;
  }, []);

  // Primary Submission: Transmits via Resend Gateway API (/api/send)
  // Falls back gracefully to mailto: if the API endpoint is unavailable (e.g., static hosting)
  const onSubmit = useCallback(
    async (data) => {
      setIsLoading(true);

      const mailtoUrl = buildMailtoUrl(data);

      // Graceful mailto fallback — opens pre-filled mail client so the message is never lost
      const fallbackToMailClient = () => {
        if (typeof window !== "undefined") {
          const link = document.createElement("a");
          link.href = mailtoUrl;
          link.target = "_self";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        setIsLoading(false);
        toast.info(
          "Opened pre-filled draft in your mail app. Click Send to deliver to sakmmm07@gmail.com!",
          {
            icon: <Mail size={18} className="text-cyan-400" />,
            duration: 6000,
          },
        );
      };

      try {
        const response = await fetch("/api/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok && result.success) {
          setIsSuccess(true);
          toast.success(
            "Message dispatched via Resend! Saksham has received your inquiry.",
            {
              icon: <CheckCircle size={18} className="text-emerald-400" />,
              duration: 5000,
            },
          );

          reset();
          setTimeout(() => {
            setIsSuccess(false);
            setIsLoading(false);
          }, 3500);
          return;
        }

        // If server responded with error, fall back to mail client
        throw new Error(result.error || "Resend transmission error");
      } catch {
        // Silently fall back to native mail client — no error toast shown
        fallbackToMailClient();
      }
    },
    [buildMailtoUrl, reset],
  );

  // Secondary Action: Open directly in Gmail in browser tab
  const handleOpenGmail = useCallback(() => {
    const currentData = {
      name: watch("name") || "",
      reply_to: watch("reply_to") || "",
      title: watch("title") || "Portfolio Inquiry",
      message: watch("message") || "",
    };
    const gmailUrl = buildGmailUrl(currentData);
    if (typeof window !== "undefined") {
      window.open(gmailUrl, "_blank", "noopener,noreferrer");
      toast.info("Opened Gmail Web with your draft to sakmmm07@gmail.com!", {
        icon: <ExternalLink size={16} className="text-cyan-400" />,
        duration: 4000,
      });
    }
  }, [buildGmailUrl, watch]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Quick Topic Chips */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
          Quick Topic Selection
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TOPIC_PRESETS.map((t) => {
            const isSelected = currentTitle === t.subject;
            const Icon = t.icon;
            return (
              <button
                key={t.subject}
                type="button"
                onClick={() => handleSelectTopic(t.subject)}
                className={clsx(
                  "text-[11px] font-mono px-3 py-1.5 rounded-lg border transition-all cursor-pointer inline-flex items-center gap-1.5",
                  isSelected
                    ? "bg-cyan-400/15 border-cyan-400/50 text-cyan-300 font-semibold"
                    : "bg-zinc-950/60 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20",
                )}
              >
                <Icon
                  size={12}
                  className={clsx(
                    isSelected ? "text-cyan-300" : "text-zinc-400",
                  )}
                />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Name & Email Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="contact-name"
            className="block text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider"
          >
            Your Name <span className="text-cyan-400">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            placeholder="Ada Lovelace"
            {...register("name", {
              required: "Name is required",
              minLength: {
                value: 2,
                message: "Name must be at least 2 characters",
              },
            })}
            className={clsx(
              "w-full bg-zinc-950/80 border rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition-all font-mono outline-none",
              errors.name
                ? "border-red-500/80 bg-red-500/10 focus:border-red-500"
                : "border-white/10 hover:border-white/20 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20",
            )}
          />
          {errors.name && (
            <p className="text-[11px] font-mono text-red-400 mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="contact-email"
            className="block text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider"
          >
            Email Address <span className="text-cyan-400">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            placeholder="ada@company.com"
            {...register("reply_to", {
              required: "Email address is required",
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: "Please enter a valid email address",
              },
            })}
            className={clsx(
              "w-full bg-zinc-950/80 border rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition-all font-mono outline-none",
              errors.reply_to
                ? "border-red-500/80 bg-red-500/10 focus:border-red-500"
                : "border-white/10 hover:border-white/20 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20",
            )}
          />
          {errors.reply_to && (
            <p className="text-[11px] font-mono text-red-400 mt-1">
              {errors.reply_to.message}
            </p>
          )}
        </div>
      </div>

      {/* Subject Field */}
      <div className="space-y-1.5">
        <label
          htmlFor="contact-subject"
          className="block text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider"
        >
          Subject / Opportunity <span className="text-cyan-400">*</span>
        </label>
        <input
          id="contact-subject"
          type="text"
          placeholder="Summer 2025/2026 Internship &bull; Full-Stack &bull; Applied AI"
          {...register("title", {
            required: "Subject is required",
            minLength: {
              value: 3,
              message: "Subject must be at least 3 characters",
            },
          })}
          className={clsx(
            "w-full bg-zinc-950/80 border rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition-all font-mono outline-none",
            errors.title
              ? "border-red-500/80 bg-red-500/10 focus:border-red-500"
              : "border-white/10 hover:border-white/20 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20",
          )}
        />
        {errors.title && (
          <p className="text-[11px] font-mono text-red-400 mt-1">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Message Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="contact-message"
            className="block text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider"
          >
            Message <span className="text-cyan-400">*</span>
          </label>
          <span className="text-[10px] font-mono text-zinc-500">
            {messageLength} / 1000
          </span>
        </div>
        <textarea
          id="contact-message"
          rows={4}
          placeholder="Share role specifications, engineering project context, or collaboration ideas..."
          {...register("message", {
            required: "Message is required",
            minLength: {
              value: 10,
              message: "Message must be at least 10 characters",
            },
            maxLength: {
              value: 1000,
              message: "Message must be less than 1000 characters",
            },
          })}
          className={clsx(
            "w-full bg-zinc-950/80 border rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition-all font-mono outline-none resize-none min-h-[120px]",
            errors.message
              ? "border-red-500/80 bg-red-500/10 focus:border-red-500"
              : "border-white/10 hover:border-white/20 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20",
          )}
        />
        {errors.message && (
          <p className="text-[11px] font-mono text-red-400 mt-1">
            {errors.message.message}
          </p>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Primary Action: Transmit via Resend Gateway */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={clsx(
            "py-3.5 px-4 rounded-xl font-mono text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99]",
            isSuccess
              ? "bg-emerald-500 text-zinc-950 shadow-emerald-500/20"
              : "bg-white hover:bg-zinc-200 text-zinc-950 shadow-white/10",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <Motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Loader size={15} className="animate-spin text-zinc-900" />
                <span>Transmitting via Resend...</span>
              </Motion.div>
            ) : isSuccess ? (
              <Motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <CheckCircle size={15} className="text-zinc-950" />
                <span>Message Transmitted</span>
              </Motion.div>
            ) : (
              <Motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Send size={15} />
                <span>Send via Resend</span>
              </Motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Secondary Action: Open Gmail Web in Browser */}
        <button
          type="button"
          onClick={handleOpenGmail}
          className="py-3.5 px-4 rounded-xl font-mono text-xs sm:text-sm font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-white/15 hover:border-white/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <span>Open in Gmail Web</span>
          <ArrowUpRight size={15} className="text-cyan-400" />
        </button>
      </div>

      {/* Direct Fallback Helper & Tech Attribution */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-zinc-500">
        <div className="flex items-center gap-1.5">
          <Zap size={11} className="text-cyan-400" />
          <span>Powered by Resend API Gateway</span>
        </div>
        <div>
          <span>Direct: </span>
          <a
            href="mailto:sakmmm07@gmail.com"
            className="text-cyan-400 hover:underline inline-flex items-center gap-0.5 font-semibold"
          >
            sakmmm07@gmail.com
            <ArrowUpRight size={10} />
          </a>
        </div>
      </div>
    </form>
  );
});
ContactForm.displayName = "ContactForm";

const Contact = memo(() => {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText("sakmmm07@gmail.com");
      setCopied(true);
      toast.success("Email copied to clipboard: sakmmm07@gmail.com", {
        duration: 2500,
        icon: <Check size={16} className="text-emerald-400" />,
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-12" id="contact">
      {/* Editorial Section Header matching full site */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-400">
            <span className="text-cyan-400 font-bold">08</span>
            <span>&bull;</span>
            <span>Direct Outreach</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Hiring a 2027 Graduate?
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl font-normal">
            Available for Summer 2025/2026 internships, full-time 2027 roles,
            and engineering collaborations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Open for Opportunities</span>
          </span>
        </div>
      </div>

      {/* Main 2-Column Responsive Editorial Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 cols): Pitch & Quick Contact Channels */}
        <div className="lg:col-span-5 space-y-6">
          {/* Engineering Pitch Chassis */}
          <div className="relative rounded-3xl bg-zinc-900/60 border border-white/10 p-4 sm:p-7 backdrop-blur-xl shadow-xl overflow-hidden space-y-4">
            {/* Specular line */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <div className="flex items-center gap-4 pb-4 border-b border-white/10">
              <div className="relative w-16 h-16 min-w-[64px] min-h-[64px] max-w-[64px] max-h-[64px] rounded-2xl overflow-hidden border-2 border-cyan-400/40 bg-zinc-950 shadow-[0_0_20px_rgba(6,182,212,0.25)] shrink-0 group">
                <img
                  src={profile}
                  alt="Saksham Agarwal"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  width={64}
                  height={64}
                />
                <span
                  className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-zinc-950 animate-pulse"
                  title="Available for 2027 Roles"
                />
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                  <Sparkles size={12} />
                  <span>Candidate Statement</span>
                </div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  Saksham Agarwal
                </h4>
                <p className="text-xs font-mono text-zinc-400">
                  B.Tech CSE &bull; Class of 2027
                </p>
              </div>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed font-normal">
              B.Tech Computer Science student specializing in applied machine
              learning, neural forensics, and high-throughput backend services.
              Seeking engineering roles where I can contribute to
              mission-critical infrastructure and scalable platforms.
            </p>

            <div className="space-y-2 pt-2 border-t border-white/10 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-cyan-400 shrink-0" />
                <span>
                  Farrukhabad, UP &bull; Currently at VIT Bhopal &bull; Open to
                  Remote &amp; Relocation
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-emerald-400 shrink-0" />
                <span>Typical response window: &lt; 24 hours</span>
              </div>
            </div>
          </div>

          {/* Quick Contact Direct Links Hub */}
          <div className="space-y-3">
            {/* Primary Direct Email Card with One-Click Mailto & Copy */}
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/10 backdrop-blur-md space-y-3 hover:border-cyan-400/40 transition-colors group">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-cyan-950/60 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0">
                    <Mail size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                      Direct Inbox
                    </p>
                    <a
                      href="mailto:sakmmm07@gmail.com"
                      className="text-xs sm:text-sm font-mono font-bold text-white group-hover:text-cyan-300 transition-colors truncate block"
                    >
                      sakmmm07@gmail.com
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="Copy email to clipboard"
                >
                  {copied ? (
                    <Check size={12} className="text-emerald-400" />
                  ) : (
                    <Copy size={12} />
                  )}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {/* Direct Mailto & Gmail Quick Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                <a
                  href="mailto:sakmmm07@gmail.com"
                  className="py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400/40 text-xs font-mono text-zinc-300 hover:text-cyan-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <Mail size={13} />
                  <span>Mail Client</span>
                </a>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=sakmmm07@gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-red-500/10 border border-white/10 hover:border-red-400/40 text-xs font-mono text-zinc-300 hover:text-red-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <span>Gmail Web</span>
                  <ArrowUpRight size={13} />
                </a>
              </div>
            </div>

            {/* Social Links Row */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://www.linkedin.com/in/saksham-agarwal-b44910289/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-zinc-900/50 border border-white/10 hover:border-blue-400/40 hover:bg-zinc-900/80 transition-all flex items-center justify-between text-xs font-mono text-zinc-300 hover:text-white group"
              >
                <div className="flex items-center gap-2">
                  <Linkedin size={16} className="text-blue-400" />
                  <span>LinkedIn</span>
                </div>
                <ArrowUpRight
                  size={13}
                  className="text-zinc-500 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                />
              </a>

              <a
                href="https://github.com/saksham-dev07"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-zinc-900/50 border border-white/10 hover:border-white/30 hover:bg-zinc-900/80 transition-all flex items-center justify-between text-xs font-mono text-zinc-300 hover:text-white group"
              >
                <div className="flex items-center gap-2">
                  <Github size={16} className="text-zinc-300" />
                  <span>GitHub</span>
                </div>
                <ArrowUpRight
                  size={13}
                  className="text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                />
              </a>
            </div>

            {/* Playful Easter Egg: Dodge Button */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-900/40 border border-white/5 text-center mt-2">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                Fast-Track Outreach &bull; Test Your Reflexes
              </p>
              <DodgeButton />
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Editorial Direct Composer */}
        <div className="lg:col-span-7">
          <div className="relative rounded-3xl bg-zinc-900/60 border border-white/10 p-4 sm:p-8 backdrop-blur-xl shadow-2xl overflow-hidden space-y-6">
            {/* Specular top reflection line */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            {/* Form Header */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <MessageSquare size={13} />
                  <span>Direct Message Composer</span>
                </span>
                <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                  Delivered to sakmmm07@gmail.com
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Send an Inquiry
              </h3>
              <p className="text-xs text-zinc-400 font-normal">
                Dispatches immediately via high-delivery Resend email API to my
                primary inbox.
              </p>
            </div>

            {/* Clean Direct Form */}
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
});

Contact.displayName = "Contact";

const ContactWrapped = SectionWrapper(Contact, "contact");
ContactWrapped.displayName = "ContactWrapped";

export default ContactWrapped;
