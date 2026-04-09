import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X, AlertTriangle, Plus, Trash2, Save, ArrowUp, ArrowDown, Image as ImageIcon, ExternalLink, Upload, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Partner, PortfolioItem, ContactMessage, SiteSettings } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, writeBatch, setDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';

// Helper to extract YouTube ID
const extractYoutubeId = (url: string) => {
  if (!url) return '';
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : url;
};

function PortfolioItemRow({ 
  item, 
  index, 
  total, 
  onUpdate, 
  onDelete, 
  onMove, 
  deleteConfirm, 
  setDeleteConfirm 
}: any) {
  const [localTitle, setLocalTitle] = useState(item.title);
  const [localVideoUrl, setLocalVideoUrl] = useState(item.videoUrl);
  const [localInfo, setLocalInfo] = useState(item.info || '');
  const [localCategory, setLocalCategory] = useState(item.category);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => { setLocalTitle(item.title); }, [item.title]);
  useEffect(() => { setLocalVideoUrl(item.videoUrl); }, [item.videoUrl]);
  useEffect(() => { setLocalInfo(item.info || ''); }, [item.info]);
  useEffect(() => { setLocalCategory(item.category); }, [item.category]);

  const handleBlur = (field: string, value: string) => {
    let finalValue = value;
    if (field === 'videoUrl') {
      finalValue = extractYoutubeId(value);
      setLocalVideoUrl(finalValue);
    }
    if (item[field as keyof PortfolioItem] !== finalValue) {
      onUpdate(item.id, { [field]: finalValue });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    // Limit to 800KB to stay well within Firestore's 1MB limit
    if (file.size > 800 * 1024) {
      setUploadError('파일 용량이 너무 큽니다 (800KB 이하).');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        await onUpdate(item.id, { thumbnail: base64 });
        setIsUploading(false);
      } catch (err: any) {
        console.error('Update error:', err);
        // Try to parse the error message if it's JSON (from handleFirestoreError)
        let errorMessage = '저장 중 오류가 발생했습니다.';
        try {
          const parsed = JSON.parse(err.message);
          errorMessage = `저장 실패: ${parsed.error}`;
        } catch (e) {
          errorMessage = `저장 실패: ${err.message || '알 수 없는 오류'}`;
        }
        setUploadError(errorMessage);
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setUploadError('파일 읽기 오류');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-6 group">
      <div className="flex flex-col space-y-1">
        <button 
          onClick={() => onMove(index, 'up')}
          disabled={index === 0}
          className="text-white/20 hover:text-amber-500 disabled:opacity-0 transition-colors"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onMove(index, 'down')}
          disabled={index === total - 1}
          className="text-white/20 hover:text-amber-500 disabled:opacity-0 transition-colors"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>

      <div className="relative w-32 aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-white/5 group/thumb">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : localVideoUrl && localVideoUrl !== 'placeholder' ? (
          <img src={`https://img.youtube.com/vi/${localVideoUrl}/hqdefault.jpg`} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-6 h-6 text-white/10" />
        )}
        
        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
          ) : (
            <>
              <Upload className="w-6 h-6 text-white mb-1" />
              <span className="text-[10px] text-white font-bold">썸네일 업로드</span>
            </>
          )}
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
        </label>

        {uploadError && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-[8px] py-0.5 px-1 text-center truncate">
            {uploadError}
          </div>
        )}
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3">
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={(e) => handleBlur('title', e.target.value)}
          placeholder="영상 제목"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
        />
        <input
          type="text"
          value={localVideoUrl}
          onChange={(e) => setLocalVideoUrl(e.target.value)}
          onBlur={(e) => handleBlur('videoUrl', e.target.value)}
          placeholder="유튜브 URL 또는 ID"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
        />
        <input
          type="text"
          value={localInfo}
          onChange={(e) => setLocalInfo(e.target.value)}
          onBlur={(e) => handleBlur('info', e.target.value)}
          placeholder="상세 정보 (클라이언트, 설명 등)"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 col-span-2"
        />
        <input
          type="text"
          value={localCategory}
          onChange={(e) => setLocalCategory(e.target.value)}
          onBlur={(e) => handleBlur('category', e.target.value)}
          placeholder="카테고리"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 col-span-2"
        />
      </div>

      <div className="flex items-center space-x-2">
        {deleteConfirm?.id === item.id ? (
          <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1">
            <span className="text-[10px] text-red-500 font-bold">삭제?</span>
            <button 
              onClick={() => onDelete(item.id)}
              className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-md font-bold"
            >
              네
            </button>
            <button 
              onClick={() => setDeleteConfirm(null)}
              className="text-[10px] text-white/40"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirm({ id: item.id, type: 'portfolio' })}
            className="text-white/20 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function PartnerRow({ 
  partner, 
  index, 
  total, 
  onUpdate, 
  onDelete, 
  onMove, 
  deleteConfirm, 
  setDeleteConfirm 
}: any) {
  const [localName, setLocalName] = useState(partner.name);
  const [localLogoUrl, setLocalLogoUrl] = useState(partner.logoUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => { setLocalName(partner.name); }, [partner.name]);
  useEffect(() => { setLocalLogoUrl(partner.logoUrl); }, [partner.logoUrl]);

  const handleBlur = (field: string, value: any) => {
    if (partner[field as keyof Partner] !== value) {
      onUpdate(partner.id, { [field]: value });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('이미지 파일만 가능합니다.');
      return;
    }
    if (file.size > 500 * 1024) {
      setUploadError('500KB 이하만 가능합니다.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        await onUpdate(partner.id, { logoUrl: base64 });
        setIsUploading(false);
      } catch (err: any) {
        console.error('Update error:', err);
        let errorMessage = '저장 오류';
        try {
          const parsed = JSON.parse(err.message);
          errorMessage = `오류: ${parsed.error}`;
        } catch (e) {
          errorMessage = `오류: ${err.message || '알 수 없는 오류'}`;
        }
        setUploadError(errorMessage);
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setUploadError('파일 읽기 오류');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-6 group">
      <div className="flex flex-col space-y-1">
        <button 
          onClick={() => onMove(index, 'up')}
          disabled={index === 0}
          className="text-white/20 hover:text-amber-500 disabled:opacity-0 transition-colors"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onMove(index, 'down')}
          disabled={index === total - 1}
          className="text-white/20 hover:text-amber-500 disabled:opacity-0 transition-colors"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>

      <div className="relative w-24 h-12 bg-black rounded-lg overflow-hidden flex items-center justify-center border border-white/5 group/logo">
        <img src={localLogoUrl} alt={localName} className="max-w-full max-h-full object-contain" />
        
        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/logo:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
          {isUploading ? (
            <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
          ) : (
            <>
              <Upload className="w-4 h-4 text-white mb-0.5" />
              <span className="text-[8px] text-white font-bold text-center">로고 업로드</span>
            </>
          )}
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
        </label>

        {uploadError && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-[7px] py-0.5 px-1 text-center truncate">
            {uploadError}
          </div>
        )}
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4">
        <input
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={(e) => handleBlur('name', e.target.value)}
          placeholder="기관명"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
        />
        <input
          type="text"
          value={localLogoUrl}
          onChange={(e) => setLocalLogoUrl(e.target.value)}
          onBlur={(e) => handleBlur('logoUrl', e.target.value)}
          placeholder="로고 이미지 URL"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={partner.isFeatured}
            onChange={(e) => onUpdate(partner.id, { isFeatured: e.target.checked })}
            className="w-4 h-4 accent-amber-500"
          />
          <span className="text-xs text-white/40">Featured</span>
        </label>
        
        {deleteConfirm?.id === partner.id ? (
          <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1">
            <span className="text-[10px] text-red-500 font-bold">삭제?</span>
            <button 
              onClick={() => onDelete(partner.id)}
              className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-md font-bold"
            >
              네
            </button>
            <button 
              onClick={() => setDeleteConfirm(null)}
              className="text-[10px] text-white/40"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirm({ id: partner.id, type: 'partners' })}
            className="text-white/20 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function ContactRow({ 
  contact, 
  onDelete, 
  deleteConfirm, 
  setDeleteConfirm 
}: any) {
  const date = new Date(contact.createdAt).toLocaleString('ko-KR');

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 group">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <span className="text-lg font-bold text-white">{contact.name}</span>
            <span className="text-xs text-white/40">{date}</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-amber-500/80">
            <span>{contact.email}</span>
            <span className="text-white/20">|</span>
            <span>{contact.phone}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {deleteConfirm?.id === contact.id ? (
            <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1">
              <span className="text-[10px] text-red-500 font-bold">삭제?</span>
              <button 
                onClick={() => onDelete(contact.id)}
                className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-md font-bold"
              >
                네
              </button>
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="text-[10px] text-white/40"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm({ id: contact.id, type: 'contacts' })}
              className="text-white/20 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-black/40 rounded-xl p-4 text-sm text-white/80 whitespace-pre-wrap leading-relaxed border border-white/5">
        {contact.message}
      </div>
    </div>
  );
}

export default function AdminModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initStatus, setInitStatus] = useState<'idle' | 'confirming' | 'loading' | 'success' | 'error'>('idle');
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'partners' | 'messages' | 'settings'>('portfolio');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'portfolio' | 'partners' | 'contacts' } | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    heroVideoId: 'U46x9TtmO40',
    heroHeadline: '사람의 마음을 움직이고,\n브랜드 메세지는 선명하게!',
    heroSubcopy: '프로덕션 이사야',
    heroDescription: '공공기관·브랜드·다큐멘터리·교육 콘텐츠를\n기획부터 완성까지, 신뢰할 수 있는 파트너 프로덕션 이사야입니다.',
    siteTitle: 'PRODUCTION ISAIAH',
    metaDescription: '브랜드의 가치를 영상으로 담아내는 프로덕션 이사야입니다.',
    keywords: '영상제작, 프로덕션, 광고제작, 홍보영상',
    ogImage: '',
    favicon: '',
    accentColor: '#f59e0b',
    primaryFont: 'NanumSquareNeo'
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-admin', handleOpen);
    return () => window.removeEventListener('open-admin', handleOpen);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user && user.email === 'thechilde77@gmail.com') {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    // Listen to Partners
    const partnersQuery = query(collection(db, 'partners'), orderBy('order', 'asc'));
    const unsubscribePartners = onSnapshot(partnersQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Partner));
      setPartners(items);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'partners'));

    // Listen to Portfolio
    const portfolioQuery = query(collection(db, 'portfolio'), orderBy('order', 'asc'));
    const unsubscribePortfolio = onSnapshot(portfolioQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioItem));
      setPortfolio(items);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'portfolio'));

    // Listen to Messages
    const messagesQuery = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage));
      setMessages(items);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'contacts'));

    // Listen to Settings
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as SiteSettings);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/main'));

    return () => {
      unsubscribePartners();
      unsubscribePortfolio();
      unsubscribeMessages();
      unsubscribeSettings();
    };
  }, [isLoggedIn]);

  const initializeData = async () => {
    setIsInitializing(true);
    setInitStatus('loading');

    const batch = writeBatch(db);

    // Default Portfolio
    const defaultPortfolio = [
      { youtubeId: 'iM8_tSZ_K_I', title: '뮤지컬 루쓰! 배우 선예, 이지훈, 김다현', info: '유튜브 토크쇼 (별다방토크)', category: '유튜브 토크쇼' },
      { youtubeId: 'ULu7K1vXxVI', title: '서울약령시 한방진흥센터 한방톡톡 시리즈', info: '원인모를 근육통 TOP5 - 유튜브 채널', category: '유튜브 채널' },
      { youtubeId: 'q_F44l_6dWE', title: '한미동맹 70주년 기념 세미나 영상 스케치', info: '한미우호협회, 국제안보교류협회', category: '행사 스케치' },
      { youtubeId: '7fDTRJNBBxs', title: '장애인의 날 기념 - 2023년 따뜻한 동행', info: '동대문구 캠페인 행사 스케치', category: '캠페인' },
      { youtubeId: 'h8sJ6fkR99E', title: 'TV홍카콜라', info: '유튜브 채널 브랜딩 및 운영', category: '유튜브 채널' },
      { youtubeId: 'e6m51AbCCZc', title: '에스라통독사역원 말씀클립', info: '유튜브 채널 콘텐츠 제작', category: '유튜브 채널' },
      { youtubeId: 'NwD0hEmNU2s', title: '하용조목사 기념 홍보관 다큐멘터리', info: '온누리교회 메모리얼 필름', category: '다큐멘터리' },
      { youtubeId: 'O4TdCVa5ldw', title: '독일 도펠헤르츠 社', info: '제품 프로모션 영상', category: '프로모션' },
      { youtubeId: 'Qmnz5iqJ8Hg', title: '6.25납북희생자 기억의 날', info: '현장 스케치 영상', category: '현장 스케치' },
      { youtubeId: 'rFa0j2xQuzY', title: '국가란 무엇인가? PLI 특집시리즈1', info: '유튜브 채널 교육 콘텐츠', category: '교육 콘텐츠' },
      { youtubeId: 'sAh6CJIQqyU', title: '통큰통독 90강 프로젝트', info: '에스라통독사역원 강의 영상', category: '강의 영상' },
      { youtubeId: 'KFDxku6_2QA', title: '장군의소리', info: '유튜브 채널 브랜딩', category: '유튜브 채널' },
      { youtubeId: 'gQHhqcEjA08', title: '서초중앙시니어스', info: '서초구립중앙노인종합복지관 홍보', category: '홍보영상' },
      { youtubeId: 'mOTUSMr681c', title: '당과 함께한 26년(대선경선)', info: '정치 기획 홍보 영상', category: '기획 홍보' },
      { youtubeId: 'czbuzJ29lzI', title: '국가란 무엇인가? PLI 특집시리즈2', info: '유튜브 채널 교육 콘텐츠', category: '교육 콘텐츠' },
      { youtubeId: 'bmZ5nY5lUQU', title: '성주붉은달', info: '다큐멘터리 영화 (국회 상영작)', category: '다큐멘터리' },
      { youtubeId: 'Hb_lW7Opymo', title: '암웨이(Amway)', info: '타이포그래피 가이드 영상', category: '가이드 영상' },
    ];

    // Default Partners
    const defaultPartners = [
      '국세청', '통일부', '한국교회총연합', '서초구청', '동대문구청', 
      '서울한방진흥센터', '암웨이', '동북아역사재단', '민주평화통일자문회의', 
      '온누리교회', '대홍기획', '한미우호협회', '사단법인 양지회', 
      '연세대학교', '서울시여성단체협의회', '주식회사 예림'
    ].map((name, index) => ({
      name,
      logoUrl: `https://via.placeholder.com/200x100?text=${encodeURIComponent(name)}`,
      order: index,
      isFeatured: true
    }));

    defaultPortfolio.forEach((item, index) => {
      const ref = doc(collection(db, 'portfolio'));
      batch.set(ref, {
        title: item.title,
        category: item.category,
        thumbnail: '',
        videoUrl: item.youtubeId,
        info: item.info,
        order: index + 1,
        createdAt: Date.now()
      });
    });

    defaultPartners.forEach(item => {
      const ref = doc(collection(db, 'partners'));
      batch.set(ref, item);
    });

    try {
      await batch.commit();
      setInitStatus('success');
      setTimeout(() => setInitStatus('idle'), 3000);
    } catch (err) {
      setInitStatus('error');
      handleFirestoreError(err, OperationType.WRITE, 'batch-init');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '5882') {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (err) {
        console.error('Login failed:', err);
        setError(true);
      }
    } else {
      setError(true);
      setPassword('');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
    setPassword('');
  };

  // Partner Actions
  const addPartner = async () => {
    const newPartner = {
      name: '새 협력사',
      logoUrl: 'https://via.placeholder.com/200x100?text=Logo',
      order: partners.length,
      isFeatured: true
    };
    try {
      await addDoc(collection(db, 'partners'), newPartner);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'partners');
    }
  };

  const updatePartner = async (id: string, updates: Partial<Partner>) => {
    try {
      await updateDoc(doc(db, 'partners', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `partners/${id}`);
    }
  };

  const deletePartner = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'partners', id));
      setDeleteConfirm(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `partners/${id}`);
    }
  };

  const movePartner = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= partners.length) return;

    const batch = writeBatch(db);
    const item1 = partners[index];
    const item2 = partners[targetIndex];

    batch.update(doc(db, 'partners', item1.id), { order: targetIndex });
    batch.update(doc(db, 'partners', item2.id), { order: index });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'partners/batch');
    }
  };

  // Portfolio Actions
  const addPortfolio = async () => {
    // Find min order to put at top
    const minOrder = portfolio.length > 0 ? Math.min(...portfolio.map(p => p.order)) : 0;
    const newItem = {
      title: '새 포트폴리오',
      category: '기타',
      thumbnail: '',
      videoUrl: 'placeholder',
      info: '상세 정보를 입력하세요',
      order: minOrder - 1,
      createdAt: Date.now()
    };
    try {
      await addDoc(collection(db, 'portfolio'), newItem);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'portfolio');
    }
  };

  const updatePortfolio = async (id: string, updates: Partial<PortfolioItem>) => {
    try {
      await updateDoc(doc(db, 'portfolio', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `portfolio/${id}`);
    }
  };

  const deletePortfolio = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'portfolio', id));
      setDeleteConfirm(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `portfolio/${id}`);
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contacts', id));
      setDeleteConfirm(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `contacts/${id}`);
    }
  };

  const updateSettings = async (updates: Partial<SiteSettings>) => {
    try {
      await setDoc(doc(db, 'settings', 'main'), { ...settings, ...updates }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/main');
    }
  };

  const movePortfolio = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= portfolio.length) return;

    const batch = writeBatch(db);
    const item1 = portfolio[index];
    const item2 = portfolio[targetIndex];

    batch.update(doc(db, 'portfolio', item1.id), { order: targetIndex });
    batch.update(doc(db, 'portfolio', item2.id), { order: index });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'portfolio/batch');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-5xl bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl h-[85vh] flex flex-col"
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {!isLoggedIn ? (
          <div className="space-y-8 max-w-md mx-auto w-full py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-white">Admin Login</h3>
              <p className="text-white/40 text-sm mt-2">관리자 비밀번호를 입력하고 Google로 로그인하세요.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={cn(
                    "w-full bg-white/5 border rounded-xl px-6 py-4 text-white focus:outline-none transition-all",
                    error ? "border-red-500 animate-shake" : "border-white/10 focus:border-amber-500"
                  )}
                  autoFocus
                />
                {error && (
                  <p className="text-red-500 text-xs mt-2 ml-2">비밀번호가 틀렸거나 권한이 없습니다.</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-4 rounded-xl transition-colors tracking-widest flex items-center justify-center space-x-2"
              >
                <span>GOOGLE LOGIN</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-white/10 mb-8">
              <div className="flex items-center space-x-8">
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={cn(
                    "pb-4 text-sm font-bold tracking-widest transition-colors relative",
                    activeTab === 'portfolio' ? "text-amber-500" : "text-white/40 hover:text-white"
                  )}
                >
                  PORTFOLIO
                  {activeTab === 'portfolio' && (
                    <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('partners')}
                  className={cn(
                    "pb-4 text-sm font-bold tracking-widest transition-colors relative",
                    activeTab === 'partners' ? "text-amber-500" : "text-white/40 hover:text-white"
                  )}
                >
                  PARTNERS
                  {activeTab === 'partners' && (
                    <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className={cn(
                    "pb-4 text-sm font-bold tracking-widest transition-colors relative",
                    activeTab === 'messages' ? "text-amber-500" : "text-white/40 hover:text-white"
                  )}
                >
                  MESSAGES
                  {activeTab === 'messages' && (
                    <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={cn(
                    "pb-4 text-sm font-bold tracking-widest transition-colors relative",
                    activeTab === 'settings' ? "text-amber-500" : "text-white/40 hover:text-white"
                  )}
                >
                  SETTINGS
                  {activeTab === 'settings' && (
                    <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                  )}
                </button>
              </div>
              <div className="flex items-center space-x-4 pb-4">
                {(portfolio.length === 0 || partners.length === 0) && (
                  <div className="flex items-center space-x-2">
                    {initStatus === 'idle' ? (
                      <button
                        onClick={() => setInitStatus('confirming')}
                        className="text-xs bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-3 py-1 rounded-full border border-white/10 transition-all flex items-center space-x-1"
                      >
                        <Save className="w-3 h-3" />
                        <span>기본 데이터 채우기</span>
                      </button>
                    ) : initStatus === 'confirming' ? (
                      <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
                        <span className="text-[10px] text-amber-500 font-bold">정말 채우시겠습니까?</span>
                        <button 
                          onClick={initializeData}
                          className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold hover:bg-amber-600 transition-colors"
                        >
                          네
                        </button>
                        <button 
                          onClick={() => setInitStatus('idle')}
                          className="text-[10px] text-white/40 hover:text-white font-bold"
                        >
                          취소
                        </button>
                      </div>
                    ) : initStatus === 'loading' ? (
                      <div className="flex items-center space-x-2 text-white/40 animate-pulse">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
                        <span className="text-xs">데이터 생성 중...</span>
                      </div>
                    ) : initStatus === 'success' ? (
                      <div className="flex items-center space-x-1 text-green-500">
                        <Save className="w-3 h-3" />
                        <span className="text-xs font-bold">생성 완료!</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setInitStatus('idle')}
                        className="text-xs text-red-500 hover:underline"
                      >
                        오류 발생 (다시 시도)
                      </button>
                    )}
                  </div>
                )}
                <span className="text-xs text-white/40">{user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar min-h-0">
              {activeTab === 'portfolio' ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white">Portfolio Manager</h3>
                      <p className="text-white/40 text-sm mt-1">포트폴리오 영상을 관리합니다.</p>
                    </div>
                    <button
                      onClick={addPortfolio}
                      className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>추가하기</span>
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {portfolio.map((item, index) => (
                      <PortfolioItemRow
                        key={item.id}
                        item={item}
                        index={index}
                        total={portfolio.length}
                        onUpdate={updatePortfolio}
                        onDelete={deletePortfolio}
                        onMove={movePortfolio}
                        deleteConfirm={deleteConfirm}
                        setDeleteConfirm={setDeleteConfirm}
                      />
                    ))}
                  </div>
                </div>
              ) : activeTab === 'partners' ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white">Partner Logo Manager</h3>
                      <p className="text-white/40 text-sm mt-1">협력기관 로고를 관리합니다.</p>
                    </div>
                    <button
                      onClick={addPartner}
                      className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>추가하기</span>
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {partners.map((partner, index) => (
                      <PartnerRow
                        key={partner.id}
                        partner={partner}
                        index={index}
                        total={partners.length}
                        onUpdate={updatePartner}
                        onDelete={deletePartner}
                        onMove={movePartner}
                        deleteConfirm={deleteConfirm}
                        setDeleteConfirm={setDeleteConfirm}
                      />
                    ))}
                  </div>
                </div>
              ) : activeTab === 'messages' ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Inquiry Messages</h3>
                    <p className="text-white/40 text-sm mt-1">고객들이 남긴 문의 내역입니다.</p>
                  </div>

                  <div className="grid gap-6">
                    {messages.length === 0 ? (
                      <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl">
                        <p className="text-white/20">아직 접수된 문의가 없습니다.</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <ContactRow
                          key={msg.id}
                          contact={msg}
                          onDelete={deleteMessage}
                          deleteConfirm={deleteConfirm}
                          setDeleteConfirm={setDeleteConfirm}
                        />
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-12">
                  <section className="space-y-6">
                    <h4 className="text-amber-500 font-bold tracking-widest text-xs uppercase">메인페이지 콘텐츠 관리</h4>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">메인 영상 (YouTube ID)</label>
                        <input
                          type="text"
                          value={settings.heroVideoId}
                          onChange={(e) => updateSettings({ heroVideoId: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">메인 헤드라인</label>
                        <textarea
                          value={settings.heroHeadline}
                          onChange={(e) => updateSettings({ heroHeadline: e.target.value })}
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">서브카피</label>
                        <input
                          type="text"
                          value={settings.heroSubcopy}
                          onChange={(e) => updateSettings({ heroSubcopy: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">회사 소개 짧은 문구</label>
                        <textarea
                          value={settings.heroDescription}
                          onChange={(e) => updateSettings({ heroDescription: e.target.value })}
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-amber-500 font-bold tracking-widest text-xs uppercase">홈페이지 검색 노출 (SEO)</h4>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">페이지 Title</label>
                        <input
                          type="text"
                          value={settings.siteTitle}
                          onChange={(e) => updateSettings({ siteTitle: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">Meta Description</label>
                        <textarea
                          value={settings.metaDescription}
                          onChange={(e) => updateSettings({ metaDescription: e.target.value })}
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">대표 키워드 (쉼표로 구분)</label>
                        <input
                          type="text"
                          value={settings.keywords}
                          onChange={(e) => updateSettings({ keywords: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs text-white/40 font-bold uppercase">OG Image</label>
                          <div className="relative group/seo">
                            <div className="w-full aspect-video bg-black border border-white/10 rounded-xl overflow-hidden flex items-center justify-center">
                              {settings.ogImage ? (
                                <img src={settings.ogImage} alt="OG" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-8 h-8 text-white/10" />
                              )}
                              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/seo:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                                <Upload className="w-6 h-6 text-white mb-1" />
                                <span className="text-[10px] text-white font-bold">업로드</span>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*" 
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = () => updateSettings({ ogImage: reader.result as string });
                                      reader.readAsDataURL(file);
                                    }
                                  }} 
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-white/40 font-bold uppercase">Favicon</label>
                          <div className="relative group/favicon">
                            <div className="w-full aspect-square bg-black border border-white/10 rounded-xl overflow-hidden flex items-center justify-center">
                              {settings.favicon ? (
                                <img src={settings.favicon} alt="Favicon" className="w-12 h-12 object-contain" />
                              ) : (
                                <ImageIcon className="w-8 h-8 text-white/10" />
                              )}
                              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/favicon:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                                <Upload className="w-6 h-6 text-white mb-1" />
                                <span className="text-[10px] text-white font-bold">업로드</span>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*" 
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = () => updateSettings({ favicon: reader.result as string });
                                      reader.readAsDataURL(file);
                                    }
                                  }} 
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-amber-500 font-bold tracking-widest text-xs uppercase">고급 기능</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">포인트 컬러</label>
                        <div className="flex space-x-2">
                          <input
                            type="color"
                            value={settings.accentColor}
                            onChange={(e) => updateSettings({ accentColor: e.target.value })}
                            className="w-12 h-12 bg-transparent border-none cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settings.accentColor}
                            onChange={(e) => updateSettings({ accentColor: e.target.value })}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">대표 폰트</label>
                        <select
                          value={settings.primaryFont}
                          onChange={(e) => updateSettings({ primaryFont: e.target.value as any })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="NanumSquareNeo">NanumSquare Neo</option>
                          <option value="NotoSansKR">Noto Sans KR</option>
                          <option value="Pretendard">Pretendard</option>
                        </select>
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
              <p className="text-white/20 text-xs">
                {activeTab === 'portfolio' ? `${portfolio.length}개의 포트폴리오` : 
                 activeTab === 'partners' ? `${partners.length}개의 협력사` :
                 activeTab === 'messages' ? `${messages.length}개의 문의 메시지` :
                 '사이트 설정을 관리 중입니다.'}가 등록되어 있습니다.
              </p>
              <button
                onClick={handleLogout}
                className="text-white/40 hover:text-white text-sm font-bold tracking-widest transition-colors"
              >
                LOGOUT
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
