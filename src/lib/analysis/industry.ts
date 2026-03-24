import { CrawledPage } from '../crawler'

export type Industry = 'saas' | 'manufacturing' | 'services' | 'ecommerce' | 'general'

/** Detect industry from content to provide appropriate examples */
export function detectIndustry(pages: CrawledPage[], siteUrl: string): Industry {
  const allContent = pages.map(p => p.content.toLowerCase()).join(' ')

  // SaaS indicators
  const saasTerms = ['saas', 'software', 'platform', 'app', 'dashboard', 'api', 'integration', 'subscription', 'pricing plans', 'free trial', 'demo', 'onboarding', 'user', 'login', 'sign up', 'cloud', 'workflow', 'automation', 'analytics']
  const saasScore = saasTerms.filter(t => allContent.includes(t)).length

  // Manufacturing indicators
  const mfgTerms = ['cnc', 'machining', 'fabrication', 'manufacturing', 'parts', 'prototype', 'tolerance', 'precision', 'metal', 'welding', 'iso 9001', 'as9100', 'equipment', 'facility']
  const mfgScore = mfgTerms.filter(t => allContent.includes(t)).length

  // Services indicators
  const servicesTerms = ['consulting', 'services', 'solutions', 'agency', 'firm', 'contractor', 'project management', 'strategy', 'advisory']
  const servicesScore = servicesTerms.filter(t => allContent.includes(t)).length

  // E-commerce indicators
  const ecomTerms = ['shop', 'cart', 'checkout', 'buy now', 'add to cart', 'shipping', 'free shipping', 'product', 'order', 'store']
  const ecomScore = ecomTerms.filter(t => allContent.includes(t)).length

  // Pick highest scoring
  const scores = { saas: saasScore, manufacturing: mfgScore, services: servicesScore, ecommerce: ecomScore }
  const maxScore = Math.max(...Object.values(scores))

  if (maxScore < 3) return 'general'
  if (saasScore === maxScore) return 'saas'
  if (mfgScore === maxScore) return 'manufacturing'
  if (servicesScore === maxScore) return 'services'
  if (ecomScore === maxScore) return 'ecommerce'
  return 'general'
}

