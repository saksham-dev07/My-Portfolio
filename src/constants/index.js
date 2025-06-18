// --- Assets Imports ---
// Group assets and sort alphabetically as needed.
import {
 
    comment,
    css,
    docker,
    figma,
    finance,
    html,
    javascript,
    meta,
    git,
    mongodb,
    nodejs,
    reactjs,
    redux,
    tailwind,
    threejs,
    typescript,
    malware,
    A_1,
    A_2,
    A_3,
    A_4,
    A_5,
    A_6,
    A_7,
    A_8,
    A_9,
    certificate_2,
    certificate_1,
    certificate_3,
    certificate_4,
    vit,
    ibm,   
} from "../assets";

// --- Icons Imports ---
import {
    IoCodeSlashOutline,
    IoHomeOutline,
    IoMailOutline,
    IoPersonOutline,
    IoSchoolOutline
} from "react-icons/io5";

/**
 * Navigation links for scrolling, external sites, or call-to-action items.
 */
export const navLinks = [
    {
        id: "about",
        title: "About",
        icon: IoPersonOutline,
        isCta: false,
        type: "section",
        external: false,
    },
    {
        id: "certifications",
        title: "Certificates",
        icon: IoSchoolOutline,
        isCta: false,
        type: "section",
        external: false,
    },
    {
        id: "projects",
        title: "Projects",
        icon: IoCodeSlashOutline,
        isCta: false,
        type: "section",
        external: false,
    },
    {
        id: "contact",
        title: "Contact",
        icon: IoMailOutline,
        isCta: true,
        type: "section",
        external: false,
    },
];

/**
 * List of services provided.
 */
export const services = [
    { title: "Web Developer", icon: A_1 },
    { title: "React Native Developer", icon: A_2 },
    { title: "Backend Engineer", icon: A_3 },
    { title: "Content Creator", icon: A_4 },
    { title: "Python Developer", icon: A_5 },
    { title: "Java Developer", icon: A_6 },
    { title: "C++ Developer", icon: A_7 },
    { title: "DevOps Engineer", icon: A_8 },
    { title: "Javascript Developer", icon: A_9 },
];

/**
 * Technologies and tools.
 */
export const technologies = [
    { name: "HTML5", icon: html },
    { name: "CSS3", icon: css },
    { name: "JavaScript", icon: javascript },
    { name: "TypeScript", icon: typescript },
    { name: "React.js", icon: reactjs },
    { name: "Redux Toolkit", icon: redux },
    { name: "Tailwind CSS", icon: tailwind },
    { name: "Node.js", icon: nodejs },
    { name: "MongoDB", icon: mongodb },
    { name: "Three.js", icon: threejs },
    { name: "Docker", icon: docker },
    { name: "Git", icon: git },
    { name: "Figma", icon: figma },
];

/**
 * Work experiences.
 */
