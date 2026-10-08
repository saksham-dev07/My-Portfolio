import { ArrowUpRight, GraduationCap } from "lucide-react";
import { profileStudio } from "../assets";
import { education } from "../constants";
import FieldNotes from "./FieldNotes";
import ResponsiveImage from "./ResponsiveImage";
import SectionHeading from "./SectionHeading";
export default function Education() {
  const current = education[0];
  return (
    <section
      id="education"
      className="shell section-block about-section"
      aria-labelledby="about-title"
    >
      <SectionHeading
        number="04"
        label="A little about me"
        title={
          <span id="about-title">
            Curious by nature.
            <br />
            <em>Engineer by practice.</em>
          </span>
        }
      />
      <div className="about-grid">
        <figure className="journey-portrait">
          <ResponsiveImage
            sizes="(max-width: 650px) 90vw, 520px"
            src={profileStudio}
            alt="Saksham Agarwal, the person behind the projects"
            width={1024}
            height={1536}
            loading="lazy"
          />
          <span className="portrait-annotation mono">
            THE HUMAN IN THE LOOP / SA
          </span>
          <figcaption>
            Still asking.
            <br />
            <em>Still building.</em>
          </figcaption>
        </figure>
        <div className="about-story">
          <div className="about-avatar">
            <ResponsiveImage
              sizes="64px"
              src={profileStudio}
              alt=""
              width={64}
              height={64}
              loading="lazy"
            />
            <div>
              <strong>Saksham Agarwal</strong>
              <span>Student, engineer, and design enthusiast.</span>
            </div>
          </div>
          <p>
            I’m pursuing Computer Science at VIT Bhopal, with a focus on applied
            AI and full-stack engineering. I enjoy turning complex technical
            ideas into experiences people can actually use.
          </p>
          <p>
            My projects explore how intelligent systems explain their decisions,
            how applications collaborate in real time, and how a
            natural-language idea becomes working software.
          </p>
          <a
            className="text-link"
            href="/resume.pdf"
            target="_blank"
            rel="noreferrer"
          >
            The full story, in my résumé <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="education-card">
          <div className="education-top">
            <GraduationCap size={26} />
            <span className="mono">CLASS OF 2027</span>
          </div>
          <h3>{current.title}</h3>
          <p>{current.institution}</p>
          <div className="education-score">
            <strong>
              8.46<span>/ 10</span>
            </strong>
            <span className="mono">CGPA</span>
          </div>
          <div className="education-bottom">
            <span>{current.period}</span>
            <span>VIT Bhopal University</span>
          </div>
          <details className="school-details">
            <summary>Earlier education</summary>
            {education.slice(1).map((item) => (
              <div key={item.id}>
                <h4>{item.title}</h4>
                <p>{item.institution}</p>
                <span className="mono">
                  {item.period} / {item.score}
                </span>
              </div>
            ))}
          </details>
        </div>
      </div>
      <FieldNotes />
    </section>
  );
}
