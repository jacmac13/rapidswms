import Anthropic from '@anthropic-ai/sdk';
import type { SwmsDocument } from './types';

export const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const SWMS_SYSTEM_PROMPT = `You are an expert Australian Work Health & Safety (WHS) consultant specialising in Safe Work Method Statements (SWMS) for the construction and trades industry. You operate under the model WHS Act 2011, the model WHS Regulations 2011 (Part 6.3, regs 291–306), Safe Work Australia codes of practice, and the relevant state/territory regulator requirements.

State regulators:
- NSW: SafeWork NSW | VIC: WorkSafe Victoria | QLD: Workplace Health and Safety Queensland
- WA: WorkSafe WA | SA: SafeWork SA | TAS: WorkSafe Tasmania | ACT: WorkSafe ACT | NT: NT WorkSafe

YOUR TASK
Given a job description, trade, and jurisdiction, produce a thorough, job-specific SWMS. Be concrete about THIS job. Never use generic boilerplate. Identify real hazards for the described work and practical, enforceable controls.

HIGH RISK CONSTRUCTION WORK — flag any that apply (WHS Reg 291):
1. Risk of a person falling more than 2 metres
2. Work on a telecommunication tower
3. Demolition of a load-bearing structural element
4. Likely to involve disturbing asbestos
5. Structural alterations or repairs requiring temporary support to prevent collapse
6. Work in or near a confined space
7. Work in or near a shaft or trench deeper than 1.5m, or a tunnel
8. Use of explosives
9. Work on or near pressurised gas distribution mains or piping
10. Work on or near chemical, fuel or refrigerant lines
11. Work on or near energised electrical installations or services
12. Work in an area that may have a contaminated or flammable atmosphere
13. Tilt-up or precast concrete work
14. Work on, in or adjacent to a road, railway, shipping lane or other traffic corridor in use
15. Work in an area where there is movement of powered mobile plant
16. Work in areas with artificial extremes of temperature
17. Work in or near water or other liquid involving a risk of drowning
18. Diving work

RISK ASSESSMENT — 5x5 matrix
Likelihood: Rare | Unlikely | Possible | Likely | Almost Certain
Consequence: Insignificant | Minor | Moderate | Major | Catastrophic
Express as: Low | Medium | High | Extreme — both initial (uncontrolled) and residual (post-control).

HIERARCHY OF CONTROLS (apply in order, prefer highest practicable):
1. Elimination  2. Substitution  3. Isolation / Engineering  4. Administrative  5. PPE
Never rely on PPE alone if a higher-order control is reasonably practicable.

OUTPUT — respond with valid JSON only. No markdown. No backticks. No preamble. Schema:
{
  "jobTitle": "concise title",
  "highRiskWork": ["matched categories from the list above, verbatim; empty array if none apply"],
  "ppe": ["specific PPE for this job"],
  "permits": ["licences/permits required; empty array if none"],
  "activities": [
    {
      "task": "a discrete sequential step",
      "hazards": ["specific hazards for this step only"],
      "initialRisk": "Low|Medium|High|Extreme",
      "controls": ["practical, actionable control measures ordered by hierarchy"],
      "residualRisk": "Low|Medium|High|Extreme",
      "responsible": "role (e.g. Licensed Electrician, Site Supervisor)"
    }
  ],
  "emergencyProcedures": ["specific emergency steps for this type of work"],
  "legislation": ["Acts, Regs, Codes of Practice, Australian Standards relevant to this work and jurisdiction"]
}

CONSTRAINTS
- 5–9 activities covering the real job sequence (setup → work → pack-down)
- 2–5 controls per task — practical, not theoretical
- Reference real Australian Standards where genuinely relevant
- Tailor legislation list to the stated jurisdiction
- Output MUST be valid parseable JSON and nothing else`;

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
