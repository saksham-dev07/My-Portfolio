import { ArrowUpRight, Award, ChevronDown, Eye, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { certifications } from "../constants";
import SectionHeading from "./SectionHeading";

const categories = [
  { id: "all", label: "All credentials" },
  { id: "cloud", label: "Cloud & industry" },
  { id: "academic", label: "Academic & community" },
];
const formatDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
export default function Certifications() {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState(null);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const matches = certifications.filter(
    (cert) =>
      filter === "all" || (filter === "cloud" ? cert.id <= 6 : cert.id > 6),
  );
  const visible = expanded ? matches : matches.slice(0, 4);
  useEffect(() => {
    if (!selected) return;
    const dialog = dialogRef.current;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus({ preventScroll: true });
    };
  }, [selected]);
  return (
    <section
      id="credentials"
      className="shell section-block"
      aria-labelledby="credentials-title"
    >
      <SectionHeading
        number="05"
        label="Keep learning"
        title={
          <span id="credentials-title">
            Foundations that
            <br />
            <em>back the work.</em>
          </span>
        }
        description="Cloud certifications, coursework, and hands-on learning. View the documents or follow the issuer’s verification link."
      >
        <span className="credential-total">
          <Award size={22} />
          {certifications.length} credentials
        </span>
      </SectionHeading>
      <div
        className="filter-group credential-filters"
        aria-label="Filter credentials"
      >
        {categories.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={filter === item.id}
            onClick={() => {
              setFilter(item.id);
              setExpanded(false);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="credential-grid">
        {visible.map((cert) => (
          <article
            key={cert.id}
            className={`credential-card ${cert.id <= 2 ? "credential-featured" : ""}`}
          >
            <div className="credential-top">
              <img
                src={cert.profilePic}
                alt=""
                width={44}
                height={44}
                loading="lazy"
              />
              <span className="mono">{formatDate(cert.date)}</span>
            </div>
            <h3>{cert.title}</h3>
            <p>{cert.issuer}</p>
            <div className="tag-list">
              {cert.skills.slice(0, 2).map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
            <div className="credential-links">
              <button
                type="button"
                className="text-link"
                onClick={(event) => {
                  openerRef.current = event.currentTarget;
                  setSelected(cert);
                }}
                aria-label={`View ${cert.title} certificate`}
              >
                <Eye size={15} />
                View certificate
              </button>
              {cert.credentialUrl && (
                <a
                  className="text-link"
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Verify ${cert.title} with the issuer`}
                >
                  Verify <ArrowUpRight size={15} />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
      {matches.length > 4 && (
        <button
          type="button"
          className="archive-expand"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? "Show fewer credentials"
            : `View all ${matches.length} credentials`}
          <ChevronDown size={16} className={expanded ? "rotate-180" : ""} />
        </button>
      )}
      {selected && (
        <dialog
          ref={dialogRef}
          className="certificate-dialog"
          aria-labelledby="certificate-title"
          onCancel={() => setSelected(null)}
        >
          <div className="dialog-heading">
            <div>
              <span className="eyebrow">Credential document</span>
              <h3 id="certificate-title">{selected.title}</h3>
            </div>
            <button
              autoFocus
              type="button"
              className="icon-button"
              aria-label="Close certificate"
              onClick={() => setSelected(null)}
            >
              <X size={22} />
            </button>
          </div>
          <div className="certificate-image">
            <img
              src={selected.imageSrc}
              alt={`Certificate for ${selected.title}, issued by ${selected.issuer}`}
            />
          </div>
          <div className="dialog-footer">
            <p>{selected.description}</p>
            {selected.qrCode && (
              <img
                src={selected.qrCode}
                alt="Issuer verification QR code"
                width={88}
                height={88}
              />
            )}
            {selected.credentialUrl && (
              <a
                className="button button-primary"
                href={selected.credentialUrl}
                target="_blank"
                rel="noreferrer"
              >
                Verify with issuer <ArrowUpRight size={16} />
              </a>
            )}
          </div>
        </dialog>
      )}
    </section>
  );
}
