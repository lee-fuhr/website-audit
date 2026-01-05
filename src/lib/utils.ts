/**
 * Utility functions for the Website Audit Tool
 */

/**
 * Known company name mappings (domain → proper name)
 * Add common companies that need special formatting
 */
const KNOWN_COMPANIES: Record<string, string> = {
  // Tech giants
  'hubspot': 'HubSpot',
  'salesforce': 'Salesforce',
  'zendesk': 'Zendesk',
  'mailchimp': 'Mailchimp',
  'linkedin': 'LinkedIn',
  'youtube': 'YouTube',
  'github': 'GitHub',
  'gitlab': 'GitLab',
  'bitbucket': 'Bitbucket',
  'stackoverflow': 'Stack Overflow',
  'wordpress': 'WordPress',
  'shopify': 'Shopify',
  'squarespace': 'Squarespace',
  'wix': 'Wix',
  'webflow': 'Webflow',
  'godaddy': 'GoDaddy',
  'namecheap': 'Namecheap',
  'cloudflare': 'Cloudflare',
  'digitalocean': 'DigitalOcean',
  'linode': 'Linode',
  'heroku': 'Heroku',
  'netlify': 'Netlify',
  'vercel': 'Vercel',
  'mongodb': 'MongoDB',
  'postgresql': 'PostgreSQL',
  'mysql': 'MySQL',
  'redis': 'Redis',
  'elasticsearch': 'Elasticsearch',
  'datadog': 'Datadog',
  'newrelic': 'New Relic',
  'pagerduty': 'PagerDuty',
  'twilio': 'Twilio',
  'sendgrid': 'SendGrid',
  'stripe': 'Stripe',
  'paypal': 'PayPal',
  'braintree': 'Braintree',
  'plaid': 'Plaid',
  'intercom': 'Intercom',
  'drift': 'Drift',
  'freshdesk': 'Freshdesk',
  'helpscout': 'Help Scout',
  'hootsuite': 'Hootsuite',
  'buffer': 'Buffer',
  'sproutsocial': 'Sprout Social',
  'airtable': 'Airtable',
  'notion': 'Notion',
  'asana': 'Asana',
  'monday': 'Monday.com',
  'clickup': 'ClickUp',
  'basecamp': 'Basecamp',
  'trello': 'Trello',
  'jira': 'Jira',
  'confluence': 'Confluence',
  'slack': 'Slack',
  'discord': 'Discord',
  'zoom': 'Zoom',
  'webex': 'WebEx',
  'gotomeeting': 'GoToMeeting',
  'dropbox': 'Dropbox',
  'box': 'Box',
  'onedrive': 'OneDrive',
  'google': 'Google',
  'microsoft': 'Microsoft',
  'apple': 'Apple',
  'amazon': 'Amazon',
  'facebook': 'Facebook',
  'meta': 'Meta',
  'twitter': 'Twitter',
  'instagram': 'Instagram',
  'tiktok': 'TikTok',
  'snapchat': 'Snapchat',
  'pinterest': 'Pinterest',
  'reddit': 'Reddit',
  'quora': 'Quora',
  'medium': 'Medium',
  'substack': 'Substack',
  'convertkit': 'ConvertKit',
  'activecampaign': 'ActiveCampaign',
  'klaviyo': 'Klaviyo',
  'marketo': 'Marketo',
  'pardot': 'Pardot',
  'eloqua': 'Eloqua',

  // Manufacturing / Industrial
  'johndeere': 'John Deere',
  'deere': 'John Deere',
  'caterpillar': 'Caterpillar',
  'komatsu': 'Komatsu',
  'bobcat': 'Bobcat',
  'kubota': 'Kubota',
  'case': 'Case',
  'caseih': 'Case IH',
  'newholland': 'New Holland',
  'agco': 'AGCO',
  'claas': 'CLAAS',
  'fendt': 'Fendt',
  'masseyferguson': 'Massey Ferguson',
  'valtra': 'Valtra',
  'jcb': 'JCB',
  'volvo': 'Volvo',
  'hitachi': 'Hitachi',
  'kobelco': 'Kobelco',
  'liebherr': 'Liebherr',
  'terex': 'Terex',
  'manitou': 'Manitou',
  'doosan': 'Doosan',
  'hyundai': 'Hyundai',
  'toyota': 'Toyota',
  'honda': 'Honda',
  'ford': 'Ford',
  'gm': 'GM',
  'chevrolet': 'Chevrolet',
  'bmw': 'BMW',
  'mercedes': 'Mercedes-Benz',
  'audi': 'Audi',
  'porsche': 'Porsche',
  'volkswagen': 'Volkswagen',
  'tesla': 'Tesla',
  'rivian': 'Rivian',
  'lucid': 'Lucid',

  // Consulting / Services
  'mckinsey': 'McKinsey',
  'bain': 'Bain',
  'bcg': 'BCG',
  'deloitte': 'Deloitte',
  'pwc': 'PwC',
  'ey': 'EY',
  'kpmg': 'KPMG',
  'accenture': 'Accenture',
  'ibm': 'IBM',
  'oracle': 'Oracle',
  'sap': 'SAP',
  'workday': 'Workday',
  'servicenow': 'ServiceNow',
  'splunk': 'Splunk',
  'tableau': 'Tableau',
  'snowflake': 'Snowflake',
  'databricks': 'Databricks',
  'palantir': 'Palantir',

  // Other common brands
  'nike': 'Nike',
  'adidas': 'Adidas',
  'puma': 'Puma',
  'underarmour': 'Under Armour',
  'lululemon': 'Lululemon',
  'patagonia': 'Patagonia',
  'northface': 'The North Face',
  'rei': 'REI',
  'walmart': 'Walmart',
  'target': 'Target',
  'costco': 'Costco',
  'kroger': 'Kroger',
  'wholefood': 'Whole Foods',
  'traderjoes': 'Trader Joe\'s',
  'homedepot': 'Home Depot',
  'lowes': 'Lowe\'s',
  'ikea': 'IKEA',
  'wayfair': 'Wayfair',
  'etsy': 'Etsy',
  'ebay': 'eBay',
  'alibaba': 'Alibaba',
  'aliexpress': 'AliExpress',
  'wish': 'Wish',
}

