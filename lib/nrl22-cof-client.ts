const BASE_URL = "https://nrl22.com";

/** Manual cookie jar + manual redirect following — Node's fetch has neither. */
class Nrl22Session {
  private cookies = new Map<string, string>();

  private cookieHeader(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  private storeCookies(res: Response): void {
    for (const raw of res.headers.getSetCookie()) {
      const [pair] = raw.split(";");
      const eq = pair.indexOf("=");
      if (eq === -1) continue;
      this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }

  async request(url: string, init?: RequestInit): Promise<Response> {
    let currentUrl = url;
    for (let redirects = 0; redirects < 5; redirects++) {
      const headers = new Headers(init?.headers);
      if (this.cookies.size) headers.set("Cookie", this.cookieHeader());
      const res = await fetch(currentUrl, {
        ...init,
        headers,
        redirect: "manual",
      });
      this.storeCookies(res);
      if (
        res.status >= 300 &&
        res.status < 400 &&
        res.headers.get("location")
      ) {
        currentUrl = new URL(
          res.headers.get("location")!,
          currentUrl,
        ).toString();
        continue;
      }
      return res;
    }
    throw new Error("Too many redirects fetching nrl22.com");
  }

  async login(username: string, password: string): Promise<void> {
    const loginPage = await this.request(`${BASE_URL}/my-account/`);
    const html = await loginPage.text();
    const nonceMatch = html.match(/woocommerce-login-nonce" value="([^"]+)"/);
    if (!nonceMatch) {
      throw new Error("Could not find nrl22.com login nonce");
    }

    const body = new URLSearchParams({
      username,
      password,
      "woocommerce-login-nonce": nonceMatch[1],
      _wp_http_referer: "/my-account/",
      login: "Log in",
    });
    const res = await this.request(`${BASE_URL}/my-account/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const resultHtml = await res.text();
    if (!resultHtml.includes("Log out")) {
      throw new Error(
        "nrl22.com login failed — check NRL22_USERNAME/NRL22_PASSWORD",
      );
    }
  }

  /** Maps 'YYYY-MM' -> the download nonce for that month, per the Downloads page. */
  async listDownloadNonces(): Promise<Map<string, string>> {
    const res = await this.request(`${BASE_URL}/downloads/`);
    const html = await res.text();
    const nonces = new Map<string, string>();
    const re =
      /nrl22_cof_do=download&#0?38;month=(\d{4}-\d{2})&#0?38;_wpnonce=([a-f0-9]+)/g;
    let m;
    while ((m = re.exec(html))) {
      nonces.set(m[1], m[2]);
    }
    return nonces;
  }

  async downloadCofPdf(month: string, nonce: string): Promise<Buffer> {
    const res = await this.request(
      `${BASE_URL}/?nrl22_cof_do=download&month=${month}&_wpnonce=${nonce}`,
    );
    if (!res.ok) {
      throw new Error(`COF download for ${month} failed: ${res.status}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }
}

export interface FetchedCof {
  text: string;
  pdfBytes: Buffer;
}

/**
 * Extracts text via pdfjs-dist directly rather than the `pdf-parse` package.
 * pdf-parse bundles its own (older) pdfjs-dist version; loading it in the
 * same process as `pdf-to-img` (used below for page images) makes pdfjs-dist's
 * Node "fake worker" self-registration collide across the two versions and
 * throw "API version does not match Worker version" — reproducible even
 * outside Next, in plain Node. Using the single pdfjs-dist copy pdf-to-img
 * itself depends on avoids the clash entirely. Markers matching pdf-parse's
 * own "-- N of M --" convention are inserted between pages so the existing
 * PAGE_MARKER-based parsing below needs no changes.
 */
async function extractPdfText(pdfBytes: Buffer): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes) });
  const doc = await loadingTask.promise;
  const pageTexts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let text = "";
    for (const item of content.items) {
      if (!("str" in item)) continue;
      text += item.str;
      if (item.hasEOL) text += "\n";
    }
    pageTexts.push(text);
  }
  await loadingTask.destroy();
  return pageTexts
    .map((text, i) =>
      i === 0 ? text : `\n\n-- ${i + 1} of ${pageTexts.length} --\n\n${text}`,
    )
    .join("");
}

export async function fetchCofPdf(
  username: string,
  password: string,
  month: string,
): Promise<FetchedCof> {
  const session = new Nrl22Session();
  await session.login(username, password);
  const nonces = await session.listDownloadNonces();
  const nonce = nonces.get(month);
  if (!nonce) {
    throw new Error(
      `${month} is not available in the nrl22.com downloads archive`,
    );
  }
  const pdfBytes = await session.downloadCofPdf(month, nonce);
  const text = await extractPdfText(pdfBytes);
  return { text, pdfBytes };
}

