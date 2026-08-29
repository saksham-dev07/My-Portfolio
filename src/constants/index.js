import {
    HtmlIcon,
    CssIcon,
    JsIcon,
    TsIcon,
    ReactIcon,
    ReduxIcon,
    TailwindIcon,
    NodeIcon,
    MongoIcon,
    ThreeIcon,
    DockerIcon,
    GitIcon,
    FigmaIcon,
    PythonIcon,
    PytorchIcon,
    FastapiIcon,
    JavaIcon,
    CppIcon,
    CIcon,
    NextIcon,
    FlaskIcon,
    ExpressIcon,
    TensorflowIcon,
    OpencvIcon,
    ScikitlearnIcon,
    PostgresIcon,
    MysqlIcon,
    FirebaseIcon,
    AppwriteIcon,
    GcpIcon,
    LinuxIcon,
    PostmanIcon,
    VercelIcon,
    JupyterIcon,
} from "../assets/techIcons";

// --- Assets Imports ---
import {
    certificate_2,
    certificate_1,
    certificate_3,
    certificate_4,
    certificate_5,
    certificate_7,
    certificate_8,
    certificate_9,
    certificate_10,
    vit,
    ibm,
    lnt,
    nptel,
    futureai,
    google,
    vitb,
    anthony,
    fintech,
    expenselens,
    deepfake,
    blockforge,
    comment,
    pingpong,
    docpilot,
    story,
    nl,
    nexusboard,
    malware,
    scrapeverse,
    delivery,
} from "../assets";

import {
    Code2,
    Mail,
    User,
    Award,
    Globe,
    Smartphone,
    Server,
    PenTool,
    TerminalSquare,
    Coffee,
    FileCode2,
    CloudCog,
    Braces,
    GraduationCap,
    Users,
    BrainCircuit,
    ShieldCheck
} from "lucide-react";

/**
 * Navigation links for scrolling, external sites, or call-to-action items.
 */
export const navLinks = [
    {
        id: "about",
        title: "About",
        icon: User,
        isCta: false,
        type: "section",
        external: false,
    },
    {
        id: "projects",
        title: "Projects",
        icon: Code2,
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
        id: "certifications",
        title: "Certificates",
        icon: Award,
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
        institution: "St. Anthony's Senior Secondary School - India",
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
        institution: "St. Anthony's Senior Secondary School - India",
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
        achievement: "Secured Global Rank 6735 out of 20,540 participants in Round 1.",
        tag: "Competitive Programming"
    },
    {
        id: 2,
        title: "Gridlock Hackathon 2.0 (Flipkart)",
        role: "Round 2 Qualifier (Solo Participant)",
        period: "2026",
        achievement: "Qualified solo in Flipkart's national ML hackathon, building a traffic-demand prediction model with 93.94% accuracy on HackerEarth.",
        tag: "National ML Hackathon"
    }
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
            "Driving consistent brand presence and directing design initiatives across all club activities."
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
            "Collaborated cross-functionally with content, events, and technical sub-teams to design impactful visual deliverables for club initiatives."
        ],
        profilePic: fintech,
    }
];

/**
 * List of services / roles provided (Aligned with Resume Engineering Profile).
 */
export const services = [
    { title: "Full-Stack Web Developer", icon: Globe },
    { title: "Applied ML & AI Engineer", icon: BrainCircuit },
    { title: "Backend & Distributed Systems", icon: Server },
    { title: "AI Forensics & Security", icon: ShieldCheck },
    { title: "Python Systems Developer", icon: TerminalSquare },
    { title: "Cloud & DevOps Engineer", icon: CloudCog },
];

/**
 * Technologies and tools (Optimized Official Vector SVGs for instant 0ms load).
 */
export const technologies = [
    // Core Languages
    { name: "Python", icon: PythonIcon },
    { name: "Java", icon: JavaIcon },
    { name: "C++", icon: CppIcon },
    { name: "TypeScript", icon: TsIcon },
    { name: "JavaScript", icon: JsIcon },
    { name: "C", icon: CIcon },

    // Web & Full-Stack
    { name: "React.js", icon: ReactIcon },
    { name: "Next.js", icon: NextIcon },
    { name: "FastAPI", icon: FastapiIcon },
    { name: "Flask", icon: FlaskIcon },
    { name: "Node.js", icon: NodeIcon },
    { name: "Express.js", icon: ExpressIcon },
    { name: "Tailwind CSS", icon: TailwindIcon },
    { name: "Redux Toolkit", icon: ReduxIcon },
    { name: "Three.js", icon: ThreeIcon },
    { name: "HTML5", icon: HtmlIcon },
    { name: "CSS3", icon: CssIcon },

    // AI & Machine Learning
    { name: "PyTorch", icon: PytorchIcon },
    { name: "TensorFlow", icon: TensorflowIcon },
    { name: "OpenCV", icon: OpencvIcon },
    { name: "scikit-learn", icon: ScikitlearnIcon },

    // Databases & Cloud
    { name: "PostgreSQL", icon: PostgresIcon },
    { name: "MongoDB", icon: MongoIcon },
    { name: "MySQL", icon: MysqlIcon },
    { name: "Firebase", icon: FirebaseIcon },
    { name: "Appwrite", icon: AppwriteIcon },
    { name: "Google Cloud", icon: GcpIcon },

    // DevOps & Tools
    { name: "Docker", icon: DockerIcon },
    { name: "Git", icon: GitIcon },
    { name: "Linux", icon: LinuxIcon },
    { name: "Postman", icon: PostmanIcon },
    { name: "Vercel", icon: VercelIcon },
    { name: "Jupyter", icon: JupyterIcon },
    { name: "Figma", icon: FigmaIcon },
];

