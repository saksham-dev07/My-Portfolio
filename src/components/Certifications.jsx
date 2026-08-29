import React, { memo, useMemo, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { Award, ExternalLink, Calendar, Building, TrendingUp, X, ZoomIn } from 'lucide-react';
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

const ImageModal = ({ isOpen, onClose, imageSrc, title }) => {
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

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
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
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <Motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative max-w-4xl max-h-[90vh] w-full bg-zinc-950/95 rounded-2xl p-4 sm:p-6 shadow-2xl border border-white/15 overflow-hidden flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-9 h-9 bg-zinc-800/90 hover:bg-zinc-700 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-md backdrop-blur-sm border border-white/10 active:scale-95 cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>
        
        {/* Image container */}
        <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-zinc-900/50 p-2 min-h-0">
          <img 
            src={imageSrc} 
            alt={title} 
            className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-lg"
          />
        </div>
        
        {/* Title */}
        <div className="mt-3 text-center">
          <h3 className="text-base sm:text-lg font-bold text-white line-clamp-1">{title}</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Click outside or press ESC to close</p>
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
      className={`${className} relative overflow-hidden bg-gradient-to-br from-teal-900/20 to-cyan-900/30 cursor-pointer group rounded-lg`}
      onClick={handleClick}
    >
      {/* Loading spinner */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 rounded-lg">
          <Motion.div 
            className="w-6 h-6 border-2 border-teal-400/30 border-t-teal-400 rounded-full"
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
        className={`w-full h-full object-cover transition-all duration-500 rounded-lg ${
          imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
        } group-hover:scale-105`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
      
      {/* Hover overlay */}
      <Motion.div 
        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center rounded-lg"
        initial={false}
      >
        <Motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileHover={{ scale: 1.1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="p-3 rounded-full bg-teal-500/90 backdrop-blur-sm shadow-lg border border-white/20"
        >
          <ZoomIn size={24} className="text-white" />
        </Motion.div>
      </Motion.div>
      
      {/* Shine effect on hover */}
      <Motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out rounded-lg"
        style={{ transform: 'skewX(-20deg)' }}
      />
    </div>
  );
});

const CertCard = memo(({ cert, index, onImageClick }) => {
  const { title, issuer, date, description, imageSrc, credentialUrl, skills = [], profilePic } = cert;
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formattedDate = useMemo(() => formatDate(date), [date]);
  const shouldTruncate = description?.length > 100;
  const displayDescription = shouldTruncate && !isExpanded 
    ? description.slice(0, 100) + '...' 
    : description;

  const handleImageClick = () => {
    if (imageSrc && onImageClick) {
      onImageClick(imageSrc, title);
    }
  };

  return (
    <Motion.div
      variants={cardVariant(index * 0.05)}
      initial="hidden"
      whileInView="show"
      viewport={viewportAnimation}
      whileHover={hoverLift}
      className="group relative glass-card glass-card-hover rounded-xl overflow-hidden flex flex-col h-full"
    >
      
      <div className="relative z-10 p-6 space-y-4">
        {/* Header with profile pic and title */}
        <div className="flex items-center gap-4 mb-2">
          {profilePic && (
            <Motion.img 
              src={profilePic} 
              alt={`${issuer} logo`} 
              className="w-10 h-10 rounded-full object-cover border-2 border-accent/40"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
            />
          )}
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white line-clamp-2">{title}</h3>
            <p className="text-sm text-zinc-400">{issuer}</p>
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
                className="absolute top-2 right-2 p-2 bg-zinc-900/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-zinc-800"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`View ${title} credential`}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={16} className="text-white" />
              </Motion.a>
            )}
          </div>
        )}
        
        {/* Metadata with enhanced styling */}
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-2 text-zinc-300 group-hover:text-zinc-200 transition-colors duration-300">
            <Building size={14} className="text-accent" />
            <span className="font-medium">{issuer}</span>
          </div>
          {formattedDate && (
            <div className="flex items-center gap-2 text-zinc-300 group-hover:text-zinc-200 transition-colors duration-300">
              <Calendar size={14} className="text-accent" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>
        
        {/* Skills with hover effects */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 3).map((skill, i) => (
              <Motion.span
                key={i}
                whileHover={hoverScale}
                className="px-3 py-1 bg-blue-500/10 text-blue-300 text-xs rounded-full font-medium border border-blue-500/20 backdrop-blur-sm cursor-default"
              >
                {skill}
              </Motion.span>
            ))}
            {skills.length > 3 && (
              <Motion.span
                whileHover={hoverScale}
                className="px-3 py-1 bg-zinc-800/80 text-zinc-400 text-xs rounded-full border border-white/10 backdrop-blur-sm cursor-default"
              >
                +{skills.length - 3} more
              </Motion.span>
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
                className="text-accent hover:text-accentLight text-xs font-medium transition-colors duration-200 flex items-center gap-1"
                whileHover={{ x: 2 }}
                whileTap={buttonTap}
              >
                {isExpanded ? 'Show less' : 'Show more'}
                <Motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TrendingUp size={10} />
                </Motion.div>
              </Motion.button>
            )}
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
  const [modalImage, setModalImage] = useState({ isOpen: false, src: '', title: '' });
  
  const handleImageClick = (src, title) => {
    setModalImage({ isOpen: true, src, title });
  };

  const handleCloseModal = () => {
    setModalImage({ isOpen: false, src: '', title: '' });
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
            <p className="text-zinc-500 mb-2 text-sm uppercase tracking-wider font-semibold">
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
              <div className="text-center glass-card border border-white/10 rounded-xl py-2.5 px-5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <Award size={18} className="text-accent" />
                  <span className="text-lg font-bold text-zinc-100">{stats.total}</span>
                  <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Verified Credentials</span>
                </div>
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
        />
      )}
    </>
  );
};

const WrappedCertifications = SectionWrapper(memo(Certifications), 'certifications');
WrappedCertifications.displayName = 'WrappedCertifications';
export default WrappedCertifications;