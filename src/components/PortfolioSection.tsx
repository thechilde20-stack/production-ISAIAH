import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, ChevronDown, ChevronUp, Megaphone, Film, Cpu, BookOpen } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/firebase';
import { PortfolioItem } from '@/src/types';

const INITIAL_ITEMS = 6;
const BATCH_SIZE = 20;

const CATEGORY_META: Record<string, { label: string; icon: any }> = {
  'DIGITAL_AI': { label: 'DIGITAL & AI', icon: Cpu },
  'COMMERCIAL': { label: 'COMMERCIAL', icon: Megaphone },
  'DOCUMENTARY_FILM': { label: 'DOCUMENTARY & FILM', icon: Film },
  'EDUCATION': { label: 'EDUCATION', icon: BookOpen },
};

const MOCK_PORTFOLIO: PortfolioItem[] = [
  { id: '1', title: '뮤지컬 루쓰! 배우 선예, 이지훈, 김다현', categories: ['DIGITAL_AI'], thumbnail: '', videoUrl: 'iM8_tSZ_K_I', info: '유튜브 토크쇼 (별다방토크)', order: 1, createdAt: Date.now() },
  { id: '2', title: '서울약령시 한방진흥센터 한방톡톡 시리즈', categories: ['COMMERCIAL', 'EDUCATION'], thumbnail: '', videoUrl: 'ULu7K1vXxVI', info: '원인모를 근육통 TOP5 - 유튜브 채널', order: 2, createdAt: Date.now() },
  { id: '3', title: '한미동맹 70주년 기념 세미나 영상 스케치', categories: ['COMMERCIAL'], thumbnail: '', videoUrl: 'q_F44l_6dWE', info: '한미우호협회, 국제안보교류협회', order: 3, createdAt: Date.now() },
  { id: '4', title: '장애인의 날 기념 - 2023년 따뜻한 동행', categories: ['COMMERCIAL'], thumbnail: '', videoUrl: '7fDTRJNBBxs', info: '동대문구 캠페인 행사 스케치', order: 4, createdAt: Date.now() },
  { id: '5', title: 'TV홍카콜라', categories: ['DIGITAL_AI'], thumbnail: '', videoUrl: 'h8sJ6fkR99E', info: '유튜브 채널 브랜딩 및 운영', order: 5, createdAt: Date.now() },
  { id: '6', title: '에스라통독사역원 말씀클립', categories: ['DIGITAL_AI'], thumbnail: '', videoUrl: 'e6m51AbCCZc', info: '유튜브 채널 콘텐츠 제작', order: 6, createdAt: Date.now() },
  { id: '7', title: '하용조목사 기념 홍보관 다큐멘터리', categories: ['DOCUMENTARY_FILM'], thumbnail: '', videoUrl: 'NwD0hEmNU2s', info: '온누리교회 메모리얼 필름', order: 7, createdAt: Date.now() },
  { id: '8', title: '독일 도펠헤르츠 社', categories: ['COMMERCIAL'], thumbnail: '', videoUrl: 'O4TdCVa5ldw', info: '제품 프로모션 영상', order: 8, createdAt: Date.now() },
  { id: '9', title: '6.25납북희생자 기억의 날', categories: ['COMMERCIAL'], thumbnail: '', videoUrl: 'Qmnz5iqJ8Hg', info: '현장 스케치 영상', order: 9, createdAt: Date.now() },
  { id: '10', title: '국가란 무엇인가? PLI 특집시리즈1', categories: ['EDUCATION'], thumbnail: '', videoUrl: 'rFa0j2xQuzY', info: '유튜브 채널 교육 콘텐츠', order: 10, createdAt: Date.now() },
  { id: '11', title: '통큰통독 90강 프로젝트', categories: ['EDUCATION'], thumbnail: '', videoUrl: 'sAh6CJIQqyU', info: '에스라통독사역원 강의 영상', order: 11, createdAt: Date.now() },
  { id: '12', title: '장군의소리', categories: ['DIGITAL_AI'], thumbnail: '', videoUrl: 'KFDxku6_2QA', info: '유튜브 채널 브랜딩', order: 12, createdAt: Date.now() },
  { id: '13', title: '서초중앙시니어스', categories: ['COMMERCIAL'], thumbnail: '', videoUrl: 'gQHhqcEjA08', info: '서초구립중앙노인종합복지관 홍보', order: 13, createdAt: Date.now() },
  { id: '14', title: '당과 함께한 26년(대선경선)', categories: ['COMMERCIAL'], thumbnail: '', videoUrl: 'mOTUSMr681c', info: '정치 기획 홍보 영상', order: 14, createdAt: Date.now() },
  { id: '15', title: '국가란 무엇인가? PLI 특집시리즈2', categories: ['EDUCATION'], thumbnail: '', videoUrl: 'czbuzJ29lzI', info: '유튜브 채널 교육 콘텐츠', order: 15, createdAt: Date.now() },
  { id: '16', title: '성주붉은달', categories: ['DOCUMENTARY_FILM'], thumbnail: '', videoUrl: 'bmZ5nY5lUQU', info: '다큐멘터리 영화 (국회 상영작)', order: 16, createdAt: Date.now() },
  { id: '17', title: '암웨이(Amway)', categories: ['DIGITAL_AI'], thumbnail: '', videoUrl: 'Hb_lW7Opymo', info: '타이포그래피 가이드 영상', order: 17, createdAt: Date.now() },
];

