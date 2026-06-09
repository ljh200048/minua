/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mail, ShieldCheck, MapPin } from 'lucide-react';
import { DICTIONARY } from '../data';

interface FooterProps {
  currentLang: 'KO' | 'EN' | 'JP';
  onResetImages?: () => void;
}

export default function Footer({ currentLang, onResetImages }: FooterProps) {
  const dict = DICTIONARY[currentLang];

  return (
    <footer className="bg-stone-950 text-stone-300 py-16 border-t border-stone-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top grid summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-b border-stone-850 pb-12 mb-10 text-stone-400">
          
          {/* Brand story column */}
          <div className="space-y-4">
            <h4 className="text-stone-100 text-sm font-semibold tracking-widest font-sans uppercase">
              MINUA CRAFTS ATELIER
            </h4>
            <p className="text-xs font-light leading-relaxed max-w-sm text-stone-500">
              {currentLang === 'KO' 
                ? '미누아는 매일 착용하기 좋은 감성 주얼리를 만듭니다. 반지와 팔찌에 각자의 따뜻한 감동과 취향을 조각해 나가세요.' 
                : 'MINUA represents standard high-end delicate jewelry forged for everyday nomads. Imprint your special memories on customized metallic rings and chains.'}
            </p>
          </div>

          {/* Quick policies */}
          <div className="space-y-4">
            <h4 className="text-stone-100 text-sm font-semibold tracking-widest font-sans uppercase">
              {currentLang === 'KO' ? '고객 케어 지원' : 'Customer Devotions'}
            </h4>
            <ul className="text-xs space-y-2.5 font-light text-stone-500">
              <li className="flex items-center gap-2">
                <MapPin size={12} className="text-amber-600" />
                <span>{currentLang === 'KO' ? '주문 후 개별 수제 마감 과정' : '1:1 Custom Manual Forging Process'}</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={12} className="text-amber-600" />
                <span>{currentLang === 'KO' ? '실버 925 알레르기 안심 소재' : 'Hypoallergenic 925 Sterling Gold-plated'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={12} className="text-amber-600" />
                <span>CS: minua_jewelry@gmail.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright metadata details */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[10.5px] leading-relaxed text-stone-600">
          <div className="max-w-xl">
            <p>{dict.footerBizInfo}</p>
            {onResetImages && (
              <button
                onClick={onResetImages}
                className="mt-2.5 text-stone-500 hover:text-amber-500 transition-colors underline underline-offset-2 cursor-pointer font-sans block"
              >
                {currentLang === 'KO' ? '초기 데모 템플릿 이미지로 복원' : 'Restore Default Demo Images'}
              </button>
            )}
          </div>
          <p className="font-mono text-stone-700">
            © 2026 MINUA Atelier Corp. All rights reserved. Registered in Seoul.
          </p>
        </div>

      </div>
    </footer>
  );
}
