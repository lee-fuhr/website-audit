'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ViewNavBar } from '@/components/ViewNavBar'
import { AuditFooter } from '@/components/AuditFooter'

// Sample audit data - in production this would come from a data source
const auditData = {
  company: "Acme Precision Manufacturing",
  url: "acmeprecision.com",
  date: "December 29, 2024",
  slug: "acme-k7m2",

  scores: {
    firstImpression: {
      score: 7,
      label: "First impression",
      question: "Can visitors understand what you do in 5 seconds?",
      factors: [
        { factor: "Clear industry identification", score: 3, max: 3, note: "Obvious you're a manufacturer" },
        { factor: "Target audience specificity", score: 1, max: 3, note: "'Industrial clients' is too vague" },
        { factor: "Visible differentiator", score: 1, max: 2, note: "No clear differentiator above fold" },
        { factor: "Professional appearance", score: 2, max: 2, note: "Clean, credible design" },
      ],
      evidence: [
        "Headline 'Precision Manufacturing Solutions' is generic but clear",
        "No specific audience called out at the top of your homepage",
        "ISO badge is present but small and below fold",
        "Professional photography throughout",
      ],
      howToImprove: [
        "Add your target customer to the headline: 'Precision parts for medical device manufacturers'",
        "Move ISO badge and one key stat to the top of your homepage (before visitors need to scroll)",
        "Add a subheadline that answers 'why us?' in one line",
      ],
      suggestedCopy: "Replace your headline with any of the 10 options in the Action Plan above.",
    },
    differentiation: {
      score: 4,
      label: "Differentiation",
      question: "Do you stand out from competitors?",
      factors: [
        { factor: "What makes you different", score: 0, max: 3, note: "Using commodity language: 'quality, service, value'" },
        { factor: "Proof of uniqueness", score: 2, max: 3, note: "12-year average tenure exists but buried on About page" },
        { factor: "How you compare", score: 1, max: 2, note: "No acknowledgment of competitive landscape" },
        { factor: "Memorable hook", score: 1, max: 2, note: "Nothing sticky that visitors will remember" },
      ],
      evidence: [
        "Homepage uses: 'quality,' 'service,' 'trusted partner'—same as every competitor",
        "About page: 'Our average machinist has been with us 12 years'—THIS is a differentiator but hidden",
        "No comparison to alternatives or acknowledgment of other options",
        "No single memorable phrase or tagline",
      ],
      howToImprove: [
        "Surface the 12-year tenure stat to homepage—this proves stability competitors can't match",
        "Remove or replace all instances of 'quality' and 'service' with specific claims",
        "Create a 'Why Acme' section that answers: 'How the hell do they do that?'",
      ],
      suggestedCopy: "Try: '47 machinists. Average tenure: 12 years. When you need parts right the first time, that experience matters.'",
    },
    customerClarity: {
      score: 5,
      label: "Ideal customer clarity",
      question: "Is your ideal customer obvious?",
      factors: [
        { factor: "Named target segment", score: 1, max: 3, note: "'Industrial clients' names nobody" },
        { factor: "Problem understanding", score: 2, max: 3, note: "Generic problem framing" },
        { factor: "Industry-specific language", score: 1, max: 2, note: "Missing regulatory/compliance speak" },
        { factor: "Self-selection enabled", score: 1, max: 2, note: "Can't tell if you're right for them" },
      ],
      evidence: [
        "Homepage: 'aerospace, automotive, medical, and more'—this is everyone",
        "85% of testimonials are from medical device companies but homepage doesn't mention them",
        "No FDA, ISO 13485, or biocompatibility language on homepage despite serving medical",
        "A prospect can't quickly determine if they're your type of customer",
      ],
      howToImprove: [
        "Define your ideal customer: Medical device companies, $5M-50M, need precision + regulatory compliance",
        "Lead with medical device focus on homepage (don't hide your strength)",
        "Add regulatory language: 'FDA-registered facility,' 'ISO 13485 certified,' 'ITAR compliant'",
      ],
      suggestedCopy: "Try: 'Precision machining for FDA-regulated medical devices. 85% of our work is for device manufacturers who need tight tolerances and documented compliance.'",
    },
    storyStructure: {
      score: 3,
      label: "Story structure",
      question: "Do you have a compelling narrative?",
      factors: [
        { factor: "Problem acknowledgment", score: 0, max: 3, note: "No customer pain point addressed" },
        { factor: "Stakes established", score: 1, max: 2, note: "No sense of what's at risk without you" },
        { factor: "Journey narrative", score: 1, max: 3, note: "Feature list, not a story" },
        { factor: "Transformation clear", score: 1, max: 2, note: "Can't see before/after of working with you" },
      ],
      evidence: [
        "Opens with capabilities, not problems: 'CNC Machining, Wire EDM, Swiss Screw...'",
        "No mention of failed parts, missed deadlines, compliance headaches",
        "About page is company history, not customer transformation",
        "Testimonials exist but don't tell a transformation story",
      ],
      howToImprove: [
        "Open with the problem: 'Tired of parts that fail first inspection?'",
        "Add a 'Problems we solve' section before services",
        "Rewrite case studies as transformation stories: situation → struggle → solution → success",
      ],
      suggestedCopy: "Problem-first opener: 'You've been burned by machine shops that missed spec, blew deadlines, or couldn't handle your documentation requirements. We built our shop to be the opposite.'",
    },
    trustSignals: {
      score: 6,
      label: "Proof & credibility",
      question: "Can visitors verify your claims?",
      factors: [
        { factor: "Third-party validation", score: 2, max: 3, note: "ISO badge present, but placement weak" },
        { factor: "Customer proof", score: 2, max: 3, note: "Logos and testimonials exist but underutilized" },
        { factor: "Specific metrics", score: 0, max: 2, note: "No quantifiable results shared" },
        { factor: "Visual proof", score: 2, max: 2, note: "Facility photos, team photos present" },
      ],
      evidence: [
        "ISO 9001 and ISO 13485 certifications—but both are footer only",
        "Client logos in footer, testimonials on About page only",
        "No metrics: defect rates, on-time %, parts produced, years in business",
        "Good facility and team photography throughout",
      ],
      howToImprove: [
        "Create a credibility strip on homepage: cert badges + client logos + one key stat",
        "Move one compelling testimonial to the top of your homepage",
        "Add a 'By the numbers' section: '847,000 parts shipped last year. 12 rejected.'",
      ],
      suggestedCopy: "Credibility strip: 'ISO 13485 certified · 99.7% on-time delivery · Trusted by Medtronic, Boston Scientific, and 47 other device manufacturers'",
    },
    buttonClarity: {
      score: 5,
      label: "Button clarity",
      question: "Is the next step obvious and compelling?",
      factors: [
        { factor: "Specific action", score: 1, max: 3, note: "'Contact Us' is vague" },
        { factor: "Expectation set", score: 1, max: 3, note: "No idea what happens when they click" },
        { factor: "Multiple commitment levels", score: 1, max: 2, note: "Only one option: high-commitment contact" },
        { factor: "Strategic placement", score: 2, max: 2, note: "Buttons present on all pages" },
      ],
      evidence: [
        "Every page: 'Contact Us' button—no specificity",
        "No mention of response time, quote process, or what happens next",
        "No lower-commitment options (download, video, sample request)",
        "Buttons are visible and well-placed throughout",
      ],
      howToImprove: [
        "Primary button: 'Get a Quote in 24 Hours'—sets specific expectation",
        "Secondary button: 'See Our Work' or 'Request Sample Parts'",
        "Add a low-commitment offer: capabilities PDF, facility tour video",
      ],
      suggestedCopy: "Primary: 'Get a Quote in 24 Hours →' / Secondary: 'See how we've helped companies like yours →'",
    },
  },

  suggestedHeadlines: [
    {
      headline: "Precision machining for medical devices that can't fail",
      rationale: "Leads with outcome (can't fail) + specific audience (medical devices)",
    },
    {
      headline: "When your parts need to pass inspection the first time",
      rationale: "Opens with the problem, implies you solve it",
    },
    {
      headline: "Medical-grade precision. 0.02% defect rate.",
      rationale: "Specific audience + proof in one line",
    },
    {
      headline: "The machine shop that becomes part of your team",
      rationale: "Differentiates on partnership/relationship, not just capability",
    },
    {
      headline: "47 machinists. 12-year average tenure. Precision that compounds.",
      rationale: "Uses your hidden differentiator (tenure) as the lead",
    },
    {
      headline: "Precision parts for engineers who are tired of quality surprises",
      rationale: "Names the frustration, positions you as the solution",
    },
    {
      headline: "We make the parts that keep devices inside patients working",
      rationale: "Stakes-based, memorable, specific to medical",
    },
    {
      headline: "ISO 13485 certified. 99.7% on-time. Zero excuses.",
      rationale: "Proof-forward, implies accountability",
    },
    {
      headline: "Precision manufacturing for companies that can't afford a redo",
      rationale: "Stakes-forward, speaks to their real concern",
    },
    {
      headline: "Ask your competitors who machines their hardest parts",
      rationale: "Bold confidence, invites verification, memorable",
    },
  ],

  actions: [
    {
      priority: 1,
      title: "Rewrite your homepage headline with a specific outcome",
      description: "Replace 'Precision Manufacturing Solutions' with something only you can say. Lead with the result your customers get, not your capability.",
      effort: "easy" as const,
      featured: true,
      expandType: "headlines" as const,
    },
    {
      priority: 2,
      title: "Add proof at the top of your homepage",
      description: "Move your ISO certification badge and one client testimonial to the top of your homepage (before visitors scroll). They need to trust you before they'll read further.",
      effort: "easy" as const,
      expandType: "trustbar" as const,
    },
    {
      priority: 3,
      title: "Define your ideal customer explicitly",
      description: "'Industrial clients' is too broad. Name the specific type of company, size, and situation where you're the obvious choice.",
      effort: "medium" as const,
      expandType: "customer" as const,
    },
    {
      priority: 4,
      title: "Create a 'Why us' section with real differentiators",
      description: "Not 'quality' or 'service' - what would make your competitors say 'how the hell do they do that?'",
      effort: "medium" as const,
      expandType: "whyus" as const,
    },
    {
      priority: 5,
      title: "Develop 2 case studies with specific results",
      description: "Include the problem, your approach, and measurable outcomes. 'Reduced defect rate from 2.3% to 0.1%' beats 'delivered quality parts.'",
      effort: "medium" as const,
      expandType: "casestudy" as const,
    },
    {
      priority: 6,
      title: "Rewrite your buttons with specific next steps",
      description: "Change 'Contact Us' to 'Get a quote in 24 hours' or 'Request sample parts.' Tell them exactly what happens when they click.",
      effort: "easy" as const,
      expandType: "buttons" as const,
    },
    {
      priority: 7,
      title: "Add industry-specific landing pages",
      description: "Create dedicated pages for aerospace, medical, and automotive with tailored messaging for each vertical.",
      effort: "hard" as const,
    },
    {
      priority: 8,
      title: "Surface your best project photos on homepage",
      description: "Your project pages have specific machinery shots. Move 3-4 of the most impressive to your homepage hero or a 'Recent work' section.",
      effort: "easy" as const,
    },
    {
      priority: 9,
      title: "Add a 'How we work' process section",
      description: "Walk prospects through your process from quote to delivery. Reduces anxiety about what happens after they click 'Contact.'",
      effort: "medium" as const,
    },
    {
      priority: 10,
      title: "Create a pricing guidance page",
      description: "You don't need to list prices. Just explain how pricing works, what affects cost, and what to expect. This filters tire-kickers and builds trust.",
      effort: "medium" as const,
    },
  ],

  // Ready-to-use credibility strip copy
  trustBarCopy: {
    intro: "Here's a credibility strip structure (a horizontal bar of proof points). Fill in the brackets with your real data:",
    html: `<div class="trust-bar">
  <span>[Your primary certification, e.g., ISO 13485]</span>
  <span>·</span>
  <span>[Your strongest stat, e.g., XX% on-time delivery]</span>
  <span>·</span>
  <span>[Social proof, e.g., Trusted by XX companies in your industry]</span>
</div>`,
    testimonial: {
      quote: "[Pick your strongest customer quote—one that mentions a specific result or problem you solved. If you don't have one, ask your best customer for a 2-sentence testimonial.]",
      attribution: "— [Title], [Company name]",
    },
  },

  // Ideal customer definition
  customerDefinition: {
    intro: "Based on your testimonials and client list, here's a draft ideal customer profile. Refine each field to match your reality:",
    definition: {
      companyType: "[Based on your testimonials: most seem to be medical device manufacturers—is that accurate? What type specifically?]",
      size: "[What's the typical revenue range and employee count of your best customers?]",
      situation: "[What problem or situation triggers them to look for you? What pain brought your best customers to you?]",
      whyYou: "[Why do they choose YOU over competitors? What do they value most?]",
    },
    homepageCopy: "[Once you fill in the above, I can help you write homepage copy that speaks directly to this customer. For now, here's a template:]\n\nWe [what you do] for [your ideal customer type] who [their situation/pain]. If you're [qualifying criteria], we should talk.",
  },

  // Why us differentiators
  whyUsCopy: {
    intro: "We found this on your About page: 'Our average machinist has been with us 12 years.' That's a real differentiator—most shops have high turnover. Here's how to turn hidden proof points like this into a 'Why Us' section:",
    differentiators: [
      {
        headline: "[X] machinists. [X]-year average tenure.",
        subtext: "[Fill in your real numbers. Then explain why it matters to customers.]",
        note: "We found the tenure stat buried on your About page. Move it to homepage.",
      },
      {
        headline: "[Your response time or accessibility claim]",
        subtext: "[How do you handle urgent requests? Name a real person if possible.]",
        note: "Template: 'When your prototype needs to ship Friday, call [Name] directly.'",
      },
      {
        headline: "[Your quality metric]",
        subtext: "[Defect rate, rejection rate, first-pass yield—whatever you track]",
        note: "Template: 'Last year: [X] parts shipped. [X] rejected. That's [X]% defect rate.'",
      },
      {
        headline: "[Your industry expertise]",
        subtext: "[What % of your work is in your core industry? What do you know that generalists don't?]",
        note: "Template: '[X]% of our work is for [industry]. We know [specific insider knowledge].'",
      },
    ],
  },

  // Case study template
  caseStudyTemplate: {
    intro: "Here's a case study template. Fill in the bracketed sections with actual data from one of your medical device customers:",
    template: {
      title: "How [Client Name] reduced defects by [X]% with precision machining",
      challenge: "[Client Name] was struggling with [specific problem: parts failing inspection / supplier missing deadlines / compliance documentation gaps]. Their previous vendor [specific failure]. With [stakes: FDA audit coming / product launch at risk / patient safety concerns], they needed a partner who could [specific need].",
      approach: "We started by [specific first step]. Our team [key differentiating action]. Within [timeframe], we [milestone achieved].",
      results: [
        "[X]% reduction in defect rate (from [old] to [new])",
        "[X] parts delivered over [timeframe]",
        "[X]% on-time delivery rate",
        "[Specific outcome: passed FDA audit / hit launch date / etc.]",
      ],
      quote: "\"[Client quote about specific result or experience]\" — [Name], [Title], [Company]",
    },
  },

  // Button alternatives
  buttonAlternatives: {
    intro: "Replace your 'Contact Us' buttons with these specific, action-oriented alternatives:",
    primary: [
      { text: "Get a quote in 24 hours →", rationale: "Sets clear expectation, removes uncertainty" },
      { text: "Request sample parts →", rationale: "Low-commitment, lets them evaluate your work" },
      { text: "See if we're a fit →", rationale: "Conversational, acknowledges they're evaluating options" },
    ],
    secondary: [
      { text: "See how we've helped companies like yours →", rationale: "Leads to case studies, builds trust first" },
      { text: "Download our capabilities overview →", rationale: "Low-commitment, captures email for follow-up" },
      { text: "Take a virtual facility tour →", rationale: "Shows transparency, builds trust" },
    ],
  },

  beforeAfter: [
    {
      source: "Homepage headline",
      before: "Precision Manufacturing Solutions",
      after: "Medical-grade precision for device manufacturers who can't afford defects",
      rationale: "Leads with outcome + specific audience. Only you can say this if you specialize in medical device manufacturing.",
    },
    {
      source: "Homepage subheadline",
      before: "Delivering quality parts on time, every time",
      after: "ISO 13485 certified · 99.7% on-time delivery · Tolerance to ±0.0001\"",
      rationale: "Replaces generic claims with specific, verifiable proof points.",
    },
    {
      source: "Primary button",
      before: "Contact Us",
      after: "Get a quote in 24 hours →",
      rationale: "Sets clear expectation of what happens next and removes uncertainty.",
    },
    {
      source: "About page opener",
      before: "Acme Precision Manufacturing has been a trusted partner to industrial clients for over 25 years.",
      after: "We've machined 2.3 million parts for medical device companies. Our defect rate: 0.02%.",
      rationale: "Opens with proof, not claims. The numbers do the talking.",
    },
    {
      source: "Services page heading",
      before: "Our Services",
      after: "Parts that pass first inspection",
      rationale: "Shifts from feature-first to outcome-first messaging.",
    },
    {
      source: "CNC Machining description",
      before: "We offer state-of-the-art CNC machining services with the latest equipment.",
      after: "CNC machining to ±0.0001\" tolerance. 43 of our customers have reordered 10+ times.",
      rationale: "Replaces vague 'state-of-the-art' with specific capability and social proof.",
    },
    {
      source: "Quality statement",
      before: "We are committed to delivering the highest quality products.",
      after: "Last year: 847,000 parts shipped. 12 rejected. That's a 0.001% defect rate.",
      rationale: "Proves quality instead of claiming it.",
    },
    {
      source: "Company differentiator",
      before: "What sets us apart is our dedication to customer service.",
      after: "When your prototype needs to ship Friday, we answer the phone at 6am. Ask for Mike.",
      rationale: "Makes 'service' tangible and memorable with a specific, human example.",
    },
    {
      source: "Trust statement",
      before: "Trusted by leading companies in various industries.",
      after: "Trusted by Medtronic, Boston Scientific, and 47 other medical device manufacturers.",
      rationale: "Names names. Specificity creates credibility.",
    },
    {
      source: "Industry expertise claim",
      before: "We serve aerospace, automotive, medical, and more.",
      after: "85% of our work is for FDA-regulated medical device companies. We know the documentation you need before you ask.",
      rationale: "Shows depth instead of breadth. Demonstrates understanding of customer's world.",
    },
    {
      source: "Team section heading",
      before: "Meet Our Team",
      after: "47 machinists. Average tenure: 12 years.",
      rationale: "Numbers prove stability and expertise without generic platitudes.",
    },
    {
      source: "Footer tagline",
      before: "Your Partner in Precision",
      after: "Precision for people who can't afford mistakes.",
      rationale: "Speaks to customer's stakes, not your capability.",
    },
  ],

  competitors: [
    {
      name: "Precision Dynamics Corp",
      positioning: "Speed and turnaround",
      strength: "Clear speed promise",
      weakness: "No quality proof",
      headline: "Fastest turnaround in the Midwest",
    },
    {
      name: "MedTech Machining",
      positioning: "Regulatory compliance",
      strength: "Certifications prominent",
      weakness: "Cold, corporate feel",
      headline: "ISO 13485 Certified Precision Manufacturing",
    },
    {
      name: "Allied Manufacturing",
      positioning: "Broad capability",
      strength: "Wide service range",
      weakness: "No differentiation",
      headline: "Full-Service Manufacturing Solutions",
    },
  ],

  trustInventory: [
    { signal: "Client logos", present: true, visible: "Footer only", quality: "weak", action: "Move to top of homepage" },
    { signal: "Testimonials", present: true, visible: "About page", quality: "weak", action: "Add to homepage with specifics" },
    { signal: "Case studies", present: false, visible: "N/A", quality: "missing", action: "Critical - develop 2-3 with results" },
    { signal: "Certifications", present: true, visible: "About page", quality: "good", action: "Make prominent at top of homepage" },
    { signal: "Team photos", present: true, visible: "About page", quality: "moderate", action: "Use throughout site" },
    { signal: "Statistics", present: false, visible: "N/A", quality: "missing", action: "Add 'by the numbers' section" },
    { signal: "Industry associations", present: true, visible: "Footer", quality: "weak", action: "Add to credibility strip" },
  ],
}

