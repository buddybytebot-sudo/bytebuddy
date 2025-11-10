// From Supabase Auth
export interface User {
  id: string;
  username: string;
  user_metadata: {
    name: string;
  };
}

export interface Session {
  user: User;
  // other session properties
}

export interface Conversation {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  sources?: { uri: string; title: string }[];
}

export interface UserProfile {
  age: string;
  gender: string;
  height: string;
  weight: string;
  units: 'Metric' | 'Imperial';
  activityLevel: string;
  goal: string;
  restrictions: string;
  typicalFoods: string;
  eatingHabits: string;
}

export interface WaterLog {
  id: string;
  amount: number; // in ml
  createdAt: string;
}

export interface MealLog {
  id: string;
  description: string;
  amount: string;
  calories: number;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  createdAt: string;
}
