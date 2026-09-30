export {};

export type UpdatePhase = 'idle' | 'checking' | 'available' | 'progress' | 'downloaded' | 'error';

export interface UpdateState {
  phase: UpdatePhase;
  currentVersion?: string;
  version?: string;
  releaseName?: string | null;
  releaseDate?: string | null;
  releaseNotes?: string[];
  percent?: number;
  bytesPerSecond?: number;
  message?: string;
}

declare global {
  interface Window {
    electron?: {
      selectReceiptDirectory: () => Promise<string | null>;
      getUpdateState: () => Promise<UpdateState>;
      downloadUpdate: () => Promise<unknown>;
      onUpdate: (channel: `update:${string}`, callback: (payload: UpdateState) => void) => () => void;
    };
  }
}
