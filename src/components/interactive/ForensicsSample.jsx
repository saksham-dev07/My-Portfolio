import { Eye, ScanLine } from "lucide-react";
import { useId, useState } from "react";

const regions = [
  {
    id: "eyes",
    label: "Eye region",
    x: 140,
    y: 88,
    detail:
      "An attribution map makes the model's focus visible. Inspect nearby regions and the original frame before interpreting a highlighted patch.",
  },
  {
    id: "mouth",
    label: "Mouth region",
    x: 180,
    y: 153,
    detail:
      "A spatial explanation is one piece of evidence. Temporal consistency and audio alignment provide additional context in the full project.",
  },
  {
    id: "boundary",
    label: "Crop boundary",
    x: 240,
    y: 109,
    detail:
      "Attention near a crop edge can reveal sensitivity to background or preprocessing. The explanation helps you question what the model learned.",
  },
];

export default function ForensicsSample() {
  const id = useId().replaceAll(":", "");
  const [region, setRegion] = useState(regions[0]);
  const [visible, setVisible] = useState(true);
  const [strength, setStrength] = useState(70);
  return (
    <div className="forensics-sample">
      <div className="sample-heading">
        <span className="mono">
          <ScanLine size={13} aria-hidden="true" /> EXPLANATION / SAMPLE 01
        </span>
        <h4>See what informed the result.</h4>
        <p>Choose a region. Compare the frame with its explanation.</p>
      </div>
      <figure className="forensics-frame">
        <svg
          viewBox="0 0 360 220"
          role="img"
          aria-label={`Synthetic face frame${visible ? ` with illustrative attribution over the ${region.label.toLowerCase()}` : " without the explanation overlay"}`}
        >
          <defs>
            <radialGradient id={`${id}-heat`}>
              <stop stopColor="#ffd18e" />
              <stop offset=".3" stopColor="#ffac7c" stopOpacity=".85" />
              <stop offset=".65" stopColor="#b5a8ff" stopOpacity=".5" />
              <stop offset="1" stopColor="#6de6df" stopOpacity="0" />
            </radialGradient>
            <clipPath id={`${id}-crop`}>
              <rect x="92" y="18" width="177" height="190" rx="5" />
            </clipPath>
          </defs>
          <g className="sample-grid" stroke="currentColor" opacity=".08">
            {Array.from({ length: 12 }, (_, i) => (
              <path key={`v${i}`} d={`M${i * 32} 0v220`} />
            ))}
            {Array.from({ length: 8 }, (_, i) => (
              <path key={`h${i}`} d={`M0 ${i * 32}h360`} />
            ))}
          </g>
          <g fill="none" stroke="#adbad1" strokeWidth="1.4">
            <path d="M143 183c-39 5-51 22-58 37m132-37c39 5 51 22 58 37M144 183l9-20m64 20-9-20" />
            <path
              d="M118 73c0-38 21-52 62-52s62 14 62 52l-10 69c-10 30-32 44-52 44s-42-14-52-44Z"
              fill="#adbad110"
            />
            <path d="M119 67c17-5 18-20 35-26 24 17 56 12 82 25M134 84q15-10 30 0m32 0q15-10 30 0m-91 9q14 6 28 0m35 0q14 6 28 0m-48 0-6 32 13 3m-28 24q23 13 45 0" />
          </g>
          <rect
            x="92"
            y="18"
            width="177"
            height="190"
            rx="5"
            fill="none"
            stroke="#6de6df"
            strokeDasharray="5 5"
            opacity=".5"
          />
          <g
            clipPath={`url(#${id}-crop)`}
            className="sample-attribution"
            opacity={visible ? strength / 100 : 0}
          >
            <ellipse
              cx={region.x}
              cy={region.y}
              rx="75"
              ry="57"
              fill={`url(#${id}-heat)`}
            />
          </g>
          <g stroke="#ffe0a1" fill="none" opacity={visible ? 1 : 0}>
            <circle cx={region.x} cy={region.y} r="6" />
            <path
              d={`M${region.x - 12} ${region.y}h-6m30 0h6M${region.x} ${region.y - 12}v-6m0 30v6`}
            />
          </g>
          <text
            x="16"
            y="24"
            fill="#9faecc"
            fontSize="9"
            fontFamily="monospace"
          >
            FRAME / 001
          </text>
          <text
            x="16"
            y="204"
            fill="#9faecc"
            fontSize="9"
            fontFamily="monospace"
          >
            {visible ? "ATTRIBUTION ON" : "FRAME ONLY"}
          </text>
        </svg>
        <figcaption>Synthetic frame · Illustrative attribution</figcaption>
      </figure>
      <div
        className="sample-regions"
        role="group"
        aria-label="Inspect an explanation region"
      >
        {regions.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={region.id === item.id}
            onClick={() => setRegion(item)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="sample-controls">
        <button
          type="button"
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          <Eye size={14} aria-hidden="true" />
          {visible ? "Hide explanation" : "Show explanation"}
        </button>
        <label htmlFor={`${id}-strength`}>
          Overlay <output>{strength}%</output>
          <input
            id={`${id}-strength`}
            type="range"
            min="0"
            max="100"
            value={strength}
            onChange={(event) => setStrength(Number(event.target.value))}
          />
        </label>
      </div>
      <p className="sample-evidence" aria-live="polite">
        {region.detail}
      </p>
    </div>
  );
}
