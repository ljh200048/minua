/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Camera, 
  Trash2, 
  Plus, 
  Edit3, 
  LogOut, 
  ShoppingBag, 
  ChevronLeft, 
  Save, 
  X, 
  Database,
  CheckCircle,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { Product } from '../types';
import { compressImage, getProductImage, saveOverriddenImage, getOverriddenImages, getOverriddenDescriptions, saveOverriddenDescription } from '../utils/imageDb';
import { 
  loginWithEmail, 
  logoutUser, 
  auth, 
  isFirebaseConfigured, 
  saveProductInDb, 
  createProductInDb, 
  deleteProductInDb,
  saveImageOverrideInDb,
  uploadImageToStorage
} from '../lib/firebase';

interface AdminDashboardProps {
  currentLang: 'KO' | 'EN' | 'JP';
  initialProducts: Product[];
  onProductsUpdated: (updatedList: Product[]) => void;
  onClose: () => void;
}

export default function AdminDashboard({
  currentLang,
  initialProducts,
  onProductsUpdated,
  onClose
}: AdminDashboardProps) {
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [imageTick, setImageTick] = React.useState(0);
  const [tempDescriptions, setTempDescriptions] = React.useState<Record<string, string>>({});

  const [user, setUser] = React.useState<any>(auth ? auth.currentUser : null);
  const [authLoading, setAuthLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState('');

  // Custom Email/Password form states
  const [loginEmail, setLoginEmail] = React.useState('lch200048@gmail.com');
  const [loginPassword, setLoginPassword] = React.useState('');
  
  // Modal states for editing or creating
  const [imageUploading, setImageUploading] = React.useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [newProduct, setNewProduct] = React.useState<Partial<Product>>({
    id: '',
    nameKO: '',
    nameEN: '',
    price: 0,
    category: 'ring',
    descriptionKO: '',
    descriptionEN: '',
    defaultImage: '',
    materialKO: '실버 925 (Sterling Silver)',
    materialEN: '925 Sterling Silver',
    options: {}
  });

  const [dbStatus, setDbStatus] = React.useState<'firestore' | 'demo'>(
    isFirebaseConfigured() ? 'firestore' : 'demo'
  );

  // Monitor Auth state changes if Firebase is connected
  React.useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged((currUser: any) => {
      setUser(currUser);
    });
    return () => unsubscribe();
  }, []);

  // Update internal product list when initial list changes
  React.useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const handleAdminFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setAuthError('이메일과 비밀번호를 모두 입력해주십시오.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const loggedUser = await loginWithEmail(loginEmail, loginPassword);
      if (!loggedUser) {
        throw new Error('로그인 실패: 유효한 사용자 정보를 수신하지 못했습니다.');
      }
      
      // Strict Admin email check
      if (loggedUser.email !== 'lch200048@gmail.com') {
        setAuthError(`액세스 거부: ${loggedUser.email} 계정은 관리자 권한이 없습니다. 등록된 관리자 계정(lch200048@gmail.com)으로 로그인해주세요.`);
        if (isFirebaseConfigured()) {
          await logoutUser();
        }
        setUser(null);
      } else {
        setUser(loggedUser);
      }
    } catch (err: any) {
      setAuthError(err.message || '로그인 도중 오류가 발생했습니다.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminSignOut = async () => {
    try {
      if (isFirebaseConfigured()) {
        await logoutUser();
      }
      setUser(null);
      setAuthError('');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Safe input handlers
  const handleEditProductChange = (field: keyof Product, value: any) => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      [field]: value
    });
  };

  const handleNewProductChange = (field: keyof Product, value: any) => {
    setNewProduct({
      ...newProduct,
      [field]: value
    });
  };

  // Optimized high-level image upload handler for Firebase Storage (Requirement #1, #2, #3 & #5)
  // Fully prevents raw base64 or localStorage bloating by uploading immediately to Firebase Storage and setting download URL
  const handleProductImageUpload = async (file: File, productId: string, isNewProduct: boolean) => {
    const targetProdId = productId || 'new_product_' + Date.now();
    setImageUploading(isNewProduct ? 'new' : targetProdId);
    
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const rawBase64 = await base64Promise;
      
      // Auto-compress base64 to target safe specifications (JPEG quality 0.75, width <= 800)
      const compressed = await compressImage(rawBase64, 800);
      
      // Direct Storage upload (falls back to a lightweight, safe localized Blob ObjURL in offline/demo mode)
      const finalUrl = await uploadImageToStorage(targetProdId, compressed);
      
      if (isNewProduct) {
        setNewProduct(prev => ({
          ...prev,
          defaultImage: finalUrl,
          imageUrl: finalUrl
        }));
      } else {
        setEditingProduct(prev => prev ? {
          ...prev,
          defaultImage: finalUrl,
          imageUrl: finalUrl
        } : null);
      }
    } catch (err) {
      console.error('Failed to process/upload product image:', err);
      alert('상품 대표 이미지 Firebase Storage 업로드에 실패했습니다. 데이터를 다시 확인하십시오.');
    } finally {
      setImageUploading(null);
    }
  };

  // CRUD operation: Create
  // Helper to parse errors precisely based on user requirement #6
  const parseErrorMessage = (err: any): string => {
    const errMsg = err instanceof Error ? err.message : String(err);
    
    if (
      errMsg.includes('QuotaExceededError') || 
      errMsg.includes('quota exceeded') || 
      errMsg.includes('LOCAL_STORAGE_QUOTA_EXCEEDED') || 
      errMsg.includes('Storage full') ||
      errMsg.includes('setItem')
    ) {
      return '로컬 브라우저 저장소(localStorage) 용량이 한계에 도달했습니다. 이전 브라우저 캐시 및 임시 파일 데이타가 꽉 찼으므로, 브라우저 데이터를 비우시거나 크래시 복구 후 다시 진행하십시오.';
    }
    if (
      errMsg.includes('permission-denied') || 
      errMsg.includes('insufficient permissions') || 
      errMsg.includes('PERMISSION_DENIED') || 
      errMsg.includes('rules') ||
      errMsg.includes('firebase') && errMsg.includes('permission')
    ) {
      return 'Firebase Firestore database 권한(Security Rules) 보안 정책 위반 또는 인증 누락 오류입니다. 관리자 계정 권한이 올바른지 점검하세요.';
    }
    if (errMsg.includes('IMAGE_UPLOAD_FAILED')) {
      return `이미지 업로드에 실패했습니다: ${errMsg.replace('IMAGE_UPLOAD_FAILED:', '').trim()}`;
    }
    return errMsg;
  };

  const handleAddNewProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.id || !newProduct.nameKO || !newProduct.nameEN || !newProduct.price) {
      alert('상품 고유 ID, 한글명, 영문명 및 가격을 올바르게 채워주세요.');
      return;
    }

    if (products.some(p => p.id === newProduct.id)) {
      alert('이미 존재하는 상품 ID입니다. 다른 고유 ID를 설정하세요.');
      return;
    }

    const itemToAdd = {
      ...newProduct,
      price: Number(newProduct.price) || 0
    } as Product;

    try {
      // Save product in DB, obtaining clean, non-base64 image URL (Firebase Storage URL or light Blob URL)
      const savedProduct = await createProductInDb(itemToAdd, products);
      const updatedList = [...products, savedProduct];
      setProducts(updatedList);
      onProductsUpdated(updatedList);
      setIsAddModalOpen(false);
      // Reset formula
      setNewProduct({
        id: '',
        nameKO: '',
        nameEN: '',
        price: 0,
        category: 'ring',
        descriptionKO: '',
        descriptionEN: '',
        defaultImage: '',
        materialKO: '실버 925 (Sterling Silver)',
        materialEN: '925 Sterling Silver',
        options: {}
      });
      alert('상품을 성공적으로 데이터베이스에 추가하였습니다.');
    } catch (err: any) {
      console.error('Add failed:', err);
      const detailedMessage = parseErrorMessage(err);
      alert(`새 상품 추가 저장과정 중 오류가 발생했습니다.\n\n오류 원인 파악: ${detailedMessage}`);
    }
  };

  // CRUD operation: Update
  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      // Save product in DB, obtaining clean, non-base64 image URL (Firebase Storage URL or light Blob URL)
      const savedProduct = await saveProductInDb(editingProduct, products);
      const updatedList = products.map(p => p.id === editingProduct.id ? savedProduct : p);
      setProducts(updatedList);
      onProductsUpdated(updatedList);
      setIsEditModalOpen(false);
      setEditingProduct(null);
      alert('상품 정보 저장이 완료되었습니다.');
    } catch (err: any) {
      console.error('Update failed:', err);
      const detailedMessage = parseErrorMessage(err);
      alert(`상품 수정을 저장하는 도중 오류가 발생했습니다.\n\n오류 원인 파악: ${detailedMessage}`);
    }
  };

  // CRUD operation: Delete
  const handleDeleteProduct = async (id: string) => {
    if (!confirm(`정말로 해당 상품 (ID: ${id})을 완전히 삭제하겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      await deleteProductInDb(id, products);
      const updatedList = products.filter(p => p.id !== id);
      setProducts(updatedList);
      onProductsUpdated(updatedList);
      alert('상품을 성공적으로 삭제하였습니다.');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('상태 삭제 처리 중 에러가 수신되었습니다. DB 권한 설정을 확인하세요.');
    }
  };

  const isAdminAuthenticated = user && user.email === 'lch200048@gmail.com';

  return (
    <div className="bg-[#FAF8F5] min-h-screen text-stone-800 font-sans border-t border-stone-200">
      
      {/* Visual Workspace Hero Banner */}
      <div className="bg-stone-900 text-white py-12 px-6 shadow-sm relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(#3a352d_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs text-amber-400 font-mono tracking-wider font-semibold uppercase">
              <Database size={13} />
              <span>MINUA Atelier Atelier Database Center</span>
              <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${dbStatus === 'firestore' ? 'bg-amber-500/25 text-amber-300 border border-amber-400/20' : 'bg-stone-700 text-stone-300'}`}>
                {dbStatus === 'firestore' ? 'Firebase Live' : 'Demo Memory DB'}
              </span>
            </div>
            
            <h1 className="text-3xl font-sans tracking-tight font-medium text-stone-100">
              MINUA 관리자 본부 <span className="font-light text-stone-400">/ Workspace</span>
            </h1>
            <p className="text-stone-300 text-xs mt-1 max-w-xl font-light leading-relaxed">
              이 공간은 디자인 스튜디오 소유주용 펜스입니다. 이곳에서 귀하가 디자인한 제품들의 가격 정보, 한국어/영어 상품 제원, 세부 이미지들을 안전하게 제어하고 Firebase Cloud에 즉각 동기화시킵니다.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white rounded-lg border border-stone-700/60 transition-colors text-xs flex items-center gap-2 font-medium cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>스토리 홈으로 가기</span>
            </button>
            {isAdminAuthenticated && (
              <button
                onClick={handleAdminSignOut}
                className="px-4 py-2 bg-red-950/40 hover:bg-red-950/60 text-red-300 rounded-lg border border-red-900/40 transition-colors text-xs flex items-center gap-1.5 font-medium cursor-pointer"
              >
                <LogOut size={13} />
                <span>관리자 로그아웃</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        
        {/* UNAUTHENTICATED GUEST INTERFACE */}
        {!isAdminAuthenticated ? (
          <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-stone-200/85 p-8 shadow-xs text-center">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="text-amber-700" size={24} />
            </div>
            
            <h2 className="text-xl font-sans font-medium tracking-tight mb-2">
              관리자 전용 로그인 터미널
            </h2>
            <p className="text-stone-500 text-xs mb-6 max-w-sm mx-auto leading-relaxed">
              본 시스템은 보안 인증을 수반합니다. 등록된 관리자 이메일(<span className="font-semibold text-stone-700">lch200048@gmail.com</span>)에 권한이 매칭되어 있습니다.
            </p>

            {authError && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-100/80 rounded-xl text-left flex gap-2">
                <AlertTriangle size={15} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-red-700 text-[11px] leading-relaxed font-normal">{authError}</p>
              </div>
            )}

            {!isFirebaseConfigured() && (
              <div className="mb-6 p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-left flex gap-2">
                <AlertTriangle size={15} className="text-amber-800 shrink-0 mt-0.5" />
                <div className="text-[11.5px] text-amber-900 leading-normal">
                  <p className="font-semibold mb-0.5">로컬 가상 데모 상태</p>
                  <p className="font-light text-stone-600">아직 Cloud Firebase 환경 연동이 감지되지 않았습니다. 현재 가상 어드민 모드로 즉시 수정 및 테스트해볼 수 있으며 가상의 관리자 계정으로 모의 로그인됩니다.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleAdminFormSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                  관리자 이메일 주소 (lch200048@gmail.com)
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                  비밀번호 (Password)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 py-3 bg-stone-900 hover:bg-stone-850 text-stone-100 rounded-xl font-medium tracking-wide text-xs transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-stone-300 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>관리자 계정으로 안전하게 로그인</span>
                )}
              </button>
            </form>
            
            <button
              onClick={onClose}
              className="w-full mt-3 py-2.5 text-stone-500 hover:text-stone-800 text-xs transition-colors cursor-pointer block underline"
            >
              돌아가기
            </button>
          </div>
        ) : (
          
          /* AUTHENTICATED ADMINISTRATOR WORKSPACE Dashboard */
          <div>
            
            {/* Database status banner info */}
            <div className="bg-white rounded-xl border border-stone-200/80 p-4.5 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-700 font-mono">Verified Session: {user.email}</div>
                  <div className="text-[11px] text-stone-500">인증 완료. 귀하는 모든 실버 카테고리 상품 목록 업로드, 가격 재설정, 디자인 정보 삭제를 할 수 있습니다.</div>
                </div>
              </div>
              
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-100 hover:text-white rounded-lg transition-transform hover:scale-[1.01] text-xs font-semibold tracking-wide flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>새 하이엔드 주얼리 추가</span>
              </button>
            </div>

            {/* PRODUCT CATALOG TABLE UI */}
            <h2 className="text-base font-semibold text-stone-900 font-sans tracking-tight mb-3">
              현재 활성화된 카탈로그 ({products.length} Items)
            </h2>
            
            <div className="bg-white rounded-xl border border-stone-200/80 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto min-w-full">
                <table className="min-w-full divide-y divide-stone-150">
                  <thead className="bg-[#FAF8F5]">
                    <tr>
                      <th scope="col" className="px-6 py-4.5 text-left text-[11px] uppercase tracking-wider font-semibold text-stone-500 font-sans">
                        이미지
                      </th>
                      <th scope="col" className="px-6 py-4.5 text-left text-[11px] uppercase tracking-wider font-semibold text-stone-500 font-sans">
                        품명 (KOR/ENG) / 분류
                      </th>
                      <th scope="col" className="px-6 py-4.5 text-left text-[11px] uppercase tracking-wider font-semibold text-stone-500 font-sans">
                        소재 사양 (Material)
                      </th>
                      <th scope="col" className="px-6 py-4.5 scope-col text-left text-[11px] uppercase tracking-wider font-semibold text-stone-500 font-sans">
                        단가 (KRW)
                      </th>
                      <th scope="col" className="px-6 py-4.5 text-right text-[11px] uppercase tracking-wider font-semibold text-stone-500 font-sans">
                        관리 제어선
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-stone-150">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-stone-50/50 transition-colors">
                        {/* Preview cell */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-stone-150 bg-stone-100 flex items-center justify-center relative group/img">
                            <img
                              src={prod.defaultImage}
                              alt={prod.nameEN}
                              className="w-full h-full object-contain p-1.5"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        </td>
                        
                        {/* Title and ID Cell */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-xs font-semibold text-stone-800">{prod.nameKO}</div>
                            <div className="text-[10px] text-stone-500 mb-1 font-mono">{prod.nameEN}</div>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-stone-100 text-stone-600 select-none uppercase font-sans tracking-wide">
                              {prod.category}
                            </span>
                          </div>
                        </td>
                        
                        {/* Materials info */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-stone-600 font-light font-sans max-w-[180px] truncate" title={prod.materialKO}>
                            {prod.materialKO}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono max-w-[180px] truncate">
                            {prod.materialEN}
                          </div>
                        </td>

                        {/* Price Tag info */}
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-semibold text-stone-900">
                          {prod.price.toLocaleString()} 원
                        </td>

                        {/* Control buttons */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                          <div className="flex gap-2.5 justify-end">
                            <button
                              onClick={() => {
                                setEditingProduct({ ...prod });
                                setIsEditModalOpen(true);
                              }}
                              className="text-stone-600 hover:text-amber-600 p-1.5 rounded-md hover:bg-stone-100 transition-colors cursor-pointer flex items-center gap-1 text-[10.5px]"
                              title="상세 수정"
                            >
                              <Edit3 size={13} />
                              <span>수정</span>
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1 text-[10.5px]"
                              title="완전 삭제"
                            >
                              <Trash2 size={13} />
                              <span>삭제</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-stone-400 font-light text-xs">
                          카탈로그가 전무합니다. 새로운 하이엔드 주얼리 아이템을 추가해주십시오.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CATEGORY REPRESENTATIVE IMAGE MANAGEMENT SECTION */}
            <div className="mt-12 bg-[#FAF8F5]/45 border border-stone-200/80 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-stone-900 font-sans tracking-tight mb-2">
                카테고리 대표 이미지 관리 (Category Cover Images)
              </h2>
              <p className="text-stone-500 text-xs mb-6 max-w-2xl leading-relaxed">
                홈페이지에 표시되는 주요 카테고리(이링, 링, 네클리스, 브레이슬릿) 에 대한 대표 이미지를 안전하게 동기화합니다. 
                업로드된 이미지는 <strong>Firebase Storage</strong>에 영구 보존되며, Firestore Database에는 보안 이미지 다운로드 URL만 동기화됩니다. 
                (로컬 브라우저 디스크에는 이미지 base64 등의 부담스러운 데이터를 남겨두지 않습니다.)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { 
                    id: 'earring', 
                    labelUrlKey: 'col-earring-img', 
                    titleKO: '귀걸이 (Earring)', 
                    defaultImg: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80',
                    fallbackDbKeys: ['col-earring-img', 'earring-cat-stub']
                  },
                  { 
                    id: 'ring', 
                    labelUrlKey: 'col-ring-img', 
                    titleKO: '반지 (Ring)', 
                    defaultImg: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80',
                    fallbackDbKeys: ['col-ring-img', 'ring-cat-stub']
                  },
                  { 
                    id: 'necklace', 
                    labelUrlKey: 'col-necklace-img', 
                    titleKO: '목걸이 (Necklaces)', 
                    defaultImg: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
                    fallbackDbKeys: ['col-necklace-img', 'necklace-cat-stub']
                  },
                  { 
                    id: 'bracelet', 
                    labelUrlKey: 'col-bracelet-img', 
                    titleKO: '팔찌 (Bracelet)', 
                    defaultImg: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80',
                    fallbackDbKeys: ['col-bracelet-img', 'bracelet-cat-stub']
                  }
                ].map((categoryItem) => {
                  const resolvedImgUrl = getProductImage(categoryItem.labelUrlKey, categoryItem.defaultImg);
                  const isCustom = getOverriddenImages()[categoryItem.labelUrlKey] ? true : false;
                  
                  return (
                    <div 
                      key={categoryItem.id} 
                      className="bg-white border border-stone-200/85 rounded-xl p-4 flex flex-col justify-between shadow-2xs relative group"
                    >
                      <div>
                        {/* Title & Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[12.5px] font-sans font-semibold text-stone-850">
                            {categoryItem.titleKO}
                          </span>
                          {isCustom ? (
                            <span className="px-2 py-0.5 rounded-full text-[8.5px] font-semibold bg-amber-50 text-amber-700 select-none uppercase tracking-wider font-mono">
                              Custom Link
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[8.5px] font-semibold bg-stone-100 text-stone-500 select-none uppercase tracking-wider font-mono">
                              Default
                            </span>
                          )}
                        </div>

                        {/* Image Preview Window */}
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-stone-150 bg-stone-50 mb-4 flex items-center justify-center">
                          <img 
                            src={resolvedImgUrl} 
                            alt={categoryItem.titleKO}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>

                      {/* Management Controls */}
                      <div className="space-y-2">
                        {/* Custom Image Upload Input and Button */}
                        <label className="w-full py-2 bg-stone-50 hover:bg-stone-900 border border-stone-200 text-stone-800 hover:text-white rounded-lg cursor-pointer text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs">
                          <Camera size={13} />
                          <span>대표 이미지 변경</span>
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
                                    const base64 = reader.result as string;
                                    const compressed = await compressImage(base64, 1000);
                                    
                                    // 1. Upload compressed base64 to Firebase Storage and save URL in Firestore
                                    const finalUrl = await saveImageOverrideInDb(categoryItem.labelUrlKey, compressed);
                                    
                                    // 2. Also map to alternate database keys so they stay 100% in sync
                                    for (const altKey of categoryItem.fallbackDbKeys) {
                                      await saveImageOverrideInDb(altKey, finalUrl);
                                      saveOverriddenImage(altKey, finalUrl);
                                    }
                                    // 3. Force update rendering
                                    setImageTick(prev => prev + 1);
                                  } catch (err) {
                                    console.error('Failed to change category image:', err);
                                    alert('카테고리 이미지 변경에 실패했습니다. 데이터를 확인하십시오.');
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>

                        {/* Revert to default option */}
                        {isCustom && (
                          <button
                            onClick={async () => {
                              if (confirm('이 카테고리 이미지를 초기 디자인(기존 기본 이미지)으로 복원하시겠습니까?')) {
                                try {
                                  // Clear Firestore entries if they exist
                                  for (const keyToClear of categoryItem.fallbackDbKeys) {
                                    await saveImageOverrideInDb(keyToClear, '');
                                    
                                    // Delete from local cache
                                    const localOverrides = getOverriddenImages();
                                    delete localOverrides[keyToClear];
                                    localStorage.setItem('minua_image_overrides', JSON.stringify(localOverrides));
                                  }
                                  setImageTick(prev => prev + 1);
                                } catch (err) {
                                  console.error('Failed to reset category image:', err);
                                }
                              }
                            }}
                            className="w-full py-1.5 bg-red-50 hover:bg-red-150 text-red-700 border border-red-200 hover:border-red-300 rounded-lg cursor-pointer text-[10.5px] font-medium flex items-center justify-center gap-1 transition-colors"
                          >
                            <RotateCcw size={11} />
                            <span>기본 디자인으로 원복</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BRAND PACKAGING DESCRIPTION MANAGEMENT SECTION */}
            <div className="mt-12 bg-[#FAF8F5]/45 border border-stone-200/80 rounded-2xl p-6 text-left">
              <h2 className="text-base font-semibold text-stone-900 font-sans tracking-tight mb-2">
                Brand Packaging 관리 (Brand Packaging Customizer)
              </h2>
              <p className="text-stone-500 text-xs mb-6 max-w-2xl leading-relaxed">
                홈페이지 하단에 위치한 <strong>Brand Packaging</strong> 섹션의 기프트 설명글 문구를 직접 커스텀 수정하여 영구 보관 관리합니다.<br />
                수정한 카피는 메인 시그니처 프레젠테이션 카드 공간에 동기화되어 즉각 실시간 반영됩니다.<br />
                <span className="text-amber-700 font-semibold">⚠️ 설명글 변경 시 관리자 암호 확인이 필요합니다.</span>
              </p>

              <div className="bg-white border border-stone-200/85 rounded-xl p-5 shadow-2xs">
                <div className="space-y-4">
                  <label className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider block">
                    Packaging Description Text
                  </label>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] font-medium text-stone-700 block mb-1">설명글 문구 내용</span>
                      <textarea
                        rows={6}
                        value={tempDescriptions['brand-packaging-image'] !== undefined 
                          ? tempDescriptions['brand-packaging-image'] 
                          : (getOverriddenDescriptions()['brand-packaging-image'] || "미누아의 시그니처 쇼핑백과 고급 선물 패키징은 주얼리를 구매하시는 모든 분들에게 무상으로 제공되는 세련된 선물 제안입니다. 튼튼하면서도 클래식한 마감의 감각적인 기프트 하드 박스와 프렌치 실크 리본이 소중한 마음에 영원의 숨결과 은은하게 머금는 명품 본연의 깊이감을 더해 줍니다.")
                        }
                        onChange={(e) => {
                          setTempDescriptions(prev => ({
                            ...prev,
                            'brand-packaging-image': e.target.value
                          }));
                        }}
                        className="w-full text-xs leading-relaxed p-3 border border-stone-200 rounded-lg bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-700/10 text-stone-700 placeholder-stone-400"
                        placeholder="Brand Packaging에 대한 감각적인 고급 멘트를 기입해 주십시오..."
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={async () => {
                          const pw = prompt('관리자 비밀번호를 입력해주십시오:');
                          if (pw !== 'minua144000') {
                            alert('비밀번호가 올바르지 않습니다. 관리자 권한이 없습니다.');
                            return;
                          }
                          const keyName = 'brand-packaging-image';
                          const descVal = tempDescriptions[keyName] !== undefined 
                            ? tempDescriptions[keyName] 
                            : (getOverriddenDescriptions()[keyName] || "미누아의 시그니처 쇼핑백과 고급 선물 패키징은 주얼리를 구매하시는 모든 분들에게 무상으로 제공되는 세련된 선물 제안입니다. 튼튼하면서도 클래식한 마감의 감각적인 기프트 하드 박스와 프렌치 실크 리본이 소중한 마음에 영원의 숨결과 은은하게 머금는 명품 본연의 깊이감을 더해 줍니다.");

                          try {
                            const currentImage = getOverriddenImages()[keyName] || '';
                            const imageToSave = currentImage || 'empty';
                            await saveImageOverrideInDb(keyName, imageToSave, descVal);
                            
                            const savedDescs = getOverriddenDescriptions();
                            savedDescs[keyName] = descVal;
                            localStorage.setItem('minua_image_descriptions', JSON.stringify(savedDescs));
                            
                            setImageTick(prev => prev + 1);
                            alert('Brand Packaging 설명문 저장이 드디어 성공 매칭 처리되었습니다.');
                          } catch (err) {
                            console.error('Failed to save packaging text:', err);
                            alert('설명글 저장에 실패했습니다.');
                          }
                        }}
                        className="px-5 py-2 bg-stone-900 text-white hover:bg-amber-900 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                      >
                        설명 텍스트 변경사항 저장 적용
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* RENDER MODAL: EDIT PRODUCT DETAILS */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs transition-opacity overflow-y-auto">
          <div className="bg-white rounded-2xl border border-stone-200 w-full max-w-xl shadow-lg flex flex-col max-h-[90vh]">
            
            {/* Modal Title header */}
            <div className="px-6 py-4.5 border-b border-stone-150 flex justify-between items-center bg-[#FAF8F5] shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 size={15} className="text-stone-600 animate-pulse" />
                <h3 className="text-sm font-semibold text-stone-900 font-sans tracking-tight">
                  하이엔드 주얼리 제원 변경 ({editingProduct.id})
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-stone-450 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scroll content form */}
            <form onSubmit={handleUpdateProductSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Image upload selector layout */}
              <div className="bg-stone-50 rounded-xl p-4 border border-dashed border-stone-200 text-center">
                <div className="w-20 h-20 mx-auto rounded-lg border border-stone-200 bg-white flex items-center justify-center overflow-hidden mb-3">
                  {imageUploading === editingProduct.id ? (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[8px] text-stone-500 font-sans">업로드 중</span>
                    </div>
                  ) : editingProduct.defaultImage ? (
                    <img
                      src={editingProduct.defaultImage}
                      alt="수정용 주얼리 이미지 미리보기"
                      className="w-full h-full object-contain p-1"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-[10px] text-stone-450">미등록</span>
                  )}
                </div>
                
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-850 text-white text-[10px] rounded-lg tracking-wide font-mono font-medium shadow-xs hover:scale-[1.01] transition-transform cursor-pointer">
                  <Camera size={13} />
                  <span>{imageUploading === editingProduct.id ? '대표 이미지 업로드 중' : '상품 대표 실버 이미지 교체'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={imageUploading === editingProduct.id}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleProductImageUpload(file, editingProduct.id, false);
                      }
                    }}
                  />
                </label>
                <p className="text-[9px] text-stone-450 mt-1">파일 용량을 가급적 500KB 이하로 맞춰 로딩 편의를 증진하십시오.</p>
              </div>

              {/* Title inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10.5px] font-semibold text-stone-500 mb-1">상품 국문명 <span className="text-amber-600">*</span></label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nameKO}
                    onChange={(e) => handleEditProductChange('nameKO', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20"
                  />
                </div>
                
                <div>
                  <label className="block text-[10.5px] font-semibold text-stone-500 mb-1">상품 영문명 <span className="text-amber-600">*</span></label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nameEN}
                    onChange={(e) => handleEditProductChange('nameEN', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20"
                  />
                </div>
              </div>

              {/* Price and Category inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10.5px] font-semibold text-stone-500 mb-1">단가 가격 (KRW) <span className="text-amber-600">*</span></label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingProduct.price}
                    onChange={(e) => handleEditProductChange('price', Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20"
                  />
                </div>
                
                <div>
                  <label className="block text-[10.5px] font-semibold text-stone-500 mb-1">디자인 분류 카테고리 <span className="text-amber-600">*</span></label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => handleEditProductChange('category', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20"
                  >
                    <option value="ring">반지 (Ring)</option>
                    <option value="bracelet">팔찌 (Bracelet)</option>
                    <option value="keyring">키링 (Keyring)</option>
                    <option value="earring">귀걸이 (Earring)</option>
                    <option value="necklace">목걸이 (Necklace)</option>
                    <option value="gift">커플 / 선물 (Couple / Gift)</option>
                  </select>
                </div>
              </div>

              {/* Materials inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10.5px] font-semibold text-stone-500 mb-1">상세 국문 재료 제원 <span className="text-amber-600">*</span></label>
                  <input
                    type="text"
                    required
                    value={editingProduct.materialKO}
                    onChange={(e) => handleEditProductChange('materialKO', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20"
                  />
                </div>
                
                <div>
                  <label className="block text-[10.5px] font-semibold text-stone-500 mb-1">상세 영문 재료 제원 <span className="text-amber-600">*</span></label>
                  <input
                    type="text"
                    required
                    value={editingProduct.materialEN}
                    onChange={(e) => handleEditProductChange('materialEN', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20"
                  />
                </div>
              </div>

              {/* Description KO */}
              <div>
                <label className="block text-[10.5px] font-semibold text-stone-500 mb-1">한국어 상품 시놉시스 및 세부 가이드</label>
                <textarea
                  rows={3}
                  value={editingProduct.descriptionKO}
                  onChange={(e) => handleEditProductChange('descriptionKO', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20 leading-relaxed font-sans"
                />
              </div>

              {/* Description EN */}
              <div>
                <label className="block text-[10.5px] font-semibold text-stone-500 mb-1">영어 상품 시놉시스 및 세부 가이드</label>
                <textarea
                  rows={3}
                  value={editingProduct.descriptionEN}
                  onChange={(e) => handleEditProductChange('descriptionEN', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20 leading-relaxed font-sans"
                />
              </div>

              {/* Bottom control anchors */}
              <div className="pt-4 border-t border-stone-150 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 text-stone-600 hover:text-stone-850 bg-stone-100 hover:bg-stone-200 transition-colors rounded-lg text-xs font-semibold cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 hover:bg-amber-900 text-white rounded-lg text-xs font-semibold transition-transform hover:scale-[1.01] flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save size={13} />
                  <span>수정한 디자인 정보 영구 저장</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* RENDER MODAL: ADD BRAND-NEW PRODUCT ITEM */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs transition-opacity overflow-y-auto">
          <div className="bg-white rounded-2xl border border-stone-200 w-full max-w-xl shadow-lg flex flex-col max-h-[90vh]">
            
            {/* Modal Title header */}
            <div className="px-6 py-4.5 border-b border-stone-150 flex justify-between items-center bg-[#FAF8F5] shrink-0">
              <div className="flex items-center gap-2">
                <Plus size={15} className="text-emerald-600" />
                <h3 className="text-sm font-semibold text-stone-900 font-sans tracking-tight">
                  새로운 하이엔드 주얼리 아이템 업로드
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-450 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scroll content form */}
            <form onSubmit={handleAddNewProductSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Image upload selector layout */}
              <div className="bg-stone-50 rounded-xl p-4 border border-dashed border-stone-200 text-center">
                <div className="w-20 h-20 mx-auto rounded-lg border border-stone-200 bg-white flex items-center justify-center overflow-hidden mb-3">
                  {imageUploading === 'new' ? (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[8px] text-stone-500 font-sans">업로드 중</span>
                    </div>
                  ) : newProduct.defaultImage ? (
                    <img
                      src={newProduct.defaultImage}
                      alt="새로운 주얼리 이미지 미리보기"
                      className="w-full h-full object-contain p-1"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-[10px] text-stone-450">미등록</span>
                  )}
                </div>
                
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-850 text-white text-[10px] rounded-lg tracking-wide font-mono font-medium shadow-xs hover:scale-[1.01] transition-transform cursor-pointer">
                  <Camera size={13} />
                  <span>{imageUploading === 'new' ? '대표 이미지 업로드 중' : '상품 대표 실버 이미지 선택'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={imageUploading === 'new'}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleProductImageUpload(file, newProduct.id || 'new_product_' + Date.now(), true);
                      }
                    }}
                  />
                </label>
                <p className="text-[9px] text-stone-450 mt-1">대표 이미지는 필수 규격입니다. 되도록 흰색(또는 밝은 무채색) 배경 사진을 사용하세요.</p>
              </div>

              {/* Product ID and Name inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10.5px] font-semibold text-stone-500 mb-1">상품 고유 코드 ID <span className="text-amber-600">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="예: classic-ring-03"
                    value={newProduct.id}
                    onChange={(e) => handleNewProductChange('id', e.target.value.toLowerCase().trim())}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20"
                  />
                </div>
                
                <div>
                  <label className="block text-[10.5px] font-semibold text-stone-500 mb-1">상품 국문명 <span className="text-amber-600">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="예: 실버 리프 웨이브 반지"
                    value={newProduct.nameKO}
                    onChange={(e) => handleNewProductChange('nameKO', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20"
                  />
                </div>
                
                <div>
                  <label className="block text-[10.5px] font-semibold text-stone-500 mb-1">상품 영문명 <span className="text-amber-600">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="예: Silver Leaf Wave Ring"
                    value={newProduct.nameEN}
                    onChange={(e) => handleNewProductChange('nameEN', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20"
                  />
                </div>
              </div>

              {/* Price and Category inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10.5px] font-semibold text-stone-500 mb-1">단가 가격 (KRW) <span className="text-amber-600">*</span></label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="79000"
                    value={newProduct.price || ''}
                    onChange={(e) => handleNewProductChange('price', Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20"
                  />
                </div>
                
                <div>
                  <label className="block text-[10.5px] font-semibold text-stone-500 mb-1">디자인 분류 카테고리 <span className="text-amber-600">*</span></label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => handleNewProductChange('category', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20"
                  >
                    <option value="ring">반지 (Ring)</option>
                    <option value="bracelet">팔찌 (Bracelet)</option>
                    <option value="keyring">키링 (Keyring)</option>
                    <option value="earring">귀걸이 (Earring)</option>
                    <option value="necklace">목걸이 (Necklace)</option>
                    <option value="gift">커플 / 선물 (Couple / Gift)</option>
                  </select>
                </div>
              </div>

              {/* Materials inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10.5px] font-semibold text-stone-500 mb-1">상세 국문 재료 제원 <span className="text-amber-600">*</span></label>
                  <input
                    type="text"
                    required
                    value={newProduct.materialKO || ''}
                    onChange={(e) => handleNewProductChange('materialKO', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20"
                  />
                </div>
                
                <div>
                  <label className="block text-[10.5px] font-semibold text-stone-500 mb-1">상세 영문 재료 제원 <span className="text-amber-600">*</span></label>
                  <input
                    type="text"
                    required
                    value={newProduct.materialEN || ''}
                    onChange={(e) => handleNewProductChange('materialEN', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20"
                  />
                </div>
              </div>

              {/* Description KO */}
              <div>
                <label className="block text-[10.5px] font-semibold text-stone-500 mb-1">한국어 상품 시놉시스 및 세부 가이드</label>
                <textarea
                  rows={3}
                  placeholder="디자인에 영감을 준 서사나 연출법을 기록하십시오."
                  value={newProduct.descriptionKO || ''}
                  onChange={(e) => handleNewProductChange('descriptionKO', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20 leading-relaxed font-sans"
                />
              </div>

              {/* Description EN */}
              <div>
                <label className="block text-[10.5px] font-semibold text-stone-500 mb-1">영어 상품 시놉시스 및 세부 가이드</label>
                <textarea
                  rows={3}
                  placeholder="Record the design inspiration or unique features in English."
                  value={newProduct.descriptionEN || ''}
                  onChange={(e) => handleNewProductChange('descriptionEN', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-stone-50/20 leading-relaxed font-sans"
                />
              </div>

              {/* Bottom control anchors */}
              <div className="pt-4 border-t border-stone-150 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-850 bg-stone-100 hover:bg-stone-200 transition-colors rounded-lg text-xs font-semibold cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-transform hover:scale-[1.01] flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus size={14} />
                  <span>새 디자인 주얼리 즉시 등록</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
