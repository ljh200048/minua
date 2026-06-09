/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trash2, Plus, Minus, Gift, Truck, CreditCard, Lock, ArrowLeft, Check, Copy } from 'lucide-react';
import { DICTIONARY } from '../data';
import { CartItem, Order } from '../types';

interface CartAndCheckoutProps {
  currentLang: 'KO' | 'EN' | 'JP';
  cart: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onPlaceOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => void;
  onClose: () => void;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
}

export default function CartAndCheckout({
  currentLang,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  onClose,
  activeOrder,
  setActiveOrder
}: CartAndCheckoutProps) {
  const dict = DICTIONARY[currentLang];
  const [step, setStep] = React.useState<'cart' | 'checkout'>('cart');
  
  // Checkout details form states
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [zipCode, setZipCode] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [addressDetail, setAddressDetail] = React.useState('');
  const [memo, setMemo] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('bank');

  // Gift wrapping states
  const [giftWrappingEnabled, setGiftWrappingEnabled] = React.useState(false);
  const [giftWrappingType, setGiftWrappingType] = React.useState<'basic' | 'premium'>('basic');
  const [giftCardMessage, setGiftCardMessage] = React.useState('');

  const [copiedCode, setCopiedCode] = React.useState(false);

  const totalItemCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const itemsPrice = cart.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0);
  
  // Free delivery for orders above ₩50,000 OR if premium wrapping is chosen!
  const hasFreeShipping = itemsPrice >= 50000;
  const shippingCharge = (itemsPrice === 0 || hasFreeShipping) ? 0 : 3000;
  const giftWrappingCharge = (giftWrappingEnabled && giftWrappingType === 'premium') ? 5000 : 0;
  const grandTotal = itemsPrice + shippingCharge + giftWrappingCharge;

  // Handles copying the order ID on the success page
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address) {
      alert(currentLang === 'KO' ? '주문 수령지 정보를 기입해 주세요.' : 'Please fully fill in the shipping forms.');
      return;
    }

    onPlaceOrder({
      items: cart,
      shippingAddress: {
        name,
        phone,
        zipCode,
        address,
        addressDetail,
        memo
      },
      giftWrapping: {
        enabled: giftWrappingEnabled,
        type: giftWrappingType,
        messageCard: giftCardMessage || undefined
      },
      totalAmount: grandTotal,
      paymentMethod
    });
  };

  const clearFormAndReset = () => {
    setName('');
    setPhone('');
    setAddress('');
    setZipCode('');
    setAddressDetail('');
    setMemo('');
    setGiftWrappingEnabled(false);
    setGiftCardMessage('');
    setActiveOrder(null);
    onClose();
  };

  return (
    <div id="cart-drawer-layer" className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full flex flex-col justify-between shadow-2xl relative animate-slideLeft">
        
        {/* Header section with closing toggler */}
        <div className="px-6 py-5 border-b border-stone-150 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-2">
            <button
              id="back-step-btn"
              onClick={() => {
                if (step === 'checkout') {
                  setStep('cart');
                } else {
                  onClose();
                }
              }}
              className="p-1 rounded-full text-stone-500 hover:bg-stone-200 transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-base font-semibold text-stone-900 uppercase font-mono tracking-widest">
              {activeOrder 
                ? (currentLang === 'KO' ? '주문 생성 성공' : 'Order Authorized') 
                : (step === 'cart' ? dict.cartTitle : dict.checkoutTitle)}
            </h2>
          </div>
          
          {!activeOrder && (
            <button
              id="header-cart-close"
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 font-mono text-xs cursor-pointer p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dynamic content panel body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          
          {/* SUCCESS SCREEN */}
          {activeOrder ? (
            <div id="order-success-screen" className="text-center py-10 space-y-8 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Check size={32} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-stone-900 font-sans">
                  {dict.orderSuccessTitle}
                </h3>
                <p className="text-stone-500 text-sm font-light max-w-md mx-auto leading-relaxed">
                  {dict.orderSuccessDesc}
                </p>
              </div>

              {/* Order Tracking Code Display */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 max-w-md mx-auto space-y-4">
                <span className="text-[10px] font-mono tracking-wider text-stone-400 block uppercase">
                  {dict.orderCodeLabel}
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-mono font-bold text-amber-900 tracking-wider">
                    {activeOrder.id}
                  </span>
                  <button
                    id="copy-order-code-btn"
                    onClick={() => handleCopyCode(activeOrder.id)}
                    className="p-1.5 hover:bg-stone-100 rounded-md text-stone-500 transition-colors cursor-pointer"
                    title="Copy Order Code"
                  >
                    {copiedCode ? <span className="text-[10px] text-emerald-600 font-bold">Copied</span> : <Copy size={13} />}
                  </button>
                </div>
                <p className="text-[10px] text-stone-400 leading-normal font-light">
                  {currentLang === 'KO' 
                    ? '* 이 이메일과 주문 코드를 마이페이지나 상단 [마이페이지]에 입력하시면 수제 제작 준비 및 우체국 안심 배송 처리 여부를 24시간 실시간 트래커로 조회하실 수 있습니다!'
                    : '* Provide this tracking code on the [My Orders] dashboard to inspect our real-time hand-finishing or postage dispatch pipeline!'}
                </p>
              </div>

              {/* Reset controls */}
              <button
                id="reset-shop-btn"
                onClick={clearFormAndReset}
                className="px-8 py-3 bg-stone-900 hover:bg-stone-950 text-white font-mono text-xs uppercase tracking-widest font-bold rounded-lg cursor-pointer"
              >
                {currentLang === 'KO' ? '쇼핑 홈으로 돌아가기' : 'Back to Shopping'}
              </button>
            </div>
          ) : step === 'cart' ? (
            
            /* CART ITEM LIST SCREEN */
            cart.length === 0 ? (
              <div id="empty-cart-screen" className="text-center py-20 space-y-4">
                <p className="text-stone-400 text-sm font-light max-w-sm mx-auto">
                  {dict.emptyCart}
                </p>
              </div>
            ) : (
              <div id="cart-items-panel" className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    id={`cart-item-${item.id}`}
                    className="flex justify-between items-start gap-4 p-4 rounded-xl border border-stone-150 shadow-2xs hover:border-stone-300 transition-colors bg-white"
                  >
                    <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-100 relative flex items-center justify-center">
                      <img 
                        src={item.product.defaultImage} 
                        alt={item.product.nameEN} 
                        className={`w-full h-full ${item.product.category === 'ring' || item.product.category === 'keyring' ? 'object-contain p-1.5 bg-[#FCFAF7]' : 'object-cover'} absolute inset-0`} 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      {/* Quiet elegant minimalist tiny fallback */}
                      <div
                        style={{ display: 'none' }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-stone-100 text-[8px] font-mono leading-none tracking-tight text-stone-400 p-1 text-center font-semibold"
                      >
                        NO IMAGE
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between">
                        <h4 className="text-sm font-medium font-sans text-stone-950">
                          {currentLang === 'KO' ? item.product.nameKO : item.product.nameEN}
                        </h4>
                        <span className="text-xs font-mono font-bold text-stone-950">
                          ₩{(item.product.price * item.quantity).toLocaleString()}
                        </span>
                      </div>

                      {/* Display customized values */}
                      <div className="text-[11px] font-mono font-light text-stone-500 space-y-1">
                        {item.selectedSize && (
                          <p>• {dict.sizeLabel}: {item.selectedSize}</p>
                        )}
                        {item.selectedColor && (
                          <p>• {dict.colorLabel}: {item.selectedColor}</p>
                        )}
                        {item.selectedCharms && item.selectedCharms.length > 0 && (
                          <p>• {dict.charmsLabel}: {item.selectedCharms.join(', ')}</p>
                        )}
                        {item.engravingText && (
                          <p className="text-amber-800 font-medium">• {dict.engravingLabel}: "{item.engravingText}"</p>
                        )}
                      </div>

                      {/* Item update and delete trigger row */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-2 border border-stone-200 rounded-sm p-0.5 bg-stone-50">
                          <button
                            id={`qty-dec-${item.id}`}
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="p-1 rounded-sm text-stone-500 hover:bg-stone-200 focus:outline-hidden"
                            aria-label={`Decrease quantity of ${currentLang === 'KO' ? item.product.nameKO : item.product.nameEN}`}
                          >
                            <Minus size={11} />
                          </button>
                          <span className="text-xs font-mono font-bold text-stone-850 px-1">
                            {item.quantity}
                          </span>
                          <button
                            id={`qty-inc-${item.id}`}
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="p-1 rounded-sm text-stone-500 hover:bg-stone-200 focus:outline-hidden"
                            aria-label={`Increase quantity of ${currentLang === 'KO' ? item.product.nameKO : item.product.nameEN}`}
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <button
                          id={`qty-del-${item.id}`}
                          onClick={() => onRemoveItem(item.id)}
                          className="text-stone-400 hover:text-red-500 cursor-pointer p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                    </div>
                  </div>
                ))}

                {/* Sub Total summary for items */}
                <div className="border-t border-stone-200 pt-6 space-y-3 font-sans">
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>{dict.totalPrice} ({totalItemCount} items)</span>
                    <span className="font-mono">₩{itemsPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>{dict.shippingFee}</span>
                    <span className="font-mono">
                      {shippingCharge > 0 ? `₩${shippingCharge.toLocaleString()}` : dict.freeShipping}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-stone-900 border-t border-stone-100 pt-3">
                    <span>{dict.subTotal}</span>
                    <span className="font-mono text-base text-amber-900">₩{itemsPrice > 0 ? (itemsPrice + shippingCharge).toLocaleString() : 0}</span>
                  </div>
                </div>

                {/* Secure purchase advice */}
                <div className="bg-stone-50 border border-stone-100 rounded-xl p-4 flex items-start gap-2.5">
                  <Truck size={16} className="text-amber-800 self-start mt-0.5" />
                  <p className="text-[11px] text-stone-500 leading-relaxed font-light">
                    {dict.shippingGuideText}
                  </p>
                </div>
              </div>
            )

          ) : (
            
            /* SECURE CHECKOUT FORM SCREEN */
            <form id="checkout-clearance-form" onSubmit={handleOrderSubmit} className="space-y-6">
              <h3 className="text-stone-900 font-sans font-medium text-sm border-b border-stone-150 pb-2">
                01. {currentLang === 'KO' ? '수령인 배송지 작성' : 'Shipping Coordinates'}
              </h3>

              <div className="space-y-3 text-stone-850">
                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-stone-600 block uppercase">
                      {dict.senderName} *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden bg-stone-50"
                      placeholder="e.g. 홍길동"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-stone-600 block uppercase">
                      {dict.senderPhone} *
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden bg-stone-50"
                      placeholder="e.g. 010-1234-5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* ZIP & Address Line */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-[10px] font-mono font-bold text-stone-600 block uppercase">
                      {dict.zipCode}
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden bg-stone-50"
                      placeholder="04536"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-mono font-bold text-stone-600 block uppercase">
                      {dict.addressInput} *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden bg-stone-50"
                      placeholder="e.g. 서울시 강남구 테헤란로 123"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Address Detail */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-stone-600 block uppercase">
                    {dict.addressDetail}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden bg-stone-50"
                    placeholder="e.g. 101동 202호"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                  />
                </div>

                {/* Logistics Memo */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-stone-600 block uppercase">
                    {dict.shippingMemo}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden bg-stone-50"
                    placeholder={currentLang === 'KO' ? '부재시 문 앞에 놓아주세요.' : 'Leave with manager if absent'}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                  />
                </div>
              </div>

              {/* GIFT WRAPPING SECTION */}
              <div id="gift-wrapping-enclosure" className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Gift className="text-amber-800" size={16} />
                    <span className="text-xs font-semibold text-stone-900 font-sans">
                      {dict.giftWrapOptionTitle}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="enable-giftwrap-check"
                    checked={giftWrappingEnabled}
                    onChange={(e) => setGiftWrappingEnabled(e.target.checked)}
                    className="w-4 h-4 text-amber-700 bg-stone-100 border-stone-300 rounded-sm cursor-pointer"
                  />
                </div>

                {giftWrappingEnabled && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer text-stone-800">
                        <input
                          type="radio"
                          name="wrap-tier"
                          checked={giftWrappingType === 'basic'}
                          onChange={() => setGiftWrappingType('basic')}
                          className="w-3.5 h-3.5 text-stone-900"
                        />
                        <span>{dict.giftWrapBasic}</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer text-stone-800">
                        <input
                          type="radio"
                          name="wrap-tier"
                          checked={giftWrappingType === 'premium'}
                          onChange={() => setGiftWrappingType('premium')}
                          className="w-3.5 h-3.5 text-stone-900"
                        />
                        <span>{dict.giftWrapPremium}</span>
                      </label>
                    </div>

                    <div className="space-y-1">
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden bg-white"
                        placeholder={dict.giftCardPlaceholder}
                        value={giftCardMessage}
                        onChange={(e) => setGiftCardMessage(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* PAYMENT PROCEDURES */}
              <div className="space-y-3">
                <h3 className="text-stone-900 font-sans font-medium text-sm border-b border-stone-150 pb-2">
                  02. {dict.paymentMethodLabel}
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 border border-stone-200 rounded-xl cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors">
                    <div className="flex items-center space-x-2 text-xs font-medium text-stone-850">
                      <input
                        type="radio"
                        name="pay-opt"
                        checked={paymentMethod === 'bank'}
                        onChange={() => setPaymentMethod('bank')}
                        className="w-4.5 h-4.5 text-stone-900"
                      />
                      <span>{dict.payBankTransfer}</span>
                    </div>
                  </label>
                  <label className="flex items-center justify-between p-3 border border-stone-200 rounded-xl cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors">
                    <div className="flex items-center space-x-2 text-xs font-medium text-stone-850">
                      <input
                        type="radio"
                        name="pay-opt"
                        checked={paymentMethod === 'kakao'}
                        onChange={() => setPaymentMethod('kakao')}
                        className="w-4.5 h-4.5 text-stone-900"
                      />
                      <span>{dict.payKakao}</span>
                    </div>
                  </label>
                  <label className="flex items-center justify-between p-3 border border-stone-200 rounded-xl cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors">
                    <div className="flex items-center space-x-2 text-xs font-medium text-stone-850">
                      <input
                        type="radio"
                        name="pay-opt"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="w-4.5 h-4.5 text-stone-900"
                      />
                      <span className="flex items-center gap-1">
                        <CreditCard size={13} />
                        <span>{dict.payCard}</span>
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* ORDER COST ANALYSIS SUMMARY */}
              <div className="bg-stone-50 border border-stone-150 rounded-2xl p-5 space-y-2 text-xs font-sans text-stone-600">
                <div className="flex justify-between">
                  <span>{currentLang === 'KO' ? '주문 총 제품가' : 'Total Items Cost'}</span>
                  <span className="font-mono text-stone-900">₩{itemsPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>{dict.shippingFee}</span>
                  <span className="font-mono text-stone-900">
                    {shippingCharge > 0 ? `₩${shippingCharge.toLocaleString()}` : (currentLang === 'KO' ? '무료' : 'Free')}
                  </span>
                </div>
                {giftWrappingEnabled && (
                  <div className="flex justify-between text-amber-900 font-medium">
                    <span>{currentLang === 'KO' ? '기프트 포장 추가' : 'Gift Packing Fee'}</span>
                    <span className="font-mono">₩{giftWrappingCharge.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold text-stone-950 pt-2 border-t border-stone-200">
                  <span>{currentLang === 'KO' ? '수령 최종 결제액' : 'Grand Total Due'}</span>
                  <span className="text-base text-amber-900 font-mono">₩{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Simulated transaction safety warning */}
              <div className="bg-amber-50/40 border border-amber-200 text-[10px] text-amber-900 rounded-lg p-3 flex gap-2">
                <Lock size={15} className="shrink-0" />
                <p>
                  {currentLang === 'KO' 
                    ? '* 본 사이트는 미누아(MINUA) 모형 포트폴리오 스튜디오입니다. 실제 현금 결제나 카드 승인 없이 안전한 모형 테스트 결제가 정상적으로 진행됩니다.' 
                    : '* This is a simulated high-fidelity craft storefront. Safe sandbox checkout executes completely without real funds.'}
                </p>
              </div>

              {/* Place Order submit button */}
              <button
                type="submit"
                id="place-simulated-order-btn"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold font-mono tracking-widest text-xs uppercase text-center rounded-xl cursor-pointer transition-colors shadow-sm"
              >
                {dict.placeOrderBtn}
              </button>
            </form>
          )}

        </div>

        {/* Footer actions for navigation */}
        {!activeOrder && step === 'cart' && cart.length > 0 && (
          <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/80">
            <button
              id="proceed-checkout-btn"
              onClick={() => setStep('checkout')}
              className="w-full py-3 bg-stone-900 hover:bg-amber-900 text-white rounded-xl text-center font-mono font-bold tracking-widest text-xs uppercase cursor-pointer transition-colors"
            >
              {dict.btnOrderNow}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
