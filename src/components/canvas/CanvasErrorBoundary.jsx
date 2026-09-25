import { Component } from "react";

/**
 * Error boundary specifically for Three.js / WebGL Canvases.
 * Prevents WebGL context loss, model parse errors, or R3F reconciliation
 * exceptions from bubbling up and crashing the entire React DOM root.
 */
export class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Gracefully log WebGL error without crashing DOM
    console.warn(
      "WebGL Canvas encountered an issue and was safely caught:",
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

export default CanvasErrorBoundary;
