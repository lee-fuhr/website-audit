'use client'

import { PreviewData } from '../types'

interface TrustChecklistProps {
  preview: PreviewData
}

export function TrustChecklist({ preview }: TrustChecklistProps) {
  const allPhrases = preview.topIssues
    .flatMap((issue) => issue.findings || [])
    .map((f) => f.phrase?.toLowerCase() || '')
    .join(' ')

  const hasCustomerCount = /\d+[\+]?\s*(customers?|clients?|users?|teams?|companies|businesses)/i.test(allPhrases)
  const hasYears = /(since|founded|established)\s*(19|20)\d{2}|\d+\+?\s*years/i.test(allPhrases)
  const hasTestimonials = /(testimonial|review|said|quot|")/i.test(allPhrases)
  const hasCaseStudy = /(case study|increased|improved|reduced|saved)\s*\d+/i.test(allPhrases)
  const hasCertifications = /(iso|soc|hipaa|certified|accredited|award)/i.test(allPhrases)
  const hasGuarantee = /(guarantee|warranty|money.?back|risk.?free)/i.test(allPhrases)
  const hasTeam = /(team|founder|ceo|leadership|about us)/i.test(allPhrases)
  const hasAddress =
    /\d+\s+[a-z]+\s+(st|street|ave|avenue|rd|road|blvd|way)|[a-z]+,\s*[a-z]{2}\s*\d{5}/i.test(allPhrases)

  const trustItems = [
    {
      check: 'Customer count',
      found: hasCustomerCount,
      tip: 'Add to hero section, above fold',
      suggestion: hasCustomerCount
        ? null
        : `"Trusted by [X]+ ${preview.topIssues[0]?.findings?.[0]?.rewrite?.includes('business') ? 'businesses' : 'customers'}" - use your actual count`,
    },
    {
      check: 'Years in business',
      found: hasYears,
      tip: 'Footer or About page, also consider hero',
      suggestion: hasYears
        ? null
        : '"Since [year]" or "[X]+ years of experience" - this builds credibility fast',
    },
    {
      check: 'Named testimonials',
      found: hasTestimonials,
      tip: 'Logo bar near hero, testimonials on key pages',
      suggestion: hasTestimonials
        ? null
        : 'Add 2-3 customer quotes with names, titles, and company logos',
    },
    {
      check: 'Case study with numbers',
      found: hasCaseStudy,
      tip: 'Link from homepage, include % improvements',
      suggestion: hasCaseStudy
        ? null
        : '"Helped [client] achieve [X]% improvement in [metric]" - pick your best result',
    },
    {
      check: 'Certifications or awards',
      found: hasCertifications,
      tip: 'Footer badges, dedicated trust section',
      suggestion: hasCertifications
        ? null
        : 'Add any industry certifications, compliance badges, or awards you hold',
    },
    {
      check: 'Guarantee statement',
      found: hasGuarantee,
      tip: 'Near pricing or CTA, reduces risk',
      suggestion: hasGuarantee
        ? null
        : '"[X]-day money-back guarantee" or "Satisfaction guaranteed" - reduces perceived risk',
    },
    {
      check: 'Team visibility',
      found: hasTeam,
      tip: 'About page, humanizes the brand',
      suggestion: hasTeam ? null : 'Add team photos or founder story - people buy from people',
    },
    {
      check: 'Physical presence',
      found: hasAddress,
      tip: 'Footer, builds trust for B2B',
      suggestion: hasAddress
        ? null
        : 'Add office address or "Headquartered in [city]" - signals legitimacy',
    },
  ]

  return (
    <div className="mb-12">
      <h3 className="text-subsection mb-4">Trust signal checklist</h3>
      <p className="text-body text-[var(--muted-foreground)] mb-4">
        Specific proof points to add to your site, based on what we found (and didn&apos;t find).
      </p>
      <div className="bg-white border-2 border-gray-200 rounded-lg divide-y divide-gray-200">
        {trustItems.map((item) => (
          <div
            key={item.check}
            className={`flex items-start gap-4 p-4 ${item.found ? 'bg-green-50' : ''}`}
          >
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                item.found ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {item.found ? '✓' : ''}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p
                  className={`font-medium ${
                    item.found ? 'text-green-700' : 'text-[var(--foreground)]'
                  }`}
                >
                  {item.check}
                </p>
                {item.found && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Found
                  </span>
                )}
                {!item.found && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                    Missing
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">{item.tip}</p>
              {item.suggestion && (
                <p className="text-sm mt-2 p-2 bg-blue-50 border-l-2 border-blue-400 text-blue-800">
                  <strong>Add:</strong> {item.suggestion}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
