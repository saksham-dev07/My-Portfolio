import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./portfolio.css";
import "./experience.css";
import "./studio.css";
import "./studio-index.css";

const rootElement = document.getElementById("root");

createRoot(rootElement).render(<App />);
