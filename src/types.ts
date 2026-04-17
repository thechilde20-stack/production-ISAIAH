export interface PortfolioItem {
  id: string;
  title: string;
  categories: string[];
  category?: string; // Legacy field for migration
  thumbnail: string;
  videoUrl: string; // YouTube ID or URL
  info?: string;
  order: number;
  createdAt: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: number;
}

export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  order: number;
  isFeatured: boolean;
}

export interface SiteSettings {
  id?: string;
  // Main Content
  heroVideoId: string;
  heroHeadline: string;
  heroSubcopy: string;
  heroDescription: string;
  
  // SEO
  siteTitle: string;
  metaDescription: string;
  ogDescription: string;
  keywords: string;
  ogImage: string;
  favicon: string;
  
  // Advanced
  accentColor: string;
  primaryFont: 'NanumSquareNeo' | 'NotoSansKR' | 'Pretendard';
}
