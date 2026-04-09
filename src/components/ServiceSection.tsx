import React from 'react';
import { motion } from 'motion/react';
import { Youtube, Trophy, Cpu, Film, GraduationCap, Video, Lightbulb, Monitor, Palette, Megaphone } from 'lucide-react';

const services = [
  {
    icon: Youtube,
    title: '유튜브 콘텐츠 제작·운영',
    desc: '채널 아이덴티티 구축부터 정기적인 콘텐츠 기획 및 제작까지 통합 관리합니다.',
  },
  {
    icon: Trophy,
    title: '브랜드 필름 / 홍보영상',
    desc: '브랜드가 가진 가치와 철학을 감각적인 영상미와 영상 언어로 풀어냅니다.',
  },
  {
    icon: Cpu,
    title: 'AI 기반 연출 / 애니메이션',
    desc: '최신 AI 기술과 모션그래픽으로, 상상에만 머물던 장면을 화면 위에 구현합니다.',
  },
  {
    icon: Film,
    title: '다큐멘터리 / 영화',
    desc: '진정성 있는 기록과 예술적 연출이 만나는 지점에서, 오래 기억되는 영상을 만듭니다.',
  },
  {
    icon: GraduationCap,
    title: '교육·강의 영상',
    desc: '복잡한 내용을 명확하게. 시각적 구성과 정보 설계로 학습 경험을 높입니다.',
  },
  {
    icon: Megaphone,
    title: '캠페인 / 인터뷰 영상',
    desc: '메시지는 넓게, 이야기는 깊게. 사회적 울림과 개인의 진솔함을 함께 담습니다.',
  },
];

const teams = [
  {
    icon: Lightbulb,
    name: '기획팀',
    desc: '아이디어에서 실행까지. 전략적 기획과 데이터 분석으로 프로젝트의 방향을 설계합니다.',
  },
  {
    icon: Video,
    name: '촬영팀',
    desc: '영상·스틸·녹음·조명 각 분야의 전문 인력이 어떤 현장에서도 최적의 촬영 환경을 구현합니다.',
  },
  {
    icon: Monitor,
    name: '편집팀',
    desc: '미디어 트렌드를 반영한 영상 디자인과 종합 편집으로, 콘텐츠의 메시지가 가장 선명하게 전달되는 결과물을 만듭니다.',
  },
  {
    icon: Palette,
    name: '디자인팀',
    desc: '모션그래픽·소셜미디어·출판·브랜드 디자인까지, 자체 기술력을 기반으로 프로젝트의 시각적 완성도를 높입니다.',
  },
];

export default function ServiceSection() {
  return (
    <section id="service" className="py-24 bg-black text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-12 gap-12 mb-24">
          <div className="md:col-span-4">
            <h4 className="text-amber-500 font-bold tracking-widest mb-4 uppercase">Service Area</h4>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter leading-tight mb-6">
              의미있는 영상을 만드는<br />
              프로덕션 이사야 입니다.
            </h2>
            <p className="text-white/60 leading-relaxed mb-12">
              영상은 세상과 연결되는 언어입니다. 우리는 그 언어로, 마음에 닿는 이야기를 만듭니다.
            </p>
            
            <div className="p-8 border-l-2 border-amber-500 bg-white/5 italic text-white/80">
              "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters."
              <br />
              <span className="text-sm text-amber-500/60 mt-2 block">— Colossians 3:23</span>
            </div>
          </div>

          <div className="md:col-span-8">
            <div className="mb-12">
              <h3 className="text-2xl font-light">
                <span className="font-bold">따뜻한 시선으로 세상을 밝히는</span><br />
                <span className="text-white/40">미디어 프로덕션이 되겠습니다.</span>
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex space-x-4"
                >
                  <div className="flex-shrink-0">
                    <service.icon className="w-8 h-8 text-amber-500" />
                  </div>
                  <div>
                    <h5 className="font-bold mb-2">{service.title}</h5>
                    <p className="text-sm text-white/50 leading-relaxed">{service.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Organization / Team Section merged into Service */}
        <div className="pt-24 border-t border-white/10">
          <div className="mb-16">
            <h4 className="text-amber-500 font-bold tracking-widest mb-4 uppercase">Organization</h4>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tighter">브랜드의 가치를 높이고, 변화를 만들어가는 전문가들입니다.</h3>
          </div>
          <div className="grid md:grid-cols-4 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden">
            {teams.map((team, index) => (
              <motion.div
                key={team.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-black p-8 hover:bg-white/5 transition-colors group"
              >
                <team.icon className="w-12 h-12 text-amber-500 mb-6 group-hover:scale-110 transition-transform" />
                <div className="w-full h-px bg-amber-500/20 mb-6" />
                <h4 className="text-xl font-bold mb-4">{team.name}</h4>
                <p className="text-sm text-white/50 leading-relaxed">{team.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
