import { create } from 'zustand';
import type { ContractType } from '../types';

type AudioEntry = { uri: string; durationMs: number };

type DocEntry = {
  uri: string;
  name: string;
  mimeType: string;
};

type Party = {
  phone: string;
  role: 'initiateur' | 'partie';
  name?: string;
};

type ContractDraft = {
  contractId: string | null;
  type: ContractType | null;
  parties: Party[];
  audios: AudioEntry[];
  documents: DocEntry[];
  amount: string;
  dueDate: string;
};

type ContractStoreState = ContractDraft & {
  setContractId: (id: string) => void;
  setType: (type: ContractType) => void;
  setParties: (parties: Party[]) => void;
  addAudio: (audio: AudioEntry) => void;
  setAudios: (audios: AudioEntry[]) => void;
  addDocument: (doc: DocEntry) => void;
  removeDocument: (uri: string) => void;
  setAmount: (amount: string) => void;
  setDueDate: (date: string) => void;
  reset: () => void;
};

const initial: ContractDraft = {
  contractId: null,
  type: null,
  parties: [],
  audios: [],
  documents: [],
  amount: '',
  dueDate: '',
};

export const useContractStore = create<ContractStoreState>((set) => ({
  ...initial,
  setContractId: (contractId) => set({ contractId }),
  setType: (type) => set({ type }),
  setParties: (parties) => set({ parties }),
  addAudio: (audio) => set((s) => ({ audios: [...s.audios, audio] })),
  setAudios: (audios) => set({ audios }),
  addDocument: (doc) => set((s) => ({ documents: [...s.documents, doc] })),
  removeDocument: (uri) =>
    set((s) => ({ documents: s.documents.filter((d) => d.uri !== uri) })),
  setAmount: (amount) => set({ amount }),
  setDueDate: (dueDate) => set({ dueDate }),
  reset: () => set(initial),
}));
