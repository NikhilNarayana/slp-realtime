import fs from "fs";
import { ComboType, Frames } from "slp-parser-js";

interface DolphinQueue {
  mode: string;
  replay: string;
  isRealTimeMode: boolean;
  outputOverlayFiles: boolean;
  queue: DolphinCombo[];
}

const defaultSettings = {
  startBuffer: 240,
  endBuffer: 180,
};

interface DolphinCombo {
  path: string;
  startFrame: number;
  endFrame: number;
}

export type DolphinComboQueueOptions = typeof defaultSettings;

// Games are 8 minutes long, at 60fps.
const MAX_END_FRAME = 28800;

export class DolphinComboQueue {
  private options: DolphinComboQueueOptions;
  private combos: DolphinCombo[];

  public constructor(options?: Partial<DolphinComboQueueOptions>) {
    this.options = Object.assign({}, defaultSettings, options);
    this.combos = new Array<DolphinCombo>();
  }

  public addCombo(path: string, combo: ComboType): void {
    const startFrame = Math.min(Frames.FIRST, combo.startFrame - this.options.startBuffer);
    // Ideally we use the end frame specified in the game, but we don't actually have
    // access to that information in a realtime environment.
    // So instead, if endFrame is undefined, we use the max possible end frame.
    const endFrame = combo.endFrame ? combo.endFrame + this.options.endBuffer : MAX_END_FRAME;
    this.combos.push({
      path,
      startFrame,
      endFrame,
    });
  }

  public clear(): void {
    this.combos = [];
  }

  public updateSettings(settings: Partial<DolphinComboQueueOptions>): void {
    this.options = Object.assign({}, this.options, settings);
  }

  public writeFileSync(filePath: string): void {
    const data = this._dataToWrite();
    fs.writeFileSync(filePath, data);
  }

  public async writeFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject): void => {
      const data = this._dataToWrite();
      fs.writeFile(filePath, data, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private _dataToWrite(): string {
    const queue: DolphinQueue = {
      mode: "queue",
      replay: "",
      isRealTimeMode: false,
      outputOverlayFiles: true,
      queue: this.combos,
    };
    return JSON.stringify(queue, null, 2);
  }
}