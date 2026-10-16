import type { Apparatus, Element } from '@/engine/types';

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
    }
  | {
      kind: 'instrument';
      instrumentId: string;
      category: string;
      name: string;
    }
  | {
      kind: 'element';
      element: Element;
      name: string;
    };

export type DropTargetData =
  | { type: 'vessel'; vesselId: string; name: string }
  | { type: 'bench' };

export const dragId = (payload: { kind: string; chemicalId?: string; apparatusId?: string; instrumentId?: string; elementSymbol?: string }) => {
  if (payload.kind === 'chemical') return `chemical:${payload.chemicalId}`;
  if (payload.kind === 'element') return `element:${payload.elementSymbol}`;
  if (payload.kind === 'instrument') return `instrument:${payload.instrumentId}`;
  return `apparatus:${payload.apparatusId}`;
};

export const vesselDropId = (vesselId: string) => `vessel:${vesselId}`;
