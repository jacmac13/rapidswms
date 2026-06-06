import Anthropic from '@anthropic-ai/sdk';
import type { SwmsDocument } from './types';

export const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const SWMS_SYSTEM_PROMPT = `You are an Australian WHS consultant. Produce a Safe Work Method Statement as valid JSON — no markdown, no preamble.

HIGH RISK WORK categories (WHS Reg 291) — include any that apply verbatim:
Fall >2m | Telecom tower | Demolition structural | Asbestos | Temporary support | Confined space | Trench >1.5m/tunnel | Explosives | Pressurised gas | Chemical/fuel/refrigerant lines | Energised electrical | Flammable atmosphere | Tilt-up/precast | Road/rail/traffic corridor | Mobile plant | Extreme temperature | Drowning risk | Diving

Risk ratings: Low | Medium | High | Extreme (initial = uncontrolled, residual = after controls)
Controls hierarchy: Elimination > Substitution > Engineering > Administrative > PPE

Output schema (JSON only):
{"jobTitle":"","highRiskWork":[],"ppe":[],"permits":[],"activities":[{"task":"","hazards":[],"initialRisk":"","controls":[],"residualRisk":"","responsible":""}],"emergencyProcedures":[],"legislation":[]}

Rules: 5 activities max, 3 controls max per activity, 3 legislation items max, concise phrases only. JSON must be valid and parseable.`;

export interface SwmsInput {
  company: string;
  abn?: string;
  trade: string;
  state: string;
  site?: string;
  principal?: string;
  jobDescription: string;
}

export function buildUserMessage(input: SwmsInput): string {
  return `Trade: ${input.trade}
Jurisdiction: ${input.state}, Australia
Business: ${input.company}${input.abn ? ` (ABN: ${input.abn})` : ''}
Worksite: ${input.site || 'Not specified'}
Principal contractor: ${input.principal || 'Not specified'}

JOB DESCRIPTION:
${input.jobDescription}

Produce a complete, job-specific SWMS as JSON per your instructions.`;
}

export function parseSwmsJson(text: string): SwmsDocument {
  const cleaned = text.trim().replace(/```json|```/gi, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('Invalid JSON response from Claude');
  return JSON.parse(cleaned.slice(first, last + 1)) as SwmsDocument;
}

export async function generateSwms(input: SwmsInput): Promise<SwmsDocument> {
  const response = await anthropicClient.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    system: SWMS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(input) }],
  });

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('');

  return parseSwmsJson(text);
}
