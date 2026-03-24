/**
 * PDF generation handlers for the preview page.
 * All three functions build HTML strings then invoke html2pdf.js.
 */

import { escapeHtml } from '@/lib/utils'
import { PreviewData, AnalysisResponse } from './types'

// ---------- helpers shared across PDF generators ----------

const catNames: Record<string, string> = {
  firstImpression: 'First Impression',
  differentiation: 'Differentiation',
  customerClarity: 'Customer Clarity',
  storyStructure: 'Story Structure',
  trustSignals: 'Trust Signals',
  buttonClarity: 'CTA Clarity',
}

function getSeverityColor(sev: string): string {
  if (sev === 'critical') return '#c00'
  if (sev === 'major' || sev === 'warning') return '#b45309'
  return '#666'
}

function getScoreColor(score: number): string {
  if (score >= 7) return '#166534'
  if (score >= 4) return '#b45309'
  return '#c00'
}

// ---------- Full audit PDF ----------

export async function downloadFullAuditPDF(
  preview: PreviewData,
  data: AnalysisResponse,
  hostname: string,
  companyName: string,
  hasCompetitorData: boolean,
) {
  const html2pdf = (await import('html2pdf.js')).default

  const displayName =
    companyName && companyName !== hostname.split('.')[0] ? companyName : hostname
  const totalRewrites = preview.topIssues.reduce(
    (acc: number, issue: { findings?: unknown[] }) => acc + (issue.findings?.length || 0),
    0,
  )

  const categoryScoresHtml = preview.categoryScores
    ? Object.entries(preview.categoryScores)
        .map(
          ([key, val]) => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #ddd;">${catNames[key] || key}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold; color: ${getScoreColor(val as number)};">${val}/10</td>
          </tr>
        `,
        )
        .join('')
    : ''

  type IssueFinding = { phrase: string; rewrite: string; problem?: string; location?: string; pageUrl?: string }
  type Issue = { title: string; severity: string; description: string; findings?: IssueFinding[] }

  const issuesHtml = preview.topIssues
    .slice(0, 6)
    .map(
      (issue: Issue, i: number) => `
      <div style="margin-bottom: 24px; page-break-inside: avoid;">
        <h3 style="font-size: 14px; margin: 0 0 4px 0; color: #111;">
          ${i + 1}. ${escapeHtml(issue.title)}
          <span style="font-size: 11px; font-weight: normal; color: ${getSeverityColor(issue.severity)}; text-transform: uppercase; margin-left: 8px;">[${issue.severity}]</span>
        </h3>
        <p style="color: #555; font-size: 12px; margin: 0 0 12px 0;">${escapeHtml(issue.description)}</p>
        ${
          (issue.findings || []).length > 0
            ? (issue.findings || [])
                .map(
                  (f: IssueFinding) => `
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; table-layout: fixed;">
                <tr>
                  <td style="width: 80px; padding: 8px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold; color: #666; vertical-align: top;">Before</td>
                  <td style="padding: 8px; border: 1px solid #ddd; color: #666; word-wrap: break-word; overflow-wrap: break-word;">${escapeHtml(f.phrase)}</td>
                </tr>
                <tr>
                  <td style="width: 80px; padding: 8px; background: #f0f9f0; border: 1px solid #ddd; font-weight: bold; color: #166534; vertical-align: top;">After</td>
                  <td style="padding: 8px; border: 1px solid #ddd; color: #111; word-wrap: break-word; overflow-wrap: break-word;">${escapeHtml(f.rewrite)}</td>
                </tr>
                ${f.location ? `<tr><td colspan="2" style="padding: 4px 8px; border: 1px solid #ddd; font-size: 10px; color: #888; font-style: italic;">Found: ${escapeHtml(f.location)}${f.pageUrl ? ` (${escapeHtml(new URL(f.pageUrl).pathname)})` : ''}</td></tr>` : ''}
              </table>
            `,
                )
                .join('')
            : '<p style="color: #888; font-size: 11px; font-style: italic; margin: 0;">No specific rewrites for this issue - review the description above for guidance.</p>'
        }
      </div>
    `,
    )
    .join('')

  const copyIssues = preview.topIssues.slice(6)
  const copySectionHtml =
    copyIssues.length > 0 &&
    copyIssues.some((i: Issue) => (i.findings?.length || 0) > 0)
      ? `
        <div style="page-break-before: always;">
          <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 8px 0; padding-bottom: 8px; border-bottom: 2px solid #333;">Copy You Can Use Today</h2>
          <p style="font-size: 12px; color: #555; margin: 0 0 16px 0;">Quick wins beyond the critical issues.</p>
          ${copyIssues
            .map((issue: Issue) =>
              (issue.findings?.length || 0) > 0
                ? `
              <div style="margin-bottom: 20px; page-break-inside: avoid;">
                <h3 style="font-size: 13px; margin: 0 0 4px 0; color: #111;">
                  ${escapeHtml(issue.title)}
                  <span style="font-size: 10px; font-weight: normal; color: ${getSeverityColor(issue.severity)}; text-transform: uppercase; margin-left: 6px;">[${issue.severity}]</span>
                </h3>
                ${(issue.findings || [])
                  .map(
                    (f: IssueFinding) => `
                  <table style="width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 11px; table-layout: fixed;">
                    <tr>
                      <td style="width: 60px; padding: 6px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold; color: #666; vertical-align: top;">Before</td>
                      <td style="padding: 6px; border: 1px solid #ddd; color: #666; word-wrap: break-word;">${escapeHtml(f.phrase)}</td>
                    </tr>
                    <tr>
                      <td style="width: 60px; padding: 6px; background: #f0f9f0; border: 1px solid #ddd; font-weight: bold; color: #166534; vertical-align: top;">After</td>
                      <td style="padding: 6px; border: 1px solid #ddd; color: #111; word-wrap: break-word;">${escapeHtml(f.rewrite)}</td>
                    </tr>
                  </table>
                `,
                  )
                  .join('')}
              </div>
            `
                : '',
            )
            .join('')}
        </div>
      `
      : ''

  const allPhrases = preview.topIssues
    .flatMap((issue: Issue) => issue.findings || [])
    .map((f: IssueFinding) => f.phrase?.toLowerCase() || '')
    .join(' ')

  const trustSignals = [
    { label: 'Customer count', found: /\d+[\+]?\s*(customers?|clients?|users?|teams?|companies|businesses)/i.test(allPhrases), suggestion: '"Trusted by X+ customers"' },
    { label: 'Years in business', found: /(since|founded|established)\s*(19|20)\d{2}|\d+\+?\s*years/i.test(allPhrases), suggestion: '"Since 20XX" or "X+ years experience"' },
    { label: 'Testimonials', found: /(testimonial|review|said|quot|")/i.test(allPhrases), suggestion: 'Add customer quotes with names' },
    { label: 'Case studies', found: /(case study|increased|improved|reduced|saved)\s*\d+/i.test(allPhrases), suggestion: '"Helped X achieve Y% improvement"' },
    { label: 'Certifications', found: /(iso|soc|hipaa|certified|accredited|award)/i.test(allPhrases), suggestion: 'List certifications/awards visibly' },
    { label: 'Guarantee', found: /(guarantee|warranty|money.?back|risk.?free)/i.test(allPhrases), suggestion: 'Add satisfaction guarantee' },
    { label: 'Team visibility', found: /(team|founder|ceo|leadership|about us)/i.test(allPhrases), suggestion: 'Show real people with names' },
    { label: 'Physical address', found: /\d+\s+[a-z]+\s+(st|street|ave|avenue|rd|road|blvd|way)|[a-z]+,\s*[a-z]{2}\s*\d{5}/i.test(allPhrases), suggestion: 'Display physical location' },
  ]

  const trustChecklistHtml = `
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #333;">Trust Signal Checklist</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        ${trustSignals
          .map(
            (s) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; width: 24px;">${s.found ? '✓' : '○'}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: ${s.found ? '#166534' : '#666'};">${s.label}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${s.found ? '#166534' : '#888'}; font-style: italic;">${s.found ? 'Found on site' : s.suggestion}</td>
          </tr>
        `,
          )
          .join('')}
      </table>
    </div>
  `

  type CompScore = { url: string; score: number; strengths?: string[]; weaknesses?: string[]; categoryScores?: Record<string, number> }

  const competitorHtml =
    hasCompetitorData && data?.competitorComparison?.detailedScores?.length
      ? `
        <div style="page-break-before: always;">
          <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #333;">Competitive Analysis</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Site</th>
                <th style="text-align: center; padding: 8px; border: 1px solid #ddd;">Score</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Comparison</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background: #f0f7ff;">
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${escapeHtml(hostname)} (You)</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${preview.commodityScore}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">—</td>
              </tr>
              ${data.competitorComparison!.detailedScores!.map(
                (c: CompScore) => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(c.url.replace(/^https?:\/\//, '').split('/')[0])}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${c.score}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; color: ${c.score > preview.commodityScore ? '#c00' : '#166534'};">
                    ${c.score > preview.commodityScore ? `Behind by ${c.score - preview.commodityScore}` : c.score < preview.commodityScore ? `Ahead by ${preview.commodityScore - c.score}` : 'Tied'}
                  </td>
                </tr>
              `,
              ).join('')}
            </tbody>
          </table>
        </div>
      `
      : ''

  const allFindings = preview.topIssues.flatMap(
    (issue: Issue) => issue.findings || [],
  )
  const swipeFileSummaryHtml =
    allFindings.length > 0
      ? `
        <div style="page-break-before: always;">
          <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 8px 0; padding-bottom: 8px; border-bottom: 2px solid #333;">Swipe File Summary</h2>
          <p style="font-size: 12px; color: #555; margin: 0 0 16px 0;">${allFindings.length} rewrites ready to use.</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="text-align: left; padding: 6px; border: 1px solid #ddd; width: 45%;">Before</th>
                <th style="text-align: left; padding: 6px; border: 1px solid #ddd; width: 45%;">After</th>
              </tr>
            </thead>
            <tbody>
              ${allFindings
                .slice(0, 20)
                .map(
                  (f: IssueFinding) => `
                <tr>
                  <td style="padding: 6px; border: 1px solid #ddd; color: #666; vertical-align: top; word-wrap: break-word;">${escapeHtml(f.phrase.substring(0, 100))}${f.phrase.length > 100 ? '...' : ''}</td>
                  <td style="padding: 6px; border: 1px solid #ddd; color: #111; vertical-align: top; word-wrap: break-word;">${escapeHtml(f.rewrite.substring(0, 100))}${f.rewrite.length > 100 ? '...' : ''}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
          ${allFindings.length > 20 ? `<p style="font-size: 10px; color: #888; margin: 8px 0 0 0; font-style: italic;">Showing first 20 of ${allFindings.length} rewrites.</p>` : ''}
        </div>
      `
      : ''

  const pagesAnalyzedHtml = preview.siteSnapshot?.pagesFound?.length
    ? `
      <div style="page-break-before: always;">
        <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #333;">Pages Analyzed</h2>
        <p style="font-size: 12px; color: #555; margin: 0 0 12px 0;">We scanned ${preview.pagesScanned} pages:</p>
        <div style="columns: 2; column-gap: 24px; font-size: 11px;">
          ${preview.siteSnapshot.pagesFound
            .map(
              (p: string) => `
            <p style="margin: 0 0 4px 0; padding: 4px 0; border-bottom: 1px solid #eee; break-inside: avoid; color: #333;">${escapeHtml(p)}</p>
          `,
            )
            .join('')}
        </div>
      </div>
    `
    : ''

  const pdfHtml = document.createElement('div')
  pdfHtml.style.fontFamily = 'Georgia, Times, serif'
  pdfHtml.style.maxWidth = '700px'
  pdfHtml.style.margin = '0 auto'
  pdfHtml.style.padding = '40px'
  pdfHtml.style.lineHeight = '1.6'
  pdfHtml.style.color = '#111'
  pdfHtml.innerHTML = `
    <div style="text-align: center; padding-bottom: 24px; border-bottom: 2px solid #333; margin-bottom: 24px;">
      <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Website Messaging Audit</h1>
      <p style="font-size: 16px; color: #555; margin: 0 0 16px 0;">${escapeHtml(displayName)}</p>
      <p style="font-size: 36px; font-weight: bold; margin: 0; color: #2563eb;">${preview.commodityScore ?? 0}<span style="font-size: 18px; color: #666;">/100</span></p>
      <p style="font-size: 12px; color: #888; margin: 8px 0 0 0;">Messaging Differentiation Score</p>
    </div>
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #333;">Summary</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr><td style="padding: 6px 0;">Pages scanned:</td><td style="padding: 6px 0; text-align: right; font-weight: bold;">${preview.pagesScanned}</td></tr>
        <tr><td style="padding: 6px 0;">Issues found:</td><td style="padding: 6px 0; text-align: right; font-weight: bold; color: #c00;">${preview.topIssues.length}</td></tr>
        <tr><td style="padding: 6px 0;">Rewrites ready:</td><td style="padding: 6px 0; text-align: right; font-weight: bold; color: #166534;">${totalRewrites}</td></tr>
      </table>
    </div>
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #333;">Score Breakdown</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">${categoryScoresHtml}</table>
    </div>
    ${preview.voiceSummary ? `
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #333;">Brand Voice Analysis</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr><td style="padding: 8px 0; width: 140px; vertical-align: top; color: #666;">Current Tone:</td><td style="padding: 8px 0;">${escapeHtml(preview.voiceSummary.currentTone || '')}</td></tr>
        <tr><td style="padding: 8px 0; width: 140px; vertical-align: top; color: #666;">Authentic Voice:</td><td style="padding: 8px 0;">${escapeHtml(preview.voiceSummary.authenticVoice || '')}</td></tr>
      </table>
    </div>
    ` : ''}
    <div style="page-break-before: always;">
      <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #333;">Priority Issues & Rewrites</h2>
      ${issuesHtml}
    </div>
    ${copySectionHtml}
    <div style="page-break-before: always;">${trustChecklistHtml}</div>
    ${competitorHtml}
    ${swipeFileSummaryHtml}
    ${pagesAnalyzedHtml}
    <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; text-align: center;">
      <p style="font-size: 11px; color: #888; margin: 0;">Website Messaging Audit by Lee Fuhr | leefuhr.com</p>
      <p style="font-size: 10px; color: #aaa; margin: 4px 0 0 0;">Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  `

  const opt = {
    margin: [20, 20, 20, 20] as [number, number, number, number],
    filename: `website-audit-${hostname}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
    pagebreak: { mode: ['css'] as ('css')[], before: '[style*="page-break-before"]' },
  }

  await html2pdf().set(opt).from(pdfHtml).save()
}

// ---------- Brief PDF ----------

export async function downloadBriefPDF(
  preview: PreviewData,
  data: AnalysisResponse,
  hostname: string,
  hasCompetitorData: boolean,
) {
  const html2pdf = (await import('html2pdf.js')).default

  const briefDisplayName = hostname.includes('.') ? hostname : (preview.siteSnapshot?.title || hostname)
  const sampleRewrites = preview.topIssues
    .flatMap((issue: { findings?: { phrase: string; rewrite: string }[] }) => issue.findings?.slice(0, 1) || [])
    .slice(0, 3)
  const competitorContext =
    hasCompetitorData && data?.competitorComparison?.detailedScores?.length
      ? `Your score: ${data.competitorComparison.yourScore}/100 | Competitors avg: ${data.competitorComparison.averageScore}/100`
      : ''

  const briefHtml = document.createElement('div')
  briefHtml.style.fontFamily = 'system-ui, -apple-system, sans-serif'
  briefHtml.style.padding = '24px'
  briefHtml.style.maxWidth = '800px'
  briefHtml.style.margin = '0 auto'
  briefHtml.style.fontSize = '12px'
  briefHtml.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;">
      <div>
        <h1 style="font-size: 20px; font-weight: bold; color: #1e293b; margin: 0;">Copywriter Brief</h1>
        <p style="font-size: 14px; color: #64748b; margin: 4px 0 0 0;">${briefDisplayName}</p>
      </div>
      <div style="text-align: right;">
        <p style="font-size: 28px; font-weight: bold; color: #2563eb; margin: 0;">${preview.commodityScore}<span style="font-size: 14px; color: #64748b;">/100</span></p>
        <p style="font-size: 11px; color: #64748b; margin: 0;">Differentiation Score</p>
      </div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px;">
      <div style="background: #f8fafc; padding: 10px; border-radius: 4px; text-align: center;">
        <p style="font-size: 18px; font-weight: bold; color: #1e293b; margin: 0;">${preview.pagesScanned}</p>
        <p style="font-size: 10px; color: #64748b; margin: 0;">Pages</p>
      </div>
      <div style="background: #f8fafc; padding: 10px; border-radius: 4px; text-align: center;">
        <p style="font-size: 18px; font-weight: bold; color: #1e293b; margin: 0;">${preview.topIssues.length}</p>
        <p style="font-size: 10px; color: #64748b; margin: 0;">Issues</p>
      </div>
      <div style="background: #f8fafc; padding: 10px; border-radius: 4px; text-align: center;">
        <p style="font-size: 18px; font-weight: bold; color: #1e293b; margin: 0;">${preview.topIssues.reduce((acc: number, issue: { findings?: unknown[] }) => acc + (issue.findings?.length || 0), 0)}</p>
        <p style="font-size: 10px; color: #64748b; margin: 0;">Rewrites</p>
      </div>
      <div style="background: #fef2f2; padding: 10px; border-radius: 4px; text-align: center;">
        <p style="font-size: 18px; font-weight: bold; color: #dc2626; margin: 0;">${preview.topIssues.filter((i: { severity: string }) => i.severity === 'critical').length}</p>
        <p style="font-size: 10px; color: #dc2626; margin: 0;">Critical</p>
      </div>
    </div>
    ${preview.voiceSummary ? `
    <div style="background: #f0f9ff; padding: 12px; border-radius: 4px; margin-bottom: 16px; border-left: 3px solid #2563eb;">
      <h2 style="font-size: 12px; font-weight: bold; color: #1e293b; margin: 0 0 6px 0;">Voice Snapshot</h2>
      <p style="margin: 0 0 4px 0; font-size: 11px;"><strong>Current:</strong> ${escapeHtml(preview.voiceSummary.currentTone || '')}</p>
      <p style="margin: 0; font-size: 11px;"><strong>Authentic:</strong> ${escapeHtml(preview.voiceSummary.authenticVoice || '')}</p>
    </div>
    ` : ''}
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div>
        <h2 style="font-size: 13px; font-weight: bold; color: #1e293b; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">Top 5 Priorities</h2>
        ${preview.topIssues
          .slice(0, 5)
          .map(
            (issue: { title: string; severity: string }, i: number) => `
          <p style="margin: 0 0 5px 0; font-size: 11px;"><strong style="color: #2563eb;">${i + 1}.</strong> ${escapeHtml(issue.title)} <span style="color: ${issue.severity === 'critical' ? '#dc2626' : '#64748b'};">(${escapeHtml(issue.severity)})</span></p>
        `,
          )
          .join('')}
        <h2 style="font-size: 13px; font-weight: bold; color: #1e293b; margin: 16px 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">Messaging Rules</h2>
        <p style="margin: 0 0 4px 0; font-size: 11px;">1. Lead with proof points (numbers, years)</p>
        <p style="margin: 0 0 4px 0; font-size: 11px;">2. Replace generic claims with outcomes</p>
        <p style="margin: 0 0 4px 0; font-size: 11px;">3. Name the ideal customer explicitly</p>
        <p style="margin: 0 0 4px 0; font-size: 11px;">4. Use active voice and direct CTAs</p>
        ${competitorContext ? `
        <div style="margin-top: 12px; padding: 8px; background: #fef3c7; border-radius: 4px;">
          <p style="font-size: 10px; font-weight: bold; color: #92400e; margin: 0;">Competitive Context</p>
          <p style="font-size: 11px; color: #78350f; margin: 4px 0 0 0;">${competitorContext}</p>
        </div>
        ` : ''}
      </div>
      <div>
        <h2 style="font-size: 13px; font-weight: bold; color: #1e293b; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">Sample Rewrites</h2>
        ${sampleRewrites
          .map(
            (f: { phrase: string; rewrite: string }) => `
          <div style="margin-bottom: 10px; padding: 8px; background: #f8fafc; border-radius: 4px; border-left: 2px solid #2563eb;">
            <p style="font-size: 10px; color: #ef4444; margin: 0; font-weight: 600;">BEFORE</p>
            <p style="font-size: 11px; color: #64748b; margin: 2px 0 6px 0; text-decoration: line-through;">${escapeHtml(f.phrase.slice(0, 70))}${f.phrase.length > 70 ? '...' : ''}</p>
            <p style="font-size: 10px; color: #22c55e; margin: 0; font-weight: 600;">AFTER</p>
            <p style="font-size: 11px; color: #1e293b; margin: 2px 0 0 0; font-weight: 500;">${escapeHtml(f.rewrite.slice(0, 70))}${f.rewrite.length > 70 ? '...' : ''}</p>
          </div>
        `,
          )
          .join('')}
      </div>
    </div>
    <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 10px; text-align: center;">
      Website Messaging Audit | leefuhr.com | ${new Date().toLocaleDateString()}
    </div>
  `

  const opt = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename: `copywriter-brief-${hostname}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
  }

  await html2pdf().set(opt).from(briefHtml).save()
}

// ---------- Swipe file PDF ----------

export async function downloadSwipePDF(
  preview: PreviewData,
  hostname: string,
) {
  const html2pdf = (await import('html2pdf.js')).default

  type IssueFinding = { phrase: string; rewrite: string; problem?: string; location?: string }
  const allFindings = preview.topIssues.flatMap(
    (issue: { findings?: IssueFinding[] }) => issue.findings || [],
  )

  const swipeHtml = document.createElement('div')
  swipeHtml.style.fontFamily = 'system-ui, -apple-system, sans-serif'
  swipeHtml.style.padding = '24px'
  swipeHtml.style.maxWidth = '800px'
  swipeHtml.style.margin = '0 auto'
  swipeHtml.style.fontSize = '11px'
  swipeHtml.innerHTML = `
    <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;">
      <h1 style="font-size: 18px; font-weight: bold; color: #1e293b; margin: 0;">Messaging Swipe File</h1>
      <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">${hostname} • ${allFindings.length} rewrites</p>
    </div>
    ${allFindings
      .map(
        (f: IssueFinding, i: number) => `
      <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
        <p style="font-size: 9px; color: #94a3b8; margin: 0 0 4px 0;">${i + 1}/${allFindings.length}</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <tr>
            <td style="width: 60px; padding: 4px 8px; background: #fef2f2; color: #dc2626; font-weight: bold; vertical-align: top;">BEFORE</td>
            <td style="padding: 4px 8px; background: #fef2f2; color: #374151;">${escapeHtml(f.phrase)}</td>
          </tr>
          <tr>
            <td style="width: 60px; padding: 4px 8px; background: #f0fdf4; color: #166534; font-weight: bold; vertical-align: top;">AFTER</td>
            <td style="padding: 4px 8px; background: #f0fdf4; color: #1e293b; font-weight: 500;">${escapeHtml(f.rewrite)}</td>
          </tr>
          ${f.problem ? `<tr><td colspan="2" style="padding: 4px 8px; color: #64748b; font-style: italic; font-size: 10px;"><strong>Why:</strong> ${escapeHtml(f.problem)}</td></tr>` : ''}
          ${f.location ? `<tr><td colspan="2" style="padding: 4px 8px; color: #94a3b8; font-size: 9px;">Found: ${escapeHtml(f.location)}</td></tr>` : ''}
        </table>
      </div>
    `,
      )
      .join('')}
    <div style="margin-top: 24px; text-align: center; color: #94a3b8; font-size: 10px;">
      Website Messaging Audit by Lee Fuhr | leefuhr.com
    </div>
  `

  const opt = {
    margin: [15, 15, 15, 15] as [number, number, number, number],
    filename: `swipe-file-${hostname}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
  }

  await html2pdf().set(opt).from(swipeHtml).save()
}