/**
 * Certifications earned (All certifications from resume & credentials).
 */
export const certifications = [
    {
        id: 1,
        title: "Generative AI Using IBM Watsonx",
        issuer: "IBM Skills Network & Career Education",
        date: "2025-06-13",
        description:
            "Proficiency in leveraging IBM Watsonx tools to develop, deploy, and manage generative AI models, prompt engineering, and model customization.",
        imageSrc: certificate_4,
        profilePic: ibm,
    },
    {
        id: 2,
        title: "AI & Edge Computing for Industry Applications",
        issuer: "Larsen & Toubro (L&T EduTech)",
        date: "2025-07-07",
        description:
            "Industry Certification Program offered by CollegeConnect Program of L&T EduTech. Awarded Grade A+.",
        imageSrc: certificate_7,
        profilePic: lnt,
    },
    {
        id: 3,
        title: "Google Cloud Skills Boost",
        issuer: "Google Cloud Platform (GCP)",
        date: "2025",
        description:
            "Hands-on expertise in cloud architecture, GCP services, infrastructure deployment, and cloud-hosted ML services.",
        imageSrc: google,
        profilePic: google,
    },
    {
        id: 4,
        title: "The Bits and Bytes of Computer Networking",
        issuer: "Google & Coursera",
        date: "2025-11-19",
        description:
            "Authorized online course by Google covering fundamentals of modern computer networking, TCP/IP, and cloud protocols.",
        imageSrc: certificate_9,
        profilePic: google,
    },
    {
        id: 5,
        title: "Marketing Analytics",
        issuer: "NPTEL & IIT Kharagpur / IIT Kanpur",
        date: "2026-04-01",
        description:
            "Elite NPTEL Online Certification (Funded by MoE, Govt. of India) in Marketing Analytics with a consolidated score of 85%.",
        imageSrc: certificate_8,
        profilePic: nptel,
    },
    {
        id: 6,
        title: "Introduction to Machine Learning",
        issuer: "NPTEL & IIT Madras / IIT Kanpur",
        date: "2025-04-01",
        description:
            "NPTEL Online Certification in Introduction to Machine Learning covering supervised learning algorithms, gradient descent, and model optimization.",
        imageSrc: certificate_10,
        profilePic: nptel,
    },
    {
        id: 7,
        title: "FutureAI Global Hackathon 2026",
        issuer: "FutureAI",
        date: "2026-01-01",
        description:
            "Certificate of Participation as a Global Innovator in the FutureAI Global Hackathon 2026, building impactful AI-powered solutions.",
        imageSrc: certificate_5,
        profilePic: futureai,
    },
    {
        id: 8,
        title: "Fundamentals of AI and ML",
        issuer: "VIT Bhopal University",
        date: "2025-06-17",
        description:
            "Core AI and ML concepts including supervised and unsupervised learning, algorithms, data preprocessing, and model evaluation.",
        imageSrc: certificate_3,
        profilePic: vit,
    },
    {
        id: 9,
        title: "Programming in Java",
        issuer: "VIT Bhopal University",
        date: "2025-03-28",
        description:
            "Proficiency in core Java concepts, including object-oriented programming, data structures, exception handling, and file I/O development.",
        imageSrc: certificate_2,
        profilePic: vit,
    },
    {
        id: 10,
        title: "Python Essentials",
        issuer: "VIT Bhopal University",
        date: "2024-09-17",
        description:
            "Foundational knowledge of Python programming, including data types, control structures, functions, modules, and basic problem-solving techniques.",
        imageSrc: certificate_1,
        profilePic: vit,
    },
];

/**
 * Project details spanning resume featured projects and latest GitHub repositories.
 */