/**
 * Words that should remain lowercase in titles (except when first/last)
 */
const LOWERCASE_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at',
  'to', 'from', 'by', 'of', 'in', 'with', 'as'
])

/**
 * Words/patterns that indicate acronyms (should be all caps)
 */
const ACRONYM_PATTERNS = [
  /^[A-Z]{2,}$/, // Already uppercase
  /^(ai|api|aws|b2b|b2c|crm|erp|hr|hvac|iot|it|llc|roi|saas|seo|sms|ui|ux|vpn|www)$/i,
]

/**
 * Format a company name from a domain name
 * e.g., "johndeere" → "John Deere", "hubspot" → "HubSpot"
 */
export function formatCompanyName(input: string): string {
  if (!input) return input

  // Clean the input - remove protocol, www, and TLD
  let name = input
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('.')[0] // Remove TLD
    .replace(/[_-]/g, ' ') // Convert separators to spaces
    .trim()

  // Check known companies first (exact match)
  const knownName = KNOWN_COMPANIES[name.replace(/\s+/g, '').toLowerCase()]
  if (knownName) return knownName

  // If no spaces and longer than 3 chars, try to detect word boundaries
  if (!name.includes(' ') && name.length > 3) {
    // Try common word boundary patterns
    name = name
      // CamelCase detection (lowercase followed by uppercase)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Number boundaries
      .replace(/([a-z])(\d)/g, '$1 $2')
      .replace(/(\d)([a-z])/g, '$1 $2')
  }

  // Title case each word
  const words = name.split(/\s+/)
  const formatted = words.map((word, index) => {
    // Check if it's an acronym
    for (const pattern of ACRONYM_PATTERNS) {
      if (pattern.test(word)) {
        return word.toUpperCase()
      }
    }

    // Keep certain words lowercase (unless first or last)
    if (index > 0 && index < words.length - 1 && LOWERCASE_WORDS.has(word.toLowerCase())) {
      return word.toLowerCase()
    }

    // Standard title case
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  })

  return formatted.join(' ')
}

/**
 * Format a URL's hostname for display
 * e.g., "https://www.johndeere.com/path" → "John Deere"
 */
export function formatHostnameAsCompany(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    return formatCompanyName(hostname)
  } catch {
    return formatCompanyName(url)
  }
}

/**
 * Safe clipboard write with fallback for insecure contexts
 */
export async function safeClipboardWrite(text: string): Promise<{ success: boolean; fallback?: boolean }> {
  // Try modern clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return { success: true }
    } catch (err) {
      console.warn('Clipboard API failed:', err)
    }
  }

  // Fallback: execCommand (deprecated but works in more contexts)
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '-9999px'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    const success = document.execCommand('copy')
    document.body.removeChild(textarea)

    if (success) {
      return { success: true, fallback: true }
    }
  } catch (err) {
    console.warn('execCommand fallback failed:', err)
  }

  return { success: false }
}

/**
 * Check if a site appears to be JavaScript-rendered (SPA)
 * Returns indicators that suggest the site may not crawl well
 */
export function detectSPAIndicators(html: string): {
  isSPA: boolean
  indicators: string[]
} {
  const indicators: string[] = []

  // Check for common SPA framework indicators
  if (html.includes('__NEXT_DATA__') || html.includes('_next/static')) {
    indicators.push('Next.js detected')
  }
  if (html.includes('ng-app') || html.includes('ng-controller') || html.includes('angular')) {
    indicators.push('Angular detected')
  }
  if (html.includes('data-reactroot') || html.includes('__REACT_DEVTOOLS') || html.includes('react-root')) {
    indicators.push('React detected')
  }
  if (html.includes('data-v-') || html.includes('Vue.js') || html.includes('__VUE__')) {
    indicators.push('Vue.js detected')
  }
  if (html.includes('ember-view') || html.includes('EmberENV')) {
    indicators.push('Ember detected')
  }

  // Check for empty/minimal body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch) {
    const bodyContent = bodyMatch[1]
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim()

    if (bodyContent.length < 200) {
      indicators.push('Minimal body content (likely JS-rendered)')
    }
  }

  // Check for noscript warnings
  if (html.includes('<noscript') && html.toLowerCase().includes('javascript')) {
    indicators.push('noscript warning present')
  }

  // Check for app root divs with no content
  if (html.match(/<div id="(app|root|__next)"[^>]*>\s*<\/div>/)) {
    indicators.push('Empty app root div')
  }

  return {
    isSPA: indicators.length >= 2 || indicators.some(i => i.includes('Minimal body')),
    indicators
  }
}

/**
 * Escape HTML to prevent XSS and broken markup
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
