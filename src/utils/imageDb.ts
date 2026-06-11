/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple manager to store user uploaded images in LocalStorage for persistence.
// This allows the user's uploaded images to persist across reloads and render on all products/banners.

/**
 * Compresses a base64 or file image dynamically to a lightweight format
 * (JPEG, quality 0.75, max dimension 1000px) so it easily fits in localStorage 
 * or Firestore without violating 1MB/5MB limits.
 */
export function compressImage(base64DataUrl: string, maxDimension: number = 1000): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !base64DataUrl || !base64DataUrl.startsWith('data:')) {
      resolve(base64DataUrl);
      return;
    }

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
          resolve(base64DataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress as JPEG to dramatically shrink the string size (quality: 0.75)
        const compressed = canvas.toDataURL('image/jpeg', 0.75);
        resolve(compressed);
      } catch (err) {
        console.error('Image compression failed, using original:', err);
        resolve(base64DataUrl);
      }
    };
    img.onerror = () => {
      resolve(base64DataUrl);
    };
    img.src = base64DataUrl;
  });
}

export function base64ToBlobUrlLocal(base64Data: string): string {
  try {
    if (typeof window === 'undefined') return base64Data;
    const parts = base64Data.split(';base64,');
    if (parts.length < 2) return base64Data;
    const contentType = parts[0].split(':')[1] || 'image/jpeg';
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    const blob = new Blob([uInt8Array], { type: contentType });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Failed to convert base64 to blob url:', err);
    return base64Data;
  }
}

export function saveOverriddenImage(id: string, base64Data: string): void {
  try {
    const overrides = getOverriddenImages();
    let targetData = base64Data;
    if (base64Data && base64Data.startsWith('data:')) {
      targetData = base64ToBlobUrlLocal(base64Data);
    }
    overrides[id] = targetData;
    
    const safeOverrides: Record<string, string> = {};
    for (const key of Object.keys(overrides)) {
      if (overrides[key] && !overrides[key].startsWith('data:')) {
        safeOverrides[key] = overrides[key];
      }
    }
    localStorage.setItem('minua_image_overrides', JSON.stringify(safeOverrides));
  } catch (err) {
    console.error('Failed to save image to localStorage due to quota or error', err);
  }
}

export function getOverriddenImages(): Record<string, string> {
  try {
    const stored = localStorage.getItem('minua_image_overrides');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function importOverriddenImages(dict: Record<string, string>): void {
  try {
    const overrides = getOverriddenImages();
    Object.assign(overrides, dict);
    
    const safeOverrides: Record<string, string> = {};
    for (const key of Object.keys(overrides)) {
      if (overrides[key] && !overrides[key].startsWith('data:')) {
        safeOverrides[key] = overrides[key];
      }
    }
    localStorage.setItem('minua_image_overrides', JSON.stringify(safeOverrides));
  } catch (err) {
    console.error('Failed to merge overrides into localStorage', err);
  }
}

export function getProductImage(productId: string, defaultUrl: string): string {
  const overrides = getOverriddenImages();
  if (overrides[productId] === 'empty') {
    return 'empty';
  }
  let resolvedUrl = defaultUrl;
  if (!resolvedUrl) {
    resolvedUrl = 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&q=80';
  }
  if (resolvedUrl === '/images/ring-01.svg') {
    resolvedUrl = '/images/silhouette-wave-silver-ring.jpg';
  }
  return overrides[productId] || resolvedUrl;
}

export function clearOverriddenImages(): void {
  localStorage.removeItem('minua_image_overrides');
}

export function getOverriddenDescriptions(): Record<string, string> {
  try {
    const stored = localStorage.getItem('minua_image_descriptions');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveOverriddenDescription(id: string, text: string): void {
  try {
    const descriptions = getOverriddenDescriptions();
    descriptions[id] = text;
    localStorage.setItem('minua_image_descriptions', JSON.stringify(descriptions));
  } catch (err) {
    console.error('Failed to save description to localStorage', err);
  }
}

export function importOverriddenDescriptions(dict: Record<string, string>): void {
  try {
    const descriptions = getOverriddenDescriptions();
    Object.assign(descriptions, dict);
    localStorage.setItem('minua_image_descriptions', JSON.stringify(descriptions));
  } catch (err) {
    console.error('Failed to merge descriptions into localStorage', err);
  }
}

export function clearOverriddenDescriptions(): void {
  localStorage.removeItem('minua_image_descriptions');
}

