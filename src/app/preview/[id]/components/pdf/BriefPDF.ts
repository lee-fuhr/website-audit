/**
 * Copywriter brief PDF generator.
 */

import { escapeHtml } from '@/lib/utils'
import { PreviewData, AnalysisResponse } from '../types'
import { getSeverityColor } from './helpers'

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
