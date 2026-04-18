import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AboutSection from './components/AboutSection';
import ServiceSection from './components/ServiceSection';
import PortfolioSection from './components/PortfolioSection';
import ProcessSection from './components/ProcessSection';
import PartnersSection from './components/PartnersSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import AdminModal from './components/AdminModal';
import ScrollButtons from './components/ScrollButtons';
import { db } from './firebase';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { SiteSettings, PortfolioItem, Partner } from './types';
import { handleFirestoreError, OperationType } from './firebase';

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
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setSettings(data.settings);
            setPortfolio(data.portfolio);
            setPartners(data.partners);
            setIsDataLoaded(true);
            applyGlobalStyles(data.settings);
            return;
          }
        }

        // 1. Fetch Settings
        let fetchedSettings: SiteSettings | null = null;
        const settingsSnap = await getDoc(doc(db, 'settings', 'main'));
        if (settingsSnap.exists()) {
          fetchedSettings = settingsSnap.data() as SiteSettings;
          setSettings(fetchedSettings);
          applyGlobalStyles(fetchedSettings);
        }

        // 2. Fetch Portfolio
        const portfolioSnap = await getDocs(query(collection(db, 'portfolio'), orderBy('order', 'asc')));
        const fetchedPortfolio = portfolioSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioItem));
        setPortfolio(fetchedPortfolio);

        // 3. Fetch Partners
        const partnersSnap = await getDocs(query(collection(db, 'partners'), orderBy('order', 'asc')));
        const fetchedPartners = partnersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Partner));
        setPartners(fetchedPartners);

        // Save to cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: { settings: fetchedSettings, portfolio: fetchedPortfolio, partners: fetchedPartners },
          timestamp: Date.now()
        }));

        setIsDataLoaded(true);
      } catch (error) {
        console.error("Error fetching initial data:", error);
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

      document.documentElement.style.setProperty('--accent-color', data.accentColor);
      document.documentElement.style.setProperty('--primary-font', 
        data.primaryFont === 'NanumSquareNeo' ? '"NanumSquareNeo", sans-serif' :
        data.primaryFont === 'NotoSansKR' ? '"Noto Sans KR", sans-serif' :
        'Pretendard, sans-serif'
      );
    };

    fetchAllData();
  }, []);

  return (
    <div className="min-h-screen bg-black font-primary selection:bg-[var(--accent-color)] selection:text-black">
      <Navbar />
      <main>
        <Hero settings={settings} />
        <AboutSection settings={settings} />
        <ServiceSection />
        <PortfolioSection initialData={portfolio} isLoaded={isDataLoaded} />
        <ProcessSection settings={settings} />
        <PartnersSection initialData={partners} isLoaded={isDataLoaded} />
        <ContactSection />
      </main>
      <Footer />
      <AdminModal />
      <ScrollButtons />
    </div>
  );
}
