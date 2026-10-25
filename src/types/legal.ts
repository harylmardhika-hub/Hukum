export type LegalSpecialty =
  | 'Hukum Bisnis & Korporasi'
  | 'Hukum Perdata'
  | 'Hukum Pidana'
  | 'Hukum Keluarga & Waris'
  | 'Hukum Ketenagakerjaan';

export type ClauseRiskStatus = 'safe' | 'warning' | 'critical';

export interface ClientAccount {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone: string;
}

export interface AuthSession {
  token: string;
  role: 'client' | 'lawyer';
  userId: string;
  name: string;
  email: string;
  subtitle: string; // e.g. Company name for client, or NIA PERADI + Specialty for lawyer
}

export interface Lawyer {
  id: string;
  name: string;
  email: string;
  title: string;
  niaPeradi: string;
  specialty: LegalSpecialty;
  secondarySpecialties: string[];
  experienceYears: number;
  jurisdiction: string;
  almaMater: string;
  consultationFee: number;
  rating: number;
  casesHandled: number;
  responseTimeMinutes: number;
  isOnline: boolean;
  bio: string;
  notableCredentials: string[];
  avatarStyle: {
    bgGradient: string;
    suitColor: string;
    accentColor: string;
    initials: string;
    gender: 'male' | 'female';
    glasses?: boolean;
  };
}

export interface ContractClause {
  id: string;
  clauseNumber: string; // e.g. "Pasal 1"
  title: string;
  originalText: string;
  riskStatus: ClauseRiskStatus;
  lawyerNote: string;
  proposedRevision: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}

export interface LegalDocument {
  id: string;
  sessionId: string;
  title: string;
  documentType: string;
  uploadedBy: 'client' | 'lawyer';
  uploadedAt: string;
  overallStatus: 'Menunggu Tinjauan' | 'Sedang Ditinjau' | 'Selesai Ditinjau';
  clauses: ContractClause[];
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderRole: 'client' | 'lawyer' | 'system';
  senderName: string;
  content: string;
  timestamp: string;
  referencedClauseId?: string;
  referencedClauseLabel?: string;
  attachedDocumentId?: string;
  attachedDocumentTitle?: string;
}

export interface ConsultationSession {
  id: string;
  caseNumber: string;
  clientId: string;
  clientName: string;
  clientCompany?: string;
  lawyerId: string;
  title: string;
  category: LegalSpecialty;
  status: 'Aktif' | 'Menunggu Tinjauan Kontrak' | 'Opini Hukum Terbit';
  startedAt: string;
  legalOpinionSummary: string;
  recommendedNextSteps: string[];
  unreadClientCount: number;
  unreadLawyerCount: number;
}

export interface ContractTemplate {
  id: string;
  title: string;
  documentType: string;
  category: LegalSpecialty;
  description: string;
  clauses: Omit<ContractClause, 'id'>[];
}

export interface ServerState {
  clients: ClientAccount[];
  lawyers: Lawyer[];
  sessions: ConsultationSession[];
  messages: ChatMessage[];
  documents: LegalDocument[];
}

export type WsClientEvent =
  | {
      type: 'chat:send';
      payload: {
        id: string;
        sessionId: string;
        senderRole: 'client' | 'lawyer';
        senderName: string;
        content: string;
        referencedClauseId?: string;
        referencedClauseLabel?: string;
      };
    }
  | {
      type: 'chat:typing';
      payload: {
        sessionId: string;
        senderRole: 'client' | 'lawyer';
        senderName: string;
        isTyping: boolean;
      };
    }
  | {
      type: 'contract:annotate_clause';
      payload: {
        documentId: string;
        sessionId: string;
        clauseId: string;
        riskStatus: ClauseRiskStatus;
        lawyerNote: string;
        proposedRevision: string;
        updatedBy: string;
        postToChat?: boolean;
      };
    }
  | {
      type: 'contract:upload_document';
      payload: {
        id: string;
        sessionId: string;
        title: string;
        documentType: string;
        uploadedBy: 'client' | 'lawyer';
        clauses: Omit<ContractClause, 'id'>[];
      };
    }
  | {
      type: 'session:create';
      payload: {
        id: string;
        clientId: string;
        clientName: string;
        clientCompany?: string;
        lawyerId: string;
        title: string;
        category: LegalSpecialty;
        initialMessage: string;
        templateId?: string;
      };
    }
  | {
      type: 'session:update_opinion';
      payload: {
        sessionId: string;
        legalOpinionSummary: string;
        recommendedNextSteps: string[];
        status: ConsultationSession['status'];
      };
    };

export type WsServerEvent =
  | { type: 'state:init'; payload: ServerState }
  | { type: 'state:sync'; payload: ServerState }
  | {
      type: 'chat:typing_update';
      payload: {
        sessionId: string;
        senderRole: 'client' | 'lawyer';
        senderName: string;
        isTyping: boolean;
      };
    };
