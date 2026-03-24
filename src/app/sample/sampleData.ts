// Sample audit data showing what a real audit looks like
export const auditData = {
  company: "Acme Precision Manufacturing",
  url: "acmeprecision.com",
  date: "December 29, 2024",
  slug: "sample",

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
        "Homepage uses: 'quality,' 'service,' 'trusted partner' - same as every competitor",
        "About page: 'Our average machinist has been with us 12 years' - THIS is a differentiator but hidden",
        "No comparison to alternatives or acknowledgment of other options",
        "No single memorable phrase or tagline",
      ],
      howToImprove: [
        "Surface the 12-year tenure stat to homepage - this proves stability competitors can't match",
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
        "Homepage: 'aerospace, automotive, medical, and more' - this is everyone",
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
        "ISO 9001 and ISO 13485 certifications - but both are footer only",
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
        "Every page: 'Contact Us' button - no specificity",
        "No mention of response time, quote process, or what happens next",
        "No lower-commitment options (download, video, sample request)",
        "Buttons are visible and well-placed throughout",
      ],
      howToImprove: [
        "Primary button: 'Get a Quote in 24 Hours' - sets specific expectation",
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

  // topIssues matches the preview/results data structure
  topIssues: [
    {
      title: "Rewrite your homepage headline with a specific outcome",
      description: "Replace 'Precision Manufacturing Solutions' with something only you can say. Lead with the result your customers get, not your capability.",
      severity: 'critical' as const,
      effort: "easy" as const,
      featured: true,
      expandType: "headlines" as const,
      findings: [
        { phrase: "Precision Manufacturing Solutions", problem: "Generic headline that every competitor uses", rewrite: "Medical-grade precision for device manufacturers who can't afford defects", location: "Homepage headline", pageUrl: "/" },
        { phrase: "Precision Manufacturing Solutions", problem: "Doesn't specify who you serve or why you're different", rewrite: "47 machinists. 12-year average tenure. Precision that compounds.", location: "Homepage headline", pageUrl: "/" },
        { phrase: "Precision Manufacturing Solutions", problem: "Focuses on capability, not outcome", rewrite: "When your parts need to pass inspection the first time", location: "Homepage headline", pageUrl: "/" },
      ],
    },
    {
      title: "Add proof at the top of your homepage",
      description: "Move your ISO certification badge and one client testimonial to the top of your homepage (before visitors scroll). They need to trust you before they'll read further.",
      severity: 'critical' as const,
      effort: "easy" as const,
      expandType: "trustbar" as const,
      findings: [
        { phrase: "[certifications in footer only]", problem: "Trust signals are hidden below the fold", rewrite: "ISO 13485 certified · 99.7% on-time delivery · Trusted by Medtronic, Boston Scientific, and 47 other device manufacturers", location: "Homepage - add above fold", pageUrl: "/" },
        { phrase: "[no social proof visible]", problem: "Visitors can't quickly verify your claims", rewrite: "\"They've machined 2.3M parts for us. Zero recalls.\" - VP Engineering, Medtronic", location: "Homepage - add testimonial strip", pageUrl: "/" },
      ],
    },
    {
      title: "Define your ideal customer explicitly",
      description: "'Industrial clients' is too broad. Name the specific type of company, size, and situation where you're the obvious choice.",
      severity: 'warning' as const,
      effort: "medium" as const,
      expandType: "customer" as const,
      findings: [
        { phrase: "We serve aerospace, automotive, medical, and more", problem: "Serving everyone means connecting with no one", rewrite: "Precision machining for FDA-regulated medical devices. 85% of our work is for device manufacturers who need tight tolerances and documented compliance.", location: "Homepage", pageUrl: "/" },
        { phrase: "industrial clients", problem: "Vague audience naming", rewrite: "medical device companies at $5M-50M who need ISO 13485 compliance", location: "About page", pageUrl: "/about" },
      ],
    },
    {
      title: "Create a 'Why us' section with real differentiators",
      description: "Not 'quality' or 'service' - what would make your competitors say 'how the hell do they do that?'",
      severity: 'warning' as const,
      effort: "medium" as const,
      expandType: "whyus" as const,
      findings: [
        { phrase: "committed to quality", problem: "Every competitor says this exact phrase", rewrite: "Last year: 847,000 parts shipped. 12 rejected. That's a 0.001% defect rate.", location: "Homepage", pageUrl: "/" },
        { phrase: "trusted partner", problem: "Meaningless without proof", rewrite: "47 machinists. Average tenure: 12 years. When you need parts right the first time, that experience matters.", location: "Homepage", pageUrl: "/" },
        { phrase: "excellent customer service", problem: "Generic claim with no specifics", rewrite: "When your prototype needs to ship Friday, call Mike directly. 6am-10pm.", location: "Services page", pageUrl: "/services" },
      ],
    },
    {
      title: "Develop 2 case studies with specific results",
      description: "Include the problem, your approach, and measurable outcomes. 'Reduced defect rate from 2.3% to 0.1%' beats 'delivered quality parts.'",
      severity: 'warning' as const,
      effort: "medium" as const,
      expandType: "casestudy" as const,
      findings: [
        { phrase: "[no case studies present]", problem: "Missing the most effective B2B trust builder", rewrite: "How Boston Scientific reduced part defects by 73% after switching to us", location: "New case study page", pageUrl: "/case-studies" },
      ],
    },
    {
      title: "Rewrite your buttons with specific next steps",
      description: "Change 'Contact Us' to 'Get a quote in 24 hours' or 'Request sample parts.' Tell them exactly what happens when they click.",
      severity: 'info' as const,
      effort: "easy" as const,
      expandType: "buttons" as const,
      findings: [
        { phrase: "Contact Us", problem: "Vague CTA with no expectation set", rewrite: "Get a quote in 24 hours →", location: "All pages - primary button", pageUrl: "/" },
        { phrase: "Contact Us", problem: "Only high-commitment option available", rewrite: "Request sample parts → (low commitment alternative)", location: "Services pages", pageUrl: "/services" },
      ],
    },
    {
      title: "Add industry-specific landing pages",
      description: "Create dedicated pages for aerospace, medical, and automotive with tailored messaging for each vertical.",
      severity: 'info' as const,
      effort: "hard" as const,
      findings: [
        { phrase: "[single generic services page]", problem: "Can't speak directly to specific industry pain points", rewrite: "Dedicated /medical-devices page with FDA language, compliance focus, and medical-specific case studies", location: "New page needed", pageUrl: "/services" },
      ],
    },
    {
      title: "Surface your best project photos on homepage",
      description: "Your project pages have specific machinery shots. Move 3-4 of the most impressive to your homepage hero or a 'Recent work' section.",
      severity: 'info' as const,
      effort: "easy" as const,
      findings: [
        { phrase: "[stock imagery on homepage]", problem: "Generic photos don't build trust", rewrite: "Use the precision part photos from your Projects page in a homepage gallery", location: "Homepage hero section", pageUrl: "/" },
      ],
    },
    {
      title: "Add a 'How we work' process section",
      description: "Walk prospects through your process from quote to delivery. Reduces anxiety about what happens after they click 'Contact.'",
      severity: 'info' as const,
      effort: "medium" as const,
      findings: [
        { phrase: "[no process explanation]", problem: "Visitors don't know what to expect", rewrite: "Step 1: Send your specs → Step 2: Quote in 24 hours → Step 3: Approval → Step 4: Production → Step 5: Delivery with documentation", location: "Homepage - add section", pageUrl: "/" },
      ],
    },
    {
      title: "Create a pricing guidance page",
      description: "You don't need to list prices. Just explain how pricing works, what affects cost, and what to expect. This filters tire-kickers and builds trust.",
      severity: 'info' as const,
      effort: "medium" as const,
      findings: [
        { phrase: "[no pricing information]", problem: "Prospects wonder if they can afford you, leave without asking", rewrite: "Pricing depends on: material, tolerances, quantity, lead time. Typical projects range from $X-$Y. Get a quote in 24 hours.", location: "New pricing page", pageUrl: "/pricing" },
      ],
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
      quote: "[Pick your strongest customer quote - one that mentions a specific result or problem you solved. If you don't have one, ask your best customer for a 2-sentence testimonial.]",
      attribution: "- [Title], [Company name]",
    },
  },

  // Ideal customer definition
  customerDefinition: {
    intro: "Based on your testimonials and client list, here's a draft ideal customer profile. Refine each field to match your reality:",
    definition: {
      companyType: "[Based on your testimonials: most seem to be medical device manufacturers - is that accurate? What type specifically?]",
      size: "[What's the typical revenue range and employee count of your best customers?]",
      situation: "[What problem or situation triggers them to look for you? What pain brought your best customers to you?]",
      whyYou: "[Why do they choose YOU over competitors? What do they value most?]",
    },
    homepageCopy: "[Once you fill in the above, I can help you write homepage copy that speaks directly to this customer. For now, here's a template:]\n\nWe [what you do] for [your ideal customer type] who [their situation/pain]. If you're [qualifying criteria], we should talk.",
  },

  // Why us differentiators
  whyUsCopy: {
    intro: "We found this on your About page: 'Our average machinist has been with us 12 years.' That's a real differentiator - most shops have high turnover. Here's how to turn hidden proof points like this into a 'Why Us' section:",
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
        subtext: "[Defect rate, rejection rate, first-pass yield - whatever you track]",
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
      quote: "\"[Client quote about specific result or experience]\" - [Name], [Title], [Company]",
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
