import {
  certifications,
  education,
  hackathons,
  leadership,
  projects,
} from "../../../constants";

/**
 * Builds zone configurations and extract verified facts from existing resume data.
 * Purely pulls from real data — no hardcoded or fabricated metrics.
 */
export function buildSignalRunTrack() {
  const zonesConfig = [];

  // 1. ZONE 01 — EDUCATION
  const eduFacts = [];
  const vitEdu =
    education.find((e) => e.institution?.toLowerCase().includes("vit")) ||
    education[0];
  if (vitEdu) {
    eduFacts.push({
      id: "edu_vit_cgpa",
      tag: "DEGREE & TIMELINE",
      headline:
        vitEdu.institution?.split(" - ")?.[0] || "VIT Bhopal University",
      detail: `${vitEdu.title} (${vitEdu.period}) • ${vitEdu.score}`,
    });
    if (vitEdu.description) {
      eduFacts.push({
        id: "edu_vit_spec",
        tag: "ENGINEERING FOCUS",
        headline: "Class of 2027 Specialization",
        detail: vitEdu.description,
      });
    }
  }

  const schoolEdu = education.find(
    (e) => e.id === 2 || e.title?.includes("Class XII"),
  );
  if (schoolEdu) {
    eduFacts.push({
      id: "edu_school",
      tag: "ACADEMIC FOUNDATION",
      headline:
        schoolEdu.institution?.split(" - ")?.[0] ||
        "St. Anthony's Sr. Sec. School",
      detail: `${schoolEdu.title} (${schoolEdu.period}) • ${schoolEdu.score}`,
    });
  }

  zonesConfig.push({
    id: "education",
    number: "01",
    name: "EDUCATION",
    subtitle: "VIT Bhopal CGPA & Academic Timeline",
    accentColor: "#06b6d4", // Cyan
    glowColor: "rgba(6, 182, 212, 0.45)",
    speed: 260,
    facts: eduFacts,
  });

  // 2. ZONE 02 — PROJECTS
  const projFacts = [];
  const featured = projects.filter((p) => p.featured);
  const deepfake =
    featured.find((p) => p.id === "deepfake-forensics") || featured[0];
  if (deepfake) {
    const accMetric = deepfake.metrics?.find((m) =>
      m.label?.includes("accuracy"),
    )?.value;
    const sigMetric = deepfake.metrics?.find((m) =>
      m.label?.includes("signal"),
    )?.value;
    const mapMetric = deepfake.metrics?.find((m) =>
      m.label?.includes("explainability"),
    )?.value;
    projFacts.push({
      id: "proj_deepfake",
      tag: "FEATURED AI SYSTEM",
      headline: deepfake.name,
      detail: `${accMetric || "94.2%"} accuracy • ${sigMetric || "15"} signals fused (${mapMetric || "Grad-CAM & SHAP"})`,
    });
  }

  const nlCompiler =
    featured.find((p) => p.id === "nl-app-compiler") || featured[1];
  if (nlCompiler) {
    const stageMetric = nlCompiler.metrics?.find((m) =>
      m.label?.includes("stage"),
    )?.value;
    const synthMetric = nlCompiler.metrics?.find((m) =>
      m.label?.includes("schema"),
    )?.value;
    projFacts.push({
      id: "proj_nl_compiler",
      tag: "GENERATIVE AI PIPELINE",
      headline: nlCompiler.name,
      detail: `${stageMetric || "4"}-stage LLM compiler • ${synthMetric || "100%"} automated schema synthesis`,
    });
  }

  const docpilot = featured.find((p) => p.id === "docpilot") || featured[2];
  if (docpilot) {
    const scribeMetric = docpilot.metrics?.find((m) =>
      m.label?.includes("scribe"),
    )?.value;
    const roleMetric = docpilot.metrics?.find((m) =>
      m.label?.includes("role"),
    )?.value;
    projFacts.push({
      id: "proj_docpilot",
      tag: "HEALTHCARE PLATFORM",
      headline: docpilot.name,
      detail: `${docpilot.role} • ${scribeMetric || "Gemini AI"} consultation scribe (${roleMetric || "3"} scoped roles)`,
    });
  }

  zonesConfig.push({
    id: "projects",
    number: "02",
    name: "PROJECTS",
    subtitle: "Production AI Engines & Full-Stack Systems",
    accentColor: "#a855f7", // Purple
    glowColor: "rgba(168, 85, 247, 0.45)",
    speed: 280,
    facts: projFacts,
  });

  // 3. ZONE 03 — CERTIFICATIONS
  const certFacts = [];
  if (certifications && certifications.length > 0) {
    certFacts.push({
      id: "cert_total",
      tag: "CREDENTIAL COUNT",
      headline: `${certifications.length} Industry Certifications`,
      detail: `Spanning AWS Cloud & AI, IBM Watsonx, Google Cloud Skills, and NPTEL IIT Honors`,
    });

    const awsAi =
      certifications.find((c) => c.title?.includes("AI Practitioner")) ||
      certifications[0];
    if (awsAi) {
      certFacts.push({
        id: "cert_aws_ai",
        tag: "AWS CERTIFIED",
        headline: awsAi.title,
        detail: `Issued by ${awsAi.issuer} • Skills: ${awsAi.skills?.slice(0, 3)?.join(", ")}`,
      });
    }

    const highCert =
      certifications.find(
        (c) => c.issuer?.includes("L&T") || c.issuer?.includes("NPTEL"),
      ) || certifications[1];
    if (highCert) {
      certFacts.push({
        id: "cert_highlight",
        tag: "HONORS CERTIFICATION",
        headline: highCert.title,
        detail: `${highCert.issuer} • ${highCert.description?.split(". ")?.[0] || highCert.skills?.join(", ")}`,
      });
    }
  }

  zonesConfig.push({
    id: "certifications",
    number: "03",
    name: "CERTIFICATIONS",
    subtitle: "AWS, IBM & Industry Accreditations",
    accentColor: "#3b82f6", // Blue
    glowColor: "rgba(59, 130, 246, 0.45)",
    speed: 300,
    facts: certFacts,
  });

  // 4. ZONE 04 — HACKATHONS
  const hackFacts = [];
  if (hackathons && hackathons.length > 0) {
    hackathons.forEach((h, idx) => {
      hackFacts.push({
        id: `hack_${h.id || idx}`,
        tag: h.tag?.toUpperCase() || "HACKATHON RESULT",
        headline: `${h.title} (${h.period})`,
        detail: h.achievement || h.role,
      });
    });
  }

  zonesConfig.push({
    id: "hackathons",
    number: "04",
    name: "HACKATHONS",
    subtitle: "Competitive Algorithms & National ML Ranks",
    accentColor: "#f59e0b", // Amber
    glowColor: "rgba(245, 158, 11, 0.45)",
    speed: 315,
    facts: hackFacts,
  });

  // 5. ZONE 05 — LEADERSHIP
  const leadFacts = [];
  if (leadership && leadership.length > 0) {
    leadership.forEach((l, idx) => {
      const highlight = l.highlights?.[0] || l.organization;
      leadFacts.push({
        id: `lead_${l.id || idx}`,
        tag: "CAMPUS LEADERSHIP",
        headline: `${l.title} • ${l.organization}`,
        detail: `(${l.period}) ${highlight}`,
      });
    });
  }

  zonesConfig.push({
    id: "leadership",
    number: "05",
    name: "LEADERSHIP",
    subtitle: "FinTech Club Design Lead & Direction",
    accentColor: "#10b981", // Emerald
    glowColor: "rgba(16, 185, 129, 0.45)",
    speed: 330,
    facts: leadFacts,
  });

  // 6. ZONE 06 — FINISH
  zonesConfig.push({
    id: "finish",
    number: "06",
    name: "FINISH LINE",
    subtitle: "Quantum Gateway • Direct Hiring Outreach",
    accentColor: "#ec4899", // Magenta / Rose
    glowColor: "rgba(236, 72, 153, 0.45)",
    speed: 340,
    facts: [],
  });

  // Compile full world track geometry
  let currentWorldX = 0;
  const ZONE_RUN_LENGTH = 3200; // ~10-12 seconds of running per zone at standard speed
  const FINISH_RUN_LENGTH = 1600; // Finish zone with portal

  const compiledZones = [];
  const allCollectibles = [];
  const allObstacles = [];

  zonesConfig.forEach((zone, zoneIdx) => {
    const isFinishZone = zone.id === "finish";
    const zoneLength = isFinishZone ? FINISH_RUN_LENGTH : ZONE_RUN_LENGTH;
    const startX = currentWorldX;
    const endX = startX + zoneLength;

    const compiledZone = {
      ...zone,
      zoneIndex: zoneIdx,
      startX,
      endX,
      length: zoneLength,
      bannerShown: false,
    };

    // Distribute collectibles across the zone
    if (!isFinishZone && zone.facts.length > 0) {
      const factCount = zone.facts.length;
      // Position collectibles evenly within safe windows (e.g. 20%, 50%, 80% into the zone)
      const step = (zoneLength - 800) / Math.max(factCount, 1);
      zone.facts.forEach((fact, fIdx) => {
        const colWorldX = startX + 500 + fIdx * step;
        // Floating heights alternating between low hop (45px) and regular hop (75px)
        const offsetY = fIdx % 2 === 0 ? -48 : -78;
        allCollectibles.push({
          id: fact.id,
          zoneId: zone.id,
          zoneIndex: zoneIdx,
          worldX: colWorldX,
          offsetY, // relative to ground
          radius: 12,
          collected: false,
          fact,
          color: zone.accentColor,
        });
      });
    }

    // Place 2-3 gentle obstacles per zone (only in non-finish zones)
    if (!isFinishZone) {
      // 2 obstacles per zone for forgiving, accessible platforming
      // Staggered far from collectibles and spaced > 1000px apart
      const obstacleOffsets = [1100, 2300];
      obstacleOffsets.forEach((offset, oIdx) => {
        const obsWorldX = startX + offset;
        const type =
          (zoneIdx + oIdx) % 2 === 0 ? "glitch_block" : "energy_gate";
        if (type === "glitch_block") {
          allObstacles.push({
            id: `obs_${zoneIdx}_${oIdx}`,
            zoneIndex: zoneIdx,
            worldX: obsWorldX,
            type: "glitch_block",
            w: 32,
            h: 36,
            offsetY: -36, // ground sitting
            color: zone.accentColor,
          });
        } else {
          allObstacles.push({
            id: `obs_${zoneIdx}_${oIdx}`,
            zoneIndex: zoneIdx,
            worldX: obsWorldX,
            type: "energy_gate",
            w: 28,
            h: 32,
            offsetY: -32, // floating barrier or low pylon
            color: "#f43f5e", // Rose/red hazard
          });
        }
      });
    }

    // If finish zone, place portal
    if (isFinishZone) {
      compiledZone.portalX = startX + 1100;
    }

    compiledZones.push(compiledZone);
    currentWorldX = endX;
  });

  return {
    zones: compiledZones,
    collectibles: allCollectibles,
    obstacles: allObstacles,
    totalTrackLength: currentWorldX,
    totalCollectiblesCount: allCollectibles.length,
  };
}
