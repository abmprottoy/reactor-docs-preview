export type Heading = {
  id: string;
  text: string;
  depth: number;
};

export type NavNode = {
  title: string;
  path?: string;
  slug?: string;
  children?: NavNode[];
};

export type DocsPage = {
  title: string;
  path: string;
  slug: string;
  html: string;
  text: string;
  sourceUrl: string;
  editUrl: string;
  headings: Heading[];
};

export type DocsManifest = {
  siteName: string;
  productName: string;
  description: string;
  sourceDescription: string;
  repoUrl: string;
  docsDir: string;
  generatedAt: string;
  nav: NavNode[];
  pages: DocsPage[];
  routeToDoc: Record<string, string>;
};
