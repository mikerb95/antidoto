"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type WatchScreenType from "./WatchScreen";

// three va en un chunk aparte y sin SSR: el visor necesita WebGL.
const WatchScreen = dynamic(() => import("./WatchScreen"), {
  ssr: false,
  loading: () => (
    <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", background: "#E9EEF1", color: "#0C5C7D", fontFamily: "var(--font-poppins), sans-serif" }}>
      Preparando el visor…
    </div>
  ),
});

export default function WatchShell(props: ComponentProps<typeof WatchScreenType>) {
  return <WatchScreen {...props} />;
}
