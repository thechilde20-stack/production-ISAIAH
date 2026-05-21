import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AboutSection from './components/AboutSection';
import ServiceSection from './components/ServiceSection';
import PortfolioSection from './components/PortfolioSection';
import ProcessSection from './components/ProcessSection';
import PartnersSection from './components/PartnersSection';
import FAQSection from './components/FAQSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import ScrollButtons from './components/ScrollButtons';
import { db } from './firebase';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { SiteSettings, PortfolioItem, Partner } from './types';
import { handleFirestoreError, OperationType } from './firebase';

const CampaignPage = lazy(() => import('./pages/CampaignPage'));
const AdminModal = lazy(() => import('./components/AdminModal'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function AdminMount() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsAdminOpen(true);
    window.addEventListener('open-admin', handleOpen);
    return () => window.removeEventListener('open-admin', handleOpen);
  }, []);

  if (!isAdminOpen) return null;

  return (
    <Suspense fallback={null}>
      <AdminModal initialOpen={true} />
    </Suspense>
  );
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    } else {
      setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [pathname, hash]);

  return null;
}

function HomePage({ settings, portfolio, partners, isDataLoaded }: { 
  settings: SiteSettings | null; 
  portfolio: PortfolioItem[]; 
  partners: Partner[]; 
  isDataLoaded: boolean;
}) {
  return (
    <main>
      <Hero settings={settings} />
      <AboutSection settings={settings} />
      <ServiceSection />
      <PortfolioSection initialData={portfolio.filter(item => item.section !== 'campaign-portfolio')} isLoaded={isDataLoaded} />
      <ProcessSection settings={settings} />
      <PartnersSection initialData={partners} isLoaded={isDataLoaded} />
      <FAQSection />
      <ContactSection />
    </main>
  );
}

export default function App() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      const CACHE_KEY = 'isaiah_site_data';
      const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
      
      try {
        // Try to load from cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
              setSettings(data.settings);
              setPortfolio(data.portfolio);
              setPartners(data.partners);
              setIsDataLoaded(true);
              applyGlobalStyles(data.settings);
            }
          } catch (e) {
            console.warn("Invalid cache data", e);
          }
        }

        // 1. Fetch Settings
        let fetchedSettings: SiteSettings | null = null;
        let fetchedPortfolio: PortfolioItem[] = [];
        let fetchedPartners: Partner[] = [];

        const settingsPromises = [
          getDoc(doc(db, 'settings', 'main')),
          getDoc(doc(db, 'settings', 'campaign'))
        ];
        const settingsSnapResult = await Promise.allSettled(settingsPromises);
        
        let settingsData = {};
        if (settingsSnapResult[0].status === 'fulfilled' && settingsSnapResult[0].value.exists()) {
          settingsData = { ...settingsData, ...settingsSnapResult[0].value.data() };
        }
        if (settingsSnapResult[1].status === 'fulfilled' && settingsSnapResult[1].value.exists()) {
          settingsData = { ...settingsData, ...settingsSnapResult[1].value.data() };
        }
        
        if (Object.keys(settingsData).length > 0) {
          fetchedSettings = settingsData as SiteSettings;
          setSettings(fetchedSettings);
          applyGlobalStyles(fetchedSettings);
        }

        // 2 & 3. Fetch Portfolio and Partners in parallel
        try {
          const [portfolioSnap, partnersSnap] = await Promise.all([
            getDocs(query(collection(db, 'portfolio'), orderBy('order', 'asc'))),
            getDocs(query(collection(db, 'partners'), orderBy('order', 'asc')))
          ]);
          
          fetchedPortfolio = portfolioSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioItem));
          setPortfolio(fetchedPortfolio);
          
          fetchedPartners = partnersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Partner));
          setPartners(fetchedPartners);
        } catch (err) {
          console.error("Data fetch failed:", err);
        }

        // Save to cache - wrapped in try-catch because Base64 images can exceed quota
        try {
          const sanitizeForCache = (obj: any) => {
            if (!obj) return obj;
            return JSON.parse(JSON.stringify(obj, (key, value) => {
              // If string starts with data:image (base64) don't cache it
              if (typeof value === 'string' && value.startsWith('data:image')) {
                return undefined;
              }
              return value;
            }));
          };

          const cacheData = JSON.stringify({
            data: { 
              settings: sanitizeForCache(fetchedSettings), 
              portfolio: sanitizeForCache(fetchedPortfolio), 
              partners: sanitizeForCache(fetchedPartners) 
            },
            timestamp: Date.now()
          });

          // Only cache if < 1MB (1024 * 1024 chars)
          if (cacheData.length < 1048576) {
            localStorage.setItem(CACHE_KEY, cacheData);
          }
        } catch (cacheError) {
          console.warn("Failed to save to cache (likely quota exceeded):", cacheError);
          // If quota exceeded, clear old cache to try and make room next time (optional)
          if (cacheError instanceof Error && cacheError.name === 'QuotaExceededError') {
            localStorage.removeItem(CACHE_KEY);
          }
        }

        setIsDataLoaded(true);
      } catch (error) {
        console.error("Critical error in fetchAllData:", error);
        setIsDataLoaded(true);
      }
    };

    const applyGlobalStyles = (data: SiteSettings) => {
      document.title = data.siteTitle;
      const updateMeta = (name: string, content: string, isProperty = false) => {
        if (!content) return;
        let el = document.querySelector(isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`);
        if (!el) {
          el = document.createElement('meta');
          if (isProperty) el.setAttribute('property', name);
          else el.setAttribute('name', name);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      updateMeta('description', data.metaDescription);
      updateMeta('keywords', data.keywords);
      updateMeta('og:title', data.siteTitle, true);
      updateMeta('og:description', data.ogDescription, true);
      updateMeta('og:image', data.ogImage, true);

      if (data.favicon) {
        let links: NodeListOf<HTMLLinkElement> = document.querySelectorAll("link[rel*='icon']");
        if (links.length === 0) {
          const link = document.createElement('link');
          link.rel = 'icon';
          link.href = data.favicon;
          document.head.appendChild(link);
        } else {
          links.forEach(link => { link.href = data.favicon; });
        }
      }

      document.documentElement.style.setProperty('--accent-color', data.accentColor || '#f59e0b'); // Default to amber-500
      document.documentElement.style.setProperty('--primary-font', 
        data.primaryFont === 'NanumSquareNeo' ? '"NanumSquareNeo", sans-serif' :
        data.primaryFont === 'NotoSansKR' ? '"Noto Sans KR", sans-serif' :
        'Pretendard, sans-serif'
      );
    };

    fetchAllData();
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-black font-primary selection:bg-[var(--accent-color)] selection:text-black">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage settings={settings} portfolio={portfolio} partners={partners} isDataLoaded={isDataLoaded} />} />
          <Route path="/campaign" element={
            <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white/50">Loading...</div>}>
              <CampaignPage settings={settings} portfolio={portfolio} isLoaded={isDataLoaded} />
            </Suspense>
          } />
          <Route path="*" element={
            <Suspense fallback={<div className="min-h-screen bg-black" />}>
              <NotFoundPage />
            </Suspense>
          } />
        </Routes>
        <Footer />
        <AdminMount />
        <ScrollButtons />
      </div>
    </BrowserRouter>
  );
}
