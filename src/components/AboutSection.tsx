import { motion } from 'motion/react';
import { Lightbulb, Rocket, BookOpen, Layers } from 'lucide-react';
import { SiteSettings } from '../types';

const whyIsaiah = [
  {
    icon: Lightbulb,
    title: '전략적 기획력',
    desc: '타겟과 목적을 먼저 정의하고, 그에 맞는 서사 구조를 설계합니다. 연출은 그 다음입니다.',
  },
  {
    icon: Rocket,
    title: '탁월한 실행력',
    desc: '시네마급 장비와 숙련된 전문 인력으로, 어떤 현장에서도 타협 없는 퀄리티를 만들어냅니다.',
  },
  {
    icon: BookOpen,
    title: '깊이 있는 스토리텔링',
    desc: '다큐멘터리 제작 역량을 바탕으로 진정성 있는 서사를 영상에 담아냅니다.',
  },
  {
    icon: Layers,
    title: '통합 제작 시스템',
    desc: '기획, 촬영, 편집, 모션그래픽까지 전 과정을 내부에서 원스톱으로 진행합니다.',
  },
];

export default function AboutSection({ settings }: { settings: SiteSettings | null }) {
  return (
    <section id="about" className="py-24 bg-[#0a0a0a] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Top Section: Intro */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight mb-12">
              단순 영상 제작을 넘어,<br />
              <span className="text-[var(--accent-color)]">목적과 메시지</span>를 설계합니다.
            </h2>
            
            <div className="space-y-8 text-white/60 text-lg leading-relaxed font-light whitespace-pre-line">
              {settings?.aboutShortText ? (
                <p>{settings.aboutShortText}</p>
              ) : (
                <>
                  <p>
                    프로덕션 이사야(ISAIAH)는 영상이 지닌 힘을 믿습니다.<br />
                    화려함을 쫓기보다, 클라이언트가 진정으로 전달하고자 하는 메시지의 본질을 먼저 묻습니다.
                  </p>
                  <p>
                    공공기관의 정책 홍보부터 기업 브랜드 필름, 깊이 있는 다큐멘터리까지 —<br />
                    프로젝트의 성격과 맥락에 맞는 스토리텔링과 연출로, 시청자의 마음에 오래 남는 결과물을 만들어냅니다.
                  </p>
                  <p>
                    기획에서 촬영, 편집, 운영 지원까지 이어지는 통합 제작 시스템을 바탕으로<br />
                    가장 효율적이고 전문적인 영상 솔루션을 제공합니다.
                  </p>
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-3xl overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=800&h=1000" 
                alt="Professional studio film production" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Stats Card */}
            <div className="absolute -bottom-6 -left-6 bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-2xl flex gap-12 shadow-2xl">
              <div>
                <div className="text-3xl font-bold text-amber-500 mb-1">500+</div>
                <div className="text-xs tracking-widest text-white/40 uppercase">Projects</div>
              </div>
              <div className="w-px h-full bg-white/10" />
              <div>
                <div className="text-3xl font-bold text-amber-500 mb-1">100+</div>
                <div className="text-xs tracking-widest text-white/40 uppercase">Clients</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section: Why ISAIAH */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">Why ISAIAH</h3>
            <p className="text-white/40">프로덕션 이사야가 신뢰받는 4가지 이유</p>
          </motion.div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyIsaiah.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:border-amber-500/30 transition-all group"
            >
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-8 group-hover:bg-amber-500 transition-colors">
                <item.icon className="w-6 h-6 text-amber-500 group-hover:text-black transition-colors" />
              </div>
              <h4 className="text-xl font-bold mb-4">{item.title}</h4>
              <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
