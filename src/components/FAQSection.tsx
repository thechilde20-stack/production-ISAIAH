import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "영상 제작 기간은 보통 어느 정도 소요되나요?",
      answer: "영상의 규모와 성격에 따라 다릅니다. 일반적인 홍보영상 및 브랜딩 영상의 경우 기획부터 촬영, 편집까지 약 4주~6주 소요되며, 선거 캠페인 및 전략 기획 필름 등 현장 대응이 중요한 영상은 신속한 일정 조율과 실시간 편집 시스템을 통해 하루 이내의 초단기 완성구조도 지원합니다."
    },
    {
      question: "프로덕션 이사야의 주요 전문 제작 분야는 무엇인가요?",
      answer: "공공기관 홍보영상, 기업 브랜드 필름, 다큐멘터리, 교육용 영상 콘텐츠, 그리고 고도의 긴장감과 완성도를 필요로 하는 후보자 브랜딩(선거 캠페인) 미디어 통합 솔루션을 가장 전문으로 하고 있습니다."
    },
    {
      question: "지방이나 해외 촬영도 지원하며, 비용 산정 기준은 어떻게 되나요?",
      answer: "전국 어디나 출장 촬영이 가능합니다. 영상 제작 비용은 기획 구성안의 규모, 촬영 일수, 특수 장비(드론 등) 및 크루 인원 수, 성우/모델 기용 등의 세부 가이드라인에 맞춰 투명하고 합리적으로 구성 및 최적화하여 제안해 드립니다."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-black border-t border-white/5 text-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h4 className="text-amber-500 font-bold tracking-widest mb-4 uppercase text-sm">FAQ</h4>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter leading-tight">
            자주 묻는 질문 (FAQ)
          </h2>
          <p className="text-white/60 text-sm mt-4 max-w-lg mx-auto leading-relaxed">
            프로덕션 이사야의 영상 기획 및 공정, 일정과 지원 사항에 관해 자주 물으시는 질문들을 안내해 드립니다.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-colors duration-300 hover:border-amber-500/20"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none transition-colors"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start space-x-4">
                    <HelpCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="font-bold text-base md:text-lg tracking-tight select-none text-white hover:text-amber-500 transition-colors">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-white/40 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-amber-500' : ''
                    }`} 
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-8 md:px-8 md:pb-8 pt-0 border-t border-white/5">
                        <p className="text-white/70 text-sm md:text-base leading-relaxed pl-9 break-keep">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
