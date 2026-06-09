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
import { 
  loginWithEmail, 
  logoutUser, 
  auth, 
  isFirebaseConfigured, 
  saveProductInDb, 
  createProductInDb, 
  deleteProductInDb 
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
  const [user, setUser] = React.useState<any>(auth ? auth.currentUser : null);
  const [authLoading, setAuthLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState('');

  // Custom Email/Password form states
  const [loginEmail, setLoginEmail] = React.useState('lch200048@gmail.com');
  const [loginPassword, setLoginPassword] = React.useState('');
  
  // Modal states for editing or creating
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

  // Image Upload handler to convert to base64
  const handleRawImageUpload = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // CRUD operation: Create
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
      await createProductInDb(itemToAdd, products);
      const updatedList = [...products, itemToAdd];
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
    } catch (err) {
      console.error('Add failed:', err);
      alert('새 상품 추가 저장과정 중 오류가 발생했습니다. 권한 및 Firebase 규칙을 점검하세요.');
    }
  };

  // CRUD operation: Update
  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      await saveProductInDb(editingProduct, products);
      const updatedList = products.map(p => p.id === editingProduct.id ? editingProduct : p);
      setProducts(updatedList);
      onProductsUpdated(updatedList);
      setIsEditModalOpen(false);
      setEditingProduct(null);
      alert('상품 정보 저장이 완료되었습니다.');
    } catch (err) {
      console.error('Update failed:', err);
      alert('상품 수정을 저장하는 도중 오류가 발생했습니다. Firebase Firestore 권한 설정을 점검하십시오.');
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
                  {editingProduct.defaultImage ? (
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
                  <span>상품 대표 실버 이미지 교체</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleRawImageUpload(file, (base64) => {
                          handleEditProductChange('defaultImage', base64);
                        });
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
                    <option value="gift">기프트 세트 (Gift Set)</option>
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
                  {newProduct.defaultImage ? (
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
                  <span>상품 대표 실버 이미지 선택</span>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleRawImageUpload(file, (base64) => {
                          handleNewProductChange('defaultImage', base64);
                        });
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
                    <option value="gift">기프트 세트 (Gift Set)</option>
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
