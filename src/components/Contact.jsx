// Contact.jsx - Performance optimized with working progress bar
import React, { memo, useCallback, useMemo, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { toast, ToastContainer } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { Loader, Send, CheckCircle, AlertCircle, User, Mail, MessageSquare, FileText, Sparkles, Github, Linkedin } from 'lucide-react';
import clsx from 'clsx';

import 'react-toastify/dist/ReactToastify.css';
import { SectionWrapper } from '../hoc';

// Simplified animation variants for better performance
const formFieldVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.1, duration: 0.4, ease: "easeOut" }
  })
};

const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
  tap: { scale: 0.98 },
  loading: { scale: 1 },
  success: { scale: 1.05, transition: { duration: 0.3 } }
};

const progressVariants = {
  hidden: { width: 0 },
  visible: (progress) => ({
    width: `${progress}%`,
    transition: { duration: 0.5, ease: "easeOut" }
  })
};

const errorVariants = {
  hidden: { opacity: 0, height: 0, y: -10 },
  visible: { opacity: 1, height: "auto", y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, height: 0, y: -10, transition: { duration: 0.2 } }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, duration: 0.3 }
  }
};

const iconVariants = {
  idle: { color: '#71717a', scale: 1 },
  focus: { color: '#e4e4e7', scale: 1.1, transition: { duration: 0.2 } },
  error: { color: '#ef4444', scale: 1.1, transition: { duration: 0.2 } }
};

// Enhanced form configuration
const formFields = [
  { 
    label: 'Subject', 
    name: 'title', 
    type: 'input', 
    placeholder: 'How can we help you today?', 
    icon: FileText,
    validation: { 
      required: 'Subject is required',
      minLength: { value: 3, message: 'Subject must be at least 3 characters' },
      maxLength: { value: 100, message: 'Subject must be less than 100 characters' }
    } 
  },
  { 
    label: 'Your Name', 
    name: 'from_name', 
    type: 'input', 
    placeholder: 'Enter your full name', 
    icon: User,
    validation: { 
      required: 'Name is required',
      minLength: { value: 2, message: 'Name must be at least 2 characters' },
      pattern: { value: /^[a-zA-Z\s]+$/, message: 'Name can only contain letters and spaces' }
    } 
  },
  { 
    label: 'Email Address', 
    name: 'reply_to', 
    type: 'email', 
    placeholder: 'your.email@example.com', 
    icon: Mail,
    validation: { 
      required: 'Email is required', 
      pattern: { 
        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
        message: 'Please enter a valid email address' 
      } 
    } 
  },
  { 
    label: 'Message', 
    name: 'message', 
    type: 'textarea', 
    placeholder: 'Tell us about your project, question, or how we can help...', 
    icon: MessageSquare,
    validation: { 
      required: 'Message is required',
      minLength: { value: 10, message: 'Message must be at least 10 characters' },
      maxLength: { value: 1000, message: 'Message must be less than 1000 characters' }
    } 
  },
];

