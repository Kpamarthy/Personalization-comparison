export enum PersonalizationType {
  USER_PROFILE = 'USER_PROFILE',
  SHOPPING_HISTORY = 'SHOPPING_HISTORY',
  CONVERSATION_CONTEXT = 'CONVERSATION_CONTEXT',
  CONSUMER_PCONTEXT = 'CONSUMER_PCONTEXT',
}

export type Vertical = 'Home Improvement' | 'Apparel' | 'Grocery';

export enum FeatureType {
  CONTEXT_AWARENESS_COMPARISON = 'Context-awareness comparison',
  BACKGROUND_AGENTS = 'Background Agents',
}

export interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  rating: number;
  reviews: number;
  isEcoFriendly?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestions?: string[];
  products?: Product[];
  isStreaming?: boolean;
  responseTime?: number;
}

export interface PersonalizationData {
  id: PersonalizationType;
  label: string;
  description: string;
  content: string;
  starterPrompts: string[];
  color: {
    bg: string;
    text: string;
    border: string;
    dot: string;
  };
}
