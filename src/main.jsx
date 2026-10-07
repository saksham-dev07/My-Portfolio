import { createRoot } from "react-dom/client";
import PortfolioRouter from "./PortfolioRouter.jsx";
import "./portfolio.css";
import "./experience.css";
import "./studio.css";
import "./studio-index.css";
import "./creative-studio.css";
import "./discovery.css";

const rootElement = document.getElementById("root");

createRoot(rootElement).render(<PortfolioRouter />);
