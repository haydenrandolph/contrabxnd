import Anthropic from '@anthropic-ai/sdk';
import { runNodeTool } from '@/lib/node/agent-tools';
import { waitForChatWork } from '@/lib/chat-request';

export interface AgentEvents {
  /** Streamed text deltas of the assistant's reply. */
  onText: (delta: string) => void;
  /** A tool is about to run. */
  onTool?: (name: string, input: unknown) => void;
  /** Parsed result of a tool call (for rendering result cards). */
  onToolResult?: (name: string, data: unknown) => void;
}

/**
 * Runs a streaming agentic loop: streams the model's text as it arrives,
 * executes node tools between turns, and feeds results back until the model
 * finishes. Shared by the explorer chat and the terminal analyst.
 */
export async function runAgentStream(
  anthropic: Anthropic,
  opts: {
    model: string;
    system: string;
    tools: Anthropic.Tool[];
    messages: Anthropic.MessageParam[];
    signal: AbortSignal;
    maxIterations?: number;
    maxTokens?: number;
  },
  ev: AgentEvents,
): Promise<void> {
  const convo: Anthropic.MessageParam[] = [...opts.messages];
  const maxIter = opts.maxIterations ?? 6;

  for (let i = 0; i < maxIter; i++) {
    opts.signal.throwIfAborted();
    const stream = anthropic.messages.stream({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system,
      tools: opts.tools,
      messages: convo,
    }, { signal: opts.signal, timeout: 55_000, maxRetries: 0 });
    stream.on('text', (delta) => {
      if (!opts.signal.aborted) ev.onText(delta);
    });
    const msg = await waitForChatWork(opts.signal, () => stream.finalMessage());
    opts.signal.throwIfAborted();
    convo.push({ role: 'assistant', content: msg.content });

    if (msg.stop_reason !== 'tool_use') return;

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of msg.content) {
      if (block.type === 'tool_use') {
        opts.signal.throwIfAborted();
        ev.onTool?.(block.name, block.input);
        opts.signal.throwIfAborted();
        // Nested tools cannot yet accept a signal. Their node fetches retain 8s
        // deadlines; abandon the result on abort and never start another tool/turn.
        const raw = await waitForChatWork(opts.signal,
          () => runNodeTool(block.name, block.input as Record<string, unknown>));
        opts.signal.throwIfAborted();
        let parsed: unknown = raw;
        try { parsed = JSON.parse(raw); } catch { /* keep string */ }
        ev.onToolResult?.(block.name, parsed);
        results.push({ type: 'tool_result', tool_use_id: block.id, content: raw });
      }
    }
    convo.push({ role: 'user', content: results });
  }
}
