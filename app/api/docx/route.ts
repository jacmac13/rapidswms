import { createClient } from '@/lib/supabase/server';
import { hasFeature } from '@/lib/plan-features';
import type { PlanKey } from '@/lib/plan-features';
import type { SwmsDocument, SwmsActivity } from '@/lib/types';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';

export const dynamic = 'force-dynamic';

function riskText(level: string): string {
  return level ?? 'N/A';
}

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: `• ${text}`, size: 20 })],
    spacing: { after: 60 },
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 300, after: 120 },
  });
}

function activitiesTable(activities: SwmsActivity[]): Table {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Task', bold: true, size: 18 })] })],
        width: { size: 20, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Hazards', bold: true, size: 18 })] })],
        width: { size: 20, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Controls', bold: true, size: 18 })] })],
        width: { size: 25, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Initial Risk', bold: true, size: 18 })] })],
        width: { size: 10, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Residual Risk', bold: true, size: 18 })] })],
        width: { size: 10, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Responsible', bold: true, size: 18 })] })],
        width: { size: 15, type: WidthType.PERCENTAGE },
      }),
    ],
    tableHeader: true,
  });

  const dataRows = activities.map(
    (act) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: act.task, size: 18 })] })],
          }),
          new TableCell({
            children: act.hazards.map((h) => bulletParagraph(h)),
          }),
          new TableCell({
            children: act.controls.map((c) => bulletParagraph(c)),
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: riskText(act.initialRisk), size: 18 })],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: riskText(act.residualRisk), size: 18 })],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: act.responsible, size: 18 })] })],
          }),
        ],
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
  });
}

function signOffTable(): Table {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Name', bold: true, size: 18 })] })],
        width: { size: 40, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Signature', bold: true, size: 18 })] })],
        width: { size: 40, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Date', bold: true, size: 18 })] })],
        width: { size: 20, type: WidthType.PERCENTAGE },
      }),
    ],
    tableHeader: true,
  });

  const blankRows = [1, 2, 3, 4, 5].map(
    () =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })],
            margins: { top: 300, bottom: 300 },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })],
            margins: { top: 300, bottom: 300 },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })],
            margins: { top: 300, bottom: 300 },
          }),
        ],
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...blankRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .single();

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  if (!isActive) return Response.json({ error: 'Active subscription required.' }, { status: 402 });

  if (!hasFeature(subscription?.plan as PlanKey, 'docx_export')) {
    return Response.json({ error: 'Upgrade to Business to export DOCX.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const swmsId = typeof body.swmsId === 'string' ? body.swmsId.trim() : '';
  if (!swmsId) return Response.json({ error: 'swmsId is required.' }, { status: 400 });

  const { data: doc, error: docError } = await supabase
    .from('swms_documents')
    .select('document_number, job_title, trade, state, swms_json, created_at')
    .eq('id', swmsId)
    .eq('user_id', user.id)
    .single();

  if (docError || !doc) {
    return Response.json({ error: 'Document not found.' }, { status: 404 });
  }

  const swms = doc.swms_json as SwmsDocument;
  const today = new Date().toLocaleDateString('en-AU', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const sections: (Paragraph | Table)[] = [
    // Header
    new Paragraph({
      children: [
        new TextRun({ text: swms.jobTitle, bold: true, size: 32 }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `${doc.document_number}  ·  ${doc.trade}  ·  ${doc.state}  ·  ${today}`, size: 20, color: '5A5A66' }),
      ],
      spacing: { after: 240 },
    }),

    // High Risk Work
    sectionHeading('High-Risk Construction Work'),
    ...(swms.highRiskWork.length > 0
      ? swms.highRiskWork.map((item) => bulletParagraph(item))
      : [new Paragraph({ children: [new TextRun({ text: 'None identified.', size: 20, italics: true })] })]),

    // PPE
    sectionHeading('Required PPE'),
    ...swms.ppe.map((item) => bulletParagraph(item)),

    // Permits
    sectionHeading('Licences & Permits Required'),
    ...(swms.permits.length > 0
      ? swms.permits.map((item) => bulletParagraph(item))
      : [new Paragraph({ children: [new TextRun({ text: 'None required.', size: 20, italics: true })] })]),

    // Activities table
    sectionHeading('Work Activities & Risk Controls'),
    activitiesTable(swms.activities),
    new Paragraph({ text: '', spacing: { after: 120 } }),

    // Emergency Procedures
    sectionHeading('Emergency Procedures'),
    ...swms.emergencyProcedures.map((step, i) =>
      new Paragraph({
        children: [new TextRun({ text: `${i + 1}. ${step}`, size: 20 })],
        spacing: { after: 80 },
      })
    ),

    // Legislation
    sectionHeading('Relevant Legislation & Standards'),
    ...swms.legislation.map((item) => bulletParagraph(item)),

    // Sign-off
    sectionHeading('Sign-Off Sheet'),
    new Paragraph({
      children: [
        new TextRun({
          text: 'All workers must read this SWMS and sign below before commencing work.',
          size: 20,
          italics: true,
        }),
      ],
      spacing: { after: 160 },
    }),
    signOffTable(),
  ];

  const docxDoc = new Document({
    sections: [{ children: sections }],
    creator: 'RapidSWMS',
    title: `${doc.document_number} — ${swms.jobTitle}`,
  });

  let buffer: Buffer;
  try {
    buffer = await Packer.toBuffer(docxDoc);
  } catch (err) {
    console.error('[docx] generation error:', err instanceof Error ? err.message : 'unknown');
    return Response.json({ error: 'Could not generate DOCX. Please try again.' }, { status: 500 });
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${doc.document_number}.docx"`,
      'Content-Length': String(buffer.length),
    },
  });
}
