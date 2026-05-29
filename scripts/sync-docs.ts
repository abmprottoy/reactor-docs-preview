import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import yaml from "js-yaml";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

const OWNER = "microsoft";
const REPO = "microsoft-ui-reactor";
const BRANCH = "main";
const REPO_URL = `https://github.com/${OWNER}/${REPO}`;
const RAW_ROOT = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;
const MKDOCS_URL = `${RAW_ROOT}/mkdocs.yml`;
const OUT_DIR = path.resolve("src/content/generated");

type MkdocsConfig = {
  site_name: string;
  site_description?: string;
  repo_url?: string;
  edit_uri?: string;
  docs_dir?: string;
  nav?: MkdocsNavItem[];
};

type MkdocsNavItem = string | Record<string, string | MkdocsNavItem[]>;

type NavNode = {
  title: string;
  path?: string;
  slug?: string;
  children?: NavNode[];
};

type Page = {
  title: string;
  path: string;
  slug: string;
  html: string;
  text: string;
  sourceUrl: string;
  editUrl: string;
  headings: Heading[];
};

type Heading = {
  id: string;
  text: string;
  depth: number;
};

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": "reactor-docs-preview" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function flattenNav(nodes: NavNode[]): NavNode[] {
  return nodes.flatMap((node) => [
    ...(node.path ? [node] : []),
    ...(node.children ? flattenNav(node.children) : []),
  ]);
}

function routeForDoc(docPath: string) {
  const normalized = docPath.replace(/\\/g, "/").replace(/\.md$/i, "");
  if (normalized === "index") {
    return "/";
  }

  if (normalized.endsWith("/index")) {
    return `/${normalized.slice(0, -"index".length)}`;
  }

  return `/${normalized}/`;
}

function docForRoute(route: string) {
  const trimmed = route.replace(/^\/|\/$/g, "");
  return trimmed ? `${trimmed}.md` : "index.md";
}

function parseNavItem(item: MkdocsNavItem): NavNode {
  if (typeof item === "string") {
    return {
      title: titleFromPath(item),
      path: item,
      slug: routeForDoc(item),
    };
  }

  const [title, value] = Object.entries(item)[0];
  if (typeof value === "string") {
    return { title, path: value, slug: routeForDoc(value) };
  }

  return {
    title,
    children: value.map(parseNavItem),
  };
}

function titleFromPath(docPath: string) {
  const basename = docPath.split("/").pop()?.replace(/\.md$/i, "") || "Docs";
  if (basename === "index") {
    return "Home";
  }

  return basename
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function rewriteMarkdown(markdown: string, currentDocPath: string, docsDir: string) {
  const currentDir = currentDocPath.includes("/")
    ? currentDocPath.slice(0, currentDocPath.lastIndexOf("/") + 1)
    : "";

  return markdown.replace(/(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (match, bang, label, target) => {
    if (/^(https?:|mailto:|#)/i.test(target)) {
      return match;
    }

    const [href, hash = ""] = target.split("#");
    const normalized = path.posix.normalize(path.posix.join(currentDir, href));

    if (bang) {
      const imageUrl = `${RAW_ROOT}/${docsDir}/${normalized}`;
      return `![${label}](${imageUrl}${hash ? `#${hash}` : ""})`;
    }

    if (href.endsWith(".md")) {
      const route = `${routeForDoc(normalized)}${hash ? `#${hash}` : ""}`;
      return `[${label}](${route})`;
    }

    return match;
  });
}

function extractHeadings(html: string): Heading[] {
  const headings: Heading[] = [];
  const headingPattern = /<h([2-3]) id="([^"]+)">([\s\S]*?)<\/h\1>/g;
  let match: RegExpExecArray | null;

  while ((match = headingPattern.exec(html)) !== null) {
    headings.push({
      depth: Number(match[1]),
      id: match[2],
      text: match[3].replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/#$/, ""),
    });
  }

  return headings;
}

function htmlToSearchText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function renderMarkdown(markdown: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: { className: ["heading-anchor"], ariaLabel: "Link to section" },
      content: { type: "text", value: "#" },
    })
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
}

async function main() {
  const mkdocsText = await fetchText(MKDOCS_URL);
  const config = yaml.load(mkdocsText) as MkdocsConfig;
  const docsDir = config.docs_dir || "docs";
  const nav = (config.nav || []).map(parseNavItem);
  const navPages = flattenNav(nav);
  const seen = new Set<string>();
  const pages: Page[] = [];

  for (const navPage of navPages) {
    if (!navPage.path || seen.has(navPage.path)) {
      continue;
    }

    seen.add(navPage.path);
    const rawMarkdown = await fetchText(`${RAW_ROOT}/${docsDir}/${navPage.path}`);
    const parsed = matter(rawMarkdown);
    const markdown = rewriteMarkdown(parsed.content, navPage.path, docsDir);
    const html = await renderMarkdown(markdown);
    const title = String(parsed.data.title || navPage.title);
    const sourceUrl = `${REPO_URL}/blob/${BRANCH}/${docsDir}/${navPage.path}`;
    const editUrl = `${REPO_URL}/${config.edit_uri || `edit/${BRANCH}/${docsDir}/`}${navPage.path}`;

    pages.push({
      title,
      path: navPage.path,
      slug: navPage.slug || routeForDoc(navPage.path),
      html,
      text: htmlToSearchText(html),
      sourceUrl,
      editUrl,
      headings: extractHeadings(html),
    });
  }

  const generatedAt = new Date().toISOString();
  const manifest = {
    siteName: "Reactor Docs Preview",
    productName: config.site_name || "Microsoft.UI.Reactor",
    description:
      "Unofficial Fluent-style documentation shell for Microsoft.UI.Reactor.",
    sourceDescription: config.site_description || "",
    repoUrl: config.repo_url || REPO_URL,
    docsDir,
    generatedAt,
    nav,
    pages,
    routeToDoc: Object.fromEntries(pages.map((page) => [page.slug, docForRoute(page.slug)])),
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    path.join(OUT_DIR, "manifest.ts"),
    `import type { DocsManifest } from "../../types";\n\nexport const manifest = ${JSON.stringify(
      manifest,
      null,
      2,
    )} satisfies DocsManifest;\n`,
  );

  console.log(`Synced ${pages.length} pages from ${OWNER}/${REPO}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
