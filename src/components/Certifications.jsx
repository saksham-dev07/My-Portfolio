import React, { memo, useMemo, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { Award, ExternalLink, Calendar, Building, TrendingUp, X, ZoomIn, Copy, Check, QrCode } from 'lucide-react';
import { SectionWrapper } from '../hoc';
import { 
  fadeIn, 
  staggerContainer, 
  cardVariant,
  hoverLift,
  hoverScale,
  buttonTap,
  buttonHover,  
  iconRotateHover,
  viewportAnimation,
  pulseAnimation
} from '../utils/motion';
import { certifications } from '../constants';

import { createPortal } from 'react-dom';

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch { return null; }
};

const ImageModal = ({ isOpen, onClose, imageSrc, title, credentialUrl, validationNumber, verifyMethod, issuer }) => {
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = React.useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const handleCopy = (e) => {
    e?.stopPropagation();
    if (validationNumber && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(validationNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenAndCopy = (e) => {
    handleCopy(e);
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      setCopied(false);
      setIsZoomed(false);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || typeof document === 'undefined') return null;
  
  return createPortal(
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl"
      onClick={handleBackdropClick}
    >
      <Motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-4xl max-h-[93vh] w-full rounded-2xl p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(59,130,246,0.15)] border border-white/20 bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-black/95 backdrop-blur-2xl overflow-y-auto flex flex-col items-center custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top specular edge reflection */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

        {/* Ambient accent background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top action controls */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-2">
          <Motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsZoomed(!isZoomed)}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white rounded-full flex items-center justify-center transition-colors shadow-lg backdrop-blur-xl border border-white/15 hover:border-white/35 cursor-pointer"
            aria-label={isZoomed ? "Zoom out" : "Zoom in"}
            title={isZoomed ? "Fit certificate to screen" : "Zoom in to inspect details or QR code"}
          >
            <ZoomIn size={16} className={`transition-transform duration-300 ${isZoomed ? "text-accent rotate-45" : "text-white"}`} />
          </Motion.button>
          <Motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={onClose}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white rounded-full flex items-center justify-center transition-colors shadow-lg backdrop-blur-xl border border-white/15 hover:border-white/35 cursor-pointer"
            aria-label="Close modal"
            title="Close modal (Esc)"
          >
            <X size={18} />
          </Motion.button>
        </div>
        
        {/* Certificate stage with specular glass inset and ambient spotlight */}
        <div 
          className={`w-full relative flex items-center justify-center rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-3 sm:p-4 border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_0_30px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-300 ${
            isZoomed ? 'overflow-auto max-h-[72vh] cursor-zoom-out' : 'cursor-zoom-in group/stage'
          }`}
          onClick={() => setIsZoomed(!isZoomed)}
          title={isZoomed ? "Click to fit to screen" : "Click to enlarge certificate / QR code"}
        >
          {/* Backlight glow behind certificate */}
          <div className="absolute inset-4 bg-accent/5 blur-2xl rounded-2xl pointer-events-none" />

          <img 
            src={imageSrc} 
            alt={title} 
            className={`relative z-10 object-contain rounded-sm shadow-[0_15px_35px_rgba(0,0,0,0.6)] transition-all duration-200 ring-1 ring-white/20 ${
              isZoomed 
                ? 'max-w-none w-[150%] sm:w-[130%] max-h-none my-2' 
                : 'max-w-full max-h-[54vh] sm:max-h-[58vh]'
            }`}
          />

          {!isZoomed && (
            <div className="absolute bottom-3 right-3 z-20 opacity-0 group-hover/stage:opacity-100 transition-opacity duration-200 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-medium text-zinc-300 shadow-md">
              <ZoomIn size={12} className="text-accent" />
              <span>Click to Zoom</span>
            </div>
          )}
        </div>
        
        {/* Title and verification info */}
        <div className="mt-3.5 text-center flex flex-col items-center gap-3 w-full max-w-xl relative z-10">
          <h3 className="text-base sm:text-lg font-bold text-white line-clamp-1 tracking-tight">{title}</h3>
          
          {validationNumber && (
            <div className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/15 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_8px_20px_-6px_rgba(0,0,0,0.4)] hover:border-white/25 transition-all">
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-0.5">
                  {issuer?.includes('AWS') || issuer?.includes('Amazon') ? 'Verification Code (Alpine CertMetrics)' : 'Credential / Validation Code'}
                </span>
                <code className="text-xs sm:text-sm font-mono text-accent font-semibold break-all select-all">
                  {validationNumber}
                </code>
              </div>
              <Motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shrink-0 shadow-sm ${
                  copied 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/15 hover:border-white/30 backdrop-blur-md'
                }`}
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? "Code Copied!" : "Copy Code"}</span>
              </Motion.button>
            </div>
          )}

          {credentialUrl && (
            <div className="flex flex-col items-center gap-1">
              <Motion.a
                href={credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOpenAndCopy}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 px-5 py-2.5 rounded-xl border border-white/25 shadow-[0_4px_20px_rgba(37,99,235,0.4)] hover:shadow-[0_6px_28px_rgba(59,130,246,0.6)] transition-all cursor-pointer group"
              >
                <span>{issuer?.includes('AWS') || issuer?.includes('Amazon') ? 'Verify on AWS Portal' : issuer?.includes('Google Cloud') ? 'View Google Skills Profile' : 'Verify Credential Online'}</span>
                <ExternalLink size={14} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Motion.a>
            </div>
          )}

          {verifyMethod === 'qr' && (
            <div className="flex items-center gap-2.5 text-xs text-zinc-300 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 border border-cyan-500/25 backdrop-blur-xl px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <div className="w-6 h-6 rounded-full bg-cyan-500/15 flex items-center justify-center border border-cyan-400/30 shrink-0">
                <QrCode size={14} className="text-cyan-400" />
              </div>
              <span className="text-left">
                <strong className="text-white font-semibold">QR Verification:</strong> Scan the QR code at the bottom of the certificate with your phone (or click certificate / zoom button to enlarge).
              </span>
            </div>
          )}

          <p className="text-[11px] text-zinc-500">Click outside or press ESC to close</p>
        </div>
      </Motion.div>
    </Motion.div>,
    document.body
  );
};

const CertImage = memo(({ src, alt, className, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick && imageLoaded && !imageError) {
      onClick();
    }
  };
  
  if (!src || imageError) {
    return (
      <div className={`${className} bg-gradient-to-br from-teal-900/20 to-cyan-900/30 flex items-center justify-center border border-teal-800/30 backdrop-blur-sm rounded-lg`}>
        <Motion.div animate={pulseAnimation}>
          <Award size={32} className="text-teal-400/60" />
        </Motion.div>
      </div>
    );
  }
  
  return (
    <div 
      className={`${className} relative overflow-hidden bg-gradient-to-br from-zinc-900/60 via-zinc-900/40 to-black/60 cursor-pointer group rounded-lg border border-white/10 group-hover:border-accent/40 transition-colors duration-300`}
      onClick={handleClick}
    >
      {/* Loading spinner */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 rounded-lg backdrop-blur-sm">
          <Motion.div 
            className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
      
      {/* Main image */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`w-full h-full object-contain p-1.5 transition-all duration-500 rounded-lg ${
          imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
        } group-hover:scale-[1.03]`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
      
      {/* Glassmorphic hover overlay */}
      <Motion.div 
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center rounded-lg"
        initial={false}
      >
        <Motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/25 text-white text-xs font-semibold shadow-xl"
        >
          <ZoomIn size={14} className="text-accent" />
          <span>Click to Preview</span>
        </Motion.div>
      </Motion.div>
      
      {/* Dynamic specular sweep on hover */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out rounded-lg pointer-events-none"
        style={{ transform: 'skewX(-20deg)' }}
      />
    </div>
  );
});

const CertCard = memo(({ cert, index, onImageClick }) => {
  const { title, issuer, date, description, imageSrc, credentialUrl, skills = [], profilePic, validationNumber, verifyMethod } = cert;
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const formattedDate = useMemo(() => formatDate(date), [date]);
  const shouldTruncate = description?.length > 100;
  const displayDescription = shouldTruncate && !isExpanded 
    ? description.slice(0, 100) + '...' 
    : description;

  const handleCopyCode = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (validationNumber && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(validationNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleVerifyClick = (e) => {
    if (validationNumber && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(validationNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleImageClick = () => {
    if (imageSrc && onImageClick) {
      onImageClick(imageSrc, title, credentialUrl, validationNumber, verifyMethod, issuer);
    }
  };

  return (
    <Motion.div
      variants={cardVariant(index * 0.05)}
      initial="hidden"
      whileInView="show"
      viewport={viewportAnimation}
      whileHover={{ y: -6, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
      className="group relative glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col h-full border border-white/10 hover:border-accent/40 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_40px_-12px_rgba(59,130,246,0.25)] transition-all duration-300"
    >
      {/* Top specular edge reflection */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

      {/* Subtle radial corner glow on hover */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-colors duration-500 pointer-events-none" />

      <div className="relative z-10 p-6 space-y-4 flex flex-col flex-1">
        {/* Header with profile pic and title */}
        <div className="flex items-center gap-3.5 mb-1">
          {profilePic && (
            <div className="relative shrink-0">
              <Motion.img 
                src={profilePic} 
                alt={`${issuer} logo`} 
                loading="lazy"
                decoding="async"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/20 group-hover:border-accent/60 shadow-md group-hover:shadow-[0_0_15px_rgba(59,130,246,0.35)] transition-all duration-300"
                whileHover={{ scale: 1.12, rotate: 6 }}
                transition={{ duration: 0.2 }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold text-white line-clamp-3 leading-snug tracking-tight" title={title}>{title}</h3>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium">{issuer}</p>
          </div>
        </div>
        
        {/* Image with zoom functionality */}
        {imageSrc && (
          <div className="relative">
            <CertImage 
              src={imageSrc} 
              alt={title}
              className="w-full h-48 object-cover"
              onClick={handleImageClick}
            />
            
            {/* External link overlay for image */}
            {credentialUrl && (
              <Motion.a
                href={credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/80 border border-white/15 hover:border-accent/40 shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`View ${title} credential`}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={15} className="text-white" />
              </Motion.a>
            )}
          </div>
        )}
        
        {/* Metadata with enhanced styling */}
        <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 text-zinc-300 group-hover:text-zinc-200 transition-colors duration-300">
            <Building size={14} className="text-accent" />
            <span className="font-medium">{issuer}</span>
          </div>
          {formattedDate && (
            <div className="flex items-center gap-1.5 text-zinc-300 group-hover:text-zinc-200 transition-colors duration-300">
              <Calendar size={14} className="text-accent" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>
        
        {/* Skills with interactive +more expand */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            {(showAllSkills ? skills : skills.slice(0, 3)).map((skill, i) => (
              <Motion.span
                key={i}
                whileHover={{ scale: 1.05, y: -1 }}
                className="px-2.5 py-1 bg-blue-500/[0.08] hover:bg-blue-500/[0.18] text-blue-300 hover:text-blue-200 text-xs rounded-full font-medium border border-blue-400/20 hover:border-blue-400/40 backdrop-blur-md transition-all duration-200 cursor-default hover:shadow-[0_0_12px_rgba(59,130,246,0.25)]"
              >
                {skill}
              </Motion.span>
            ))}
            {skills.length > 3 && (
              <Motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllSkills(!showAllSkills);
                }}
                whileHover={{ scale: 1.06 }}
                whileTap={buttonTap}
                className="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.14] text-zinc-300 hover:text-white text-xs rounded-full border border-white/15 hover:border-accent/40 backdrop-blur-md transition-all cursor-pointer font-medium shadow-sm active:scale-95"
              >
                {showAllSkills ? "Show less" : `+${skills.length - 3} more`}
              </Motion.button>
            )}
          </div>
        )}
        
        {/* Description with smooth expand animation */}
        {description && (
          <div className="space-y-2">
            <Motion.p
              className="text-sm text-zinc-300 leading-relaxed"
              animate={{ height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              {displayDescription}
            </Motion.p>
            {shouldTruncate && (
              <Motion.button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-accent hover:text-accentLight text-xs font-semibold transition-colors duration-200 flex items-center gap-1.5 pt-0.5 cursor-pointer"
                whileHover={{ x: 2 }}
                whileTap={buttonTap}
              >
                <span>{isExpanded ? 'Show less' : 'Show more'}</span>
                <Motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TrendingUp size={11} />
                </Motion.div>
              </Motion.button>
            )}
          </div>
        )}
        
        {/* Credential Verification / Action Footer */}
        {(credentialUrl || validationNumber || verifyMethod === 'qr') && (
          <div className="pt-3.5 mt-auto border-t border-white/10 space-y-2.5">
            {validationNumber && (
              <div className="flex items-center justify-between text-xs text-zinc-300 bg-white/[0.04] border border-white/10 hover:border-white/20 rounded-lg px-2.5 py-1.5 font-mono backdrop-blur-md transition-colors shadow-inner">
                <span className="text-[10px] font-sans text-zinc-500 font-semibold uppercase tracking-wider">ID</span>
                <span className="truncate mx-2 text-[11px] text-zinc-300 font-mono tracking-wider select-all">
                  {validationNumber.length > 18 ? `${validationNumber.slice(0, 8)}...${validationNumber.slice(-4)}` : validationNumber}
                </span>
                <Motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopyCode}
                  title="Copy validation code"
                  className={`flex items-center gap-1 text-[11px] font-sans font-medium px-2 py-0.5 rounded transition-all cursor-pointer shrink-0 ml-auto border shadow-sm ${
                    copied 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]' 
                      : 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/15 border-white/10 hover:border-white/20'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={11} className="text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      <span>Copy</span>
                    </>
                  )}
                </Motion.button>
              </div>
            )}
            {credentialUrl ? (
              <Motion.a
                href={credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleVerifyClick}
                aria-label={`Verify ${title} credential on official portal`}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-accent/20 via-accent/15 to-cyan-500/20 hover:from-accent hover:to-cyan-500 text-accent hover:text-white border border-accent/40 hover:border-white/30 backdrop-blur-md font-semibold text-xs transition-all duration-300 cursor-pointer whitespace-nowrap shadow-sm hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] group/btn"
                whileHover={{ scale: 1.02 }}
                whileTap={buttonTap}
                title={`Verify ${title} credential on official portal`}
              >
                <span>Verify Credential</span>
                <ExternalLink size={13} className="transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </Motion.a>
            ) : verifyMethod === 'qr' ? (
              <Motion.button
                type="button"
                onClick={handleImageClick}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-cyan-500/20 text-zinc-200 hover:text-cyan-200 border border-white/15 hover:border-cyan-400/40 backdrop-blur-md font-semibold text-xs transition-all duration-300 cursor-pointer whitespace-nowrap shadow-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] group/btn"
                whileHover={{ scale: 1.02 }}
                whileTap={buttonTap}
                title="Open certificate to scan QR verification code"
              >
                <QrCode size={13} className="text-cyan-400 group-hover/btn:rotate-6 transition-transform" />
                <span>Scan QR to Verify</span>
              </Motion.button>
            ) : null}
          </div>
        )}
        
        {/* Enhanced credential link */}
        {credentialUrl && !imageSrc && (
          <Motion.a
            href={credentialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-3 bg-accent text-white hover:bg-accentLight rounded-xl transition-all duration-300 text-sm font-semibold shadow-glass group/link"
            whileHover={buttonHover}
            whileTap={buttonTap}
          >
            <Motion.div
              whileHover={{ rotate: 12 }}
              transition={{ duration: 0.2 }}
            >
              <ExternalLink size={16} />
            </Motion.div>
            View Credential
          </Motion.a>
        )}
      </div>
    </Motion.div>
  );
});

