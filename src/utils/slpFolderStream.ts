import * as path from "path";
import chokidar, { FSWatcher } from "chokidar";
import fs from "fs";
import tailstream, { TailStream } from "tailstream";

import { SlpStream } from "./slpStream";

export class SlpFolderStream extends SlpStream {
  private watcher: FSWatcher | null = null;
  private readStream: TailStream | null = null;

  /**
   * Starts watching a particular folder for slp files. It treats all new
   * `.slp` files as though it's a live Slippi stream.
   *
   * @param {string} slpFolder
   * @memberof SlpFolderStream
   */
  public start(slpFolder: string): void {
    const initialFiles = fs.readdirSync(slpFolder).map(file =>
      path.resolve(path.join(slpFolder, file))
    );
    const slpGlob = path.join(slpFolder, "*.slp");

    // Initialize watcher.
    this.watcher = chokidar.watch(slpGlob, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    });
    this.watcher.on("add", filePath => {
      if (initialFiles.includes(filePath)) {
        return;
      }
      // This is a newly generated file
      if (this.readStream) {
        // End the old stream
        this.readStream.done();
      }
      // Create a new stream for the new file
      this.readStream = tailstream.createReadStream(filePath);
      this.readStream.on("data", (data: any) => this.write(data));
    });
  }

  /**
   * Stops all file watching and cleans up.
   *
   * @memberof SlpFolderStream
   */
  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
    }
    if (this.readStream) {
      this.readStream.done();
    }
  }

  /**
   * Ends the stream, stopping all file watching.
   *
   * @memberof SlpFolderStream
   */
  public end(): void {
    super.end();
    this.stop();
  }
}