type ViewType = 'overview' | 'message' | 'audience' | 'trust' | 'copy'

// View icons (Streamline-style, 1px stroke, placed after labels)
const viewIcons: Record<ViewType, React.ReactNode> = {
  overview: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  message: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  audience: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  trust: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  copy: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
}


const views = [
  {
    id: 'overview' as ViewType,
    label: 'Overview',
    description: 'Your action plan and scores at a glance',
  },
  {
    id: 'message' as ViewType,
    label: 'Your message',
    description: 'How clearly you communicate what you do and why it matters',
  },
  {
    id: 'audience' as ViewType,
    label: 'Your audience',
    description: 'Who you\'re speaking to and how you compare to alternatives',
  },
  {
    id: 'trust' as ViewType,
    label: 'Building trust',
    description: 'Proof points and getting visitors to take action',
  },
  {
    id: 'copy' as ViewType,
    label: 'Copy to use',
    description: 'Ready-to-paste text you can implement today',
  },
]

function getScoreColor(score: number): string {
  if (score >= 7) return 'excellent'
  if (score >= 5) return 'moderate'
  return 'poor'
}

function getScoreLabel(score: number): string {
  if (score >= 7) return 'Strong'
  if (score >= 5) return 'Needs work'
  return 'Critical gap'
}

