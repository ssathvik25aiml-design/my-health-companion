export interface User {
  id: string;
  phone: string;
  created_at: string;
}

export interface Medicine {
  id: string;
  user_id: string;
  name: string;
  strength: string;
  expiry_date: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  doctor_name: string;
  appointment_date: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (phone: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}
