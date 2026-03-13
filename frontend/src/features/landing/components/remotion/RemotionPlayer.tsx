import React from "react";
import { Player } from "@remotion/player";

import { DashboardAnimation } from "./DashboardAnimation";

export const RemotionPlayer: React.FC = () => {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-primary/10 shadow-2xl ring-1 ring-white/5">
      <div className="absolute top-0 right-0 left-0 z-10 flex h-10 items-center gap-2 border-b border-border bg-surface-2 px-4">
        <div className="h-3 w-3 rounded-full bg-error" />
        <div className="h-3 w-3 rounded-full bg-warning" />
        <div className="h-3 w-3 rounded-full bg-success" />
      </div>
      
      <div className="absolute top-10 right-0 bottom-0 left-0 overflow-hidden">
        <Player
          component={DashboardAnimation}
          durationInFrames={370}
          fps={30}
          compositionWidth={1280}
          compositionHeight={720}
          style={{
            width: "100%",
            height: "100%",
          }}
          controls={false}
          autoPlay
          loop
        />
      </div>
    </div>
  );
};
