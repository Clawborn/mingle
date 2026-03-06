import { supabase } from "./supabase";

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
}

export interface Participant {
  id: string;
  event_id: string;
  name: string;
  agent_name: string | null;
  avatar: string;
  bio: string;
  interests: string[];
  looking_for: string | null;
  socials: Record<string, string>;
  joined: boolean;
  created_at: string;
}

const AGENT_COLORS = [
  "from-violet-500 to-purple-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-blue-600",
  "from-orange-500 to-amber-600",
  "from-green-500 to-emerald-600",
  "from-indigo-500 to-blue-600",
  "from-red-500 to-pink-600",
  "from-teal-500 to-cyan-600",
  "from-yellow-500 to-orange-600",
  "from-fuchsia-500 to-purple-600",
];

export function getAgentColor(index: number): string {
  return AGENT_COLORS[index % AGENT_COLORS.length];
}

export async function fetchEvent(eventId: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (error) {
    console.error("fetchEvent error:", error.message);
    return null;
  }
  return data;
}

export async function fetchParticipants(eventId: string): Promise<Participant[]> {
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("fetchParticipants error:", error.message);
    return [];
  }
  return data || [];
}

export interface SceneUpdate {
  id: string;
  event_id: string;
  text: string;
  type: string;
  created_at: string;
}

export async function fetchSceneUpdates(eventId: string): Promise<SceneUpdate[]> {
  const { data, error } = await supabase
    .from("scene_updates")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchSceneUpdates error:", error.message);
    return [];
  }
  return data || [];
}

export interface LiveMessage {
  id: string;
  agent_name: string;
  avatar: string;
  text: string;
  type: string;
  created_at: string;
}

export async function fetchLiveMessages(eventId: string, limit = 50): Promise<LiveMessage[]> {
  const { data, error } = await supabase
    .from("live_messages")
    .select("id, agent_name, avatar, text, type, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("fetchLiveMessages error:", error.message);
    return [];
  }
  return (data || []).reverse();
}

export async function fetchConversations(eventId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchConversations error:", error.message);
    return [];
  }
  return data || [];
}
