/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple manager to store user uploaded images in LocalStorage for persistence.
// This allows the user's uploaded images to persist across reloads and render on all products/banners.

export function saveOverriddenImage(id: string, base64Data: string): void {
  try {
    const overrides = getOverriddenImages();
    overrides[id] = base64Data;
    localStorage.setItem('minua_image_overrides', JSON.stringify(overrides));
  } catch (err) {
    console.error('Failed to save image to localStorage due to quota or error', err);
    alert('이미지 보관 공간(LocalStorage) 한도가 초과되었거나 오류가 발생했습니다. 고해상도 이미지 대신 가벼운 크기의 이미지를 권장합니다.');
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

export function getProductImage(productId: string, defaultUrl: string): string {
  const overrides = getOverriddenImages();
  return overrides[productId] || defaultUrl;
}

export function clearOverriddenImages(): void {
  localStorage.removeItem('minua_image_overrides');
}