const Certifications = () => {
  const [modalImage, setModalImage] = useState({ isOpen: false, src: '', title: '', credentialUrl: '', validationNumber: '', verifyMethod: '', issuer: '' });
  
  const handleImageClick = (src, title, credentialUrl, validationNumber, verifyMethod, issuer) => {
    setModalImage({ isOpen: true, src, title, credentialUrl, validationNumber, verifyMethod, issuer });
  };

  const handleCloseModal = () => {
    setModalImage({ isOpen: false, src: '', title: '', credentialUrl: '', validationNumber: '', verifyMethod: '', issuer: '' });
  };

  const stats = {
    total: certifications.length
  };
  
  return (
    <>
      <div className="py-10 relative overflow-hidden bg-primary">
        <div className="container mx-auto max-w-7xl px-6 relative z-10">
          {/* Minimalist Header */}
          <div className="text-center mb-16">
            <div className="section-number-badge">
              <span className="number">06</span>
              <span>//</span>
              <span>Credentials & Licenses</span>
            </div>
            <p className="text-zinc-400 mb-2 text-sm uppercase tracking-wider font-semibold">
              Professional Credentials & Mastery
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-100 mb-4">
              Professional <span className="accent-gradient-text italic font-serif">Certifications</span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              Industry credentials and verified certifications in Generative AI, Cloud Systems, Edge Computing, and Computer Networks.
            </p>
            
            {/* Unified Stats Badge */}
            <div className="flex justify-center mt-6">
              <div className="liquid-glass-island py-2.5 px-6 rounded-full flex items-center gap-3 border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:border-accent/40 transition-all duration-300 group cursor-default">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-accent/15 border border-accent/30 text-accent group-hover:scale-110 transition-transform">
                  <Award size={15} />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">{stats.total}</span>
                <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Verified Credentials</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" title="All Verified & Active" />
              </div>
            </div>
          </div>
          
          {/* Grid */}
          <Motion.div
            variants={staggerContainer(0.05, 0)}
            initial="hidden"
            whileInView="show"
            viewport={viewportAnimation}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {certifications.map((cert, idx) => (
              <CertCard 
                key={cert.id || idx} 
                cert={cert} 
                index={idx} 
                onImageClick={handleImageClick}
              />
            ))}
          </Motion.div>
          
          {/* Empty state */}
          {certifications.length === 0 && (
            <Motion.div
              variants={fadeIn('up')}
              initial="hidden"
              whileInView="show"
              viewport={viewportAnimation}
              className="text-center py-16"
            >
              <Motion.div
                animate={iconRotateHover}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Award size={64} className="mx-auto text-teal-400/60 mb-4" />
              </Motion.div>
              <h3 className="text-xl font-bold text-white mb-2">
                No certifications found
              </h3>
              <p className="text-slate-400 text-lg">
                Check back later for new certifications
              </p>
            </Motion.div>
          )}
        </div>
      </div>

      {/* Modal rendered at root level */}
      {modalImage.isOpen && (
        <ImageModal
          isOpen={modalImage.isOpen}
          onClose={handleCloseModal}
          imageSrc={modalImage.src}
          title={modalImage.title}
          credentialUrl={modalImage.credentialUrl}
          validationNumber={modalImage.validationNumber}
          verifyMethod={modalImage.verifyMethod}
          issuer={modalImage.issuer}
        />
      )}
    </>
  );
};

const WrappedCertifications = SectionWrapper(memo(Certifications), 'certifications');
WrappedCertifications.displayName = 'WrappedCertifications';
export default WrappedCertifications;