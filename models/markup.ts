import { getLogger } from "@logtape/logtape";
import { titlePlugin as title } from "@mdit-vue/plugin-title";
import cjkBreaks from "@searking/markdown-it-cjk-breaks";
import shiki from "@shikijs/markdown-it";
import {
  transformerMetaHighlight,
  transformerMetaWordHighlight,
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { NON_ASCII, slugify } from "@std/text/unstable-slugify";
import transliterate from "any-ascii";
import * as cssfilter from "cssfilter";
import katex from "katex";
import createMarkdownIt from "markdown-it";
import abbr from "markdown-it-abbr";
import { alertPlugin as admonition } from "markdown-it-github-alert";
import anchor from "markdown-it-anchor";
import deflist from "markdown-it-deflist";
import footnote from "markdown-it-footnote";
import graphviz from "markdown-it-graphviz";
import texmath from "markdown-it-texmath";
import toc from "markdown-it-toc-done-right";
import { FilterXSS, whiteList } from "xss";

const logger = getLogger(["hackerspub", "models", "markup"]);

let tocTree: InternalToc = { l: 0, n: "", c: [] };

let md = createMarkdownIt({ html: true })
  .use(abbr)
  .use(admonition)
  .use(anchor, {
    slugifyWithState(title: string, state: { env: { docId: string } }) {
      return slugifyTitle(title, state.env.docId);
    },
    permalink: anchor.permalink.linkInsideHeader({
      symbol: `<span aria-hidden="true" title="Link to this section">#</span>`,
      placement: "after",
    }),
  })
  .use(cjkBreaks)
  .use(deflist)
  .use(footnote)
  .use(graphviz)
  .use(texmath, { engine: katex })
  .use(title)
  .use(toc, {
    placeholder: `--${crypto.randomUUID()}--`.toUpperCase(),
    callback(_html: string, ast: InternalToc) {
      tocTree = ast;
    },
  });

// Lazy load Shiki to avoid blocking the startup time
let shikiLoaded = false;
const loadingShiki = shiki({
  themes: {
    light: "vitesse-light",
    dark: "vitesse-dark",
  },
  transformers: [
    transformerNotationDiff(),
    transformerNotationHighlight(),
    transformerMetaHighlight(),
    transformerNotationWordHighlight(),
    transformerMetaWordHighlight(),
    transformerNotationFocus(),
  ],
}).then((shiki) => {
  md = md.use(shiki);
  shikiLoaded = true;
});

export const htmlXss = new FilterXSS({
  allowList: {
    a: [
      "lang",
      "translate",
      "target",
      "href",
      "hreflang",
      "title",
      "rel",
      "class",
    ],
    abbr: ["lang", "translate", "title"],
    address: ["lang", "translate"],
    area: ["lang", "translate", "shape", "coords", "href", "alt"],
    article: ["lang", "translate"],
    aside: ["lang", "translate"],
    audio: [
      "lang",
      "translate",
      "autoplay",
      "controls",
      "crossorigin",
      "loop",
      "muted",
      "preload",
      "src",
    ],
    b: ["lang", "translate"],
    bdi: ["lang", "translate", "dir"],
    bdo: ["lang", "translate", "dir"],
    big: ["lang", "translate"],
    blockquote: ["lang", "translate", "cite"],
    br: ["lang", "translate"],
    caption: ["lang", "translate"],
    center: ["lang", "translate"],
    cite: ["lang", "translate"],
    code: ["lang", "translate"],
    col: ["lang", "translate", "align", "valign", "span", "width"],
    colgroup: ["lang", "translate", "align", "valign", "span", "width"],
    dd: ["lang", "translate"],
    del: ["lang", "translate", "datetime"],
    details: ["lang", "translate", "open"],
    dfn: ["lang", "translate"],
    div: ["lang", "translate", "class", "style"],
    dl: ["lang", "translate"],
    dt: ["lang", "translate"],
    em: ["lang", "translate"],
    figcaption: ["lang", "translate"],
    figure: ["lang", "translate"],
    font: ["lang", "translate", "color", "size", "face"],
    footer: ["lang", "translate"],
    h1: ["lang", "translate", "id"],
    h2: ["lang", "translate", "id"],
    h3: ["lang", "translate", "id"],
    h4: ["lang", "translate", "id"],
    h5: ["lang", "translate", "id"],
    h6: ["lang", "translate", "id"],
    header: ["lang", "translate"],
    hr: ["class"],
    i: ["lang", "translate"],
    img: [
      "lang",
      "translate",
      "src",
      "alt",
      "title",
      "width",
      "height",
      "loading",
    ],
    ins: ["lang", "translate", "datetime"],
    kbd: ["lang", "translate"],
    li: ["lang", "translate"],
    mark: ["lang", "translate"],
    nav: ["lang", "translate"],
    ol: ["lang", "translate"],
    p: ["lang", "translate"],
    picture: ["lang", "translate"],
    pre: ["lang", "translate", "class", "style"],
    q: ["lang", "translate", "cite"],
    rp: ["lang", "translate"],
    rt: ["lang", "translate"],
    ruby: ["lang", "translate"],
    s: ["lang", "translate"],
    samp: ["lang", "translate"],
    section: ["lang", "translate", "class"],
    small: ["lang", "translate"],
    source: [
      "lang",
      "translate",
      "src",
      "srcset",
      "sizes",
      "media",
      "type",
      "width",
      "height",
    ],
    span: ["lang", "translate", "aria-hidden", "class", "style"],
    sub: ["lang", "translate"],
    summary: ["lang", "translate"],
    sup: ["lang", "translate", "class"],
    strong: ["lang", "translate"],
    strike: ["lang", "translate"],
    table: ["lang", "translate", "width", "border", "align", "valign"],
    tbody: ["lang", "translate", "align", "valign"],
    td: ["lang", "translate", "width", "rowspan", "colspan", "align", "valign"],
    tfoot: ["lang", "translate", "align", "valign"],
    th: ["lang", "translate", "width", "rowspan", "colspan", "align", "valign"],
    thead: ["lang", "translate", "align", "valign"],
    time: ["lang", "translate", "datetime"],
    tr: ["lang", "translate", "rowspan", "align", "valign"],
    tt: ["lang", "translate"],
    u: ["lang", "translate"],
    ul: ["lang", "translate"],
    var: ["lang", "translate"],
    video: [
      "lang",
      "translate",
      "autoplay",
      "controls",
      "crossorigin",
      "loop",
      "muted",
      "playsinline",
      "poster",
      "preload",
      "src",
      "height",
      "width",
    ],

    // MathML
    math: ["class", "xmlns"],
    maction: ["actiontype", "selection"],
    annotation: ["encoding"],
    "annotation-xml": ["encoding"],
    menclose: ["notation"],
    merror: ["class"],
    mfenced: ["open", "close", "separators"],
    mfrac: ["linethickness"],
    mi: ["mathvariant"],
    mmultiscripts: ["subscriptshift", "superscriptshift"],
    mn: ["mathvariant"],
    mo: ["fence", "lspace", "rspace", "stretchy"],
    mover: ["accent"],
    mpadded: ["height", "depth", "width", "lspace", "voffset"],
    mphantom: ["class"],
    mprescripts: [],
    mroot: ["displaystyle"],
    mrow: ["displaystyle"],
    ms: ["lquote", "rquote"],
    semantics: ["class"],
    mspace: ["depth", "height", "width"],
    msqrt: ["displaystyle"],
    mstyle: ["displaystyle", "mathcolor", "mathbackground"],
    msub: ["subscriptshift"],
    msup: ["superscriptshift"],
    msubsup: ["subscriptshift", "superscriptshift"],
    mtable: [
      "align",
      "columnalign",
      "columnspacing",
      "columnlines",
      "rowalign",
      "rowspacing",
      "rowlines",
    ],
    mtd: ["columnalign", "rowalign"],
    mtext: ["mathvariant"],
    mtr: ["columnalign", "rowalign"],
    munder: ["accentunder"],
    munderover: ["accent", "accentunder"],
    eq: [],

    // SVG
    svg: ["class", "viewBox", "version", "width", "height", "aria-hidden"],
    path: [
      "d",
      "fill",
      "fill-opacity",
      "stroke",
      "stroke-width",
      "stroke-opacity",
      "stroke-dasharray",
    ],
    g: [
      "id",
      "class",
      "fill",
      "fill-opacity",
      "stroke",
      "stroke-width",
      "stroke-opacity",
      "stroke-dasharray",
      "transform",
    ],
    polygon: [
      "points",
      "fill",
      "fill-opacity",
      "stroke",
      "stroke-width",
      "stroke-opacity",
      "stroke-dasharray",
    ],
    polyline: [
      "points",
      "fill",
      "fill-opacity",
      "stroke",
      "stroke-width",
      "stroke-opacity",
      "stroke-dasharray",
    ],
    ellipse: [
      "cx",
      "cy",
      "rx",
      "ry",
      "fill",
      "fill-opacity",
      "stroke",
      "stroke-width",
      "stroke-opacity",
      "stroke-dasharray",
    ],
    linearGradient: ["id", "gradientUnits", "x1", "y1", "x2", "y2"],
    radialGradient: ["id", "gradientUnits", "cx", "cy", "r", "fx", "fy"],
    stop: ["offset", "stop-color", "stop-opacity", "style"],
    text: [
      "x",
      "y",
      "fill",
      "fill-opacity",
      "font-size",
      "font-family",
      "font-weight",
      "font-style",
      "text-anchor",
    ],
    defs: [],
    title: [],
  },
  css: {
    whiteList: {
      ...cssfilter.whiteList,
      color: true,
      "background-color": true,
      "font-style": true,
      "font-weight": true,
      "text-decoration": true,

      // Shiki
      "--shiki-dark": true,
      "--shiki-dark-bg": true,
      "--shiki-dark-font-style": true,
      "--shiki-dark-font-weight": true,
      "--shiki-dark-text-decoration": true,

      // SVG
      "stop-color": true,
      "stop-opacity": true,
    },
  },
});

const excerptHtmlXss = new FilterXSS({
  allowList: Object.fromEntries(
    Object.entries(whiteList).filter(([tag]) => tag !== "a"),
  ),
  stripIgnoreTag: true,
});

const textXss = new FilterXSS({
  allowList: {},
  stripIgnoreTag: true,
});

export interface RenderedMarkup {
  html: string;
  excerptHtml: string;
  text: string;
  title: string;
  toc: Toc[];
}

export async function renderMarkup(
  docId: string,
  markup: string,
): Promise<RenderedMarkup> {
  if (!shikiLoaded) await loadingShiki;
  const env = { docId, title: "" };
  const rawHtml = md.render(markup, env)
    .replaceAll('<?xml version="1.0" encoding="UTF-8" standalone="no"?>', "")
    .replaceAll(
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"\n' +
        ' "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
      "",
    );
  logger.debug(
    "Processed Markdown for {docId}:\n{rawHtml}",
    { docId, rawHtml },
  );
  const html = htmlXss.process(rawHtml);
  const excerptHtml = excerptHtmlXss.process(rawHtml);
  const text = textXss.process(rawHtml);
  const toc = toToc(tocTree);
  const rendered: RenderedMarkup = {
    html,
    excerptHtml,
    text,
    title: env.title,
    toc: toc.level < 1 ? toc.children : [toc],
  };
  return rendered;
}

function slugifyTitle(title: string, docId: string): string {
  return docId + "--" + slugify(title, { transliterate, strip: NON_ASCII });
}

interface InternalToc {
  l: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  n: string;
  c: InternalToc[];
}

export interface Toc {
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  children: Toc[];
}

function toToc(toc: InternalToc): Toc {
  return {
    level: toc.l,
    title: toc.n.trimStart(),
    children: toc.c.map(toToc),
  };
}
