

export interface Booking {
  id: number;
  confirmation_number: string;
  room_id: string;
  full_name: string;
  email: string;
  phone: string;
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  total: number;
  price_per_night: number;
  status: string;
  certified_doctor: string;
  special_requests: string | null;
  extras: string[];
  source?: string;
  created_at: string;
  reminder_sent_at?: string | null;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
}

// ── constants ─────────────────────────────────────────────────────────────────

export type Tab = "calendar" | "bookings" | "contacts";

// ── helpers ───────────────────────────────────────────────────────────────────

export interface FormData {
  roomId: string;
  fullName: string;
  email: string;
  phone: string;
  certifiedDoctor: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  pricePerNight: string;
  extras: string[];
  specialRequests: string;
  total: string;
  manualTotal: boolean;
}
