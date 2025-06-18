import React, { memo, useMemo, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { Award, ExternalLink, Calendar, Building, TrendingUp, X, ZoomIn } from 'lucide-react';
import { 
  fadeIn, 
  staggerContainer, 
  textVariant, 
  cardVariant,
  hoverLift,
  hoverScale,
  buttonTap,
  buttonHover,  
  iconRotateHover,
  viewportAnimation,
  pulseAnimation,
  breathingAnimation
} from '../utils/motion';
import { certifications } from '../constants';

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch { return null; }
};

const ImageModal = ({ isOpen, onClose, imageSrc, title }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <Motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
        className="relative max-w-5xl max-h-[90vh] w-full bg-slate-900/95 rounded-2xl p-6 shadow-2xl border border-slate-700/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <Motion.button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-red-500/90 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Close modal"
        >
          <X size={20} />
        </Motion.button>
        
        {/* Image container */}
        <div className="relative overflow-hidden rounded-xl">
          <img 
            src={imageSrc} 
            alt={title} 
            className="w-full h-auto max-h-[70vh] object-contain rounded-xl shadow-lg"
            style={{ maxWidth: '100%' }}
          />
        </div>
        
        {/* Title */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-center"
        >
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          <p className="text-sm text-slate-400">Click outside or press ESC to close</p>
        </Motion.div>
      </Motion.div>
    </Motion.div>
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
      className="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/95 backdrop-blur-sm rounded-xl overflow-hidden border transition-all duration-300 border-slate-700/50 hover:border-teal-500/50 shadow-lg hover:shadow-2xl hover:shadow-teal-500/10"
    >
      {/* Animated background gradient */}
      <Motion.div 
        className="absolute inset-0 bg-gradient-to-br from-teal-600/5 to-cyan-600/5"
        animate={breathingAnimation}
      />
      
      <div className="relative z-10 p-6 space-y-4">
        {/* Header with profile pic and title */}
        <div className="flex items-center gap-4 mb-2">
          {profilePic && (
            <Motion.img 
              src={profilePic} 
              alt={`${issuer} logo`} 
              className="w-10 h-10 rounded-full object-cover border-2 border-teal-500/30"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
            />
          )}
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white line-clamp-2">{title}</h3>
            <p className="text-sm text-gray-400">{issuer}</p>
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
                className="absolute top-2 right-2 p-2 bg-slate-900/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-slate-800/90"
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
          <div className="flex items-center gap-2 text-slate-300 group-hover:text-slate-200 transition-colors duration-300">
            <Building size={14} className="text-teal-400/70" />
            <span className="font-medium">{issuer}</span>
          </div>
          {formattedDate && (
            <div className="flex items-center gap-2 text-slate-300 group-hover:text-slate-200 transition-colors duration-300">
              <Calendar size={14} className="text-teal-400/70" />
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
                whileHover={hoverScale(1.05)}
                className="px-3 py-1 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-300 text-xs rounded-full font-medium border border-teal-500/30 backdrop-blur-sm cursor-default"
              >
                {skill}
              </Motion.span>
            ))}
            {skills.length > 3 && (
              <Motion.span
                whileHover={hoverScale(1.05)}
                className="px-3 py-1 bg-slate-700/50 text-slate-400 text-xs rounded-full border border-slate-600/50 backdrop-blur-sm cursor-default"
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
              className="text-sm text-slate-300 leading-relaxed"
              animate={{ height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              {displayDescription}
            </Motion.p>
            {shouldTruncate && (
              <Motion.button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-teal-400 hover:text-teal-300 text-xs font-medium transition-colors duration-200 flex items-center gap-1"
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
            className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 hover:from-teal-500/30 hover:to-cyan-500/30 text-teal-300 hover:text-teal-200 rounded-lg transition-all duration-300 text-sm font-medium border border-teal-500/30 backdrop-blur-sm group/link"
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
      <section id="certifications" className="py-20 relative overflow-hidden">
        {/* Animated background */}
        <Motion.div 
          className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-800/30"
          animate={breathingAnimation}
        />
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2314b8a6' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="container mx-auto max-w-7xl px-6 relative z-10">
          {/* Enhanced Header */}
          <Motion.div
            variants={textVariant()}
            initial="hidden"
            whileInView="show"
            viewport={viewportAnimation}
            className="text-center mb-12"
          >
            <div className="relative bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700 rounded-3xl p-10 text-white overflow-hidden shadow-2xl">
              {/* Animated background elements */}
              <Motion.div 
                className="absolute inset-0 bg-gradient-to-r from-teal-900/20 to-cyan-900/20"
                animate={breathingAnimation}
              />
              
              <div className="relative z-10">
                <Motion.p 
                  className="text-teal-200 uppercase tracking-wider text-sm font-bold mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Professional Achievements
                </Motion.p>
                <Motion.h2 
                  className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 bg-gradient-to-r from-white via-teal-100 to-cyan-100 bg-clip-text text-transparent"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  Certifications
                </Motion.h2>
                <Motion.p 
                  className="text-teal-100 max-w-3xl mx-auto text-lg leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Professional credentials demonstrating expertise, continuous learning, and commitment to excellence in technology
                </Motion.p>
                
                {/* Simplified Stats */}
                <Motion.div 
                  className="flex justify-center mt-8"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Motion.div
                    className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg"
                    whileHover={hoverLift}
                  >
                    <Motion.div animate={pulseAnimation}>
                      <Award size={20} className="mx-auto mb-2 text-teal-200" />
                    </Motion.div>
                    <div className="text-2xl font-black text-white">{stats.total}</div>
                    <div className="text-teal-200 text-sm font-medium">Total Certifications</div>
                  </Motion.div>
                </Motion.div>
              </div>
            </div>
          </Motion.div>
          
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
      </section>

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

export default memo(Certifications);