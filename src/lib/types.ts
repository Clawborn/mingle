export interface Event {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  description: string;
  tags: string[];
  created_at: string;
}

export interface Participant {
  id: string;
  event_id: string;
  name: string;
  agent_name: string;
  avatar: string;
  bio: string;
  interests: string[];
  looking_for: string;
  socials: Record<string, string>;
  agent_api_endpoint?: string; // Agent 的回调地址，用于推送匹配结果
  agent_token?: string; // Agent 的认证 token
  joined: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  event_id: string;
  participant_a_id: string;
  participant_b_id: string;
  status: "pending" | "chatting" | "matched" | "no_match";
  match_reason?: string;
  recommendation_a?: string; // 给 A 的推荐语
  recommendation_b?: string; // 给 B 的推荐语
  messages: ConversationMessage[];
  created_at: string;
}

export interface ConversationMessage {
  from: "A" | "B";
  text: string;
  timestamp: string;
}

export interface Match {
  id: string;
  event_id: string;
  participant_a_id: string;
  participant_b_id: string;
  conversation_id: string;
  reason: string;
  socials_exchanged: boolean;
  created_at: string;
}

// API request/response types
export interface RegisterRequest {
  event_id: string;
  name: string;
  agent_name?: string;
  avatar?: string;
  bio: string;
  interests: string[];
  looking_for: string;
  socials: Record<string, string>;
  agent_api_endpoint?: string;
  agent_token?: string;
}

export interface RegisterResponse {
  participant_id: string;
  event: Pick<Event, "id" | "title" | "date" | "time" | "location">;
  message: string;
}

export interface LobbyResponse {
  event_id: string;
  participants: Pick<Participant, "id" | "name" | "agent_name" | "avatar" | "bio" | "interests" | "looking_for">[];
  active_conversations: number;
  total_matches: number;
}

export interface ChatMessage {
  participant_id: string;
  conversation_id: string;
  text: string;
}

export interface MatchesResponse {
  participant_id: string;
  matches: {
    matched_with: Pick<Participant, "id" | "name" | "avatar" | "bio" | "interests">;
    reason: string;
    socials?: Record<string, string>; // 只在双向匹配时展示
    conversation_id: string;
  }[];
}