/**
 * Renders whole PDF pages (1-indexed, matching pdf-parse's own "-- N of M --"
 * markers) to PNG. Rendering the full page rather than hand-extracting the
 * stage's embedded image: those embedded images are raw Flate-encoded pixel
 * data with no container format (not plain JPEGs), so reconstructing a valid
 * standalone image from them means correctly handling whatever colorspace/
 * bit-depth each COF designer's PDF happens to use. A full-page render sidesteps
 * that entirely and is what the user actually wants to see anyway.
 */
export async function renderCofPages(
  pdfBytes: Buffer,
  pageNumbers: number[],
): Promise<Map<number, Buffer>> {
  const { pdf } = await import("pdf-to-img");
  const wanted = new Set(pageNumbers);
  const doc = await pdf(pdfBytes, { scale: 2 });
  const result = new Map<number, Buffer>();
  let i = 0;
  for await (const page of doc) {
    i++;
    if (wanted.has(i)) result.set(i, page as Buffer);
    if (result.size === wanted.size) break;
  }
  return result;
}

export interface ParsedCofStage {
  stageNumber: number;
  stageName: string;
  isTimed: boolean;
  parTimeSeconds: number;
  roundCount: number | null;
  pageNumber: number;
  rawStageText: string;
}

// Anchors on "Time: <n> Sec Round Count: <m>" — the one line confirmed
// stable across every stage in every archive month tried (2024-05 through
// 2026-09). The "<n>. <stage name>" heading that follows isn't always the
// very next line — older PDFs interpose a boilerplate line like "Ranges
// and Targets:" first — so the heading is taken as the first "<n>. ..."
// match within a bounded window after the anchor, rather than requiring
// strict adjacency. Everything else about a stage's prose (prop, position,
// distances) is too free-form to parse reliably: a stage titled "South
// Tower" can turn out to use a tank trap and sawhorse per its actual
// description, so those fields are left for manual entry rather than
// guessed.
const STAGE_TIME_ANCHOR = /Time:\s*(\d+)\s*Sec\s+Round Count:\s*(\d+)/g;
const STAGE_HEADING = /(\d+)\.\s*([^\n]+)/;
const HEADING_SEARCH_WINDOW = 250;
// pdf-parse emits one of these between every page's extracted text, in order.
const PAGE_MARKER = /-- (\d+) of \d+ --/g;

// A "-- N of M --" marker sits at the *start* of page N's text, so the page
// an anchor belongs to is the last marker at or before it, not the next one.
function pageNumberForIndex(
  markers: { index: number; pageNumber: number }[],
  textIndex: number,
): number {
  let pageNumber = 1;
  for (const marker of markers) {
    if (marker.index > textIndex) break;
    pageNumber = marker.pageNumber;
  }
  return pageNumber;
}

export function parseCofStages(text: string): ParsedCofStage[] {
  const anchors: {
    index: number;
    timeSec: number;
    roundCount: number;
    stageNumber: number;
    stageName: string;
  }[] = [];
  let m;
  STAGE_TIME_ANCHOR.lastIndex = 0;
  while ((m = STAGE_TIME_ANCHOR.exec(text))) {
    const afterAnchor = m.index + m[0].length;
    const heading = STAGE_HEADING.exec(
      text.slice(afterAnchor, afterAnchor + HEADING_SEARCH_WINDOW),
    );
    if (!heading) continue;
    anchors.push({
      index: m.index,
      timeSec: Number(m[1]),
      roundCount: Number(m[2]),
      stageNumber: Number(heading[1]),
      stageName: heading[2].trim(),
    });
  }

  const markers: { index: number; pageNumber: number }[] = [];
  PAGE_MARKER.lastIndex = 0;
  let pm;
  while ((pm = PAGE_MARKER.exec(text))) {
    markers.push({ index: pm.index, pageNumber: Number(pm[1]) });
  }

  return anchors.map((anchor, i) => ({
    stageNumber: anchor.stageNumber,
    stageName: anchor.stageName,
    isTimed: true,
    parTimeSeconds: anchor.timeSec,
    roundCount: anchor.roundCount,
    pageNumber: pageNumberForIndex(markers, anchor.index),
    rawStageText: text
      .slice(anchor.index, anchors[i + 1]?.index ?? text.length)
      .trim(),
  }));
}
