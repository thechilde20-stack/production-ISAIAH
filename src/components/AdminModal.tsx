import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X, AlertTriangle, Plus, Trash2, Save, ArrowUp, ArrowDown, Image as ImageIcon, ExternalLink, Upload, Loader2, GripVertical } from 'lucide-react';
import { cn, extractYoutubeId } from '@/src/lib/utils';
import { Partner, PortfolioItem, ContactMessage, SiteSettings } from '../types';
import { storage, db, auth, handleFirestoreError, OperationType } from '@/src/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, writeBatch, setDoc, getDocs, where } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper to extract YouTube ID
const MAIN_CATEGORIES = [
  { value: 'DIGITAL_AI', label: 'DIGITAL & AI', subItems: 'AI Solution / New Media / SNS / Tech' },
  { value: 'COMMERCIAL', label: 'COMMERCIAL', subItems: 'CF / Brand Film / Campaign / Promo' },
  { value: 'DOCUMENTARY_FILM', label: 'DOCUMENTARY & FILM', subItems: 'Documentary / Shorts / Interview / Film' },
  { value: 'EDUCATION', label: 'EDUCATION', subItems: 'Educational / Lecture / Info / Tutorial' },
];

const CAMPAIGN_TIERS = [
  { value: 'presidential-party', label: '후보 브랜딩' },
  { value: 'national-local-election', label: '선거 캠페인' },
  { value: 'planned-campaign-film', label: '전략 기획 캠페인' },
];

