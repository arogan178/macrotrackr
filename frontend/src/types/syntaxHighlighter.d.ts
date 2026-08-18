declare module "react-syntax-highlighter/dist/esm/prism-light" {
  import type { ComponentType } from "react";

  const PrismLight: ComponentType<{
    children?: React.ReactNode;
    language?: string;
    style?: Record<string, React.CSSProperties>;
    customStyle?: React.CSSProperties;
    PreTag?: keyof HTMLElementTagNameMap | ComponentType<unknown>;
  }> & {
    registerLanguage: (name: string, language: unknown) => void;
  };
  export default PrismLight;
}

declare module "react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus" {
  const style: Record<string, React.CSSProperties>;
  export default style;
}

declare module "react-syntax-highlighter/dist/esm/languages/prism/typescript" {
  const language: unknown;
  export default language;
}

declare module "react-syntax-highlighter/dist/esm/languages/prism/javascript" {
  const language: unknown;
  export default language;
}

declare module "react-syntax-highlighter/dist/esm/languages/prism/json" {
  const language: unknown;
  export default language;
}

declare module "react-syntax-highlighter/dist/esm/languages/prism/bash" {
  const language: unknown;
  export default language;
}

declare module "react-syntax-highlighter/dist/esm/languages/prism/css" {
  const language: unknown;
  export default language;
}

declare module "react-syntax-highlighter/dist/esm/languages/prism/markdown" {
  const language: unknown;
  export default language;
}
