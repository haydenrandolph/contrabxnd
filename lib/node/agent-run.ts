import Anthropic from '@anthropic-ai/sdk';
import { runNodeTool } from '@/lib/node/agent-tools';

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
    maxIterations?: number;
    maxTokens?: number;
  },
  ev: AgentEvents,
): Promise<void> {
  const convo: Anthropic.MessageParam[] = [...opts.messages];
  const maxIter = opts.maxIterations ?? 6;

  for (let i = 0; i < maxIter; i++) {
    const stream = anthropic.messages.stream({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system,
      tools: opts.tools,
      messages: convo,
    });
    stream.on('text', (delta) => ev.onText(delta));
    const msg = await stream.finalMessage();
    convo.push({ role: 'assistant', content: msg.content });

    if (msg.stop_reason !== 'tool_use') return;

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of msg.content) {
      if (block.type === 'tool_use') {
        ev.onTool?.(block.name, block.input);
        const raw = await runNodeTool(block.name, block.input as Record<string, unknown>);
        let parsed: unknown = raw;
        try { parsed = JSON.parse(raw); } catch { /* keep string */ }
        ev.onToolResult?.(block.name, parsed);
        results.push({ type: 'tool_result', tool_use_id: block.id, content: raw });
      }
    }
    convo.push({ role: 'user', content: results });
  }
}
