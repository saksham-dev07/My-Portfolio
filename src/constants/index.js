import {
  Award,
  BrainCircuit,
  CloudCog,
  Code2,
  Globe,
  GraduationCap,
  Mail,
  Server,
  ShieldCheck,
  TerminalSquare,
  Users,
} from "lucide-react";

// --- Assets Imports ---
import {
  anthony,
  aws,
  aws_ai_practitioner,
  aws_cloud_practitioner,
  blockforge,
  certificate_1,
  certificate_2,
  certificate_3,
  certificate_4,
  certificate_5,
  certificate_7,
  certificate_8,
  certificate_9,
  certificate_10,
  comment,
  deepfake,
  delivery,
  docpilot,
  expenselens,
  fintech,
  futureai,
  futureai_qr,
  google,
  ibm,
  lnt,
  malware,
  marketing_analytics_qr,
  ml_intro_qr,
  nexusboard,
  nl,
  nptel,
  pingpong,
  scrapeverse,
  story,
  vit,
  vitb,
  vityarthi_ai_qr,
  vityarthi_java_qr,
  vityarthi_python_qr,
} from "../assets";
import {
  AppwriteIcon,
  AwsIcon,
  CIcon,
  CppIcon,
  CssIcon,
  DockerIcon,
  ExpressIcon,
  FastapiIcon,
  FigmaIcon,
  FirebaseIcon,
  FlaskIcon,
  GcpIcon,
  GitIcon,
  HtmlIcon,
  JavaIcon,
  JsIcon,
  JupyterIcon,
  LinuxIcon,
  MongoIcon,
  MysqlIcon,
  NextIcon,
  NodeIcon,
  OpencvIcon,
  PostgresIcon,
  PostmanIcon,
  PythonIcon,
  PytorchIcon,
  ReactIcon,
  ReduxIcon,
  ScikitlearnIcon,
  TailwindIcon,
  TensorflowIcon,
  ThreeIcon,
  TsIcon,
  VercelIcon,
} from "../assets/techIcons";

/**
 * Navigation links for scrolling, external sites, or call-to-action items.
 */
export const navLinks = [
  {
    id: "projects",
    title: "Work",
    icon: Code2,
    isCta: false,
    type: "section",
    external: false,
  },
  {
    id: "systems-lab",
    title: "Systems Lab",
    icon: Server,
    isCta: false,
    type: "section",
    external: false,
  },
  {
    id: "skills",
    title: "Skills",
    icon: BrainCircuit,
    isCta: false,
    type: "section",
    external: false,
  },
  {
    id: "credentials",
    title: "Credentials",
    icon: Award,
    isCta: false,
    type: "section",
    external: false,
  },
  {
    id: "education",
    title: "Education",
    icon: GraduationCap,
    isCta: false,
    type: "section",
    external: false,
  },
  {
    id: "leadership",
    title: "Leadership",
    icon: Users,
    isCta: false,
    type: "section",
    external: false,
  },
  {
    id: "contact",
    title: "Contact",
    icon: Mail,
    isCta: true,
    type: "section",
    external: false,
  },
];

/**
 * Education Timeline data from Official Resume
 */
export const education = [
  {
    id: 1,
    title: "B.Tech in Computer Science Engineering",
    institution: "VIT Bhopal University - Bhopal, India",
    period: "2023 - 2027",
    score: "CGPA: 8.46 / 10.0",
    progress: 84.6,
    description:
      "Specializing in Computer Science Engineering, Artificial Intelligence, Machine Learning, and Full-Stack Systems. Class of 2027.",
    profilePic: vitb,
  },
  {
    id: 2,
    title: "Class XII (CBSE - Science Stream)",
    institution: "St. Anthony's Senior Secondary School - Farrukhabad, UP",
    period: "2021 - 2022",
    score: "Percentage: 71.6%",
    progress: 71.6,
    description:
      "Senior Secondary education focusing on Physics, Chemistry, Mathematics, and Computer Science.",
    profilePic: anthony,
  },
  {
    id: 3,
    title: "Class X (CBSE)",
    institution: "St. Anthony's Senior Secondary School - Farrukhabad, UP",
    period: "2019 - 2020",
    score: "Percentage: 88.8%",
    progress: 88.8,
    description:
      "Secondary school education with high academic standing across Mathematics and Science.",
    profilePic: anthony,
  },
];

