export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number | null;
  img: string;
  images?: string[];
  description: string;
  colors: string[];
  colorImages?: Record<string, string>;
  sizes: string[];
  createdAt?: number;
}

export interface CartItem {
  cartKey: string;
  id: string; // Product ID
  name: string;
  img: string;
  price: number;
  color: string;
  size: string;
  qty: number;
}

export interface Order {
  id: string;
  orderId: string;
  date: string;
  name: string;
  phone: string;
  address: string;
  shippingFee: number;
  paymentMethod: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  createdAt?: number;
}

export interface UserAccount {
  name: string;
  identifier: string;
  isAdmin?: boolean;
  photoURL?: string;
}
