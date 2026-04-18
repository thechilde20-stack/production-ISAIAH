import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Partner } from '../types';
import { db, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

const INITIAL_PARTNERS: Partner[] = [
  '국세청', '통일부', '한국교회총연합', '서초구청', '동대문구청', 
  '서울한방진흥센터', '암웨이', '동북아역사재단', '민주평화통일자문회의', 
  '온누리교회', '대홍기획', '한미우호협회', '사단법인 양지회', 
  '연세대학교', '서울시여성단체협의회', '주식회사 예림'
].map((name, index) => ({
  id: `initial-${index}`,
  name,
  logoUrl: `https://placehold.co/200x100/000000/FFFFFF/png?text=${encodeURIComponent(name)}`,
  order: index,
  isFeatured: true
}));

interface PartnersSectionProps {
  initialData: Partner[];
  isLoaded: boolean;
}

export default function PartnersSection({ initialData, isLoaded }: PartnersSectionProps) {
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    if (isLoaded) {
      if (initialData.length > 0) {
        setPartners(initialData);
      } else {
        setPartners(INITIAL_PARTNERS);
      }
    }
  }, [initialData, isLoaded]);

  const sortedPartners = partners.length > 0 ? partners : INITIAL_PARTNERS;

  return (
    <section id="partners" className="py-24 bg-black text-white border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        {/* Optional: Add a subtle gradient mask for the edges */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent z-10" />
          
          <div className="flex overflow-hidden group">
            <div className="flex gap-4 md:gap-6 whitespace-nowrap animate-marquee group-hover:pause">
              {[...sortedPartners, ...sortedPartners].map((partner, index) => (
                <motion.div
                  key={`${partner.id}-${index}`}
                  whileHover={{ y: -5 }}
                  className="flex flex-col items-center justify-center p-3 transition-all duration-500 bg-white/5 rounded-2xl border border-white/5 hover:border-amber-500/30 w-40 md:w-52 flex-shrink-0 group/partner"
                >
                  <div className="h-12 md:h-16 flex items-center justify-center">
                    {partner.logoUrl ? (
                      <img
                        src={partner.logoUrl}
                        alt={partner.name}
                        className="max-w-full max-h-full object-contain brightness-0 invert opacity-50 group-hover/partner:brightness-100 group-hover/partner:invert-0 group-hover/partner:opacity-100 transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-white/20 text-xs font-bold group-hover/partner:text-amber-500 transition-colors">
                        {partner.name}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
