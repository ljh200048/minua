/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sparkles,
  ShoppingBag,
  Heart,
  Grid,
  ChevronRight,
  Upload,
  RefreshCw,
  Gift,
  ArrowRight,
  Camera
} from 'lucide-react';

import Header from './components/Header';
import Footer from './components/Footer';
import AestheticHome from './components/AestheticHome';
import AttachmentStory from './components/AttachmentStory';
import ReviewSection from './components/ReviewSection';
import CartAndCheckout from './components/CartAndCheckout';
import MypageAndOrders from './components/MypageAndOrders';
import GiftWrappingGuide from './components/GiftWrappingGuide';
import ProductDetailModal from './components/ProductDetailModal';
import AdminDashboard from './components/AdminDashboard';

import { INITIAL_PRODUCTS, INITIAL_REVIEWS, DICTIONARY } from './data';
import { Product, CartItem, Order, Review, User, CategoryDoc } from './types';
import { getProductImage, saveOverriddenImage, getOverriddenImages, importOverriddenImages, compressImage, importOverriddenDescriptions } from './utils/imageDb';
import { 
  fetchProducts, 
  auth, 
  isFirebaseConfigured, 
  fetchAllImageOverridesFromDb, 
  saveProductInDb, 
  saveImageOverrideInDb,
  fetchCategoriesFromDb,
  saveCategoryInDb,
  uploadCategoryImageToStorage
} from './lib/firebase';

