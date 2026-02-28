export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: "Releases" | "Tips" | "Nutrition Guides";
  author: string;
  readingTime: string;
  image?: string;
  content?: string;
}

export interface BlogCategory {
  name: string;
  slug: string;
  count: number;
}

export const blogCategories: BlogCategory[] = [
  { name: "Releases", slug: "releases", count: 0 },
  { name: "Tips", slug: "tips", count: 0 },
  { name: "Nutrition Guides", slug: "nutrition-guides", count: 0 },
];
