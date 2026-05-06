import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-6xl md:text-8xl font-bold text-amber-500 mb-6">404</h1>
        <h2 className="text-2xl md:text-3xl font-bold mb-8">페이지를 찾을 수 없습니다</h2>
        <p className="text-white/60 mb-12 max-w-md mx-auto">
          원하시는 페이지의 주소가 잘못 입력되었거나, 
          페이지의 주소가 변경 혹은 삭제되어 요청하신 페이지를 찾을 수 없습니다.
        </p>
        <Link 
          to="/"
          className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-amber-500 text-white hover:text-black rounded-full font-bold transition-colors duration-300"
        >
          홈으로 돌아가기
        </Link>
      </motion.div>
    </div>
  );
}
