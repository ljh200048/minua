/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mail, CheckCircle2, User as CardUser, LogOut, Package, RefreshCw, Eye, Lock } from 'lucide-react';
import { DICTIONARY } from '../data';
import { Order, User } from '../types';
import { signUpWithEmail, loginWithEmail, db, isFirebaseConfigured } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface MypageAndOrdersProps {
  currentLang: 'KO' | 'EN' | 'JP';
  orders: Order[];
  loggedInUser: User | null;
  onLogin: (email: string, name: string, phone?: string) => void;
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
  
  // Login & Sign-up form states
  const [authMode, setAuthMode] = React.useState<'login' | 'signup'>('login');
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordConfirm, setPasswordConfirm] = React.useState('');
  const [authError, setAuthError] = React.useState('');
  const [authSuccess, setAuthSuccess] = React.useState('');
  const [authLoading, setAuthLoading] = React.useState(false);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);

  // Search input for non-member tracking
  const [trackOrderId, setTrackOrderId] = React.useState('');
  const [searchedOrder, setSearchedOrder] = React.useState<Order | null>(null);
  const [searchError, setSearchError] = React.useState('');

  const handleAuthFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        if (!name || !email || !password || !passwordConfirm || !phone) {
          throw new Error(currentLang === 'KO' ? '모든 항목을 입력해주세요.' : 'Please fill out all fields.');
        }
        if (password !== passwordConfirm) {
          throw new Error(currentLang === 'KO' ? '비밀번호가 일치하지 않습니다.' : 'Passwords do not match.');
        }
        if (password.length < 6) {
          throw new Error(currentLang === 'KO' ? '비밀번호는 최소 6자리 이상이어야 합니다.' : 'Password must be at least 6 characters.');
        }

        const registeredUser = await signUpWithEmail(email, password, name, phone);
        if (registeredUser) {
          setAuthSuccess(currentLang === 'KO' ? '회원가입이 정상적으로 완료되었습니다! 자동 로그인 중...' : 'Sign-up completed successfully! Logging in...');
          setTimeout(() => {
            onLogin(registeredUser.email || email, registeredUser.displayName || name, phone);
            // Reset fields
            setEmail('');
            setName('');
            setPassword('');
            setPasswordConfirm('');
            setPhone('');
            setAuthSuccess('');
            setAuthLoading(false);
          }, 1500);
        }
      } else {
        if (!email || !password) {
          throw new Error(currentLang === 'KO' ? '이메일과 비밀번호를 입력해주세요.' : 'Please enter email and password.');
        }
        const loggedUser = await loginWithEmail(email, password);
        if (loggedUser) {
          // Retrieve user's custom fields (like phone)
          let phoneToPass = '';
          if (!isFirebaseConfigured()) {
            const stored = localStorage.getItem('minua_local_users');
            if (stored) {
              try {
                const localUsers = JSON.parse(stored);
                const matched = localUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
                if (matched) {
                  phoneToPass = matched.phone || '';
                }
              } catch (_) {}
            }
          } else {
            try {
              const docRef = doc(db, 'users', loggedUser.uid);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                phoneToPass = docSnap.data().phone || '';
              }
            } catch (err) {
              console.warn('Failed to fetch user phone from firestore:', err);
            }
          }

          onLogin(loggedUser.email || email, loggedUser.displayName || 'Essential Member', phoneToPass);
          // Reset fields
          setEmail('');
          setName('');
          setPassword('');
          setPhone('');
          setAuthLoading(false);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || String(err));
      setAuthLoading(false);
    }
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
              <div className="flex border-b border-stone-100 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`flex-1 pb-3 text-center text-xs font-bold tracking-wider font-mono uppercase cursor-pointer transition-colors ${authMode === 'login' ? 'border-b-2 border-stone-900 text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  {currentLang === 'KO' ? '로그인' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`flex-1 pb-3 text-center text-xs font-bold tracking-wider font-mono uppercase cursor-pointer transition-colors ${authMode === 'signup' ? 'border-b-2 border-stone-900 text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  {currentLang === 'KO' ? '회원가입' : 'Sign Up'}
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] text-stone-500 font-light">
                  {authMode === 'login' 
                    ? (currentLang === 'KO' ? '등록된 이메일과 비밀번호로 로그인해주세요.' : 'Please sign in using your account credentials.')
                    : (currentLang === 'KO' ? '이름, 이메일, 그리고 비밀번호를 입력해 멤버십 가입을 시작하세요.' : 'Join the MINUA Handcrafted Membership.')
                  }
                </p>
              </div>

              {authError && (
                <div className="bg-red-50 text-red-700 text-xs py-2.5 px-3 rounded-lg font-medium border border-red-100 animate-shake">
                  {authError}
                </div>
              )}

              {authSuccess && (
                <div className="bg-emerald-50 text-emerald-800 text-xs py-2.5 px-3 rounded-lg font-medium border border-emerald-100">
                  {authSuccess}
                </div>
              )}

              <form onSubmit={handleAuthFormSubmit} className="space-y-4 text-stone-850">
                {authMode === 'signup' && (
                  <>
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
                        {currentLang === 'KO' ? '전화번호' : 'Phone Number'} *
                      </label>
                      <input
                        type="tel"
                        className="w-full px-3 py-2 text-xs border border-stone-200 bg-stone-50 rounded-lg focus:outline-hidden"
                        placeholder={currentLang === 'KO' ? '전화번호 입력 (예: 010-1234-5678)' : 'Enter phone number'}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}

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

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-stone-500 block uppercase">
                    {currentLang === 'KO' ? '비밀번호' : 'Password'} *
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 text-xs border border-stone-200 bg-stone-50 rounded-lg focus:outline-hidden"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-stone-500 block uppercase">
                      {currentLang === 'KO' ? '비밀번호 확인' : 'Confirm Password'} *
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 text-xs border border-stone-200 bg-stone-50 rounded-lg focus:outline-hidden"
                      placeholder="••••••••"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                  <span className="text-[9px] text-stone-400 leading-relaxed font-light block">
                    {authMode === 'login' 
                      ? (currentLang === 'KO' 
                          ? '회원 정보 조회 및 주문 내역, 혜택 확인을 위해 안전하게 로그인하세요.'
                          : 'Sign in safely to browse active orders and hand-crafted benefits.')
                      : (currentLang === 'KO'
                          ? 'MINUA 회원가입 시 구매 내역 조회, 신상품 얼리액세스 알림 혜택을 드립니다.'
                          : 'Early-access notifications with full custom profile saving.')
                    }
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  id="anonymous-login-action"
                  className="w-full py-2.5 bg-stone-900 hover:bg-stone-950 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-lg cursor-pointer transition-colors text-center disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {authLoading && <span className="inline-block w-3.5 h-3.5 border-2 border-stone-300 border-t-white rounded-full animate-spin" />}
                  <span>
                    {authMode === 'login' ? dict.btnLogin : (currentLang === 'KO' ? '회원 가입 완료' : 'Complete Sign-Up')}
                  </span>
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'signup' : 'login');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className="text-[11px] font-sans text-stone-500 hover:text-stone-900 underline underline-offset-2 cursor-pointer transition-colors"
                >
                  {authMode === 'login'
                    ? (currentLang === 'KO' ? '계정이 없으신가요? 간편 회원가입' : 'New to MINUA? Quick sign-up here.')
                    : (currentLang === 'KO' ? '이미 계정이 있으신가요? 바로 로그인' : 'Already have an account? Sign in.')
                  }
                </button>
              </div>
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
