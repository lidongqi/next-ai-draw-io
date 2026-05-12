import { contextBridge, ipcRenderer } from "electron"

/**
 * Expose safe APIs to the renderer process
 */
contextBridge.exposeInMainWorld("electronAPI", {
    // Platform information
    platform: process.platform,

    // Check if running in Electron
    isElectron: true,

    // Application version
    getVersion: () => ipcRenderer.invoke("get-version"),

    // Window controls (optional, for custom title bar)
    minimize: () => ipcRenderer.send("window-minimize"),
    maximize: () => ipcRenderer.send("window-maximize"),
    close: () => ipcRenderer.send("window-close"),

    // File operations
    openFile: () => ipcRenderer.invoke("dialog-open-file"),
    saveFile: (data: string) => ipcRenderer.invoke("dialog-save-file", data),

    // Proxy settings
    getProxy: () => ipcRenderer.invoke("get-proxy"),
    setProxy: (config: { httpProxy?: string; httpsProxy?: string }) =>
        ipcRenderer.invoke("set-proxy", config),

    // User locale settings
    getUserLocale: () => ipcRenderer.invoke("get-user-locale"),
    setUserLocale: (locale: string) =>
        ipcRenderer.invoke("set-user-locale", locale),

    // Data path management
    getDataPath: () => ipcRenderer.invoke("get-data-path"),
    setDataPath: (path: string) => ipcRenderer.invoke("set-data-path", path),
    resetDataPath: () => ipcRenderer.invoke("reset-data-path"),
    browseDirectory: () => ipcRenderer.invoke("dialog-browse-directory"),
})