export default function App() {
  const [lang, setLang] = React.useState<'KO' | 'EN' | 'JP'>('KO');
  const [activeTab, setActiveTab] = React.useState<string>('home');
  const [imageTick, setImageTick] = React.useState(0);

  // Dynamic products catalog, populated from cloud database with local fallback
  const [productsList, setProductsList] = React.useState<Product[]>(INITIAL_PRODUCTS);
  const [categoriesList, setCategoriesList] = React.useState<CategoryDoc[]>([]);
  const [isAdminView, setIsAdminView] = React.useState(false);

  // Helper to resolve category images from categories collection in Firestore
  const getCategoryCoverImage = (categoryId: string, defaultUrl: string): string => {
    const found = categoriesList.find(c => c.id === categoryId);
    if (found && found.categoryImageUrl) {
      if (found.categoryImageUrl !== 'empty') {
        return found.categoryImageUrl;
      }
    }
    return getProductImage(categoryId + '-cat-stub', defaultUrl);
  };

  // Admin user tracking state (Firebase + memory fallback)
  const [adminUser, setAdminUser] = React.useState<any>(() => {
    const saved = localStorage.getItem('minua_admin_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  React.useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged((curr: any) => {
      if (curr) {
        if (curr.email === 'lch200048@gmail.com') {
          setAdminUser(curr);
          setIsAdminView(true);
          if (window.location.pathname !== '/admin') {
            window.history.pushState({}, '', '/admin');
          }
          localStorage.setItem('minua_admin_session', JSON.stringify({
            uid: curr.uid,
            email: curr.email,
            displayName: curr.displayName || 'Admin'
          }));
        } else {
          // If a standard customer logs in, they of them should not pollute the admin's session
          setAdminUser(null);
          localStorage.removeItem('minua_admin_session');
        }
      } else {
        if (isFirebaseConfigured()) {
          setAdminUser(null);
          setIsAdminView(false);
          localStorage.removeItem('minua_admin_session');
          if (window.location.pathname === '/admin') {
            window.history.pushState({}, '', '/');
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    async function getSyncedData() {
      try {
        const overridesResult = await fetchAllImageOverridesFromDb();
        if (overridesResult) {
          if (overridesResult.images && Object.keys(overridesResult.images).length > 0) {
            importOverriddenImages(overridesResult.images);
          }
          if (overridesResult.descriptions && Object.keys(overridesResult.descriptions).length > 0) {
            importOverriddenDescriptions(overridesResult.descriptions);
          }
        }
      } catch (err) {
        console.warn('Cloud image overrides load error:', err);
      }

      try {
        const cats = await fetchCategoriesFromDb();
        setCategoriesList(cats);
      } catch (err) {
        console.warn('Click categories load error:', err);
      }

      const data = await fetchProducts(INITIAL_PRODUCTS);
      const sanitized = data.map(p => {
        if (p.id === 'ring-01' && (p.defaultImage === '/images/ring-01.svg' || !p.defaultImage)) {
          return { ...p, defaultImage: '/images/silhouette-wave-silver-ring.jpg' };
        }
        return p;
      });
      setProductsList(sanitized);
    }
    getSyncedData();
  }, [imageTick]);

  React.useEffect(() => {
    const handleUrlRouting = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');

      if (path === '/admin') {
        setIsAdminView(true);
      } else if (path === '/products') {
        setIsAdminView(false);
        if (cat) {
          setActiveTab(cat);
        } else {
          setActiveTab('all');
        }
      } else if (path === '/login' || path === '/mypage') {
        setIsAdminView(false);
        setActiveTab('mypage');
      } else {
        setIsAdminView(false);
        if (path === '/') {
          setActiveTab('home');
        }
      }
    };
    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => window.removeEventListener('popstate', handleUrlRouting);
  }, []);

  // Sync activeTab to browser URL for deep linking and back button support
  React.useEffect(() => {
    if (isAdminView) return;

    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');

    if (activeTab === 'home') {
      if (path !== '/') {
        window.history.pushState({}, '', '/');
      }
    } else if (
      activeTab === 'all' || 
      activeTab === 'ring' || 
      activeTab === 'bracelet' || 
      activeTab === 'keyring' || 
      activeTab === 'gift' || 
      activeTab === 'earring' || 
      activeTab === 'necklace'
    ) {
      const desiredPath = `/products${activeTab !== 'all' ? `?category=${activeTab}` : ''}`;
      const currentFull = path + window.location.search;
      if (currentFull !== desiredPath) {
        window.history.pushState({}, '', desiredPath);
      }
    } else if (activeTab === 'mypage') {
      if (path !== '/login' && path !== '/mypage') {
        window.history.pushState({}, '', '/mypage');
      }
    } else {
      if (path !== '/' && activeTab !== 'mypage') {
        window.history.pushState({}, '', '/');
      }
    }
  }, [activeTab, isAdminView]);

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setIsAdminView(true);
  };

  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    setIsAdminView(false);
    setImageTick(prev => prev + 1);
  };
  
  // Persistence state hooks loaded from LocalStorage
  const [cart, setCart] = React.useState<CartItem[]>(() => {
    const saved = localStorage.getItem('minua_cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [wishlist, setWishlist] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('minua_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = React.useState<Order[]>(() => {
    const saved = localStorage.getItem('minua_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [reviews, setReviews] = React.useState<Review[]>(() => {
    const saved = localStorage.getItem('minua_reviews');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  const [loggedInUser, setLoggedInUser] = React.useState<User | null>(() => {
    const saved = localStorage.getItem('minua_user');
    return saved ? JSON.parse(saved) : null;
  });

  const isAdminAuthenticated = !!(
    adminUser && adminUser.email === 'lch200048@gmail.com'
  );

  // Active modulations
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [activeOrder, setActiveOrder] = React.useState<Order | null>(null);

  // Administrative owner upload manager states
  const [isOwnerPanelOpen, setIsOwnerPanelOpen] = React.useState(false);
  const [ownerTargetDesign, setOwnerTargetDesign] = React.useState('banner-main');
  const [ownerSuccessMessage, setOwnerSuccessMessage] = React.useState('');

  const dict = DICTIONARY[lang];

  // Save states modifications in effect hooks
  React.useEffect(() => {
    document.title = "minua | 미누아";
  }, []);

  React.useEffect(() => {
    localStorage.setItem('minua_cart', JSON.stringify(cart));
  }, [cart]);

  React.useEffect(() => {
    localStorage.setItem('minua_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  React.useEffect(() => {
    localStorage.setItem('minua_orders', JSON.stringify(orders));
  }, [orders]);

  React.useEffect(() => {
    localStorage.setItem('minua_reviews', JSON.stringify(reviews));
  }, [reviews]);

  // Simulate progress on mock orders periodically whenever tab matches Tracker!
  // This makes custom orders feel actively forged in real-time.
  React.useEffect(() => {
    if (orders.length > 0) {
      // Find orders that are not delivered yet and move them forward with a subtle probability
      const updated = orders.map(ord => {
        if (ord.status === 'pending') {
          return { ...ord, status: 'preparing' as const };
        } else if (ord.status === 'preparing') {
          // 40% chance of shipping on reload
          if (Math.random() > 0.6) {
            return { ...ord, status: 'shipping' as const };
          }
        } else if (ord.status === 'shipping') {
          // 30% chance of delivered on reload
          if (Math.random() > 0.7) {
            return { ...ord, status: 'delivered' as const };
          }
        }
        return ord;
      });

      // Simple update comparison to avoid perpetual cycle loops
      if (JSON.stringify(updated) !== JSON.stringify(orders)) {
        setOrders(updated);
      }
    }
  }, [activeTab]);

  // Handle direct cart actions
  const handleAddToCart = (item: Omit<CartItem, 'id' | 'quantity'>, count: number) => {
    // Unique identifier based on size, color, charm selections
    const uniqueId = `${item.product.id}-${item.selectedSize || ''}-${item.selectedColor || ''}-${item.selectedCharms?.join('_') || ''}-${item.engravingText || ''}`;
    
    setCart((prev) => {
      const matchIdx = prev.findIndex(c => c.id === uniqueId);
      if (matchIdx > -1) {
        const u = [...prev];
        u[matchIdx].quantity += count;
        return u;
      }
      return [...prev, { ...item, id: uniqueId, quantity: count }];
    });
    
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart((prev) => 
      prev.map(c => {
        if (c.id === id) {
          const next = c.quantity + delta;
          return { ...c, quantity: next > 0 ? next : 1 };
        }
        return c;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setCart((prev) => prev.filter(c => c.id !== id));
  };

  const handlePlaceOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const newId = `MINUA-${randomSuffix}`;
    const newOrder: Order = {
      ...orderData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrder(newOrder);
    
    // Clear cart on successful order placement
    setCart([]);
  };

  const handleToggleWishlist = (id: string) => {
    setWishlist((prev) => 
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  const handleAddReview = (newReview: Omit<Review, 'id' | 'createdAt'>) => {
    const reviewItem: Review = {
      ...newReview,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setReviews((prev) => [reviewItem, ...prev]);
  };

  const handleLocalAuth = (email: string, name: string, phone?: string) => {
    const u: User = { email, name, phone };
    setLoggedInUser(u);
    localStorage.setItem('minua_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('minua_user');
  };

  // Owner upload handler
  const handleOwnerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const rawBase64 = reader.result as string;
          const compressed = await compressImage(rawBase64, 1200);
          const finalUrl = await saveImageOverrideInDb(ownerTargetDesign, compressed);
          saveOverriddenImage(ownerTargetDesign, finalUrl);
          setImageTick(prev => prev + 1);
          setOwnerSuccessMessage(dict.uploadSuccessMsg);
          setTimeout(() => setOwnerSuccessMessage(''), 3000);
        } catch (err) {
          console.error('Failed to upload custom banner:', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter products by selected categories
  const filteredProducts = productsList.map(p => ({
    ...p,
    defaultImage: getProductImage(p.id, p.defaultImage, p.imageUrl)
  })).filter(p => {
    if (activeTab === 'all' || activeTab === 'home') return true;
    if (activeTab === 'best') return !!p.isBest;
    return p.category === activeTab;
  });

  const cartTotalItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  return isAdminView ? (
    <AdminDashboard
      currentLang={lang}
      initialProducts={productsList}
      onProductsUpdated={(updated) => {
        setProductsList(updated);
      }}
      onClose={navigateToHome}
      onCategoryImagesUpdated={() => {
        setImageTick(prev => prev + 1);
      }}
    />
  ) : (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between selection:bg-amber-100 selection:text-stone-900 font-sans">
      
      {/* Dynamic Navigation Header */}
      <Header
        currentLang={lang}
        setLang={setLang}
        activeTab={activeTab}
        setActiveTab={(t) => {
          if (
            t === 'all' || 
            t === 'ring' || 
            t === 'bracelet' || 
            t === 'keyring' || 
            t === 'gift' || 
            t === 'minua-story' || 
            t === 'review' || 
            t === 'earring' || 
            t === 'necklace'
          ) {
            setActiveTab(t);
          } else {
            setActiveTab('home');
          }
        }}
        cartCount={cartTotalItems}
        openCart={() => setIsCartOpen(true)}
        user={loggedInUser}
        openMyPage={() => setActiveTab('mypage')}
      />

      {/* Main Dynamic View Panels */}
      <main className="flex-1">
        
        {/* VIEW 1: LANDING EDITORIAL HOMEPAGE */}
        {activeTab === 'home' && (
          <AestheticHome
            lang={lang}
            productsList={productsList}
            wishlist={wishlist}
            handleToggleWishlist={handleToggleWishlist}
            setSelectedProduct={setSelectedProduct}
            setActiveTab={setActiveTab}
            isAdminAuthenticated={isAdminAuthenticated}
            setImageTick={setImageTick}
          />
        )}
        {activeTab === 'legacy-home-disabled' && (
          <div id="home-view-panel" className="space-y-16 sm:space-y-24 animate-fadeIn">
            
            {/* High-end Seq Banners Stack (Exactly matching m.xte.co.kr layout) */}
            <div className="space-y-4">
              
              {/* Banner 1: PROMOTION */}
              <div className="relative h-[480px] sm:h-[540px] bg-stone-900 flex items-center justify-center overflow-hidden group">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-85 select-none transition-transform duration-[1200ms] group-hover:scale-103"
                  style={{ backgroundImage: `url(${getProductImage('banner-main', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1600&q=80')})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-900/10 to-stone-950/30" />
                
                <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-white space-y-4 sm:space-y-5">
                  <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.35em] text-amber-400 block uppercase font-medium">
                    PROMOTION
                  </span>
                  <h2 className="text-xl sm:text-3.5xl font-light tracking-[0.1em] font-sans text-stone-100 uppercase">
                    {dict.brandTaglineLine1}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-stone-300 font-light max-w-xl mx-auto leading-relaxed tracking-wider">
                    {lang === 'KO' ? '은은함 속에 가치를 새겨 넣은 미누아 단독 주얼리 프로모션 안내' : lang === 'JP' ? '細部に宿る洗練された輝き、ミヌアだけの特別割引プロモ実施中' : 'A special jewelry event reflecting curated details and exclusive items'}
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('all')}
                      className="inline-block px-7 py-2.5 border border-white/60 text-white font-mono hover:bg-white hover:text-stone-950 text-[10.5px] uppercase tracking-widest transition-all cursor-pointer rounded-none bg-transparent"
                    >
                      {lang === 'KO' ? '바로가기' : lang === 'JP' ? '詳細を見る' : 'VIEW DETAIL'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Banner 2: NEW ARRIVAL */}
              <div className="relative h-[480px] sm:h-[540px] bg-stone-900 flex items-center justify-center overflow-hidden group">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-85 select-none transition-transform duration-[1200ms] group-hover:scale-103"
                  style={{ backgroundImage: `url(${getProductImage('banner-new', 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=1600&q=80')})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-900/10 to-stone-950/30" />
                
                <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-white space-y-4 sm:space-y-5">
                  <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.35em] text-amber-400 block uppercase font-medium">
                    NEW ARRIVAL
                  </span>
                  <h2 className="text-xl sm:text-3.5xl font-light tracking-[0.1em] font-sans text-stone-100 uppercase">
                    {lang === 'KO' ? '매일의 분위기를 완성하는 반지 & 팔찌' : lang === 'JP' ? '毎日のムードを完成させるリングとブレス' : 'Rings & bracelets completing your daily vibe'}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-stone-300 font-light max-w-xl mx-auto leading-relaxed tracking-wider">
                    {lang === 'KO' ? '아름다움 속에 유연하게 녹아드는 고밀도 프리미엄 실버 라인업' : lang === 'JP' ? 'クラシックな中にモダンな光沢を持つ最高峰シルバー925シリーズ' : 'High density sterling silver collections naturally melting into everyday life'}
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('ring')}
                      className="inline-block px-7 py-2.5 border border-white/60 text-white font-mono hover:bg-white hover:text-stone-950 text-[10.5px] uppercase tracking-widest transition-all cursor-pointer rounded-none bg-transparent"
                    >
                      {lang === 'KO' ? '바로가기' : lang === 'JP' ? '新作を見る' : 'EXPLORE COLLECTION'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Banner 3: MINUA ORIGINAL */}
              <div className="relative h-[480px] sm:h-[540px] bg-stone-900 flex items-center justify-center overflow-hidden group">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-85 select-none transition-transform duration-[1200ms] group-hover:scale-103"
                  style={{ backgroundImage: `url(${getProductImage('banner-original', 'https://images.unsplash.com/photo-1576016770956-debb63d90029?w=1600&q=80')})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-900/10 to-stone-950/30" />
                
                <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-white space-y-4 sm:space-y-5">
                  <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.35em] text-amber-400 block uppercase font-medium">
                    MINUA ORIGINAL
                  </span>
                  <h2 className="text-xl sm:text-3.5xl font-light tracking-[0.1em] font-sans text-stone-100 uppercase">
                    {lang === 'KO' ? '나를 더 나답게, minua 키링 시리즈' : lang === 'JP' ? '自分をもっとらしく、minuaキーリング' : 'Express your colors, signature minua keyrings'}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-stone-300 font-light max-w-xl mx-auto leading-relaxed tracking-wider">
                    {lang === 'KO' ? '이탈리아 최고급 베지터블 레더와 견고한 황동 금속의 조화로운 모듈러 피스' : lang === 'JP' ? 'イタリア産高級ベジタブルレザーとアンティーク真鍮のクラフト芸術' : 'Luxurious Italian vegetable leather harmonized with antique brass elements'}
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('keyring')}
                      className="inline-block px-7 py-2.5 border border-white/60 text-white font-mono hover:bg-white hover:text-stone-950 text-[10.5px] uppercase tracking-widest transition-all cursor-pointer rounded-none bg-transparent"
                    >
                      {lang === 'KO' ? '바로가기' : lang === 'JP' ? 'アタッチを見る' : 'SHOP ORIGINAL'}
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Filter Categories Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { 
                    id: 'ring', 
                    label: dict.menuRing, 
                    detailKO: '유선형 유려한 마감', 
                    detailEN: 'Delicate band silvers', 
                    bg: '/images/collection-ring.jpg', 
                    fallbackBg: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80' 
                  },
                  { 
                    id: 'bracelet', 
                    label: dict.menuBracelet, 
                    detailKO: '메탈릭 체인과 뱀줄', 
                    detailEN: 'Modern wrist textures', 
                    bg: '/images/collection-bracelet.jpg', 
                    fallbackBg: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&auto=format&fit=crop&q=80' 
                  },
                  { 
                    id: 'keyring', 
                    label: dict.menuKeyring, 
                    detailKO: 'minua 마스터 에디션', 
                    detailEN: 'Aesthetic attachments', 
                    bg: '/images/collection-keyring.jpg', 
                    fallbackBg: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&auto=format&fit=crop&q=80' 
                  },
                  { 
                    id: 'earring', 
                    label: dict.menuEarring, 
                    detailKO: '은은하게 반짝이는 디테일', 
                    detailEN: 'Shimmering fine details', 
                    bg: '/images/collection-earring.jpg', 
                    fallbackBg: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80' 
                  },
                  { 
                    id: 'necklace', 
                    label: dict.menuNecklace, 
                    detailKO: '목라인을 타고 흐르는 선맥', 
                    detailEN: 'Elegant collarbone lines', 
                    bg: '/images/collection-necklace.jpg', 
                    fallbackBg: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80' 
                  },
                  { 
                    id: 'gift', 
                    label: dict.menuGift, 
                    detailKO: '소중함을 투영하는 세트', 
                    detailEN: 'Gifting set packing', 
                    bg: '/images/collection-gift.jpg', 
                    fallbackBg: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80' 
                  },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    id={`home-cat-card-${cat.id}`}
                    onClick={() => setActiveTab(cat.id)}
                    className="relative aspect-square sm:aspect-auto sm:py-8 sm:px-6 p-5 rounded-2xl border border-stone-200 bg-[#FAF8F5]/85 hover:bg-white hover:border-amber-800/60 transition-all duration-300 flex flex-col justify-between text-left cursor-pointer group shadow-2xs hover:shadow-xs focus:outline-hidden"
                  >
                    <span className="text-[9.5px] font-mono tracking-wider text-amber-800 bg-amber-800/5 px-2.5 py-0.5 rounded-full select-none w-fit font-semibold transition-colors group-hover:bg-amber-800/10">
                      Collection ({productsList.filter(p => p.category === cat.id).length})
                    </span>
                    <div className="mt-4 sm:mt-6">
                      <h3 className="text-sm sm:text-base font-semibold font-sans tracking-tight text-stone-850 group-hover:text-amber-800 transition-colors">
                        {cat.label}
                      </h3>
                      <p className="text-[10px] sm:text-xs font-sans text-stone-450 font-light mt-1.5 leading-normal">
                        {lang === 'KO' ? cat.detailKO : cat.detailEN}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* MINUA BRAND DIRECTION EDITORIAL SECTION */}
            <div id="brand-direction-editorial-panel" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center select-none font-sans space-y-6">
              <span className="text-[10px] font-mono tracking-[0.3em] text-amber-800/85 block uppercase font-bold">
                MINUA BRAND DIRECTION
              </span>
              <h3 className="text-xl sm:text-2xl font-light tracking-[0.08em] text-stone-900 font-sans uppercase">
                {dict.brandTaglineLine1}
              </h3>
              <div className="w-8 h-[1px] bg-amber-800/50 mx-auto" />
              <div className="space-y-5 max-w-2xl mx-auto">
                <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-light font-sans break-keep whitespace-pre-line">
                  {dict.brandTaglineLine2}
                </p>
                <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-light font-sans break-keep whitespace-pre-line">
                  {dict.brandSubTagline}
                </p>
              </div>
            </div>

            {/* CURATED CRAFT BESTSELLERS GRID */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-baseline mb-12 border-b border-stone-200 pb-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 font-sans">
                    {lang === 'KO' ? '미누아 대표 스테디셀러' : 'Signature Steadysellers'}
                  </h2>
                  <p className="text-xs text-stone-500 font-light mt-1 leading-normal">
                    {lang === 'KO' ? '변치 않는 은은함과 독보적인 디자인 가치' : 'Timeless metallic presence adored daily'}
                  </p>
                </div>
                <button
                  id="bestseller-view-all"
                  onClick={() => setActiveTab('all')}
                  className="text-xs font-mono font-bold tracking-widest text-amber-800 hover:text-amber-950 uppercase cursor-pointer flex items-center gap-1"
                >
                  <span>{lang === 'KO' ? '전체 보기' : 'All Goods'}</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              {/* Grid lists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {productsList.slice(0, 3).map((prod) => {
                  const resolvedImg = getProductImage(prod.id, prod.defaultImage, prod.imageUrl);
                  const isWished = wishlist.includes(prod.id);
                  return (
                    <div
                      key={prod.id}
                      id={`bestseller-item-${prod.id}`}
                      className="bg-white rounded-2xl border border-stone-200/60 overflow-hidden shadow-2xs hover:shadow-md transition-shadow group flex flex-col justify-between"
                    >
                      {/* Image frame - Fixed aspect ratio to prevent layout shifting when images are loading or missing */}
                      {/* public/images 폴더 내에 실제 이미지 파일(예: silhouette-wave-silver-ring.jpg)이 있어야 온전히 이미지가 렌더링됩니다. */}
                      <div className="relative aspect-square overflow-hidden bg-stone-50 border border-stone-100/40 flex items-center justify-center h-full w-full">
                        <img
                          src={resolvedImg}
                          alt={prod.nameEN}
                          className={`w-full h-full ${prod.category === 'ring' || prod.category === 'keyring' ? 'object-contain p-4 bg-[#FCFAF7]' : 'object-cover'} transition-transform duration-500 group-hover:scale-103 absolute inset-0`}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // Hide the broken img element and show our beautiful fallback state
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        {/* Beautiful Fallback block to ensure product card layout stays pristine even if images are missing */}
                        <div
                          style={{ display: 'none' }}
                          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100/90 p-4 font-sans text-center select-none"
                        >
                          <Sparkles size={18} className="text-amber-700/60 animate-pulse mb-1.5" />
                          <span className="text-xs font-semibold text-stone-800 tracking-tight line-clamp-1">
                            {lang === 'KO' ? prod.nameKO : prod.nameEN}
                          </span>
                          <span className="text-[9px] font-mono font-medium text-stone-400 mt-1 uppercase tracking-wider bg-stone-200/40 px-1.5 py-0.5 rounded-xs">
                            {prod.defaultImage}
                          </span>
                          <p className="text-[9px] text-amber-900 bg-amber-50 border border-amber-100 font-semibold px-2 py-0.5 rounded-full mt-2.5">
                            {lang === 'KO' ? 'images 폴더 실제 파일 누락' : 'Place file in public/images'}
                          </p>
                        </div>
                        <div className="absolute inset-0 bg-stone-950/15 group-hover:bg-stone-950/20 transition-colors pointer-events-none" />

                        {/* Direct Image Swap Controller for store owners/users */}
                        {isAdminAuthenticated && (
                          <div className="absolute bottom-4 left-4 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <label className="bg-white/95 hover:bg-stone-900 border border-stone-200 text-stone-800 hover:text-white rounded-full px-3 py-1.5 cursor-pointer shadow-xs flex items-center gap-1 text-[10px] font-mono tracking-wider font-semibold transition-colors">
                              <Camera size={12} />
                              <span>{lang === 'KO' ? '이미지 교체' : 'Swap Photo'}</span>
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
                                        const rawBase64 = reader.result as string;
                                        const compressed = await compressImage(rawBase64, 1000);
                                        saveOverriddenImage(prod.id, compressed);
                                        
                                        const updatedProd = { ...prod, defaultImage: compressed };
                                        const savedProd = await saveProductInDb(updatedProd, productsList);
                                        
                                        saveOverriddenImage(prod.id, savedProd.defaultImage);
                                        setProductsList(prev => prev.map(p => p.id === prod.id ? savedProd : p));
                                        setImageTick(prev => prev + 1);
                                      } catch (err) {
                                        console.error('Failed to change product image:', err);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            {getOverriddenImages()[prod.id] && (
                              <button
                                onClick={() => {
                                  if (confirm(lang === 'KO' ? '이 상품의 이미지를 원래 디자인으로 복원하겠습니까?' : 'Revert this product to original design?')) {
                                    const overrides = getOverriddenImages();
                                    delete overrides[prod.id];
                                    localStorage.setItem('minua_image_overrides', JSON.stringify(overrides));
                                    setImageTick(prev => prev + 1);
                                  }
                                }}
                                className="bg-white/95 hover:bg-red-50 hover:text-red-600 border border-stone-200 text-stone-500 rounded-full px-2 py-1.5 cursor-pointer shadow-xs flex items-center gap-1 text-[10px] font-mono tracking-wider font-semibold transition-colors"
                                title={lang === 'KO' ? '원래대로 복구' : 'Revert Original'}
                              >
                                <RefreshCw size={11} />
                              </button>
                            )}
                          </div>
                        )}

                        {/* Wishlist trigger */}
                        <button
                          id={`wish-trigger-${prod.id}`}
                          onClick={() => handleToggleWishlist(prod.id)}
                          className={`absolute top-4 right-4 p-2.5 rounded-full shadow-2cs cursor-pointer border transition-colors bg-white/95 ${
                            isWished ? 'text-pink-600 border-pink-100' : 'text-stone-400 border-transparent hover:text-stone-700'
                          }`}
                        >
                          <Heart size={14} fill={isWished ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      {/* Info & Price */}
                      <div className="p-6 space-y-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono tracking-widest font-bold text-amber-700 block uppercase">
                            {prod.category}
                          </span>
                          <h3 className="text-base font-semibold text-stone-950 font-sans tracking-wide">
                            {lang === 'KO' ? prod.nameKO : prod.nameEN}
                          </h3>
                        </div>

                        <p className="text-xs text-stone-500 font-light line-clamp-2 leading-relaxed">
                          {lang === 'KO' ? prod.descriptionKO : prod.descriptionEN}
                        </p>

                        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                          <span className="text-sm font-mono font-bold text-amber-900">
                            ₩{prod.price.toLocaleString()}
                          </span>
                          
                          <button
                            id={`quick-buy-trigger-${prod.id}`}
                            onClick={() => setSelectedProduct({ ...prod, defaultImage: resolvedImg })}
                            className="text-xs font-mono font-bold tracking-widest uppercase text-stone-800 hover:text-amber-800 underline underline-offset-4 cursor-pointer"
                          >
                            {dict.btnBuyNow}
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* "minua(미누아)" Editorial Teaser banner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-stone-900 text-stone-100 rounded-3xl overflow-hidden shadow-lg relative p-8 sm:p-16 text-center sm:text-left">
                <div className="absolute inset-0 opacity-15 bg-cover bg-center mix-blend-overlay" style={{ backgroundImage: `url(${getProductImage('teaser-minua', 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=1000&q=80')})` }} />
                <div className="relative z-10 max-w-xl space-y-5">
                  <span className="text-[10px] bg-amber-500/15 border border-amber-500/25 text-amber-400 px-3 py-1 rounded-full font-mono font-bold uppercase tracking-widest">
                    MINUA BRAND DIRECTION
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white font-sans leading-tight">
                    {dict.brandTaglineLine1}
                  </h3>
                  <p className="text-xs leading-relaxed text-stone-300 font-light whitespace-pre-line">
                    {dict.attStoryBody1}
                  </p>
                  <button
                    id="teaser-learn-minua"
                    onClick={() => setActiveTab('minua-story')}
                    className="inline-flex items-center space-x-2.5 text-xs font-mono font-semibold uppercase tracking-widest text-amber-400 hover:text-amber-500 cursor-pointer pt-2 group"
                  >
                    <span>{lang === 'KO' ? 'minua 스토리 읽으러 가기' : 'Immerse in minua Storyline'}</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* Standard Gift Packaging Marketing Display Column */}
            <GiftWrappingGuide currentLang={lang} />

          </div>
        )}

        {/* VIEW 2: PRODUCT ARCHIVE SHOP (Ring, Bracelet, Keyring, Gift, Earring, Necklace, Best) */}
        {(activeTab === 'all' || activeTab === 'best' || activeTab === 'ring' || activeTab === 'bracelet' || activeTab === 'keyring' || activeTab === 'gift' || activeTab === 'earring' || activeTab === 'necklace') && (
          <div id="product-archive-panel" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 animate-fadeIn">
            
            {/* Upper Category Filter indicators */}
            <div className="mb-14 space-y-6">
              <div className="space-y-4">
                <span className="text-xs text-amber-800 font-mono font-bold uppercase tracking-widest">
                  MINUA ATELIER COLLECTION
                </span>
                <h2 className="text-3xl font-semibold text-stone-900 tracking-tight capitalize font-sans">
                  {activeTab === 'all'
                    ? (lang === 'KO' ? '전체 크래프트 라인업' : 'All Crafts Archive')
                    : activeTab === 'best'
                    ? (lang === 'KO' ? '인기 베스트상품 대표 라인업' : 'Best Sellers Archive')
                    : dict[`menu${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}` as keyof typeof dict] || activeTab}
                </h2>
                <div className="w-12 h-1 bg-amber-800 rounded-xs" />
              </div>

              {/* Category specific dynamic cover banner */}
              {activeTab !== 'all' && activeTab !== 'best' && (
                <div 
                  className="relative w-full h-44 sm:h-56 md:h-64 rounded-3xl overflow-hidden mt-6 border border-stone-200/55 shadow-2xs group"
                  id={`category-cover-banner-${activeTab}`}
                >
                  <img 
                    src={getCategoryCoverImage(
                      activeTab, 
                      activeTab === 'ring' ? 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1000&q=80' :
                      activeTab === 'bracelet' ? 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1000&q=80' :
                      activeTab === 'keyring' ? 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=1000&q=80' :
                      activeTab === 'earring' ? 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=1000&q=80' :
                      activeTab === 'necklace' ? 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=1000&q=80' :
                      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1000&q=80'
                    )} 
                    alt={`${activeTab} cover banner`}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.015]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-[0.5px] p-6 sm:p-10 flex flex-col justify-end bg-gradient-to-t from-stone-950/45 via-transparent to-transparent">
                    <span className="text-[10px] font-mono tracking-[0.25em] text-[#E5D5C5] block font-bold uppercase mb-1">
                      MINUA SIGNATURE COLLECTION
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif text-white tracking-widest uppercase font-light">
                      {dict[`menu${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}` as keyof typeof dict] || activeTab}
                    </h3>
                  </div>
                </div>
              )}

              {/* Horizontal category sub-filter navigation bar */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-stone-150 pb-5">
                {[
                  { id: 'all', label: lang === 'KO' ? '전체' : lang === 'JP' ? 'すべて' : 'All' },
                  { id: 'best', label: lang === 'KO' ? '🔥 베스트' : lang === 'JP' ? '🔥 ベスト' : '🔥 Best' },
                  { id: 'ring', label: dict.menuRing },
                  { id: 'bracelet', label: dict.menuBracelet },
                  { id: 'keyring', label: dict.menuKeyring },
                  { id: 'earring', label: dict.menuEarring },
                  { id: 'necklace', label: dict.menuNecklace },
                  { id: 'gift', label: dict.menuGift },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-4 py-2 text-xs font-mono tracking-wider uppercase rounded-full border transition-all cursor-pointer ${
                      activeTab === item.id
                        ? 'bg-stone-900 border-stone-900 text-stone-50 font-bold shadow-xs'
                        : 'bg-white border-stone-200 hover:border-stone-400 text-stone-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards listings grids */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-stone-200 shadow-2xs">
                <Grid className="text-stone-300 mx-auto mb-3" size={32} />
                <p className="text-xs text-stone-400 font-light max-w-xs mx-auto">
                  {lang === 'KO' ? '필터링된 제품 리스트가 비어 있습니다.' : 'No items match your active selection.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((prod) => {
                  const isWished = wishlist.includes(prod.id);
                  return (
                    <div
                      key={prod.id}
                      id={`archive-item-${prod.id}`}
                      className="bg-white rounded-3xl border border-stone-200/60 overflow-hidden shadow-2xs hover:shadow-md transition-shadow group flex flex-col justify-between"
                    >
                      {/* Image core - Fixed aspect ratio to prevent layout shifting when images are loading or missing */}
                      {/* public/images 폴더 내에 실제 이미지 파일(예: silhouette-wave-silver-ring.jpg)이 있어야 온전히 이미지가 렌더링됩니다. */}
                      <div className="relative aspect-square overflow-hidden bg-stone-50 border-b border-stone-100 flex items-center justify-center h-full w-full">
                        <img
                          src={prod.defaultImage}
                          alt={prod.nameEN}
                          className={`w-full h-full ${prod.category === 'ring' || prod.category === 'keyring' ? 'object-contain p-4 bg-[#FCFAF7]' : 'object-cover'} transition-transform duration-500 group-hover:scale-103 absolute inset-0`}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // Hide the broken img element and show our beautiful fallback state
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        {/* Beautiful Fallback block to ensure product card layout stays pristine even if images are missing */}
                        <div
                          style={{ display: 'none' }}
                          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100/90 p-4 font-sans text-center select-none"
                        >
                          <Sparkles size={18} className="text-amber-700/60 animate-pulse mb-1.5" />
                          <span className="text-xs font-semibold text-stone-800 tracking-tight line-clamp-1">
                            {lang === 'KO' ? prod.nameKO : prod.nameEN}
                          </span>
                          <span className="text-[9px] font-mono font-medium text-stone-400 mt-1 uppercase tracking-wider bg-stone-200/40 px-1.5 py-0.5 rounded-xs">
                            {prod.defaultImage}
                          </span>
                          <p className="text-[9px] text-amber-900 bg-amber-50 border border-amber-100 font-semibold px-2 py-0.5 rounded-full mt-2.5">
                            {lang === 'KO' ? 'images 폴더 실제 파일 누락' : 'Place file in public/images'}
                          </p>
                        </div>
                        <div className="absolute inset-0 bg-stone-950/15 group-hover:bg-stone-950/20 transition-colors pointer-events-none" />

                        {/* Direct Image Swap Controller for store owners/users */}
                        {isAdminAuthenticated && (
                          <div className="absolute bottom-4 left-4 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <label className="bg-white/95 hover:bg-stone-900 border border-stone-200 text-stone-800 hover:text-white rounded-full px-3 py-1.5 cursor-pointer shadow-xs flex items-center gap-1 text-[10px] font-mono tracking-wider font-semibold transition-colors">
                              <Camera size={12} />
                              <span>{lang === 'KO' ? '이미지 교체' : 'Swap Photo'}</span>
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
                                        const rawBase64 = reader.result as string;
                                        const compressed = await compressImage(rawBase64, 1000);
                                        saveOverriddenImage(prod.id, compressed);
                                        
                                        const updatedProd = { ...prod, defaultImage: compressed };
                                        const savedProd = await saveProductInDb(updatedProd, productsList);
                                        
                                        saveOverriddenImage(prod.id, savedProd.defaultImage);
                                        setProductsList(prev => prev.map(p => p.id === prod.id ? savedProd : p));
                                        setImageTick(prev => prev + 1);
                                      } catch (err) {
                                        console.error('Failed to change product image:', err);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            {getOverriddenImages()[prod.id] && (
                              <button
                                onClick={() => {
                                  if (confirm(lang === 'KO' ? '이 상품의 이미지를 원래 디자인으로 복원하겠습니까?' : 'Revert this product to original design?')) {
                                    const overrides = getOverriddenImages();
                                    delete overrides[prod.id];
                                    localStorage.setItem('minua_image_overrides', JSON.stringify(overrides));
                                    setImageTick(prev => prev + 1);
                                  }
                                }}
                                className="bg-white/95 hover:bg-red-50 hover:text-red-600 border border-stone-200 text-stone-500 rounded-full px-2 py-1.5 cursor-pointer shadow-xs flex items-center gap-1 text-[10px] font-mono tracking-wider font-semibold transition-colors"
                                title={lang === 'KO' ? '원래대로 복구' : 'Revert Original'}
                              >
                                <RefreshCw size={11} />
                              </button>
                            )}
                          </div>
                        )}

                        {prod.isBest && (
                          <div className="absolute top-4 left-4 z-10 bg-amber-900/95 backdrop-blur-xs text-stone-50 font-mono text-[9px] font-semibold px-2.5 py-0.5 tracking-wider uppercase">
                            BEST
                          </div>
                        )}

                        <button
                          id={`wish-archive-trigger-${prod.id}`}
                          onClick={() => handleToggleWishlist(prod.id)}
                          className={`absolute top-4 right-4 p-2.5 rounded-full shadow-2cs cursor-pointer border transition-colors bg-white/95 ${
                            isWished ? 'text-pink-600 border-pink-100' : 'text-stone-400 border-transparent hover:text-stone-700'
                          }`}
                        >
                          <Heart size={14} fill={isWished ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      {/* Text coordinates */}
                      <div className="p-6 space-y-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono tracking-widest font-bold text-amber-700 block uppercase">
                            {prod.category}
                          </span>
                          <h3 className="text-base font-semibold text-stone-950 font-sans tracking-wide">
                            {lang === 'KO' ? prod.nameKO : prod.nameEN}
                          </h3>
                        </div>

                        <p className="text-xs text-stone-500 font-light tracking-wide line-clamp-3 leading-relaxed">
                          {lang === 'KO' ? prod.descriptionKO : prod.descriptionEN}
                        </p>

                        <div className="pt-4 border-t border-stone-100 flex items-center justify-between font-mono text-xs">
                          <span className="font-bold text-amber-900">
                            ₩{prod.price.toLocaleString()}
                          </span>
                          
                          <button
                            id={`archive-buy-${prod.id}`}
                            onClick={() => setSelectedProduct(prod)}
                            className="font-bold tracking-wider text-stone-850 hover:text-amber-800 underline underline-offset-4 cursor-pointer"
                          >
                            {dict.btnBuyNow}
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* Auxiliary care guide and shipping info inline details */}
            <div className="mt-20 bg-stone-100 border border-stone-200/50 rounded-2xl p-6 sm:p-10 font-sans space-y-4 max-w-3xl mr-auto">
              <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-1.5 uppercase font-mono tracking-wide">
                <Sparkles size={15} className="text-amber-700" />
                <span>{dict.careGuideTitle}</span>
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed font-light">
                {dict.careGuideText}
              </p>
            </div>

          </div>
        )}

        {/* VIEW 3: SIGNATURE MINUA STORY */}
        {activeTab === 'minua-story' && (
          <AttachmentStory currentLang={lang} setActiveTab={setActiveTab} />
        )}

        {/* VIEW 4: LIVELY USER REVIEWS */}
        {activeTab === 'review' && (
          <ReviewSection
            currentLang={lang}
            reviews={reviews}
            onAddReview={handleAddReview}
            products={productsList}
          />
        )}

        {/* VIEW 5: SECURITY MY ORDER HISTORY & TRACKER */}
        {activeTab === 'mypage' && (
          <MypageAndOrders
            currentLang={lang}
            orders={orders}
            loggedInUser={loggedInUser}
            onLogin={handleLocalAuth}
            onLogout={handleLogout}
            setActiveTab={setActiveTab}
          />
        )}

      </main>

      {/* Elegant Footer Details */}
      <Footer currentLang={lang} onNavigateToAdmin={isAdminAuthenticated ? navigateToAdmin : undefined} />

      {/* RENDER MODAL: DETAILED PRODUCT FEATURES VIEW */}
      {selectedProduct && (
        <ProductDetailModal
          currentLang={lang}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
          onImageChange={isAdminAuthenticated ? async (newBase64) => {
            try {
              const compressed = await compressImage(newBase64, 1000);
              saveOverriddenImage(selectedProduct.id, compressed);
              
              const updated = { ...selectedProduct, defaultImage: compressed };
              const saved = await saveProductInDb(updated, productsList);
              
              saveOverriddenImage(selectedProduct.id, saved.defaultImage);
              setSelectedProduct(saved);
              setProductsList(prev => prev.map(p => p.id === selectedProduct.id ? saved : p));
              setImageTick(prev => prev + 1);
            } catch (err) {
              console.error('Failed to sync details image swap:', err);
            }
          } : undefined}
        />
      )}

      {/* RENDER DRAWER: SHOPPING CART OVERLAY OVERVIEW */}
      {isCartOpen && (
        <CartAndCheckout
          currentLang={lang}
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onPlaceOrder={handlePlaceOrder}
          onClose={() => setIsCartOpen(false)}
          activeOrder={activeOrder}
          setActiveOrder={setActiveOrder}
        />
      )}

    </div>
  );
}
