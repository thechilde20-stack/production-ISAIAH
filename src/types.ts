export interface PortfolioItem {
  id: string;
  title: string;
  categories: string[];
  category?: string; // Legacy field for migration
  thumbnail: string;
  videoUrl: string; // YouTube ID or URL
  info?: string;
  description?: string;
  order: number;
  createdAt: number;
  // Campaign fields
  section?: 'general' | 'campaign-portfolio';
  year?: string;
  clientOrCandidate?: string;
  tags?: string[];
  sortOrder?: number;
  campaignTier?: 'presidential-party' | 'national-local-election' | 'planned-campaign-film';
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: number;
  isRead?: boolean;
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
  
  // Section Images
  aboutImageUrl?: string;
  processImageUrl?: string;

  // Campaign Page Settings
  campaignHeroVideoId?: string;
  campaignHeroImageUrl?: string;
  campaignHeroHeadline?: string;
  campaignHeroSubcopy?: string;
  campaignHeroDescription?: string;
  campaignPortfolioTitle?: string;
  campaignPortfolioHeadline?: string;
  campaignPortfolioDescription?: string;
  
  // Campaign Service Images
  campaignService1Image?: string;
  campaignService2Image?: string;
  campaignService3Image?: string;
  campaignService4Image?: string;
}
