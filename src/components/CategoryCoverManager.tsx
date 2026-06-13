import React from 'react';
import { 
  Camera, 
  RotateCcw, 
  Check, 
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { CategoryDoc } from '../types';
import { 
  saveCategoryInDb, 
  uploadCategoryImageToStorage 
} from '../lib/firebase';

interface CategoryCoverManagerProps {
  isAdmin: boolean;
  categoriesList: CategoryDoc[];
  onUpdate: () => void;
}

const CATEGORY_INFOS = [
  { id: 'ring', labelKO: '반지', labelEN: 'Rings', defaultUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1000&q=80' },
  { id: 'bracelet', labelKO: '팔찌', labelEN: 'Bracelets', defaultUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1000&q=80' },
  { id: 'keyring', labelKO: '키링', labelEN: 'Keyrings', defaultUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=1000&q=80' },
  { id: 'earring', labelKO: '귀걸이', labelEN: 'Earrings', defaultUrl: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=1000&q=80' },
  { id: 'necklace', labelKO: '목걸이', labelEN: 'Necklaces', defaultUrl: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=1000&q=80' },
  { id: 'gift', labelKO: '선물/커플', labelEN: 'Gifts & Couples', defaultUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1000&q=80' },
];

export default function CategoryCoverManager({ isAdmin, categoriesList, onUpdate }: CategoryCoverManagerProps) {
  const [uploadingId, setUploadingId] = React.useState<string | null>(null);

  // Read selected file, compress/convert to base64, upload, and save in DB
  const handleImageChange = async (categoryId: string, file: File) => {
    if (!isAdmin) {
      alert('관리자 권한이 없습니다.');
      return;
    }

    setUploadingId(categoryId);
    try {
      // Step 1: Compress and convert the file to base64 data URL
      const base64Data = await fileToCompressedBase64(file);
      if (!base64Data) {
        throw new Error('의미있는 이미지 데이터를 읽는데 실패했습니다.');
      }

      // Step 2: Upload to Firebase Storage
      const downloadUrl = await uploadCategoryImageToStorage(categoryId, base64Data);
      
      // Step 3: Save the download URL inside Firestore
      await saveCategoryInDb(categoryId, downloadUrl);
      
      // Step 4: Propagate changes to parent
      onUpdate();
      alert(`[${categoryId.toUpperCase()}] 카테고리 대표 이미지가 성공적으로 변경 동기화되었습니다.`);
    } catch (err: any) {
      console.error('Failed to change category cover image:', err);
      alert(`카테고리 대표 이미지 변경에 실패했습니다.\n사유: ${err.message || String(err)}`);
    } finally {
      setUploadingId(null);
    }
  };

  // Reset category image to default
  const handleResetToDefault = async (categoryId: string) => {
    if (!isAdmin) {
      alert('관리자 권한이 없습니다.');
      return;
    }

    if (!confirm(`정말로 이 카테고리 (${categoryId})의 이미지를 미누아 에디션 기본형 이미지로 복구하겠습니까?`)) {
      return;
    }

    setUploadingId(categoryId);
    try {
      // Save 'empty' so it falls back to the system default URL
      await saveCategoryInDb(categoryId, 'empty');
      onUpdate();
      alert(`[${categoryId.toUpperCase()}] 카테고리가 기본 대표 이미지로 복구되었습니다.`);
    } catch (err: any) {
      console.error('Failed to reset category image:', err);
      alert('대표 이미지 복구 과정에서 실패가 발생했습니다.');
    } finally {
      setUploadingId(null);
    }
  };

  // Convert File to compressed base64 data URL
  const fileToCompressedBase64 = (file: File, maxDimension: number = 1000): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          try {
            let width = img.width;
            let height = img.height;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(reader.result as string);
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            resolve(compressed);
          } catch (e) {
            resolve(reader.result as string);
          }
        };
        img.onerror = (e) => reject(e);
        img.src = reader.result as string;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="mt-12 bg-[#FAF8F5]/45 border border-stone-200/80 rounded-2xl p-6 text-left" id="category-cover-manager-section">
      <div className="flex items-center gap-2 mb-2">
        <FolderOpen size={16} className="text-amber-800" />
        <h2 className="text-base font-semibold text-stone-900 font-sans tracking-tight">
          카테고리 대표 이미지 관리 (Category Cover Images)
        </h2>
      </div>
      <p className="text-stone-500 text-xs mb-6 max-w-2xl leading-relaxed">
        미누아 겉 테마 및 서브 필터링 공간 등에서 사용되는 각 주요 카테고리별 대표 커버 이미지를 직접 관리하고 수정합니다.<br />
        업로드된 신규 이미지는 Firebase Storage에 영구 보관되며 Firestore와 연동되어 실시간 반영됩니다.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORY_INFOS.map((catValue) => {
          // Find if there is an overridden image URL in database or fallback local
          const foundDoc = categoriesList.find(c => c.id === catValue.id);
          const currentUrl = foundDoc && foundDoc.categoryImageUrl && foundDoc.categoryImageUrl !== 'empty'
            ? foundDoc.categoryImageUrl
            : catValue.defaultUrl;

          const isOverridden = foundDoc && foundDoc.categoryImageUrl && foundDoc.categoryImageUrl !== 'empty';
          const isUploading = uploadingId === catValue.id;

          return (
            <div 
              key={catValue.id} 
              className="bg-white border border-stone-200/85 rounded-xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow relative"
              id={`cat-cover-card-${catValue.id}`}
            >
              {/* Image box */}
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-stone-100 border border-stone-100 mb-3 flex items-center justify-center">
                <img 
                  src={currentUrl} 
                  alt={`${catValue.labelKO} Cover`} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = catValue.defaultUrl;
                  }}
                />

                {/* Overrides indicator tab */}
                {isOverridden && (
                  <div className="absolute top-2 left-2 bg-stone-900/90 text-[9px] font-mono font-bold tracking-widest text-amber-400 px-2 py-0.5 rounded-full uppercase scale-90 origin-top-left flex items-center gap-1">
                    <Check size={8} />
                    <span>Custom</span>
                  </div>
                )}

                {/* Uplading Spinner overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5 text-white">
                    <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-sans">동기화 전송 중</span>
                  </div>
                )}
              </div>

              {/* Title and stats details */}
              <div className="space-y-1 mb-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold text-stone-900 font-sans tracking-tight">
                    {catValue.labelKO}
                  </h3>
                  <span className="text-[10px] font-mono text-stone-400 font-semibold tracking-wider uppercase">
                    {catValue.labelEN}
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 font-mono tracking-tight break-all line-clamp-1">
                  ID: {catValue.id}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <label className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                  isUploading 
                    ? 'bg-stone-50 text-stone-400 border-stone-200 cursor-not-allowed pointer-events-none'
                    : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200 active:bg-stone-100'
                }`}>
                  <Camera size={13} />
                  <span>대표 교체</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading || !isAdmin}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageChange(catValue.id, file);
                      }
                    }}
                  />
                </label>

                {isOverridden && (
                  <button
                    onClick={() => handleResetToDefault(catValue.id)}
                    disabled={isUploading || !isAdmin}
                    className="px-2.5 py-1.5 bg-stone-50 hover:bg-red-50 hover:text-red-700 hover:border-red-100 text-stone-500 border border-stone-200 rounded-lg cursor-pointer transition-colors flex items-center justify-center"
                    title="기본값으로 복구"
                  >
                    <RotateCcw size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
