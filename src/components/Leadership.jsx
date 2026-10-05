import { ArrowUpRight, Trophy, Users } from "lucide-react";
import { hackathons, leadership } from "../constants";
export default function Leadership() {
  return (
    <section
      id="leadership"
      className="shell community-section"
      aria-labelledby="community-title"
    >
      <div className="community-heading">
        <p className="eyebrow">Outside the code</p>
        <h2 id="community-title">Building with people.</h2>
      </div>
      <div className="community-grid">
        <article className="leadership-card">
          <Users size={25} />
          <span className="eyebrow">Leadership &amp; design</span>
          <h3>FinTech Club, VIT Bhopal</h3>
          <div className="leadership-timeline">
            {leadership.map((item) => (
              <div key={item.id}>
                <span className="mono">{item.period}</span>
                <h4>{item.title}</h4>
                <p>{item.highlights[0]}</p>
              </div>
            ))}
          </div>
        </article>
        <div className="achievement-list">
          {hackathons.map((item) => (
            <article key={item.id}>
              <div className="achievement-top">
                <Trophy size={21} />
                <span className="mono">{item.period}</span>
              </div>
              <h3>{item.title}</h3>
              <strong>{item.role}</strong>
              <p>{item.achievement}</p>
            </article>
          ))}
        </div>
      </div>
      <a href="#contact" className="text-link">
        Have something to build together? <ArrowUpRight size={16} />
      </a>
    </section>
  );
}