// Modal component for score card details
function ScoreModal({
  scoreData,
  onClose
}: {
  scoreData: typeof auditData.scores.firstImpression
  onClose: () => void
}) {
  const color = getScoreColor(scoreData.score)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-10" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60" />
      <div
        className="relative bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto border-4 border-[var(--accent)] rounded"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b-2 border-[var(--border)] p-8 md:p-10 z-20">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-3xl leading-none"
          >
            ×
          </button>
          <p className="text-label mb-3">{scoreData.label}</p>
          <div className="flex items-baseline gap-3">
            <span className={`text-5xl font-bold score-${color}`}>{scoreData.score}</span>
            <span className="text-xl text-[var(--muted-foreground)]">/10</span>
            <span className={`text-lg font-semibold score-${color}`}>{getScoreLabel(scoreData.score)}</span>
          </div>
          <p className="text-body mt-3 text-[var(--muted-foreground)]">{scoreData.question}</p>
        </div>

        <div className="p-8 md:p-10 space-y-8">
          {/* Scoring factors */}
          <div>
            <h3 className="text-subsection mb-4">How this score was calculated</h3>
            <div className="space-y-3">
              {scoreData.factors.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-mono font-bold ${f.score === f.max ? 'text-[var(--success)]' : f.score === 0 ? 'text-[var(--error)]' : 'text-[var(--warning)]'}`}>
                      {f.score}/{f.max}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">{f.factor}</span>
                    <p className="text-sm text-[var(--muted-foreground)]">{f.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence from their site */}
          <div>
            <h3 className="text-subsection mb-4">What we found on your site</h3>
            <ul className="space-y-2">
              {scoreData.evidence.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-body">
                  <span className="text-[var(--accent)]">→</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* How to improve */}
          <div>
            <h3 className="text-subsection mb-4">How to improve this score</h3>
            <ol className="space-y-2 list-decimal list-inside">
              {scoreData.howToImprove.map((item, i) => (
                <li key={i} className="text-body">{item}</li>
              ))}
            </ol>
          </div>

          {/* Suggested copy */}
          <div className="bg-[var(--muted)] p-4 border-l-4 border-[var(--accent)]">
            <h3 className="text-subsection mb-2">Copy you can use</h3>
            <p className="text-body">{scoreData.suggestedCopy}</p>
          </div>
        </div>
        {/* Bottom fade indicator for scroll */}
        <div className="pointer-events-none sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent z-10" />
      </div>
    </div>
  )
}

// Locked findings component - direct value proposition without fake content
function LockedFindings({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div className="my-6 p-6 bg-[var(--muted)] border-2 border-dashed border-[var(--border)] text-center">
      <div className="max-w-md mx-auto">
        <p className="text-sm font-medium text-[var(--foreground)] mb-1">
          Detailed findings locked
        </p>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Includes what we found on your site, what it means, and specific copy you can use.
        </p>
        <button
          onClick={onUnlock}
          className="bg-[var(--accent)] text-white px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Unlock full audit for $400 →
        </button>
      </div>
    </div>
  )
}

// Locked content overlay component
function LockedOverlay({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white z-10 flex items-end justify-center pb-8">
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold mb-2">Unlock the full audit</p>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Get all fixes, deep-dive analysis, and a PDF you can share with your team.
          </p>
          <button
            onClick={onUnlock}
            className="bg-[var(--accent)] text-white px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
          >
            Unlock for $400 →
          </button>
          <p className="text-xs text-[var(--muted-foreground)] mt-4">
            You've seen the preview. No refunds after purchase.
          </p>
        </div>
      </div>
      <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
        <div className="h-48 bg-[var(--muted)] p-6">
          <div className="h-4 bg-[var(--border)] rounded w-3/4 mb-3" />
          <div className="h-4 bg-[var(--border)] rounded w-1/2 mb-3" />
          <div className="h-4 bg-[var(--border)] rounded w-2/3" />
        </div>
      </div>
    </div>
  )
}

// Constants
const FREE_ACTION_LIMIT = 5

export default function AuditPage() {
  const [activeModal, setActiveModal] = useState<keyof typeof auditData.scores | null>(null)
  const [expandedAction, setExpandedAction] = useState<number | null>(1) // First action expanded by default
  const [currentView, setCurrentView] = useState<ViewType>('overview')
  const [isPrintMode, setIsPrintMode] = useState(false)
  const [isPaid, setIsPaid] = useState(false) // Access control - will check URL/session in production

  // Check for paid access via URL param (e.g., ?access=paid-xxx)
  // In production, this would verify against a backend/Stripe
  const checkAccess = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('access')?.startsWith('paid-') || false
    }
    return false
  }

  // Initialize paid status
  useState(() => {
    setIsPaid(checkAccess())
  })

  // Handle unlock click - redirect to checkout
  const handleUnlock = () => {
    window.plausible?.('Unlock Clicked', { props: { company: auditData.company } })
    // In production: redirect to Stripe checkout with audit ID
    window.location.href = `/checkout?audit=${auditData.slug}`
  }

  const easyWins = auditData.actions.filter(a => a.effort === 'easy')

  // Handle view changes with scroll to top
  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.plausible?.('View Changed', { props: { view } })
  }

  // Handle PDF download - renders all content then prints
  const handlePrintPDF = () => {
    window.plausible?.('PDF Downloaded', { props: { company: auditData.company } })
    setIsPrintMode(true)
    // Wait for render, then print
    setTimeout(() => {
      window.print()
      setIsPrintMode(false)
    }, 100)
  }

  // Handle score card click with tracking
  const handleScoreCardClick = (key: keyof typeof auditData.scores) => {
    setActiveModal(key)
    window.plausible?.('Score Card Clicked', { props: { category: auditData.scores[key].label } })
  }

  // Handle action expansion with tracking
  const handleActionExpand = (priority: number) => {
    const newState = expandedAction === priority ? null : priority
    setExpandedAction(newState)
    if (newState !== null) {
      const action = auditData.actions.find(a => a.priority === priority)
      window.plausible?.('Action Expanded', { props: { action: action?.title || `Priority ${priority}` } })
    }
  }

  // Get current view index for prev/next navigation
  const currentViewIndex = views.findIndex(v => v.id === currentView)
  const prevView = currentViewIndex > 0 ? views[currentViewIndex - 1] : null
  const nextView = currentViewIndex < views.length - 1 ? views[currentViewIndex + 1] : null

  // In print mode, show all views
  const showAllViews = isPrintMode

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Sticky TOC */}
      <nav className="hidden lg:block print:!hidden fixed top-0 left-0 w-64 h-screen bg-[var(--accent)] text-white p-8 overflow-y-auto z-40 flex flex-col">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-wider opacity-60 mb-1">Audit for</p>
          <button
            onClick={() => handleViewChange('overview')}
            className="font-semibold text-lg text-left hover:underline w-full"
          >
            {auditData.company}
          </button>
        </div>
        <ul className="space-y-1 flex-1">
          {views.map((view) => {
            const isLocked = view.id !== 'overview' && !isPaid
            return (
              <li key={view.id}>
                <button
                  onClick={() => handleViewChange(view.id)}
                  className={`w-full text-left py-3 px-4 text-sm transition-all flex items-center gap-3 ${
                    currentView === view.id
                      ? 'bg-white/20 font-semibold'
                      : 'opacity-70 hover:opacity-100 hover:bg-white/10'
                  }`}
                >
                  {isLocked ? <span className="text-xs opacity-60">🔒</span> : viewIcons[view.id]}
                  {view.label}
                </button>
              </li>
            )
          })}
        </ul>
        <div className="mt-auto pt-8 border-t border-white/20 print:hidden">
          {isPaid ? (
            <button
              onClick={handlePrintPDF}
              className="w-full py-3 px-4 text-sm bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              Download PDF
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </button>
          ) : (
            <div className="relative group">
              <button
                className="w-full py-3 px-4 text-sm bg-white/10 transition-all flex items-center justify-center gap-2 opacity-60 cursor-default"
              >
                🔒 Download PDF
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Included with full purchase
              </div>
            </div>
          )}
          <Link
            href="/"
            className="block mt-4 text-center text-xs opacity-50 hover:opacity-80 transition-opacity"
          >
            Analyze another site →
          </Link>
        </div>
      </nav>

      {/* Main content - offset for TOC */}
      <div className="lg:ml-64 print:!ml-0">
        {/* Header */}
        <header className="border-b-4 border-[var(--accent)] py-8 md:py-12">
          <div className="container">
            <p className="text-label mb-2">WEBSITE MESSAGING AUDIT</p>
            <h1 className="text-display mb-4">{auditData.company}</h1>
            <div className="flex flex-wrap gap-4 text-[var(--muted-foreground)]">
              <span>{auditData.date}</span>
              <span>·</span>
              <span>Prepared by Lee Fuhr</span>
              <span>·</span>
              <span className="font-mono">{auditData.url}</span>
            </div>
          </div>
        </header>

        {/* OVERVIEW VIEW */}
        {(showAllViews || currentView === 'overview') && (
          <>
            {/* What's in this audit - hidden in print */}
            <section className="section print:hidden">
              <div className="container">
                <h2 className="text-section mb-6">What's in this audit</h2>
                <p className="text-body-lg mb-8 max-w-3xl">
                  This audit evaluates your website messaging across four key areas. Click any section below to dive deeper.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {views.filter(v => v.id !== 'overview').map((view) => {
                    const isLocked = !isPaid
                    return (
                      <button
                        key={view.id}
                        onClick={() => handleViewChange(view.id)}
                        className={`text-left p-6 bg-white border-2 transition-colors rounded ${
                          isLocked
                            ? 'border-[var(--border)] hover:border-[var(--accent)]'
                            : 'border-[var(--border)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2 text-[var(--accent)]">
                          <h3 className="text-subsection">{view.label}</h3>
                          {isLocked ? <span className="text-xs">🔒</span> : viewIcons[view.id]}
                        </div>
                        <p className="text-body text-[var(--muted-foreground)]">{view.description}</p>
                        <p className="text-sm text-[var(--accent)] mt-3">
                          {isLocked ? 'Unlock to explore →' : 'Explore →'}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Action Plan */}
            <section id="action-plan" className="section section-alt">
          <div className="container">
            <h2 className="text-section mb-6">Top priorities</h2>
            <p className="text-body-lg mb-8 max-w-3xl">
              This isn't a report to file away. Below are the specific changes that will have the most impact on converting visitors into customers. Start with #1 and work down.
            </p>

            <div className="grid gap-4">
              {auditData.actions.map((action) => (
                <div
                  key={action.priority}
                  className={`action-card ${action.featured ? 'featured' : ''}`}
                >
                  <div
                    className="flex flex-col md:flex-row md:items-start gap-4 cursor-pointer"
                    onClick={() => {
                      if (action.priority > FREE_ACTION_LIMIT && !isPaid) {
                        handleUnlock()
                      } else {
                        handleActionExpand(action.priority)
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-[var(--accent)] shrink-0 w-12">
                        {String(action.priority).padStart(2, '0')}
                      </span>
                      {action.featured && (
                        <span className="bg-[var(--accent)] text-white text-xs font-bold uppercase tracking-wider px-3 py-1">
                          Start here
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-subsection">{action.title}</h3>
                        <span className={`effort-tag effort-${action.effort}`}>
                          {action.effort === 'easy' && '🟢'}
                          {action.effort === 'medium' && '🟡'}
                          {action.effort === 'hard' && '🔴'}
                          {action.effort}
                        </span>
                        {action.expandType && (
                          <span className="text-xs text-[var(--accent)] font-semibold">
                            {action.priority > FREE_ACTION_LIMIT && !isPaid ? (
                              '🔒 Unlock to see copy'
                            ) : (
                              expandedAction === action.priority ? '' : '↓ See copy you can use'
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-body text-[var(--muted-foreground)]">{action.description}</p>
                    </div>
                  </div>

                  {/* Expanded content based on action type */}
                  {action.expandType && expandedAction === action.priority && (
                    <div className="mt-6 pt-6 border-t-2 border-[var(--border)]">
                      {/* Headlines */}
                      {action.expandType === 'headlines' && (
                        <>
                          <h4 className="text-subsection mb-4">10 headlines you could use today</h4>
                          <div className="grid gap-3">
                            {auditData.suggestedHeadlines.map((h, i) => (
                              <div key={i} className="bg-white p-4 border-l-4 border-[var(--accent)]">
                                <p className="font-semibold text-lg mb-1">"{h.headline}"</p>
                                <p className="text-sm text-[var(--muted-foreground)]">{h.rationale}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Credibility strip */}
                      {action.expandType === 'trustbar' && (
                        <>
                          <h4 className="text-subsection mb-4">{auditData.trustBarCopy.intro}</h4>
                          <div className="bg-[var(--muted)] p-4 font-mono text-sm mb-6 overflow-x-auto">
                            <pre>{auditData.trustBarCopy.html}</pre>
                          </div>
                          <h4 className="text-subsection mb-4">Plus, add this testimonial</h4>
                          <div className="bg-white p-6 border-l-4 border-[var(--accent)]">
                            <p className="text-lg italic mb-2">"{auditData.trustBarCopy.testimonial.quote}"</p>
                            <p className="text-sm text-[var(--muted-foreground)]">{auditData.trustBarCopy.testimonial.attribution}</p>
                          </div>
                        </>
                      )}

                      {/* Ideal Customer */}
                      {action.expandType === 'customer' && (
                        <>
                          <h4 className="text-subsection mb-4">{auditData.customerDefinition.intro}</h4>
                          <div className="grid gap-4 mb-6">
                            <div className="bg-white p-4 border-l-4 border-[var(--accent)]">
                              <p className="text-label mb-1">Company type</p>
                              <p className="text-body">{auditData.customerDefinition.definition.companyType}</p>
                            </div>
                            <div className="bg-white p-4 border-l-4 border-[var(--accent)]">
                              <p className="text-label mb-1">Size & structure</p>
                              <p className="text-body">{auditData.customerDefinition.definition.size}</p>
                            </div>
                            <div className="bg-white p-4 border-l-4 border-[var(--accent)]">
                              <p className="text-label mb-1">Their situation</p>
                              <p className="text-body">{auditData.customerDefinition.definition.situation}</p>
                            </div>
                            <div className="bg-white p-4 border-l-4 border-[var(--accent)]">
                              <p className="text-label mb-1">Why they need you</p>
                              <p className="text-body">{auditData.customerDefinition.definition.whyYou}</p>
                            </div>
                          </div>
                          <h4 className="text-subsection mb-4">Homepage copy that speaks to this customer</h4>
                          <div className="bg-[var(--muted)] p-4 border-l-4 border-[var(--success)]">
                            <p className="text-body font-medium">{auditData.customerDefinition.homepageCopy}</p>
                          </div>
                        </>
                      )}

                      {/* Why Us */}
                      {action.expandType === 'whyus' && (
                        <>
                          <h4 className="text-subsection mb-4">{auditData.whyUsCopy.intro}</h4>
                          <div className="grid gap-4">
                            {auditData.whyUsCopy.differentiators.map((d, i) => (
                              <div key={i} className="bg-white p-4 border-l-4 border-[var(--accent)]">
                                <p className="font-semibold text-lg mb-1">{d.headline}</p>
                                <p className="text-body text-[var(--muted-foreground)] mb-2">{d.subtext}</p>
                                {d.note && (
                                  <p className="text-sm text-[var(--accent)] italic">{d.note}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Case Study Template */}
                      {action.expandType === 'casestudy' && (
                        <>
                          <h4 className="text-subsection mb-4">{auditData.caseStudyTemplate.intro}</h4>
                          <div className="bg-white p-6 border-2 border-[var(--border)] space-y-4">
                            <div>
                              <p className="text-label mb-1">Title</p>
                              <p className="text-xl font-semibold">{auditData.caseStudyTemplate.template.title}</p>
                            </div>
                            <div>
                              <p className="text-label mb-1">The challenge</p>
                              <p className="text-body">{auditData.caseStudyTemplate.template.challenge}</p>
                            </div>
                            <div>
                              <p className="text-label mb-1">Our approach</p>
                              <p className="text-body">{auditData.caseStudyTemplate.template.approach}</p>
                            </div>
                            <div>
                              <p className="text-label mb-1">Results</p>
                              <ul className="list-disc list-inside text-body">
                                {auditData.caseStudyTemplate.template.results.map((r, i) => (
                                  <li key={i}>{r}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-[var(--muted)] p-4 mt-4">
                              <p className="text-body italic">{auditData.caseStudyTemplate.template.quote}</p>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Buttons */}
                      {action.expandType === 'buttons' && (
                        <>
                          <h4 className="text-subsection mb-4">{auditData.buttonAlternatives.intro}</h4>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-label mb-3">PRIMARY BUTTONS (high commitment)</p>
                              <div className="space-y-3">
                                {auditData.buttonAlternatives.primary.map((btn, i) => (
                                  <div key={i} className="bg-white p-4 border-l-4 border-[var(--accent)]">
                                    <p className="font-semibold mb-1">{btn.text}</p>
                                    <p className="text-sm text-[var(--muted-foreground)]">{btn.rationale}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-label mb-3">SECONDARY BUTTONS (low commitment)</p>
                              <div className="space-y-3">
                                {auditData.buttonAlternatives.secondary.map((btn, i) => (
                                  <div key={i} className="bg-white p-4 border-l-4 border-[var(--success)]">
                                    <p className="font-semibold mb-1">{btn.text}</p>
                                    <p className="text-sm text-[var(--muted-foreground)]">{btn.rationale}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Collapse button at bottom */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleActionExpand(action.priority)
                        }}
                        className="mt-6 pt-4 border-t border-[var(--border)] w-full text-center text-sm text-[var(--accent)] hover:text-[var(--accent)]/80 font-semibold"
                      >
                        ↑ Collapse
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Scores at a Glance */}
        <section id="scores" className="section section-alt">
          <div className="container">
            <h2 className="text-section mb-4">Where you stand</h2>
            <div className="callout mb-8">
              <p className="text-body">
                <strong>A note on scoring:</strong> A perfect 10 is nearly theoretical—it would mean flawless messaging with zero room for improvement. That's not the goal. These scores are a <strong>prioritization rubric</strong> to show where changes will have the most impact. Focus on the lowest scores first.
              </p>
            </div>
            <p className="text-body-lg mb-8 max-w-3xl">
              Click any card to see exactly how the score was calculated, what we found on your site, and specific copy you can use.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(auditData.scores).map(([key, scoreData]) => {
                const color = getScoreColor(scoreData.score)
                const bgTint = color === 'excellent' ? 'bg-green-50' : color === 'moderate' ? 'bg-amber-50' : 'bg-red-50'
                return (
                  <button
                    key={key}
                    onClick={() => handleScoreCardClick(key as keyof typeof auditData.scores)}
                    className={`score-card text-left hover:border-[var(--accent)] hover:shadow-lg transition-all cursor-pointer rounded ${bgTint}`}
                  >
                    <p className="text-label mb-1">{scoreData.label}</p>
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-bold score-${color}`}>{scoreData.score}</span>
                        <span className="text-[var(--muted-foreground)]">/10</span>
                      </div>
                      <span className={`text-sm font-semibold score-${color}`}>{getScoreLabel(scoreData.score)}</span>
                    </div>
                    <div className="score-bar mb-3">
                      <div
                        className={`score-bar-fill ${color}`}
                        style={{ width: `${scoreData.score * 10}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)]">{scoreData.question}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Get Started - Next button - hidden in print */}
        <section className="section border-t-2 border-[var(--border)] print:hidden">
          <div className="container">
            <div className="max-w-xl ml-auto">
              <button
                onClick={() => handleViewChange('message')}
                className="w-full text-left p-6 border-2 border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors group"
              >
                <p className="text-xs uppercase tracking-wider text-[var(--accent)] group-hover:text-white/90 mb-2">Start the deep dive →</p>
                <h3 className="text-lg font-semibold text-[var(--foreground)] group-hover:text-white mb-1">Your message</h3>
                <p className="text-sm text-[var(--muted-foreground)] group-hover:text-white/80">How clearly you communicate what you do and why it matters</p>
              </button>
            </div>
          </div>
        </section>
          </>
        )}

        {/* Score Modal - always available */}
        {activeModal && (
          <ScoreModal
            scoreData={auditData.scores[activeModal]}
            onClose={() => setActiveModal(null)}
          />
        )}

        {/* MESSAGE VIEW */}
        {(showAllViews || currentView === 'message') && (
          <>
        <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange} />

        {/* First Impression Analysis */}
        <section id="first-impression" className="section">
          <div className="container">
            <h2 className="text-section mb-6">First impression clarity</h2>

            <div className="methodology-box">
              <h3 className="text-subsection mb-2">The 5-second test</h3>
              <p className="text-body">
                Your prospects open 10 tabs. You have 5 seconds to answer: "Is this for me?" If they can't
                immediately see what you do, who you serve, and why you're different—they close the tab.
                This analysis applies the same framework I use with $5M+ manufacturing clients to diagnose
                exactly where that clarity breaks down.
              </p>
            </div>

            {(isPaid || showAllViews) ? (
            <>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-subsection mb-4">What we found</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--success)]">✓</span>
                    <span><strong>What you do:</strong> Clear that you're a manufacturing company</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--warning)]">⚠</span>
                    <span><strong>Who it's for:</strong> "Industrial clients" is too vague</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--error)]">✗</span>
                    <span><strong>Why you're different:</strong> No clear differentiator visible</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--warning)]">⚠</span>
                    <span><strong>What to do next:</strong> Button exists but generic</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--success)]">✓</span>
                    <span><strong>Trust:</strong> Professional appearance builds credibility</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-subsection mb-4">What this means for you</h3>
                <p className="text-body mb-4">
                  Visitors understand you're a manufacturer, but they can't immediately tell if you're
                  right for <em>them</em> or why they should choose you over the next search result.
                </p>
                <p className="text-body">
                  When a purchasing manager has 10 tabs open, generic messaging means you blend into the
                  pile. They close your tab and move on to someone who speaks to their specific situation.
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-subsection mb-4">What to do</h3>
              <ul className="action-list">
                <li>
                  <span className="effort-tag effort-easy">🟢 Easy</span>
                  <span>Rewrite your headline to include a specific outcome and audience segment</span>
                </li>
                <li>
                  <span className="effort-tag effort-easy">🟢 Easy</span>
                  <span>Add proof points (certifications, stats) to the top of your homepage</span>
                </li>
                <li>
                  <span className="effort-tag effort-medium">🟡 Medium</span>
                  <span>Replace stock imagery with photos of your actual facility and team</span>
                </li>
              </ul>
            </div>
            </>
            ) : (
              <LockedFindings onUnlock={handleUnlock} />
            )}
          </div>
        </section>

        {/* Message Sequence Analysis */}
        <section id="message-sequence" className="section section-alt">
          <div className="container">
            <h2 className="text-section mb-6">The order of your message</h2>

            <div className="methodology-box">
              <h3 className="text-subsection mb-2">Why sequence matters</h3>
              <p className="text-body">
                Most industrial websites lead with "Our Services" or "Our Products." Wrong order. Prospects
                need to feel understood before they'll listen to your solution. The winning sequence:
                <strong> Pain → Outcome → Proof → Features → Next Step</strong>. This analysis reveals
                where your messaging breaks that sequence—and exactly how to fix it.
              </p>
            </div>

            {(isPaid || showAllViews) ? (
            <>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-subsection mb-4">What we found</h3>
                <p className="text-body mb-4">
                  Your homepage leads with features: "CNC Machining, Wire EDM, Swiss Screw Machining..."
                  This is the pattern across most of your pages.
                </p>
                <p className="text-body mb-4">
                  <strong>Current sequence:</strong> Features → Features → Contact Us
                </p>
                <p className="text-body">
                  <strong>Effective sequence:</strong> Pain point → Outcome → Proof → Features → Next step
                </p>
              </div>
              <div>
                <h3 className="text-subsection mb-4">What this means for you</h3>
                <p className="text-body mb-4">
                  Leading with features assumes visitors already know they need CNC machining and are
                  comparison shopping. But many prospects are earlier in their journey—they have a
                  problem and aren't sure how to solve it.
                </p>
                <p className="text-body">
                  By leading with their problem ("parts that keep failing inspection"), you demonstrate
                  understanding before proving capability. This builds connection and trust.
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-subsection mb-4">What to do</h3>
              <ul className="action-list">
                <li>
                  <span className="effort-tag effort-easy">🟢 Easy</span>
                  <span>Add a problem-focused subheading before your service list</span>
                </li>
                <li>
                  <span className="effort-tag effort-medium">🟡 Medium</span>
                  <span>Restructure service pages: outcome headline, proof, then capability details</span>
                </li>
                <li>
                  <span className="effort-tag effort-medium">🟡 Medium</span>
                  <span>Create a "Problems we solve" section that speaks to customer pain points</span>
                </li>
              </ul>
            </div>
            </>
            ) : (
              <LockedFindings onUnlock={handleUnlock} />
            )}
          </div>
        </section>

          </>
        )}

        {/* AUDIENCE VIEW */}
        {(showAllViews || currentView === 'audience') && (
          <>
        <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange} />

        {/* Ideal Customer Clarity */}
        <section id="customer" className="section">
          <div className="container">
            <h2 className="text-section mb-6">Who you're really for</h2>

            <div className="methodology-box">
              <h3 className="text-subsection mb-2">The "more of these" principle</h3>
              <p className="text-body">
                Think of your best customers—the ones who pay on time, don't nickel-and-dime you,
                and refer others. Your website should speak directly to <em>that</em> company. When
                you write for everyone, you connect with no one. This analysis identifies who your
                site is currently attracting—and whether that matches who you actually want.
              </p>
            </div>

            {(isPaid || showAllViews) ? (
            <>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-subsection mb-4">What we found</h3>
                <p className="text-body mb-4">
                  Your site speaks to "industrial clients" and "companies in aerospace, automotive,
                  medical, and more." This is everyone—which means it's no one.
                </p>
                <div className="callout mt-4">
                  <p className="text-body">
                    <strong>The tell:</strong> When I look at your testimonials and case studies,
                    85% are from medical device companies. But your homepage doesn't mention medical
                    devices once.
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-subsection mb-4">What this means for you</h3>
                <p className="text-body mb-4">
                  A medical device engineer looking for a machining partner sees "aerospace, automotive,
                  medical" and wonders if you really understand their world—FDA documentation, biocompatibility
                  requirements, the stakes of a failed part.
                </p>
                <p className="text-body">
                  Meanwhile, your competitors who explicitly focus on medical devices feel like a safer bet,
                  even if you're actually better.
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-subsection mb-4">What to do</h3>
              <ul className="action-list">
                <li>
                  <span className="effort-tag effort-medium">🟡 Medium</span>
                  <span>Define your ideal customer: company type, size, situation, what makes them your best fit</span>
                </li>
                <li>
                  <span className="effort-tag effort-medium">🟡 Medium</span>
                  <span>Rewrite your homepage to speak primarily to medical device manufacturers</span>
                </li>
                <li>
                  <span className="effort-tag effort-hard">🔴 Hard</span>
                  <span>Create industry-specific landing pages with tailored messaging for each vertical</span>
                </li>
              </ul>
            </div>
            </>
            ) : (
              <LockedFindings onUnlock={handleUnlock} />
            )}
          </div>
        </section>

        {/* Differentiator Test */}
        <section id="differentiator" className="section section-alt">
          <div className="container">
            <h2 className="text-section mb-6">The differentiator test</h2>

            <div className="methodology-box">
              <h3 className="text-subsection mb-2">The "how the hell" question</h3>
              <p className="text-body">
                What would make your competitors ask: "How the hell did they do that?" Not aspirational
                claims—operational realities. The 12-year average tenure. The 0.02% defect rate.
                The custom fixturing. This analysis hunts for the proof you already have but aren't
                using—and shows you exactly where to put it.
              </p>
            </div>

            {(isPaid || showAllViews) ? (
            <>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-subsection mb-4">What we found</h3>
                <p className="text-body mb-4">
                  Your current differentiators are: "quality," "service," "trusted partner," and "on-time delivery."
                </p>
                <p className="text-body mb-4">
                  <strong>The problem:</strong> Every manufacturing website uses these exact words. They're table
                  stakes, not differentiators. When everyone claims quality, no one's claim means anything.
                </p>
                <div className="callout callout-warning mt-4">
                  <p className="text-body">
                    <strong>Hidden on your About page:</strong> "Our average machinist has been with us 12 years."
                    That's a differentiator. Most shops have high turnover. This belongs on your homepage.
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-subsection mb-4">What this means for you</h3>
                <p className="text-body mb-4">
                  When your messaging sounds like everyone else's, buyers compare on the only remaining
                  variable: price. Your differentiation exists—it's just buried or unstated.
                </p>
                <p className="text-body">
                  The goal isn't to invent differentiation. It's to surface what's already true about
                  your business and make it visible.
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-subsection mb-4">What to do</h3>
              <ul className="action-list">
                <li>
                  <span className="effort-tag effort-medium">🟡 Medium</span>
                  <span>Answer: What would make competitors say "how the hell do they do that?"</span>
                </li>
                <li>
                  <span className="effort-tag effort-easy">🟢 Easy</span>
                  <span>Surface hidden proof points (team tenure, defect rates, reorder rates) to homepage</span>
                </li>
                <li>
                  <span className="effort-tag effort-medium">🟡 Medium</span>
                  <span>Replace every "quality" and "service" mention with specific, provable claims</span>
                </li>
              </ul>
            </div>
            </>
            ) : (
              <LockedFindings onUnlock={handleUnlock} />
            )}
          </div>
        </section>

        {/* Competitor Messaging Matrix */}
        <section id="competitors" className="section">
          <div className="container">
            <h2 className="text-section mb-6">Competitor messaging comparison</h2>

            <div className="methodology-box">
              <h3 className="text-subsection mb-2">Finding the white space</h3>
              <p className="text-body">
                If everyone claims "quality" and "service," those words mean nothing. I analyzed your
                three closest competitors to find what they're <em>not</em> saying—the position nobody's
                claimed. That's where you win. This analysis shows exactly where the opening is.
              </p>
            </div>

            {(isPaid || showAllViews) ? (
            <>
            <div className="overflow-x-auto mb-8">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Competitor</th>
                    <th>Their positioning</th>
                    <th>Strength</th>
                    <th>Weakness</th>
                  </tr>
                </thead>
                <tbody>
                  {auditData.competitors.map((comp) => (
                    <tr key={comp.name}>
                      <td className="font-semibold">{comp.name}</td>
                      <td>{comp.positioning}</td>
                      <td className="text-[var(--success)]">{comp.strength}</td>
                      <td className="text-[var(--error)]">{comp.weakness}</td>
                    </tr>
                  ))}
                  <tr className="bg-[var(--muted)]">
                    <td className="font-semibold">You (currently)</td>
                    <td>Broad capability, quality</td>
                    <td className="text-[var(--success)]">Professional appearance</td>
                    <td className="text-[var(--error)]">No clear differentiation</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="callout mb-8">
              <h3 className="text-subsection mb-2">💡 Opportunity spotted</h3>
              <p className="text-body">
                No competitor is claiming the "partnership" position—the long-term relationship angle.
                Your 12-year average machinist tenure and high customer retention rate could own this
                space: "The shop that becomes part of your team."
              </p>
            </div>

            <div>
              <h3 className="text-subsection mb-4">What to do</h3>
              <ul className="action-list">
                <li>
                  <span className="effort-tag effort-medium">🟡 Medium</span>
                  <span>Claim the "partnership/stability" position that competitors aren't using</span>
                </li>
                <li>
                  <span className="effort-tag effort-hard">🔴 Hard</span>
                  <span>Consider a "How we compare" page that addresses the competitive landscape directly</span>
                </li>
              </ul>
            </div>
            </>
            ) : (
              <LockedFindings onUnlock={handleUnlock} />
            )}
          </div>
        </section>

          </>
        )}

        {/* TRUST VIEW */}
        {(showAllViews || currentView === 'trust') && (
          <>
        <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange} />

        {/* Trust Inventory */}
        <section id="trust" className="section section-alt">
          <div className="container">
            <h2 className="text-section mb-6">Your proof points</h2>

            <div className="methodology-box">
              <h3 className="text-subsection mb-2">The proof inventory</h3>
              <p className="text-body">
                You have proof. Certifications. Track records. Customer wins. But is it visible where it
                matters? I see this constantly: companies bury their best proof on About pages nobody reads.
                This analysis maps every proof point on your site and shows where to surface them for maximum impact.
              </p>
            </div>

            {(isPaid || showAllViews) ? (
            <>
            <div className="overflow-x-auto mb-8">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Signal type</th>
                    <th>Present?</th>
                    <th>Where</th>
                    <th>Quality</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {auditData.trustInventory.map((item) => (
                    <tr key={item.signal}>
                      <td className="font-semibold">{item.signal}</td>
                      <td>{item.present ? '✓' : '✗'}</td>
                      <td>{item.visible}</td>
                      <td>
                        <span className={
                          item.quality === 'good' ? 'text-[var(--success)]' :
                          item.quality === 'moderate' ? 'text-[var(--warning)]' :
                          item.quality === 'weak' ? 'text-[var(--warning)]' :
                          'text-[var(--error)]'
                        }>
                          {item.quality}
                        </span>
                      </td>
                      <td>{item.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="callout callout-warning mb-8">
              <h3 className="text-subsection mb-2">Critical gap</h3>
              <p className="text-body">
                Case studies are the most effective trust builder for B2B services. They show you've
                solved problems like theirs. Developing 2-3 detailed case studies with measurable
                results should be a top priority.
              </p>
            </div>

            <div>
              <h3 className="text-subsection mb-4">What to do</h3>
              <ul className="action-list">
                <li>
                  <span className="effort-tag effort-easy">🟢 Easy</span>
                  <span>Create a credibility strip on the homepage: client logos, cert badges, key stat</span>
                </li>
                <li>
                  <span className="effort-tag effort-medium">🟡 Medium</span>
                  <span>Develop 2-3 case studies with specific problems, solutions, and results</span>
                </li>
                <li>
                  <span className="effort-tag effort-easy">🟢 Easy</span>
                  <span>Add a "By the numbers" section: years in business, parts produced, clients served</span>
                </li>
              </ul>
            </div>
            </>
            ) : (
              <LockedFindings onUnlock={handleUnlock} />
            )}
          </div>
        </section>

        {/* Button Journey */}
        <section id="buttons" className="section">
          <div className="container">
            <h2 className="text-section mb-6">Getting visitors to take action</h2>

            <div className="methodology-box">
              <h3 className="text-subsection mb-2">The decision funnel</h3>
              <p className="text-body">
                "Request a Quote" on your homepage? You're asking someone who just met you to make a
                commitment. That's like proposing on a first date. This analysis maps every call-to-action
                on your site against where visitors actually are in their decision process—and shows
                you what actions to offer at each stage.
              </p>
            </div>

            {(isPaid || showAllViews) ? (
            <>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-subsection mb-4">What we found</h3>
                <p className="text-body mb-4">
                  Your main button everywhere is "Contact Us." This is high-commitment for someone
                  who just landed on your site.
                </p>
                <ul className="space-y-2 text-body">
                  <li><strong>Homepage:</strong> Contact Us</li>
                  <li><strong>Services:</strong> Contact Us</li>
                  <li><strong>About:</strong> Contact Us</li>
                  <li><strong>Footer:</strong> Contact Us</li>
                </ul>
                <p className="text-body mt-4">
                  No middle-ground options for visitors who aren't ready to talk but want to learn more.
                </p>
              </div>
              <div>
                <h3 className="text-subsection mb-4">What this means for you</h3>
                <p className="text-body mb-4">
                  "Contact Us" asks for commitment before you've built trust. Visitors who aren't
                  ready to talk—but might be great fits—have no way to stay engaged.
                </p>
                <p className="text-body">
                  Result: You only capture prospects who are already ready to buy. Everyone else leaves.
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-subsection mb-4">What to do</h3>
              <ul className="action-list">
                <li>
                  <span className="effort-tag effort-easy">🟢 Easy</span>
                  <span>Rewrite your main button: "Get a quote in 24 hours" (sets expectation)</span>
                </li>
                <li>
                  <span className="effort-tag effort-easy">🟢 Easy</span>
                  <span>Add a secondary button: "See our capabilities" or "View case studies"</span>
                </li>
                <li>
                  <span className="effort-tag effort-medium">🟡 Medium</span>
                  <span>Create a low-commitment offer: downloadable guide, sample request, facility tour video</span>
                </li>
              </ul>
            </div>
            </>
            ) : (
              <LockedFindings onUnlock={handleUnlock} />
            )}
          </div>
        </section>

          </>
        )}

        {/* COPY VIEW */}
        {(showAllViews || currentView === 'copy') && (
          <>
        <ViewNavBar prevView={prevView} nextView={nextView} onNavigate={handleViewChange} />

        {/* Before/After Examples */}
        <section id="before-after" className="section section-alt">
          <div className="container">
            <h2 className="text-section mb-6">Copy you can use today</h2>
            <p className="text-body-lg mb-8 max-w-3xl">
              These aren't suggestions—they're actual rewrites you can copy and paste. Each one
              transforms generic messaging into something specific, provable, and differentiated.
            </p>

            {(isPaid || showAllViews) ? (
            <div className="space-y-6">
              {auditData.beforeAfter.map((example, i) => (
                <div key={i} className="comparison-card">
                  <div className="comparison-header">
                    <span className="text-label">{example.source}</span>
                  </div>
                  <div className="comparison-content">
                    <div className="comparison-before">
                      <span className="comparison-label before">
                        <span className="w-2 h-2 bg-[var(--error)] inline-block"></span>
                        Current
                      </span>
                      <p className="text-body">{example.before}</p>
                    </div>
                    <div className="comparison-after">
                      <span className="comparison-label after">
                        <span className="w-2 h-2 bg-[var(--success)] inline-block"></span>
                        Suggested
                      </span>
                      <p className="text-body font-medium">{example.after}</p>
                    </div>
                  </div>
                  <div className="p-4 border-t-2 border-[var(--border)] bg-white">
                    <p className="text-sm text-[var(--muted-foreground)]">
                      <strong>Why:</strong> {example.rationale}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            ) : (
              <LockedFindings onUnlock={handleUnlock} />
            )}
          </div>
        </section>

        {/* Quick Wins */}
        <section id="quick-wins" className="section">
          <div className="container">
            <div className="quick-wins">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🟢</span>
                <h2 className="text-section text-[var(--success)]">Quick wins</h2>
              </div>
              <p className="text-body-lg mb-6">
                These changes take minimal effort but will immediately improve how visitors perceive you.
                Start here before tackling the bigger items.
              </p>
              {(isPaid || showAllViews) ? (
              <div className="space-y-4">
                {easyWins.map((action, i) => (
                  <div key={i} className="bg-white p-4 border-l-4 border-[var(--success)]">
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">{action.description}</p>
                  </div>
                ))}
              </div>
              ) : (
                <LockedFindings onUnlock={handleUnlock} />
              )}
            </div>
          </div>
        </section>

          </>
        )}

        <AuditFooter />
      </div>
    </main>
  )
}
