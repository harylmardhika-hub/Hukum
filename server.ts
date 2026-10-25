import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  INITIAL_CLIENTS,
  INITIAL_LAWYERS,
  INITIAL_SESSIONS,
  INITIAL_MESSAGES,
  INITIAL_DOCUMENTS,
  CONTRACT_TEMPLATES,
} from './src/data/initialLegalData.ts';
import {
  ServerState,
  WsClientEvent,
  WsServerEvent,
  ChatMessage,
  LegalDocument,
  ConsultationSession,
  ClientAccount,
  AuthSession,
} from './src/types/legal.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Authoritative server-side state
const state: ServerState = {
  clients: structuredClone(INITIAL_CLIENTS),
  lawyers: structuredClone(INITIAL_LAWYERS),
  sessions: structuredClone(INITIAL_SESSIONS),
  messages: structuredClone(INITIAL_MESSAGES),
  documents: structuredClone(INITIAL_DOCUMENTS),
};

function getCurrentTimeWIB(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} WIB`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  function broadcast(event: WsServerEvent) {
    const raw = JSON.stringify(event);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    }
  }

  function syncAllClients() {
    broadcast({
      type: 'state:sync',
      payload: state,
    });
  }

  wss.on('connection', (ws) => {
    const initEvent: WsServerEvent = {
      type: 'state:init',
      payload: state,
    };
    ws.send(JSON.stringify(initEvent));

    ws.on('message', (data) => {
      try {
        const event = JSON.parse(data.toString()) as WsClientEvent;

        if (event.type === 'chat:typing') {
          broadcast({
            type: 'chat:typing_update',
            payload: event.payload,
          });
          return;
        }

        if (event.type === 'chat:send') {
          const {
            id,
            sessionId,
            senderRole,
            senderName,
            content,
            referencedClauseId,
            referencedClauseLabel,
          } = event.payload;

          if (state.messages.some((m) => m.id === id)) {
            return;
          }

          const newMsg: ChatMessage = {
            id,
            sessionId,
            senderRole,
            senderName,
            content,
            timestamp: getCurrentTimeWIB(),
            referencedClauseId,
            referencedClauseLabel,
          };
          state.messages.push(newMsg);

          const session = state.sessions.find((s) => s.id === sessionId);
          if (session) {
            if (senderRole === 'client') {
              session.unreadLawyerCount += 1;
              session.unreadClientCount = 0;
            } else if (senderRole === 'lawyer') {
              session.unreadClientCount += 1;
              session.unreadLawyerCount = 0;
            }
          }

          syncAllClients();
          return;
        }

        if (event.type === 'contract:annotate_clause') {
          const {
            documentId,
            sessionId,
            clauseId,
            riskStatus,
            lawyerNote,
            proposedRevision,
            updatedBy,
            postToChat,
          } = event.payload;

          const doc = state.documents.find((d) => d.id === documentId);
          if (!doc) return;

          const clause = doc.clauses.find((c) => c.id === clauseId);
          if (!clause) return;

          clause.riskStatus = riskStatus;
          clause.lawyerNote = lawyerNote;
          clause.proposedRevision = proposedRevision;
          clause.lastUpdatedBy = updatedBy;
          clause.lastUpdatedAt = getCurrentTimeWIB();
          doc.overallStatus = 'Sedang Ditinjau';

          if (postToChat) {
            const statusLabel =
              riskStatus === 'critical'
                ? 'Risiko Hukum Tinggi'
                : riskStatus === 'warning'
                  ? 'Perlu Revisi'
                  : 'Klausul Aman';

            const chatNote: ChatMessage = {
              id: `msg-annot-${Date.now()}`,
              sessionId,
              senderRole: 'lawyer',
              senderName: updatedBy,
              content: `[Pembaruan Tinjauan ${clause.clauseNumber} — Status: ${statusLabel}] ${lawyerNote}${
                proposedRevision ? ` | Usulan Revisi: "${proposedRevision}"` : ''
              }`,
              timestamp: getCurrentTimeWIB(),
              referencedClauseId: clause.id,
              referencedClauseLabel: `${clause.clauseNumber} — ${clause.title}`,
            };
            state.messages.push(chatNote);
          }

          syncAllClients();
          return;
        }

        if (event.type === 'contract:upload_document') {
          const { id, sessionId, title, documentType, uploadedBy, clauses } =
            event.payload;

          if (state.documents.some((d) => d.id === id)) {
            return;
          }

          const newDoc: LegalDocument = {
            id,
            sessionId,
            title,
            documentType,
            uploadedBy,
            uploadedAt: getCurrentTimeWIB(),
            overallStatus: 'Menunggu Tinjauan',
            clauses: clauses.map((c, idx) => ({
              ...c,
              id: `${id}-cl-${idx + 1}`,
            })),
          };
          state.documents.push(newDoc);

          const session = state.sessions.find((s) => s.id === sessionId);
          if (session) {
            session.status = 'Menunggu Tinjauan Kontrak';
          }

          const uploaderName =
            uploadedBy === 'client'
              ? session?.clientName || 'Klien'
              : state.lawyers.find((l) => l.id === session?.lawyerId)?.name ||
                'Advokat';

          state.messages.push({
            id: `msg-doc-${id}`,
            sessionId,
            senderRole: uploadedBy,
            senderName: uploaderName,
            content: `Mengunggah dokumen hukum baru untuk ditinjau bersama: "${title}" (${clauses.length} pasal terdeteksi).`,
            timestamp: getCurrentTimeWIB(),
            attachedDocumentId: newDoc.id,
            attachedDocumentTitle: newDoc.title,
          });

          syncAllClients();
          return;
        }

        if (event.type === 'session:create') {
          const {
            id,
            clientId,
            clientName,
            clientCompany,
            lawyerId,
            title,
            category,
            initialMessage,
            templateId,
          } = event.payload;

          if (state.sessions.some((s) => s.id === id)) {
            return;
          }

          const randomNum = Math.floor(1000 + Math.random() * 9000);
          const newSession: ConsultationSession = {
            id,
            caseNumber: `REG/2026/ADV-${randomNum}`,
            clientId,
            clientName,
            clientCompany,
            lawyerId,
            title,
            category,
            status: templateId ? 'Menunggu Tinjauan Kontrak' : 'Aktif',
            startedAt: getCurrentTimeWIB(),
            legalOpinionSummary:
              'Sesi konsultasi baru telah dibuka. Advokat sedang menelaah kronologi perkara dan dokumen yang dilampirkan.',
            recommendedNextSteps: [
              'Sampaikan kronologi fakta hukum dan bukti tertulis yang dimiliki.',
              'Lampirkan draf kontrak pada panel Tinjauan Kontrak jika membutuhkan redlining pasal.',
            ],
            unreadClientCount: 0,
            unreadLawyerCount: 1,
          };

          state.sessions.unshift(newSession);

          let attachedDocId: string | undefined;
          let attachedDocTitle: string | undefined;

          if (templateId) {
            const tpl = CONTRACT_TEMPLATES.find((t) => t.id === templateId);
            if (tpl) {
              const docId = `doc-${Date.now()}`;
              const newDoc: LegalDocument = {
                id: docId,
                sessionId: id,
                title: `${tpl.title.replace(/\s+/g, '_')}.pdf`,
                documentType: tpl.documentType,
                uploadedBy: 'client',
                uploadedAt: getCurrentTimeWIB(),
                overallStatus: 'Menunggu Tinjauan',
                clauses: tpl.clauses.map((c, idx) => ({
                  ...c,
                  id: `${docId}-cl-${idx + 1}`,
                })),
              };
              state.documents.push(newDoc);
              attachedDocId = docId;
              attachedDocTitle = newDoc.title;
            }
          }

          state.messages.push({
            id: `msg-init-${id}`,
            sessionId: id,
            senderRole: 'client',
            senderName: clientName,
            content: initialMessage,
            timestamp: getCurrentTimeWIB(),
            attachedDocumentId: attachedDocId,
            attachedDocumentTitle: attachedDocTitle,
          });

          syncAllClients();
          return;
        }

        if (event.type === 'session:update_opinion') {
          const { sessionId, legalOpinionSummary, recommendedNextSteps, status } =
            event.payload;

          const session = state.sessions.find((s) => s.id === sessionId);
          if (!session) return;

          session.legalOpinionSummary = legalOpinionSummary;
          session.recommendedNextSteps = recommendedNextSteps;
          session.status = status;

          const lawyer = state.lawyers.find((l) => l.id === session.lawyerId);

          state.messages.push({
            id: `msg-opinion-${Date.now()}`,
            sessionId,
            senderRole: 'lawyer',
            senderName: lawyer?.name || 'Advokat',
            content: `[Ringkasan Opini Hukum Diperbarui — Status: ${status}] ${legalOpinionSummary}`,
            timestamp: getCurrentTimeWIB(),
          });

          syncAllClients();
          return;
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
  });

  // REST API endpoints
  app.get('/api/state', (_req, res) => {
    res.json(state);
  });

  // Dedicated Login Endpoint (Supports separate Client & Lawyer authentication sessions)
  app.post('/api/auth/login', (req, res) => {
    const { role, identifier, userId } = req.body as {
      role: 'client' | 'lawyer';
      identifier?: string;
      userId?: string;
    };

    if (role === 'client') {
      const q = (identifier || '').toLowerCase().trim();
      const client = userId
        ? state.clients.find((c) => c.id === userId)
        : state.clients.find(
            (c) =>
              c.email.toLowerCase() === q ||
              c.name.toLowerCase().includes(q)
          );

      if (!client) {
        res.status(404).json({
          error: 'Akun Klien tidak ditemukan. Silakan pilih akun tersedia atau daftar baru.',
        });
        return;
      }

      const authSession: AuthSession = {
        token: `tok-cli-${client.id}-${Date.now()}`,
        role: 'client',
        userId: client.id,
        name: client.name,
        email: client.email,
        subtitle: client.company || 'Klien Perseorangan',
      };
      res.json(authSession);
      return;
    }

    if (role === 'lawyer') {
      const q = (identifier || '').toLowerCase().trim();
      const lawyer = userId
        ? state.lawyers.find((l) => l.id === userId)
        : state.lawyers.find(
            (l) =>
              l.email.toLowerCase() === q ||
              l.niaPeradi.toLowerCase().includes(q) ||
              l.name.toLowerCase().includes(q)
          );

      if (!lawyer) {
        res.status(404).json({
          error: 'Akun Advokat / NIA PERADI tidak ditemukan.',
        });
        return;
      }

      const authSession: AuthSession = {
        token: `tok-lw-${lawyer.id}-${Date.now()}`,
        role: 'lawyer',
        userId: lawyer.id,
        name: lawyer.name,
        email: lawyer.email,
        subtitle: `${lawyer.niaPeradi} · ${lawyer.specialty}`,
      };
      res.json(authSession);
      return;
    }

    res.status(400).json({ error: 'Peran pengguna tidak valid.' });
  });

  // Register a brand new Client account with its own isolated session
  app.post('/api/auth/register-client', (req, res) => {
    const { name, email, company, phone } = req.body as {
      name: string;
      email: string;
      company?: string;
      phone?: string;
    };

    if (!name?.trim() || !email?.trim()) {
      res.status(400).json({ error: 'Nama lengkap dan email wajib diisi.' });
      return;
    }

    const existing = state.clients.find(
      (c) => c.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (existing) {
      const authSession: AuthSession = {
        token: `tok-cli-${existing.id}-${Date.now()}`,
        role: 'client',
        userId: existing.id,
        name: existing.name,
        email: existing.email,
        subtitle: existing.company || 'Klien Perseorangan',
      };
      res.json(authSession);
      return;
    }

    const newClient: ClientAccount = {
      id: `cli-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company?.trim() || 'Klien Perseorangan',
      phone: phone?.trim() || '-',
    };
    state.clients.push(newClient);
    syncAllClients();

    const authSession: AuthSession = {
      token: `tok-cli-${newClient.id}-${Date.now()}`,
      role: 'client',
      userId: newClient.id,
      name: newClient.name,
      email: newClient.email,
      subtitle: newClient.company || 'Klien Perseorangan',
    };
    res.json(authSession);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`AdvokaID Real-Time Legal Server running on http://localhost:${PORT}`);
  });
}

startServer();
