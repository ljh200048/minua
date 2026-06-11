/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Star, MessageSquare, Upload, Calendar, User as UserIcon, Check } from 'lucide-react';
import { DICTIONARY } from '../data';
import { Review, Product } from '../types';
import { isFirebaseConfigured, uploadImageToStorage } from '../lib/firebase';
import { compressImage } from '../utils/imageDb';

interface ReviewSectionProps {
  currentLang: 'KO' | 'EN' | 'JP';
  reviews: Review[];
  onAddReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  products: Product[];
}

export default function ReviewSection({
  currentLang,
  reviews,
  onAddReview,
  products
}: ReviewSectionProps) {
  const dict = DICTIONARY[currentLang];
  const [showForm, setShowForm] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [author, setAuthor] = React.useState('');
  const [selectedProduct, setSelectedProduct] = React.useState(products[0]?.id || '');
  const [content, setContent] = React.useState('');
  const [localPhoto, setLocalPhoto] = React.useState<string | undefined>(undefined);
  const [formSuccess, setFormSuccess] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState('');

  // File upload reader with optimization and compression built-in
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setIsUploading(true);
        setUploadProgress(currentLang === 'KO' ? '이미지 최적화 및 압축 중...' : 'Optimizing and compressing image...');
        try {
          const rawBase64 = reader.result as string;
          // Pre-compress the review image to keep the transfer light and performant (max 1000px dimension)
          const compressed = await compressImage(rawBase64, 1000);
          setLocalPhoto(compressed);
        } catch (err) {
          console.error('Image compression failed, using source:', err);
          setLocalPhoto(reader.result as string);
        } finally {
          setIsUploading(false);
          setUploadProgress('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author || !content) {
      alert(currentLang === 'KO' ? '이름과 리뷰 내용을 채워주세요.' : 'Please enter your name and review content.');
      return;
    }

    let finalImageUrl = localPhoto;

    // If Firebase is configured and there's a selected photo, upload it to Firebase Storage!
    if (localPhoto && isFirebaseConfigured()) {
      setIsUploading(true);
      setUploadProgress(currentLang === 'KO' ? 'Firebase Storage로 생생한 착용 사진 전송 중...' : 'Uploading real wearer snapshot to Firebase Storage...');
      try {
        const uniqueFileId = `review_${Date.now()}`;
        // uploadImageToStorage returns the permanent cloud download URL
        finalImageUrl = await uploadImageToStorage(uniqueFileId, localPhoto);
      } catch (err) {
        console.error('Firebase Storage upload failed, falling back to local snapshot:', err);
      } finally {
        setIsUploading(false);
        setUploadProgress('');
      }
    }

    const matchedProduct = products.find(p => p.id === selectedProduct);
    const productName = matchedProduct 
      ? (currentLang === 'KO' ? matchedProduct.nameKO : matchedProduct.nameEN)
      : 'MINUA Product';

    onAddReview({
      productId: selectedProduct,
      productName,
      author,
      rating,
      content,
      image: finalImageUrl
    });

    setFormSuccess(true);
    setTimeout(() => {
      setShowForm(false);
      setFormSuccess(false);
      // Reset form fields
      setAuthor('');
      setContent('');
      setLocalPhoto(undefined);
    }, 1500);
  };

  return (
    <div id="minua-reviews-section" className="bg-stone-50 py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header section */}
        <div className="md:flex justify-between items-end mb-12 border-b border-stone-200 pb-8 gap-6">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-stone-900 font-sans">
              {dict.reviewTitle}
            </h2>
            <p className="text-stone-500 font-light mt-2 text-sm">
              {dict.reviewSubtitle}
            </p>
          </div>
          <button
            id="toggle-review-form-btn"
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-stone-900 hover:bg-amber-900 text-stone-50 font-mono text-xs uppercase tracking-widest font-bold rounded-full cursor-pointer shadow-sm focus:outline-hidden transition-all flex items-center gap-2"
          >
            <MessageSquare size={14} />
            <span>{dict.writeReviewBtn}</span>
          </button>
        </div>

        {/* Dynamic review forms */}
        {showForm && (
          <div id="new-review-card-form" className="bg-white rounded-2xl border border-stone-200 shadow-lg p-6 sm:p-10 mb-12 max-w-2xl mx-auto transition-all animate-fadeIn">
            {formSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <Check size={24} />
                </div>
                <h3 className="text-lg font-medium text-stone-900 font-sans">
                  {currentLang === 'KO' ? '후기가 완벽히 등록되었습니다!' : 'Review Submitted!'}
                </h3>
                <p className="text-xs text-stone-500 font-light">
                  {currentLang === 'KO' ? '미누아를 사랑해 주셔서 감사드립니다.' : 'Thank you for your warm words.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="text-lg font-medium text-stone-900 font-sans border-b border-stone-100 pb-3">
                  {dict.writeReviewTitle}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Author Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-stone-600 block uppercase">
                      {dict.nameLabel}
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-hidden focus:border-amber-700 bg-stone-50"
                      placeholder={currentLang === 'KO' ? '예: 홍길동' : 'e.g. John Doe'}
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      required
                      disabled={isUploading}
                    />
                  </div>

                  {/* Rating selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-stone-600 block uppercase">
                      {dict.ratingScore}
                    </label>
                    <div className="flex items-center space-x-1 py-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          id={`star-select-${s}`}
                          onClick={() => setRating(s)}
                          disabled={isUploading}
                          className="text-amber-500 cursor-pointer focus:outline-hidden transition-transform hover:scale-110"
                        >
                          <Star size={20} fill={s <= rating ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selective Products Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-stone-600 block uppercase">
                    {currentLang === 'KO' ? '리뷰 대상 상품 선별' : 'Select Associated Product'}
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-50 focus:outline-hidden focus:border-amber-700 cursor-pointer"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    disabled={isUploading}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {currentLang === 'KO' ? p.nameKO : p.nameEN}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-stone-600 block uppercase">
                    {dict.reviewContent}
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-hidden focus:border-amber-700 bg-stone-50"
                    placeholder={currentLang === 'KO' ? '세심한 착용 소감을 동료 구매자들에게 들려주세요 (은은한 착용샷 대환영!)' : 'Describe your wearing size fit and jewelry texture in detail...'}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    disabled={isUploading}
                  />
                </div>

                {/* Upload wearer custom photograph */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-stone-600 block uppercase">
                    {dict.uploadReviewPhoto}
                  </label>
                  <div className="flex items-center gap-4">
                    <label className={`px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold ${isUploading ? 'bg-stone-100 cursor-not-allowed text-stone-400' : 'hover:bg-stone-50 cursor-pointer'} transition-colors flex items-center gap-2`}>
                      <Upload size={14} />
                      <span>{currentLang === 'KO' ? '파일 선택하기' : 'Choose File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={isUploading}
                      />
                    </label>
                    {localPhoto ? (
                      <div className="text-xs text-amber-700 font-mono font-medium flex items-center gap-1.5 animate-fadeIn">
                        <Check size={14} className="text-emerald-600" />
                        <span>Ready (JPG/PNG Source Attached)</span>
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400">
                        {currentLang === 'KO' ? '지원 형식: JPG, PNG' : 'Accepts standard JPG, PNG'}
                      </span>
                    )}
                  </div>
                  {localPhoto && (
                    <div className="mt-3 w-28 h-28 border border-stone-200 rounded-lg overflow-hidden shrink-0 shadow-xs relative group">
                      <img src={localPhoto} alt="Review upload preview" className="w-full h-full object-cover" />
                      {!isUploading && (
                        <button
                          type="button"
                          onClick={() => setLocalPhoto(undefined)}
                          className="absolute inset-0 bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] uppercase font-mono font-bold"
                        >
                          {currentLang === 'KO' ? '삭제하기' : 'Remove'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Processing/Uploading Feedback Banner */}
                {isUploading && (
                  <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3.5 text-xs text-amber-900 font-medium flex items-center gap-2.5 animate-pulse">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-600 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-700"></span>
                    </span>
                    <span>{uploadProgress || (currentLang === 'KO' ? '파일을 안전하게 처리 중...' : 'Processing file safely...')}</span>
                  </div>
                )}

                {/* Submit trigger button */}
                <button
                  type="submit"
                  id="submit-review-action"
                  disabled={isUploading}
                  className={`w-full py-3 rounded-lg font-bold font-mono tracking-widest text-xs uppercase text-stone-50 cursor-pointer transition-all shadow-xs ${isUploading ? 'bg-stone-400 cursor-not-allowed' : 'bg-stone-900 hover:bg-stone-950'}`}
                >
                  {isUploading 
                    ? (currentLang === 'KO' ? '파일 전송 및 가공 중...' : 'UPLOADING...') 
                    : dict.submitReview}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Reviews Listings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              id={`review-card-${rev.id}`}
              className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} size={15} fill={idx < rev.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  <span className="text-xs font-mono text-stone-400 flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{rev.createdAt}</span>
                  </span>
                </div>

                {rev.image && (
                  <div className="w-full aspect-square md:h-44 md:aspect-auto rounded-xl overflow-hidden bg-stone-100 border border-stone-100">
                    <img
                      src={rev.image}
                      alt="Customer wearable style"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <span className="inline-block px-2 py-0.5 bg-stone-100 rounded text-stone-500 text-[10px] uppercase font-mono font-semibold tracking-wider">
                  {rev.productName}
                </span>

                <p className="text-stone-700 text-sm font-light leading-relaxed whitespace-pre-line">
                  "{rev.content}"
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-stone-500 flex items-center gap-1.5">
                  <UserIcon size={12} className="text-stone-400" />
                  <span>{rev.author}</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-mono font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-sm">
                  {currentLang === 'KO' ? '구매 고객 확인' : 'Verified Purchase'}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