function PortfolioItemRow({ 
  item, 
  index, 
  total, 
  onUpdate, 
  onDelete, 
  deleteConfirm, 
  setDeleteConfirm 
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    position: 'relative' as const,
  };

  const [localTitle, setLocalTitle] = useState(item.title);
  const [localVideoUrl, setLocalVideoUrl] = useState(item.videoUrl);
  const [localInfo, setLocalInfo] = useState(item.info || item.description || '');
  const [localCategories, setLocalCategories] = useState<string[]>(item.categories || (item.category ? [item.category] : []));
  const [localThumbnail, setLocalThumbnail] = useState(item.thumbnail || '');
  const [localSection, setLocalSection] = useState(item.section || 'general');
  const [localYear, setLocalYear] = useState(item.year || '');
  const [localClient, setLocalClient] = useState(item.clientOrCandidate || '');
  const [localTags, setLocalTags] = useState<string[]>(item.tags || []);
  const [localTiers, setLocalTiers] = useState<string[]>(item.campaignTiers || (item.campaignTier ? [item.campaignTier] : []));
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => { setLocalTitle(item.title); }, [item.title]);
  useEffect(() => { setLocalVideoUrl(item.videoUrl); }, [item.videoUrl]);
  useEffect(() => { setLocalInfo(item.info || item.description || ''); }, [item.info, item.description]);
  useEffect(() => { 
    setLocalCategories(item.categories || (item.category ? [item.category] : [])); 
  }, [item.categories, item.category]);
  useEffect(() => { setLocalThumbnail(item.thumbnail || ''); }, [item.thumbnail]);
  useEffect(() => { setLocalSection(item.section || 'general'); }, [item.section]);
  useEffect(() => { setLocalYear(item.year || ''); }, [item.year]);
  useEffect(() => { setLocalClient(item.clientOrCandidate || ''); }, [item.clientOrCandidate]);
  useEffect(() => { setLocalTags(item.tags || []); }, [item.tags]);
  useEffect(() => { 
    setLocalTiers(item.campaignTiers || (item.campaignTier ? [item.campaignTier] : [])); 
  }, [item.campaignTiers, item.campaignTier]);

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
        setLocalThumbnail(base64);
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
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-6 group transition-colors",
        isDragging && "bg-amber-500/5 border-amber-500/30 ring-2 ring-amber-500/20"
      )}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white transition-colors p-2 -ml-2"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="relative w-32 aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-white/5 group/thumb">
        {localThumbnail ? (
          <img src={localThumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : localVideoUrl && localVideoUrl !== 'placeholder' ? (
          <img src={`https://img.youtube.com/vi/${localVideoUrl}/hqdefault.jpg`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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

        {localThumbnail && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLocalThumbnail('');
              onUpdate(item.id, { thumbnail: '' });
            }}
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:bg-red-600 z-20"
            title="이미지 삭제"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}

        {uploadError && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-[8px] py-0.5 px-1 text-center truncate">
            {uploadError}
          </div>
        )}
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3">
        <div className="col-span-2 flex items-center space-x-4 mb-1">
          <label className="text-[10px] text-white/40 font-bold uppercase">소속 섹션:</label>
          <div className="flex space-x-2">
            {[
              { id: 'general', label: 'GENERAL PORTFOLIO' },
              { id: 'campaign-portfolio', label: 'CAMPAIGN PORTFOLIO' }
            ].map(sec => (
              <button
                key={sec.id}
                onClick={() => {
                  setLocalSection(sec.id as any);
                  onUpdate(item.id, { section: sec.id as any });
                }}
                className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black transition-all border",
                  localSection === sec.id 
                    ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/10" 
                    : "bg-white/5 border-white/10 text-white/30 hover:text-white"
                )}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          value={localTitle || ''}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={(e) => handleBlur('title', e.target.value)}
          placeholder="영상 제목"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
        />
        <input
          type="text"
          value={localVideoUrl || ''}
          onChange={(e) => setLocalVideoUrl(e.target.value)}
          onBlur={(e) => handleBlur('videoUrl', e.target.value)}
          placeholder="URL 또는 ID"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
        />
        
        {localSection === 'campaign-portfolio' ? (
          <>
            <input
              type="text"
              value={localYear || ''}
              onChange={(e) => setLocalYear(e.target.value)}
              onBlur={(e) => handleBlur('year', e.target.value)}
              placeholder="연도 (예: 2024)"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <input
              type="text"
              value={localClient || ''}
              onChange={(e) => setLocalClient(e.target.value)}
              onBlur={(e) => handleBlur('clientOrCandidate', e.target.value)}
              placeholder="클라이언트 또는 후보자명"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <textarea
              value={localInfo || ''}
              onChange={(e) => setLocalInfo(e.target.value)}
              onBlur={(e) => handleBlur('info', e.target.value)}
              placeholder="프로젝트 상세 설명 (롤오버 시 표시)"
              rows={2}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 col-span-2 resize-none"
            />
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] text-white/40 font-bold uppercase block mb-1">카테고리 선택 (중복 가능)</label>
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_TIERS.map((tier) => (
                  <button
                    key={tier.value}
                    type="button"
                    onClick={() => {
                      const newTiers = localTiers.includes(tier.value)
                        ? localTiers.filter(t => t !== tier.value)
                        : [...localTiers, tier.value];
                      setLocalTiers(newTiers);
                      onUpdate(item.id, { campaignTiers: newTiers });
                    }}
                    className={cn(
                      "py-1.5 px-4 rounded-lg text-[10px] font-bold transition-all border",
                      localTiers.includes(tier.value) 
                        ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20" 
                        : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                    )}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <input
              type="text"
              value={localInfo || ''}
              onChange={(e) => setLocalInfo(e.target.value)}
              onBlur={(e) => handleBlur('info', e.target.value)}
              placeholder="상세 정보 (클라이언트, 설명 등)"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 col-span-2"
            />
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] text-white/40 font-bold uppercase block mb-1">카테고리 선택 (중복 가능)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {MAIN_CATEGORIES.map((cat) => (
                  <div key={cat.value} className="relative group/cat">
                    <button
                      type="button"
                      onClick={() => {
                        const newCategories = localCategories.includes(cat.value)
                          ? localCategories.filter(c => c !== cat.value)
                          : [...localCategories, cat.value];
                        setLocalCategories(newCategories);
                        onUpdate(item.id, { categories: newCategories });
                      }}
                      className={cn(
                        "w-full py-2 px-1 rounded-lg text-[9px] md:text-[10px] font-bold transition-all border whitespace-nowrap overflow-hidden text-ellipsis",
                        localCategories.includes(cat.value) 
                          ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20" 
                          : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"
                      )}
                    >
                      {cat.label}
                    </button>
                    {/* Hover Details Popover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-[#1a1a1a] border border-white/10 rounded-xl opacity-0 pointer-events-none group-hover/cat:opacity-100 transition-all duration-300 z-30 text-center shadow-2xl scale-95 group-hover/cat:scale-100">
                      <p className="text-[10px] text-amber-500 font-bold mb-1">{cat.label}</p>
                      <p className="text-[9px] text-white/60 leading-tight">{cat.subItems}</p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#1a1a1a]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
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
  deleteConfirm, 
  setDeleteConfirm 
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: partner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    position: 'relative' as const,
  };

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
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-6 group transition-colors",
        isDragging && "bg-amber-500/5 border-amber-500/30 ring-2 ring-amber-500/20"
      )}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white transition-colors p-2 -ml-2"
      >
        <GripVertical className="w-5 h-5" />
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

        {localLogoUrl && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLocalLogoUrl('');
              onUpdate(partner.id, { logoUrl: '' });
            }}
            className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-sm opacity-0 group-hover/logo:opacity-100 transition-opacity hover:bg-red-600 z-20"
            title="이미지 삭제"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        )}

        {uploadError && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-[7px] py-0.5 px-1 text-center truncate">
            {uploadError}
          </div>
        )}
      </div>

      <div className="flex-1">
        <input
          type="text"
          value={localName || ''}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={(e) => handleBlur('name', e.target.value)}
          placeholder="기관명"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!partner.isFeatured}
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
  onRead,
  deleteConfirm, 
  setDeleteConfirm 
}: any) {
  const date = new Date(contact.createdAt).toLocaleString('ko-KR');

  return (
    <div 
      onClick={() => !contact.isRead && onRead(contact.id)}
      className={cn(
        "bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 group transition-all relative overflow-hidden",
        !contact.isRead && "bg-amber-500/5 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)] cursor-pointer hover:bg-amber-500/10"
      )}
    >
      {!contact.isRead && (
        <div className="absolute top-0 right-0 p-1">
          <div className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
            NEW
          </div>
        </div>
      )}

      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-white">{contact.name}</span>
              {!contact.isRead && (
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              )}
            </div>
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
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(contact.id);
                }}
                className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-md font-bold"
              >
                네
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(null);
                }}
                className="text-[10px] text-white/40"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm({ id: contact.id, type: 'contacts' });
              }}
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
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initStatus, setInitStatus] = useState<'idle' | 'confirming' | 'loading' | 'success' | 'error'>('idle');
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'partners' | 'messages' | 'settings'>('portfolio');
  const [portfolioSubTab, setPortfolioSubTab] = useState<'general' | 'campaign'>('general');
  const [settingsSubTab, setSettingsSubTab] = useState<'main' | 'campaign'>('main');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'portfolio' | 'partners' | 'contacts' } | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [uploadingSettings, setUploadingSettings] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<SiteSettings>({
    heroVideoId: 'U46x9TtmO40',
    heroHeadline: '사람의 마음을 움직이고,\n브랜드 메세지는 선명하게!',
    heroSubcopy: '프로덕션 이사야',
    heroDescription: '공공기관·브랜드·다큐멘터리·교육 콘텐츠를\n기획부터 완성까지, 신뢰할 수 있는 파트너 프로덕션 이사야입니다.',
    siteTitle: '프로덕션 이사야 | PRODUCTION ISAIAH',
    metaDescription: '브랜드의 가치를 영상으로 담아내는 프로덕션 이사야입니다.',
    ogDescription: '의미 있는 영상으로 세상을 밝히는 미디어 프로덕션, 이사야입니다.',
    keywords: '영상제작, 프로덕션, 광고제작, 홍보영상',
    ogImage: '/og-image.png',
    favicon: '/favicon.png',
    accentColor: '#f59e0b',
    primaryFont: 'NanumSquareNeo',
    aboutImageUrl: 'https://picsum.photos/seed/production-studio/1200/800',
    processImageUrl: 'https://picsum.photos/seed/light-glow/1920/1080',
    campaignHeroVideoId: '0BKvOfTyLmU',
    campaignHeroImageUrl: 'https://picsum.photos/seed/campaign-hero/1920/1080?blur=4',
    campaignHeroHeadline: '선거는 초단위의 속도전,\n메시지는 영상이 될 때 힘을 가집니다.',
    campaignHeroSubcopy: 'Real-time Workflow, Cinematic Story',
    campaignHeroDescription: '기획, 촬영, 편집, 현장 대응, 라이브, 브랜딩까지\n후보와 캠프의 철학을 유권자에게 전달하는 캠페인 미디어 통합 솔루션',
    campaignPortfolioTitle: 'Portfolio Selection',
    campaignPortfolioHeadline: '입증된 결과로 말하는 캠페인 미디어 레코드',
    campaignPortfolioDescription: '단순 나열이 아닌, 체급별 분류를 통해 캠페인 수행 경험과 메시지 설계 역량을 보여줍니다.',
    campaignService1Image: 'https://picsum.photos/seed/server-infrastructure/800/600',
    campaignService2Image: 'https://picsum.photos/seed/cinematic-production/800/600',
    campaignService3Image: 'https://picsum.photos/seed/political-event/800/600',
    campaignService4Image: 'https://picsum.photos/seed/brand-identity/800/600'
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
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'thechilde77@gmail.com';
      if (user && user.email === adminEmail) {
        setIsLoggedIn(true);
        setError(null);
      } else if (user) {
        setIsLoggedIn(false);
        setError(`'${user.email}' 계정은 관리자 권한이 없습니다.`);
      } else {
        setIsLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !isOpen) return;

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
    const unsubscribeSettingsMain = onSnapshot(doc(db, 'settings', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(prev => ({ ...prev, ...snapshot.data() as SiteSettings }));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/main'));

    const unsubscribeSettingsCampaign = onSnapshot(doc(db, 'settings', 'campaign'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(prev => ({ ...prev, ...snapshot.data() as SiteSettings }));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/campaign'));

    return () => {
      unsubscribePartners();
      unsubscribePortfolio();
      unsubscribeMessages();
      unsubscribeSettingsMain();
      unsubscribeSettingsCampaign();
    };
  }, [isLoggedIn, isOpen]);

  const initializeData = async () => {
    setIsInitializing(true);
    setInitStatus('loading');

    try {
      // 기존 데이터 삭제 (중복 방지)
      const portSnapshot = await getDocs(collection(db, 'portfolio'));
      const partSnapshot = await getDocs(collection(db, 'partners'));
      
      const clearBatch = writeBatch(db);
      portSnapshot.forEach(d => clearBatch.delete(d.ref));
      partSnapshot.forEach(d => clearBatch.delete(d.ref));
      await clearBatch.commit();

      const batch = writeBatch(db);

      // Default Portfolio (Removing items that belong to Campaign)
      const defaultPortfolio = [
        { youtubeId: 'iM8_tSZ_K_I', title: '뮤지컬 루쓰! 배우 선예, 이지훈, 김다현', info: '유튜브 토크쇼 (별다방토크)', category: 'DIGITAL_AI' },
      { youtubeId: 'ULu7K1vXxVI', title: '서울약령시 한방진흥센터 한방톡톡 시리즈', info: '원인모를 근육통 TOP5 - 유튜브 채널', category: 'COMMERCIAL' },
      { youtubeId: 'q_F44l_6dWE', title: '한미동맹 70주년 기념 세미나 영상 스케치', info: '한미우호협회, 국제안보교류협회', category: 'COMMERCIAL' },
      { youtubeId: '7fDTRJNBBxs', title: '장애인의 날 기념 - 2023년 따뜻한 동행', info: '동대문구 캠페인 행사 스케치', category: 'COMMERCIAL' },
      { youtubeId: 'e6m51AbCCZc', title: '에스라통독사역원 말씀클립', info: '유튜브 채널 콘텐츠 제작', category: 'DIGITAL_AI' },
      { youtubeId: 'NwD0hEmNU2s', title: '하용조목사 기념 홍보관 다큐멘터리', info: '온누리교회 메모리얼 필름', category: 'DOCUMENTARY_FILM' },
      { youtubeId: 'O4TdCVa5ldw', title: '독일 도펠헤르츠 社', info: '제품 프로모션 영상', category: 'COMMERCIAL' },
      { youtubeId: 'Qmnz5iqJ8Hg', title: '6.25납북희생자 기억의 날', info: '현장 스케치 영상', category: 'COMMERCIAL' },
      { youtubeId: 'rFa0j2xQuzY', title: '국가란 무엇인가? PLI 특집시리즈1', info: '유튜브 채널 교육 콘텐츠', category: 'EDUCATION' },
      { youtubeId: 'sAh6CJIQqyU', title: '통큰통독 90강 프로젝트', info: '에스라통독사역원 강의 영상', category: 'EDUCATION' },
      { youtubeId: 'gQHhqcEjA08', title: '서초중앙시니어스', info: '서초구립중앙노인종합복지관 홍보', category: 'COMMERCIAL' },
      { youtubeId: 'czbuzJ29lzI', title: '국가란 무엇인가? PLI 특집시리즈2', info: '유튜브 채널 교육 콘텐츠', category: 'EDUCATION' },
      { youtubeId: 'bmZ5nY5lUQU', title: '성주붉은달', info: '다큐멘터리 영화 (국회 상영작)', category: 'DOCUMENTARY_FILM' },
      { youtubeId: 'Hb_lW7Opymo', title: '암웨이(Amway)', info: '타이포그래피 가이드 영상', category: 'DIGITAL_AI' },
    ];

    const campaignPortfolio = [
      { title: "2021 대선 경선 캠페인", clientOrCandidate: "홍준표 후보", year: "2021", description: "대선 경선 과정에서 사용된 캠페인 영상 및 메시지 콘텐츠", youtubeUrl: "https://youtu.be/mOTUSMr681c", campaignTier: "presidential-party" as const },
      { title: "TV홍카콜라 제작 및 운영", clientOrCandidate: "TV홍카콜라", year: "2018-2019", description: "유튜브 채널 제작 및 운영 프로젝트", youtubeUrl: "https://youtu.be/aFk3fou3O8M", campaignTier: "presidential-party" as const },
      { title: "2019 전진당 캠페인", clientOrCandidate: "이언주", year: "2019", description: "정당 브랜딩 및 메시지 콘텐츠", youtubeUrl: "https://youtu.be/Cxthyrst0ss", campaignTier: "presidential-party" as const },
      { title: "장군의소리 제작 및 운영", clientOrCandidate: "대한민국수호예비역장성단", year: "2019-2020", description: "정책·시사 채널 제작 및 운영", youtubeUrl: "https://www.youtube.com/watch?v=JuCCipC9y5w&t=60s", campaignTier: "presidential-party" as const },
      { title: "2024 총선 동대문구을", clientOrCandidate: "김경진 후보", year: "2024", description: "총선 후보 브랜딩 및 메시지 전달용 캠페인 영상", youtubeUrl: "https://youtu.be/nOhMqgvfyfI", campaignTier: "national-local-election" as const },
      { title: "2020 총선 인천미추홀을", clientOrCandidate: "윤상현 후보", year: "2020", description: "총선 후보 홍보 캠페인 영상", youtubeUrl: "https://youtu.be/AAm0mEKYJK4", campaignTier: "national-local-election" as const },
      { title: "2020 총선 부산남구을", clientOrCandidate: "이언주 후보", year: "2020", description: "지역 선거용 홍보 영상", youtubeUrl: "https://youtu.be/udgkdzqjW8M", campaignTier: "national-local-election" as const },
      { title: "2020 총선 대구수성을", clientOrCandidate: "홍준표 후보", year: "2020", description: "총선 후보 브랜딩 영상", youtubeUrl: "https://youtu.be/GrmEzOeHcUs", campaignTier: "national-local-election" as const },
      { title: "2022 동대문구청장 예비후보", clientOrCandidate: "이필형 후보", year: "2022", description: "지역 기반 예비후보 홍보 영상", youtubeUrl: "https://youtu.be/YapwF2e8Gc4", campaignTier: "national-local-election" as const },
      { title: "2022 국회의원 보궐선거", clientOrCandidate: "도건우 후보", year: "2022", description: "보궐선거 후보 홍보 영상", youtubeUrl: "https://youtu.be/5gV_E65ATPM", campaignTier: "national-local-election" as const },
      { title: "2018 지방선거 송파을 캠프", clientOrCandidate: "배현진 후보", year: "2018", description: "지방선거 캠프 홍보 영상", youtubeUrl: "https://youtu.be/SrHgsXXiTqc", campaignTier: "national-local-election" as const },
      { title: "2022 평택 지제세교지구 조합장선거", clientOrCandidate: "이성택 후보", year: "2022", description: "조합장 선거 홍보 영상", youtubeUrl: "https://youtu.be/kOoWQsOxRSI", campaignTier: "national-local-election" as const },
      { title: "2022 제12대 양지회장 선거", clientOrCandidate: "양지회", year: "2022", description: "단체 선거 홍보 콘텐츠", youtubeUrl: "https://youtu.be/kAqVm_unYhg", campaignTier: "national-local-election" as const },
      { title: "동대문을 걷다 시네마틱 프롤로그", clientOrCandidate: "동대문구청장 출판기념회", year: "2023", description: "출판기념회 오프닝 시네마틱 영상", youtubeUrl: "https://youtu.be/B1QYjFtsgzw?si=gNyDxsBFgttjLpgz", campaignTier: "planned-campaign-film" as const },
      { title: "세이브 코리아 국가비상기도회", clientOrCandidate: "세이브 코리아", year: "2025", description: "오프닝 및 홍보 영상", youtubeUrl: "https://youtu.be/udM0LK1x1oU?si=AlSGWXnylxfLeJaX", campaignTier: "planned-campaign-film" as const },
      { title: "거룩한 방파제 홍보영상", clientOrCandidate: "거룩한 방파제", year: "2025", description: "캠페인 홍보 영상", youtubeUrl: "https://youtu.be/WInbYy2CWxM?si=q5B7kn1OpD4uhvZx", campaignTier: "planned-campaign-film" as const },
      { title: "성평등가족부 반대국민대회", clientOrCandidate: "국민대회", year: "2025", description: "행사 홍보 및 참여 독려 영상", youtubeUrl: "https://youtu.be/jNClNV8tY4Q?si=k6B3FzqaPAdxn5Vq", campaignTier: "planned-campaign-film" as const }
    ];

    // Default Partners
    const defaultPartners = [
      '국세청', '통일부', '한국교회총연합', '서초구청', '동대문구청', 
      '서울한방진흥센터', '암웨이', '동북아역사재단', '민주평화통일자문회의', 
      '온누리교회', '대홍기획', '한미우호협회', '사단법인 양지회', 
      '연세대학교', '서울시여성단체협의회', '주식회사 예림'
    ].map((name, index) => ({
      name,
      logoUrl: `https://placehold.co/200x100/000000/FFFFFF/png?text=${encodeURIComponent(name)}`,
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
        createdAt: Date.now(),
        section: 'general'
      });
    });

    campaignPortfolio.forEach((item, index) => {
      const ref = doc(collection(db, 'portfolio'));
      batch.set(ref, {
        title: item.title,
        thumbnail: '',
        videoUrl: extractYoutubeId(item.youtubeUrl),
        year: item.year,
        clientOrCandidate: item.clientOrCandidate,
        info: item.description,
        campaignTier: (item as any).campaignTier,
        section: 'campaign-portfolio',
        order: defaultPortfolio.length + index + 1,
        createdAt: Date.now(),
        categories: []
      });
    });

    defaultPartners.forEach(item => {
      const ref = doc(collection(db, 'partners'));
      batch.set(ref, item);
    });

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

  const seedCampaignData = async () => {
    setIsInitializing(true);
    setInitStatus('loading');
    
    try {
      // 기존 캠페인 포트폴리오 항목 삭제 (중복 방지)
      const q = query(collection(db, 'portfolio'), where('section', '==', 'campaign-portfolio'));
      const snapshot = await getDocs(q);
      
      const deleteBatch = writeBatch(db);
      snapshot.forEach((doc) => {
        deleteBatch.delete(doc.ref);
      });
      await deleteBatch.commit();

      const batch = writeBatch(db);
      
      const campaignPortfolio = [
        { title: "2021 대선 경선 캠페인", clientOrCandidate: "홍준표 후보", year: "2021", description: "대선 경선 과정에서 사용된 캠페인 영상 및 메시지 콘텐츠", youtubeUrl: "https://youtu.be/mOTUSMr681c", campaignTier: "presidential-party" as const },
        { title: "TV홍카콜라 제작 및 운영", clientOrCandidate: "TV홍카콜라", year: "2018-2019", description: "유튜브 채널 제작 및 운영 프로젝트", youtubeUrl: "https://youtu.be/aFk3fou3O8M", campaignTier: "presidential-party" as const },
        { title: "2019 전진당 캠페인", clientOrCandidate: "이언주", year: "2019", description: "정당 브랜딩 및 메시지 콘텐츠", youtubeUrl: "https://youtu.be/Cxthyrst0ss", campaignTier: "presidential-party" as const },
        { title: "장군의소리 제작 및 운영", clientOrCandidate: "대한민국수호예비역장성단", year: "2019-2020", description: "정책·시사 채널 제작 및 운영", youtubeUrl: "https://www.youtube.com/watch?v=JuCCipC9y5w&t=60s", campaignTier: "presidential-party" as const },
        { title: "2024 총선 동대문구을", clientOrCandidate: "김경진 후보", year: "2024", description: "총선 후보 브랜딩 및 메시지 전달용 캠페인 영상", youtubeUrl: "https://youtu.be/nOhMqgvfyfI", campaignTier: "national-local-election" as const },
        { title: "2020 총선 인천미추홀을", clientOrCandidate: "윤상현 후보", year: "2020", description: "총선 후보 홍보 캠페인 영상", youtubeUrl: "https://youtu.be/AAm0mEKYJK4", campaignTier: "national-local-election" as const },
        { title: "2020 총선 부산남구을", clientOrCandidate: "이언주 후보", year: "2020", description: "지역 선거용 홍보 영상", youtubeUrl: "https://youtu.be/udgkdzqjW8M", campaignTier: "national-local-election" as const },
        { title: "2020 총선 대구수성을", clientOrCandidate: "홍준표 후보", year: "2020", description: "총선 후보 브랜딩 영상", youtubeUrl: "https://youtu.be/GrmEzOeHcUs", campaignTier: "national-local-election" as const },
        { title: "2022 동대문구청장 예비후보", clientOrCandidate: "이필형 후보", year: "2022", description: "지역 기반 예비후보 홍보 영상", youtubeUrl: "https://youtu.be/YapwF2e8Gc4", campaignTier: "national-local-election" as const },
        { title: "2022 국회의원 보궐선거", clientOrCandidate: "도건우 후보", year: "2022", description: "보궐선거 후보 홍보 영상", youtubeUrl: "https://youtu.be/5gV_E65ATPM", campaignTier: "national-local-election" as const },
        { title: "2018 지방선거 송파을 캠프", clientOrCandidate: "배현진 후보", year: "2018", description: "지방선거 캠프 홍보 영상", youtubeUrl: "https://youtu.be/SrHgsXXiTqc", campaignTier: "national-local-election" as const },
        { title: "2022 평택 지제세교지구 조합장선거", clientOrCandidate: "이성택 후보", year: "2022", description: "조합장 선거 홍보 영상", youtubeUrl: "https://youtu.be/kOoWQsOxRSI", campaignTier: "national-local-election" as const },
        { title: "2022 제12대 양지회장 선거", clientOrCandidate: "양지회", year: "2022", description: "단체 선거 홍보 콘텐츠", youtubeUrl: "https://youtu.be/kAqVm_unYhg", campaignTier: "national-local-election" as const },
        { title: "동대문을 걷다 시네마틱 프롤로그", clientOrCandidate: "동대문구청장 출판기념회", year: "2023", description: "출판기념회 오프닝 시네마틱 영상", youtubeUrl: "https://youtu.be/B1QYjFtsgzw?si=gNyDxsBFgttjLpgz", campaignTier: "planned-campaign-film" as const },
        { title: "세이브 코리아 국가비상기도회", clientOrCandidate: "세이브 코리아", year: "2025", description: "오프닝 및 홍보 영상", youtubeUrl: "https://youtu.be/udM0LK1x1oU?si=AlSGWXnylxfLeJaX", campaignTier: "planned-campaign-film" as const },
        { title: "거룩한 방파제 홍보영상", clientOrCandidate: "거룩한 방파제", year: "2025", description: "캠페인 홍보 영상", youtubeUrl: "https://www.youtube.com/watch?v=WInbYy2CWxM", campaignTier: "planned-campaign-film" as const },
        { title: "성평등가족부 반대국민대회", clientOrCandidate: "국민대회", year: "2025", description: "행사 홍보 및 참여 독려 영상", youtubeUrl: "https://youtu.be/jNClNV8tY4Q?si=k6B3FzqaPAdxn5Vq", campaignTier: "planned-campaign-film" as const }
      ];

      const currentMaxOrder = portfolio.length > 0 ? Math.max(...portfolio.filter(p => p.section !== 'campaign-portfolio').map(p => p.order)) : 0;

      campaignPortfolio.forEach((item, index) => {
        const ref = doc(collection(db, 'portfolio'));
        batch.set(ref, {
          title: item.title,
          thumbnail: '',
          videoUrl: extractYoutubeId(item.youtubeUrl),
          year: item.year,
          clientOrCandidate: item.clientOrCandidate,
          info: item.description,
          campaignTier: (item as any).campaignTier,
          section: 'campaign-portfolio',
          order: currentMaxOrder + index + 1,
          createdAt: Date.now(),
          categories: []
        });
      });

      await batch.commit();
      setInitStatus('success');
      setTimeout(() => setInitStatus('idle'), 3000);
      localStorage.removeItem('isaiah_site_data');
    } catch (err) {
      setInitStatus('error');
      handleFirestoreError(err, OperationType.WRITE, 'seed-campaign');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = (import.meta.env.VITE_ADMIN_PASSWORD || '5882').trim();
    const enteredPassword = password.trim();
    
    if (enteredPassword !== adminPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setPassword('');
      return;
    }

    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      // AI Studio iframe 환경에서는 팝업이 차단될 수 있으므로 에러 핸들링 강화
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Login failed:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('현재 도메인이 Firebase 승인된 도메인에 등록되지 않았습니다. Firebase 콘솔에서 현재 URL을 추가해주세요.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용하거나 주소창의 팝업 차단 해제를 클릭해주세요.');
      } else {
        setError('로그인 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
      }
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
      logoUrl: 'https://placehold.co/200x100/000000/FFFFFF/png?text=Logo',
      order: partners.length,
      isFeatured: true
    };
    try {
      await addDoc(collection(db, 'partners'), newPartner);
      localStorage.removeItem('isaiah_site_data');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'partners');
    }
  };

  const updatePartner = async (id: string, updates: Partial<Partner>) => {
    try {
      await updateDoc(doc(db, 'partners', id), updates);
      localStorage.removeItem('isaiah_site_data');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `partners/${id}`);
    }
  };

  const deletePartner = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'partners', id));
      setDeleteConfirm(null);
      localStorage.removeItem('isaiah_site_data');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `partners/${id}`);
    }
  };

  // Portfolio Actions
  const addPortfolio = async (isCampaign = false) => {
    // Find min order to put at top
    const minOrder = portfolio.length > 0 ? Math.min(...portfolio.map(p => p.order)) : 0;
    const newItem = {
      title: isCampaign ? '새 캠페인 영상' : '새 포트폴리오',
      categories: isCampaign ? [] : ['COMMERCIAL'],
      thumbnail: '',
      videoUrl: 'placeholder',
      info: isCampaign ? '캠페인 상세 설명을 입력하세요' : '상세 정보를 입력하세요',
      order: minOrder - 1,
      createdAt: Date.now(),
      section: isCampaign ? 'campaign-portfolio' : 'general',
      year: isCampaign ? new Date().getFullYear().toString() : '',
      clientOrCandidate: '',
      tags: isCampaign ? ['선거'] : [],
      campaignTiers: isCampaign ? ['presidential-party'] : []
    };
    try {
      await addDoc(collection(db, 'portfolio'), newItem);
      localStorage.removeItem('isaiah_site_data');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'portfolio');
    }
  };

  const updatePortfolio = async (id: string, updates: Partial<PortfolioItem>) => {
    try {
      await updateDoc(doc(db, 'portfolio', id), updates);
      localStorage.removeItem('isaiah_site_data');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `portfolio/${id}`);
    }
  };

  const deletePortfolio = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'portfolio', id));
      setDeleteConfirm(null);
      localStorage.removeItem('isaiah_site_data');
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

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'contacts', id), { isRead: true });
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const updateSettings = async (updates: Partial<SiteSettings>) => {
    try {
      // Clear cache locally first
      localStorage.removeItem('isaiah_site_data');
      
      // Determine which document to update
      const campaignKeys = [
        'campaignHeroVideoId', 'campaignHeroImageUrl', 'campaignHeroHeadline', 
        'campaignHeroSubcopy', 'campaignHeroDescription', 'campaignPortfolioTitle', 
        'campaignPortfolioHeadline', 'campaignPortfolioDescription', 
        'campaignService1Image', 'campaignService2Image', 'campaignService3Image', 'campaignService4Image'
      ];
      
      const containsCampaignKey = Object.keys(updates).some(key => campaignKeys.includes(key));
      const docId = containsCampaignKey ? 'campaign' : 'main';
      
      const settingsRef = doc(db, 'settings', docId);
      
      // Update local state first for instant feedback
      setSettings(prev => ({ ...prev, ...updates }));
      
      await updateDoc(settingsRef, updates);
    } catch (err) {
      console.error('updateSettings error:', err);
      // Fallback to setDoc if updateDoc fails (e.g., document doesn't exist)
      try {
        const docId = Object.keys(updates).some(key => [
          'campaignHeroVideoId', 'campaignHeroImageUrl', 'campaignHeroHeadline', 
          'campaignHeroSubcopy', 'campaignHeroDescription', 'campaignPortfolioTitle', 
          'campaignPortfolioHeadline', 'campaignPortfolioDescription', 
          'campaignService1Image', 'campaignService2Image', 'campaignService3Image', 'campaignService4Image'
        ].includes(key)) ? 'campaign' : 'main';
        
        const settingsRef = doc(db, 'settings', docId);
        await setDoc(settingsRef, updates, { merge: true });
      } catch (innerErr) {
        handleFirestoreError(innerErr, OperationType.UPDATE, 'settings/update');
      }
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200; // 가로 최대 1200px로 제한
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('Canvas context failed');
          
          ctx.drawImage(img, 0, 0, width, height);
          // 용량을 줄이기 위해 jpeg 0.7 품질로 압축
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const uploadSettingImage = async (key: string, file: File) => {
    setUploadingSettings(prev => ({ ...prev, [key]: true }));
    try {
      console.log(`[Upload] Processing ${key}...`);
      
      // 1. 이미지 압축 및 리사이징 (파일 크기 및 차원 최적화)
      const compressedBase64 = await compressImage(file);
      console.log(`[Upload] Image compressed. Size: ${(compressedBase64.length / 1024).toFixed(1)}KB`);

      // 2. 비동기 시도 로직 (Storage와 Firestore 병렬 검토)
      const attemptStorage = async () => {
        const filePath = `settings/${key}_${Date.now()}`;
        const storageRef = ref(storage, filePath);
        
        // CORS 오류로 인해 무한 대기하는 것을 방지하기 위해 타임아웃 적용 (5초)
        const uploadPromise = uploadBytes(storageRef, file);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Storage Timeout')), 5000)
        );

        return Promise.race([uploadPromise, timeoutPromise]) as Promise<any>;
      };

      try {
        console.log(`[Storage] Attempting Storage upload with 5s timeout...`);
        await attemptStorage();
        const filePath = `settings/${key}_${Date.now()}`; // 위에서 생성한 것과 동일한 규칙
        const storageRef = ref(storage, filePath);
        const url = await getDownloadURL(storageRef);
        
        console.log('[Storage] Success:', url);
        await updateSettings({ [key]: url });
      } catch (err: any) {
        // [CORS 차단 또는 타임아웃 발생 시] 즉시 Firestore 직접 저장으로 전환
        console.error('[Storage] Failed or Timed out. Error:', err.message);
        console.log('[Firestore] Switching to direct DB storage (Bypass CORS)');
        
        // Firestore에 직접 Base64 데이터 저장 (압축되었으므로 안전함)
        await updateSettings({ [key]: compressedBase64 });
        console.log('[Firestore] Direct storage successful');
      }
      
    } catch (err: any) {
      console.error('[Upload] Fatal Error:', err);
      alert('업로드 중 예상치 못한 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setUploadingSettings(prev => ({ ...prev, [key]: false }));
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEndPortfolio = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = portfolio.findIndex((item) => item.id === active.id);
    const newIndex = portfolio.findIndex((item) => item.id === over.id);

    const newPortfolio = arrayMove(portfolio, oldIndex, newIndex);
    
    // Optimistic update
    setPortfolio(newPortfolio);

    // Update orders in Firestore
    const batch = writeBatch(db);
    newPortfolio.forEach((item, idx) => {
      // Re-assign order based on array position
      if (item.order !== idx) {
        batch.update(doc(db, 'portfolio', item.id), { order: idx });
      }
    });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'portfolio/reorder');
    }
  };

  const handleDragEndPartners = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = partners.findIndex((item) => item.id === active.id);
    const newIndex = partners.findIndex((item) => item.id === over.id);

    const newPartners = arrayMove(partners, oldIndex, newIndex);
    
    // Optimistic update
    setPartners(newPartners);

    // Update orders in Firestore
    const batch = writeBatch(db);
    newPartners.forEach((item, idx) => {
      if (item.order !== idx) {
        batch.update(doc(db, 'partners', item.id), { order: idx });
      }
    });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'partners/reorder');
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
                  value={password || ''}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={cn(
                    "w-full bg-white/5 border rounded-xl px-6 py-4 text-white focus:outline-none transition-all",
                    error ? "border-red-500 animate-shake" : "border-white/10 focus:border-amber-500"
                  )}
                  autoFocus
                />
                {error && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-500 text-xs leading-relaxed">{error}</p>
                    {error.includes('도메인') && (
                      <p className="text-white/40 text-[10px] mt-2 break-all">
                        추가할 도메인: {window.location.hostname}
                      </p>
                    )}
                  </div>
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
                    "pb-4 text-sm font-bold tracking-widest transition-colors relative flex items-center space-x-2",
                    activeTab === 'messages' ? "text-amber-500" : "text-white/40 hover:text-white"
                  )}
                >
                  <span>MESSAGES</span>
                  {messages.filter(m => !m.isRead).length > 0 && (
                    <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-amber-500 text-black text-[10px] font-black rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                      {messages.filter(m => !m.isRead).length}
                    </span>
                  )}
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
                      <div className="flex items-center space-x-4 mt-2">
                        <button
                          onClick={() => setPortfolioSubTab('general')}
                          className={cn(
                            "text-sm font-bold pb-2 transition-colors relative",
                            portfolioSubTab === 'general' ? "text-amber-500" : "text-white/40 hover:text-white"
                          )}
                        >
                          일반 포트폴리오
                          {portfolioSubTab === 'general' && (
                            <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                          )}
                        </button>
                        <button
                          onClick={() => setPortfolioSubTab('campaign')}
                          className={cn(
                            "text-sm font-bold pb-2 transition-colors relative",
                            portfolioSubTab === 'campaign' ? "text-amber-500" : "text-white/40 hover:text-white"
                          )}
                        >
                          캠페인 포트폴리오
                          {portfolioSubTab === 'campaign' && (
                            <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {portfolioSubTab === 'campaign' && (
                        <button
                          onClick={seedCampaignData}
                          className="flex items-center space-x-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 px-4 py-2 rounded-lg font-bold text-sm border border-blue-500/20 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          <span>캠페인 데이터 채우기</span>
                        </button>
                      )}
                      <button
                        onClick={() => addPortfolio(portfolioSubTab === 'campaign')}
                        className={cn(
                          "flex items-center space-x-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors",
                          portfolioSubTab === 'campaign' 
                            ? "bg-amber-500 hover:bg-amber-600 text-black" 
                            : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10"
                        )}
                      >
                        <Plus className="w-4 h-4" />
                        <span>{portfolioSubTab === 'campaign' ? '캠페인 추가' : '일반 추가'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEndPortfolio}
                    >
                      <SortableContext
                        items={portfolio
                          .filter(item => portfolioSubTab === 'campaign' 
                            ? item.section === 'campaign-portfolio' 
                            : (item.section === 'general' || !item.section))
                          .map(i => i.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {portfolio
                          .filter(item => portfolioSubTab === 'campaign' 
                            ? item.section === 'campaign-portfolio' 
                            : (item.section === 'general' || !item.section))
                          .map((item, index, filteredArr) => (
                            <PortfolioItemRow
                              key={item.id}
                              item={item}
                              index={index}
                              total={filteredArr.length}
                              onUpdate={updatePortfolio}
                              onDelete={deletePortfolio}
                              deleteConfirm={deleteConfirm}
                              setDeleteConfirm={setDeleteConfirm}
                            />
                          ))}
                      </SortableContext>
                    </DndContext>
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
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEndPartners}
                    >
                      <SortableContext
                        items={partners.map(i => i.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {partners.map((partner, index) => (
                          <PartnerRow
                            key={partner.id}
                            partner={partner}
                            index={index}
                            total={partners.length}
                            onUpdate={updatePartner}
                            onDelete={deletePartner}
                            deleteConfirm={deleteConfirm}
                            setDeleteConfirm={setDeleteConfirm}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
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
                          onRead={markAsRead}
                          deleteConfirm={deleteConfirm}
                          setDeleteConfirm={setDeleteConfirm}
                        />
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-12 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                  {/* Settings Sub-Tabs */}
                  <div className="flex space-x-4 mb-8">
                    {[
                      { id: 'main', label: '메인 사이트 설정' },
                      { id: 'campaign', label: '캠페인 페이지 설정' }
                    ].map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setSettingsSubTab(sub.id as any)}
                        className={cn(
                          "px-6 py-2 rounded-full text-xs font-bold tracking-widest transition-all",
                          settingsSubTab === sub.id 
                            ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" 
                            : "bg-white/5 text-white/40 hover:text-white"
                        )}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>

                  {settingsSubTab === 'main' ? (
                    <div className="space-y-12">
                      <section className="space-y-6">
                        <h4 className="text-amber-500 font-bold tracking-widest text-xs uppercase">메인페이지 콘텐츠 관리</h4>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">메인 영상 (YouTube ID)</label>
                        <input
                          type="text"
                          value={settings.heroVideoId || ''}
                          onChange={(e) => updateSettings({ heroVideoId: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">메인 헤드라인</label>
                        <textarea
                          value={settings.heroHeadline || ''}
                          onChange={(e) => updateSettings({ heroHeadline: e.target.value })}
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">서브카피</label>
                        <input
                          type="text"
                          value={settings.heroSubcopy || ''}
                          onChange={(e) => updateSettings({ heroSubcopy: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">회사 소개 짧은 문구</label>
                        <textarea
                          value={settings.heroDescription || ''}
                          onChange={(e) => updateSettings({ heroDescription: e.target.value })}
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-amber-500 font-bold tracking-widest text-xs uppercase">섹션별 이미지 관리</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center justify-between">
                          <span className="text-xs text-white/40 font-bold uppercase">ABOUT 섹션 이미지</span>
                          <span className="text-[10px] text-white/20 font-medium">권장: 800x1200px (세로형) / 최대 1MB</span>
                        </label>
                        <div className="relative group/about-img">
                          <div className="w-full aspect-video bg-black border border-white/10 rounded-xl overflow-hidden flex items-center justify-center">
                            {uploadingSettings['aboutImageUrl'] ? (
                              <div className="flex flex-col items-center space-y-2">
                                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                                <span className="text-[10px] text-white/40 tracking-widest font-bold">UPLOADING...</span>
                              </div>
                            ) : settings.aboutImageUrl ? (
                              <img src={settings.aboutImageUrl} alt="About" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-white/10" />
                            )}
                            <label className={cn(
                              "absolute inset-0 bg-black/60 transition-opacity flex flex-col items-center justify-center cursor-pointer",
                              uploadingSettings['aboutImageUrl'] ? "opacity-100 pointer-events-none" : "opacity-0 group-hover/about-img:opacity-100"
                            )}>
                              <Upload className="w-6 h-6 text-white mb-1" />
                              <span className="text-[10px] text-white font-bold">업로드</span>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadSettingImage('aboutImageUrl', file);
                                }} 
                                disabled={uploadingSettings['aboutImageUrl']}
                              />
                            </label>
                            {settings.aboutImageUrl && (
                              <button
                                onClick={() => updateSettings({ aboutImageUrl: '' })}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover/about-img:opacity-100 transition-opacity hover:bg-red-600 z-20"
                                title="이미지 삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center justify-between">
                          <span className="text-xs text-white/40 font-bold uppercase">PROCESS 섹션 이미지</span>
                          <span className="text-[10px] text-white/20 font-medium">권장: 1920x1080px (가로형) / 최대 1MB</span>
                        </label>
                        <div className="relative group/process-img">
                          <div className="w-full aspect-video bg-black border border-white/10 rounded-xl overflow-hidden flex items-center justify-center">
                            {uploadingSettings['processImageUrl'] ? (
                              <div className="flex flex-col items-center space-y-2">
                                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                                <span className="text-[10px] text-white/40 tracking-widest font-bold">UPLOADING...</span>
                              </div>
                            ) : settings.processImageUrl ? (
                              <img src={settings.processImageUrl} alt="Process" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-white/10" />
                            )}
                            <label className={cn(
                              "absolute inset-0 bg-black/60 transition-opacity flex flex-col items-center justify-center cursor-pointer",
                              uploadingSettings['processImageUrl'] ? "opacity-100 pointer-events-none" : "opacity-0 group-hover/process-img:opacity-100"
                            )}>
                              <Upload className="w-6 h-6 text-white mb-1" />
                              <span className="text-[10px] text-white font-bold">업로드</span>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadSettingImage('processImageUrl', file);
                                }} 
                                disabled={uploadingSettings['processImageUrl']}
                              />
                            </label>
                            {settings.processImageUrl && (
                              <button
                                onClick={() => updateSettings({ processImageUrl: '' })}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover/process-img:opacity-100 transition-opacity hover:bg-red-600 z-20"
                                title="이미지 삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
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
                          value={settings.siteTitle || ''}
                          onChange={(e) => updateSettings({ siteTitle: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">Meta Description</label>
                        <textarea
                          value={settings.metaDescription || ''}
                          onChange={(e) => updateSettings({ metaDescription: e.target.value })}
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">OpenGraph Description</label>
                        <textarea
                          value={settings.ogDescription || ''}
                          onChange={(e) => updateSettings({ ogDescription: e.target.value })}
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">대표 키워드 (쉼표로 구분)</label>
                        <input
                          type="text"
                          value={settings.keywords || ''}
                          onChange={(e) => updateSettings({ keywords: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="flex items-center justify-between">
                            <span className="text-xs text-white/40 font-bold uppercase">OG Image</span>
                            <span className="text-[10px] text-white/20 font-medium">1200x630px / 800KB</span>
                          </label>
                          <div className="relative group/seo">
                            <div className="w-full aspect-video bg-black border border-white/10 rounded-xl overflow-hidden flex items-center justify-center">
                              {uploadingSettings['ogImage'] ? (
                                <div className="flex flex-col items-center space-y-2">
                                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                                  <span className="text-[10px] text-white/40 tracking-widest font-bold">UPLOADING...</span>
                                </div>
                              ) : settings.ogImage ? (
                                <img src={settings.ogImage} alt="OG" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-8 h-8 text-white/10" />
                              )}
                              <label className={cn(
                                "absolute inset-0 bg-black/60 transition-opacity flex flex-col items-center justify-center cursor-pointer",
                                uploadingSettings['ogImage'] ? "opacity-100 pointer-events-none" : "opacity-0 group-hover/seo:opacity-100"
                              )}>
                                <Upload className="w-6 h-6 text-white mb-1" />
                                <span className="text-[10px] text-white font-bold">업로드</span>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) uploadSettingImage('ogImage', file);
                                  }} 
                                  disabled={uploadingSettings['ogImage']}
                                />
                              </label>
                              {settings.ogImage && !uploadingSettings['ogImage'] && (
                                <button
                                  onClick={() => updateSettings({ ogImage: '' })}
                                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover/seo:opacity-100 transition-opacity hover:bg-red-600 z-20"
                                  title="이미지 삭제"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center justify-between">
                            <span className="text-xs text-white/40 font-bold uppercase">Favicon</span>
                            <span className="text-[10px] text-white/20 font-medium">32x32px / 200KB</span>
                          </label>
                          <div className="relative group/favicon">
                            <div className="w-24 h-24 bg-black border border-white/10 rounded-xl overflow-hidden flex items-center justify-center">
                              {uploadingSettings['favicon'] ? (
                                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                              ) : settings.favicon ? (
                                <img src={settings.favicon} alt="Favicon" className="w-16 h-16 object-contain" />
                              ) : (
                                <ImageIcon className="w-8 h-8 text-white/10" />
                              )}
                              <label className={cn(
                                "absolute inset-0 bg-black/60 transition-opacity flex flex-col items-center justify-center cursor-pointer",
                                uploadingSettings['favicon'] ? "opacity-100 pointer-events-none" : "opacity-0 group-hover/favicon:opacity-100"
                              )}>
                                <Upload className="w-6 h-6 text-white mb-1" />
                                <span className="text-[10px] text-white font-bold">업로드</span>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) uploadSettingImage('favicon', file);
                                  }} 
                                  disabled={uploadingSettings['favicon']}
                                />
                              </label>
                              {settings.favicon && !uploadingSettings['favicon'] && (
                                <button
                                  onClick={() => updateSettings({ favicon: '' })}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover/favicon:opacity-100 transition-opacity hover:bg-red-600 z-20"
                                  title="이미지 삭제"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
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
                            value={settings.accentColor || '#f59e0b'}
                            onChange={(e) => updateSettings({ accentColor: e.target.value })}
                            className="w-12 h-12 bg-transparent border-none cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settings.accentColor || ''}
                            onChange={(e) => updateSettings({ accentColor: e.target.value })}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">대표 폰트</label>
                        <select
                          value={settings.primaryFont || 'NanumSquareNeo'}
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
              ) : (
                <div className="space-y-12">
                  <section className="space-y-6">
                    <h4 className="text-amber-500 font-bold tracking-widest text-xs uppercase">캠페인 히어로 섹션 설정</h4>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">캠페인 Hero 영상 (YouTube ID)</label>
                        <input
                          type="text"
                          value={settings.campaignHeroVideoId || ''}
                          onChange={(e) => updateSettings({ campaignHeroVideoId: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                          placeholder="영상 ID가 있는 경우 배경 이미지 대신 재생됩니다."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">캠페인 Hero 메인 헤드라인</label>
                        <textarea
                          value={settings.campaignHeroHeadline || ''}
                          onChange={(e) => updateSettings({ campaignHeroHeadline: e.target.value })}
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">캠페인 Hero 태그 (쉼표로 구분)</label>
                        <input
                          type="text"
                          value={settings.campaignHeroSubcopy || ''}
                          onChange={(e) => updateSettings({ campaignHeroSubcopy: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">캠페인 페이지 설명</label>
                        <textarea
                          value={settings.campaignHeroDescription || ''}
                          onChange={(e) => updateSettings({ campaignHeroDescription: e.target.value })}
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-amber-500 font-bold tracking-widest text-xs uppercase">캠페인 포트폴리오 섹션 설정</h4>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">포트폴리오 섹션 소제목 (라벨)</label>
                        <input
                          type="text"
                          value={settings.campaignPortfolioTitle || ''}
                          onChange={(e) => updateSettings({ campaignPortfolioTitle: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">포트폴리오 섹션 메인 헤드라인</label>
                        <input
                          type="text"
                          value={settings.campaignPortfolioHeadline || ''}
                          onChange={(e) => updateSettings({ campaignPortfolioHeadline: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 font-bold uppercase">포트폴리오 섹션 설명</label>
                        <textarea
                          value={settings.campaignPortfolioDescription || ''}
                          onChange={(e) => updateSettings({ campaignPortfolioDescription: e.target.value })}
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-amber-500 font-bold tracking-widest text-xs uppercase">캠페인 서비스 섹션 이미지</h4>
                    <div className="grid grid-cols-2 gap-6">
                      {[
                        { key: 'campaignService1Image', label: '서비스 1 (디지털 워크플로우)', sub: 'Server/Tech' },
                        { key: 'campaignService2Image', label: '서비스 2 (영상 콘텐츠)', sub: 'Production/Film' },
                        { key: 'campaignService3Image', label: '서비스 3 (현장 대응)', sub: 'Event/Live' },
                        { key: 'campaignService4Image', label: '서비스 4 (브랜드 아이덴티티)', sub: 'Branding/Identity' }
                      ].map((img, iIdx) => (
                        <div key={img.key} className="space-y-2">
                          <label className="flex items-center justify-between">
                            <span className="text-[10px] text-white/40 font-bold uppercase">{img.label}</span>
                            <span className="text-[9px] text-white/20 font-medium">{img.sub}</span>
                          </label>
                          <div className="relative group/service-img">
                            <div className="w-full aspect-video bg-black border border-white/10 rounded-xl overflow-hidden flex items-center justify-center">
                              {uploadingSettings[img.key] ? (
                                <div className="flex flex-col items-center space-y-2">
                                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                                  <span className="text-[8px] text-white/40 tracking-widest font-bold">UPLOADING...</span>
                                </div>
                              ) : (settings as any)[img.key] ? (
                                <img src={(settings as any)[img.key]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-8 h-8 text-white/10" />
                              )}
                              <label className={cn(
                                "absolute inset-0 bg-black/60 transition-opacity flex flex-col items-center justify-center cursor-pointer",
                                uploadingSettings[img.key] ? "opacity-100 pointer-events-none" : "opacity-0 group-hover/service-img:opacity-100"
                              )}>
                                <Upload className="w-5 h-5 text-white mb-1" />
                                <span className="text-[9px] text-white font-bold">업로드</span>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) uploadSettingImage(img.key, file);
                                  }} 
                                  disabled={uploadingSettings[img.key]}
                                />
                              </label>
                              {(settings as any)[img.key] && !uploadingSettings[img.key] && (
                                <button
                                  onClick={() => updateSettings({ [img.key]: '' })}
                                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover/service-img:opacity-100 transition-opacity hover:bg-red-600 z-20"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
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
