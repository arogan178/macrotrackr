import {
  type CSSProperties,
  type RefObject,
  useCallback,
  useRef,
  useState,
} from "react";

export interface CardGlareConfig {
  /** Maximum rotation angle in degrees (default: 15) */
  maxRotation?: number;
  /** Scale factor on hover (default: 1.02) */
  scale?: number;
  /** Perspective distance for 3D effect (default: 1000px) */
  perspective?: number;
  /** Transition duration in ms (default: 150) */
  transitionDuration?: number;
  /** Glare intensity from 0-1 (default: 0.15) */
  glareIntensity?: number;
  /** Enable glare effect (default: true) */
  enableGlare?: boolean;
  /** Enable 3D rotation effect (default: true) */
  enableRotation?: boolean;
}

export interface CardGlareReturn {
  /** Ref to attach to the card container */
  cardRef: RefObject<HTMLDivElement>;
  /** Current rotation values */
  rotation: { x: number; y: number };
  /** Whether the card is currently being hovered */
  isHovered: boolean;
  /** Glare position (0-1 for both axes) */
  glarePosition: { x: number; y: number };
  /** Style object to apply to the card */
  cardStyle: CSSProperties;
  /** Glare gradient style for the overlay element */
  glareStyle: CSSProperties;
  /** Event handlers to spread on the card */
  handlers: {
    onMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
}

/**
 * Custom hook for creating a 3D card glare effect with mouse tracking.
 * Provides smooth 3D perspective rotation and a dynamic glare overlay.
 *
 * @param config - Configuration options for the effect
 * @returns Object containing refs, state, styles, and handlers
 *
 * @example
 * function MyCard() {
 *   const { cardRef, cardStyle, glareStyle, handlers } = useCardGlare({
 *     maxRotation: 10,
 *     glareIntensity: 0.2,
 *   });
 *
 *   return (
 *     <div ref={cardRef} style={cardStyle} {...handlers}>
 *       <div style={glareStyle} className="pointer-events-none absolute inset-0" />
 *       Card content
 *     </div>
 *   );
 * }
 */
export function useCardGlare(config: CardGlareConfig = {}): CardGlareReturn {
  const {
    maxRotation = 15,
    scale = 1.02,
    perspective = 1000,
    transitionDuration = 150,
    glareIntensity = 0.15,
    enableGlare = true,
    enableRotation = true,
  } = config;

  const cardReference = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glarePosition, setGlarePosition] = useState({ x: 0.5, y: 0.5 });

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof globalThis !== "undefined" &&
    globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!cardReference.current || prefersReducedMotion) return;

      const rect = cardReference.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate mouse position relative to center (-1 to 1)
      const mouseX = (event.clientX - centerX) / (rect.width / 2);
      const mouseY = (event.clientY - centerY) / (rect.height / 2);

      // Calculate rotation (inverted Y for natural feel)
      const rotateX = enableRotation ? -mouseY * maxRotation : 0;
      const rotateY = enableRotation ? mouseX * maxRotation : 0;

      setRotation({ x: rotateX, y: rotateY });

      // Calculate glare position (0 to 1)
      const glareX = (event.clientX - rect.left) / rect.width;
      const glareY = (event.clientY - rect.top) / rect.height;
      setGlarePosition({ x: glareX, y: glareY });
    },
    [maxRotation, enableRotation, prefersReducedMotion],
  );

  const handleMouseEnter = useCallback(() => {
    if (prefersReducedMotion) return;
    setIsHovered(true);
  }, [prefersReducedMotion]);

  const handleMouseLeave = useCallback(() => {
    if (prefersReducedMotion) return;
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
    setGlarePosition({ x: 0.5, y: 0.5 });
  }, [prefersReducedMotion]);

  // Calculate card transform style
  const cardStyle: CSSProperties = {
    transform: prefersReducedMotion
      ? undefined
      : `perspective(${perspective}px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${isHovered ? scale : 1})`,
    transition: isHovered
      ? `transform ${transitionDuration}ms ease-out`
      : `transform ${transitionDuration * 2}ms ease-out`,
    transformStyle: "preserve-3d",
  };

  // Calculate glare gradient style
  const glareStyle: CSSProperties = {
    background:
      enableGlare && isHovered && !prefersReducedMotion
        ? `radial-gradient(
          circle at ${glarePosition.x * 100}% ${glarePosition.y * 100}%,
          rgba(255, 255, 255, ${glareIntensity}) 0%,
          rgba(255, 255, 255, 0) 60%
        )`
        : "none",
    transition: `background ${transitionDuration}ms ease-out`,
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    zIndex: 1,
  };

  return {
    cardRef: cardReference as RefObject<HTMLDivElement>,
    rotation,
    isHovered,
    glarePosition,
    cardStyle,
    glareStyle,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  };
}

/**
 * Higher-order component wrapper for quick card glare effect.
 *
 * @example
 * function MyCard() {
 *   return (
 *     <CardGlareWrapper className="p-4 bg-surface-2 rounded-xl">
 *       Card content with glare effect
 *     </CardGlareWrapper>
 *   );
 * }
 */
export function CardGlareWrapper({
  children,
  className = "",
  config = {},
}: {
  children: React.ReactNode;
  className?: string;
  config?: CardGlareConfig;
}) {
  const { cardRef, cardStyle, glareStyle, handlers } = useCardGlare(config);

  return (
    <div
      ref={cardRef}
      style={cardStyle}
      className={`relative overflow-hidden ${className}`}
      {...handlers}
    >
      <div style={glareStyle} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default useCardGlare;
