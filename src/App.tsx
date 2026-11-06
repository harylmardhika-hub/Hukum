import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Scale,
  FileText,
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Plus,
  X,
  BookOpen,
  LogOut,
  UserCheck,
  Film,
  Download,
} from 'lucide-react';
import {
  AuthSession,
  ClientAccount,
  Lawyer,
  LegalSpecialty,
  ConsultationSession,
  ChatMessage,
  LegalDocument,
  ContractClause,
  ClauseRiskStatus,
  WsClientEvent,
  WsServerEvent,
} from './types/legal';
import {
  INITIAL_CLIENTS,
  INITIAL_LAWYERS,
  INITIAL_SESSIONS,
  INITIAL_MESSAGES,
  INITIAL_DOCUMENTS,
  CONTRACT_TEMPLATES,
} from './data/initialLegalData';
import { LawyerAvatar } from './components/LawyerAvatar';
import { ConsultationRoom } from './components/ConsultationRoom';
import { LawyerDashboard } from './components/LawyerDashboard';
import { LoginPage } from './components/LoginPage';
import { AdvokaIdLogo } from './components/AdvokaIdLogo';
import { LegalVideoBriefingModal } from './components/LegalVideoBriefing';
import { PaymentSimulationModal } from './components/PaymentSimulationModal';
import {
  SHARED_STATE_STORAGE_KEY,
  BROADCAST_CHANNEL_NAME,
  CrossTabMessage,
  getNowWIB,
  loadPersistedSharedState,
  savePersistedSharedState,
  mergeServerStates,
} from './utils/realtimeSync';
import { generateAdvocateAutoResponse } from './utils/autoAdvocateEngine';
import { exportConsultationAndContractPdf } from './utils/exportLegalPdf';

type ActiveSection = 'directory' | 'consultation' | 'contracts' | 'guide';

const SPECIALTY_FILTERS: ('Semua Bidang' | LegalSpecialty)[] = [
  'Semua Bidang',
  'Hukum Bisnis & Korporasi',
  'Hukum Perdata',
  'Hukum Pidana',
  'Hukum Keluarga & Waris',
  'Hukum Ketenagakerjaan',
];

