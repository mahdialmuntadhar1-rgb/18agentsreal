import { useEffect, useRef, useState } from "react";

export interface StageState {
  status: "idle" | "running" | "done" | "error";
  total: number;
  processed: number;
  flagged?: number;
  errors?: number;
  duplicates?: number;
  startedAt?: string;
  completedAt?: string;
  message?: string;
}

export interface PipelineState {
  stage1: StageState;
  stage2: StageState;
  stage3: StageState;
  stage4: StageState;
  records: any[];
  errors: any[];
}

export function usePipeline() {
  const [state, setState] = useState<PipelineState | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetch("/api/status").then(r => r.json()).then(setState).catch(() => {});
    const es = new EventSource("/api/stream");
    esRef.current = es;
    es.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "state") setState(msg.payload);
    };
    return () => es.close();
  }, []);

  const api = async (url: string, method = "POST", body?: object) => {
    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return r.json();
  };

  return {
    state,
    startStage1: (records?: any[]) => api("/api/stage1/start", "POST", records ? { records } : {}),
    startStage2: () => api("/api/stage2/start"),
    stopStage2: () => api("/api/stage2/stop"),
    startStage3: () => api("/api/stage3/start"),
    stopStage3: () => api("/api/stage3/stop"),
    startStage4: () => api("/api/stage4/start"),
    stopStage4: () => api("/api/stage4/stop"),
    reset: () => api("/api/reset"),
    approve: (id: string | number) => api(`/api/businesses/${id}/approve`),
    reject: (id: string | number) => api(`/api/businesses/${id}/reject`),
    update: (id: string | number, data: object) => api(`/api/businesses/${id}`, "PUT", data),
    pushToSupabase: () => api("/api/export/push"),
  };
}
