import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Phone, Mail } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/firebase';

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    agree: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const path = 'contacts';
    try {
      // 1. Save to Firestore as backup
      await addDoc(collection(db, path), {
        ...formData,
        createdAt: Date.now(),
        isRead: false,
      });

      // 2. Send email via backend API
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('문의가 성공적으로 전송되었습니다.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: '',
          agree: false,
        });
      } else {
        throw new Error('Email sending failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <h4 className="text-amber-500 font-bold tracking-widest mb-4 uppercase">Get in touch with us</h4>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter leading-tight mb-6">
              FOR MORE INFORMATION,<br />
              PLEASE CONTACT US
            </h2>
            <p className="text-white/60 leading-relaxed mb-12">
              궁금한 점이나 제작 문의를 편하게 보내주세요!
            </p>

            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <MapPin className="w-6 h-6 text-amber-500 mt-1" />
                <div>
                  <h5 className="font-bold text-amber-500/60 text-xs uppercase tracking-widest mb-1">Address</h5>
                  <p className="text-sm text-white/80">서울시 서초구 방배동 488-4 방배 리더스빌 206</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Phone className="w-6 h-6 text-amber-500 mt-1" />
                <div>
                  <h5 className="font-bold text-amber-500/60 text-xs uppercase tracking-widest mb-1">Phone</h5>
                  <p className="text-sm text-white/80">02.597.0232</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Mail className="w-6 h-6 text-amber-500 mt-1" />
                <div>
                  <h5 className="font-bold text-amber-500/60 text-xs uppercase tracking-widest mb-1">Email</h5>
                  <p className="text-sm text-white/80">zootv.kr@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="이름"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-6 py-4 focus:outline-none focus:border-amber-500 transition-colors"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="이메일"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-6 py-4 focus:outline-none focus:border-amber-500 transition-colors"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <input
                type="tel"
                placeholder="전화번호"
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-6 py-4 focus:outline-none focus:border-amber-500 transition-colors"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <textarea
                placeholder="내용"
                required
                rows={6}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-6 py-4 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="agree"
                  required
                  className="w-4 h-4 accent-amber-500"
                  checked={formData.agree}
                  onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                />
                <label htmlFor="agree" className="text-sm text-white/40">
                  개인정보수집에 동의합니다
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-lg transition-colors tracking-widest"
              >
                {isSubmitting ? 'SENDING...' : 'SUBMIT'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-24 h-[450px] rounded-3xl overflow-hidden border border-white/10">
          <iframe
            src="https://www.google.com/maps/embed/v1/place?key=AIzaSyDxlkP0tf6ujxPeGWFWfsKF2DiLyk2rBU4&q=place_id:ChIJf5_HVFWhfDURGbkXBIcIdwg"
            width="100%"
            height="100%"
            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
