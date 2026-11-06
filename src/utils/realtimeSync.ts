import {
  ClientAccount,
  Lawyer,
  ConsultationSession,
  ChatMessage,
  LegalDocument,
  ServerState,
} from '../types/legal';
import {
  INITIAL_CLIENTS,
  INITIAL_LAWYERS,
  INITIAL_SESSIONS,
  INITIAL_MESSAGES,
  INITIAL_DOCUMENTS,
} from '../data/initialLegalData';

export const SHARED_STATE_STORAGE_KEY = 'advokaid_shared_realtime_state_v6';
export const BROADCAST_CHANNEL_NAME = 'advokaid_realtime_channel_v6';

export type CrossTabMessage =
  | {
      type: 'state:sync';
      payload: ServerState;
      senderTabId: string;
    }
  | {
      type: 'chat:typing_update';
      payload: {
        sessionId: string;
        senderRole: 'client' | 'lawyer';
        senderName: string;
        isTyping: boolean;
      };
      senderTabId: string;
    };

export function getNowWIB(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} WIB`;
}

export function loadPersistedSharedState(): ServerState {
  try {
    const raw = window.localStorage.getItem(SHARED_STATE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ServerState>;
      if (
        Array.isArray(parsed.sessions) &&
        Array.isArray(parsed.messages) &&
        Array.isArray(parsed.documents)
      ) {
        return {
          clients: Array.isArray(parsed.clients) ? parsed.clients : INITIAL_CLIENTS,
          lawyers: Array.isArray(parsed.lawyers) ? parsed.lawyers : INITIAL_LAWYERS,
          sessions: parsed.sessions,
          messages: parsed.messages,
          documents: parsed.documents,
        };
      }
    }
  } catch {
    // ignore storage errors
  }

  return {
    clients: INITIAL_CLIENTS,
    lawyers: INITIAL_LAWYERS,
    sessions: INITIAL_SESSIONS,
    messages: INITIAL_MESSAGES,
    documents: INITIAL_DOCUMENTS,
  };
}

export function savePersistedSharedState(state: ServerState): void {
  try {
    window.localStorage.setItem(SHARED_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

/**
 * Idempotently merges two ServerState snapshots so newly created sessions,
 * messages, documents, or registered clients in any tab are never lost.
 */
export function mergeServerStates(
  current: ServerState,
  incoming: ServerState
): ServerState {
  // Merge clients by ID
  const clientMap = new Map<string, ClientAccount>();
  for (const c of current.clients) clientMap.set(c.id, c);
  for (const c of incoming.clients || []) clientMap.set(c.id, c);

  // Merge lawyers by ID
  const lawyerMap = new Map<string, Lawyer>();
  for (const l of current.lawyers) lawyerMap.set(l.id, l);
  for (const l of incoming.lawyers || []) lawyerMap.set(l.id, l);

  // Merge sessions by ID (incoming updates win on existing IDs, new IDs prepended)
  const sessionMap = new Map<string, ConsultationSession>();
  for (const s of incoming.sessions || []) sessionMap.set(s.id, s);
  for (const s of current.sessions) {
    if (!sessionMap.has(s.id)) {
      sessionMap.set(s.id, s);
    } else {
      // Preserve latest opinion/status from incoming
      sessionMap.set(s.id, { ...s, ...sessionMap.get(s.id)! });
    }
  }

  // Merge messages by ID in chronological insertion order
  const messageMap = new Map<string, ChatMessage>();
  for (const m of current.messages) messageMap.set(m.id, m);
  for (const m of incoming.messages || []) messageMap.set(m.id, m);

  // Merge documents by ID (incoming updates clause annotations)
  const documentMap = new Map<string, LegalDocument>();
  for (const d of current.documents) documentMap.set(d.id, d);
  for (const d of incoming.documents || []) documentMap.set(d.id, d);

  return {
    clients: Array.from(clientMap.values()),
    lawyers: Array.from(lawyerMap.values()),
    sessions: Array.from(sessionMap.values()),
    messages: Array.from(messageMap.values()),
    documents: Array.from(documentMap.values()),
  };
}
