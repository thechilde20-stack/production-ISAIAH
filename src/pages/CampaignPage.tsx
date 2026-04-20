import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  ChevronDown, 
  ArrowRight, 
  Target, 
  Zap, 
  Users, 
  Layout, 
  ShieldCheck, 
  MessageSquare,
  ChevronUp,
  PlayCircle,
  Monitor,
  Check,
  Video
} from 'lucide-react';
import { cn, extractYoutubeId } from '@/src/lib/utils';
import { SiteSettings, PortfolioItem } from '@/src/types';
import YoutubeThumbnail from '@/src/components/YoutubeThumbnail';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import ContactSection from '@/src/components/ContactSection';
import YouTube from 'react-youtube';

interface CampaignPageProps {
  settings: SiteSettings | null;
  portfolio: PortfolioItem[];
  isLoaded: boolean;
}

const TIER_CATEGORIES = [
  { id: 'presidential-party', label: '후보 브랜딩' },
  { id: 'national-local-election', label: '선거 캠페인' },
  { id: 'planned-campaign-film', label: '전략 기획 캠페인' },
  { id: 'ALL', label: 'ALL' },
];

const TIER_META: Record<string, { label: string; icon: any }> = {
  'presidential-party': { label: '후보 브랜딩', icon: ShieldCheck },
  'national-local-election': { label: '선거 캠페인', icon: Users },
  'planned-campaign-film': { label: '전략 기획 캠페인', icon: Zap },
};

