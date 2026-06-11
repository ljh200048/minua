/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DICTIONARY } from '../data';

interface FooterProps {
  currentLang: 'KO' | 'EN' | 'JP';
  onNavigateToAdmin?: () => void;
}

export default function Footer({ currentLang, onNavigateToAdmin }: FooterProps) {
  const dict = DICTIONARY[currentLang];

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white text-stone-600 py-16 border-t border-neutral-150 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Business details - exactly mirroring screenshot-4 */}
        <div className="text-stone-500 font-sans space-y-2 text-xs sm:text-[13px] tracking-wide leading-relaxed text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-1.5 gap-y-1">
            <span>company: <strong className="text-neutral-800 font-medium">minua</strong></span>
            <span className="text-neutral-300">/</span>
            <span>owner: <strong className="text-neutral-800 font-medium">gildong Hong</strong></span>
            <span className="text-neutral-300">/</span>
            <span>phonnumber: <strong className="text-neutral-800 font-medium">010-1234-5678</strong></span>
            <span className="text-neutral-300">/</span>
            <span>office: <span className="text-neutral-700">111,11, Toegye-ro 11-gil, Jung-gu, Seoul, Republic of Korea</span></span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-1.5 gap-y-1 border-t border-neutral-100 pt-2">
            <span>business license : <span className="text-neutral-700">123-45-6789</span></span>
            <span className="text-neutral-300">/</span>
            <span>mail: <a href="mailto:minua@gmail.com" className="text-neutral-700 underline hover:text-amber-800">minua@gmail.com</a></span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-1.5 gap-y-1 border-t border-neutral-100 pt-2">
            <span>cpo: <span className="text-neutral-700">gildong Lee (minua@gmail.com)</span></span>
            <span className="text-neutral-300">/</span>
            <span>hosting provider : <span className="text-neutral-700">lnc.imweb</span></span>
          </div>
        </div>

        {/* Bottom Section: Arched minua logo & arrow & admin trigger */}
        <div className="border-t border-neutral-100 pt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          
          {/* Admin center */}
          <div className="text-xs text-neutral-400">
            {onNavigateToAdmin ? (
              <button
                onClick={onNavigateToAdmin}
                className="hover:text-amber-800 transition-colors underline underline-offset-4 cursor-pointer font-sans"
              >
                {currentLang === 'KO' ? '🔒 관리 센터' : '🔒 Admin'}
              </button>
            ) : (
              <span>© minua. All rights reserved.</span>
            )}
          </div>

          {/* Centered arched logo */}
          <div className="relative py-2 px-5 select-none scale-90">
            <div className="absolute top-0 left-0 right-0 h-3 border-t border-neutral-300 rounded-[100%_100%_0_0] scale-x-110 opacity-60" />
            <span className="font-serif text-lg tracking-widest text-neutral-800 lowercase block text-center">
              minua
            </span>
          </div>

          {/* Elegant Scroll to Top action */}
          <button
            onClick={handleScrollToTop}
            className="flex items-center space-x-1 text-[11px] font-mono uppercase tracking-widest text-stone-400 hover:text-neutral-800 transition-colors focus:outline-hidden cursor-pointer"
            title="Scroll to Top"
          >
            <span>Top</span>
            <span>↑</span>
          </button>

        </div>

      </div>
    </footer>
  );
}
