"use client";
import { useEffect, useState } from "react";
import { fetchEvent, fetchParticipants, getAgentColor } from "./api";
import type { Event, Participant } from "./api";

export interface ParticipantWithColor extends Participant {
  agentColor: string;
}

export function useEventData(eventId: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithColor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [ev, parts] = await Promise.all([
        fetchEvent(eventId),
        fetchParticipants(eventId),
      ]);
      if (cancelled) return;
      setEvent(ev);
      setParticipants(
        parts.map((p, i) => ({ ...p, agentColor: getAgentColor(i) }))
      );
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [eventId]);

  return { event, participants, loading };
}
