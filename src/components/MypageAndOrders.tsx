/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mail, CheckCircle2, User as CardUser, LogOut, Package, RefreshCw, Eye } from 'lucide-react';
import { DICTIONARY } from '../data';
import { Order, User } from '../types';

interface MypageAndOrdersProps {
  currentLang: 'KO' | 'EN' | 'JP';
  orders: Order[];
  loggedInUser: User | null;
  onLogin: (email: string, name: string) => void;
  onLogout: () => void;
  setActiveTab: (tab: string) => void;
}

export default function MypageAndOrders({
  currentLang,
  orders,
  loggedInUser,
  onLogin,
  onLogout,
  setActiveTab
}: MypageAndOrdersProps) {
  const dict = DICTIONARY[currentLang];
  
  // Login form states
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);

  // Search input for non-member tracking
  const [trackOrderId, setTrackOrderId] = React.useState('');
  const [searchedOrder, setSearchedOrder] = React.useState<Order | null>(null);
  const [searchError, setSearchError] = React.useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    onLogin(email, name);
    // Reset fields
    setEmail('');
    setName('');
  };

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackOrderId) return;
    const match = orders.find(o => o.id === trackOrderId.trim());
    if (match) {
      setSearchedOrder(match);
      setSearchError('');
    } else {
      setSearchedOrder(null);
      setSearchError(currentLang === 'KO' ? '해당 코드로 등록된 주문이 존재하지 않습니다.' : 'No associated order matches this log code.');
    }
  };

  // Filter orders by log-in user's contact details or simulate mock client listings
  const userOrders = loggedInUser 
    ? orders.filter(o => o.shippingAddress.name === loggedInUser.name) 
    : [];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return dict.statusPending;
      case 'preparing': return dict.statusPreparing;
      case 'shipping': return dict.statusShipping;
      case 'delivered': return dict.statusDelivered;
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'preparing': return 'bg-indigo-100 text-indigo-800 animate-pulse';
      case 'shipping': return 'bg-sky-100 text-sky-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-stone-100 text-stone-800';
    }
  };

  return (
    <div id="mypage-order-tracker" className="bg-stone-50 py-16 sm:py-24 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Editorial Sub Header */}
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl font-semibold tracking-tight text-stone-900 font-sans">
            {dict.myPageTitle}
          </h2>
          <p className="text-stone-500 text-xs font-light tracking-wide max-w-md mx-auto leading-relaxed">
            {dict.myPageSubtitle}
          </p>
        </div>

        {/* LOGGED IN USER VIEW */}
        {loggedInUser ? (
          <div id="logged-in-profile-view" className="space-y-8 animate-fadeIn">
            
            {/* Minimal profile badge */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-stone-900 text-stone-100 flex items-center justify-center font-bold text-lg shadow-inner">
                  {loggedInUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <span>{loggedInUser.name}</span>
                    <span className="text-[10px] text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full font-mono font-semibold uppercase tracking-wider">
                      Essential Member
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 font-mono tracking-wide">{loggedInUser.email}</p>
                </div>
              </div>

              <button
                id="profile-logout-btn"
                onClick={onLogout}
                className="px-4.5 py-2 border border-stone-200 text-stone-500 text-xs font-medium font-mono hover:bg-stone-100 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 focus:outline-hidden"
              >
                <LogOut size={13} />
                <span>{dict.btnLogout}</span>
              </button>
            </div>

            {/* Dynamic Registered user past order timeline */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold tracking-wide text-stone-900 uppercase font-mono border-b border-stone-200 pb-2">
                Order History / 주문 내역 ({userOrders.length})
              </h4>

              {userOrders.length === 0 ? (
                <div className="bg-white border border-stone-200/50 rounded-2xl p-12 text-center space-y-4">
                  <Package className="text-stone-300 mx-auto" size={32} />
                  <p className="text-xs text-stone-400 font-light max-w-xs mx-auto leading-normal">
                    {currentLang === 'KO' 
                      ? '아직 주문 내역이 존재하지 않습니다. 미누아 주얼리를 메인 스토어에서 선택해 실시간 제작에 맡겨보세요!'
                      : 'No current handcrafted orders correspond under your member name.'}
                  </p>
                  <button
                    id="member-go-shop"
                    onClick={() => setActiveTab('all')}
                    className="text-xs font-mono font-bold text-amber-800 hover:text-amber-950 underline underline-offset-4"
                  >
                    {currentLang === 'KO' ? '주얼리 컬렉션 바로가기' : 'Go Shop Collections'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userOrders.map((ord) => (
                    <div
                      key={ord.id}
                      id={`client-order-card-${ord.id}`}
                      className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs hover:border-stone-300 transition-colors"
                    >
                      <div className="px-6 py-4.5 bg-stone-50 border-b border-stone-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-stone-850">
                        <div className="space-y-1">
                          <p className="text-xs text-stone-400 font-mono font-medium">Order code</p>
                          <p className="text-xs font-mono font-bold text-amber-900 tracking-wide">{ord.id}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`text-xs px-3 py-1 rounded-full font-mono font-semibold tracking-wide ${getStatusColor(ord.status)}`}>
                            {getStatusLabel(ord.status)}
                          </span>
                          <span className="text-xs font-mono text-stone-550">{ord.createdAt}</span>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        {/* Items listed */}
                        <div className="space-y-3">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-xs font-medium text-stone-850">
                              <span>
                                {currentLang === 'KO' ? it.product.nameKO : it.product.nameEN} ({it.quantity}개)
                              </span>
                              <span className="font-mono">₩{(it.product.price * it.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        {/* Gift Wrap sub */}
                        {ord.giftWrapping.enabled && (
                          <div className="p-3 bg-amber-50/50 rounded-lg text-[11px] text-stone-500 font-light max-w-xl">
                            🎁 [특별 선물 포장]: {ord.giftWrapping.type === 'premium' ? '프리미엄 묶음 리본 상자 (+₩5,000)' : '무료 에센셜 린넨 백'}
                            {ord.giftWrapping.messageCard && (
                              <p className="mt-1 text-amber-900 italic font-medium">Card: "{ord.giftWrapping.messageCard}"</p>
                            )}
                          </div>
                        )}

                        <div className="border-t border-stone-150 pt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs font-sans text-stone-600">
                          <div>
                            <p>수령인: {ord.shippingAddress.name} ({ord.shippingAddress.phone})</p>
                            <p className="font-light mt-0.5">배송처: {ord.shippingAddress.address} {ord.shippingAddress.addressDetail}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-stone-400 font-mono block">Grand Total Paid</span>
                            <span className="text-sm font-mono font-bold text-amber-900">₩{ord.totalAmount.toLocaleString()}</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          
          /* SIGN-IN OR TRACKING VISUAL PANEL */
          <div id="anonymous-portal" className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-fadeIn">
            
            {/* 회원가입 / 로그인 폼 */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold tracking-wide text-stone-950 uppercase font-mono">
                  {dict.loginTitle}
                </h3>
                <p className="text-xs text-stone-500 font-light">
                  {dict.loginDesc}
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4 text-stone-850">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-stone-500 block uppercase">
                    {dict.nameLabel} *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs border border-stone-200 bg-stone-50 rounded-lg focus:outline-hidden"
                    placeholder="이름 입력 (예: 홍길동)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-stone-500 block uppercase">
                    {dict.emailLabel} *
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 text-xs border border-stone-200 bg-stone-50 rounded-lg focus:outline-hidden"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                  <span className="text-[10px] text-stone-400 leading-relaxed font-light block">
                    {dict.nonMemberAlert}
                  </span>
                </div>

                <button
                  type="submit"
                  id="anonymous-login-action"
                  className="w-full py-2.5 bg-stone-900 hover:bg-stone-950 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-lg cursor-pointer transition-colors text-center"
                >
                  {dict.btnLogin}
                </button>
              </form>
            </div>

            {/* 비회원 주문 코드 1회성 실시간 일치 조회 패널 */}
            <div className="bg-stone-900 text-stone-100 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold tracking-wide text-amber-400 uppercase font-mono">
                  {currentLang === 'KO' ? '비회원 간편 주문 조회' : 'Non-Member Real-time Inquiry'}
                </h3>
                <p className="text-xs text-stone-400 font-light">
                  {currentLang === 'KO' 
                    ? '결제 후 발급 받으신 주문 코드를 입력하시면 기 제작 진행 상태를 열람하실 수 있습니다.' 
                    : 'Search via individual log code tracking.'}
                </p>
              </div>

              <form onSubmit={handleTrackSearch} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-stone-400 block uppercase">
                    {currentLang === 'KO' ? '주문 번호 / Log Code' : 'Order Reference Code'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 text-xs border border-stone-800 bg-stone-950 text-stone-100 rounded-lg focus:outline-hidden"
                      placeholder="e.g. MINUA-12345"
                      value={trackOrderId}
                      onChange={(e) => setTrackOrderId(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      id="order-search-action-btn"
                      className="px-4 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold font-mono text-xs uppercase rounded-lg cursor-pointer flex items-center justify-center transition-all shrink-0"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>

                {searchError && (
                  <p className="text-xs text-red-400 font-semibold font-sans">{searchError}</p>
                )}

                {/* Searched result card rendered */}
                {searchedOrder && (
                  <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                      <span className="text-[11px] font-mono text-stone-400">STATUS</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-sm font-mono font-semibold ${getStatusColor(searchedOrder.status)}`}>
                        {getStatusLabel(searchedOrder.status)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {searchedOrder.items.map((it, idx) => (
                        <p key={idx} className="text-xs text-stone-300 font-light">
                          • {currentLang === 'KO' ? it.product.nameKO : it.product.nameEN} ({it.quantity}개)
                        </p>
                      ))}
                    </div>

                    <div className="border-t border-stone-800 pt-2 flex justify-between items-center text-xs text-stone-400 font-sans">
                      <span>수령인: {searchedOrder.shippingAddress.name}</span>
                      <span className="font-mono text-stone-200">₩{searchedOrder.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