/** Get industry-appropriate rewrite examples */
export function getIndustryRewrites(industry: Industry): Record<string, { problem: string; rewrite: string }> {
  // SaaS-specific rewrites
  if (industry === 'saas') {
    return {
      'quality craftsmanship': {
        problem: 'Every competitor claims quality - it\'s meaningless without proof',
        rewrite: 'Try: "99.99% uptime SLA" or "Trusted by 2,400+ teams including Spotify and Dropbox"'
      },
      'customer-focused': {
        problem: 'Empty claim that says nothing specific',
        rewrite: 'Try: "Average response time: 4 minutes" or "Dedicated CSM for accounts over $10k ARR"'
      },
      'innovative solutions': {
        problem: 'Buzzword without substance',
        rewrite: 'Try: "We shipped 47 features last quarter based on customer requests" or name a specific capability'
      },
      'dedicated team': {
        problem: 'Every company has a team - what makes yours different?',
        rewrite: 'Try: "22 engineers, 8 from Google/Meta/Apple" or "Average tenure: 4 years"'
      },
      'proven track record': {
        problem: 'Track record claim without the track record',
        rewrite: 'Try: "10M+ workflows automated since 2019" or "Helping 850 companies save 12 hours/week"'
      },
      'committed to excellence': {
        problem: 'Generic statement every company makes',
        rewrite: 'Try: "SOC 2 Type II certified. GDPR compliant. 256-bit encryption at rest and in transit."'
      },
      'industry-leading': {
        problem: 'Unverifiable claim that prospects ignore',
        rewrite: 'Try: "#1 on G2 for ease of use" or "Named a Gartner Cool Vendor 2024"'
      },
      'best-in-class': {
        problem: 'Superlative without evidence',
        rewrite: 'Try: "4.8/5 average rating across 2,000+ reviews" or cite specific benchmark data'
      },
      'world-class': {
        problem: 'Meaningless claim - what does world-class mean?',
        rewrite: 'Try: "Teams in 40 countries trust us" or "12 language localization built in"'
      },
      'cutting-edge': {
        problem: 'Tech buzzword that says nothing',
        rewrite: 'Try: "AI-powered insights that save you 3 hours daily" or name your actual technology'
      },
      'state-of-the-art': {
        problem: 'Overused phrase that prospects tune out',
        rewrite: 'Try: "Built on AWS with auto-scaling to handle 10M requests/day" or be specific about your stack'
      },
      'exceeding expectations': {
        problem: 'Vague promise with no specifics',
        rewrite: 'Try: "91% customer retention rate" or "NPS score of 72 (industry avg: 41)"'
      },
      'passionate about': {
        problem: 'Emotional claim that can\'t be verified',
        rewrite: 'Try: "We use our own product every day - here\'s our public roadmap" or show don\'t tell'
      },
      'your trusted partner': {
        problem: 'Trust must be earned through proof, not claimed',
        rewrite: 'Try: "Average customer has been with us 3.2 years" or "Zero data breaches since founding"'
      },
    }
  }

  // Services-specific rewrites
  if (industry === 'services') {
    return {
      'quality craftsmanship': {
        problem: 'Every competitor claims quality - it\'s meaningless without proof',
        rewrite: 'Try: "94% of clients renew their contracts" or "Average engagement: 2.3 years"'
      },
      'customer-focused': {
        problem: 'Empty claim that says nothing specific',
        rewrite: 'Try: "Weekly status calls. Monthly reports. Quarterly reviews." or "24/7 emergency hotline"'
      },
      'innovative solutions': {
        problem: 'Buzzword without substance',
        rewrite: 'Try: "We developed a proprietary methodology that reduced client costs 23%" or name it'
      },
      'dedicated team': {
        problem: 'Every company has a team - what makes yours different?',
        rewrite: 'Try: "15 consultants with avg 12 years experience" or "Former executives from [industry leaders]"'
      },
      'proven track record': {
        problem: 'Track record claim without the track record',
        rewrite: 'Try: "340 projects completed. $47M saved for clients." or "Serving Fortune 500 since 2008"'
      },
      'committed to excellence': {
        problem: 'Generic statement every company makes',
        rewrite: 'Try: "Every deliverable goes through 3-stage QA. Every deadline is contractual."'
      },
      'industry-leading': {
        problem: 'Unverifiable claim that prospects ignore',
        rewrite: 'Try: "Ranked #3 consulting firm in [region] by [publication]" or cite awards'
      },
      'best-in-class': {
        problem: 'Superlative without evidence',
        rewrite: 'Try: "Our clients see 3.2x ROI within 12 months" or show case study data'
      },
      'world-class': {
        problem: 'Meaningless claim - what does world-class mean?',
        rewrite: 'Try: "Clients in 18 countries" or "Certified in [relevant certifications]"'
      },
      'cutting-edge': {
        problem: 'Tech buzzword that says nothing',
        rewrite: 'Try: "We integrate with your existing tech stack - Salesforce, HubSpot, SAP" or be specific'
      },
      'state-of-the-art': {
        problem: 'Overused phrase that prospects tune out',
        rewrite: 'Try: "Using the same frameworks as McKinsey and BCG" or cite your actual methodology'
      },
      'exceeding expectations': {
        problem: 'Vague promise with no specifics',
        rewrite: 'Try: "87% of projects delivered early. Zero budget overruns in 5 years." or be specific'
      },
      'passionate about': {
        problem: 'Emotional claim that can\'t be verified',
        rewrite: 'Try: "Our team has published 14 books on [topic]" or show your thought leadership'
      },
      'your trusted partner': {
        problem: 'Trust must be earned through proof, not claimed',
        rewrite: 'Try: "78% of business comes from referrals" or "Average client relationship: 6 years"'
      },
    }
  }

  // Manufacturing-specific (original) or default
  return {
    'quality craftsmanship': {
      problem: 'Every competitor claims quality - it\'s meaningless without proof',
      rewrite: 'Try: "47 machinists with an average tenure of 12 years" or "0.02% defect rate across 10,000 parts"'
    },
    'customer-focused': {
      problem: 'Empty claim that says nothing specific',
      rewrite: 'Try: "Your dedicated project manager responds within 2 hours" or "93% of business from referrals"'
    },
    'innovative solutions': {
      problem: 'Buzzword without substance',
      rewrite: 'Try: "We developed custom fixturing that cut your setup time 40%" or name a specific innovation'
    },
    'dedicated team': {
      problem: 'Every company has a team - what makes yours different?',
      rewrite: 'Try: "Average employee tenure: 8 years" or "3 engineers with 60+ years combined experience"'
    },
    'proven track record': {
      problem: 'Track record claim without the track record',
      rewrite: 'Try: "2,400 projects delivered since 2005" or "Zero safety incidents in 15 years"'
    },
    'committed to excellence': {
      problem: 'Generic statement every company makes',
      rewrite: 'Try: "Every part inspected. Every tolerance documented. Every deadline met."'
    },
    'industry-leading': {
      problem: 'Unverifiable claim that prospects ignore',
      rewrite: 'Try: "First in the region to offer 5-axis capability" or cite an industry award'
    },
    'best-in-class': {
      problem: 'Superlative without evidence',
      rewrite: 'Try: "0.02% defect rate vs. industry average of 0.5%" or show a specific comparison'
    },
    'world-class': {
      problem: 'Meaningless claim - what does world-class mean?',
      rewrite: 'Try: "ISO 9001 and AS9100 certified" or "Serving aerospace clients in 12 countries"'
    },
    'cutting-edge': {
      problem: 'Tech buzzword that says nothing',
      rewrite: 'Try: "5-axis CNC with 0.0001 inch positioning accuracy" or name your actual equipment'
    },
    'state-of-the-art': {
      problem: 'Overused phrase that prospects tune out',
      rewrite: 'Try: "$2M invested in new equipment since 2020" or list specific machines'
    },
    'exceeding expectations': {
      problem: 'Vague promise with no specifics',
      rewrite: 'Try: "98% on-time delivery for 5 years running" or "Average project comes in 3 days early"'
    },
    'passionate about': {
      problem: 'Emotional claim that can\'t be verified',
      rewrite: 'Try: "Our machinists average 12 years tenure - they chose this career" or show don\'t tell'
    },
    'your trusted partner': {
      problem: 'Trust must be earned through proof, not claimed',
      rewrite: 'Try: "Average client relationship: 8 years" or "Founded in 1985, same ownership since day one"'
    },
  }
}
