// Contact.jsx - Performance optimized with working progress bar
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { toast, ToastContainer } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { Loader, Send, CheckCircle, AlertCircle, User, Mail, MessageSquare, FileText, Sparkles } from 'lucide-react';
import clsx from 'clsx';

import 'react-toastify/dist/ReactToastify.css';
import { styles } from '../styles';
import { EarthCanvas } from './canvas';
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
  idle: { color: '#9CA3AF', scale: 1 },
  focus: { color: '#3B82F6', scale: 1.1, transition: { duration: 0.2 } },
  error: { color: '#EF4444', scale: 1.1, transition: { duration: 0.2 } }
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

  const baseClasses = 'bg-formBg/80 backdrop-blur-sm py-4 px-5 pl-14 rounded-2xl outline-none transition-all duration-300 border-2 w-full font-medium';
  const errorClasses = hasError
    ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/5'
    : 'border-gray-700/50 focus:border-focusBorder focus:ring-2 focus:ring-focusBorder/20 hover:border-gray-600/50';

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
          'block text-sm font-semibold mb-3 transition-colors duration-300',
          isFocused ? 'text-focusBorder' : hasError ? 'text-red-400' : 'text-gray-300'
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
  const [fieldTouched, setFieldTouched] = useState({});

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
      const enhancedData = {
        ...data,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent.substring(0, 100)
      };

      await emailjs.send(
        import.meta.env.VITE_APP_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_APP_EMAILJS_TEMPLATE_ID,
        enhancedData,
        import.meta.env.VITE_APP_EMAILJS_PUBLIC_KEY
      );
      
      setIsSuccess(true);
      toast.success("🎉 Message sent successfully! I'll get back to you within 24 hours.", {
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
      console.error('EmailJS Error:', error);
      toast.error(`❌ Failed to send message. ${error.text || 'Please try again later.'}`, {
        position: "bottom-right",
        autoClose: 7000,
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
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"
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
            'relative w-full flex items-center justify-center gap-3 py-5 px-8 rounded-2xl font-bold shadow-lg transition-all duration-300 overflow-hidden',
            isSuccess 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
              : 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700',
            'text-white disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:ring-4 focus:ring-blue-500/30 focus:outline-none'
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
                <span>Message Sent! ✨</span>
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
  <div className="xl:mt-16 flex xl:flex-row flex-col-reverse gap-12 overflow-hidden">
    <Motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex-1 p-8 md:p-12 rounded-3xl bg-surface/80 backdrop-blur-xl shadow-2xl border border-gray-700/50 relative overflow-hidden"
    >
      <div className="relative z-10">
        <Motion.div 
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className={clsx(styles.sectionSubText, 'text-blue-400 mb-2')}>
            Get in touch ✨
          </p>
          
          <h3 className={clsx(styles.sectionHeadText, 'mb-4')}>
            Let's Create Something{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Amazing
            </span>
          </h3>
          
          <p className="text-gray-300 text-lg leading-relaxed">
            Have a project in mind? I'd love to hear about it. Send me a message and let's discuss how we can bring your ideas to life with cutting-edge technology and creative solutions.
          </p>
        </Motion.div>
        
        <ContactForm />
      </div>
    </Motion.div>

    {/* Earth Canvas section */}
    <Motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      className="xl:flex-1 xl:h-auto md:h-[550px] h-[350px] rounded-3xl overflow-hidden shadow-2xl relative"
    >
      <EarthCanvas />
      
      {/* Overlay gradient for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
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