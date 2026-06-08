/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, Layers, Anchor, Shield } from 'lucide-react';
import { DICTIONARY } from '../data';
import { getProductImage } from '../utils/imageDb';

interface AttachmentStoryProps {
  currentLang: 'KO' | 'EN' | 'JP';
  setActiveTab: (tab: string) => void;
}

export default function AttachmentStory({ currentLang, setActiveTab }: AttachmentStoryProps) {
  const dict = DICTIONARY[currentLang];

  return (
    <div id="minua-story-page" className="bg-stone-50 text-stone-900 pb-20 font-sans">
      
      {/* Editorial Hero Area */}
      <div className="relative overflow-hidden bg-stone-900 text-stone-100 py-24 sm:py-32">
        <div className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay" style={{ backgroundImage: `url(${getProductImage('minua-hero', 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=1600&q=80')})` }} />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <p className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-4">
            {dict.attStoryTitle}
          </p>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight font-sans text-stone-100 mb-6 drop-shadow-xs">
            {dict.attStoryIntroLine1}
          </h1>
          <p className="text-lg sm:text-xl text-stone-300 font-light max-w-2xl mx-auto leading-relaxed">
            {dict.attStoryIntroLine2}
          </p>
        </div>
      </div>

      {/* Main Narrative */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-20 items-center">
          
          <div className="space-y-6">
            <span className="text-xs font-mono text-stone-400 tracking-wider block uppercase">
              {currentLang === 'KO' ? '// 연결 그리고 확장' : '// Connection & Expansion'}
            </span>
            <h2 className="text-2xl sm:text-3.5xl font-medium tracking-tight text-stone-900 font-sans leading-tight">
              {currentLang === 'KO' 
                ? '단순한 키 체인을 넘어, 오늘 하루 속 나를 기록하는 오브제' 
                : 'Far beyond a generic keychain, a living portrait of your days.'}
            </h2>
            <p className="text-stone-600 font-light leading-relaxed">
              {dict.attStoryBody1}
            </p>
            <p className="text-stone-600 font-light leading-relaxed">
              {dict.attStoryBody2}
            </p>
            <div className="pt-4">
              <button
                id="story-shop-minua-btn"
                onClick={() => setActiveTab('keyring')}
                className="inline-flex items-center space-x-2.5 text-xs font-mono font-bold uppercase tracking-widest text-amber-800 hover:text-amber-950 transition-colors cursor-pointer group"
              >
                <span>{currentLang === 'KO' ? 'minua 키링 컬렉션 보러가기' : 'Explore minua Collections'}</span>
                <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-4/5 rounded-2xl overflow-hidden bg-stone-200 shadow-md">
              <img
                src={getProductImage('minua-collage', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80')}
                alt="minua collection leather keyring detail"
                className="w-full h-full object-cover select-none"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Overlay badge representing "minua" logo */}
            <div className="absolute -bottom-6 -left-6 bg-white border border-stone-100 shadow-lg p-6 rounded-xl hidden sm:block max-w-xs">
              <span className="text-[10px] font-mono font-semibold tracking-widest text-amber-700 block uppercase mb-1">
                MINUA ATELIER
              </span>
              <p className="text-xs text-stone-500 font-light leading-normal">
                {currentLang === 'KO' 
                  ? '우리의 "minua"라인은 최고급 부품을 정교한 손바느질로 엮어 제작됩니다.' 
                  : 'Our custom components are securely assembled by master hands in Seoul.'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Brand Values Grid */}
      <div className="bg-stone-100 mt-24 py-20 border-y border-stone-200/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h3 className="text-2xl font-medium tracking-tight font-sans text-stone-900">
              {currentLang === 'KO' ? '하드웨어의 품격과 가치' : 'Crafted Values of minua Module'}
            </h3>
            <div className="w-12 h-0.5 bg-amber-800 mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            
            {/* Value 1 */}
            <div className="bg-white p-8 rounded-2xl border border-stone-200/50 shadow-xs space-y-4 transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-amber-800">
                <Layers size={18} />
              </div>
              <h4 className="text-lg font-medium text-stone-900 font-sans">
                {dict.attValueTitle1}
              </h4>
              <p className="text-stone-500 text-sm font-light leading-relaxed">
                {dict.attValueDesc1}
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-white p-8 rounded-2xl border border-stone-200/50 shadow-xs space-y-4 transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-amber-800">
                <Shield size={18} />
              </div>
              <h4 className="text-lg font-medium text-stone-900 font-sans">
                {dict.attValueTitle2}
              </h4>
              <p className="text-stone-500 text-sm font-light leading-relaxed">
                {dict.attValueDesc2}
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-white p-8 rounded-2xl border border-stone-200/50 shadow-xs space-y-4 transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-amber-800">
                <Anchor size={18} />
              </div>
              <h4 className="text-lg font-medium text-stone-900 font-sans">
                {dict.attValueTitle3}
              </h4>
              <p className="text-stone-500 text-sm font-light leading-relaxed">
                {dict.attValueDesc3}
              </p>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
