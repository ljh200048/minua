/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, X, ShoppingBag, User as MapUser, ArrowRight, ShieldCheck, Mail, MapPin } from 'lucide-react';
import { DICTIONARY } from '../data';

interface HeaderProps {
  currentLang: 'KO' | 'EN' | 'JP';
  setLang: (lang: 'KO' | 'EN' | 'JP') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  openCart: () => void;
  user: any;
  openMyPage: () => void;
}

export default function Header({
  currentLang,
  setLang,
  activeTab,
  setActiveTab,
  cartCount,
  openCart,
  user,
  openMyPage
}: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const dict = DICTIONARY[currentLang];

  const primaryNavItems = [
    { id: 'all', label: currentLang === 'KO' ? '전체 주얼리' : currentLang === 'JP' ? 'すべてのジュエリー' : 'All Jewelry' },
    { id: 'ring', label: dict.menuRing },
    { id: 'bracelet', label: dict.menuBracelet },
    { id: 'keyring', label: dict.menuKeyring },
    { id: 'gift', label: dict.menuGift },
    { id: 'minua-story', label: dict.menuAttStory },
    { id: 'review', label: dict.menuReview },
  ];

  return (
    <>
      {/* 1. XTe Inspired DUAL Announcement Bars */}
      <div className="w-full bg-neutral-100 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-2.5 text-center text-[10px] sm:text-xs font-sans text-neutral-800 tracking-wider font-light">
          {currentLang === 'KO' && "신규 회원 가입시 적립금 5,000원 지급"}
          {currentLang === 'EN' && "5,000 KRW points instantly credited upon new registration"}
          {currentLang === 'JP' && "新規会員登録で5,000ウォン相当のポイントプレゼント"}
        </div>
      </div>
      <div className="w-full bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 py-2 text-center text-[9.5px] sm:text-xs font-sans font-light tracking-widest text-neutral-200 uppercase">
          {currentLang === 'KO' && "카카오플친 5,000원 적립금 쿠폰 발급"}
          {currentLang === 'EN' && "Add Kakao Friend for a custom 5,000 KRW gift voucher"}
          {currentLang === 'JP' && "LINE公式アカウントお友だち追加で5,000ウォン割引クーポン配布"}
        </div>
      </div>

      {/* 2. Main Luxury Sticky Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-150 py-3 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            
            {/* Left coordinate: Hamburger ☰ + KO EN JP */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              <button
                id="header-hamburger-trigger"
                onClick={() => setDrawerOpen(true)}
                className="p-1 -ml-1 text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer focus:outline-hidden"
                aria-label="Toggle menu"
              >
                <Menu size={20} strokeWidth={1.5} />
              </button>
              
              {/* Language switcher - matches the sleek style in screenshots */}
              <div className="flex items-center space-x-2.5 text-[10px] sm:text-[11px] font-sans tracking-widest">
                {(['KO', 'EN', 'JP'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`transition-colors cursor-pointer py-1 font-sans ${
                      currentLang === l 
                        ? 'font-bold text-neutral-950 underline underline-offset-4 decoration-stone-800' 
                        : 'text-neutral-400 hover:text-neutral-700 font-light'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Center coordinate: Cursive Cursive Brand signature */}
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center">
              <button
                id="logo-brand-btn"
                onClick={() => {
                  setActiveTab('home');
                  setDrawerOpen(false);
                }}
                className="flex flex-col items-center justify-center group focus:outline-hidden cursor-pointer"
              >
                <span className="font-script text-3xl sm:text-4xl text-neutral-950 leading-none lowercase tracking-wide font-normal group-hover:text-amber-800 transition-colors select-none">
                  minua
                </span>
                <span className="text-[7px] sm:text-[8px] tracking-[0.4em] sm:tracking-[0.55em] text-neutral-400 font-sans font-light uppercase mt-0 sm:mt-0.5 leading-none pl-1 transition-all">
                  [per te]
                </span>
              </button>
            </div>

            {/* Right coordinate: Account map icon + Shopping bag icon */}
            <div className="flex items-center space-x-3.5 sm:space-x-4.5">
              
              {/* Profile button */}
              <button
                id="header-profile-log-btn"
                onClick={openMyPage}
                className={`p-1 text-neutral-900 hover:text-amber-800 transition-colors cursor-pointer flex items-center gap-1.5 focus:outline-hidden ${
                  activeTab === 'mypage' ? 'text-amber-800' : ''
                }`}
                title={dict.menuMyPage}
              >
                <MapUser size={20} strokeWidth={1.25} />
                {user && (
                  <span className="hidden sm:inline text-[10px] font-medium tracking-wider text-neutral-600 truncate max-w-[70px]">
                    {user.name}
                  </span>
                )}
              </button>

              {/* Shopping bag button */}
              <button
                id="header-cart-overlay-btn"
                onClick={openCart}
                className="relative p-1 text-neutral-900 hover:text-amber-800 transition-all flex items-center justify-center focus:outline-hidden cursor-pointer"
                title={dict.menuCart}
              >
                <ShoppingBag size={20} strokeWidth={1.25} />
                {cartCount > 0 && (
                  <div role="status" className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-neutral-950 text-white font-mono text-[8px] flex items-center justify-center rounded-full font-bold">
                    {cartCount}
                  </div>
                )}
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* 3. Sleek Luxury Slide-out Sidebar Drawer Navigation */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          
          {/* Backdrop blur overlay */}
          <div 
            className="absolute inset-0 bg-neutral-950/40 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Left slide in drawer container */}
          <div className="absolute inset-y-0 left-0 max-w-full flex">
            <div className="w-80 sm:w-96 bg-white shadow-2xl flex flex-col justify-between py-8 px-6 animate-slideRight transition-transform border-r border-neutral-150">
              
              {/* Top part: logo and close */}
              <div className="space-y-10">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                  <div className="flex flex-col items-start">
                    <span className="font-script text-3xl text-neutral-950 lowercase leading-none">
                      minua
                    </span>
                    <span className="text-[7.5px] tracking-[0.45em] text-neutral-400 uppercase mt-0.5 font-mono">
                      [per te]
                    </span>
                  </div>
                  <button
                    id="sidebar-close-btn"
                    onClick={() => setDrawerOpen(false)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-50 transition-colors cursor-pointer"
                    aria-label="Close sidebar"
                  >
                    <X size={20} strokeWidth={1.5} />
                  </button>
                </div>

                {/* Primary Navigations Link Listing */}
                <nav className="flex flex-col space-y-4">
                  
                  {/* Home view trigger option */}
                  <button
                    onClick={() => {
                      setActiveTab('home');
                      setDrawerOpen(false);
                    }}
                    className={`py-2 text-left text-xs font-mono font-bold tracking-widest uppercase transition-colors grow-0 ${
                      activeTab === 'home' ? 'text-amber-800' : 'text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    [ ATELIER HOME ]
                  </button>

                  <div className="w-6 h-[1px] bg-neutral-200 my-2" />

                  {primaryNavItems.map((item) => (
                    <button
                      key={item.id}
                      id={`sidebar-item-${item.id}`}
                      onClick={() => {
                        setActiveTab(item.id);
                        setDrawerOpen(false);
                      }}
                      className={`group py-2 text-left text-sm font-light tracking-wider transition-colors flex items-center justify-between cursor-pointer ${
                        activeTab === item.id 
                          ? 'text-neutral-950 font-bold border-l-2 border-amber-800 pl-2.5' 
                          : 'text-neutral-600 hover:text-neutral-950 hover:pl-1.5'
                      }`}
                    >
                      <span>{item.label}</span>
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-amber-800 transition-all" />
                    </button>
                  ))}

                  <div className="w-10 h-[1.5px] bg-neutral-200 my-2" />

                  {/* My page & Order tracking */}
                  <button
                    onClick={() => {
                      openMyPage();
                      setDrawerOpen(false);
                    }}
                    className={`py-2 text-left text-xs font-medium tracking-wider uppercase transition-colors flex items-center justify-between cursor-pointer ${
                      activeTab === 'mypage' ? 'text-amber-800 font-semibold' : 'text-neutral-500 hover:text-neutral-950'
                    }`}
                  >
                    <span>{dict.myPageTitle}</span>
                  </button>
                </nav>
              </div>

              {/* Bottom detail summary, policies & language */}
              <div className="space-y-6 pt-8 border-t border-neutral-100">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                    Craft Customer Devotion
                  </h4>
                  <ul className="space-y-2 text-[11px] font-light text-neutral-500">
                    <li className="flex items-center gap-2">
                      <ShieldCheck size={12} className="text-amber-700 shrink-0" />
                      <span>{currentLang === 'KO' ? "실버 925 알레르기 안심 케어" : currentLang === 'JP' ? "シルバー925 アレルギー対応素材" : "925 Pure Sterling Anti-allergic"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Mail size={12} className="text-amber-700 shrink-0" />
                      <span>CS: minua_jewelry@gmail.com</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin size={12} className="text-amber-700 shrink-0" />
                      <span>Seoul High-End Design Studio</span>
                    </li>
                  </ul>
                </div>

                {/* Footnote copyright */}
                <div className="text-[9px] text-neutral-400 leading-normal font-light">
                  © 2026 MINUA Atelier Corp. All rights reserved. Registered boutique in Seoul.
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
