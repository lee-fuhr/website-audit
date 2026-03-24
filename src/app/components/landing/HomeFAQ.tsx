export function HomeFAQ() {
  return (
    <section className="px-4 md:px-8 lg:px-12 py-20 md:py-28">
      <div className="max-w-3xl mx-auto">
        <p className="text-label mb-4 text-center">FREQUENTLY ASKED</p>
        <h2 className="text-section text-3xl md:text-4xl mb-12 text-center">Common questions</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-base mb-1">How long does the scan take?</h3>
            <p className="text-body text-sm text-[var(--muted-foreground)]">
              Usually 2-5 minutes depending on site size. We crawl multiple pages, check your LinkedIn, and analyze everything before showing results. You&apos;ll see a progress indicator.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-1">What kind of companies is this for?</h3>
            <p className="text-body text-sm text-[var(--muted-foreground)]">
              Manufacturers, contractors, and service companies that sell to other businesses. If you&apos;re competing on bids and losing to lesser competitors with better marketing, this is for you.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-1">What&apos;s a &ldquo;commodity phrase&rdquo;?</h3>
            <p className="text-body text-sm text-[var(--muted-foreground)]">
              Phrases like &ldquo;quality craftsmanship,&rdquo; &ldquo;customer-focused,&rdquo; &ldquo;innovative solutions.&rdquo; They feel safe. They&apos;re also invisible - buyers have read them 50 times this week. When everyone says the same thing, nobody says anything.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-1">How specific are the copy recommendations?</h3>
            <p className="text-body text-sm text-[var(--muted-foreground)]">
              Specific enough to use. If we find a testimonial buried on page 12, we&apos;ll tell you exactly which headline to replace with it. If your about page says &ldquo;experienced team,&rdquo; we&apos;ll hand you: &ldquo;147 projects. 12 repeat clients. Zero callbacks.&rdquo;
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-1">Do you scan competitor sites too?</h3>
            <p className="text-body text-sm text-[var(--muted-foreground)]">
              The full audit includes competitor comparison - we&apos;ll show you how your messaging stacks up against 2-3 competitors you name. See exactly where they&apos;re outpositioning you.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-1">What if we don&apos;t have a LinkedIn page?</h3>
            <p className="text-body text-sm text-[var(--muted-foreground)]">
              We&apos;ll still scan your website thoroughly. LinkedIn just gives us more material to work with - employee posts, company updates, engagement patterns. The more content you have, the more proof points we can extract.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-1">Is my data secure?</h3>
            <p className="text-body text-sm text-[var(--muted-foreground)]">
              We only scan publicly visible pages. We don&apos;t store your website content after analysis. The audit results are stored temporarily so you can access them, then deleted after 30 days.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
