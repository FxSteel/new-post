export interface NewRelease {
  id: string;
  group_id: string | null;
  tenant: string | null;
  lang: "ES" | "EN" | "PT";
  title: string;
  month_label: string;
  month_date?: string; // Date string YYYY-MM-01
  size: "sm" | "md" | "lg";
  media_path: string | null;
  media_type: "image" | "video" | null;
  image_path?: string; // deprecated, kept for compatibility
  bullets: string[];
  kb_url: string;
  order_index: number;
  published: boolean;
  release_type: "feature" | "bug";
  has_cost: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewReleaseAdmin {
  id: string;
  user_id: string;
  created_at: string;
}
