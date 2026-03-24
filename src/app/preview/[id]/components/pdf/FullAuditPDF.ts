/**
 * Full audit PDF generator.
 */

import { escapeHtml } from '@/lib/utils'
import { PreviewData, AnalysisResponse } from '../types'
import { catNames, getSeverityColor, getScoreColor } from './helpers'

type IssueFinding = { phrase: string; rewrite: string; problem?: string; location?: string; pageUrl?: string }
type Issue = { title: string; severity: string; description: string; findings?: IssueFinding[] }

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
            <td style="padding: 8px; border-bottom: 1px solid #eee; width: 24px;">${s.found ? '\u2713' : '\u25CB'}</td>
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
