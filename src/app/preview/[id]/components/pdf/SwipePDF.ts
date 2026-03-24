/**
 * Swipe file PDF generator.
 */

import { escapeHtml } from '@/lib/utils'
import { PreviewData } from '../types'

type IssueFinding = { phrase: string; rewrite: string; problem?: string; location?: string }

export async function downloadSwipePDF(
  preview: PreviewData,
  hostname: string,
) {
  const html2pdf = (await import('html2pdf.js')).default

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
      <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">${hostname} \u2022 ${allFindings.length} rewrites</p>
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
