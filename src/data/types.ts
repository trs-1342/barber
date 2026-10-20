export type ID = string;

export type Service = {
  id: ID;
  name: string;
  durationMin: number;
  price: number; // TL, kuruşsuz
  category: string;
};

export type Staff = {
  id: ID;
  name: string;
  title: string;
  avatar?: string;
  rating: number;
};

export type Shop = {
  id: ID;
  name: string;
  district: string;
  address: string;
  rating: number;
  reviewCount: number;
  cover?: string;
  tags: string[];
  /** Çalışma saatleri, 24 saat biçiminde. */
  opensAt: number;
  closesAt: number;
  services: Service[];
  staff: Staff[];
};

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'noshow';

export type Appointment = {
  id: ID;
  shopId: ID;
  shopName: string;
  staffId: ID | null; // null = "Farketmez"
  staffName: string;
  services: Service[];
  start: string; // ISO
  durationMin: number;
  total: number;
  status: AppointmentStatus;
};
