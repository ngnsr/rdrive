import chokidar from "chokidar";
import Store from "electron-store";

interface WatcherOptions {
  folderPath: string;
  userId: string;
  store: Store;
}

export function startFolderWatcher({ folderPath }: WatcherOptions) {
  console.log(`[Watcher] Starting folder watcher on: ${folderPath}`);

  const watcher = chokidar.watch(folderPath, {
    persistent: true,
    ignoreInitial: false,
    depth: 0, // only root
  });

  return watcher;
}
