import type { DispatchError, DispatchInfo, Event, Extrinsic } from '@polkadot/types/interfaces';

//copied from type definitions because it's private
export interface TxWithEvent {
    dispatchError?: DispatchError;
    dispatchInfo?: DispatchInfo;
    events: Event[];
    extrinsic: Extrinsic;
}

export function isSuccess(events: Event[]): boolean {
    let finalEvent = events[events.length - 1];
    return finalEvent.method === "ExtrinsicSuccess"
}