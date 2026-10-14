import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import "../styles/privacy.css";

export default function Privacy() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Privacy | Saksham Agarwal";
    return () => {
      document.title = previous;
    };
  }, []);
  return (
    <main className="privacy-page" id="main-content">
      <a href="/#contact" className="text-link">
        <ArrowLeft size={16} />
        Back to contact
      </a>
      <p className="eyebrow">
        <ShieldCheck size={16} />
        Privacy and your inquiry
      </p>
      <h1>A conversation, handled with care.</h1>
      <p>
        Last updated: 14 October 2026. This notice covers Saksham Agarwal’s
        portfolio and driving world, not the external projects linked from them.
      </p>
      <h2>What the contact form collects</h2>
      <p>
        Your name, email address, subject and message are used to read and
        respond to your inquiry. Please do not include passwords, financial
        details, health information or other sensitive personal information.
      </p>
      <h2>Where your message goes</h2>
      <p>
        Vercel hosts the site and processes the contact request. Resend delivers
        the message to my Gmail inbox. Those providers process data under their
        own service and privacy terms. The form does not publish your message on
        this website.
      </p>
      <h2>Retention and deletion</h2>
      <p>
        I keep inquiries in my inbox until I delete them. You can ask me to
        delete an inquiry by emailing the address below. Provider delivery and
        hosting logs may have separate retention periods; I do not control all
        provider backups. Copies in your own sent mail remain under your
        control.
      </p>
      <h2>Preferences stored on your device</h2>
      <p>
        The portfolio stores your theme, motion preference, discoveries, game
        progress and return position using local or session storage. This
        information supports the experience and is not an account or
        authentication token. You can clear it through your browser’s site-data
        settings.
      </p>
      <h2>Hosting and security information</h2>
      <p>
        Hosting services process request information such as IP addresses to
        deliver the site and prevent abuse. Application delivery events record
        an outcome, status and random request ID without recording your message,
        email address or name. No advertising tracker or third-party analytics
        widget is added by the application.
      </p>
      <h2>Questions or a deletion request</h2>
      <p>
        <a href="mailto:sakmmm07@gmail.com" className="text-link">
          <Mail size={16} />
          sakmmm07@gmail.com
        </a>
      </p>
    </main>
  );
}
