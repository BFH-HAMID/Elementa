import type { Apparatus } from '@/engine/types';

/** What is being dragged, and what it can be dropped onto. */

export type DragPayload =
  | {
      kind: 'chemical';
      chemicalId: string;
      name: string;
      formula: string;
      color: string;
      state: 'solid' | 'liquid' | 'gas';
    }
  | {
      kind: 'apparatus';
      apparatusId: string;
      apparatusKind: Apparatus['kind'];
      shape: Apparatus['shape'];
      name: string;
    };

export type DropTargetData =
  | { type: 'vessel'; vesselId: string; name: string }
  | { type: 'bench' };

export const dragId = (payload: { kind: string; chemicalId?: string; apparatusId?: string }) =>
  payload.kind === 'chemical' ? `chemical:${payload.chemicalId}` : `apparatus:${payload.apparatusId}`;

export const vesselDropId = (vesselId: string) => `vessel:${vesselId}`;
