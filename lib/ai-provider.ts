/**
 * Server-only Sub2API adapter.
 *
 * Codex uses wire_api = "responses"; that format requires POST /responses,
 * not the Chat Completions endpoint.
 */
export type ProviderProtocol = "responses" | "openai" | "anthropic";
type FetchLike = typeof fetch;
type ProviderRequest = {
  apiKey: string;
  model: string;
  protocol: ProviderProtocol;
  baseUrl: string;
  systemPrompt: string;
  userInput: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
};
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}
function responseMessage(data: unknown): string {
  const obj = record(data);
  const status = obj.status;
  if (status === "failed" || status === "incomplete") {
    const error = record(obj.error);
    const details = record(obj.incomplete_details);
    const reason = String(error.code || details.reason || status).slice(0, 75);
    throw new Error("Responses API returned " + String(status) + " (" + reason + ")");
  }
  if (typeof obj.output_text === "string" && obj.output_text.trim()) return obj.output_text;
  const output = Array.isArray(obj.output) ? obj.output : [];
  // Do not mistake reasoning items for the assistant's final message.
  const texts = output.flatMap((part: unknown) => {
    const message = record(part);
    if (message.type !== "message" || message.role !== "assistant") return [];
    const content = Array.isArray(message.content) ? message.content : [];
    return content.map((entry: unknown) => record(entry))
      .filter((entry) => entry.type === "output_text" && typeof entry.text === "string")
      .map((entry) => String(entry.text));
  });
  if (!texts.length) throw new Error("Responses API returned no assistant text");
  return texts.join("\n");
}
export function extractModelText(data: unknown, protocol: ProviderProtocol): string {
  const obj = record(data);
  if (protocol === "responses") return responseMessage(data);
  if (protocol === "anthropic") {
    const blocks = Array.isArray(obj.content) ? obj.content : [];
    const text = blocks.map((part: unknown) => record(part))
      .filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => String(part.text)).join("\n");
    if (!text) throw new Error("Anthropic API returned no text");
    return text;
  }
  const choices = Array.isArray(obj.choices) ? obj.choices : [];
  const text = record(record(choices[0]).message).content;
  if (typeof text !== "string" || !text.trim()) throw new Error("Chat Completions API returned no text");
  return text;
}
export async function requestProviderText({
  apiKey, model, protocol, baseUrl, systemPrompt, userInput,
  fetchImpl = fetch, timeoutMs = 35000,
}: ProviderRequest): Promise<string> {
  const url = baseUrl.trim().replace(/\/+$/, "");
  if (!url.startsWith("https://")) throw new Error("AI provider URL must use HTTPS");
  const endpoint = protocol === "responses" ? "responses"
    : protocol === "anthropic" ? "messages" : "chat/completions";
  const headers: Record<string, string> = protocol === "anthropic"
    ? { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" }
    : { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" };
  const payload = protocol === "responses"
    ? {
        model, instructions: systemPrompt, input: userInput,
        // This is constrained university-ID ranking, not a long reasoning task.
        max_output_tokens: 4096,
        reasoning: { effort: "none" },
        text: { format: { type: "json_object" } },
      }
    : protocol === "anthropic"
      ? { model, max_tokens: 1200, system: systemPrompt, messages: [{ role: "user", content: userInput }] }
      : { model, temperature: 0.25, max_tokens: 1200,
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userInput }] };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetchImpl(url + "/" + endpoint, {
      method: "POST", headers, signal: controller.signal,
      cache: "no-store", body: JSON.stringify(payload),
    });
  } catch (error) {
    if (controller.signal.aborted) throw new Error("AI provider timed out");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const info = record(body);
    const error = record(info.error);
    const code = String(error.code || error.type || info.code || "").slice(0, 65);
    const detail = String(error.message || info.message || "").slice(0, 180);
    const sanitized = (text: string) => text
      .replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]")
      .replaceAll("\n", " ").replaceAll("\r", " ");
    console.warn("[GEXP AI] Provider error", response.status, sanitized(code), sanitized(detail));
    if (response.status === 503 && /no available accounts/i.test(detail)) {
      throw new Error("DeepSeek provider has no available upstream accounts (HTTP 503)");
    }
    throw new Error("AI provider returned HTTP " + response.status +
      (code ? " (" + sanitized(code) + ")" : ""));
  }
  return extractModelText(await response.json(), protocol);
}


/**
 * Keep GEXP responsive when the Pro channel has exhausted capacity or stalls.
 * Never label a fallback as Pro: return the actual model used to generate text.
 */
export async function requestWithModelFallback(
  request: ProviderRequest & { fallbackModel?: string },
): Promise<{ text: string; model: string; usedFallback: boolean }> {
  const { fallbackModel, ...primary } = request;
  try {
    return {
      text: await requestProviderText({ ...primary, timeoutMs: 12000 }),
      model: primary.model,
      usedFallback: false,
    };
  } catch (error) {
    if (primary.protocol !== "responses" || !fallbackModel || fallbackModel === primary.model) {
      throw error;
    }
    console.warn("[GEXP AI] Primary DeepSeek model unavailable, attempting Flash fallback");
    return {
      text: await requestProviderText({
        ...primary,
        model: fallbackModel,
        timeoutMs: 28000,
      }),
      model: fallbackModel,
      usedFallback: true,
    };
  }
}
