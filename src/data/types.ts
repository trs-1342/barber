export type ID = string;

export type Supplier = {
  id: ID;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  taxNumber: string;
};

export type Product = {
  id: ID;
  name: string;
  brand: string;
  category: string;
  price: number; // TL, birim fiyat
  stock: number;
  unit: string; // adet, koli, lt…
  active: boolean;
  featured: boolean;
};

export type OrderStatus = 'new' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export type OrderItem = { productId: ID; name: string; qty: number; unitPrice: number };

export type Order = {
  id: ID;
  code: string; // kullanıcıya gösterilen kısa sipariş no
  salonId: ID;
  salonName: string;
  salonDistrict: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string; // ISO
  note?: string;
};

export type PromotionStatus = 'active' | 'paused' | 'ended';

export type Promotion = {
  id: ID;
  productId: ID;
  productName: string;
  placement: 'featured' | 'banner' | 'search';
  dailyBudget: number;
  startsAt: string;
  endsAt: string;
  status: PromotionStatus;
  impressions: number;
  clicks: number;
};