export const experiences = [
    {
        title: "Lorem Ipsum",
        company_name: "Dolor Sit Amet Corp.",
        icon: meta,
        iconBg: "#383E56",
        date: "2023-01 - Present",
        location: "Lorem City, LP",
        tags: ["Lorem", "Ipsum", "Dolor", "Sit"],
        achievements: [
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
        ],
        points: [
            "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            "Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
            "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.",
            "Excepteur sint occaecat cupidatat non proident.",
        ],
        link: "https://www.loremipsum.com",
    },
    {
        title: "Consectetur Developer",
        company_name: "Adipiscing Inc.",
        icon: meta,
        iconBg: "#E6DEDD",
        date: "2022-06 - 2022-12",
        location: "Adipiscing, CA",
        tags: ["Lorem", "Dolor", "Sit", "Amet"],
        achievements: [
            "Excepteur sint occaecat cupidatat non proident.",
            "Sunt in culpa qui officia deserunt mollit anim id est laborum.",
        ],
        points: [
            "Nisi ut aliquip ex ea commodo consequat.",
            "Tempor incididunt ut labore et dolore magna aliqua.",
            "Ut enim ad minim veniam, quis nostrud exercitation.",
            "Voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        ],
        link: "https://www.adipiscinginc.com",
    },
    {
        title: "Junior Lorem Engineer",
        company_name: "Ipsum Co.",
        icon: meta,
        iconBg: "#383E56",
        date: "2022-01 - 2022-05",
        location: "Remote",
        tags: ["Lorem", "Ipsum", "Dolor"],
        achievements: [
            "Consectetur adipiscing elit sed do eiusmod tempor.",
            "Ut labore et dolore magna aliqua.",
        ],
        points: [
            "Ut enim ad minim veniam, quis nostrud.",
            "Exercitation ullamco laboris nisi ut aliquip.",
            "Duis aute irure dolor in reprehenderit.",
            "Velit esse cillum dolore eu fugiat nulla.",
        ],
        link: "https://www.ipsumco.com",
    },
];

/**
 * Certifications earned.
 */
export const certifications = [
    {
        id: 1,
        title: "Python Essentials",
        issuer: "VIT",
        date: "2024-09-17",
        description:
            " This certificate acknowledges the successful completion of the Python Essentials course. The recipient has demonstrated foundational knowledge of Python programming, including data types, control structures, functions, modules, and basic problem-solving techniques. This achievement highlights the ability to write, debug, and maintain Python scripts for a variety of applications.",
        imageSrc: certificate_1,
        profilePic: vit,
    },
    {
        id: 2,
        title: "Programming in Java",
        issuer: "VIT",
        date: "2025-03-28",
        description:
            " This certificate recognizes the successful completion of a comprehensive course in Java programming. The recipient has demonstrated proficiency in core Java concepts, including object-oriented programming, data structures, exception handling, file I/O, and the development of Java applications. This achievement reflects a strong foundation in software development using Java and the ability to build robust, maintainable, and efficient programs.",
        imageSrc: certificate_2,
        profilePic: vit,
    },
    {
        id: 3,
        title: "Fundamentals of AI and ML ",
        issuer: "VIT",
        date: "2025-06-17",
        description:
            "This certificate recognizes the successful completion of the Fundamentals of Artificial Intelligence and Machine Learning course. The recipient has demonstrated an understanding of core AI and ML concepts, including supervised and unsupervised learning, basic algorithms, data preprocessing, and model evaluation. This achievement reflects the ability to apply foundational techniques in AI and ML to solve real-world problems.",
        imageSrc: certificate_3,
        profilePic: vit,
    },
    {
        id: 4,
        title: "GEN AI Using IBM Watsonx",
        issuer: "IBM Career Education Program",
        date: "2025-06-13",
        description:
            "This certificate acknowledges the successful completion of the Generative AI Using IBM Watsonx course. The recipient has demonstrated proficiency in leveraging IBM Watsonx tools to develop, deploy, and manage generative AI models. This achievement highlights skills in prompt engineering, model customization, and applying generative AI solutions to real-world business challenges using IBM Watsonx technology.",
        imageSrc: certificate_4,
        profilePic: ibm,
    },
    
];


/**
 * Project details.
 */
export const projects = [
    {
        name: "Advanced Finance Tracker",
        description:
            "Manage your income and expenses efficiently with OCR support for easy data extraction.",
        tags: [
            { name: "Python (Flask)", color: "text-blue-300" },
            { name: "Tesseract OCR", color: "text-green-300" },
            { name: "HTML & CSS", color: "text-pink-300" },
        ],
        image: finance,
        source_code_link: "https://github.com/Warlord123456/ADVANCE_FINANCE_TRACKER",
        live_demo: null, // Use null to indicate absence of a live demo
    },
    {
        name: "Malware Detector",
        description:
            "Detect malware using hash checks, YARA rules, and the VirusTotal API.",
        tags: [
            { name: "Python (Flask)", color: "text-blue-300" },
            { name: "VirusTotal API", color: "text-green-300" },
            { name: "HTML & CSS", color: "text-pink-300" },
        ],
        image: malware,
        source_code_link: "https://github.com/Warlord123456/Malware-Detector",
        live_demo: null,
    },
    {
        name: "Code Comment Remover",
        description:
            "Improve code readability by removing comments from multiple programming languages including Python, JavaScript, Java, and C++.",
        tags: [
            { name: "Python (Flask)", color: "text-blue-300" },
            { name: "HTML & CSS", color: "text-pink-300" },
            { name: "Multi-language Support", color: "text-yellow-300" },
        ],
        image: comment,
        source_code_link: "https://github.com/Warlord123456/Code-comment-remover",
        live_demo: null,
    },
];