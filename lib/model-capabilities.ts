/**
 * Client-safe model capability detection.
 * This module is safe to import from both client and server components.
 * It contains only pure string-matching logic with no Node.js dependencies.
 */

/**
 * Check if a model supports image/vision input.
 * Some models silently drop image parts without error (AI SDK warning only).
 * @param modelId The model ID to check
 * @param supportsImage Optional explicit override from model config. When set,
 *   this takes precedence over heuristic detection.
 */
export function supportsImageInput(
    modelId: string,
    supportsImage?: boolean,
): boolean {
    if (supportsImage !== undefined) {
        return supportsImage
    }

    const lowerModelId = modelId.toLowerCase()

    const hasVisionIndicator =
        lowerModelId.includes("vision") || lowerModelId.includes("vl")

    if (
        (lowerModelId.includes("kimi-k2") ||
            lowerModelId.includes("kimi_k2")) &&
        !hasVisionIndicator &&
        !lowerModelId.includes("2.5") &&
        !lowerModelId.includes("k2.5") &&
        !lowerModelId.includes("2.6") &&
        !lowerModelId.includes("k2.6")
    ) {
        return false
    }

    if (lowerModelId.includes("moonshot-v1") && !hasVisionIndicator) {
        return false
    }

    if (lowerModelId.includes("minimax") && !hasVisionIndicator) {
        return false
    }

    if (lowerModelId.includes("deepseek") && !hasVisionIndicator) {
        return false
    }

    if (
        lowerModelId.includes("qwen") &&
        !hasVisionIndicator &&
        !lowerModelId.includes("qwen3.5") &&
        !lowerModelId.includes("qvq")
    ) {
        return false
    }

    if (lowerModelId.includes("glm") && !hasVisionIndicator) {
        if (!/[\d.]v/.test(lowerModelId)) {
            return false
        }
    }

    return true
}
