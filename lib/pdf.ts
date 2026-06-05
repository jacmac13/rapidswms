import {
  Document, Page, View, Text, StyleSheet, renderToBuffer, Font,
} from '@react-pdf/renderer';
import { createElement } from 'react';
import type { SwmsDocument, SwmsActivity } from './types';

// Register fonts — fall back to built-in Helvetica if network unavailable
Font.registerHyphenationCallback(word => [word]);

const C = {
  ink:      '#15151A',
  charcoal: '#23232B',
  steel:    '#5A5A66',
  paper:    '#F7F4ED',
  paper2:   '#EFEAE0',
  line:     '#D8D2C5',
  amber:    '#FFB81C',
  white:    '#FFFFFF',
  low:      '#2E7D32',
  medium:   '#E08600',
  high:     '#D7411E',
  extreme:  '#9B1B0E',
  red50:    '#FEF2F2',
  red200:   '#FECACA',
};

const s = StyleSheet.create({
  page:           { fontFamily: 'Helvetica', fontSize: 9, color: C.ink, backgroundColor: C.white, paddingHorizontal: 36, paddingVertical: 32 },
  // disclaimer
  disclaimer:     { backgroundColor: C.amber, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 12, borderRadius: 4 },
  disclaimerText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.ink },
  // header
  headerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  jobTitle:       { fontFamily: 'Helvetica-Bold', fontSize: 16, color: C.ink, flex: 1, marginRight: 16 },
  docMeta:        { textAlign: 'right' },
  docNumber:      { fontFamily: 'Helvetica', fontSize: 8, color: C.steel },
  docDate:        { fontFamily: 'Helvetica', fontSize: 8, color: C.steel, marginTop: 2 },
  subHeader:      { fontSize: 8, color: C.steel, marginTop: 3 },
  divider:        { borderBottomWidth: 1, borderBottomColor: C.line, marginVertical: 10 },
  // section
  sectionTitle:   { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.ink, marginBottom: 6 },
  section:        { marginBottom: 14 },
  // HRCW
  hrcwBox:        { backgroundColor: C.red50, borderWidth: 1, borderColor: C.red200, borderRadius: 4, padding: 8 },
  hrcwItem:       { flexDirection: 'row', gap: 4, marginBottom: 3 },
  hrcwText:       { fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.high, flex: 1 },
  // PPE chips
  ppeRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  ppeChip:        { backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
  ppeText:        { fontSize: 8, color: C.charcoal },
  // activities
  activityCard:   { borderWidth: 1, borderColor: C.line, borderRadius: 4, marginBottom: 8, overflow: 'hidden' },
  actHeader:      { backgroundColor: C.charcoal, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', justifyContent: 'space-between' },
  actNum:         { fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.amber, marginRight: 6 },
  actTask:        { fontFamily: 'Helvetica-Bold', fontSize: 9, color: C.white, flex: 1 },
  actRole:        { fontSize: 7, color: '#9CA3AF' },
  actBody:        { flexDirection: 'row' },
  actCol:         { flex: 1, padding: 8 },
  actColRight:    { flex: 1, padding: 8, borderLeftWidth: 1, borderLeftColor: C.line },
  actColTitle:    { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.steel, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  bulletRow:      { flexDirection: 'row', gap: 4, marginBottom: 2 },
  bulletMark:     { fontSize: 8, width: 10 },
  bulletText:     { fontSize: 8, color: C.charcoal, flex: 1 },
  actRiskRow:     { backgroundColor: C.paper2, borderTopWidth: 1, borderTopColor: C.line, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 8 },
  riskLabel:      { fontSize: 7, color: C.steel, fontFamily: 'Helvetica-Bold' },
  riskArrow:      { fontSize: 8, color: C.steel },
  // risk badges
  badge:          { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 },
  badgeText:      { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white },
  // emergency / legislation
  numberedRow:    { flexDirection: 'row', gap: 6, marginBottom: 3 },
  numText:        { fontSize: 8, color: C.steel, fontFamily: 'Helvetica', width: 16 },
  rowText:        { fontSize: 8, color: C.charcoal, flex: 1 },
  legRow:         { flexDirection: 'row', gap: 6, marginBottom: 3 },
  dashText:       { fontSize: 8, color: C.steel, width: 10 },
  // sign-off
  signTable:      { borderWidth: 1, borderColor: C.line, borderRadius: 4, overflow: 'hidden' },
  signHeaderRow:  { flexDirection: 'row', backgroundColor: C.charcoal },
  signHeaderCell: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.white, paddingHorizontal: 6, paddingVertical: 5 },
  signRow:        { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line },
  signCellNum:    { paddingHorizontal: 6, paddingVertical: 8, width: 24 },
  signCell:       { paddingHorizontal: 6, paddingVertical: 8, flex: 1, borderLeftWidth: 1, borderLeftColor: C.line },
  signLine:       { borderBottomWidth: 1, borderBottomColor: C.line, marginTop: 8 },
  // footer
  footer:         { position: 'absolute', bottom: 20, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between' },
  footerText:     { fontSize: 7, color: C.steel },
});

function riskColor(level: string) {
  if (level === 'Low') return C.low;
  if (level === 'Medium') return C.medium;
  if (level === 'High') return C.high;
  return C.extreme;
}

function RiskBadge({ level }: { level: string }) {
  return createElement(View, { style: [s.badge, { backgroundColor: riskColor(level) }] },
    createElement(Text, { style: s.badgeText }, level)
  );
}

function Activity({ act, index }: { act: SwmsActivity; index: number }) {
  return createElement(View, { style: s.activityCard, wrap: false },
    // Header
    createElement(View, { style: s.actHeader },
      createElement(Text, { style: s.actNum }, String(index).padStart(2, '0')),
      createElement(Text, { style: s.actTask }, act.task),
      createElement(Text, { style: s.actRole }, act.responsible),
    ),
    // Body
    createElement(View, { style: s.actBody },
      createElement(View, { style: s.actCol },
        createElement(Text, { style: s.actColTitle }, 'Hazards'),
        ...act.hazards.map((h, i) =>
          createElement(View, { key: i, style: s.bulletRow },
            createElement(Text, { style: [s.bulletMark, { color: C.high }] }, '▲'),
            createElement(Text, { style: s.bulletText }, h),
          )
        ),
      ),
      createElement(View, { style: s.actColRight },
        createElement(Text, { style: s.actColTitle }, 'Controls'),
        ...act.controls.map((c, i) =>
          createElement(View, { key: i, style: s.bulletRow },
            createElement(Text, { style: [s.bulletMark, { color: C.low }] }, '✓'),
            createElement(Text, { style: s.bulletText }, c),
          )
        ),
      ),
    ),
    // Risk row
    createElement(View, { style: s.actRiskRow },
      createElement(Text, { style: s.riskLabel }, 'Initial risk'),
      createElement(RiskBadge, { level: act.initialRisk }),
      createElement(Text, { style: s.riskArrow }, '→'),
      createElement(Text, { style: s.riskLabel }, 'Residual risk'),
      createElement(RiskBadge, { level: act.residualRisk }),
    ),
  );
}

export async function generatePdf(params: {
  swms: SwmsDocument;
  documentNumber: string;
  company: string;
  trade: string;
  state: string;
  siteAddress?: string;
}): Promise<Buffer> {
  const { swms, documentNumber, company, trade, state, siteAddress } = params;
  const today = new Date().toLocaleDateString('en-AU', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const doc = createElement(Document,
    { title: `${documentNumber} — ${swms.jobTitle}` },
    createElement(Page, { size: 'A4', style: s.page },

      createElement(View, { style: s.disclaimer },
        createElement(Text, { style: s.disclaimerText }, '⚠  AI-generated draft — review before use on site'),
      ),

      createElement(View, { style: s.headerRow },
        createElement(View, { style: { flex: 1 } },
          createElement(Text, { style: s.jobTitle }, swms.jobTitle),
          createElement(Text, { style: s.subHeader }, `${company}  ·  ${trade}  ·  ${state}`),
          siteAddress ? createElement(Text, { style: s.subHeader }, siteAddress) : null,
        ),
        createElement(View, { style: s.docMeta },
          createElement(Text, { style: s.docNumber }, documentNumber),
          createElement(Text, { style: s.docDate }, today),
        ),
      ),
      createElement(View, { style: s.divider }),

      swms.highRiskWork.length > 0 ? createElement(View, { style: s.section },
        createElement(Text, { style: s.sectionTitle }, 'High-Risk Construction Work'),
        createElement(View, { style: s.hrcwBox },
          ...swms.highRiskWork.map((item, i) =>
            createElement(View, { key: i, style: s.hrcwItem },
              createElement(Text, { style: [s.hrcwText, { width: 12 }] }, '⚠'),
              createElement(Text, { style: s.hrcwText }, item),
            )
          ),
        ),
      ) : null,

      createElement(View, { style: s.section },
        createElement(Text, { style: s.sectionTitle }, 'Required PPE'),
        createElement(View, { style: s.ppeRow },
          ...swms.ppe.map((item, i) =>
            createElement(View, { key: i, style: s.ppeChip },
              createElement(Text, { style: s.ppeText }, item),
            )
          ),
        ),
      ),

      swms.permits.length > 0 ? createElement(View, { style: s.section },
        createElement(Text, { style: s.sectionTitle }, 'Licences & Permits Required'),
        ...swms.permits.map((p, i) =>
          createElement(View, { key: i, style: s.bulletRow },
            createElement(Text, { style: [s.bulletMark, { color: C.amber }] }, '•'),
            createElement(Text, { style: s.rowText }, p),
          )
        ),
      ) : null,

      createElement(View, { style: s.section },
        createElement(Text, { style: s.sectionTitle }, 'Work Activities & Risk Controls'),
        ...swms.activities.map((act, i) =>
          createElement(Activity, { key: i, act, index: i + 1 })
        ),
      ),

      createElement(View, { style: s.section },
        createElement(Text, { style: s.sectionTitle }, 'Emergency Procedures'),
        createElement(View, { style: [s.hrcwBox, { backgroundColor: C.paper }] },
          ...swms.emergencyProcedures.map((step, i) =>
            createElement(View, { key: i, style: s.numberedRow },
              createElement(Text, { style: s.numText }, String(i + 1).padStart(2, '0')),
              createElement(Text, { style: s.rowText }, step),
            )
          ),
        ),
      ),

      createElement(View, { style: s.section },
        createElement(Text, { style: s.sectionTitle }, 'Relevant Legislation & Standards'),
        ...swms.legislation.map((item, i) =>
          createElement(View, { key: i, style: s.legRow },
            createElement(Text, { style: s.dashText }, '—'),
            createElement(Text, { style: s.rowText }, item),
          )
        ),
      ),

      createElement(View, { style: s.section, break: true },
        createElement(Text, { style: s.sectionTitle }, 'Worker Sign-off'),
        createElement(Text, { style: [s.rowText, { marginBottom: 8 }] },
          'All workers must read this SWMS and sign below before commencing work.'
        ),
        createElement(View, { style: s.signTable },
          createElement(View, { style: s.signHeaderRow },
            createElement(Text, { style: [s.signHeaderCell, { width: 24 }] }, '#'),
            createElement(Text, { style: [s.signHeaderCell, { flex: 1.5 }] }, 'Name'),
            createElement(Text, { style: [s.signHeaderCell, { flex: 1.5 }] }, 'Company / Role'),
            createElement(Text, { style: [s.signHeaderCell, { flex: 2 }] }, 'Signature'),
            createElement(Text, { style: [s.signHeaderCell, { flex: 1 }] }, 'Date'),
          ),
          ...[1,2,3,4,5,6,7,8].map(n =>
            createElement(View, { key: n, style: [s.signRow, { backgroundColor: n % 2 === 0 ? C.paper : C.white }] },
              createElement(View, { style: s.signCellNum },
                createElement(Text, { style: { fontSize: 7, color: C.steel } }, String(n)),
              ),
              createElement(View, { style: [s.signCell, { flex: 1.5 }] }, createElement(View, { style: s.signLine })),
              createElement(View, { style: [s.signCell, { flex: 1.5 }] }, createElement(View, { style: s.signLine })),
              createElement(View, { style: [s.signCell, { flex: 2 }] },   createElement(View, { style: s.signLine })),
              createElement(View, { style: [s.signCell, { flex: 1 }] },   createElement(View, { style: s.signLine })),
            )
          ),
        ),
      ),

      createElement(View, { style: s.footer, fixed: true },
        createElement(Text, { style: s.footerText }, `${documentNumber}  ·  ${swms.jobTitle}`),
        createElement(Text, {
          style: s.footerText,
          render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            `Page ${pageNumber} of ${totalPages}`,
        }),
      ),
    ),
  );

  return renderToBuffer(doc);
}
