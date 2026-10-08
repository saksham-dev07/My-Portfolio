import { Box, Camera, Download, UserRound } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { profileStudio } from "../../assets";
import ResponsiveImage from "../ResponsiveImage";
import "../../styles/portrait.css";

const PortraitBust = lazy(() => import("./PortraitBust"));

export default function PortraitStudio() {
  const [dimension, setDimension] = useState("bust");
  return (
    <div className="portrait-studio">
      <div className="portrait-studio-header">
        <span className="mono">THE PERSON BEHIND THE CODE</span>
        <div aria-label="Portrait presentation">
          <button
            type="button"
            aria-pressed={dimension === "photo"}
            onClick={() => setDimension("photo")}
          >
            <Camera size={12} /> Portrait
          </button>
          <button
            type="button"
            aria-pressed={dimension === "bust"}
            onClick={() => setDimension("bust")}
          >
            <Box size={12} /> In 3D
          </button>
        </div>
      </div>
      {dimension === "photo" ? (
        <div className="studio-photo-frame">
          <div className="portrait-photo-orbit" aria-hidden="true">
            <span />
            <span />
          </div>
          <span className="photo-coordinate mono" aria-hidden="true">
            SA / THE HUMAN
            <br />
            CURIOUS BY NATURE.
          </span>
          <ResponsiveImage
            sizes="(max-width: 650px) 320px, 380px"
            loading="eager"
            src={profileStudio}
            alt="Studio portrait of Saksham Agarwal"
            width={1024}
            height={1536}
            className="studio-photo"
          />
          <a
            className="portrait-download"
            href="/portrait/saksham-studio.png"
            download="Saksham-Agarwal-Studio-Portrait.png"
            aria-label="Download studio portrait"
          >
            <Download size={15} />
          </a>
          <div className="photo-signature">
            <span>Saksham Agarwal</span>
            <span className="mono">CSE @ VIT BHOPAL ’27</span>
          </div>
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="portrait-opening" role="status">
              <UserRound size={27} />
              <p>Opening another perspective…</p>
            </div>
          }
        >
          <PortraitBust portraitImage={profileStudio} />
        </Suspense>
      )}
    </div>
  );
}
