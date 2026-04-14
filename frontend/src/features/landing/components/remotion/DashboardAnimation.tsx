import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const POSITIONS = {
  center: { x: 640, y: 360 },
  searchBox: { x: 320, y: 248 },
  searchButton: { x: 760, y: 248 },
  searchResult: { x: 380, y: 322 },
  addEntryButton: { x: 780, y: 443 },
};

const MACRO_COLORS = {
  protein: "#10b981",
  carbs: "#3b82f6",
  fats: "#f59e0b",
} as const;

const CURSOR_EASE = Easing.out(Easing.quad);

const createCursorPath = (frame: number) => {
  if (frame < 42) {
    const progress = interpolate(frame, [0, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    return {
      x: interpolate(progress, [0, 1], [POSITIONS.center.x, POSITIONS.searchBox.x], { easing: CURSOR_EASE }),
      y: interpolate(progress, [0, 1], [POSITIONS.center.y, POSITIONS.searchBox.y], { easing: CURSOR_EASE }),
    };
  }
  if (frame < 95) return POSITIONS.searchBox;
  
  if (frame < 102) {
    const progress = interpolate(frame, [95, 102], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    return {
      x: interpolate(progress, [0, 1], [POSITIONS.searchBox.x, POSITIONS.searchButton.x], { easing: CURSOR_EASE }),
      y: interpolate(progress, [0, 1], [POSITIONS.searchBox.y, POSITIONS.searchButton.y], { easing: CURSOR_EASE }),
    };
  }
  if (frame < 110) return POSITIONS.searchButton;
  
  if (frame < 125) {
    const progress = interpolate(frame, [110, 125], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    return {
      x: interpolate(progress, [0, 1], [POSITIONS.searchButton.x, POSITIONS.searchResult.x], { easing: CURSOR_EASE }),
      y: interpolate(progress, [0, 1], [POSITIONS.searchButton.y, POSITIONS.searchResult.y], { easing: CURSOR_EASE }),
    };
  }
  if (frame < 195) return POSITIONS.searchResult;
  
  if (frame < 202) {
    const progress = interpolate(frame, [195, 202], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    return {
      x: interpolate(progress, [0, 1], [POSITIONS.searchResult.x, POSITIONS.addEntryButton.x], { easing: CURSOR_EASE }),
      y: interpolate(progress, [0, 1], [POSITIONS.searchResult.y, POSITIONS.addEntryButton.y], { easing: CURSOR_EASE }),
    };
  }
  
  return POSITIONS.addEntryButton;
};

export const DashboardAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15, 350, 370], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const headerSpring = spring({ frame, fps, delay: 5, config: { damping: 200 } });
  const metricsCardSpring = spring({ frame, fps, delay: 15, config: { damping: 200 } });
  const addFormSpring = spring({ frame, fps, delay: 25, config: { damping: 200 } });
  const summaryCardSpring = spring({ frame, fps, delay: 35, config: { damping: 200 } });
  const historyPanelSpring = spring({ frame, fps, delay: 45, config: { damping: 200 } });

  const cursorClickSearchBox = spring({ frame, fps, delay: 50, config: { damping: 200 } });
  
  const searchTyping = interpolate(frame, [55, 95], [0, 13], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const cursorClickSearchButton = spring({ frame, fps, delay: 100, config: { damping: 200 } });
  const searchButtonClick = spring({ frame, fps, delay: 102, config: { damping: 200 } });
  const searchResultsAppear = spring({ frame, fps, delay: 110, config: { damping: 200 } });
  const cursorClickSearchResult = spring({ frame, fps, delay: 135, config: { damping: 200 } });
  const selectItemSpring = spring({ frame, fps, delay: 137, config: { damping: 200 } });
  
  const searchResultsFade = interpolate(frame, [145, 155], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const macroFieldsFill = spring({ frame, fps, delay: 155, config: { damping: 200 } });
  const cursorClickAddButton = spring({ frame, fps, delay: 200, config: { damping: 200 } });
  const addEntryClick = spring({ frame, fps, delay: 202, config: { damping: 200 } });

  const calorieProgress = spring({ frame, fps, delay: 220, durationInFrames: 40, config: { damping: 200 } });
  const proteinProgress = spring({ frame, fps, delay: 230, durationInFrames: 35, config: { damping: 200 } });
  const carbsProgress = spring({ frame, fps, delay: 245, durationInFrames: 35, config: { damping: 200 } });
  const fatsProgress = spring({ frame, fps, delay: 260, durationInFrames: 35, config: { damping: 200 } });

  const displayedText = "Chicken Breast".slice(0, Math.round(searchTyping));
  const showSearchResults = frame >= 110 && frame < 155;
  const itemSelected = frame >= 137;

  const cursorPos = createCursorPath(frame);
  const cursorOpacity = interpolate(frame, [35, 42, 250, 260], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const getCursorScale = () => {
    if (frame >= 50 && frame < 55) return interpolate(cursorClickSearchBox, [0, 0.5, 1], [1, 0.8, 1]);
    if (frame >= 100 && frame < 106) return interpolate(cursorClickSearchButton, [0, 0.5, 1], [1, 0.8, 1]);
    if (frame >= 135 && frame < 141) return interpolate(cursorClickSearchResult, [0, 0.5, 1], [1, 0.8, 1]);
    if (frame >= 200 && frame < 206) return interpolate(cursorClickAddButton, [0, 0.5, 1], [1, 0.8, 1]);

    return 1;
  };

  return (
    <div className="flex h-full w-full flex-col bg-background font-sans text-foreground" style={{ opacity }}>
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/20" />
          <div className="h-4 w-24 rounded bg-surface-3" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-surface-3" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
        <div style={{ opacity: headerSpring, transform: `translateY(${interpolate(headerSpring, [0, 1], [8, 0])}px)` }}>
          <div className="h-5 w-32 rounded bg-surface-3" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
          <div className="flex h-full flex-col gap-4 lg:col-span-4">
            <div className="grid grid-cols-2 gap-3">
              {[0, 1].map((index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-surface p-3"
                  style={{ opacity: metricsCardSpring, transform: `translateY(${interpolate(metricsCardSpring, [0, 1], [15, 0])}px)` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg border border-primary/20 bg-primary/10 p-2">
                      <div className="h-5 w-5 rounded bg-primary/30" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-baseline gap-1.5">
                        <div className="h-3 w-24 rounded bg-surface-4" />
                        <div className="h-2.5 w-8 rounded bg-surface-3" />
                      </div>
                      <div className="h-5 w-16 rounded bg-foreground/20" />
                      <div className="mt-0.5 h-2.5 w-10 rounded bg-surface-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="flex-1 rounded-xl border border-border bg-surface p-4"
              style={{ opacity: addFormSpring, transform: `scale(${interpolate(addFormSpring, [0, 1], [0.96, 1])})` }}
            >
              <div className="mb-3 h-4 w-32 rounded bg-surface-4" />
              
              <div className="mb-3 flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
                  <div className="h-3.5 w-3.5 rounded bg-surface-4" />
                  <div className="relative flex-1">
                    <div
                      className="h-3.5 rounded"
                      style={{
                        width: `${Math.min(displayedText.length * 4.5 + 8, 50)}%`,
                        backgroundColor: displayedText.length > 0 ? 'var(--color-surface-3)' : 'transparent',
                      }}
                    />
                    {frame >= 55 && frame < 96 && (
                      <div className="absolute top-0 h-3.5 w-0.5 bg-primary" style={{ left: `${Math.min(displayedText.length * 4.5 + 10, 52)}%` }} />
                    )}
                  </div>
                </div>
                <div
                  className="flex h-8 w-20 items-center justify-center rounded-lg"
                  style={{ backgroundColor: '#1ed760', transform: `scale(${interpolate(searchButtonClick, [0, 0.5, 1], [1, 0.95, 1])})` }}
                >
                  <div className="h-3 w-12 rounded bg-white/30" />
                </div>
              </div>

              <div className="relative mb-3" style={{ opacity: searchResultsFade, height: showSearchResults ? 100 : 0, overflow: 'hidden' }}>
                {showSearchResults && (
                  <div
                    className="overflow-hidden rounded-lg border border-border bg-surface"
                    style={{ opacity: searchResultsAppear, transform: `translateY(${interpolate(searchResultsAppear, [0, 1], [-10, 0])}px)` }}
                  >
                    {[0, 1, 2].map((index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-b-0"
                        style={{ backgroundColor: index === 0 && itemSelected ? `rgba(30, 215, 96, ${interpolate(selectItemSpring, [0, 1], [0, 0.15])})` : 'transparent' }}
                      >
                        <div className="flex-1">
                          <div className="h-3 w-28 rounded bg-surface-4" />
                          <div className="mt-1 h-2 w-40 rounded bg-surface-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-3 grid grid-cols-3 gap-3">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="rounded-lg border border-border bg-surface-2 p-2">
                    <div className="mb-1.5 h-2.5 w-12 rounded bg-surface-4" />
                    <div className="h-6 w-full rounded" style={{ backgroundColor: itemSelected ? 'rgba(255,255,255,0.15)' : 'var(--color-surface-3)' }} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {["#1ed760", "#3b82f6", "#ef4444"].map((color, index) => (
                  <div key={index} className="rounded-lg border border-border bg-surface-2 p-2">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                      <div className="h-2.5 w-12 rounded bg-surface-4" />
                    </div>
                    <div
                      className="flex h-6 w-full items-center justify-end rounded pr-2"
                      style={{
                        backgroundColor: itemSelected ? 'rgba(255,255,255,0.15)' : 'var(--color-surface-3)',
                        transform: `scale(${interpolate(macroFieldsFill, [0, 1], [0.9, 1])})`,
                        opacity: macroFieldsFill,
                      }}
                    >
                      {itemSelected && <div className="h-3 w-8 rounded bg-white/20" />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="h-3 w-24 rounded bg-surface-4" />
                <div
                  className="flex h-7 w-20 items-center justify-center rounded-lg"
                  style={{ backgroundColor: '#1ed760', transform: `scale(${interpolate(addEntryClick, [0, 0.5, 1], [1, 0.95, 1])})` }}
                >
                  <div className="h-3 w-12 rounded bg-white/30" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex h-full flex-col lg:col-span-2">
            <div
              className="h-full rounded-xl border border-border bg-surface p-4"
              style={{ opacity: summaryCardSpring, transform: `translateX(${interpolate(summaryCardSpring, [0, 1], [15, 0])}px)` }}
            >
              <div className="mb-3 rounded-lg bg-surface-2 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="h-3 w-20 rounded bg-surface-4" />
                  <div className="text-right">
                    <div className="h-4 w-14 rounded bg-foreground/20" />
                    <div className="mt-0.5 h-2.5 w-16 rounded bg-surface-3" />
                  </div>
                </div>

                <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-4">
                  <div className="h-full bg-vibrant-accent" style={{ width: `${calorieProgress * 76}%` }} />
                </div>

                <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-4">
                  <div className="float-left h-full bg-protein" style={{ width: `${proteinProgress * 30}%` }} />
                  <div className="float-left h-full bg-carbs" style={{ width: `${carbsProgress * 40}%` }} />
                  <div className="float-left h-full bg-fats" style={{ width: `${fatsProgress * 30}%` }} />
                </div>

                <div className="flex justify-between text-xs">
                  {["protein", "carbs", "fats"].map((macro) => (
                    <div key={macro} className="flex items-center gap-1">
                      <div className={`bg- h-1.5 w-1.5 rounded-full${macro}`} />
                      <div className="h-2.5 w-6 rounded bg-surface-4" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { color: MACRO_COLORS.protein, progress: proteinProgress, percent: 78 },
                  { color: MACRO_COLORS.carbs, progress: carbsProgress, percent: 62 },
                  { color: MACRO_COLORS.fats, progress: fatsProgress, percent: 45 },
                ].map((macro, index) => (
                  <div key={index} className="rounded-lg border border-white/5 bg-surface-2/50 p-2.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: macro.color }} />
                        <div className="h-2.5 w-10 rounded bg-surface-4" />
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-8 rounded bg-foreground/15" />
                        <div className="h-2.5 w-10 rounded bg-surface-4" />
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-4">
                      <div className="h-full" style={{ width: `${macro.progress * macro.percent}%`, backgroundColor: macro.color }} />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="h-2.5 w-12 rounded bg-surface-4" />
                      <div className="h-2.5 w-6 rounded bg-surface-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border border-border bg-surface-2 p-4"
          style={{ opacity: historyPanelSpring, transform: `translateY(${interpolate(historyPanelSpring, [0, 1], [12, 0])}px)` }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-surface-4" />
            <div className="h-6 w-20 rounded-lg bg-surface-3" />
          </div>

          <div className="space-y-2">
            {[0, 1, 2].map((index) => {
              const itemSpring = spring({ frame, fps, delay: 225 + index * 12, config: { damping: 200 } });

              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-surface p-3"
                  style={{ opacity: itemSpring, transform: `translateY(${interpolate(itemSpring, [0, 1], [12, 0])}px)` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-surface-3" />
                    <div className="flex flex-col gap-1.5">
                      <div className="h-3 w-28 rounded bg-surface-4" />
                      <div className="h-2.5 w-16 rounded bg-surface-3" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      <div className="h-3 w-10 rounded bg-protein/20" />
                      <div className="h-3 w-10 rounded bg-carbs/20" />
                      <div className="h-3 w-10 rounded bg-fats/20" />
                    </div>
                    <div className="h-4 w-12 rounded bg-surface-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: cursorPos.x,
          top: cursorPos.y,
          opacity: cursorOpacity,
          transform: `scale(${getCursorScale()})`,
          zIndex: 100,
          pointerEvents: "none",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>
          <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L5.94 2.86a.5.5 0 0 0-.44.35z" fill="white" stroke="black" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
};
