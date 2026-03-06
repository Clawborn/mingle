"use client";
import { useEffect, useState } from "react";
import { fetchEvent, fetchParticipants, fetchSceneUpdates, getAgentColor } from "./api";
import type { Event, Participant, SceneUpdate } from "./api";

export interface ParticipantWithColor extends Participant {
  agentColor: string;
}

export function useEventData(eventId: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithColor[]>([]);
  const [sceneUpdates, setSceneUpdates] = useState<SceneUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [ev, parts, scenes] = await Promise.all([
        fetchEvent(eventId),
        fetchParticipants(eventId),
        fetchSceneUpdates(eventId),
      ]);
      if (cancelled) return;
      setEvent(ev);
      setParticipants(
        parts.map((p, i) => ({ ...p, agentColor: getAgentColor(i) }))
      );
      setSceneUpdates(scenes);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [eventId]);

  return { event, participants, sceneUpdates, loading };
}