/**
 * Hackathons & Competitions from Official Resume
 */
export const hackathons = [
  {
    id: 1,
    title: "TCS CodeVita",
    role: "Global Rank 6735 of 20,540",
    period: "2025",
    achievement:
      "Secured Global Rank 6735 out of 20,540 participants in Round 1.",
    tag: "Competitive Programming",
  },
  {
    id: 2,
    title: "Gridlock Hackathon 2.0 (Flipkart)",
    role: "Round 2 Qualifier (Solo Participant)",
    period: "2026",
    achievement:
      "Qualified solo in Flipkart's national ML hackathon, building a traffic-demand prediction model with 93.94% accuracy on HackerEarth.",
    tag: "National ML Hackathon",
  },
];

/**
 * Volunteering & Leadership from Official Resume & Letters
 */
export const leadership = [
  {
    id: 1,
    title: "Design Team Lead",
    organization: "FinTech Club - VIT Bhopal",
    period: "2025 - Present",
    highlights: [
      "Spearheading the club's end-to-end visual identity, event collateral, social media assets, and digital campaigns across major fintech workshops and competitions.",
      "Driving consistent brand presence and directing design initiatives across all club activities.",
    ],
    profilePic: fintech,
  },
  {
    id: 2,
    title: "Core Member - Design Team",
    organization: "FinTech Club - VIT Bhopal",
    period: "2024 - 2025",
    highlights: [
      "Selected as Core Member of the Design Team following competitive recruitment selection.",
      "Collaborated cross-functionally with content, events, and technical sub-teams to design impactful visual deliverables for club initiatives.",
    ],
    profilePic: fintech,
  },
];

/**
 * List of services / roles provided (Aligned with Resume Engineering Profile).
 */
export const services = [
  { title: "Full-Stack Web Development", icon: Globe },
  { title: "Applied ML & AI Systems", icon: BrainCircuit },
  { title: "Backend & Distributed Systems", icon: Server },
  { title: "AI Forensics & Security", icon: ShieldCheck },
  { title: "Python Systems Programming", icon: TerminalSquare },
  { title: "Cloud Architecture & DevOps", icon: CloudCog },
];

/**
 * Technologies and tools (Optimized Official Vector SVGs for instant 0ms load).
 */