export default function CampaignPage({ settings, portfolio, isLoaded }: CampaignPageProps) {
  const [activeTier, setActiveTier] = useState('ALL');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const rawVideoId = settings?.campaignHeroVideoId || '0BKvOfTyLmU';
  const campaignVideoId = extractYoutubeId(rawVideoId);

  // Filter campaign portfolio
  const campaignPortfolio = portfolio
    .filter(item => item.section === 'campaign-portfolio')
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const filteredPortfolio = activeTier === 'ALL'
    ? campaignPortfolio
    : campaignPortfolio.filter(item => 
        (item.campaignTiers && item.campaignTiers.includes(activeTier)) || 
        item.campaignTier === activeTier
      );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPortfolio = () => {
    document.getElementById('campaign-portfolio-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-white font-primary selection:bg-amber-500 selection:text-black">
      <main>
        {/* 1. Hero Section */}
        <section className="relative h-[90vh] w-full overflow-hidden flex items-end justify-end bg-black pb-24 md:pb-32">
          {/* Video Background */}
          <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] h-[115%] min-w-full min-h-full">
              <YouTube
                key={campaignVideoId}
                videoId={campaignVideoId}
                opts={{
                  width: '100%',
                  height: '100%',
                  playerVars: {
                    autoplay: 1,
                    controls: 0,
                    rel: 0,
                    showinfo: 0,
                    mute: 1,
                    loop: 1,
                    playlist: campaignVideoId,
                    modestbranding: 1,
                    playsinline: 1,
                    start: 0,
                    origin: typeof window !== 'undefined' ? window.location.origin : '',
                  },
                }}
                className="w-full h-full object-cover"
                iframeClassName="w-full h-full scale-[1.35]"
                onReady={(event) => {
                  event.target.playVideo();
                  event.target.mute();
                }}
              />
            </div>
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 text-right w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="flex flex-wrap justify-end gap-3 mb-8"
            >
              {(settings?.campaignHeroSubcopy ? settings.campaignHeroSubcopy.split(',').map(s => s.trim()) : ['Real-time Workflow', 'Cinematic Story']).map((tag) => (
                <span key={tag} className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-3xl md:text-5xl font-bold tracking-tighter leading-[1.25] mb-8 break-keep bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-300 whitespace-pre-line text-right"
            >
              {settings?.campaignHeroHeadline || "선거는 초단위의 속도전,\n메시지는 영상이 될 때 힘을 가집니다."}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-white/60 text-lg md:text-xl max-w-3xl ml-auto mb-4 leading-relaxed break-keep whitespace-pre-line text-right"
            >
              {settings?.campaignHeroDescription || "기획, 촬영, 편집, 현장 대응, 라이브, 브랜딩까지\n후보와 캠프의 철학을 유권자에게 전달하는 캠페인 미디어 통합 솔루션"}
            </motion.p>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 pointer-events-none"
          >
            <span className="text-white/40 text-[10px] tracking-widest uppercase">Scroll</span>
            <div className="w-px h-12 bg-gradient-to-b from-amber-500 to-transparent" />
          </motion.div>
        </section>

        {/* 2. Why Isaiah Section */}
        <section className="py-24 bg-neutral-950">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-16 text-left"
            >
              <h4 className="text-amber-500 font-bold tracking-widest mb-4 uppercase">Why Isaiah</h4>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter leading-snug md:leading-[1.2]">
                압도적 경험이 완성하는<br className="hidden md:block" /> <span className="text-amber-500">캠페인</span>의 결과
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                { 
                  main: '속도와 시스템', 
                  sub: 'Speed & System',
                  desc: '초단위 대응이 필요한 캠페인 현장에서 즉각적인 콘텐츠 생산과 배포 시스템을 가동합니다.',
                  icon: Zap
                },
                { 
                  main: '스토리텔링과 퀄리티', 
                  sub: 'Storytelling & Quality',
                  desc: '단순한 정보 전달을 넘어 후보의 철학을 시네마틱한 문법으로 풀어내 유권자의 마음을 움직입니다.',
                  icon: Target
                },
                { 
                  main: '현장 실행력', 
                  sub: 'Field Excellence',
                  desc: '전국 단위의 현장 촬영, 라이브 송출, 돌발 상황 대응까지 수많은 현장에서 검증된 실행력을 제공합니다.',
                  icon: Users
                },
                { 
                  main: '아이덴티티와 브랜딩', 
                  sub: 'Identity & Branding',
                  desc: '캠페인 전체의 시각 언어를 통합 관리하여 후보만의 독보적인 브랜드 아이덴티티를 구축합니다.',
                  icon: ShieldCheck
                }
              ].map((item, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <item.icon className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="mb-4">
                    <h3 className="text-xl font-bold">{item.main}</h3>
                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">{item.sub}</p>
                  </div>
                  <p className="text-white/40 text-sm leading-relaxed break-keep">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Service Detail Section */}
        <section className="py-24 bg-black">
          <div className="max-w-7xl mx-auto px-6">
            {[
              {
                main: '디지털 워크플로우 & 인프라',
                sub: 'Digital Workflow & Infrastructure',
                subtitle: '선거는 초단위의 속도전, 정보 유실 없는 실시간 협업 체계를 구축합니다.',
                desc: '정적이고 뻔한 캠페인 영상에서 벗어나, 현장 촬영팀·편집팀·공보팀이 하나의 시스템 안에서 실시간으로 연결됩니다. 데이터 이중화와 아카이빙으로 선거 기간 중 발생할 수 있는 모든 사고를 차단합니다.',
                points: ['Real-time NAS Media Server', 'Data Redundancy & Archiving'],
                image: settings?.campaignService1Image || 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=800'
              },
              {
                main: '미디어 콘텐츠 제작',
                sub: 'Storytelling & Quality',
                subtitle: '유권자의 마음을 움직이는 고품격 미디어 콘텐츠을 제작합니다.',
                desc: '후보의 삶과 소신을 한 편의 영화처럼 담아내는 서사 영상부터, 인문학적 소양에서 미래 비전으로 이어지는 3단계 숏폼 시리즈까지. Sony FX3 등 4K 전문 장비와 시네마틱 사운드로 타 캠프와 차별화된 압도적 품질을 보장합니다.',
                points: ['정치 인생 서사 영상', 'Strategic Shorts', 'Cinematic Sound Mixing'],
                image: settings?.campaignService2Image || 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=800',
                reverse: true
              },
              {
                main: '현장 대응 및 협업',
                sub: 'Field Excellence',
                subtitle: '현장의 열기를 실시간으로 전달하며 어떤 상황에서도 유연하게 대응합니다.',
                desc: '출정식, 토론회, 타운홀 미팅 등 주요 행사를 방송국 수준으로 생중계합니다. 방송 작가 출신 베테랑들이 기획부터 현장 연출까지 전담하며, 전국 단위 기동 촬영과 긴밀한 협업 네트워크를 유지합니다.',
                points: ['Multi-cam Live Streaming', '전국 기동 촬영', 'Emergency Response'],
                image: settings?.campaignService3Image || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&q=80&w=800'
              },
              {
                main: '브랜드 아이덴티티',
                sub: 'Identity & BI',
                subtitle: '후보의 철학을 시각화하여 유권자에게 일관되고 강력한 메시지를 전달합니다.',
                desc: '단순 영상 제작에 그치지 않고, 후보의 공식 채널을 하나의 미디어 브랜드로 완성합니다. 빅데이터 분석 기반의 SEO 전략과 썸네일·타이틀 최적화로 노출 효과를 극대화합니다.',
                points: ['Channel Identity & Branding', '슬로건 및 공보물 디자인', 'SEO & Growth Strategy'],
                image: settings?.campaignService4Image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
                reverse: true
              }
            ].map((service, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className={cn("flex flex-col md:flex-row items-center gap-12 mb-32", service.reverse && "md:flex-row-reverse")}
              >
                <div className={cn("flex-1 space-y-6", service.reverse && "md:text-right")}>
                  <motion.div 
                    initial={{ opacity: 0, x: service.reverse ? 20 : -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className={cn(
                      "flex items-center space-x-2 text-amber-500 font-bold text-xs uppercase tracking-widest",
                      service.reverse && "md:justify-end md:space-x-reverse"
                    )}
                  >
                    <span className="w-8 h-px bg-amber-500" />
                    <span>Service {idx + 1}</span>
                  </motion.div>
                  <div className="space-y-1">
                    <h3 className="text-3xl md:text-5xl font-bold tracking-tighter">{service.main}</h3>
                    <p className="text-xs md:text-sm text-amber-500 font-bold uppercase tracking-[0.2em]">{service.sub}</p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xl font-medium text-white/80 break-keep">{service.subtitle}</p>
                    <p className="text-white/40 leading-relaxed break-keep ml-0 mr-0">{service.desc}</p>
                  </div>
                  <ul className={cn(
                    "grid grid-cols-1 sm:grid-cols-2 gap-x-6 md:gap-x-10 gap-y-3 pt-6 w-full md:w-fit", 
                    service.reverse ? "md:ml-auto" : "md:mr-auto"
                  )}>
                    {service.points.map((p, pIdx) => (
                      <motion.li 
                        key={pIdx} 
                        initial={{ opacity: 0, x: service.reverse ? 10 : -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + (pIdx * 0.1) }}
                        className="flex items-start space-x-3 text-sm text-white/60 text-left"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                        <span className="break-keep leading-relaxed">{p}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="flex-1 w-full aspect-[4/3] rounded-3xl overflow-hidden bg-white/5"
                >
                  <img src={service.image} alt={service.main} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 4. Deliverables Section */}
        <section className="py-24 bg-neutral-900 overflow-hidden relative">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6"
            >
              <div>
                <h4 className="text-amber-500 font-bold tracking-widest mb-4 uppercase text-xs">Deliverables</h4>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tighter leading-snug md:leading-[1.2]">
                  모든 접점을 아우르는<br className="hidden md:block" /> 전문 미디어 결과물
                </h2>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { main: '브랜딩', sub: 'Branding', items: ['Main Logo', 'Visual Identity', 'Color Guide'], icon: Layout },
                { main: '영상 콘텐츠', sub: 'Video', items: ['Branding Film', 'Short Contents', 'Sketch Video'], icon: Video },
                { main: '디지털 자산', sub: 'Digital', items: ['Channel Design', 'SNS Kit', 'Platform Assets'], icon: Monitor },
                { main: '현장 시스템', sub: 'Field', items: ['Live Streaming', 'On-site Editing', 'Live Motion'], icon: Zap }
              ].map((group, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="bg-white/[0.03] backdrop-blur-sm p-8 rounded-[2rem] border border-white/10 hover:border-amber-500/40 hover:bg-white/5 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <group.icon className="w-24 h-24 -mr-8 -mt-8" />
                  </div>
                  
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20 group-hover:bg-amber-500 group-hover:border-amber-500 transition-all duration-500">
                    <group.icon className="w-6 h-6 text-amber-500 group-hover:text-black transition-colors" />
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold group-hover:text-amber-500 transition-colors uppercase tracking-tight">{group.main}</h3>
                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em] opacity-60">{group.sub}</p>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((item, iIdx) => (
                      <div key={iIdx} className="flex items-center space-x-2">
                        <Check className="w-3 h-3 text-amber-500/40 group-hover:text-amber-500 transition-colors" />
                        <span className="text-[11px] text-white/40 font-medium group-hover:text-white/70 transition-colors">{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 5 & 6. Campaign Portfolio Section & Filter UI */}
        <section id="campaign-portfolio-section" className="py-24 bg-black border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-16"
            >
              <h4 className="text-amber-500 font-bold tracking-widest mb-4 uppercase text-xs">
                {settings?.campaignPortfolioTitle || "Portfolio Selection"}
              </h4>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 whitespace-pre-line leading-snug md:leading-[1.2]">
                {settings?.campaignPortfolioHeadline || "입증된 결과로 말하는\n캠페인 미디어 레코드"}
              </h2>
              <p className="text-white/40 max-w-2xl text-sm leading-relaxed break-keep whitespace-pre-line">
                {settings?.campaignPortfolioDescription || "단순 나열이 아닌, 체급별 분류를 통해 캠페인 수행 경험과 메시지 설계 역량을 보여줍니다."}
              </p>
            </motion.div>

            {/* Filter Tabs */}
            <div className="flex flex-nowrap items-center justify-end gap-x-2 md:gap-x-3 mb-12 border-b border-white/10 overflow-x-auto whitespace-nowrap scrollbar-hide w-full pr-8">
              {TIER_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTier(cat.id)}
                  className={cn(
                    "pb-3 px-1.5 text-xs font-bold tracking-wider transition-all relative uppercase shrink-0",
                    activeTier === cat.id ? "text-amber-500" : "text-white/40 hover:text-white"
                  )}
                >
                  {cat.label}
                  {activeTier === cat.id && (
                    <motion.div
                      layoutId="activeCampaignCategory"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Portfolio Grid */}
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
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
                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                      ) : (
                        <YoutubeThumbnail videoId={item.videoUrl} alt={item.title} className="group-hover:scale-110" />
                      )}
                    </div>
                    
                    {/* Hover Overlay - Based on main site concept */}
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-6 text-center backdrop-blur-[2px]">
                      {/* Tier Tag - Top Left (Matches main site category style) */}
                      {((item.campaignTiers && item.campaignTiers.length > 0) || item.campaignTier) && (
                        <div 
                          className="absolute top-6 left-6 flex flex-col items-start space-y-1 z-10 -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 delay-100"
                        >
                          {(item.campaignTiers || [item.campaignTier]).filter(Boolean).map((tierId, tIdx) => (
                            tierId && TIER_META[tierId] && (
                              <div key={tIdx} className="inline-flex items-center space-x-1.5 text-amber-500 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md">
                                {React.createElement(TIER_META[tierId].icon, { className: "w-3 h-3" })}
                                <span className="text-[10px] font-light tracking-tight uppercase">{TIER_META[tierId].label}</span>
                              </div>
                            )
                          ))}
                        </div>
                      )}

                        <div className="space-y-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-200">
                          {/* Only show Play icon if it's a video (it has a youtube ID) */}
                          {item.videoUrl && (
                            <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                              <Play className="w-6 h-6 text-black fill-current ml-1" />
                            </div>
                          )}
                          
                          {item.title && <h4 className="text-xl font-bold leading-tight break-keep">{item.title}</h4>}
                          
                          <div className="flex flex-col space-y-1 text-sm text-white/60">
                            {(item.year || item.clientOrCandidate) && (
                              <span className="font-medium text-amber-500/80 uppercase tracking-wider break-keep">
                                {item.year}{item.year && item.clientOrCandidate ? ' | ' : ''}{item.clientOrCandidate}
                              </span>
                            )}
                            
                            {(item.description || item.info) && (
                              <p className="text-xs text-white/40 max-w-[240px] mx-auto leading-relaxed break-keep mt-2">
                                {item.description || item.info}
                              </p>
                            )}
                          </div>
                        </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredPortfolio.length === 0 && (
              <div className="py-32 text-center border border-dashed border-white/10 rounded-3xl">
                <p className="text-white/20">해당 카테고리의 포트폴리오가 준비 중입니다.</p>
              </div>
            )}

            {filteredPortfolio.length > visibleCount && (
              <div className="mt-20 flex justify-center">
                <button
                  onClick={() => setVisibleCount(prev => prev + 6)}
                  className="group flex flex-col items-center space-y-2 text-white/40 hover:text-amber-500 transition-colors"
                >
                  <span className="text-xs font-bold tracking-[0.3em] uppercase">Show More Items</span>
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-amber-500 transition-colors">
                    <ChevronDown />
                  </div>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 7. Process Section */}
        <section className="py-24 bg-neutral-950">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-16 text-left"
            >
              <h4 className="text-amber-500 font-bold tracking-widest mb-4 uppercase text-xs">Workflow</h4>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 leading-snug md:leading-[1.2]">격렬한 현장에서 작동하는<br className="hidden md:block" /> 완벽한 프로세스</h2>
              <p className="text-white/40 max-w-2xl text-sm leading-relaxed">
                속도가 생명인 캠페인 미디어 환경에 최적화된 프로덕션 이사야만의 제작 워크플로우를 소개합니다.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 relative">
              <div className="hidden md:block absolute top-[40px] left-[8.33%] right-[8.33%] h-px bg-white/5 z-0" />
              
              {/* Moving Light Beam Effect */}
              <div className="hidden md:block absolute top-[40px] left-[8.33%] right-[8.33%] h-[1px] z-0 overflow-hidden">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "400%" }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className="w-1/4 h-full bg-gradient-to-r from-transparent via-amber-500 to-transparent"
                />
              </div>
              {[
                { title: '메시지 분석', desc: '캠페인 목표와 키워드 도출', step: '01', icon: Target },
                { title: '후보 포지셔닝', desc: '비주얼 컨셉 및 이미지 설계', step: '02', icon: ShieldCheck },
                { title: '콘텐츠 분류', desc: '매체별 맞춤형 제작 가이드', step: '03', icon: Layout },
                { title: '현장 제작', desc: '시네마틱 촬영 및 라이브', step: '04', icon: PlayCircle },
                { title: '신속 편집', desc: '실시간 현장 편집 및 배포', step: '05', icon: Zap },
                { title: '반응 분석', desc: '모니터링을 통한 전략 보완', step: '06', icon: Users }
              ].map((item, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="relative z-10 flex flex-col items-center text-center group"
                >
                  {/* Step Hexagon/Circle Container */}
                  <div className="w-20 h-20 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center mb-6 relative transition-all duration-500 group-hover:border-amber-500/50 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-2xl font-black text-white/10 group-hover:text-amber-500/20 absolute -right-2 -bottom-2 transition-all duration-500 blur-[1px]">
                      {item.step}
                    </span>
                    <item.icon className="w-8 h-8 text-amber-500/40 group-hover:text-amber-500 transition-all duration-500 scale-90 group-hover:scale-110" />
                  </div>

                  <div className="space-y-2 px-2">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-[10px] font-black text-amber-500 tabular-nums bg-amber-500/10 px-1.5 py-0.5 rounded leading-none">
                        {item.step}
                      </span>
                      <h3 className="font-bold text-sm tracking-tight group-hover:text-amber-500 transition-colors uppercase">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-white/40 break-keep leading-relaxed group-hover:text-white/60 transition-colors">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Final CTA Section */}
        <section className="py-24 bg-black border-t border-white/5 relative overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://picsum.photos/seed/election-night/1920/1080?blur=1" 
              alt="Final CTA Background" 
              className="w-full h-full object-cover opacity-30 grayscale"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black" />
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none z-0" />
          
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold tracking-tighter leading-tight mb-8 break-keep bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400"
            >
              메시지가 분명할수록<br />
              <span className="text-amber-500">캠페인은 더 멀리 갑니다.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-white/60 text-lg md:text-xl mb-12 break-keep leading-relaxed mx-auto max-w-2xl"
            >
              영상 제작부터 현장 대응, 라이브, 브랜딩까지<br />
              캠페인에 필요한 압도적 미디어 실행력을 제안드립니다.
            </motion.p>
          </div>
        </section>

        <ContactSection />
      </main>

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
              className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl"
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
                <ChevronUp className="w-8 h-8" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
