'use client'

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

type ViewType = 'overview' | 'message' | 'audience' | 'trust' | 'copy'

type ViewDef = {
  id: ViewType
  label: string
  description: string
}

type ScoreEntry = {
  score: number
  label: string
  question: string
  factors: { factor: string; score: number; max: number; note: string }[]
  evidence: string[]
  howToImprove: string[]
  suggestedCopy: string
}

type Finding = {
  phrase: string
  location: string
  rewrite: string
  problem: string
}

type Issue = {
  title: string
  description: string
  effort: 'easy' | 'medium' | 'hard'
  featured?: boolean
  findings?: Finding[]
  expandType?: string
}

type SuggestedHeadline = { headline: string; rationale: string }
type TrustBarTestimonial = { quote: string; attribution: string }
type TrustBarCopy = { intro: string; html: string; testimonial: TrustBarTestimonial }
type CustomerDefinition = {
  intro: string
  definition: { companyType: string; size: string; situation: string; whyYou: string }
  homepageCopy: string
}
type WhyUsDifferentiator = { headline: string; subtext: string; note?: string }
type WhyUsCopy = { intro: string; differentiators: WhyUsDifferentiator[] }
type CaseStudyTemplate = {
  intro: string
  template: { title: string; challenge: string; approach: string; results: string[]; quote: string }
}
type ButtonOption = { text: string; rationale: string }
type ButtonAlternatives = { intro: string; primary: ButtonOption[]; secondary: ButtonOption[] }

type OverviewViewProps = {
  isPaid: boolean
  showAllViews: boolean
  onUnlock: () => void
  onViewChange: (view: ViewType) => void
  expandedAction: number | null
  onActionExpand: (priority: number) => void
  onScoreCardClick: (key: string) => void
  views: ViewDef[]
  viewIcons: Record<ViewType, React.ReactNode>
  topIssues: Issue[]
  scores: Record<string, ScoreEntry>
  suggestedHeadlines: SuggestedHeadline[]
  trustBarCopy: TrustBarCopy
  customerDefinition: CustomerDefinition
  whyUsCopy: WhyUsCopy
  caseStudyTemplate: CaseStudyTemplate
  buttonAlternatives: ButtonAlternatives
}