export const technologies = [
  // Core Languages
  {
    name: "Python",
    icon: PythonIcon,
    category: "Languages",
    desc: "Primary systems & AI language",
  },
  {
    name: "Java",
    icon: JavaIcon,
    category: "Languages",
    desc: "OOP, data structures & algorithms",
  },
  {
    name: "C++",
    icon: CppIcon,
    category: "Languages",
    desc: "High-performance systems & problem solving",
  },
  {
    name: "TypeScript",
    icon: TsIcon,
    category: "Languages",
    desc: "Typed scalable modern JavaScript",
  },
  {
    name: "JavaScript",
    icon: JsIcon,
    category: "Languages",
    desc: "Core interactive web development",
  },
  {
    name: "C",
    icon: CIcon,
    category: "Languages",
    desc: "Low-level memory & OS fundamentals",
  },

  // Web & Full-Stack
  {
    name: "React.js",
    icon: ReactIcon,
    category: "Frontend",
    desc: "Reactive component architecture",
  },
  {
    name: "Next.js",
    icon: NextIcon,
    category: "Frontend",
    desc: "Server-side rendering & App Router",
  },
  {
    name: "FastAPI",
    icon: FastapiIcon,
    category: "Backend",
    desc: "High-throughput async Python REST APIs",
  },
  {
    name: "Flask",
    icon: FlaskIcon,
    category: "Backend",
    desc: "Lightweight Python microservices",
  },
  {
    name: "Node.js",
    icon: NodeIcon,
    category: "Backend",
    desc: "Asynchronous event-driven runtime",
  },
  {
    name: "Express.js",
    icon: ExpressIcon,
    category: "Backend",
    desc: "RESTful server routing & middleware",
  },
  {
    name: "Tailwind CSS",
    icon: TailwindIcon,
    category: "Frontend",
    desc: "Modern utility-first responsive UI",
  },
  {
    name: "Redux Toolkit",
    icon: ReduxIcon,
    category: "Frontend",
    desc: "Predictable centralized state management",
  },
  {
    name: "Three.js",
    icon: ThreeIcon,
    category: "Frontend",
    desc: "Interactive WebGL 3D graphics",
  },
  {
    name: "HTML5",
    icon: HtmlIcon,
    category: "Frontend",
    desc: "Semantic structure & accessibility",
  },
  {
    name: "CSS3",
    icon: CssIcon,
    category: "Frontend",
    desc: "Fluid layouts & modern animations",
  },

  // AI & Machine Learning
  {
    name: "PyTorch",
    icon: PytorchIcon,
    category: "AI & ML",
    desc: "Deep learning & neural networks",
  },
  {
    name: "TensorFlow",
    icon: TensorflowIcon,
    category: "AI & ML",
    desc: "End-to-end ML model pipelines",
  },
  {
    name: "OpenCV",
    icon: OpencvIcon,
    category: "AI & ML",
    desc: "Computer vision & image analysis",
  },
  {
    name: "scikit-learn",
    icon: ScikitlearnIcon,
    category: "AI & ML",
    desc: "Predictive modeling & statistical ML",
  },

  // Databases & Cloud
  {
    name: "PostgreSQL",
    icon: PostgresIcon,
    category: "Cloud & DB",
    desc: "Relational database & SQL queries",
  },
  {
    name: "MongoDB",
    icon: MongoIcon,
    category: "Cloud & DB",
    desc: "NoSQL document store & collections",
  },
  {
    name: "MySQL",
    icon: MysqlIcon,
    category: "Cloud & DB",
    desc: "Relational database management",
  },
  {
    name: "Firebase",
    icon: FirebaseIcon,
    category: "Cloud & DB",
    desc: "Realtime database & cloud auth",
  },
  {
    name: "Appwrite",
    icon: AppwriteIcon,
    category: "Cloud & DB",
    desc: "Secure backend-as-a-service",
  },
  {
    name: "Google Cloud",
    icon: GcpIcon,
    category: "Cloud & DB",
    desc: "GCP infrastructure & cloud compute",
  },
  {
    name: "AWS",
    icon: AwsIcon,
    category: "Cloud & DB",
    desc: "Certified AI Practitioner & cloud architecture",
  },

  // DevOps & Tools
  {
    name: "Docker",
    icon: DockerIcon,
    category: "DevOps & Tools",
    desc: "Containerization & deployment",
  },
  {
    name: "Git",
    icon: GitIcon,
    category: "DevOps & Tools",
    desc: "Version control & collaboration",
  },
  {
    name: "Linux",
    icon: LinuxIcon,
    category: "DevOps & Tools",
    desc: "POSIX terminal & shell automation",
  },
  {
    name: "Postman",
    icon: PostmanIcon,
    category: "DevOps & Tools",
    desc: "API testing, mocks & documentation",
  },
  {
    name: "Vercel",
    icon: VercelIcon,
    category: "DevOps & Tools",
    desc: "Edge deployment & CI/CD workflows",
  },
  {
    name: "Jupyter",
    icon: JupyterIcon,
    category: "DevOps & Tools",
    desc: "Data exploration & ML prototyping",
  },
  {
    name: "Figma",
    icon: FigmaIcon,
    category: "DevOps & Tools",
    desc: "UI/UX wireframing & prototyping",
  },
];