// Optimized FormField component
const FormField = memo(({ field, register, errors, onFocus, characterCount = 0, maxLength, index }) => {
  const { label, name, type, placeholder, validation, icon: Icon } = field;
  const hasError = errors[name];
  const [isFocused, setIsFocused] = useState(false);

  const baseClasses = 'bg-zinc-900 py-3 px-4 pl-12 rounded-md outline-none transition-all duration-300 border border-zinc-800 w-full text-zinc-100 placeholder:text-zinc-500';
  const errorClasses = hasError
    ? 'border-red-500 focus:border-red-500 bg-red-500/5 focus:shadow-[0_0_15px_rgba(239,68,68,0.3)]'
    : 'focus:border-accent hover:border-zinc-700 focus:shadow-glassGlowStrong';

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.(name);
  }, [name, onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return (
    <Motion.div
      custom={index}
      variants={formFieldVariants}
      initial="hidden"
      animate="visible"
      className="relative"
    >
      <Motion.label 
        htmlFor={name} 
        className={clsx(
          'block text-sm font-semibold mb-2 transition-colors duration-300',
          isFocused ? 'text-zinc-300' : hasError ? 'text-red-400' : 'text-zinc-500'
        )}
      >
        {label}
        {validation.required && (
          <span className="text-red-400 ml-1">*</span>
        )}
      </Motion.label>
      
      <div className="relative group">
        <Motion.div 
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
          variants={iconVariants}
          animate={hasError ? "error" : isFocused ? "focus" : "idle"}
        >
          <Icon size={20} />
        </Motion.div>
        
        {type === 'textarea' ? (
          <textarea
            id={name}
            rows={5}
            placeholder={placeholder}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...register(name, validation)}
            className={clsx(
              baseClasses,
              'placeholder:text-gray-500 text-gray-100 resize-none min-h-[140px]',
              errorClasses
            )}
          />
        ) : (
          <input
            id={name}
            type={type}
            placeholder={placeholder}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...register(name, validation)}
            className={clsx(
              baseClasses,
              'placeholder:text-gray-500 text-gray-100',
              errorClasses
            )}
          />
        )}
        
        {/* Character count */}
        {type === 'textarea' && maxLength && (
          <div 
            className={clsx(
              "absolute bottom-3 right-4 text-xs transition-colors duration-300",
              characterCount > maxLength * 0.9 ? 'text-red-400' : 'text-gray-400'
            )}
          >
            {characterCount}/{maxLength}
          </div>
        )}
      </div>

      {/* Error message */}
      <AnimatePresence mode="wait">
        {hasError && (
          <Motion.div
            variants={errorVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex items-center gap-2 text-red-400 text-sm mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20"
          >
            <AlertCircle size={16} />
            <span>{hasError.message}</span>
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.div>
  );
});

// Optimized ContactForm component
const ContactForm = memo(() => {
  const { 
    register, 
    handleSubmit, 
    reset, 
    watch,
    formState: { errors, isSubmitting, isDirty } 
  } = useForm({ 
    mode: 'onBlur',
    defaultValues: {
      title: '',
      from_name: '',
      reply_to: '',
      message: ''
    }
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setFieldTouched] = useState({});

  // Watch all form values for progress calculation
  const watchedValues = watch();
  const messageValue = watch('message', '');
  const messageLength = messageValue.length;

  // Optimized progress calculation
  const progressPercentage = useMemo(() => {
    const values = Object.values(watchedValues);
    const filledFields = values.filter(value => 
      value && typeof value === 'string' && value.trim().length > 0
    ).length;
    return Math.round((filledFields / formFields.length) * 100);
  }, [watchedValues]);

  const trackFieldInteraction = useCallback((fieldName) => {
    setFieldTouched(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  const onSubmit = useCallback(async (data) => {
    setIsLoading(true);
    
    try {
      const serviceId = import.meta.env.VITE_APP_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_APP_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_APP_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        const missing = [];
        if (!serviceId) missing.push('VITE_APP_EMAILJS_SERVICE_ID');
        if (!templateId) missing.push('VITE_APP_EMAILJS_TEMPLATE_ID');
        if (!publicKey) missing.push('VITE_APP_EMAILJS_PUBLIC_KEY');
        throw new Error(`EmailJS environment variable(s) missing: ${missing.join(', ')}`);
      }

      const enhancedData = {
        ...data,
        name: data.from_name || data.name,
        email: data.reply_to || data.email,
        from_name: data.from_name,
        reply_to: data.reply_to,
        title: data.title || 'Portfolio Inquiry',
        subject: data.title || 'Portfolio Inquiry',
        message: data.message,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent.substring(0, 100)
      };

      await emailjs.send(
        serviceId,
        templateId,
        enhancedData,
        {
          publicKey: publicKey
        }
      );
      
      setIsSuccess(true);
      toast.success("Message sent successfully! I'll get back to you within 24 hours.", {
        icon: <CheckCircle size={20} className="text-emerald-400" />,
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      reset();
      setTimeout(() => {
        setIsSuccess(false);
        setIsLoading(false);
      }, 3000);
      
    } catch (error) {
      const status = error?.status;
      const errorMsg = error?.text || error?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || '';
      console.error('EmailJS Submission Error:', { status, message: errorMsg, error });
      
      let userFriendlyMsg = 'Failed to send message. Please try again later or email directly.';
      
      if (errorMsg.includes('missing') || errorMsg.includes('required')) {
        userFriendlyMsg = 'Email service is missing API keys. Please check your .env configuration.';
      } else if (errorMsg.includes('Invalid grant') || errorMsg.includes('Gmail_API') || errorMsg.includes('OAuth')) {
        userFriendlyMsg = 'Gmail authorization expired. Please reconnect your Gmail account in the EmailJS dashboard.';
      } else if (status === 400 || errorMsg.includes('public key') || errorMsg.includes('service ID')) {
        userFriendlyMsg = 'Invalid EmailJS credentials. Please check Service ID, Template ID, and Public Key in .env.';
      } else if (status === 412) {
        userFriendlyMsg = 'Email service authorization required. Check your EmailJS dashboard.';
      } else if (status === 429) {
        userFriendlyMsg = 'Email service rate limit reached. Please try again later.';
      }

      toast.error(userFriendlyMsg, {
        icon: <AlertCircle size={20} className="text-red-400" />,
        position: "bottom-right",
        autoClose: 8000,
      });
      setIsLoading(false);
    }
  }, [reset]);

  return (
    <Motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Fixed progress indicator */}
      <div className="relative">
        <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden backdrop-blur-sm">
          <Motion.div
            className="h-full rounded-full bg-zinc-200"
            variants={progressVariants}
            custom={progressPercentage}
            initial="hidden"
            animate="visible"
          />
        </div>
        <div className="text-xs text-gray-400 mt-2 text-center">
          {progressPercentage}% Complete
        </div>
      </div>
      
      <Motion.form 
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-6" 
        noValidate
        variants={containerVariants}
      >
        {formFields.map((field, index) => (
          <FormField
            key={field.name}
            field={field}
            register={register}
            errors={errors}
            onFocus={trackFieldInteraction}
            characterCount={field.name === 'message' ? messageLength : 0}
            maxLength={field.name === 'message' ? 1000 : undefined}
            index={index}
          />
        ))}

        {/* Optimized submit button */}
        <Motion.button
          type="submit"
          disabled={isSubmitting || !isDirty}
          variants={buttonVariants}
          initial="idle"
          whileHover={!isSubmitting ? "hover" : "idle"}
          whileTap={!isSubmitting ? "tap" : "idle"}
          animate={isSuccess ? "success" : isLoading ? "loading" : "idle"}
          className={clsx(
            'relative w-full flex items-center justify-center gap-3 py-4 px-8 rounded-lg font-bold transition-all duration-300 overflow-hidden',
            isSuccess 
              ? 'bg-zinc-800 text-green-400 border border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
              : 'bg-accent text-white hover:bg-accentLight shadow-glass hover:shadow-glassGlow transition-all duration-300',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <Motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-3"
              >
                <Motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Loader size={20} />
                </Motion.div>
                <span>Sending...</span>
              </Motion.div>
            ) : isSuccess ? (
              <Motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-3"
              >
                <CheckCircle size={20} />
                <span>Message Sent!</span>
                <Sparkles size={16} />
              </Motion.div>
            ) : (
              <Motion.div
                key="send"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-3"
              >
                <Send size={20} />
                <span>Send Message</span>
                <Sparkles size={16} />
              </Motion.div>
            )}
          </AnimatePresence>
        </Motion.button>
      </Motion.form>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          backgroundColor: '#1f2937',
          color: '#f9fafb',
          borderRadius: '16px',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          backdropFilter: 'blur(12px)'
        }}
      />
    </Motion.div>
  );
});

// Optimized main Contact component
const Contact = memo(() => (
  <div className="xl:mt-8 flex xl:flex-row flex-col-reverse gap-8 sm:gap-10 overflow-hidden max-w-3xl mx-auto">
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex-1 p-6 xs:p-8 sm:p-10 rounded-2xl glass-card border border-white/10 relative overflow-hidden"
    >
      <div className="relative z-10">
        <Motion.div 
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.35 }}
        >
          <p className="text-zinc-500 mb-2 text-sm uppercase tracking-wider font-semibold">
            Get in touch
          </p>
          
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-100 mb-3">
            Connect <span className="accent-gradient-text italic font-serif">With Me</span>
          </h3>
          
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            Have a project in mind or interested in collaborating? Let's connect and build something extraordinary.
          </p>
        </Motion.div>
        
        <ContactForm />

        {/* Direct Social Links */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Mail size={15} className="text-accent" />
            <a href="mailto:sakmmm07@gmail.com" className="hover:text-white transition-colors">
              sakmmm07@gmail.com
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a 
              href="https://www.linkedin.com/in/saksham-agarwal-b44910289/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-white/10 hover:border-accent hover:text-white hover:bg-zinc-900 transition-all shadow-sm cursor-pointer"
            >
              <Linkedin size={14} className="text-blue-400" />
              <span>LinkedIn</span>
            </a>
            <a 
              href="https://github.com/saksham-dev07" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-white/10 hover:border-accent hover:text-white hover:bg-zinc-900 transition-all shadow-sm"
            >
              <Github size={14} />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </Motion.div>
  </div>
));

// Display names for React DevTools
Contact.displayName = 'Contact';
ContactForm.displayName = 'ContactForm';
FormField.displayName = 'FormField';

// Wrap with SectionWrapper
const ContactWrapped = SectionWrapper(Contact, 'contact');
ContactWrapped.displayName = 'ContactWrapped';

export default ContactWrapped;