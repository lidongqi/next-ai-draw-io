import {
    existsSync,
    mkdirSync,
    readFileSync,
    unlinkSync,
    writeFileSync,
} from "node:fs"
import path from "node:path"
import { app } from "electron"

const BOOTSTRAP_FILE = "bootstrap.json"

interface BootstrapConfig {
    dataPath?: string
}

let resolvedDataPath: string | null = null

/**
 * Get the system default userData path (before any override).
 * Cached so we can detect whether a custom path is active.
 */
let systemDefaultDataPath: string | null = null

function getSystemDefaultDataPath(): string {
    if (!systemDefaultDataPath) {
        systemDefaultDataPath = app.getPath("userData")
    }
    return systemDefaultDataPath
}

/**
 * Get the path to the bootstrap config file.
 * Stored next to the executable for portable-friendly access.
 */
function getBootstrapPath(): string {
    return path.join(path.dirname(app.getPath("exe")), BOOTSTRAP_FILE)
}

/**
 * Read the bootstrap config, returning null if it doesn't exist or is invalid.
 */
function readBootstrapConfig(): BootstrapConfig | null {
    const bootstrapPath = getBootstrapPath()
    if (!existsSync(bootstrapPath)) {
        return null
    }
    try {
        const content = readFileSync(bootstrapPath, "utf-8")
        const config = JSON.parse(content) as BootstrapConfig
        if (config.dataPath && typeof config.dataPath === "string") {
            return config
        }
    } catch (error) {
        console.error("Failed to read bootstrap config:", error)
    }
    return null
}

/**
 * Write the bootstrap config file.
 */
function writeBootstrapConfig(config: BootstrapConfig): void {
    const bootstrapPath = getBootstrapPath()
    try {
        writeFileSync(bootstrapPath, JSON.stringify(config, null, 2), "utf-8")
    } catch (error) {
        console.error("Failed to write bootstrap config:", error)
    }
}

/**
 * Resolve the effective data path.
 * Priority: bootstrap.json > NEXT_AI_DRAWIO_DATA_PATH env var > system default
 */
function resolveDataPath(): string {
    // Priority 1: bootstrap.json (set via Settings UI)
    const bootstrap = readBootstrapConfig()
    if (bootstrap?.dataPath) {
        console.log(
            `Using data path from bootstrap.json: ${bootstrap.dataPath}`,
        )
        return bootstrap.dataPath
    }

    // Priority 2: environment variable
    const envPath = process.env.NEXT_AI_DRAWIO_DATA_PATH
    if (envPath) {
        console.log(`Using data path from environment variable: ${envPath}`)
        return envPath
    }

    // Priority 3: system default
    const defaultPath = getSystemDefaultDataPath()
    console.log(`Using default data path: ${defaultPath}`)
    return defaultPath
}

/**
 * Initialize the data path. Must be called before any code that depends on
 * app.getPath("userData"). Overrides the userData path if a custom path is
 * configured, and ensures the directory exists.
 */
export function initDataPath(): void {
    const defaultPath = getSystemDefaultDataPath()
    resolvedDataPath = resolveDataPath()

    if (resolvedDataPath !== defaultPath) {
        // Ensure the custom directory exists
        if (!existsSync(resolvedDataPath)) {
            try {
                mkdirSync(resolvedDataPath, { recursive: true })
                console.log(`Created data directory: ${resolvedDataPath}`)
            } catch (error) {
                console.error(
                    `Failed to create data directory "${resolvedDataPath}", falling back to default:`,
                    error,
                )
                resolvedDataPath = defaultPath
                return
            }
        }

        app.setPath("userData", resolvedDataPath)
        console.log(`Data path set to: ${resolvedDataPath}`)
    }
}

/**
 * Get the currently resolved data path.
 */
export function getDataPath(): string {
    if (!resolvedDataPath) {
        // If initDataPath hasn't been called yet, resolve now
        resolvedDataPath = resolveDataPath()
    }
    return resolvedDataPath
}

/**
 * Get whether a custom data path is currently in effect.
 */
export function isCustomDataPath(): boolean {
    return getDataPath() !== getSystemDefaultDataPath()
}

/**
 * Set a new data path. Writes to bootstrap.json and requires app restart.
 * Returns true if the path was saved successfully.
 */
export function setDataPath(newPath: string): boolean {
    try {
        // Validate the path is absolute
        if (!path.isAbsolute(newPath)) {
            console.error("Data path must be an absolute path:", newPath)
            return false
        }

        writeBootstrapConfig({ dataPath: newPath })
        console.log(`Data path saved to bootstrap.json: ${newPath}`)
        return true
    } catch (error) {
        console.error("Failed to set data path:", error)
        return false
    }
}

/**
 * Clear the custom data path setting (revert to default).
 */
export function clearDataPath(): void {
    const bootstrapPath = getBootstrapPath()
    try {
        const config = readBootstrapConfig()
        if (config) {
            delete config.dataPath
            if (Object.keys(config).length > 0) {
                writeBootstrapConfig(config)
            } else if (existsSync(bootstrapPath)) {
                unlinkSync(bootstrapPath)
            }
        }
    } catch (error) {
        console.error("Failed to clear data path:", error)
    }
}
