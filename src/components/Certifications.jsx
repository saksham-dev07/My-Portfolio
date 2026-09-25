import { AnimatePresence, motion as Motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  QrCode,
  RotateCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { certifications } from "../constants";
import { SectionWrapper } from "../hoc";

// Helper to categorize certifications
const getCategory = (cert) => {
  if ([1, 2, 3, 4, 5].includes(cert.id)) return "cloud-ai";
  if ([6, 7, 8].includes(cert.id)) return "nptel-google";
  return "university-core";
};

const filterTabs = [
  { id: "all", label: "All Credentials", count: 12 },
  { id: "cloud-ai", label: "Cloud & AI", count: 5 },
  { id: "nptel-google", label: "IIT / NPTEL & Google", count: 3 },
  { id: "university-core", label: "University & Core", count: 4 },
];

// Single Flippable Credential Card (editorial abhyudaytomar.com inspiration)
const CredentialCard = memo(({ cert, index, isFlippedAll, onViewImage }) => {
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  const isCardFlipped = isFlippedAll !== null ? isFlippedAll : flipped;

  const handleCopy = (e) => {
    e.stopPropagation();
    if (cert.validationNumber && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(cert.validationNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleFlip = () => {
    setFlipped(!isCardFlipped);
  };

  return (
    <div
      className="relative h-[310px] w-full [perspective:1000px] cursor-pointer group"
      onClick={handleToggleFlip}
    >
      <div
        className={`relative w-full h-full rounded-2xl transition-transform duration-700 [transform-style:preserve-3d] ${
          isCardFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* FRONT FACE */}
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl p-5 bg-zinc-900/90 border border-white/10 hover:border-cyan-400/40 shadow-xl backdrop-blur-xl flex flex-col justify-between overflow-hidden transition-all duration-300 group-hover:shadow-[0_10px_30px_rgba(6,182,212,0.15)]">
          {/* Top specular reflection */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Card Top: Number + Issuer Icon */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-zinc-500">
              {String(index + 1).padStart(2, "0")}
            </span>
            {cert.profilePic && (
              <div className="w-10 h-10 min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] rounded-xl bg-white/5 p-1.5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={cert.profilePic}
                  alt={cert.issuer}
                  className="w-full h-full max-w-full max-h-full object-contain"
                  loading="lazy"
                  width={40}
                  height={40}
                />
              </div>
            )}
          </div>

          {/* Title & Issuer */}
          <div className="space-y-1.5 my-auto">
            <h4 className="text-base font-bold text-white tracking-tight leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors">
              {cert.title}
            </h4>
            <p className="text-xs text-zinc-400 font-mono">{cert.issuer}</p>
            <p className="text-[11px] text-zinc-500 font-mono">
              Issued: {cert.date}
            </p>

            {/* Skills pills (first 2) */}
            {cert.skills && cert.skills.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {cert.skills.slice(0, 2).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-[10px] font-mono rounded bg-white/[0.04] border border-white/5 text-zinc-400"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Actions: Verify + Inspect + Flip hint */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
            {cert.credentialUrl ? (
              <a
                href={cert.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono font-semibold"
              >
                <span>Verify</span>
                <ExternalLink size={12} />
              </a>
            ) : cert.validationNumber ? (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? "Copied" : "Copy ID"}</span>
              </button>
            ) : (
              <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-400" />
                Verified
              </span>
            )}

            <div className="flex items-center gap-1.5">
              {cert.qrCode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFlip();
                  }}
                  className="p-1 rounded-md text-cyan-400 hover:text-cyan-300 hover:bg-white/10 transition-colors"
                  title="Flip to Scan Verification QR Code"
                >
                  <QrCode size={13} />
                </button>
              )}

              {cert.imageSrc && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewImage(cert);
                  }}
                  className="p-1 rounded-md text-zinc-400 hover:text-cyan-300 hover:bg-white/10 transition-colors"
                  title="Inspect Certificate Document"
                >
                  <Eye size={13} />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFlip();
                }}
                className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                title="Flip Card"
              >
                <RotateCw size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* BACK FACE */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl p-5 bg-zinc-900/95 border border-white/10 hover:border-cyan-400/40 shadow-xl backdrop-blur-xl flex flex-col justify-between overflow-hidden transition-all duration-300">
          {/* Top specular reflection */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Top Header Bar */}
          <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
            <span className="flex items-center gap-1.5 font-bold tracking-wider text-[11px]">
              <ShieldCheck size={13} />
              <span>OFFICIAL RECORD</span>
            </span>
            <span className="text-zinc-500 font-mono text-[11px]">
              {cert.qrCode ? "QR AUTH" : "SA-2027"}
            </span>
          </div>

          {/* Center Content */}
          <div className="text-center my-auto space-y-2 px-1">
            {cert.qrCode ? (
              <div className="flex flex-col items-center">
                <a
                  href={cert.credentialUrl || undefined}
                  target={cert.credentialUrl ? "_blank" : undefined}
                  rel={cert.credentialUrl ? "noopener noreferrer" : undefined}
                  onClick={(e) => {
                    if (cert.credentialUrl) e.stopPropagation();
                  }}
                  className={`p-1.5 rounded-xl bg-white border border-white/20 shadow-md inline-block transition-transform hover:scale-105 ${
                    cert.credentialUrl ? "cursor-pointer" : "cursor-default"
                  }`}
                  title={
                    cert.credentialUrl
                      ? "Click to open verification portal or scan with camera"
                      : "Scan with camera to verify"
                  }
                >
                  <img
                    src={cert.qrCode}
                    alt={`Verification QR for ${cert.title}`}
                    className="w-16 h-16 object-contain rounded"
                    loading="lazy"
                    width={64}
                    height={64}
                  />
                </a>
                <span className="mt-1 text-[9px] font-mono text-cyan-400 font-semibold tracking-wider uppercase">
                  Scan QR to Verify
                </span>
              </div>
            ) : (
              <div className="w-11 h-11 mx-auto rounded-full border border-cyan-400/40 bg-cyan-950/40 flex items-center justify-center font-mono font-bold text-cyan-300 text-xs shadow-[0_0_15px_rgba(6,182,212,0.25)] shrink-0">
                SA
              </div>
            )}

            <h4 className="text-xs font-bold text-white tracking-tight line-clamp-2">
              {cert.title}
            </h4>

            {cert.validationNumber && (
              <button
                type="button"
                onClick={handleCopy}
                title="Click to copy validation ID"
                className="cert-id-badge text-[10px] font-mono text-zinc-300 hover:text-white bg-black/60 hover:bg-black/90 py-1.5 px-3 rounded-lg border border-white/10 break-all select-all font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>ID: {cert.validationNumber}</span>
                {copied ? (
                  <Check size={10} className="text-emerald-400 shrink-0" />
                ) : (
                  <Copy size={10} className="text-zinc-500 shrink-0" />
                )}
              </button>
            )}

            {cert.description && (
              <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                {cert.description}
              </p>
            )}
          </div>

          {/* Bottom Actions Bar */}
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-2 border-t border-white/10">
            {cert.credentialUrl ? (
              <a
                href={cert.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
              >
                <span>Verify Link</span>
                <ExternalLink size={10} />
              </a>
            ) : (
              <span className="text-zinc-500 flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-400" />
                Verified Record
              </span>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFlip();
              }}
              className="text-cyan-400 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Flip Back</span>
              <RotateCw size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
CredentialCard.displayName = "CredentialCard";

// Fullscreen Certificate Image Modal
const CertificateModal = memo(({ cert, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!cert) return null;

  return (
    <AnimatePresence>
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center cursor-zoom-out"
      >
        <Motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-4xl w-full max-h-[90vh] bg-zinc-900 border border-white/15 rounded-3xl p-5 sm:p-6 overflow-hidden flex flex-col shadow-2xl cursor-default"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {cert.title}
              </h3>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                {cert.issuer} &bull; {cert.date}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Certificate Image Frame */}
          <div className="my-4 overflow-auto max-h-[60vh] rounded-2xl bg-zinc-950 flex items-center justify-center p-2 border border-white/5">
            <img
              src={cert.imageSrc}
              alt={cert.title}
              className="max-h-[55vh] w-auto object-contain rounded-xl shadow-lg"
            />
          </div>

          {/* Footer Metadata & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
            <div className="font-mono text-zinc-400 flex flex-wrap items-center gap-3">
              {cert.validationNumber && (
                <span>
                  Verification ID:{" "}
                  <span className="text-cyan-300 font-semibold">
                    {cert.validationNumber}
                  </span>
                </span>
              )}
              {cert.qrCode && (
                <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400 font-mono bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  <QrCode size={11} />
                  <span>QR Verifiable</span>
                </span>
              )}
            </div>
            {cert.credentialUrl && (
              <a
                href={cert.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold font-mono transition-colors self-start sm:self-auto"
              >
                <span>Verify on Issuer Portal</span>
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </Motion.div>
      </Motion.div>
    </AnimatePresence>
  );
});
CertificateModal.displayName = "CertificateModal";

const Certifications = () => {
  const [isFlippedAll, setIsFlippedAll] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCert, setSelectedCert] = useState(null);

  const filteredCerts = useMemo(() => {
    if (activeTab === "all") return certifications;
    return certifications.filter((c) => getCategory(c) === activeTab);
  }, [activeTab]);

  const handleFlipAll = useCallback(() => {
    setIsFlippedAll((prev) => !prev);
  }, []);

  const handleViewImage = useCallback((cert) => {
    setSelectedCert(cert);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedCert(null);
  }, []);

  return (
    <div className="space-y-10" id="credentials">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-400">
            <span className="text-cyan-400 font-bold">05</span>
            <span>&bull;</span>
            <span>Official Credentials</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Certifications &amp; Credentials
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl font-normal">
            All 12 industry cloud certifications, AI practitioner honors, IIT /
            NPTEL honors, and university recognitions.
          </p>
        </div>

        {/* Deck Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleFlipAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCw size={12} />
            <span>{isFlippedAll ? "Show Faces" : "Flip All"}</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "bg-white text-zinc-950 font-bold shadow-md shadow-cyan-500/10"
                : "bg-white/[0.04] text-zinc-400 hover:text-white border border-white/5 hover:border-white/15"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.id
                  ? "bg-zinc-200 text-zinc-900"
                  : "bg-white/10 text-zinc-400"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Full 12-Card Responsive Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredCerts.map((cert, index) => (
          <CredentialCard
            key={cert.id}
            cert={cert}
            index={index}
            isFlippedAll={isFlippedAll}
            onViewImage={handleViewImage}
          />
        ))}
      </div>

      {/* Footer Info Ticker */}
      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs font-mono text-zinc-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span>
          Click any card to flip and inspect cryptographic authenticity &bull;
          Showing {filteredCerts.length} of 12 verified credentials
        </span>
        <span className="text-cyan-400 font-semibold">
          AWS &bull; IBM &bull; Google &bull; L&amp;T &bull; NPTEL
        </span>
      </div>

      {/* Certificate Modal */}
      <CertificateModal cert={selectedCert} onClose={handleCloseModal} />
    </div>
  );
};

const WrappedCertifications = SectionWrapper(
  memo(Certifications),
  "credentials",
);
export default WrappedCertifications;
