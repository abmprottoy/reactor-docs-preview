import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Button } from "@fluentui/react-button";
import { Input } from "@fluentui/react-input";
import { manifest } from "./content/generated/manifest";
import heroImage from "./images/hero-reactor-docs-preview.png";
import pathfinderImage from "./images/pathfinder-app-window-montage.png";
import appPreviewImage from "./images/showcase-app-preview.png";
import codeScreenshotImage from "./images/showcase-code-screenshot.png";
import montageAltImage from "./images/reactor-app-window-montage-alt.png";
import type { DocsPage, NavNode } from "./types";

const prototypeRepoUrl = "https://github.com/abmprottoy/reactor-docs-preview";
const pagesBySlug = new Map(manifest.pages.map((page) => [page.slug, page]));
const homePage = pagesBySlug.get("/") || manifest.pages[0];
const maxSearchResults = 8;
const basePath = normalizeBasePath(import.meta.env.BASE_URL);

type SearchResult = {
  page: DocsPage;
  score: number;
  excerpt: string;
};

export function App() {
  const [path, setPath] = useState(() => getCurrentPath());
  const [dark, setDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [navOpen, setNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeHeadingId, setActiveHeadingId] = useState("");

  useEffect(() => {
    const onPopState = () => setPath(getCurrentPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const updateActiveHeading = () => {
      const headings = Array.from(document.querySelectorAll<HTMLElement>(".article h2[id], .article h3[id]"));
      if (!headings.length) {
        return;
      }

      const active = headings
        .map((heading) => ({
          id: heading.id,
          top: heading.getBoundingClientRect().top,
        }))
        .filter((heading) => heading.top <= 130)
        .pop();
      const activeId = active?.id || headings[0].id;

      setActiveHeadingId(activeId);
      syncTocActive(activeId);
    };

    updateActiveHeading();
    const interval = window.setInterval(updateActiveHeading, 300);
    window.addEventListener("scroll", updateActiveHeading, { passive: true });
    window.addEventListener("resize", updateActiveHeading);
    window.addEventListener("hashchange", updateActiveHeading);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("scroll", updateActiveHeading);
      window.removeEventListener("resize", updateActiveHeading);
      window.removeEventListener("hashchange", updateActiveHeading);
    };
  }, [path]);

  const page = pagesBySlug.get(path) || homePage;
  const isHome = page.slug === "/";
  const filteredNav = useMemo(() => filterNav(manifest.nav, query), [query]);
  const searchResults = useMemo(() => searchPages(query), [query]);

  const navigate = (slug: string) => {
    const nextPath = normalizePath(stripBasePath(slug));
    setPath(nextPath);
    setNavOpen(false);
    window.history.pushState({}, "", toAppUrl(nextPath));
    window.scrollTo({ top: 0 });
  };

  return (
    <div className={`provider ${dark ? "theme-dark" : "theme-light"}`}>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand-block">
            <Button
              appearance="subtle"
              className="mobile-menu-button"
              aria-label="Toggle navigation"
              onClick={() => setNavOpen((value) => !value)}
            >
              {navOpen ? "Close" : "Menu"}
            </Button>
            <button className="brand-button" onClick={() => navigate("/")}>
              <span className="brand-product">Microsoft.UI.Reactor</span>
              <span className="brand-preview">Docs Preview</span>
              <span className="brand-unofficial">Unofficial</span>
            </button>
          </div>
          <div className="topbar-actions">
            <a href={prototypeRepoUrl} target="_blank" rel="noreferrer">
              <FluentIcon name="code" />
              GitHub
            </a>
            <Button appearance="subtle" onClick={() => setDark((value) => !value)}>
              <FluentIcon name={dark ? "sun" : "moon"} />
              {dark ? "Light" : "Dark"}
            </Button>
          </div>
        </header>

        <div className="prototype-banner">
          <span>
            Unofficial design prototype. Content is sourced from microsoft/microsoft-ui-reactor.
          </span>
          <span>Synced {new Date(manifest.generatedAt).toLocaleString()}.</span>
        </div>

        {isHome ? (
          <main className="landing-content">
            <LandingPage onNavigate={navigate} />
          </main>
        ) : (
          <div className="layout">
            <aside className={`sidebar ${navOpen ? "open" : ""}`}>
              <div className="search-box">
                <Input
                  value={query}
                  onChange={(_, data) => setQuery(data.value)}
                  placeholder="Search docs"
                  aria-label="Search docs"
                />
              </div>
              {query.trim() ? (
                <SearchResults query={query} results={searchResults} onNavigate={navigate} />
              ) : (
                <DocsNav nodes={filteredNav} activeSlug={page.slug} onNavigate={navigate} />
              )}
            </aside>

            <main className="content">
              <MarkdownPage page={page} onNavigate={navigate} />
            </main>

            <aside className="toc">
              <OnThisPage page={page} activeHeadingId={activeHeadingId} />
            </aside>
          </div>
        )}

        <SiteFooter />
      </div>
    </div>
  );
}

function LandingPage({ onNavigate }: { onNavigate: (slug: string) => void }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const entryCards = [
    {
      title: "Build your first Reactor app",
      label: "Start here",
      slug: "/getting-started/",
    },
    {
      title: "Think in render functions",
      label: "Learn the model",
      slug: "/thinking-in-reactor/",
    },
    {
      title: "Move from XAML to C#",
      label: "Migration guide",
      slug: "/xaml-developers/",
    },
    {
      title: "Look up hooks and APIs",
      label: "Reference",
      slug: "/reference/hooks/",
    },
    {
      title: "Understand the runtime",
      label: "Architecture",
      slug: "/architecture-overview/",
    },
  ];

  const docsCards = [
    {
      title: "Learn the Framework",
      body: "Components, hooks, effects, context, commands, and advanced composition patterns.",
      slug: "/components/",
    },
    {
      title: "Explore UI Surface",
      body: "Layout, styling, animation, input, controls, forms, data, dialogs, and charts.",
      slug: "/layout/",
    },
    {
      title: "Ship Windows Apps",
      body: "Navigation, windows, persistence, localization, accessibility, packaging, and diagnostics.",
      slug: "/navigation/",
    },
  ];
  const carouselSlides = [
    {
      image: codeScreenshotImage,
      title: "C# as the source of UI truth",
      alt: "C# Reactor code screenshot",
    },
    {
      image: appPreviewImage,
      title: "Reconciled into native Windows controls",
      alt: "Reactor app preview artwork",
    },
    {
      image: montageAltImage,
      title: "From components to windows",
      alt: "Reactor component-to-window montage",
    },
  ];
  const currentSlide = carouselSlides[activeSlide];

  return (
    <div className="landing-page">
      <section
        className="landing-hero"
        style={{ "--hero-image": `url(${heroImage})` } as CSSProperties}
      >
        <div className="landing-hero-copy">
          <span className="landing-badge">Unofficial</span>
          <h1>
            <span>Microsoft.UI.Reactor</span>
            <span>Docs Preview</span>
          </h1>
          <p>
            A Fluent-inspired front end for reading Microsoft.UI.Reactor docs,
            with content synced from the upstream Microsoft repository.
          </p>
          <div className="landing-actions">
            <Button appearance="primary" onClick={() => onNavigate("/getting-started/")}>
              Get started
            </Button>
            <Button appearance="secondary" onClick={() => onNavigate("/xaml-developers/")}>
              For XAML developers
            </Button>
          </div>
        </div>
      </section>

      <section className="landing-entry">
        <div className="landing-section-heading">
          <span>Choose your path</span>
          <h2>Getting started</h2>
        </div>
        <div className="pathfinder-card">
          <img className="pathfinder-image" src={pathfinderImage} alt="Reactor app window montage" />
          <div className="pathfinder-list">
            {entryCards.map((card) => (
              <button key={card.slug} className="pathfinder-row" onClick={() => onNavigate(card.slug)}>
                <span>{card.title}</span>
                <strong>{card.label}</strong>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cards" aria-label="Documentation areas">
        {docsCards.map((card, index) => (
          <button key={card.slug} className="landing-doc-card" onClick={() => onNavigate(card.slug)}>
            <span className="landing-card-index">{String(index + 1).padStart(2, "0")}</span>
            <h3>{card.title}</h3>
            <p>{card.body}</p>
            <span className="landing-card-link">Open section</span>
          </button>
        ))}
      </section>

      <section className="landing-showcase">
        <div>
          <span className="landing-kicker">Quick look</span>
          <h2>Native Windows UI, described as state.</h2>
          <p>
            Reactor keeps the authoring model in C#: components render element trees,
            hooks hold state, and the reconciler updates real WinUI controls.
          </p>
          <Button appearance="secondary" onClick={() => onNavigate("/reactor-vs-xaml/")}>
            Compare with XAML
          </Button>
        </div>
        <div className="showcase-carousel" aria-label="Reactor preview images">
          <img className="showcase-image" src={currentSlide.image} alt={currentSlide.alt} />
          <div className="carousel-controls">
            <span>{currentSlide.title}</span>
            <div className="carousel-buttons">
              {carouselSlides.map((slide, index) => (
                <button
                  key={slide.title}
                  className={activeSlide === index ? "active" : ""}
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show ${slide.title}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Reactor Docs Preview</strong>
        <p>
          This is an unofficial design prototype. It is not affiliated with,
          endorsed by, or maintained by Microsoft.
        </p>
      </div>
      <div>
        <p>
          Microsoft, Fluent, Windows, WinUI, and related product names may be
          trademarks of Microsoft Corporation. Documentation content is sourced
          from the Microsoft.UI.Reactor repository with attribution.
        </p>
        <a href={prototypeRepoUrl} target="_blank" rel="noreferrer">
          View this prototype on GitHub
        </a>
      </div>
    </footer>
  );
}

function MarkdownPage({
  page,
  onNavigate,
}: {
  page: DocsPage;
  onNavigate: (slug: string) => void;
}) {
  const articleRef = useRef<HTMLElement | null>(null);
  const html = useMemo(() => addCodeBlockChrome(page.html), [page.html]);

  useEffect(() => {
    const article = articleRef.current;
    const onClick = (event: Event) => {
      const target = event.target as Element;
      const copyButton = target.closest<HTMLButtonElement>(".copy-code-button");
      if (copyButton) {
        const codeBlock = copyButton.closest(".code-block");
        const code = codeBlock?.querySelector("code")?.textContent || "";
        void navigator.clipboard.writeText(code).then(() => {
          copyButton.textContent = "Copied";
          window.setTimeout(() => {
            copyButton.textContent = "Copy";
          }, 1400);
        });
        return;
      }

      const anchor = target.closest("a");
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) {
        return;
      }

      event.preventDefault();
      onNavigate(normalizePath(stripBasePath(href)));
    };

    article?.addEventListener("click", onClick);
    return () => article?.removeEventListener("click", onClick);
  }, [onNavigate, page.slug]);

  useEffect(() => {
    const article = articleRef.current;
    if (!article) {
      return;
    }

    if (window.location.hash) {
      window.setTimeout(() => {
        article
          .querySelector<HTMLElement>(CSS.escape(window.location.hash).replace("\\#", "#"))
          ?.scrollIntoView({ block: "start" });
      }, 0);
    }
  }, [page.slug]);

  return (
    <article className="article" ref={articleRef}>
      <div className="article-meta">
        <span>{manifest.productName}</span>
        <div className="article-links">
          <a href={page.sourceUrl} target="_blank" rel="noreferrer">
            View source
          </a>
          <a href={page.editUrl} target="_blank" rel="noreferrer">
            Edit this page
          </a>
        </div>
      </div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}

function FluentIcon({ name }: { name: "code" | "moon" | "sun" }) {
  const paths = {
    code: "M8.64 7.23a.75.75 0 0 1 .13 1.05L5.5 12l3.27 3.72a.75.75 0 1 1-1.13.99l-3.7-4.22a.75.75 0 0 1 0-.98l3.7-4.22a.75.75 0 0 1 1.05-.06Zm6.72 0a.75.75 0 0 1 1.05.06l3.7 4.22c.25.28.25.7 0 .98l-3.7 4.22a.75.75 0 1 1-1.13-.99L18.5 12l-3.27-3.72a.75.75 0 0 1 .13-1.05Zm-2.1-.2a.75.75 0 0 1 .48.95l-3 9a.75.75 0 1 1-1.42-.48l3-9a.75.75 0 0 1 .94-.47Z",
    moon: "M12.77 3.1a.75.75 0 0 1 .3.93A8.23 8.23 0 0 0 20 15.62a.75.75 0 0 1 .5 1.09A9.25 9.25 0 1 1 11.3 3a.75.75 0 0 1 1.47.1ZM10.98 4.68a7.75 7.75 0 1 0 7.52 11.87A9.73 9.73 0 0 1 10.98 4.68Z",
    sun: "M12 4.75a.75.75 0 0 1-.75-.75V2.75a.75.75 0 0 1 1.5 0V4c0 .41-.34.75-.75.75Zm0 16.5a.75.75 0 0 1-.75-.75v-1.25a.75.75 0 0 1 1.5 0v1.25c0 .41-.34.75-.75.75ZM4 12.75H2.75a.75.75 0 0 1 0-1.5H4a.75.75 0 0 1 0 1.5Zm17.25 0H20a.75.75 0 0 1 0-1.5h1.25a.75.75 0 0 1 0 1.5ZM6.05 7.11a.75.75 0 0 1-.53-.22l-.88-.88A.75.75 0 1 1 5.7 4.95l.88.88a.75.75 0 0 1-.53 1.28Zm12.78 12.78a.75.75 0 0 1-.53-.22l-.88-.88a.75.75 0 0 1 1.06-1.06l.88.88a.75.75 0 0 1-.53 1.28Zm-.88-12.78a.75.75 0 0 1-.53-1.28l.88-.88a.75.75 0 0 1 1.06 1.06l-.88.88a.75.75 0 0 1-.53.22ZM5.17 19.89a.75.75 0 0 1-.53-1.28l.88-.88a.75.75 0 0 1 1.06 1.06l-.88.88a.75.75 0 0 1-.53.22ZM12 7.25a4.75 4.75 0 1 1 0 9.5 4.75 4.75 0 0 1 0-9.5Zm0 1.5a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z",
  };

  return (
    <svg className="fluent-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} fill="currentColor" />
    </svg>
  );
}

function SearchResults({
  query,
  results,
  onNavigate,
}: {
  query: string;
  results: SearchResult[];
  onNavigate: (slug: string) => void;
}) {
  return (
    <div className="search-results" role="listbox" aria-label="Search results">
      <div className="search-results-meta">
        {results.length ? `${results.length} result${results.length === 1 ? "" : "s"}` : "No results"}
      </div>
      {results.map((result) => (
        <button
          key={result.page.slug}
          className="search-result"
          onClick={() => onNavigate(result.page.slug)}
          role="option"
        >
          <span className="search-result-title">{highlightQuery(result.page.title, query)}</span>
          <span className="search-result-path">{result.page.slug}</span>
          <span className="search-result-excerpt">{highlightQuery(result.excerpt, query)}</span>
        </button>
      ))}
    </div>
  );
}

function DocsNav({
  nodes,
  activeSlug,
  onNavigate,
}: {
  nodes: NavNode[];
  activeSlug: string;
  onNavigate: (slug: string) => void;
}) {
  return (
    <nav className="docs-nav" aria-label="Documentation">
      {nodes.map((node) => (
        <NavBranch key={`${node.title}-${node.slug || "section"}`} node={node} activeSlug={activeSlug} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

function NavBranch({
  node,
  activeSlug,
  onNavigate,
}: {
  node: NavNode;
  activeSlug: string;
  onNavigate: (slug: string) => void;
}) {
  if (node.children?.length) {
    return (
      <section className="nav-section">
        <span className="nav-section-title">
          {node.title}
        </span>
        <div className="nav-section-items">
          {node.children.map((child) => (
            <NavBranch key={`${child.title}-${child.slug || "section"}`} node={child} activeSlug={activeSlug} onNavigate={onNavigate} />
          ))}
        </div>
      </section>
    );
  }

  if (!node.slug) {
    return null;
  }

  return (
    <button
      className={`nav-link ${activeSlug === node.slug ? "active" : ""}`}
      onClick={() => onNavigate(node.slug!)}
    >
      {node.title}
    </button>
  );
}

function OnThisPage({ page, activeHeadingId }: { page: DocsPage; activeHeadingId: string }) {
  return (
    <nav aria-label="On this page">
      <span className="toc-title">
        On this page
      </span>
      {page.headings.length ? (
        page.headings.map((heading) => (
          <a
            key={heading.id}
            className={`toc-link depth-${heading.depth} ${activeHeadingId === heading.id ? "active" : ""}`}
            href={`#${heading.id}`}
          >
            {heading.text}
          </a>
        ))
      ) : (
        <span>No sections on this page.</span>
      )}
    </nav>
  );
}

function searchPages(query: string): SearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const terms = normalized.split(/\s+/).filter(Boolean);

  return manifest.pages
    .map((page) => {
      const title = page.title.toLowerCase();
      const text = page.text.toLowerCase();
      let score = 0;

      for (const term of terms) {
        if (title.includes(term)) {
          score += 12;
        }

        if (text.includes(term)) {
          score += 2;
        }
      }

      if (title === normalized) {
        score += 20;
      }

      return {
        page,
        score,
        excerpt: buildExcerpt(page.text, normalized),
      };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.page.title.localeCompare(b.page.title))
    .slice(0, maxSearchResults);
}

function buildExcerpt(text: string, query: string) {
  const index = text.toLowerCase().indexOf(query);
  if (index < 0) {
    return text.slice(0, 140);
  }

  const start = Math.max(0, index - 58);
  const end = Math.min(text.length, index + query.length + 96);
  return `${start > 0 ? "..." : ""}${text.slice(start, end)}${end < text.length ? "..." : ""}`;
}

function highlightQuery(text: string, query: string) {
  const value = query.trim();
  if (!value) {
    return text;
  }

  const index = text.toLowerCase().indexOf(value.toLowerCase());
  if (index < 0) {
    return text;
  }

  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + value.length)}</mark>
      {text.slice(index + value.length)}
    </>
  );
}

function addCodeBlockChrome(html: string) {
  return html.replace(/<pre><code class="([^"]*)">([\s\S]*?)<\/code><\/pre>/g, (_match, className: string, code: string) => {
    const language =
      className
        .split(/\s+/)
        .find((item) => item.startsWith("language-"))
        ?.replace("language-", "") || "code";

    return `<div class="code-block"><div class="code-block-toolbar"><span class="code-language">${language}</span><button class="copy-code-button" type="button">Copy</button></div><pre><code class="${className}">${code}</code></pre></div>`;
  });
}

function syncTocActive(activeId: string) {
  document.querySelectorAll(".toc-link").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${activeId}`);
  });
}

function normalizePath(pathname: string) {
  const clean = pathname.replace(/\/index\.html$/, "/");
  if (clean === "" || clean === "/") {
    return "/";
  }

  return clean.endsWith("/") ? clean : `${clean}/`;
}

function normalizeBasePath(pathname: string) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function stripBasePath(pathname: string) {
  if (basePath === "/" || !pathname.startsWith(basePath)) {
    return pathname;
  }

  return `/${pathname.slice(basePath.length)}`;
}

function getCurrentPath() {
  return normalizePath(stripBasePath(window.location.pathname));
}

function toAppUrl(slug: string) {
  const normalized = normalizePath(slug);
  const base = basePath === "/" ? "" : basePath.replace(/\/$/, "");
  return `${base}${normalized}`;
}

function filterNav(nodes: NavNode[], query: string): NavNode[] {
  const value = query.trim().toLowerCase();
  if (!value) {
    return nodes;
  }

  return nodes
    .map((node) => {
      const children = node.children ? filterNav(node.children, value) : undefined;
      const matches = node.title.toLowerCase().includes(value);

      if (matches || children?.length) {
        return { ...node, children };
      }

      return null;
    })
    .filter(Boolean) as NavNode[];
}
