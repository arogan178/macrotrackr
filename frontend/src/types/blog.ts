export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: "Releases" | "Tips" | "Nutrition Guides";
  author: string;
  readingTime: string;
  image?: string;
  tags: string[];
  featured?: boolean;
  content?: string;
}

export interface BlogCategory {
  name: string;
  slug: string;
  count: number;
}
