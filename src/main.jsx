import { createRoot } from "react-dom/client";
import PortfolioRouter from "./PortfolioRouter.jsx";
import "./styles/portfolio.css";
import "./styles/experience.css";
import "./styles/studio.css";
import "./styles/studio-index.css";
import "./styles/creative-studio.css";
import "./styles/discovery.css";

const rootElement = document.getElementById("root");

createRoot(rootElement).render(<PortfolioRouter />);
