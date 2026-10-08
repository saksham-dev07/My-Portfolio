import { ArrowUpRight, Check, Mail } from "lucide-react";
import { useEffect, useRef } from "react";
import { motionAllowed } from "../utils/studioMotion";

export default function ContactReceipt({ name, onWriteAgain }) {
  const heading = useRef(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.closest("form")?.scrollIntoView({
      behavior: motionAllowed() ? "smooth" : "instant",
      block: "center",
    });
  }, []);
  return (
    <div className="contact-receipt">
      <div className="receipt-signal" aria-hidden="true">
        <Mail className="receipt-envelope" size={28} strokeWidth={1.3} />
        <svg viewBox="0 0 360 100" fill="none">
          <path
            className="receipt-track"
            d="M36 56H142Q164 56 164 34T186 12H260Q284 12 284 36V56H322"
          />
          <path
            className="receipt-transfer"
            pathLength="1"
            d="M36 56H142Q164 56 164 34T186 12H260Q284 12 284 36V56H322"
          />
        </svg>
        <span className="receipt-check">
          <Check size={22} />
        </span>
      </div>
      <span className="mono">MESSAGE / SENT</span>
      <h4 ref={heading} tabIndex={-1}>
        Thanks, {name}.
      </h4>
      <p>Your message was sent. A good conversation starts here.</p>
      <button type="button" className="text-link" onClick={onWriteAgain}>
        Write another message <ArrowUpRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
