import {
  ArrowUpRight,
  Check,
  Copy,
  Github,
  Linkedin,
  LoaderCircle,
  Mail,
  Send,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import ContactReceipt from "./ContactReceipt";

const email = "sakmmm07@gmail.com";
const subjectStarters = [
  { label: "A role", title: "Let's talk about an opportunity" },
  { label: "A project", title: "Let's build something together" },
  { label: "A hello", title: "Hello from your portfolio" },
];
export default function Contact() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      name: "",
      reply_to: "",
      title: "",
      message: "",
      website: "",
    },
  });
  const [status, setStatus] = useState("idle");
  const [senderName, setSenderName] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  const data = watch();
  const draftLink = `mailto:${email}?subject=${encodeURIComponent(data.title || "Portfolio inquiry")}&body=${encodeURIComponent(`Hi Saksham,\n\n${data.message || ""}\n\n${data.name || ""}`)}`;
  const submit = async (values) => {
    setStatus("idle");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error("Delivery failed");
      setSenderName(values.name.trim().split(/\s+/)[0]);
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    } finally {
      clearTimeout(timeout);
    }
  };
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };
  const fieldProps = (name) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });
  return (
    <section
      id="contact"
      className="contact-section"
      aria-labelledby="contact-title"
    >
      <div className="shell contact-grid">
        <div className="contact-copy">
          <div className="contact-postmark" aria-hidden="true">
            <span>SA</span>
            <div className="mono">
              OPEN TO
              <br />
              WHAT'S NEXT
            </div>
            <svg viewBox="0 0 170 42">
              <path d="M0 6q20-10 40 0t40 0t40 0t40 0M0 20q20-10 40 0t40 0t40 0t40 0M0 34q20-10 40 0t40 0t40 0t40 0" />
            </svg>
          </div>
          <p className="eyebrow">
            <span className="section-number">06</span>Start a conversation
          </p>
          <h2 id="contact-title">
            A good idea
            <br />
            starts with
            <br />
            <em>a hello.</em>
          </h2>
          <p>
            Have a role, a challenging problem, or something interesting to
            build? I’d love to hear about it.
          </p>
          <div className="contact-email">
            <a href={`mailto:${email}`}>
              {email}
              <ArrowUpRight size={22} />
            </a>
            <button
              type="button"
              className="icon-button"
              onClick={copyEmail}
              aria-label={
                copied ? "Email address copied" : "Copy email address"
              }
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <span className="sr-only" role="status">
            {copied ? "Email address copied" : ""}
          </span>
          <div className="contact-socials">
            <a
              className="text-link"
              href="https://github.com/saksham-dev07"
              target="_blank"
              rel="noreferrer"
            >
              <Github size={17} />
              GitHub
              <ArrowUpRight size={15} />
            </a>
            <a
              className="text-link"
              href="https://www.linkedin.com/in/saksham-agarwal-b44910289/"
              target="_blank"
              rel="noreferrer"
            >
              <Linkedin size={17} />
              LinkedIn
              <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
        <form
          className="contact-form"
          data-delivery={status}
          noValidate
          onSubmit={handleSubmit(submit)}
        >
          <h3>Tell me what you have in mind.</h3>
          {status !== "success" && (
            <>
              <p className="form-intro">All fields are required.</p>
              <fieldset className="contact-fields" disabled={isSubmitting}>
                <div
                  className="contact-starters"
                  role="group"
                  aria-label="Choose a starting subject"
                >
                  {subjectStarters.map((starter) => (
                    <button
                      key={starter.label}
                      type="button"
                      aria-pressed={data.title === starter.title}
                      disabled={Boolean(
                        data.title &&
                          !subjectStarters.some(
                            (item) => item.title === data.title,
                          ),
                      )}
                      onClick={() =>
                        setValue("title", starter.title, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      {starter.label}
                      <ArrowUpRight size={12} />
                    </button>
                  ))}
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="contact-name">Your name</label>
                    <input
                      id="contact-name"
                      autoComplete="name"
                      placeholder="Alex Morgan"
                      maxLength={100}
                      {...register("name", {
                        required: "Please enter your name.",
                        validate: (value) =>
                          value.trim().length >= 2 ||
                          "Please enter at least 2 characters.",
                      })}
                      {...fieldProps("name")}
                    />
                    {errors.name && (
                      <p className="field-error" id="name-error">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="form-field">
                    <label htmlFor="contact-email">Email address</label>
                    <input
                      id="contact-email"
                      type="email"
                      autoComplete="email"
                      placeholder="alex@company.com"
                      maxLength={254}
                      {...register("reply_to", {
                        required: "Please enter your email.",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Please enter a valid email address.",
                        },
                      })}
                      {...fieldProps("reply_to")}
                    />
                    {errors.reply_to && (
                      <p className="field-error" id="reply_to-error">
                        {errors.reply_to.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="contact-subject">What’s this about?</label>
                  <input
                    id="contact-subject"
                    placeholder="An opportunity, a collaboration, an idea…"
                    maxLength={150}
                    {...register("title", {
                      required: "Please add a subject.",
                      validate: (value) =>
                        value.trim().length >= 3 ||
                        "Please enter at least 3 characters.",
                    })}
                    {...fieldProps("title")}
                  />
                  {errors.title && (
                    <p className="field-error" id="title-error">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                <div className="form-field">
                  <div className="message-label">
                    <label htmlFor="contact-message">Your message</label>
                    <span className="mono">{data.message.length} / 2000</span>
                  </div>
                  <textarea
                    id="contact-message"
                    placeholder="A little context goes a long way."
                    rows={5}
                    maxLength={2000}
                    {...register("message", {
                      required: "Please write a message.",
                      validate: (value) =>
                        value.trim().length >= 10 ||
                        "Please enter at least 10 characters.",
                    })}
                    {...fieldProps("message")}
                  />
                  {errors.message && (
                    <p className="field-error" id="message-error">
                      {errors.message.message}
                    </p>
                  )}
                </div>
                <div className="honeypot" aria-hidden="true">
                  <label htmlFor="contact-website">
                    Leave this field empty
                  </label>
                  <input
                    id="contact-website"
                    tabIndex={-1}
                    autoComplete="off"
                    {...register("website")}
                  />
                </div>
                <button
                  type="submit"
                  className="button button-primary send-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <span>Send message</span>
                      <Send size={17} />
                    </>
                  )}
                </button>
              </fieldset>
            </>
          )}
          <div className="form-status" role="status" aria-live="polite">
            {status === "success" && (
              <ContactReceipt
                name={senderName}
                onWriteAgain={() => {
                  setStatus("idle");
                  requestAnimationFrame(() =>
                    document.getElementById("contact-name")?.focus(),
                  );
                }}
              />
            )}
            {status === "error" && (
              <div className="error-message">
                <p>The message couldn’t be sent. Your draft is still here.</p>
                <a href={draftLink} className="text-link">
                  <Mail size={16} />
                  Open this draft in your email app <ArrowUpRight size={15} />
                </a>
              </div>
            )}
          </div>
          {status !== "success" && (
            <p className="form-note">
              Prefer your own email app?{" "}
              <a href={draftLink}>Email me directly.</a>
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