function YoutubeThumbnail({ videoId, alt }: { videoId: string; alt: string }) {
  const [src, setSrc] = useState(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setSrc(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
    setHasError(false);
  }, [videoId]);

  const handleError = () => {
    if (!hasError) {
      setSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
      setHasError(true);
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      onError={handleError}
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      referrerPolicy="no-referrer"
    />
  );
}

export default function PortfolioSection() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [visibleCount, setVisibleCount] = useState(INITIAL_ITEMS);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    // Reset visible count when category changes
    setVisibleCount(INITIAL_ITEMS);
  }, [activeCategory]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      const path = 'portfolio';
      try {
        const q = query(collection(db, path), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as PortfolioItem));
          setPortfolio(items);
        } else {
          // Fallback to mock data if collection is empty
          setPortfolio(MOCK_PORTFOLIO);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    };

    fetchPortfolio();
  }, []);

  const filteredPortfolio = activeCategory === 'ALL' 
    ? portfolio 
    : portfolio.filter(item => {
        const itemCats = item.categories || (item.category ? [item.category] : []);
        return itemCats.includes(activeCategory);
      });

  const isExpanded = visibleCount >= filteredPortfolio.length;

  const toggleExpand = () => {
    if (isExpanded) {
      setVisibleCount(INITIAL_ITEMS);
      // Scroll back to the top of the section when collapsing
      const section = document.getElementById('work');
      if (section) {
        const offset = 100; // Adjust for navbar
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = section.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    } else {
      setVisibleCount(prev => Math.min(prev + BATCH_SIZE, filteredPortfolio.length));
    }
  };

  const categories = [...Object.keys(CATEGORY_META), 'ALL'];

  return (
    <section id="work" className="py-24 bg-black text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <h4 className="text-amber-500 font-bold tracking-widest mb-4 uppercase">Works</h4>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter leading-tight mb-6">
            STORIES THAT TOUCH<br />
            IMAGES THAT LAST
          </h2>
          <p className="text-white/60 max-w-2xl leading-relaxed break-keep">
            모든 브랜드에는 고유한 색이 있습니다. 우리는 그 색을 찾고, 영상 위에 온전히 담아냅니다.<br />
            변화 앞에서도, 사람 앞에서도 언제나 준비되어 있습니다.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-end gap-x-8 gap-y-4 mb-12 border-b border-white/10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "pb-4 text-xs font-bold tracking-[0.2em] transition-all relative uppercase",
                activeCategory === cat ? "text-amber-500" : "text-white/40 hover:text-white"
              )}
            >
              {cat === 'ALL' ? 'ALL' : CATEGORY_META[cat].label}
              {activeCategory === cat && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {filteredPortfolio.slice(0, visibleCount).map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="group cursor-pointer relative aspect-video rounded-xl overflow-hidden bg-white/5"
                onClick={() => setSelectedVideo(item.videoUrl)}
              >
                <div className="relative aspect-video overflow-hidden">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <YoutubeThumbnail videoId={item.videoUrl} alt={item.title} />
                  )}
                </div>
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-6 text-center backdrop-blur-[2px]">
                  {/* Category Tag - Top Left */}
                  {(item.categories || (item.category ? [item.category] : [])).map((cat, catIdx) => (
                    cat && CATEGORY_META[cat] && (
                      <div 
                        key={cat}
                        className={cn(
                          "absolute left-6 inline-flex items-center space-x-1.5 text-amber-500 z-10 -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500",
                        )}
                        style={{ 
                          top: `${24 + (catIdx * 20)}px`,
                          transitionDelay: `${100 + (catIdx * 100)}ms`
                        }}
                      >
                        {React.createElement(CATEGORY_META[cat].icon, { className: "w-3 h-3" })}
                        <span className="text-[10px] font-light tracking-tight uppercase">{CATEGORY_META[cat].label}</span>
                      </div>
                    )
                  ))}

                  <div className="space-y-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-black fill-current ml-1" />
                    </div>
                    <h4 className="text-xl font-bold leading-tight break-keep">{item.title}</h4>
                    <div className="flex flex-col space-y-1 text-sm text-white/60">
                      <span className="font-medium text-amber-500/80 uppercase tracking-wider break-keep">{item.info}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredPortfolio.length > INITIAL_ITEMS && (
          <div className="mt-16 flex justify-center">
            <button
              onClick={toggleExpand}
              className="group flex flex-col items-center space-y-2 text-white/40 hover:text-amber-500 transition-colors"
            >
              <span className="text-xs font-bold tracking-[0.3em] uppercase">
                {isExpanded ? 'View Less' : 'View More'}
              </span>
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-amber-500 transition-colors">
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                onClick={() => setSelectedVideo(null)}
              >
                <ChevronDown className="w-8 h-8 rotate-180" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