const SESSION_STORAGE_KEY = 'advokaid_isolated_auth_session_v1';
const TAB_INSTANCE_ID = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function App() {
  // Per-Tab Isolated Authentication Session (stored in sessionStorage so each browser tab has its own independent login!)
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    try {
      const saved = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as AuthSession) : null;
    } catch {
      return null;
    }
  });

  // Authoritative synchronized state initialized from persistent shared storage
  const initialShared = React.useMemo(() => loadPersistedSharedState(), []);
  const [clients, setClients] = useState<ClientAccount[]>(initialShared.clients);
  const [lawyers, setLawyers] = useState<Lawyer[]>(initialShared.lawyers);
  const [sessions, setSessions] = useState<ConsultationSession[]>(
    initialShared.sessions
  );
  const [messages, setMessages] = useState<ChatMessage[]>(initialShared.messages);
  const [documents, setDocuments] = useState<LegalDocument[]>(
    initialShared.documents
  );
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [crossTabReady, setCrossTabReady] = useState<boolean>(true);

  // Navigation State
  const [activeSection, setActiveSection] = useState<ActiveSection>('directory');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  // Directory Search & Specialty Filter State
  const [selectedSpecialty, setSelectedSpecialty] = useState<
    'Semua Bidang' | LegalSpecialty
  >('Semua Bidang');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectingLawyer, setInspectingLawyer] = useState<Lawyer | null>(null);
  const [showHeroVideoModal, setShowHeroVideoModal] = useState<boolean>(false);

  // Optional custom consultation modal state
  const [intakeModalLawyer, setIntakeModalLawyer] = useState<Lawyer | null>(null);
  const [caseTitleInput, setCaseTitleInput] = useState<string>('');
  const [caseMessageInput, setCaseMessageInput] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    CONTRACT_TEMPLATES[0].id
  );
  const [attachInitialTemplate, setAttachInitialTemplate] = useState<boolean>(true);

  // Live Typing Indicator State
  const [typingInfo, setTypingInfo] = useState<{
    sessionId: string;
    senderRole: 'client' | 'lawyer';
    senderName: string;
    isTyping: boolean;
  } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const stateRef = useRef({
    clients,
    lawyers,
    sessions,
    messages,
    documents,
  });

  useEffect(() => {
    stateRef.current = { clients, lawyers, sessions, messages, documents };
  }, [clients, lawyers, sessions, messages, documents]);

  // Apply merged state and optionally broadcast to other tabs
  const applyAndSyncState = React.useCallback(
    (
      nextPartial: Partial<{
        clients: ClientAccount[];
        lawyers: Lawyer[];
        sessions: ConsultationSession[];
        messages: ChatMessage[];
        documents: LegalDocument[];
      }>,
      broadcastToTabs = true
    ) => {
      const merged = {
        clients: nextPartial.clients ?? stateRef.current.clients,
        lawyers: nextPartial.lawyers ?? stateRef.current.lawyers,
        sessions: nextPartial.sessions ?? stateRef.current.sessions,
        messages: nextPartial.messages ?? stateRef.current.messages,
        documents: nextPartial.documents ?? stateRef.current.documents,
      };

      stateRef.current = merged;
      setClients(merged.clients);
      setLawyers(merged.lawyers);
      setSessions(merged.sessions);
      setMessages(merged.messages);
      setDocuments(merged.documents);
      savePersistedSharedState(merged);

      if (broadcastToTabs && bcRef.current) {
        const msg: CrossTabMessage = {
          type: 'state:sync',
          payload: merged,
          senderTabId: TAB_INSTANCE_ID,
        };
        bcRef.current.postMessage(msg);
      }
    },
    []
  );

  // Connect Cross-Tab BroadcastChannel + Storage Event Listener (Works 100% on GitHub Pages & Locally)
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bcRef.current = channel;
      setCrossTabReady(true);

      channel.onmessage = (event: MessageEvent<CrossTabMessage>) => {
        const data = event.data;
        if (!data || data.senderTabId === TAB_INSTANCE_ID) return;

        if (data.type === 'state:sync') {
          const reconciled = mergeServerStates(stateRef.current, data.payload);
          applyAndSyncState(reconciled, false);
        } else if (data.type === 'chat:typing_update') {
          setTypingInfo(data.payload);
        }
      };
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === SHARED_STATE_STORAGE_KEY && e.newValue) {
        try {
          const incoming = JSON.parse(e.newValue);
          const reconciled = mergeServerStates(stateRef.current, incoming);
          applyAndSyncState(reconciled, false);
        } catch {
          // ignore parse error
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      channel?.close();
    };
  }, [applyAndSyncState]);

  // Connect to Express + WebSocket Server on Port 3000 (when backend is available)
  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WsServerEvent;
            if (data.type === 'state:init' || data.type === 'state:sync') {
              const reconciled = mergeServerStates(stateRef.current, data.payload);
              applyAndSyncState(reconciled, false);
            } else if (data.type === 'chat:typing_update') {
              setTypingInfo(data.payload);
            }
          } catch (err) {
            console.error('Failed to parse WS message:', err);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimer = setTimeout(connectWebSocket, 3500);
        };
      } catch {
        setWsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [applyAndSyncState]);

  const handleAuthenticated = (session: AuthSession) => {
    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore storage errors
    }
    setAuthSession(session);
    setActiveSection('directory');
  };

  const handleLogout = () => {
    try {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    setAuthSession(null);
    setSelectedSessionId('');
  };

  // Strictly isolate sessions and documents belonging to the currently logged-in user
  const mySessions = React.useMemo(() => {
    if (!authSession) return [];
    if (authSession.role === 'client') {
      return sessions.filter(
        (s) =>
          s.clientId === authSession.userId ||
          s.clientName.toLowerCase() === authSession.name.toLowerCase()
      );
    }
    return sessions.filter((s) => s.lawyerId === authSession.userId);
  }, [authSession, sessions]);

  const mySessionIds = React.useMemo(
    () => new Set(mySessions.map((s) => s.id)),
    [mySessions]
  );

  const myDocuments = React.useMemo(
    () => documents.filter((d) => mySessionIds.has(d.sessionId)),
    [documents, mySessionIds]
  );

  const prevMySessionsCountRef = useRef<number>(mySessions.length);

  // Ensure selectedSessionId always points to a valid session and auto-focuses newly arrived consultations
  useEffect(() => {
    if (mySessions.length === 0) {
      prevMySessionsCountRef.current = 0;
      return;
    }
    if (
      mySessions.length > prevMySessionsCountRef.current ||
      !mySessions.some((s) => s.id === selectedSessionId)
    ) {
      setSelectedSessionId(mySessions[0].id);
    }
    prevMySessionsCountRef.current = mySessions.length;
  }, [mySessions, selectedSessionId]);

  const emitWsEvent = (event: WsClientEvent) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    }
  };

  const handleRegisterClientLocal = (newClient: ClientAccount) => {
    const exists = stateRef.current.clients.some((c) => c.id === newClient.id);
    if (!exists) {
      applyAndSyncState({
        clients: [...stateRef.current.clients, newClient],
      });
    }
  };

  // If no user is logged in in this tab, show the Dedicated Login Page
  if (!authSession) {
    return (
      <LoginPage
        clients={clients}
        lawyers={lawyers}
        onAuthenticated={handleAuthenticated}
        onRegisterClientLocal={handleRegisterClientLocal}
      />
    );
  }

  const activeRole = authSession.role;
  const currentSession =
    mySessions.find((s) => s.id === selectedSessionId) || mySessions[0];
  const currentSessionLawyer =
    lawyers.find((l) => l.id === currentSession?.lawyerId) ||
    lawyers.find((l) => l.id === authSession.userId) ||
    lawyers[0];
  const currentSessionMessages = messages.filter(
    (m) => m.sessionId === currentSession?.id
  );
  const currentSessionDocuments = documents.filter(
    (d) => d.sessionId === currentSession?.id
  );

  // Automatic Advocate Response & Contract Revision Trigger
  const triggerAdvocateAutoReply = (params: {
    sessionId: string;
    clientMessage: string;
    quotedClauseId?: string;
  }) => {
    const targetSession = stateRef.current.sessions.find(
      (s) => s.id === params.sessionId
    );
    if (!targetSession) return;

    const assignedLawyer =
      stateRef.current.lawyers.find((l) => l.id === targetSession.lawyerId) ||
      stateRef.current.lawyers[0];
    if (!assignedLawyer) return;

    // 1. Show "Advokat sedang mengetik..." immediately
    const typingStart = {
      sessionId: targetSession.id,
      senderRole: 'lawyer' as const,
      senderName: assignedLawyer.name,
      isTyping: true,
    };
    setTypingInfo(typingStart);
    if (bcRef.current) {
      bcRef.current.postMessage({
        type: 'chat:typing_update',
        payload: typingStart,
        senderTabId: TAB_INSTANCE_ID,
      });
    }

    setTimeout(async () => {
      const latestSession =
        stateRef.current.sessions.find((s) => s.id === params.sessionId) ||
        targetSession;
      const sessionDocs = stateRef.current.documents.filter(
        (d) => d.sessionId === params.sessionId
      );
      const primaryDoc = sessionDocs[0];
      const recentMsgs = stateRef.current.messages
        .filter((m) => m.sessionId === params.sessionId)
        .slice(-8);

      const autoResult = await generateAdvocateAutoResponse({
        clientMessage: params.clientMessage,
        quotedClauseId: params.quotedClauseId,
        session: latestSession,
        lawyer: assignedLawyer,
        document: primaryDoc,
        recentMessages: recentMsgs,
      });

      const replyTime = getNowWIB();
      let updatedClauseId = autoResult.referencedClauseId;
      let updatedClauseLabel = autoResult.referencedClauseLabel;

      // 2. Apply automatic contract clause revisions or newly added clauses
      let nextDocuments = stateRef.current.documents;
      if (primaryDoc) {
        const updateMap = new Map(
          (autoResult.clauseUpdates || []).map((u) => [u.clauseId, u])
        );

        nextDocuments = stateRef.current.documents.map((doc) => {
          if (doc.id !== primaryDoc.id) return doc;

          let nextClauses = doc.clauses.map((c) => {
            const upd = updateMap.get(c.id);
            if (!upd) return c;
            if (!updatedClauseId) {
              updatedClauseId = c.id;
              updatedClauseLabel = `${c.clauseNumber} — ${c.title}`;
            }
            const validRisk: ClauseRiskStatus =
              upd.riskStatus === 'safe' ||
              upd.riskStatus === 'warning' ||
              upd.riskStatus === 'critical'
                ? upd.riskStatus
                : 'safe';

            const updatedClause: ContractClause = {
              ...c,
              originalText:
                upd.replaceOriginalText && upd.replaceOriginalText.trim().length > 5
                  ? upd.replaceOriginalText.trim()
                  : c.originalText,
              riskStatus: validRisk,
              lawyerNote: upd.lawyerNote || c.lawyerNote,
              proposedRevision: upd.proposedRevision || c.proposedRevision,
              lastUpdatedBy: assignedLawyer.name,
              lastUpdatedAt: replyTime,
            };

            emitWsEvent({
              type: 'contract:annotate_clause',
              payload: {
                documentId: doc.id,
                sessionId: latestSession.id,
                clauseId: c.id,
                riskStatus: updatedClause.riskStatus,
                lawyerNote: updatedClause.lawyerNote,
                proposedRevision: updatedClause.proposedRevision,
                updatedBy: assignedLawyer.name,
                postToChat: false,
              },
            });

            return updatedClause;
          });

          if (autoResult.newClause) {
            const clausesToAdd = [
              autoResult.newClause,
              ...(autoResult.additionalNewClauses || []),
            ];
            clausesToAdd.forEach((nc, idx) => {
              const addedId = `${doc.id}-cl-${nextClauses.length + 1}-${Date.now()}-${idx}`;
              const createdClause: ContractClause = {
                id: addedId,
                clauseNumber: nc.clauseNumber || `Pasal ${nextClauses.length + 1}`,
                title: nc.title,
                originalText: nc.originalText,
                riskStatus: nc.riskStatus || 'safe',
                lawyerNote: nc.lawyerNote,
                proposedRevision: nc.proposedRevision,
                lastUpdatedBy: assignedLawyer.name,
                lastUpdatedAt: replyTime,
              };
              nextClauses = [...nextClauses, createdClause];
              if (idx === 0) {
                updatedClauseId = addedId;
                updatedClauseLabel =
                  autoResult.referencedClauseLabel ||
                  `${createdClause.clauseNumber} — ${createdClause.title}`;
              }
            });
          }

          const hasRemainingRisk = nextClauses.some(
            (c) => c.riskStatus !== 'safe'
          );

          return {
            ...doc,
            overallStatus: hasRemainingRisk
              ? ('Sedang Ditinjau' as const)
              : ('Selesai Ditinjau' as const),
            clauses: nextClauses,
          };
        });
      }

      // 3. Apply updated Legal Opinion Summary if present
      const nextSessions = stateRef.current.sessions.map((s) => {
        if (s.id !== latestSession.id) return s;
        return {
          ...s,
          legalOpinionSummary:
            autoResult.updatedOpinionSummary || s.legalOpinionSummary,
          recommendedNextSteps:
            autoResult.updatedNextSteps || s.recommendedNextSteps,
          status: autoResult.updatedSessionStatus || s.status,
          unreadClientCount: activeRole === 'lawyer' ? s.unreadClientCount + 1 : 0,
          unreadLawyerCount: 0,
        };
      });

      // 4. Append Advocate's automatic reply message
      const replyId = `msg-auto-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      const lawyerReplyMsg: ChatMessage = {
        id: replyId,
        sessionId: latestSession.id,
        senderRole: 'lawyer',
        senderName: assignedLawyer.name,
        content: autoResult.replyText,
        timestamp: replyTime,
        referencedClauseId: updatedClauseId,
        referencedClauseLabel: updatedClauseLabel,
      };

      applyAndSyncState({
        documents: nextDocuments,
        sessions: nextSessions,
        messages: [...stateRef.current.messages, lawyerReplyMsg],
      });

      emitWsEvent({
        type: 'chat:send',
        payload: {
          id: replyId,
          sessionId: latestSession.id,
          senderRole: 'lawyer',
          senderName: assignedLawyer.name,
          content: autoResult.replyText,
          referencedClauseId: updatedClauseId,
          referencedClauseLabel: updatedClauseLabel,
        },
      });

      // 5. Clear typing indicator
      const typingStop = {
        sessionId: latestSession.id,
        senderRole: 'lawyer' as const,
        senderName: assignedLawyer.name,
        isTyping: false,
      };
      setTypingInfo(typingStop);
      if (bcRef.current) {
        bcRef.current.postMessage({
          type: 'chat:typing_update',
          payload: typingStop,
          senderTabId: TAB_INSTANCE_ID,
        });
      }
    }, 950);
  };

  // Handlers for Real-Time Chat & Contract Review (Dual WebSocket + Cross-Tab BroadcastChannel Sync)
  const handleSendMessage = (payload: {
    sessionId: string;
    senderRole: 'client' | 'lawyer';
    senderName: string;
    content: string;
    referencedClauseId?: string;
    referencedClauseLabel?: string;
  }) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const timestamp = getNowWIB();

    const newMsg: ChatMessage = { id, timestamp, ...payload };
    const nextMessages = stateRef.current.messages.some((m) => m.id === id)
      ? stateRef.current.messages
      : [...stateRef.current.messages, newMsg];

    const nextSessions = stateRef.current.sessions.map((s) => {
      if (s.id !== payload.sessionId) return s;
      return {
        ...s,
        unreadLawyerCount:
          payload.senderRole === 'client' ? s.unreadLawyerCount + 1 : 0,
        unreadClientCount:
          payload.senderRole === 'lawyer' ? s.unreadClientCount + 1 : 0,
      };
    });

    applyAndSyncState({
      messages: nextMessages,
      sessions: nextSessions,
    });

    emitWsEvent({
      type: 'chat:send',
      payload: { id, ...payload },
    });

    // When a Client sends any message/request, automatically trigger Advocate response & contract revision!
    if (payload.senderRole === 'client') {
      triggerAdvocateAutoReply({
        sessionId: payload.sessionId,
        clientMessage: payload.content,
        quotedClauseId: payload.referencedClauseId,
      });
    }
  };

  const handleTypingChange = (isTyping: boolean) => {
    if (!currentSession) return;
    const typingPayload = {
      sessionId: currentSession.id,
      senderRole: activeRole,
      senderName: authSession.name,
      isTyping,
    };

    if (bcRef.current) {
      const msg: CrossTabMessage = {
        type: 'chat:typing_update',
        payload: typingPayload,
        senderTabId: TAB_INSTANCE_ID,
      };
      bcRef.current.postMessage(msg);
    }

    emitWsEvent({
      type: 'chat:typing',
      payload: typingPayload,
    });
  };

  const handleAnnotateClause = (payload: {
    documentId: string;
    sessionId: string;
    clauseId: string;
    riskStatus: ClauseRiskStatus;
    lawyerNote: string;
    proposedRevision: string;
    updatedBy: string;
    postToChat?: boolean;
  }) => {
    const timestamp = getNowWIB();
    let targetClauseLabel = '';

    const nextDocuments = stateRef.current.documents.map((doc) => {
      if (doc.id !== payload.documentId) return doc;
      return {
        ...doc,
        overallStatus: 'Sedang Ditinjau' as const,
        clauses: doc.clauses.map((c) => {
          if (c.id !== payload.clauseId) return c;
          targetClauseLabel = `${c.clauseNumber} — ${c.title}`;
          return {
            ...c,
            riskStatus: payload.riskStatus,
            lawyerNote: payload.lawyerNote,
            proposedRevision: payload.proposedRevision,
            lastUpdatedBy: payload.updatedBy,
            lastUpdatedAt: timestamp,
          };
        }),
      };
    });

    let nextMessages = stateRef.current.messages;
    if (payload.postToChat && targetClauseLabel) {
      const statusLabel =
        payload.riskStatus === 'critical'
          ? 'Risiko Hukum Tinggi'
          : payload.riskStatus === 'warning'
            ? 'Perlu Revisi'
            : 'Klausul Aman';

      const chatNote: ChatMessage = {
        id: `msg-annot-${Date.now()}`,
        sessionId: payload.sessionId,
        senderRole: activeRole,
        senderName: payload.updatedBy,
        content: `[Pembaruan Tinjauan ${targetClauseLabel.split(' — ')[0]} — Status: ${statusLabel}] ${payload.lawyerNote}${
          payload.proposedRevision
            ? ` | Usulan Perbaikan: "${payload.proposedRevision}"`
            : ''
        }`,
        timestamp,
        referencedClauseId: payload.clauseId,
        referencedClauseLabel: targetClauseLabel,
      };
      nextMessages = [...nextMessages, chatNote];
    }

    applyAndSyncState({
      documents: nextDocuments,
      messages: nextMessages,
    });

    emitWsEvent({
      type: 'contract:annotate_clause',
      payload,
    });

    // If the Client submits a note/request on a clause in the right panel, the Advocate automatically responds & revises it!
    if (activeRole === 'client') {
      triggerAdvocateAutoReply({
        sessionId: payload.sessionId,
        clientMessage: `Tolong rombak dan sesuaikan ${
          targetClauseLabel || 'pasal ini'
        }: ${payload.lawyerNote || payload.proposedRevision || 'agar aman bagi kami'}`,
        quotedClauseId: payload.clauseId,
      });
    }
  };

  const handleUploadDocument = (payload: {
    id: string;
    sessionId: string;
    title: string;
    documentType: string;
    uploadedBy: 'client' | 'lawyer';
    clauses: Omit<ContractClause, 'id'>[];
  }) => {
    const timestamp = getNowWIB();
    const newDoc: LegalDocument = {
      id: payload.id,
      sessionId: payload.sessionId,
      title: payload.title,
      documentType: payload.documentType,
      uploadedBy: payload.uploadedBy,
      uploadedAt: timestamp,
      overallStatus: 'Menunggu Tinjauan',
      clauses: payload.clauses.map((c, i) => ({
        ...c,
        id: `${payload.id}-cl-${i + 1}`,
      })),
    };

    const uploadMsg: ChatMessage = {
      id: `msg-doc-${payload.id}`,
      sessionId: payload.sessionId,
      senderRole: payload.uploadedBy,
      senderName: authSession.name,
      content: `Mengunggah dokumen kontrak baru untuk ditinjau bersama: "${payload.title}" (${payload.clauses.length} pasal).`,
      timestamp,
      attachedDocumentId: newDoc.id,
      attachedDocumentTitle: newDoc.title,
    };

    applyAndSyncState({
      documents: [newDoc, ...stateRef.current.documents],
      messages: [...stateRef.current.messages, uploadMsg],
    });

    emitWsEvent({
      type: 'contract:upload_document',
      payload,
    });

    if (payload.uploadedBy === 'client') {
      triggerAdvocateAutoReply({
        sessionId: payload.sessionId,
        clientMessage: `Mohon tinjau dokumen kontrak baru yang saya unggah (${payload.title}) dan rombak pasal yang berisiko.`,
      });
    }
  };

  const handleUpdateOpinion = (payload: {
    sessionId: string;
    legalOpinionSummary: string;
    recommendedNextSteps: string[];
    status: ConsultationSession['status'];
  }) => {
    const timestamp = getNowWIB();
    const nextSessions = stateRef.current.sessions.map((s) =>
      s.id === payload.sessionId
        ? {
            ...s,
            legalOpinionSummary: payload.legalOpinionSummary,
            recommendedNextSteps: payload.recommendedNextSteps,
            status: payload.status,
          }
        : s
    );

    const opinionMsg: ChatMessage = {
      id: `msg-opinion-${Date.now()}`,
      sessionId: payload.sessionId,
      senderRole: 'lawyer',
      senderName: authSession.name,
      content: `[Ringkasan Opini Hukum Diperbarui — Status: ${payload.status}] ${payload.legalOpinionSummary}`,
      timestamp,
    };

    applyAndSyncState({
      sessions: nextSessions,
      messages: [...stateRef.current.messages, opinionMsg],
    });

    emitWsEvent({
      type: 'session:update_opinion',
      payload,
    });
  };

  // Create or enter consultation room after payment simulation completes
  const startInstantConsultation = (
    lawyer: Lawyer,
    paymentReceipt?: {
      invoiceNumber: string;
      paymentMethodLabel: string;
      totalPaid: number;
    }
  ) => {
    const nowWib = getNowWIB();
    const existing = mySessions.find((s) => s.lawyerId === lawyer.id);

    if (existing) {
      if (paymentReceipt) {
        const receiptMsg: ChatMessage = {
          id: `msg-pay-${Date.now()}`,
          sessionId: existing.id,
          senderRole: 'client',
          senderName: authSession.name,
          content: `[Pembayaran Retainer Terverifikasi — ${paymentReceipt.invoiceNumber} · ${paymentReceipt.paymentMethodLabel} · Rp ${paymentReceipt.totalPaid.toLocaleString('id-ID')} LUNAS]`,
          timestamp: nowWib,
        };
        const clientFirst = authSession.name.split(/\s+/)[0] || authSession.name;
        const lawyerAckMsg: ChatMessage = {
          id: `msg-pay-ack-${Date.now()}`,
          sessionId: existing.id,
          senderRole: 'lawyer',
          senderName: lawyer.name,
          content: `Terima kasih ${clientFirst}, pembayaran kuitansi ${paymentReceipt.invoiceNumber} sudah masuk dan terverifikasi di sistem Escrow. Silakan sampaikan pasal kontrak yang ingin langsung kita rombak atau diskusikan sekarang.`,
          timestamp: nowWib,
        };
        applyAndSyncState({
          messages: [...stateRef.current.messages, receiptMsg, lawyerAckMsg],
        });
      }
      setSelectedSessionId(existing.id);
      setActiveSection('consultation');
      setInspectingLawyer(null);
      setIntakeModalLawyer(null);
      return;
    }

    const newSessionId = `ses-${Date.now()}`;
    const matchingTemplate =
      CONTRACT_TEMPLATES.find((t) => t.category === lawyer.specialty) ||
      CONTRACT_TEMPLATES[0];

    const newSession: ConsultationSession = {
      id: newSessionId,
      caseNumber: `REG/2026/ADV-${Math.floor(1000 + Math.random() * 9000)}`,
      clientId: authSession.userId,
      clientName: authSession.name,
      clientCompany: authSession.subtitle,
      lawyerId: lawyer.id,
      title: `Konsultasi ${lawyer.specialty} — ${authSession.name}`,
      category: lawyer.specialty,
      status: 'Aktif',
      startedAt: nowWib,
      legalOpinionSummary:
        'Pembayaran sesi konsultasi telah terverifikasi. Silakan sampaikan pertanyaan hukum Anda di kolom chat atau pilih pasal kontrak di panel kanan untuk dirombak bersama Advokat.',
      recommendedNextSteps: [
        'Tulis pokok pertanyaan hukum Anda langsung di ruang chat.',
        'Unggah atau kutip pasal kontrak di panel kanan untuk dibahas bersama Advokat.',
      ],
      unreadClientCount: 0,
      unreadLawyerCount: 1,
    };

    const docId = `doc-${Date.now()}`;
    const starterDoc: LegalDocument = {
      id: docId,
      sessionId: newSessionId,
      title: `${matchingTemplate.title.replace(/\s+/g, '_')}.pdf`,
      documentType: matchingTemplate.documentType,
      uploadedBy: 'client',
      uploadedAt: nowWib,
      overallStatus: 'Menunggu Tinjauan',
      clauses: matchingTemplate.clauses.map((c, idx) => ({
        ...c,
        id: `${docId}-cl-${idx + 1}`,
      })),
    };

    const receiptPrefix = paymentReceipt
      ? `[Kuitansi Lunas: ${paymentReceipt.invoiceNumber} · ${paymentReceipt.paymentMethodLabel} · Rp ${paymentReceipt.totalPaid.toLocaleString('id-ID')}] `
      : '';

    const initialMessageText = `${receiptPrefix}Halo ${
      lawyer.name.split(',')[0]
    }, saya ${authSession.name} ingin berkonsultasi mengenai perkara ${
      lawyer.specialty
    } dan meninjau draf kontrak terlampir.`;

    const initMsg: ChatMessage = {
      id: `msg-init-${newSessionId}`,
      sessionId: newSessionId,
      senderRole: 'client',
      senderName: authSession.name,
      content: initialMessageText,
      timestamp: nowWib,
      attachedDocumentId: docId,
      attachedDocumentTitle: starterDoc.title,
    };

    const firstRiskyClause =
      starterDoc.clauses.find((c) => c.riskStatus === 'critical') ||
      starterDoc.clauses.find((c) => c.riskStatus === 'warning') ||
      starterDoc.clauses[0];
    const clientFirst = authSession.name.split(/\s+/)[0] || authSession.name;

    const welcomeLawyerMsg: ChatMessage = {
      id: `msg-welcome-${newSessionId}`,
      sessionId: newSessionId,
      senderRole: 'lawyer',
      senderName: lawyer.name,
      content: firstRiskyClause
        ? `Halo ${clientFirst}, terima kasih pembayarannya sudah terverifikasi. Draf ${matchingTemplate.title} sudah saya buka di panel sebelah kanan ya. Sekilas saya lihat ada klausul yang cukup berat sebelah, terutama di ${firstRiskyClause.clauseNumber} (${firstRiskyClause.title}). Mau langsung saya rombakkan pasalnya sekarang, atau ada poin lain yang ingin Anda tanyakan dulu?`
        : `Halo ${clientFirst}, pembayaran Anda sudah terverifikasi dan selamat datang di ruang konsultasi ${lawyer.specialty}. Draf kontrak Anda sudah siap di sebelah kanan. Silakan beri tahu saya pasal mana yang ingin dirombak atau ditanyakan.`,
      timestamp: nowWib,
      referencedClauseId: firstRiskyClause?.id,
      referencedClauseLabel: firstRiskyClause
        ? `${firstRiskyClause.clauseNumber} — ${firstRiskyClause.title}`
        : undefined,
    };

    applyAndSyncState({
      sessions: [newSession, ...stateRef.current.sessions],
      documents: [...stateRef.current.documents, starterDoc],
      messages: [...stateRef.current.messages, initMsg, welcomeLawyerMsg],
    });

    emitWsEvent({
      type: 'session:create',
      payload: {
        id: newSessionId,
        clientId: authSession.userId,
        clientName: authSession.name,
        clientCompany: authSession.subtitle,
        lawyerId: lawyer.id,
        title: newSession.title,
        category: lawyer.specialty,
        initialMessage: initialMessageText,
        templateId: matchingTemplate.id,
      },
    });

    setSelectedSessionId(newSessionId);
    setActiveSection('consultation');
    setInspectingLawyer(null);
    setIntakeModalLawyer(null);
  };

  const openConsultationIntake = (lawyer: Lawyer) => {
    setInspectingLawyer(null);
    setIntakeModalLawyer(lawyer);
  };

  // Filtered Lawyers in Directory
  const filteredLawyers = lawyers.filter((lw) => {
    const matchesSpecialty =
      selectedSpecialty === 'Semua Bidang' || lw.specialty === selectedSpecialty;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      lw.name.toLowerCase().includes(q) ||
      lw.specialty.toLowerCase().includes(q) ||
      lw.bio.toLowerCase().includes(q) ||
      lw.jurisdiction.toLowerCase().includes(q) ||
      lw.secondarySpecialties.some((s) => s.toLowerCase().includes(q));
    return matchesSpecialty && matchesQuery;
  });

  const formatRupiah = (amount: number) =>
    `Rp ${amount.toLocaleString('id-ID')}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] pb-20 md:pb-0">
      {/* TOP BAR CONTRACT: Strictly 1 row, 3 zones separated by gap-8 */}
      <header className="md:sticky md:top-0 z-30 flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-slate-200">
        {/* Zone 1: Brand Emblem + Wordmark */}
        <a
          href="#directory"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('directory');
          }}
          className="shrink-0 focus:outline-none"
        >
          <AdvokaIdLogo size="md" showTagline />
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a
            href="#directory"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('directory');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'directory'
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-amber-700'
                : ''
            }`}
          >
            {activeRole === 'lawyer' ? 'Dashboard Advokat' : 'Direktori Advokat'}
          </a>
          <a
            href="#consultation"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('consultation');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'consultation'
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-amber-700'
                : ''
            }`}
          >
            Ruang Konsultasi ({mySessions.length})
          </a>
          <a
            href="#contracts"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('contracts');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'contracts'
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-amber-700'
                : ''
            }`}
          >
            Tinjauan Kontrak ({myDocuments.length})
          </a>
          <a
            href="#guide"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('guide');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'guide'
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-amber-700'
                : ''
            }`}
          >
            Standar Hukum
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <LogOut className="w-3.5 h-3.5 text-amber-400" />
            <span>Keluar / Ganti Akun</span>
          </button>
        </div>
      </header>

      {/* ISOLATED SESSION IDENTITY TOOLBAR (Below Top Header) */}
      <div className="bg-slate-900 text-slate-200 border-b border-slate-800 px-4 sm:px-6 py-2.5">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 text-xs min-w-0">
            <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-400 shrink-0">
              Sesi {activeRole === 'client' ? 'Klien' : 'Advokat'}:
            </span>
            <strong className="text-white truncate">{authSession.name}</strong>
            <span aria-hidden="true" className="text-slate-600 hidden sm:inline">
              ·
            </span>
            <span className="text-slate-300 truncate hidden sm:inline">
              {authSession.subtitle}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px] sm:text-xs text-slate-300">
            <span>
              Sinkronisasi:{' '}
              <strong
                className={
                  wsConnected || crossTabReady
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }
              >
                {wsConnected
                  ? 'Real-Time Server & Tab Aktif'
                  : crossTabReady
                    ? 'Real-Time Antar Tab Aktif'
                    : 'Menghubungkan...'}
              </strong>
            </span>
            {currentSession && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setActiveSection('consultation')}
                  className="text-amber-400 hover:underline font-medium truncate max-w-[180px] sm:max-w-none"
                >
                  Perkara: {currentSession.caseNumber}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {activeRole === 'lawyer' && activeSection === 'directory' ? (
          <LawyerDashboard
            currentLawyer={
              lawyers.find((l) => l.id === authSession.userId) || lawyers[0]
            }
            sessions={mySessions}
            documents={myDocuments}
            messages={messages}
            onOpenSessionAsLawyer={(sessionId) => {
              setSelectedSessionId(sessionId);
              setActiveSection('consultation');
            }}
          />
        ) : activeSection === 'directory' ? (
          <div className="space-y-6 sm:space-y-8">
            {/* Editorial Institutional Hero Banner */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-5 sm:p-8">
              <div className="lg:col-span-7 flex flex-col justify-between space-y-5 sm:space-y-6">
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="text-xs font-semibold text-amber-800">
                    Selamat Datang, {authSession.name} · Portal Klien Terverifikasi
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 font-display leading-tight">
                    Konsultasi Hukum & Telaah Kontrak Langsung Bersama Advokat Spesialis.
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                    Terhubung seketika melalui ruang diskusi real-time untuk menyelesaikan perkara Perdata, Pidana, Bisnis Korporasi, Keluarga & Waris, hingga Ketenagakerjaan (PHI). Seluruh percakapan dan dokumen kontrak pada sesi Anda terisolasi secara privat.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
                  {mySessions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveSection('consultation')}
                      className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-xl sm:rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      <MessageSquare className="w-4 h-4 text-amber-400" />
                      <span>
                        Buka Ruang Konsultasi Saya ({mySessions.length})
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openConsultationIntake(lawyers[0])}
                    className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-xl sm:rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajukan Perkara / Kontrak Baru</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Client's Own Active Session Card */}
              <div className="lg:col-span-5 bg-slate-900 text-white rounded-xl p-5 sm:p-6 flex flex-col justify-between border border-slate-800 overflow-hidden min-w-0">
                {currentSession ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-400 font-mono tabular-nums pb-3 border-b border-slate-800">
                        <span className="truncate">PERKARA AKTIF ANDA</span>
                        <span className="text-amber-400 shrink-0">
                          {currentSession.caseNumber}
                        </span>
                      </div>
                      <h2 className="text-sm sm:text-base font-semibold text-white mt-3.5">
                        {currentSession.title}
                      </h2>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-3">
                        {currentSession.legalOpinionSummary}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col gap-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-slate-300 min-w-0">
                        <div className="truncate font-medium text-slate-200">
                          Advokat: {currentSessionLawyer.name}
                        </div>
                        <div className="text-slate-400 font-mono tabular-nums shrink-0">
                          {currentSessionDocuments.length} Dokumen Kontrak ·{' '}
                          {currentSessionMessages.length} Pesan
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 w-full">
                        <button
                          type="button"
                          onClick={() => setShowHeroVideoModal(true)}
                          className="min-h-[42px] w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors whitespace-nowrap"
                        >
                          <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">Video Ringkasan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSection('consultation')}
                          className="min-h-[42px] w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap"
                        >
                          <span className="truncate">Lanjutkan Chat</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col justify-between h-full space-y-4">
                    <div>
                      <div className="text-xs text-amber-400 font-mono">
                        SESI KLIEN BARU
                      </div>
                      <h2 className="text-base font-semibold text-white mt-2">
                        Belum Ada Perkara Aktif pada Akun Ini
                      </h2>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                        Pilih salah satu Advokat spesialis di bawah untuk memulai ruang konsultasi real-time dan melampirkan draf kontrak Anda.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openConsultationIntake(lawyers[0])}
                      className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Mulai Konsultasi Pertama Anda</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Directory Search & 5 Indonesian Legal Specialty Filter Controls */}
            <section className="space-y-4 sm:space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-display">
                    Direktori Advokat & Konsultan Hukum Spesialis
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Pilih bidang hukum Indonesia atau cari berdasarkan kasus spesifik (contoh: sengketa tanah, PKWT, wanprestasi, pidana ITE)
                  </p>
                </div>

                <div className="relative w-full lg:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari advokat, bidang, atau kasus..."
                    className="w-full min-h-[44px] pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-xl sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              </div>

              {/* Interactive Specialty Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-200/70 rounded-xl sm:rounded-lg">
                {SPECIALTY_FILTERS.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => setSelectedSpecialty(spec)}
                    className={`min-h-[40px] px-3.5 py-2 text-xs font-medium rounded-lg sm:rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      selectedSpecialty === spec
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>

              {/* Lawyer Directory Grid */}
              {filteredLawyers.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                  <Scale className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Advokat dengan kriteria tersebut belum ditemukan
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSpecialty('Semua Bidang');
                      setSearchQuery('');
                    }}
                    className="mt-4 min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                  >
                    Reset Filter Pencarian
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {filteredLawyers.map((lawyer) => {
                    const existingClientSession = mySessions.find(
                      (s) => s.lawyerId === lawyer.id
                    );

                    return (
                      <article
                        key={lawyer.id}
                        className="bg-white border border-slate-200 rounded-2xl sm:rounded-xl p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 transition-colors"
                      >
                        <div>
                          <div className="flex items-start gap-3.5 sm:gap-4">
                            <LawyerAvatar lawyer={lawyer} size="lg" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5 text-xs text-amber-800 font-medium">
                                <span>{lawyer.specialty}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">
                                  {lawyer.experienceYears} Thn
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums text-slate-500">
                                  {lawyer.niaPeradi}
                                </span>
                              </div>

                              <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                                {lawyer.name}
                              </h3>
                              <p className="text-xs text-slate-600 mt-0.5">
                                {lawyer.title}
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed mt-3.5">
                            {lawyer.bio}
                          </p>

                          <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                            <div>
                              <strong className="text-slate-700">Fokus Perkara:</strong>{' '}
                              {lawyer.secondarySpecialties.join(' · ')}
                            </div>
                            <div>
                              <strong className="text-slate-700">Yurisdiksi:</strong>{' '}
                              {lawyer.jurisdiction}
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="text-[11px] text-slate-500">
                              Tarif Sesi Konsultasi & Tinjauan Kontrak
                            </div>
                            <div className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                              {formatRupiah(lawyer.consultationFee)}{' '}
                              <span className="text-xs font-normal text-slate-500">
                                / sesi perkara
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setInspectingLawyer(lawyer)}
                              className="min-h-[42px] px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-xl sm:rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 text-center"
                            >
                              Kredensial
                            </button>
                            {existingClientSession ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSessionId(existingClientSession.id);
                                  setActiveSection('consultation');
                                }}
                                className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-700 rounded-xl sm:rounded-lg hover:bg-amber-800 transition-colors whitespace-nowrap shrink-0"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Lanjutkan Chat</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openConsultationIntake(lawyer)}
                                className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl sm:rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Mulai Chat</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        ) : activeSection === 'consultation' ? (
          currentSession ? (
            <ConsultationRoom
              session={currentSession}
              allSessions={mySessions}
              lawyer={currentSessionLawyer}
              messages={currentSessionMessages}
              documents={currentSessionDocuments}
              activeRole={activeRole}
              authenticatedUserName={authSession.name}
              typingInfo={typingInfo}
              onSelectSession={(id) => setSelectedSessionId(id)}
              onSendMessage={handleSendMessage}
              onTypingChange={handleTypingChange}
              onAnnotateClause={handleAnnotateClause}
              onUploadDocument={handleUploadDocument}
              onUpdateOpinion={handleUpdateOpinion}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto my-8">
              <MessageSquare className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h2 className="text-base font-bold text-slate-900">
                Belum Ada Ruang Konsultasi pada Sesi {authSession.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {activeRole === 'client'
                  ? 'Silakan pilih Advokat dari direktori untuk membuka sesi konsultasi dan meninjau dokumen kontrak Anda.'
                  : 'Saat ini belum ada klien yang membuka sesi perkara pada profil Advokat Anda.'}
              </p>
              {activeRole === 'client' && (
                <button
                  type="button"
                  onClick={() => openConsultationIntake(lawyers[0])}
                  className="mt-5 min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-amber-700 rounded-lg hover:bg-amber-800"
                >
                  <Plus className="w-4 h-4" />
                  <span>Mulai Konsultasi Baru</span>
                </button>
              )}
            </div>
          )
        ) : activeSection === 'contracts' ? (
          /* Dedicated Contract Repository for Logged-In User's Sessions */
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 font-display">
                  Daftar Dokumen &amp; Kontrak Hukum ({authSession.name})
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Menampilkan dokumen kontrak yang terhubung khusus dengan sesi perkara Anda.
                </p>
              </div>
              {currentSession && (
                <button
                  type="button"
                  onClick={() => setActiveSection('consultation')}
                  className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  <span>Buka Meja Kolaborasi Kontrak</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {myDocuments.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Belum Ada Dokumen Kontrak pada Sesi Ini
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mulai sesi konsultasi dan unggah draf kontrak untuk melihat daftar pasal yang ditinjau.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                {myDocuments.map((doc) => {
                  const parentSession = mySessions.find(
                    (s) => s.id === doc.sessionId
                  );
                  const docLawyer = lawyers.find(
                    (l) => l.id === parentSession?.lawyerId
                  );
                  const crit = doc.clauses.filter(
                    (c) => c.riskStatus === 'critical'
                  ).length;
                  const warn = doc.clauses.filter(
                    (c) => c.riskStatus === 'warning'
                  ).length;
                  const safe = doc.clauses.filter(
                    (c) => c.riskStatus === 'safe'
                  ).length;

                  return (
                    <div
                      key={doc.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                          <span>{doc.documentType}</span>
                          <span aria-hidden="true">·</span>
                          <span>{doc.uploadedAt}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1.5 break-all">
                          {doc.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">
                          Perkara: {parentSession?.title || '-'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Advokat: {docLawyer?.name || '-'}
                        </p>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-mono tabular-nums">
                          <span className="text-red-700 font-semibold">
                            {crit} Risiko Tinggi
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-700 font-semibold">
                            {warn} Revisi
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-700 font-semibold">
                            {safe} Aman
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (parentSession) {
                              setSelectedSessionId(parentSession.id);
                            }
                            setActiveSection('consultation');
                          }}
                          className="w-full min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Tinjau {doc.clauses.length} Pasal di Ruang Chat</span>
                        </button>
                        {parentSession && docLawyer && (
                          <button
                            type="button"
                            onClick={() =>
                              exportConsultationAndContractPdf({
                                session: parentSession,
                                lawyer: docLawyer,
                                documents: [doc],
                                messages: messages.filter(
                                  (m) => m.sessionId === parentSession.id
                                ),
                              })
                            }
                            className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-400" />
                            <span>Unduh Hasil Telaah (.PDF)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Standar Hukum & Panduan Penggunaan View */
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-8 space-y-6 max-w-4xl mx-auto">
            <div>
              <div className="text-xs font-semibold text-amber-800">
                Pedoman Konsultasi & Kode Etik Advokat Indonesia
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display mt-1">
                Standar Layanan Hukum & Isolasi Sesi Klien–Advokat AdvokaID
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
              <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>1. Kerahasiaan & Sesi Terpisah</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Setiap akun Klien dan Advokat memiliki sesi terpisah. Anda dapat membuka tab baru untuk login sebagai pihak lawan bicara (Advokat/Klien) dan menguji pengiriman pesan serta revisi pasal secara real-time.
                </p>
              </div>

              <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FileText className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>2. Klasifikasi Risiko Klausul Kontrak</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Setiap pasal yang ditinjau diklasifikasikan menjadi tiga status: Klausul Aman (sesuai KUHPerdata/UU terkait), Perlu Revisi (ketidakseimbangan komersial), dan Risiko Hukum Tinggi (berpotensi batal demi hukum).
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav
        aria-label="Navigasi Utama Mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-4 items-center h-16 px-2"
      >
        <button
          type="button"
          onClick={() => setActiveSection('directory')}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-lg transition-colors ${
            activeSection === 'directory'
              ? 'text-amber-700 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Scale className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">
            {activeRole === 'lawyer' ? 'Dashboard' : 'Advokat'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('consultation')}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-lg transition-colors ${
            activeSection === 'consultation'
              ? 'text-amber-700 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">
            Chat ({mySessions.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('contracts')}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-lg transition-colors ${
            activeSection === 'contracts'
              ? 'text-amber-700 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">
            Kontrak ({myDocuments.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('guide')}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-lg transition-colors ${
            activeSection === 'guide'
              ? 'text-amber-700 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">
            Standar
          </span>
        </button>
      </nav>

      {/* LAWYER CREDENTIAL DETAIL MODAL */}
      {inspectingLawyer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden" />
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3.5">
                <LawyerAvatar lawyer={inspectingLawyer} size="lg" />
                <div>
                  <div className="text-xs font-mono text-amber-800 tabular-nums">
                    {inspectingLawyer.niaPeradi} · {inspectingLawyer.specialty}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {inspectingLawyer.name}
                  </h3>
                  <p className="text-xs text-slate-600">{inspectingLawyer.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingLawyer(null)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-700">
              <p className="leading-relaxed">{inspectingLawyer.bio}</p>

              <div>
                <div className="font-semibold text-slate-900 mb-1.5">
                  Sertifikasi & Lisensi Praktik Hukum:
                </div>
                <ul className="space-y-1.5">
                  {inspectingLawyer.notableCredentials.map((cred, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{cred}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div>
                  <strong className="text-slate-900">Pendidikan Hukum:</strong>{' '}
                  {inspectingLawyer.almaMater}
                </div>
                <div>
                  <strong className="text-slate-900">Wilayah Praktik:</strong>{' '}
                  {inspectingLawyer.jurisdiction}
                </div>
                <div className="font-mono tabular-nums">
                  <strong className="text-slate-900 font-sans">
                    Perkara Ditangani:
                  </strong>{' '}
                  {inspectingLawyer.casesHandled} Perkara · Rating{' '}
                  {inspectingLawyer.rating}/5.0
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setInspectingLawyer(null)}
                className="min-h-[44px] px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = inspectingLawyer;
                  setInspectingLawyer(null);
                  openConsultationIntake(target);
                }}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                Mulai Konsultasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT SIMULATION CHECKOUT MODAL BEFORE CONSULTATION */}
      {intakeModalLawyer && (
        <PaymentSimulationModal
          lawyer={intakeModalLawyer}
          authSession={authSession}
          onClose={() => setIntakeModalLawyer(null)}
          onPaymentSuccess={(paymentInfo) => {
            startInstantConsultation(paymentInfo.lawyer, {
              invoiceNumber: paymentInfo.invoiceNumber,
              paymentMethodLabel: paymentInfo.paymentMethodLabel,
              totalPaid: paymentInfo.totalPaid,
            });
          }}
        />
      )}

      {/* REMOTION HERO VIDEO BRIEFING MODAL */}
      {showHeroVideoModal && (
        <LegalVideoBriefingModal
          session={currentSession || sessions[0]}
          lawyer={currentSessionLawyer || lawyers[0]}
          documents={
            currentSessionDocuments.length > 0
              ? currentSessionDocuments
              : documents.filter((d) => d.sessionId === (currentSession || sessions[0])?.id)
          }
          onClose={() => setShowHeroVideoModal(false)}
        />
      )}

      {/* QUIET FOOTER */}
      <footer className="mt-8 sm:mt-12 border-t border-slate-200 bg-white px-4 sm:px-6 py-5 text-xs text-slate-500">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <AdvokaIdLogo size="sm" />
            <span className="text-slate-500">
              — Platform Konsultasi Hukum &amp; Telaah Kontrak Real-Time Indonesia.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>Rahasia Jabatan Advokat Pasal 19 UU No. 18/2003</span>
            <span aria-hidden="true">·</span>
            <span>Terverifikasi PERADI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
