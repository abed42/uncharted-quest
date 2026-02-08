declare module "reveal.js" {
  export type Api = {
    initialize: () => Promise<void>;
    destroy: () => void;
    sync: () => void;
    layout: () => void;
    slide: (horizontalIndex?: number, verticalIndex?: number) => void;
  };

  type RevealOptions = {
    embedded?: boolean;
    keyboardCondition?: "focused" | "global" | null;
    transition?: "none" | "fade" | "slide" | "convex" | "concave" | "zoom";
    controls?: boolean;
    progress?: boolean;
    center?: boolean;
    width?: number;
    height?: number;
    margin?: number;
    minScale?: number;
    maxScale?: number;
    hash?: boolean;
  };

  export default class Reveal {
    constructor(root: HTMLElement, options?: RevealOptions);
    initialize: Api["initialize"];
    destroy: Api["destroy"];
    sync: Api["sync"];
    layout: Api["layout"];
    slide: Api["slide"];
  }
}
