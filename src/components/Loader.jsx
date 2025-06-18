import React, { useEffect, useState, useMemo } from "react";
import { Html, useProgress } from "@react-three/drei";
import { motion as Motion, AnimatePresence } from "framer-motion";

const CanvasLoader = () => {
  const { progress } = useProgress();
  const [messageIndex, setMessageIndex] = useState(0);

  // Memoized loading messages to prevent recreation
  const loadingMessages = useMemo(() => [
    { text: "Initializing 3D experience", icon: "⚡" },
    { text: "Loading geometries", icon: "📦" },
    { text: "Preparing materials", icon: "🎨" },
    { text: "Setting up lighting", icon: "💡" },
    { text: "Optimizing performance", icon: "⚙️" },
    { text: "Finalizing scene", icon: "🌟" }
  ], []);

  // Simplified progress-based message updates
  useEffect(() => {
    const newIndex = Math.min(
      Math.floor((progress / 100) * loadingMessages.length),
      loadingMessages.length - 1
    );
    if (newIndex !== messageIndex) setMessageIndex(newIndex);
  }, [progress, messageIndex, loadingMessages.length]);

  // Fallback message rotation when progress is stuck
  useEffect(() => {
    if (progress === 0) {
      const timer = setTimeout(() => {
        setMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [messageIndex, progress, loadingMessages.length]);

  const progressPercent = Math.round(progress);
  const currentMessage = loadingMessages[messageIndex];
  const showLoader = progress >= 0 && progress < 100;

  // Optimized animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.3 }
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <Html as="div" center>
      <AnimatePresence>
        {showLoader && (
          <Motion.div
            className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-black z-50"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Simplified background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <Motion.div
                className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 8, repeat: Infinity }}
              />
              <Motion.div
                className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/4 rounded-full blur-3xl"
                animate={{ 
                  scale: [1.2, 1, 1.2],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 10, repeat: Infinity, delay: 2 }}
              />
            </div>

            {/* Main loader */}
            <div className="relative z-10 flex flex-col items-center p-6 rounded-xl bg-black/30 backdrop-blur-md border border-white/5 shadow-2xl">
              
              {/* Enhanced spinner */}
              <div className="relative mb-6">
                <Motion.div 
                  className="w-16 h-16 rounded-full border-3 border-transparent border-t-cyan-400 border-r-emerald-400"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
                <Motion.div 
                  className="absolute inset-2 rounded-full border-2 border-transparent border-b-cyan-300/50 border-l-emerald-300/50"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                />
                <Motion.div 
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ scale: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full blur-sm opacity-70" />
                </Motion.div>
              </div>

              {/* Message display */}
              <Motion.div
                className="flex items-center gap-3 mb-4 h-8"
                key={currentMessage.text}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
              >
                <Motion.span 
                  className="text-xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {currentMessage.icon}
                </Motion.span>
                <span className="text-base text-gray-200 font-medium">
                  {currentMessage.text}
                </span>
              </Motion.div>

              {/* Streamlined progress bar */}
              <div className="w-56 bg-gray-800/50 rounded-full h-1.5 mb-3 overflow-hidden">
                <Motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>

              {/* Progress text */}
              <div className="text-xs text-gray-400 font-mono mb-4">
                {progressPercent}%
              </div>

              {/* Simplified loading dots */}
              <div className="flex space-x-1.5">
                {[0, 1, 2].map((i) => (
                  <Motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                    animate={{ 
                      opacity: [0.3, 1, 0.3],
                      scale: [0.8, 1.1, 0.8]
                    }}
                    transition={{ 
                      duration: 1.2, 
                      repeat: Infinity, 
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Subtle hint text */}
            <Motion.p 
              className="absolute bottom-6 text-xs text-gray-500/80 font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              Preparing your experience
            </Motion.p>
          </Motion.div>
        )}
      </AnimatePresence>
    </Html>
  );
};

export default CanvasLoader;