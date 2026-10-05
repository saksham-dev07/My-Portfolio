import { ArrowDownRight, Asterisk } from "lucide-react";

const phrases = [
  "Curiosity is the input.",
  "Craft is the process.",
  "Something useful is the output.",
];

export default function ChapterBridge() {
  return (
    <div className="chapter-bridge">
      <div className="bridge-ticker" aria-hidden="true">
        {[0, 1].map((repeat) => (
          <div className="ticker-track" key={repeat}>
            {phrases.map((phrase) => (
              <span key={phrase}>
                {phrase}
                <Asterisk size={31} />
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="shell bridge-caption">
        <p>
          Curiosity is the input. Craft is the process. Something useful is the
          output.
        </p>
        <a href="#projects" className="text-link">
          The work, up close <ArrowDownRight size={18} />
        </a>
      </div>
    </div>
  );
}