/**
 * Certifications earned (All certifications from resume & credentials).
 */
export const certifications = [
  {
    id: 1,
    title: "AWS Certified AI Practitioner",
    issuer: "Amazon Web Services (AWS)",
    date: "2026-09-04",
    expirationDate: "2029-09-04",
    validationNumber: "a9c8149546a744f1abfb63c0140809fc",
    credentialUrl:
      "https://cp.certmetrics.com/amazon/en/public/verify/credential/a9c8149546a744f1abfb63c0140809fc",
    description:
      "Industry credential validating foundational knowledge of artificial intelligence, machine learning concepts, and generative AI services on AWS.",
    skills: [
      "Generative AI",
      "Machine Learning",
      "Amazon Bedrock",
      "Prompt Engineering",
      "Responsible AI",
    ],
    imageSrc: aws_ai_practitioner,
    profilePic: aws,
  },
  {
    id: 2,
    title: "AWS Certified Cloud Practitioner",
    issuer: "Amazon Web Services (AWS)",
    date: "2026-09-04",
    expirationDate: "2029-09-04",
    validationNumber: "06aad1dcc8e147cdb48972cb44a6c810",
    credentialUrl:
      "https://cp.certmetrics.com/amazon/en/public/verify/credential/06aad1dcc8e147cdb48972cb44a6c810",
    description:
      "Official AWS credential demonstrating an overall understanding of AWS Cloud concepts, core AWS services, security, architecture, pricing, and support models.",
    skills: [
      "Cloud Computing",
      "AWS Core Services",
      "Cloud Security",
      "Cloud Architecture",
      "Billing & Pricing",
    ],
    imageSrc: aws_cloud_practitioner,
    profilePic: aws,
  },
  {
    id: 3,
    title: "Generative AI Using IBM Watsonx",
    issuer: "IBM Skills Network & Career Education",
    date: "2025-06-13",
    validationNumber: "60c690f32b0840d1846b829372463e44",
    credentialUrl:
      "https://courses.vit.skillsnetwork.site/certificates/60c690f32b0840d1846b829372463e44",
    description:
      "Proficiency in leveraging IBM Watsonx tools to develop, deploy, and manage generative AI models, prompt engineering, and model customization.",
    skills: [
      "Generative AI",
      "IBM Watsonx",
      "Prompt Engineering",
      "Foundation Models",
      "LLM Tuning",
    ],
    imageSrc: certificate_4,
    profilePic: ibm,
  },
  {
    id: 4,
    title: "AI & Edge Computing for Industry Applications",
    issuer: "Larsen & Toubro (L&T EduTech)",
    date: "2025-07-07",
    description:
      "Industry Certification Program offered by CollegeConnect Program of L&T EduTech. Awarded Grade A+.",
    skills: [
      "Edge Computing",
      "Applied AI",
      "Industrial IoT",
      "Embedded Systems",
      "Computer Vision",
    ],
    imageSrc: certificate_7,
    profilePic: lnt,
  },
  {
    id: 5,
    title: "Google Cloud Skills Boost",
    issuer: "Google Cloud Platform (GCP)",
    date: "2025-05-15",
    credentialUrl:
      "https://www.skills.google/public_profiles/eac4a7ac-4652-4ab3-bded-ae5785b67892",
    description:
      "Hands-on expertise in cloud architecture, GCP services, infrastructure deployment, and cloud-hosted ML services.",
    skills: [
      "Google Cloud",
      "Cloud Architecture",
      "BigQuery",
      "Compute Engine",
      "Cloud Security",
    ],
    imageSrc: google,
    profilePic: google,
  },
  {
    id: 6,
    title: "The Bits and Bytes of Computer Networking",
    issuer: "Google & Coursera",
    date: "2025-11-19",
    validationNumber: "0QWGIHP7LEJF",
    credentialUrl: "https://coursera.org/verify/0QWGIHP7LEJF",
    description:
      "Authorized online course by Google covering fundamentals of modern computer networking, TCP/IP, and cloud protocols.",
    skills: [
      "Computer Networking",
      "TCP/IP Protocol",
      "Network Troubleshooting",
      "DNS & DHCP",
      "Routing",
    ],
    imageSrc: certificate_9,
    profilePic: google,
  },
  {
    id: 7,
    title: "Marketing Analytics",
    issuer: "NPTEL & IIT Kharagpur",
    date: "2026-04-01",
    verifyMethod: "qr",
    validationNumber: "NPTEL26MG33S1052405420",
    credentialUrl:
      "https://nptel.ac.in/noc/E_Certificate/NOC26MG33S105240542004847551",
    qrCode: marketing_analytics_qr,
    description:
      "Elite NPTEL Online Certification (Funded by MoE, Govt. of India) in Marketing Analytics with a consolidated score of 85%.",
    skills: [
      "Marketing Analytics",
      "Predictive Modeling",
      "Customer Lifetime Value",
      "Data Analytics",
      "Statistical Analysis",
    ],
    imageSrc: certificate_8,
    profilePic: nptel,
  },
  {
    id: 8,
    title: "Introduction to Machine Learning",
    issuer: "NPTEL & IIT Madras",
    date: "2025-04-01",
    verifyMethod: "qr",
    validationNumber: "NPTEL25CS46S350600275",
    qrCode: ml_intro_qr,
    description:
      "NPTEL Online Certification in Introduction to Machine Learning covering supervised learning algorithms, gradient descent, and model optimization.",
    skills: [
      "Machine Learning",
      "Supervised Learning",
      "Gradient Descent",
      "Model Optimization",
      "scikit-learn",
    ],
    imageSrc: certificate_10,
    profilePic: nptel,
  },
  {
    id: 9,
    title: "FutureAI Global Hackathon 2026",
    issuer: "FutureAI",
    date: "2026-01-01",
    verifyMethod: "qr",
    credentialUrl: "http://Futureai.lokeshloki.in",
    qrCode: futureai_qr,
    description:
      "Certificate of Participation as a Global Innovator in the FutureAI Global Hackathon 2026, building impactful AI-powered solutions.",
    skills: [
      "Hackathon Innovator",
      "Generative AI",
      "Full-Stack AI",
      "Rapid Prototyping",
      "Team Collaboration",
    ],
    imageSrc: certificate_5,
    profilePic: futureai,
  },
  {
    id: 10,
    title: "Fundamentals of AI and ML",
    issuer: "VIT Bhopal University (Vityarthi)",
    date: "2025-06-17",
    verifyMethod: "qr",
    validationNumber: "FyTURgiBvnft",
    credentialUrl: "https://vityarthi.com/certificate/FyTURgiBvnft",
    qrCode: vityarthi_ai_qr,
    description:
      "Core AI and ML concepts including supervised and unsupervised learning, algorithms, data preprocessing, and model evaluation.",
    skills: [
      "AI Fundamentals",
      "Machine Learning",
      "Data Preprocessing",
      "Neural Networks",
      "Model Evaluation",
    ],
    imageSrc: certificate_3,
    profilePic: vit,
  },
  {
    id: 11,
    title: "Programming in Java",
    issuer: "VIT Bhopal University (Vityarthi)",
    date: "2025-03-28",
    verifyMethod: "qr",
    validationNumber: "NZIT8x4oJnts",
    credentialUrl: "https://vityarthi.com/certificate/NZIT8x4oJnts",
    qrCode: vityarthi_java_qr,
    description:
      "Proficiency in core Java concepts, including object-oriented programming, data structures, exception handling, and file I/O development.",
    skills: [
      "Java",
      "Object-Oriented Programming",
      "Data Structures",
      "Exception Handling",
      "File I/O",
    ],
    imageSrc: certificate_2,
    profilePic: vit,
  },
  {
    id: 12,
    title: "Python Essentials",
    issuer: "VIT Bhopal University (Vityarthi)",
    date: "2024-09-17",
    verifyMethod: "qr",
    validationNumber: "ae26b9d852",
    credentialUrl: "https://vityarthi.com/certificate/ae26b9d852",
    qrCode: vityarthi_python_qr,
    description:
      "Foundational knowledge of Python programming, including data types, control structures, functions, modules, and basic problem-solving techniques.",
    skills: [
      "Python",
      "Control Structures",
      "Data Structures",
      "Functions & Modules",
      "Algorithms",
    ],
    imageSrc: certificate_1,
    profilePic: vit,
  },
];

