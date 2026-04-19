import React from 'react';
import { motion } from 'motion/react';
import { SiteSettings } from '@/src/types';

const steps = [
  {
    number: '01',
    title: '상담 및 목적 정의',
    description: '클라이언트의 니즈와 영상의 핵심 목적을 파악하고 제작 방향을 설정합니다.',
  },
  {
    number: '02',
    title: '기획안 및 시나리오 제안',
    description: '타겟 분석을 바탕으로 창의적인 기획안과 구체적인 시나리오를 제안합니다.',
  },
  {
    number: '03',
    title: '촬영 진행',
    description: '최적의 로케이션과 전문 장비를 활용하여 고퀄리티 소스를 확보합니다.',
  },
  {
    number: '04',
    title: '편집 및 디자인',
    description: '컷 편집, 색보정, 사운드 믹싱, 모션그래픽을 통해 영상의 완성도를 높입니다.',
  },
  {
    number: '05',
    title: '수정 및 최종 납품',
    description: '피드백을 반영한 최종 수정을 거쳐 최적화된 포맷으로 납품합니다.',
  },
  {
    number: '06',
    title: '운영 및 확산 지원',
    description: '필요 시 유튜브 채널 업로드 및 광고 집행 등 사후 마케팅을 지원합니다.',
  },
];

interface ProcessSectionProps {
  settings: SiteSettings | null;
}

export default function ProcessSection({ settings }: ProcessSectionProps) {
  const defaultImageUrl = "https://picsum.photos/seed/light-glow/1920/1080";
  const processImg = settings?.processImageUrl || defaultImageUrl;

  return (
    <section id="process" className="py-32 bg-black text-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Vision Part */}
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div>
            <h4 className="text-amber-500 font-bold tracking-widest mb-4 uppercase">PROCESS</h4>
          </div>
        </div>

        <div className="relative aspect-[21/9] rounded-3xl overflow-hidden mb-24 group">
          <img
            src={processImg}
            alt="Vision Background"
            className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="absolute inset-0 flex items-center justify-center p-8 text-center"
          >
            <div className="max-w-5xl space-y-8">
              <motion.h3 
                variants={{
                  initial: { opacity: 0, y: 20, filter: 'blur(10px)' },
                  animate: { opacity: 1, y: 0, filter: 'blur(0px)' }
                }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="text-xl md:text-3xl font-regular leading-normal break-keep"
              >
                마음을 울리는 한 편의 영상이 한 사람의 생각을 바꾸고,<br />
                그 변화가 세상을 움직이는 <span className="text-amber-500 font-bold">시작점</span>이라 믿습니다.<br />
                단순히 미디어 콘텐츠를 만드는 것을 넘어, 사람의 마음을 움직이고<br />
                세상을 밝히는 <span className="text-amber-500 font-bold">미디어 프로덕션</span>이 되겠습니다.
              </motion.h3>
              <motion.div 
                variants={{
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 }
                }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                className="text-white/40 italic text-sm md:text-base"
              >
                "Arise, shine; for thy light is come, and the glory of the Lord is risen upon thee."<br />
                (Isaiah 60:1, KJV)
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Process Steps Part */}
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 hidden lg:block -translate-y-1/2" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 relative z-10">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.8, 
                  delay: i * 0.1,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-sm border border-amber-500/20 flex items-center justify-center mb-8 relative transition-all duration-500 group-hover:border-amber-500 group-hover:bg-amber-500/10 group-hover:scale-110">
                  <span className="text-amber-500 font-bold text-xl">{step.number}</span>
                  {/* Pulse Effect for current step (simulated) */}
                  {i === 0 && (
                    <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping group-hover:animate-none" />
                  )}
                </div>
                <h3 className="text-lg font-bold mb-4 tracking-tight group-hover:text-amber-500 transition-colors">{step.title}</h3>
                <p className="text-white/40 text-xs leading-relaxed font-light break-keep group-hover:text-white/70 transition-colors">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
