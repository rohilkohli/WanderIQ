export function getAiStatusLabel(status?: string, fallbackUsed?: boolean): string {
  if (!status) {
    return fallbackUsed ? "Validated / AI Fallback" : "Validated";
  }
  if (status === "idle") return "";
  if (status === "fallback_demo") return "Demo Fallback";
  if (status === "offline_fallback") return "Offline Fallback";
  if (status === "validated_fallback") return "Validated / AI Fallback";
  return "Validated";
}