export const projects = [
    {
        name: "Deepfake Forensics & Explainable AI",
        description:
            "Production-grade, multi-modal deepfake forensics engine fusing 15 detection signals — EfficientNet-B4 visual classifier with Grad-CAM/SHAP, SyncNet lip-sync analysis, and automated PDF evidence reporting.",
        tags: [
            { name: "Python", color: "text-blue-300" },
            { name: "PyTorch", color: "text-orange-300" },
            { name: "FastAPI", color: "text-emerald-300" },
            { name: "React", color: "text-cyan-300" },
            { name: "OpenCV", color: "text-purple-300" },
        ],
        image: deepfake,
        source_code_link: "https://github.com/saksham-dev07/Deepfake-Forensics-with-Explainable-AI",
        live_demo: "https://deepforensics.vercel.app/",
    },
    {
        name: "NL App Compiler (Generative AI)",
        description:
            "4-stage compiler-style LLM pipeline — intent parsing, UI/UX design generation, database schema synthesis, and cross-layer refinement — turning natural-language prompts into validated, deployable web apps.",
        tags: [
            { name: "Node.js", color: "text-green-300" },
            { name: "JavaScript", color: "text-yellow-300" },
            { name: "Gemini API", color: "text-purple-300" },
            { name: "LLM Pipeline", color: "text-pink-300" },
        ],
        image: nl,
        source_code_link: "https://github.com/saksham-dev07/NL-App-Compiler",
        live_demo: null,
    },
    {
        name: "NexusBoard – Collaborative Canvas",
        description:
            "Real-time collaborative infinite canvas and digital whiteboard engine featuring live multi-user synchronization over WebSockets and ultra-smooth freehand drawing using HTML5 Canvas API.",
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
        name: "DocPilot – Clinical Management Platform",
        description:
            "Full-stack, role-based healthcare platform with Gemini AI as an intelligent consultation scribe auto-generating structured clinical notes, with Firebase multi-role auth and Appwrite real-time sync.",
        tags: [
            { name: "React", color: "text-cyan-300" },
            { name: "TypeScript", color: "text-blue-300" },
            { name: "Firebase", color: "text-yellow-300" },
            { name: "Appwrite", color: "text-pink-300" },
            { name: "Gemini AI", color: "text-purple-300" },
        ],
        image: docpilot,
        source_code_link: "https://github.com/saksham-dev07/Docpilot",
        live_demo: null,
    },
    {
        name: "Malware Detector & Security Forensics",
        description:
            "Hybrid malware inspection engine combining custom YARA signature rules with heuristic behavioral analysis — performing static analysis of PE headers, entropy metrics, and behavioral indicators.",
        tags: [
            { name: "Python", color: "text-blue-300" },
            { name: "YARA", color: "text-red-400" },
            { name: "PE Forensics", color: "text-purple-300" },
            { name: "Cybersecurity", color: "text-emerald-300" },
        ],
        image: malware,
        source_code_link: "https://github.com/saksham-dev07/Malware-Detector",
        live_demo: null,
    },
    {
        name: "Into-the-Scrape-Verse",
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
        name: "Last-Mile Delivery Tracker",
        description:
            "Smart logistics platform for last-mile delivery tracking with real-time GPS vehicle routing, live ETA calculations, package status cards, and courier assignment dispatch.",
        tags: [
            { name: "Python", color: "text-blue-300" },
            { name: "JavaScript", color: "text-yellow-300" },
            { name: "Leaflet / Maps", color: "text-emerald-300" },
            { name: "Vercel", color: "text-pink-300" },
        ],
        image: delivery,
        source_code_link: "https://github.com/saksham-dev07/Last-Mile-Delivery-Tracker",
        live_demo: "https://last-mile-delivery-tracker-omega.vercel.app",
    },
    {
        name: "ExpenseLens Tracker",
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
        name: "Gesture Ping Pong",
        description:
            "Interactive OpenCV & Python ping pong game controlled using real-time hand gesture tracking via computer webcam with zero physical controllers.",
        tags: [
            { name: "Python", color: "text-blue-300" },
            { name: "OpenCV", color: "text-green-300" },
            { name: "MediaPipe", color: "text-yellow-300" },
        ],
        image: pingpong,
        source_code_link: "https://github.com/saksham-dev07/Hand-Gesture-Controlled-Ping-Pong-Game-main",
        live_demo: "https://hand-gesture-controlled-ping-pong-g.vercel.app",
    },
    {
        name: "Blockforge Ad Blocker",
        description:
            "Fast, high-performance browser extension built with modern JavaScript that blocks intrusive advertisements across the web.",
        tags: [
            { name: "JavaScript", color: "text-yellow-300" },
            { name: "Browser Extension", color: "text-pink-300" },
        ],
        image: blockforge,
        source_code_link: "https://github.com/saksham-dev07/Blockforge-Ad-Block-Extension-",
        live_demo: null,
    },
    {
        name: "Code Comment Remover",
        description:
            "A lightweight tool to improve code readability by automatically stripping out comments from various programming languages.",
        tags: [
            { name: "HTML/JS", color: "text-orange-300" },
            { name: "Python", color: "text-blue-300" },
        ],
        image: comment,
        source_code_link: "https://github.com/saksham-dev07/Code-comment-remover",
        live_demo: null,
    },
    {
        name: "AI Story Generator",
        description:
            "Generative AI powered creative writing tool leveraging LLM APIs to generate dynamic stories, narrative outlines, and character arcs.",
        tags: [
            { name: "Python", color: "text-blue-300" },
            { name: "Generative AI", color: "text-purple-300" },
        ],
        image: story,
        source_code_link: "https://github.com/saksham-dev07/AI-Story-Generator",
        live_demo: null,
    },
];