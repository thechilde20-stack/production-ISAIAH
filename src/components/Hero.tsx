import YouTube from 'react-youtube';
import { motion } from 'motion/react';
import { SiteSettings } from '../types';

interface HeroProps {
  settings: SiteSettings | null;
}

export default function Hero({ settings }: HeroProps) {
  const videoId = settings?.heroVideoId || 'U46x9TtmO40';

  const opts = {
    playerVars: {
      autoplay: 1,
      controls: 0,
      rel: 0,
      showinfo: 0,
      mute: 1,
      loop: 1,
      playlist: videoId,
      modestbranding: 1,
      playsinline: 1,
      start: 0,
    },
  };

  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-black">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] h-[115%] min-w-full min-h-full">
          <YouTube
            key={videoId}
            videoId={videoId}
            opts={opts}
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center md:text-right w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="space-y-6"
        >
          <h4 className="text-[var(--accent-color)] font-primary font-bold text-lg md:text-xl">
            {settings?.heroSubcopy || '프로덕션 이사야'}
          </h4>
          <h1 className="text-4xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-300 leading-tight tracking-tighter whitespace-pre-line">
            {settings?.heroHeadline || '마음을 움직이고,\n메세지는 선명하게!'}
          </h1>
          <p className="text-white/60 text-sm md:text-lg font-medium leading-relaxed max-w-2xl ml-auto whitespace-pre-line">
            {settings?.heroDescription || '공공기관·브랜드·다큐멘터리·교육 콘텐츠를\n기획부터 완성까지, 신뢰할 수 있는 파트너 프로덕션 이사야입니다.'}
          </p>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2"
      >
        <span className="text-white/40 text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-[var(--accent-color)] to-transparent" />
      </motion.div>
    </section>
  );
}
