import React from 'react';
import { ChevronRight, Camera, RefreshCw, Heart } from 'lucide-react';
import { Product } from '../types';
import { getProductImage, saveOverriddenImage, getOverriddenImages, compressImage, getOverriddenDescriptions } from '../utils/imageDb';
import { saveImageOverrideInDb, saveProductInDb } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import GiftWrappingGuide from './GiftWrappingGuide';

interface AestheticHomeProps {
  lang: 'KO' | 'EN' | 'JP';
  productsList: Product[];
  wishlist: string[];
  handleToggleWishlist: (id: string) => void;
  setSelectedProduct: (p: Product | null) => void;
  setActiveTab: (tab: string) => void;
  isAdminAuthenticated: boolean;
  setImageTick: React.Dispatch<React.SetStateAction<number>>;
}

export default function AestheticHome({
  lang,
  productsList,
  wishlist,
  handleToggleWishlist,
  setSelectedProduct,
  setActiveTab,
  isAdminAuthenticated,
  setImageTick
}: AestheticHomeProps) {
  
  return (
    <div id="home-view-panel" className="bg-white space-y-16 sm:space-y-28 pb-20 animate-fadeIn">
      
      {/* 1. HERO SECTION (Exactly Matching Image-1 Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[580px] border-b border-neutral-100">
        
        {/* Left Column: High-Key Product/Amber-Glass Art with 'minua' overlay */}
        <div className="relative aspect-square lg:aspect-auto lg:h-full overflow-hidden bg-[#FBF9F6] border-r border-[#FFF8EF]/20 group flex items-center justify-center">
          <img
            src={getProductImage('hero-banner-main', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&q=80')}
            alt="minua concept"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-102"
            referrerPolicy="no-referrer"
          />
          
          {/* Giant Serif brand signature overlay on center-left */}
          <div className="absolute inset-0 bg-stone-900/10 flex items-center justify-center pointer-events-none">
            <h1 className="text-white text-5xl sm:text-7xl font-serif tracking-wider font-light drop-shadow-md lowercase select-none">
              minua.
            </h1>
          </div>

          {/* Admin Swap controller for Hero Image */}
          {isAdminAuthenticated && (
            <div className="absolute bottom-4 left-4 z-10 animate-fadeIn">
              <label className="bg-white/95 hover:bg-stone-900 border border-stone-200 text-stone-800 hover:text-white rounded-full px-3.5 py-1.5 cursor-pointer shadow-xs flex items-center gap-1.5 text-[11px] font-mono tracking-wider font-semibold transition-colors">
                <Camera size={13} />
                <span>{lang === 'KO' ? '히어로 이미지 교체' : 'Swap Hero Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        try {
                          const base64 = reader.result as string;
                          const compressed = await compressImage(base64, 1200);
                          const finalUrl = await saveImageOverrideInDb('hero-banner-main', compressed);
                          saveOverriddenImage('hero-banner-main', finalUrl);
                          setImageTick(prev => prev + 1);
                        } catch (err) {
                          console.error('Failed to change hero image:', err);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          )}
        </div>

        {/* Right Column: Editorial story introduction on clean white space */}
        <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-16 bg-white shrink-0">
          <div className="max-w-md space-y-6 sm:space-y-8">
            <span className="text-[11px] font-mono tracking-[0.25em] text-[#B5A595] block uppercase font-medium">
              minua story
            </span>
            
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-serif font-light text-neutral-900 tracking-tight leading-tight">
                Modern Heirlooms
              </h2>
              <p className="text-stone-550 text-xs sm:text-[14px] leading-relaxed tracking-wider font-light break-keep text-justify">
                Dreamt up by founder when she was going through a dark time. Alighieri was inspired by Italian poet, Dante Alighieri, and his story of being lost in a dark wood, searching for strength and courage. Modern Heirlooms hand-carved and cast locally in the UK, each piece has a story and invites you to unlock your own.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveTab('minua-story')}
                className="text-xs font-serif italic text-neutral-905 underline underline-offset-8 hover:text-amber-800 transition-colors tracking-widest cursor-pointer lowercase bg-transparent border-none p-0"
              >
                read the story
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 2. SPECIFIC CATEGORY VERTICAL LIST (Exactly Matching Image-6 Layout) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Left side label */}
          <div>
            <h3 className="text-4xl sm:text-5xl font-serif font-light text-neutral-950 tracking-tight select-none">
              Category
            </h3>
          </div>

          {/* Right side listed links with numbers */}
          <div className="md:col-span-2 space-y-3 font-serif">
            {[
              { num: '01', id: 'earring', label: 'Earring' },
              { num: '02', id: 'necklace', label: 'Necklaces' },
              { num: '03', id: 'ring', label: 'Ring' },
              { num: '04', id: 'bracelet', label: 'Bracelet' }
            ].map((catItem) => (
              <button
                key={catItem.id}
                onClick={() => {
                  setActiveTab(catItem.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left py-6 sm:py-7 px-4 sm:px-6 border-b border-neutral-100 flex items-center justify-between group hover:pl-6 hover:bg-neutral-50/60 transition-all cursor-pointer bg-transparent rounded-lg relative touch-manipulation select-none"
                id={`category-item-link-${catItem.id}`}
              >
                <div className="flex items-center space-x-10 sm:space-x-12">
                  <span className="font-mono text-xs sm:text-[13px] tracking-widest text-[#B5A595] group-hover:text-amber-800 transition-colors select-none">
                    {catItem.num}
                  </span>
                  <span className="text-xl sm:text-[23px] text-neutral-800 font-light tracking-wide group-hover:font-normal group-hover:text-neutral-950 group-hover:underline group-hover:underline-offset-8 decoration-amber-800/30 transition-all">
                    {catItem.label}
                  </span>
                </div>
                <ChevronRight size={18} className="text-neutral-300 group-hover:text-amber-800 group-hover:translate-x-1.5 transition-all" />
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* 3. FOUR COLUMN IMAGE CATEGORY PREVIEW (Exactly Matching Image-5 Layout & swappable for Admin) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-neutral-100/65">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { 
              id: 'earring', 
              label: 'Earring', 
              defaultImg: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80',
              stubName: 'col-earring-img'
            },
            { 
              id: 'ring', 
              label: 'Ring', 
              defaultImg: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80',
              stubName: 'col-ring-img'
            },
            { 
              id: 'necklace', 
              label: 'Necklaces', 
              defaultImg: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
              stubName: 'col-necklace-img'
            },
            { 
              id: 'bracelet', 
              label: 'Bracelet', 
              defaultImg: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80',
              stubName: 'col-bracelet-img'
            }
          ].map((colItem) => {
            const resolvedColImg = getProductImage(colItem.stubName, colItem.defaultImg);
            return (
              <div 
                key={colItem.id}
                className="group flex flex-col space-y-3 bg-white relative text-left"
              >
                {/* Column title */}
                <button
                  onClick={() => {
                    setActiveTab(colItem.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="font-serif text-sm sm:text-[15px] tracking-wide text-neutral-850 hover:text-amber-800 transition-colors text-left bg-transparent p-0 w-fit cursor-pointer"
                >
                  {colItem.label}
                </button>

                {/* Image frame - styled elegantly with thin border & crisp white background */}
                <div className="relative aspect-square overflow-hidden bg-stone-50 border border-neutral-100/80 flex items-center justify-center">
                  <img
                    src={resolvedColImg}
                    alt={colItem.label}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Transparent trigger mask */}
                  <button
                    onClick={() => {
                      setActiveTab(colItem.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors cursor-pointer"
                  />

                  {/* Admin Image controller */}
                  {isAdminAuthenticated && (
                    <div className="absolute bottom-3 right-3 z-30 flex gap-1.5 animate-fadeIn">
                       <label className="bg-white/95 hover:bg-stone-900 border border-stone-200 text-stone-800 hover:text-white rounded-full p-2 cursor-pointer shadow-xs transition-colors" title="Swap Collection Photo">
                        <Camera size={13} />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                try {
                                  const base64 = reader.result as string;
                                  const compressed = await compressImage(base64, 1000);
                                  const finalUrl = await saveImageOverrideInDb(colItem.stubName, compressed);
                                  saveOverriddenImage(colItem.stubName, finalUrl);
                                  setImageTick(prev => prev + 1);
                                } catch (err) {
                                  console.error('Failed to save category image:', err);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {getOverriddenImages()[colItem.stubName] && (
                        <button
                          onClick={() => {
                            if (confirm(lang === 'KO' ? '이 이미지를 원래 디자인으로 복원하겠습니까?' : 'Revert this category image?')) {
                              const overrides = getOverriddenImages();
                              delete overrides[colItem.stubName];
                              localStorage.setItem('minua_image_overrides', JSON.stringify(overrides));
                              setImageTick(prev => prev + 1);
                            }
                          }}
                          className="bg-white/95 hover:bg-red-50 hover:text-red-900 border border-stone-200 text-stone-500 rounded-full p-2 cursor-pointer shadow-xs transition-colors"
                        >
                          <RefreshCw size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. CURATED BEST SELLERS SECTION (Exactly Matching Image-2 Layout & Active Buying Logic) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left">
          
          {/* Left column heading with links & navigator */}
          <div className="space-y-6 pt-2">
            <div className="space-y-3">
              <h2 className="text-4xl font-serif font-light tracking-tight text-neutral-900">
                Best sellers
              </h2>
              <p className="text-[12px] font-mono text-stone-400 tracking-wider font-light uppercase">
                Our signature pieces adored daily
              </p>
            </div>

            {/* View all sub-link */}
            <div>
              <button
                onClick={() => {
                  setActiveTab('all');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs font-serif text-neutral-800 underline underline-offset-8 hover:text-amber-800 transition-colors capitalize cursor-pointer focus:outline-hidden bg-transparent border-none p-0"
              >
                View all &rarr;
              </button>
            </div>

            {/* Aesthetic arrow keys matching screenshot */}
            <div className="flex items-center space-x-3 pt-6 select-none">
              <button 
                onClick={() => alert(lang === 'KO' ? '이전 베스트 상품 목록으로 이동합니다.' : 'Moving to previous bestseller items.')}
                className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-neutral-800 hover:border-neutral-850 transition-colors cursor-pointer bg-white"
              >
                &larr;
              </button>
              <button 
                onClick={() => alert(lang === 'KO' ? '다음 베스트 상품 목록으로 이동합니다.' : 'Moving to next bestseller items.')}
                className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-neutral-800 hover:border-neutral-850 transition-colors cursor-pointer bg-white"
              >
                &rarr;
              </button>
            </div>
          </div>

          {/* Right columns: Horizontal list of three verified product cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {productsList.filter(p => ['earring-01', 'sculpt-01', 'necklace-01'].includes(p.id)).map((prod) => {
              const resolvedImg = getProductImage(prod.id, prod.defaultImage, prod.imageUrl);
              const isWished = wishlist.includes(prod.id);
              return (
                <div
                  key={prod.id}
                  className="bg-white border border-neutral-100/90 overflow-hidden hover:shadow-sm transition-shadow group flex flex-col justify-between text-left"
                >
                  {/* Image canvas structure */}
                  <div className="relative aspect-square overflow-hidden bg-[#FCFAF7] border-b border-neutral-100 flex items-center justify-center">
                    <img
                      src={resolvedImg}
                      alt={prod.nameEN}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102 absolute inset-0"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Absolute trigger over product thumbnail */}
                    <button
                      onClick={() => setSelectedProduct({ ...prod, defaultImage: resolvedImg })}
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors cursor-pointer"
                    />

                    {/* Individual photo overrides for store keeper */}
                    {isAdminAuthenticated && (
                      <div className="absolute bottom-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <label className="bg-white border border-neutral-200 text-stone-800 hover:bg-neutral-900 hover:text-white rounded-full p-2 cursor-pointer shadow-xs block">
                          <Camera size={13} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                  try {
                                    const base64 = reader.result as string;
                                    const compressed = await compressImage(base64, 1000);
                                    saveOverriddenImage(prod.id, compressed);
                                    
                                    const updatedProd = { ...prod, defaultImage: compressed };
                                    const savedProd = await saveProductInDb(updatedProd, productsList);
                                    
                                    // Update our local cache with the clean URL returned
                                    saveOverriddenImage(prod.id, savedProd.defaultImage);
                                    setImageTick(prev => prev + 1);
                                  } catch (err) {
                                    console.error('Failed to swap product photo:', err);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}

                    {/* Heart trigger */}
                    <button
                      onClick={() => handleToggleWishlist(prod.id)}
                      className={`absolute top-3 right-3 p-2 rounded-full cursor-pointer bg-white/95 border transition-colors ${
                        isWished ? 'text-pink-600 border-pink-105 bg-white' : 'text-neutral-450 border-transparent hover:text-neutral-700 bg-white'
                      }`}
                    >
                      <Heart size={14} fill={isWished ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Title and pricing details */}
                  <div className="p-4 space-y-2">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono tracking-widest text-[#B5A595] uppercase block">
                        {prod.category}
                      </span>
                      <button
                        onClick={() => setSelectedProduct({ ...prod, defaultImage: resolvedImg })}
                        className="text-[14px] sm:text-[15px] font-serif text-stone-900 font-light hover:text-amber-800 transition-colors text-left block focus:outline-hidden bg-transparent border-none p-0 w-full"
                      >
                        {prod.nameEN}
                      </button>
                    </div>

                    <div className="flex items-center space-x-2 pt-1.5 border-t border-neutral-100/50">
                      {prod.originalPrice ? (
                        <div className="flex items-center space-x-1.5 font-mono">
                          <span className="text-[11px] text-stone-300 line-through">
                            ₩{prod.originalPrice.toLocaleString()}
                          </span>
                          <span className="text-[12px] font-bold text-amber-900">
                            ₩{prod.price.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-[#C48F56] font-semibold tracking-wider uppercase">
                            10% off
                          </span>
                        </div>
                      ) : (
                        <span className="text-[12px] font-mono font-bold text-amber-900">
                          ₩{prod.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </div>



      {/* Brand Packaging Presentation Section */}
      <div id="brand-packaging-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-neutral-100/50">
        <div className="space-y-4 mb-8 text-left">
          <span className="text-[10px] font-mono tracking-[0.3em] font-light text-[#B5A595] block uppercase">
            Signature Presentation
          </span>
          <h3 className="text-3xl font-serif font-light text-neutral-950 tracking-tight">
            Brand Packaging
          </h3>
        </div>

        <div className="bg-[#FAF8F5]/30 p-6 sm:p-10 rounded-3xl border border-stone-200/40 text-left max-w-4xl">
          {/* Column: Description Copy */}
          <div className="flex flex-col justify-between h-full py-2 text-left">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-stone-150/55">
                <span className="text-[11px] font-mono tracking-widest text-[#B5A595]">
                  SIGNATURE WRAPPING DESIGN
                </span>
                
                {isAdminAuthenticated && (
                  <button
                    onClick={async () => {
                      const pw = prompt('관리자 비밀번호를 입력해주십시오:');
                      if (pw !== 'minua144000') {
                        alert('비밀번호가 올바르지 않습니다. 관리자 권한이 없습니다.');
                        return;
                      }
                      const keyName = 'brand-packaging-image';
                      const currentDesc = getOverriddenDescriptions()[keyName] || "미누아의 시그니처 쇼핑백과 고급 선물 패키징은 주얼리를 구매하시는 모든 분들에게 무상으로 제공되는 세련된 선물 제안입니다. 튼튼하면서도 클래식한 마감의 감각적인 기프트 하드 박스와 프렌치 실크 리본이 소중한 마음에 영원의 숨결과 은은하게 머금는 명품 본연의 깊이감을 더해 줍니다.";
                      const newDesc = prompt('새로운 Brand Packaging 설명글을 입력해 주십시오:', currentDesc);
                      if (newDesc !== null) {
                        try {
                          const currentImage = getOverriddenImages()[keyName] || '';
                          const imageToSave = currentImage || 'empty';
                          await saveImageOverrideInDb(keyName, imageToSave, newDesc);
                          
                          const savedDescs = getOverriddenDescriptions();
                          savedDescs[keyName] = newDesc;
                          localStorage.setItem('minua_image_descriptions', JSON.stringify(savedDescs));
                          
                          setImageTick(prev => prev + 1);
                          alert('설명글 변경이 정상 저장되었습니다.');
                        } catch (err) {
                          console.error('Failed to save description:', err);
                          alert('설명글 저장에 실패했습니다.');
                        }
                      }
                    }}
                    className="text-[11px] text-stone-500 hover:text-amber-800 font-medium underline underline-offset-4 cursor-pointer"
                  >
                    설명글 편집
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-serif font-light text-neutral-950 tracking-wide">
                  {lang === 'KO' ? '지속 가능한 아름다움, 프리미엄 패키지 패킹' : 'Minua’s Tailored Signature Packaging'}
                </h4>
                <p className="text-neutral-500 font-sans font-light text-[14px] leading-relaxed break-keep border-b border-stone-100 pb-4">
                  {getOverriddenDescriptions()['brand-packaging-image'] || "미누아의 시그니처 쇼핑백과 고급 선물 패키징은 주얼리를 구매하시는 모든 분들에게 무상으로 제공되는 세련된 선물 제안입니다. 튼튼하면서도 클래식한 마감의 감각적인 기프트 하드 박스와 프렌치 실크 리본이 소중한 마음에 영원의 숨결과 은은하게 머금는 명품 본연의 깊이감을 더해 줍니다."}
                </p>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-[10px] font-mono text-[#B5A595] tracking-widest uppercase block mb-1">BAG DETAILS</span>
                    <span className="text-xs text-stone-600 font-sans font-light">두툼한 로고 엠보싱 에디션 백</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#B5A595] tracking-widest uppercase block mb-1">PROTECTION</span>
                    <span className="text-xs text-stone-600 font-sans font-light">프렌치 새틴 더블 기프팅 상자</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-100/60 mt-10">
              <span className="text-[11px] font-serif italic text-stone-400">
                "Unveiling the art of beautiful gift giving in pure elegance."
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Standard Gift Packaging Marketing Display Column */}
      <GiftWrappingGuide currentLang={lang} />

    </div>
  );
}
