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
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { SiteSettings } from './types';
import { handleFirestoreError, OperationType } from './firebase';

export default function App() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const path = 'settings/main';
      try {
        const snapshot = await getDoc(doc(db, 'settings', 'main'));
        if (snapshot.exists()) {
          const data = snapshot.data() as SiteSettings;
          setSettings(data);
          
          // Apply SEO and Global Styles
          document.title = data.siteTitle;
          
          // Update Meta Tags
          const updateMeta = (name: string, content: string, isProperty = false) => {
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
          updateMeta('og:description', data.metaDescription, true);
          updateMeta('og:image', data.ogImage, true);

          // Update Favicon
          if (data.favicon) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = data.favicon;
          }

          // Apply Global CSS Variables
          document.documentElement.style.setProperty('--accent-color', data.accentColor);
          document.documentElement.style.setProperty('--primary-font', 
            data.primaryFont === 'NanumSquareNeo' ? '"NanumSquareNeo", sans-serif' :
            data.primaryFont === 'NotoSansKR' ? '"Noto Sans KR", sans-serif' :
            'Pretendard, sans-serif'
          );
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    };

    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-black font-primary selection:bg-[var(--accent-color)] selection:text-black">
      <Navbar />
      <main>
        <Hero settings={settings} />
        <AboutSection />
        <ServiceSection />
        <PortfolioSection />
        <ProcessSection />
        <PartnersSection />
        <ContactSection />
      </main>
      <Footer />
      <AdminModal />
    </div>
  );
}
