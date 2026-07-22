"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}
interface State {
  hasError: boolean;
}

// WebGL isn't guaranteed everywhere (old GPUs, some sandboxed/corporate
// environments, headless test runners). If the 3D graph's renderer throws,
// fall back to the 2D canvas view instead of a blank crashed page.
export default class GraphErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[brane] 3D graph failed, falling back to 2D:", error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
