"use client";
import { useEffect, useState } from "react";
import { fetchEvent, fetchParticipants, fetchSceneUpdates, fetchLiveMessages, fetchOnlineAgents, getAgentColor } from "./api";
import type { Event, Participant, SceneUpdate, LiveMessage } from "./api";

export interface ParticipantWithColor extends Participant {
  agentColor: string;
}

export function useEventData(eventId: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithColor[]>([]);
  const [sceneUpdates, setSceneUpdates] = useState<SceneUpdate[]>([]);
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [ev, parts, scenes, msgs, online] = await Promise.all([
        fetchEvent(eventId),
        fetchParticipants(eventId),
        fetchSceneUpdates(eventId),
        fetchLiveMessages(eventId, 50),
        fetchOnlineAgents(eventId),
      ]);
      if (cancelled) return;
      setEvent(ev);
      setParticipants(
        parts.map((p, i) => ({ ...p, agentColor: getAgentColor(i) }))
      );
      setSceneUpdates(scenes);
      setLiveMessages(msgs);
      setOnlineCount(online);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [eventId]);

  return { event, participants, sceneUpdates, liveMessages, onlineCount, loading };
}
