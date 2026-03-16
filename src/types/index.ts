export type Category = {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
};

export type App = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  screenshot_url: string | null;
  category_id: number;
  category?: Category;
  author_name: string | null;
  author_url: string | null;
  github_url: string | null;
  tags: string[];
  votes: number;
  featured: boolean;
  approved: boolean;
  created_at: string;
};

export type SubmitAppForm = {
  name: string;
  tagline: string;
  description: string;
  url: string;
  screenshot_url: string;
  category_id: number;
  author_name: string;
  author_url: string;
  github_url: string;
  tags: string;
};
