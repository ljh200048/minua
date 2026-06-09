/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HelpCircle, Check, Truck, Sparkles, Heart, Camera } from 'lucide-react';
import { DICTIONARY } from '../data';
import { Product, CartItem } from '../types';

interface ProductDetailModalProps {
  currentLang: 'KO' | 'EN' | 'JP';
  product: Product;
  onClose: () => void;
  onAddToCart: (item: Omit<CartItem, 'id' | 'quantity'>, count: number) => void;
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  onImageChange?: (base64Url: string) => void;
}

export default function ProductDetailModal({
  currentLang,
  product,
  onClose,
  onAddToCart,
  wishlist,
  onToggleWishlist,
  onImageChange
}: ProductDetailModalProps) {
  const dict = DICTIONARY[currentLang];
  
  // Option selection states
  const [selectedSize, setSelectedSize] = React.useState(product.options.sizes?.[0] || '');
  const [selectedColor, setSelectedColor] = React.useState(product.options.colors?.[0] || '');
  const [selectedCharms, setSelectedCharms] = React.useState<string[]>([]);
  const [engravingText, setEngravingText] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);

  const [showSizeGuide, setShowSizeGuide] = React.useState(false);
  const [cartSuccess, setCartSuccess] = React.useState(false);

  const isWished = wishlist.includes(product.id);

  // Computes supplementary customization prices on the fly!
  const getSubCustomizedPrice = () => {
    let extra = 0;
    
    // Check color premium (+₩2,000 / 3,000)
    if (selectedColor.includes('+₩')) {
      const match = selectedColor.match(/\+₩([\d,]+)/);
      if (match && match[1]) {
        extra += parseInt(match[1].replace(/,/g, ''), 10);
      }
    }
    
    // Check charms premium (+₩4,000 / 5,000 / 6,000 etc.)
    selectedCharms.forEach((ch) => {
      const match = ch.match(/\+₩([\d,]+)/);
      if (match && match[1]) {
        extra += parseInt(match[1].replace(/,/g, ''), 10);
      }
    });

    return product.price + extra;
  };

  const currentPrice = getSubCustomizedPrice();

  const handleCharmToggle = (charmName: string) => {
    if (selectedCharms.includes(charmName)) {
      setSelectedCharms(selectedCharms.filter(c => c !== charmName));
    } else {
      setSelectedCharms([...selectedCharms, charmName]);
    }
  };

  const handleAddToCartSubmit = () => {
    onAddToCart({
      product,
      selectedSize: product.options.sizes ? selectedSize : undefined,
      selectedColor: product.options.colors ? selectedColor : undefined,
      selectedCharms: selectedCharms.length > 0 ? selectedCharms : undefined,
      engravingText: product.options.hasEngraving && engravingText ? engravingText : undefined
    }, quantity);

    setCartSuccess(true);
    setTimeout(() => {
      setCartSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div id="product-detail-modal-bg" className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col md:flex-row relative animate-scaleIn max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible">
        
        {/* Absolute modal close */}
        <button
          id="close-detail-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-stone-400 hover:text-stone-900 bg-white/85 hover:bg-white p-2 rounded-full shadow-xs cursor-pointer text-xs font-bold leading-none"
        >
          ✕
        </button>

        {/* Column A: Fluid visual galleries */}
        <div className="flex-1 bg-stone-50 min-h-[300px] md:min-h-none flex items-center justify-center relative p-6 md:p-10 border-b md:border-b-0 md:border-r border-stone-150 shrink-0">
          {/* public/images 폴더 내에 실제 이미지 파일이 있어야 온전히 이미지가 렌더링됩니다. */}
          <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-xs relative bg-white flex items-center justify-center">
            {/* Direct Image Swap Controller for store owners/users */}
            {onImageChange && (
              <label className="absolute top-4 left-4 z-20 bg-stone-900/95 hover:bg-amber-900 text-white rounded-full px-3 py-1.5 cursor-pointer shadow-md transition-colors flex items-center gap-1.5 text-[10px] font-mono tracking-wider font-semibold">
                <Camera size={13} />
                <span>{currentLang === 'KO' ? '이미지 변경' : 'Change Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        onImageChange(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}

            <img
              src={product.defaultImage}
              alt={product.nameEN}
              className={`w-full h-full ${product.category === 'ring' || product.category === 'keyring' ? 'object-contain p-6 bg-[#FCFAF7]' : 'object-cover'} select-none absolute inset-0 font-sans`}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            {/* Beautiful Fallback block to ensure product detail layout stays pristine even if images are missing */}
            <div
              style={{ display: 'none' }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 p-6 text-center select-none"
            >
              <Sparkles size={24} className="text-amber-700/60 animate-pulse mb-3" />
              <span className="text-sm font-semibold text-stone-800 tracking-tight">
                {currentLang === 'KO' ? product.nameKO : product.nameEN}
              </span>
              <span className="text-xs font-mono text-stone-400 mt-1 bg-stone-200/45 px-2 py-0.5 rounded-sm">
                {product.defaultImage}
              </span>
              <p className="text-xs text-amber-900 bg-amber-50 border border-amber-100 font-semibold px-3 py-1 rounded-full mt-4 max-w-xs leading-normal">
                {currentLang === 'KO' 
                  ? 'public/images/ 폴더에서 실제 이미지 파일을 확인해주세요' 
                  : 'Check the real file inside public/images/'}
              </p>
            </div>
            
            {/* Absolute floating category label */}
            <span className="absolute bottom-4 left-4 bg-stone-900/85 backdrop-blur-xs text-white text-[10px] font-mono tracking-widest font-semibold px-3 py-1 rounded-sm uppercase z-10">
              {product.category}
            </span>
          </div>
        </div>

        {/* Column B: Purchase config & options details selectors */}
        <div className="flex-1 p-6 sm:p-10 space-y-6 overflow-y-auto md:max-h-[85vh]">
          <div>
            <h3 className="text-2xl font-bold font-sans text-stone-900 leading-tight">
              {currentLang === 'KO' ? product.nameKO : product.nameEN}
            </h3>
            
            {/* Price section featuring real customized incrementations */}
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-xl font-mono font-bold text-amber-900">
                ₩{currentPrice.toLocaleString()}
              </span>
              <span className="text-xs text-stone-400 font-light select-none">VAT Reflected</span>
            </div>
          </div>

          <p className="text-stone-600 text-xs sm:text-sm font-light leading-relaxed">
            {currentLang === 'KO' ? product.descriptionKO : product.descriptionEN}
          </p>

          {/* Core materials description info card */}
          <div className="bg-stone-50 border border-stone-200/50 p-4 rounded-xl text-xs space-y-1">
            <span className="font-semibold text-stone-700 block">{dict.materialLabel}</span>
            <span className="text-stone-500 font-light font-mono">
              {currentLang === 'KO' ? product.materialKO : product.materialEN}
            </span>
          </div>

          {/* DYNAMIC OPTION SELECTIONS */}
          <div className="space-y-4">
            
            {/* 1. SIZES SELECTOR ON-THE-FLY WITH RING SIZE HELPER */}
            {product.options.sizes && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider block">
                    {dict.sizeLabel} *
                  </label>
                  <button
                    id="trigger-size-guide-modal"
                    onClick={() => setShowSizeGuide(!showSizeGuide)}
                    className="text-[10px] font-mono flex items-center gap-1 text-stone-400 hover:text-amber-800 focus:outline-hidden"
                  >
                    <HelpCircle size={12} />
                    <span>{currentLang === 'KO' ? '사이즈 조언' : 'Sizing Chart'}</span>
                  </button>
                </div>

                {showSizeGuide && (
                  <div className="p-3.5 bg-amber-50/50 border border-amber-200 text-[10.5px] leading-relaxed text-stone-600 rounded-xl space-y-1 animate-fadeIn font-light">
                    <span className="font-bold text-amber-900 flex items-center gap-1">
                      <Sparkles size={11} />
                      {dict.sizeGuideTitle}
                    </span>
                    <p>{dict.sizeGuideText}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {product.options.sizes.map((sz) => (
                    <button
                      key={sz}
                      id={`sizekey-${sz}`}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-3.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                        selectedSize === sz
                          ? 'bg-stone-900 border-stone-900 text-white shadow-2xs'
                          : 'bg-white border-stone-200 text-stone-500 hover:border-stone-400'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. COLORS SELECTOR */}
            {product.options.colors && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider block">
                  {dict.colorLabel} *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {product.options.colors.map((col) => (
                    <button
                      key={col}
                      id={`colorkey-${col.split(' ')[0]}`}
                      onClick={() => setSelectedColor(col)}
                      className={`text-left px-3 py-2 rounded-lg border text-xs font-sans transition-all cursor-pointer flex items-center justify-between ${
                        selectedColor === col
                          ? 'bg-stone-900 border-stone-900 text-stone-100 font-bold'
                          : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-400'
                      }`}
                    >
                      <span>{col.split(' ')[0]}</span>
                      {col.includes('+₩') && (
                        <span className="font-mono text-[10px] text-amber-500">
                          {col.match(/\+₩([\d,]+)/)?.[0]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. CHARMS ATTACHMENT LIST ONLY FOR KEYRINGS FEATURE */}
            {product.options.charms && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider block">
                  {dict.charmsLabel}
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {product.options.charms.map((ch) => {
                    const isAttached = selectedCharms.includes(ch);
                    return (
                      <button
                        key={ch}
                        id={`charmkey-${ch.split(' ')[0]}`}
                        onClick={() => handleCharmToggle(ch)}
                        className={`text-left px-3 py-2 rounded-lg border text-xs font-sans transition-all cursor-pointer flex items-center justify-between ${
                          isAttached
                            ? 'bg-amber-50/50 border-amber-500 text-amber-900 font-bold'
                            : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className={`w-3.5 h-3.5 rounded-full border border-stone-300 flex items-center justify-center p-0.5 ${isAttached ? 'bg-amber-500 border-amber-500 text-stone-950 font-bold' : ''}`}>
                            {isAttached && <Check size={8} />}
                          </div>
                          <span>{ch.split(' (+')[0]}</span>
                        </div>
                        <span className="font-mono text-[10px] text-stone-500">
                          {ch.match(/\+₩([\d,]+)/)?.[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. CUSTOM PERSONAL ENGRAVING TEXT AREA */}
            {product.options.hasEngraving && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider block">
                  {dict.engravingLabel}
                </label>
                <input
                  type="text"
                  maxLength={10}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 bg-stone-50"
                  placeholder={dict.engravingPlaceholder}
                  value={engravingText}
                  onChange={(e) => setEngravingText(e.target.value)}
                />
              </div>
            )}

            {/* 5. QUANTITIES TRACKER */}
            <div className="flex items-center justify-between bg-stone-50 border border-stone-150 p-3 rounded-xl">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider font-mono">
                {currentLang === 'KO' ? '수량 선택하기' : 'Order Quantity'}
              </span>
              <div className="flex items-center space-x-3 border border-stone-200 rounded-lg p-1 bg-white">
                <button
                  id="qty-minus-btn"
                  onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                  className="p-1 rounded-sm text-stone-500 hover:bg-stone-150 cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  ✕
                </button>
                <span className="text-xs font-mono font-bold text-stone-850 px-2 select-none">
                  {quantity}
                </span>
                <button
                  id="qty-plus-btn"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 rounded-sm text-stone-500 hover:bg-stone-150 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  ＋
                </button>
              </div>
            </div>

          </div>

          {/* Core Dispatch details */}
          <div id="booking-assurance-card" className="flex items-start gap-2 text-xs text-stone-400 font-light border-t border-stone-150 pt-5 leading-normal">
            <Truck size={14} className="text-amber-800 shrink-0 mt-0.5" />
            <p className="text-[11px]">{dict.careGuideText}</p>
          </div>

          {/* Bottom triggering button row */}
          <div className="flex items-center gap-3 pt-3 border-t border-stone-150">
            <button
              id="wishlist-toggle-modal-btn"
              onClick={() => onToggleWishlist(product.id)}
              className={`p-3 border rounded-xl cursor-pointer transition-colors flex items-center justify-center ${
                isWished
                  ? 'bg-pink-50 border-pink-200 text-pink-600'
                  : 'bg-white border-stone-250 text-stone-400 hover:text-stone-700 hover:border-stone-400'
              }`}
              title="Add to Wishlist"
            >
              <Heart size={18} fill={isWished ? 'currentColor' : 'none'} />
            </button>

            <button
              id="add-to-cart-action-btn"
              onClick={handleAddToCartSubmit}
              disabled={cartSuccess}
              className="flex-1 py-3 text-xs font-mono font-bold uppercase tracking-widest text-center rounded-xl bg-stone-900 text-stone-50 hover:bg-amber-900 cursor-pointer transition-colors"
            >
              <span>{cartSuccess ? (currentLang === 'KO' ? '보존 완료✓' : 'Added Successfully✓') : dict.btnAddCart}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
