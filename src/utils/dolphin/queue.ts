import { ComboType, Frames } from "slp-parser-js";
import { shuffle } from "lodash";

export interface DolphinPlaybackItem {
  path: string;
  combo?: ComboType;
  gameStation?: string;
  gameStartAt?: string;
}

export interface DolphinQueueOptions {
  commandId?: string;
  mode: string;
  replay: string;
  isRealTimeMode: boolean;
  outputOverlayFiles: boolean;
}

export interface DolphinQueueFormat extends DolphinQueueOptions {
  queue: DolphinEntry[];
}

const defaultSettings = {
  shuffle: false,
  mode: "queue",
  replay: "",
  isRealTimeMode: false,
  outputOverlayFiles: true,
  startBuffer: 240,
  endBuffer: 180,
};

export interface DolphinEntry {
  path: string;
  startFrame?: number;
  endFrame?: number;
  gameStation?: string;
  gameStartAt?: string;
}

export type DolphinPlaybackQueueOptions = typeof defaultSettings;

export const generateDolphinQueue = (items: DolphinPlaybackItem[], options?: Partial<DolphinPlaybackQueueOptions>): DolphinQueueFormat => {
  const opts: DolphinPlaybackQueueOptions = Object.assign({}, defaultSettings, options);
  const entries = opts.shuffle ? shuffle(items) : items;
  const queue = entries.map(entry => mapDolphinEntry(entry, opts.startBuffer, opts.endBuffer));
  const dolphinQueue: DolphinQueueFormat = {
    mode: opts.mode,
    replay: opts.replay,
    isRealTimeMode: opts.isRealTimeMode,
    outputOverlayFiles: opts.outputOverlayFiles,
    queue,
  };
  return dolphinQueue;
}

export const generateDolphinQueuePayload = (items: DolphinPlaybackItem[], options?: Partial<DolphinPlaybackQueueOptions>, prettify=true): string => {
  const dolphinQueue = generateDolphinQueue(items, options);
  const spaces = prettify ? 2 : undefined;
  return JSON.stringify(dolphinQueue, undefined, spaces);
}

const mapDolphinEntry = (entry: DolphinPlaybackItem, startBuffer: number, endBuffer: number): DolphinEntry => {
  const { path, gameStation, gameStartAt, combo } = entry;
  const dolphinEntry: DolphinEntry = {
    path,
    gameStation,
    gameStartAt,
  };
  if (combo) {
    dolphinEntry.startFrame = Math.max(Frames.FIRST, combo.startFrame - startBuffer);
    // If endFrame is undefined it will just play to the end
    if (combo.endFrame) {
      dolphinEntry.endFrame = combo.endFrame + endBuffer;
    }
  }
  return dolphinEntry;
};
