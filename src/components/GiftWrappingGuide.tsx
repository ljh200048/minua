/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Gift, Sparkles, Check, Heart } from 'lucide-react';
import { DICTIONARY } from '../data';

interface GiftWrappingGuideProps {
  currentLang: 'KO' | 'EN' | 'JP';
}

export default function GiftWrappingGuide({ currentLang }: GiftWrappingGuideProps) {
  const dict = DICTIONARY[currentLang];

  return (
    <div id="gift-wrapping-marketing" className="bg-stone-900 text-stone-100 py-12 sm:py-16 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner Title */}
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center space-x-1.5 p-1 rounded-full bg-stone-800 border border-stone-700">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest font-bold uppercase bg-amber-500 text-stone-950">
              GIFT PACKAGING
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white font-sans">
            {dict.giftBannerTitle}
          </h2>
          <div className="w-8 h-0.5 bg-amber-500 mx-auto" />
        </div>

        {/* Packing Split Grid detail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 max-w-5xl mx-auto">
          
          {/* Packing A: Basic Linen */}
          <div className="bg-stone-850 rounded-2xl border border-stone-800 p-6 sm:p-7 space-y-5 flex flex-col justify-between shadow-xs">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-stone-800 text-stone-300 rounded-full flex items-center justify-center">
                <Gift size={18} />
              </div>
              <h3 className="text-base font-bold text-white font-sans flex justify-between items-baseline">
                <span>{currentLang === 'KO' ? '미누아 에센셜 린넨 주머니 주얼리 파우치' : 'MINUA Essential Linen Pouch'}</span>
                <span className="text-xs font-mono text-amber-400">FREE</span>
              </h3>
              <p className="text-xs text-stone-400 font-light leading-relaxed">
                {currentLang === 'KO' 
                  ? '환경을 생각하는 가공되지 않은 순백의 이탈리안 린넨과 실 코튼 스트랩을 손수 엮어 만든 보관 파우치입니다. 화장대 위 액세서리 공기 차단 및 데일리 수납에 적합합니다.'
                  : 'Sustainable raw Italian linen weave tailored under organic cotton drawstrings. Prevents atmospheric silver oxidization perfectly.'}
              </p>
            </div>

            <ul className="text-xs text-stone-300 space-y-1.5 border-t border-stone-800/80 pt-3 font-light">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-amber-500" />
                <span>{currentLang === 'KO' ? '친환경 유기농 린넨 원사' : 'Organic unbleached fabric base'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-amber-500" />
                <span>{currentLang === 'KO' ? '미누아 시그니처 프레스 인장' : 'Debossed minimal brand logo print'}</span>
              </li>
            </ul>
          </div>

          {/* Packing B: Premium Silk Ribbon */}
          <div className="bg-stone-850 rounded-2xl border border-amber-900/30 p-6 sm:p-7 space-y-5 flex flex-col justify-between shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-500 text-stone-950 font-bold font-mono tracking-widest text-[9px] uppercase px-3 py-0.5 rounded-bl-xl shadow-xs">
              RECOMMENDED
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 bg-amber-900/40 text-amber-400 rounded-full flex items-center justify-center border border-amber-900/25">
                <Sparkles size={18} />
              </div>
              <h3 className="text-base font-bold text-white font-sans flex justify-between items-baseline">
                <span>{currentLang === 'KO' ? '프리미엄 리본 기프트 하드 케이스' : 'Premium Silk Tie Ribbon Rigid Box'}</span>
                <span className="text-xs font-mono text-amber-500">+₩5,000</span>
              </h3>
              <p className="text-xs text-stone-400 font-light leading-relaxed">
                {currentLang === 'KO' 
                  ? '두툼하고 질감이 곱게 정돈된 매트 우드 화이트 하드커버 패키징에 실크 기모 가공된 정통 에르 가든 리본 타이가 선물하는 분의 섬세한 기품과 성의를 한껏 살려 포장됩니다.'
                  : 'An opulent heavy-duty structural white gift box tied in silk velvet ribbon loops. Delivers unmatched luxurious presence.'}
              </p>
            </div>

            <ul className="text-xs text-stone-300 space-y-1.5 border-t border-stone-800/80 pt-3 font-light">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-amber-500" />
                <span>{currentLang === 'KO' ? '고중량 매트 보드 지재 가공 상자' : 'Heavy board structural slide tray'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-amber-500" />
                <span>{currentLang === 'KO' ? '에르 실크 스레드 리본 핸드 메이드 타이' : 'Hand-crafted satin thread closure'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Heart size={13} className="text-red-500" />
                <span className="text-amber-300 font-normal">{currentLang === 'KO' ? '캘리 메시지 편지 대행 동봉' : 'Elegant calligraphy typing letter included'}</span>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