export function OverviewView({
  isPaid,
  showAllViews,
  onUnlock,
  onViewChange,
  expandedAction,
  onActionExpand,
  onScoreCardClick,
  views,
  viewIcons,
  topIssues,
  scores,
  suggestedHeadlines,
  trustBarCopy,
  customerDefinition,
  whyUsCopy,
  caseStudyTemplate,
  buttonAlternatives,
}: OverviewViewProps) {
  return (
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
                  onClick={() => onViewChange(view.id)}
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
            {topIssues.map((issue, index) => {
              const priority = index + 1
              return (
              <div
                key={priority}
                className={`action-card ${issue.featured ? 'featured' : ''}`}
              >
                <div
                  className="flex flex-col md:flex-row md:items-start gap-4 cursor-pointer"
                  onClick={() => onActionExpand(priority)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-[var(--accent)] shrink-0 w-12">
                      {String(priority).padStart(2, '0')}
                    </span>
                    {issue.featured && (
                      <span className="bg-[var(--accent)] text-white text-xs font-bold uppercase tracking-wider px-3 py-1">
                        Start here
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-subsection">{issue.title}</h3>
                      <span className={`effort-tag effort-${issue.effort}`}>
                        {issue.effort === 'easy' && '🟢'}
                        {issue.effort === 'medium' && '🟡'}
                        {issue.effort === 'hard' && '🔴'}
                        {issue.effort}
                      </span>
                      {(issue.findings && issue.findings.length > 0 || issue.expandType) && (
                        <span className="text-xs text-[var(--accent)] font-semibold">
                          {expandedAction === priority ? '' : '↓ See copy you can use'}
                        </span>
                      )}
                    </div>
                    <p className="text-body text-[var(--muted-foreground)]">{issue.description}</p>
                  </div>
                </div>

                {/* Expanded content - show findings first, then expandType bonus content */}
                {(issue.findings && issue.findings.length > 0 || issue.expandType) && (
                  <div className={`overflow-hidden transition-all duration-200 ease-in-out ${expandedAction === priority ? 'max-h-[5000px] opacity-100 mt-6 pt-6 border-t-2 border-[var(--border)]' : 'max-h-0 opacity-0'}`}>

                    {/* Findings - matching preview page format */}
                    {issue.findings && issue.findings.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs font-bold text-[var(--accent)] mb-4 uppercase tracking-wide">
                          Copy-paste fixes ({issue.findings.length} option{issue.findings.length !== 1 ? 's' : ''}):
                        </p>
                        <div className="space-y-4">
                          {issue.findings.map((finding, findingIndex) => (
                            <div key={findingIndex} className="border-2 border-[var(--border)] rounded-lg overflow-hidden">
                              <div className="grid md:grid-cols-2 gap-0">
                                <div className="p-4 bg-red-50 border-r border-[var(--border)]">
                                  <p className="text-xs font-bold text-red-600 mb-2">❌ CURRENT</p>
                                  <p className="text-sm text-[var(--foreground)]">{finding.phrase}</p>
                                  <p className="text-xs text-[var(--muted-foreground)] mt-2">{finding.location}</p>
                                </div>
                                <div className="p-4 bg-green-50">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold text-green-600">✓ SUGGESTED</p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        navigator.clipboard.writeText(finding.rewrite)
                                      }}
                                      className="text-xs text-[var(--accent)] hover:underline font-semibold"
                                    >
                                      Copy →
                                    </button>
                                  </div>
                                  <p className="text-sm font-medium text-[var(--foreground)]">{finding.rewrite}</p>
                                  <p className="text-xs text-[var(--muted-foreground)] mt-2 italic">{finding.problem}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional expandType content (bonus detail) */}
                    {/* Headlines */}
                    {issue.expandType === 'headlines' && (
                      <>
                        <h4 className="text-subsection mb-4">10 headlines you could use today</h4>
                        <div className="grid gap-3">
                          {suggestedHeadlines.map((h, i) => (
                            <div key={i} className="bg-white p-4 border-l-4 border-[var(--accent)]">
                              <p className="font-semibold text-lg mb-1">"{h.headline}"</p>
                              <p className="text-sm text-[var(--muted-foreground)]">{h.rationale}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Credibility strip */}
                    {issue.expandType === 'trustbar' && (
                      <>
                        <h4 className="text-subsection mb-4">{trustBarCopy.intro}</h4>
                        <div className="bg-[var(--muted)] p-4 font-mono text-sm mb-6 overflow-x-auto">
                          <pre>{trustBarCopy.html}</pre>
                        </div>
                        <h4 className="text-subsection mb-4">Plus, add this testimonial</h4>
                        <div className="bg-white p-6 border-l-4 border-[var(--accent)]">
                          <p className="text-lg italic mb-2">"{trustBarCopy.testimonial.quote}"</p>
                          <p className="text-sm text-[var(--muted-foreground)]">{trustBarCopy.testimonial.attribution}</p>
                        </div>
                      </>
                    )}

                    {/* Ideal Customer */}
                    {issue.expandType === 'customer' && (
                      <>
                        <h4 className="text-subsection mb-4">{customerDefinition.intro}</h4>
                        <div className="grid gap-4 mb-6">
                          <div className="bg-white p-4 border-l-4 border-[var(--accent)]">
                            <p className="text-label mb-1">Company type</p>
                            <p className="text-body">{customerDefinition.definition.companyType}</p>
                          </div>
                          <div className="bg-white p-4 border-l-4 border-[var(--accent)]">
                            <p className="text-label mb-1">Size & structure</p>
                            <p className="text-body">{customerDefinition.definition.size}</p>
                          </div>
                          <div className="bg-white p-4 border-l-4 border-[var(--accent)]">
                            <p className="text-label mb-1">Their situation</p>
                            <p className="text-body">{customerDefinition.definition.situation}</p>
                          </div>
                          <div className="bg-white p-4 border-l-4 border-[var(--accent)]">
                            <p className="text-label mb-1">Why they need you</p>
                            <p className="text-body">{customerDefinition.definition.whyYou}</p>
                          </div>
                        </div>
                        <h4 className="text-subsection mb-4">Homepage copy that speaks to this customer</h4>
                        <div className="bg-[var(--muted)] p-4 border-l-4 border-[var(--success)]">
                          <p className="text-body font-medium">{customerDefinition.homepageCopy}</p>
                        </div>
                      </>
                    )}

                    {/* Why Us */}
                    {issue.expandType === 'whyus' && (
                      <>
                        <h4 className="text-subsection mb-4">{whyUsCopy.intro}</h4>
                        <div className="grid gap-4">
                          {whyUsCopy.differentiators.map((d, i) => (
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
                    {issue.expandType === 'casestudy' && (
                      <>
                        <h4 className="text-subsection mb-4">{caseStudyTemplate.intro}</h4>
                        <div className="bg-white p-6 border-2 border-[var(--border)] space-y-4">
                          <div>
                            <p className="text-label mb-1">Title</p>
                            <p className="text-xl font-semibold">{caseStudyTemplate.template.title}</p>
                          </div>
                          <div>
                            <p className="text-label mb-1">The challenge</p>
                            <p className="text-body">{caseStudyTemplate.template.challenge}</p>
                          </div>
                          <div>
                            <p className="text-label mb-1">Our approach</p>
                            <p className="text-body">{caseStudyTemplate.template.approach}</p>
                          </div>
                          <div>
                            <p className="text-label mb-1">Results</p>
                            <ul className="list-disc list-inside text-body">
                              {caseStudyTemplate.template.results.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-[var(--muted)] p-4 mt-4">
                            <p className="text-body italic">{caseStudyTemplate.template.quote}</p>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Buttons */}
                    {issue.expandType === 'buttons' && (
                      <>
                        <h4 className="text-subsection mb-4">{buttonAlternatives.intro}</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-label mb-3">PRIMARY BUTTONS (high commitment)</p>
                            <div className="space-y-3">
                              {buttonAlternatives.primary.map((btn, i) => (
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
                              {buttonAlternatives.secondary.map((btn, i) => (
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
                        onActionExpand(priority)
                      }}
                      className="mt-6 pt-4 border-t border-[var(--border)] w-full text-center text-sm text-[var(--accent)] hover:text-[var(--accent)]/80 font-semibold"
                    >
                      ↑ Collapse
                    </button>
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* Scores at a Glance */}
      <section id="scores" className="section section-alt">
        <div className="container">
          <h2 className="text-section mb-4">Where you stand</h2>
          <div className="callout mb-8">
            <p className="text-body">
              <strong>A note on scoring:</strong> A perfect 10 is nearly theoretical - it would mean flawless messaging with zero room for improvement. That's not the goal. These scores are a <strong>prioritization rubric</strong> to show where changes will have the most impact. Focus on the lowest scores first.
            </p>
          </div>
          <p className="text-body-lg mb-8 max-w-3xl">
            Click any card to see exactly how the score was calculated, what we found on your site, and specific copy you can use.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(scores).map(([key, scoreData]) => {
              const color = getScoreColor(scoreData.score)
              const bgTint = color === 'excellent' ? 'bg-green-50' : color === 'moderate' ? 'bg-amber-50' : 'bg-red-50'
              return (
                <button
                  key={key}
                  onClick={() => onScoreCardClick(key)}
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
              onClick={() => onViewChange('message')}
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
  )
}