/**
 * Project details spanning resume featured projects and latest GitHub repositories.
 */
export const projects = [
  {
    id: "deepfake-forensics",
    name: "Deepfake Forensics & Explainable AI",
    role: "Computer Vision & Forensics",
    period: "Aug 2026",
    category: "ai",
    featured: true,
    description:
      "Production-grade, multi-modal deepfake forensics engine fusing 15 detection signals — EfficientNet-B4 visual classifier with Grad-CAM/SHAP, SyncNet lip-sync analysis, and automated PDF evidence reporting.",
    metrics: [
      { label: "detection signals fused", value: "15" },
      { label: "validation accuracy", value: "94.2%" },
      { label: "explainability maps", value: "Grad-CAM & SHAP" },
    ],
    codeSnippet: `// Multi-modal forensic signal fusion & Grad-CAM attribution
const visualScore = await efficientnetB4.classifyFrame(faceCrop);
const syncConfidence = await syncnet.evaluateLipSync(audioMel, mouthSequence);
const explainabilityMap = await generateGradCamMap(targetLayer="conv_head");
const verdict = fuseForensics([visualScore, syncConfidence, frequencyArtifacts]);`,
    tags: [
      { name: "Python", color: "text-blue-300" },
      { name: "PyTorch", color: "text-orange-300" },
      { name: "FastAPI", color: "text-emerald-300" },
      { name: "React", color: "text-cyan-300" },
      { name: "OpenCV", color: "text-purple-300" },
    ],
    image: deepfake,
    source_code_link:
      "https://github.com/saksham-dev07/Deepfake-Forensics-with-Explainable-AI",
    live_demo: "https://deepforensics.vercel.app/",
  },
  {
    id: "nl-app-compiler",
    name: "NL App Compiler (Generative AI)",
    role: "Generative AI & LLM Systems",
    period: "Jul 2026",
    category: "ai",
    featured: true,
    description:
      "4-stage compiler-style LLM pipeline — intent parsing, UI/UX design generation, database schema synthesis, and cross-layer refinement — turning natural-language prompts into validated, deployable web apps.",
    metrics: [
      { label: "compiler pipeline stages", value: "4" },
      { label: "automated schema synthesis", value: "100%" },
      { label: "syntax verification", value: "Multi-pass AST" },
    ],
    codeSnippet: `// 4-stage natural language to full-stack compiler
const intentAST = await parsePromptToIntent(prompt);
const schemaModel = await synthesizeDatabaseSchema(intentAST);
const componentTree = await generateReactComponents(intentAST, schemaModel);
const deployableApp = await crossLayerVerifier.compile(componentTree);`,
    tags: [
      { name: "Node.js", color: "text-green-300" },
      { name: "JavaScript", color: "text-yellow-300" },
      { name: "Gemini API", color: "text-purple-300" },
      { name: "LLM Pipeline", color: "text-teal-300" },
    ],
    image: nl,
    source_code_link: "https://github.com/saksham-dev07/NL-App-Compiler",
    live_demo: null,
  },
  {
    id: "docpilot",
    name: "DocPilot – Clinical Management Platform",
    role: "Healthcare Platform, Team of Six",
    period: "May 2026",
    category: "fullstack",
    featured: true,
    description:
      "Full-stack, role-based healthcare platform with Gemini AI as an intelligent consultation scribe auto-generating structured clinical notes, with Firebase multi-role auth and Appwrite real-time sync.",
    metrics: [
      { label: "scoped access roles", value: "3" },
      { label: "real-time state sync", value: "Appwrite" },
      { label: "consultation scribe", value: "Gemini AI" },
    ],
    codeSnippet: `// Role-based clinical security rules & patient privacy boundary
match /consultations/{consultId} {
  allow read, write: if isAuthenticated() && 
    (request.auth.uid == resource.data.doctorId || 
     request.auth.uid == resource.data.patientId);
  allow generateNote: if hasRole('doctor') && isValidConsultationData(request.resource.data);
}`,
    tags: [
      { name: "React", color: "text-cyan-300" },
      { name: "TypeScript", color: "text-blue-300" },
      { name: "Firebase", color: "text-yellow-300" },
      { name: "Appwrite", color: "text-indigo-300" },
      { name: "Gemini AI", color: "text-purple-300" },
    ],
    image: docpilot,
    source_code_link: "https://github.com/saksham-dev07/Docpilot",
    live_demo: null,
  },
  {
    id: "nexusboard",
    name: "NexusBoard – Collaborative Canvas",
    role: "Real-Time Systems & WebSockets",
    period: "Apr 2026",
    category: "fullstack",
    featured: true,
    description:
      "Real-time collaborative infinite canvas and digital whiteboard engine featuring live multi-user synchronization over WebSockets and ultra-smooth freehand drawing using HTML5 Canvas API.",
    metrics: [
      { label: "WebSocket sync latency", value: "< 20ms" },
      { label: "render loop rate", value: "60 FPS" },
      { label: "multi-user live sync", value: "CRDT / Delta" },
    ],
    codeSnippet: `// High-frequency canvas delta synchronization over WebSockets
canvas.on('path:created', (event) => {
  const delta = serializeStrokeDelta(event.path);
  socket.emit('broadcast:stroke', { userId, delta, timestamp: performance.now() });
});`,
    tags: [
      { name: "React 18", color: "text-cyan-300" },
      { name: "Tailwind CSS", color: "text-blue-300" },
      { name: "WebSockets", color: "text-emerald-300" },
      { name: "Canvas API", color: "text-amber-300" },
    ],
    image: nexusboard,
    source_code_link: "https://github.com/saksham-dev07/NexusBoard",
    live_demo: null,
  },
  {
    id: "lastmile",
    name: "Last-Mile Delivery Tracker",
    role: "Logistics Routing & Telemetry",
    period: "Mar 2026",
    category: "backend",
    featured: false,
    description:
      "Smart logistics platform for last-mile delivery tracking with real-time GPS vehicle routing, live ETA calculations, package status cards, and courier assignment dispatch.",
    tags: [
      { name: "Python", color: "text-blue-300" },
      { name: "Leaflet Maps", color: "text-emerald-300" },
      { name: "JavaScript", color: "text-yellow-300" },
      { name: "Vercel", color: "text-sky-300" },
    ],
    image: delivery,
    source_code_link:
      "https://github.com/saksham-dev07/Last-Mile-Delivery-Tracker",
    live_demo: "https://last-mile-delivery-tracker-omega.vercel.app",
  },
  {
    id: "scrapeverse",
    name: "Into-the-Scrape-Verse",
    role: "Automated Data Ingestion",
    period: "Feb 2026",
    category: "backend",
    featured: false,
    description:
      "Advanced TypeScript-based web scraping and automated extraction engine with live crawling status, robust queue management, and structured data streaming.",
    tags: [
      { name: "TypeScript", color: "text-blue-300" },
      { name: "Node.js", color: "text-green-300" },
      { name: "Puppeteer", color: "text-amber-300" },
      { name: "Render", color: "text-purple-300" },
    ],
    image: scrapeverse,
    source_code_link: "https://github.com/saksham-dev07/Into-the-Scrape-Verse",
    live_demo: "https://into-the-scrape-verse.onrender.com/",
  },
  {
    id: "malware-detector",
    name: "Malware Detector & Security Forensics",
    role: "Cybersecurity & PE Forensics",
    period: "Jan 2026",
    category: "ai",
    featured: false,
    description:
      "Hybrid malware inspection engine combining custom YARA signature rules with heuristic behavioral analysis — performing static analysis of PE headers, entropy metrics, and behavioral indicators.",
    tags: [
      { name: "Python", color: "text-blue-300" },
      { name: "YARA Rules", color: "text-red-400" },
      { name: "PE Forensics", color: "text-purple-300" },
      { name: "Entropy Analysis", color: "text-emerald-300" },
    ],
    image: malware,
    source_code_link: "https://github.com/saksham-dev07/Malware-Detector",
    live_demo: null,
  },
  {
    id: "expenselens",
    name: "ExpenseLens Tracker",
    role: "Financial Analytics",
    period: "Nov 2025",
    category: "fullstack",
    featured: false,
    description:
      "Modern web expense tracker allowing users to track income, budgets, and categorized spending analytics in real-time.",
    tags: [
      { name: "JavaScript", color: "text-yellow-300" },
      { name: "HTML/CSS", color: "text-blue-300" },
      { name: "Analytics", color: "text-emerald-300" },
    ],
    image: expenselens,
    source_code_link: "https://github.com/saksham-dev07/ExpenseLens",
    live_demo: "https://expense-lens-two.vercel.app/",
  },
  {
    id: "pingpong",
    name: "Gesture Ping Pong",
    role: "Computer Vision & Human Interface",
    period: "Oct 2025",
    category: "ai",
    featured: false,
    description:
      "Interactive OpenCV & Python ping pong game controlled using real-time hand gesture tracking via computer webcam with zero physical controllers.",
    tags: [
      { name: "Python", color: "text-blue-300" },
      { name: "OpenCV", color: "text-green-300" },
      { name: "MediaPipe", color: "text-yellow-300" },
    ],
    image: pingpong,
    source_code_link:
      "https://github.com/saksham-dev07/Hand-Gesture-Controlled-Ping-Pong-Game-main",
    live_demo: "https://hand-gesture-controlled-ping-pong-g.vercel.app",
  },
  {
    id: "blockforge",
    name: "Blockforge Ad Blocker",
    role: "Browser Extension",
    period: "Sep 2025",
    category: "fullstack",
    featured: false,
    description:
      "Fast, high-performance browser extension built with modern JavaScript that blocks intrusive advertisements across the web.",
    tags: [
      { name: "JavaScript", color: "text-yellow-300" },
      { name: "Manifest V3", color: "text-teal-300" },
    ],
    image: blockforge,
    source_code_link:
      "https://github.com/saksham-dev07/Blockforge-Ad-Block-Extension-",
    live_demo: null,
  },
  {
    id: "comment-remover",
    name: "Code Comment Remover",
    role: "Developer Utility",
    period: "Aug 2025",
    category: "backend",
    featured: false,
    description:
      "A lightweight tool to improve code readability by automatically stripping out comments from various programming languages.",
    tags: [
      { name: "Python", color: "text-blue-300" },
      { name: "Regex AST", color: "text-orange-300" },
    ],
    image: comment,
    source_code_link: "https://github.com/saksham-dev07/Code-comment-remover",
    live_demo: null,
  },
  {
    id: "story-generator",
    name: "AI Story Generator",
    role: "Generative AI",
    period: "Jun 2025",
    category: "ai",
    featured: false,
    description:
      "Generative AI powered creative writing tool leveraging LLM APIs to generate dynamic stories, narrative outlines, and character arcs.",
    tags: [
      { name: "Python", color: "text-blue-300" },
      { name: "LLM APIs", color: "text-purple-300" },
    ],
    image: story,
    source_code_link: "https://github.com/saksham-dev07/AI-Story-Generator",
    live_demo: null,
  },
];
