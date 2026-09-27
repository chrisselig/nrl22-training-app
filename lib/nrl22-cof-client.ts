import { PDFParse } from "pdf-parse";

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

export async function fetchCofPdfText(
  username: string,
  password: string,
  month: string,
): Promise<string> {
  const session = new Nrl22Session();
  await session.login(username, password);
  const nonces = await session.listDownloadNonces();
  const nonce = nonces.get(month);
  if (!nonce) {
    throw new Error(
      `${month} is not available in the nrl22.com downloads archive`,
    );
  }
  const pdfBuffer = await session.downloadCofPdf(month, nonce);
  const parser = new PDFParse({ data: pdfBuffer });
  const result = await parser.getText();
  return result.text;
}

export interface ParsedCofStage {
  stageNumber: number;
  stageName: string;
  isTimed: boolean;
  parTimeSeconds: number;
  rawStageText: string;
}

// Anchors on "Time: <n> Sec Round Count: <m>" immediately followed by the
// "<n>. <stage name>" heading line — the one sequence confirmed stable
// across every stage in a real downloaded COF. Everything else about a
// stage's prose (prop, position, distances) is too free-form to parse
// reliably: a stage titled "South Tower" can turn out to use a tank trap
// and sawhorse per its actual description, so those fields are left for
// manual entry rather than guessed.
const STAGE_ANCHOR =
  /Time:\s*(\d+)\s*Sec\s+Round Count:\s*\d+\s*\n\s*(\d+)\.\s*([^\n]+)/g;

export function parseCofStages(text: string): ParsedCofStage[] {
  const anchors: {
    index: number;
    timeSec: number;
    stageNumber: number;
    stageName: string;
  }[] = [];
  let m;
  STAGE_ANCHOR.lastIndex = 0;
  while ((m = STAGE_ANCHOR.exec(text))) {
    anchors.push({
      index: m.index,
      timeSec: Number(m[1]),
      stageNumber: Number(m[2]),
      stageName: m[3].trim(),
    });
  }

  return anchors.map((anchor, i) => ({
    stageNumber: anchor.stageNumber,
    stageName: anchor.stageName,
    isTimed: true,
    parTimeSeconds: anchor.timeSec,
    rawStageText: text
      .slice(anchor.index, anchors[i + 1]?.index ?? text.length)
      .trim(),
  }));
}
