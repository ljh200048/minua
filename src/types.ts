/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  nameKO: string;
  nameEN: string;
  price: number;
  originalPrice?: number;
  category: 'ring' | 'bracelet' | 'keyring' | 'gift' | 'earring' | 'necklace';
  descriptionKO: string;
  descriptionEN: string;
  defaultImage: string;
  imageUrl?: string;
  materialKO: string;
  materialEN: string;
  options: {
    sizes?: string[]; // for rings or bracelets
    colors?: string[]; // e.g., Silver, Gold, Rose Gold
    charms?: string[]; // list of attachment charms available
    hasEngraving?: boolean;
  };
}

export interface CartItem {
  id: string; // unique for item + options combination
  product: Product;
  selectedSize?: string;
  selectedColor?: string;
  selectedCharms?: string[];
  engravingText?: string;
  quantity: number;
}

export interface Order {
  id: string;
  createdAt: string;
  items: CartItem[];
  shippingAddress: {
    name: string;
    phone: string;
    zipCode: string;
    address: string;
    addressDetail: string;
    memo?: string;
  };
  giftWrapping: {
    enabled: boolean;
    type: 'basic' | 'premium';
    messageCard?: string;
  };
  totalAmount: number;
  status: 'pending' | 'preparing' | 'shipping' | 'delivered';
  paymentMethod: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  author: string;
  rating: number;
  content: string;
  image?: string;
  createdAt: string;
}

export interface User {
  email: string;
  name: string;
  phone?: string;
}

export type LangType = 'KO' | 'EN' | 'JP';

