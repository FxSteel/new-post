export interface NewRelease {
  id: string;
  tenant: string | null;
  lang: "ES" | "EN" | "PT/BR";
  title: string;
  month_label: string;
  size: "sm" | "md" | "lg";
  image_path: string;
  bullets: string[];
  kb_url: string;
  order_index: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewReleaseAdmin {
  id: string;
  user_id: string;
  created_at: string;
}
