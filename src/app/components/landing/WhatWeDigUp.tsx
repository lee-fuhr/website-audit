export function WhatWeDigUp() {
  return (
    <section className="px-4 md:px-8 lg:px-12 py-20 md:py-28 bg-[var(--muted)]">
      <div className="max-w-6xl mx-auto">
        <p className="text-label mb-4">WHAT WE DIG UP</p>
        <h2 className="text-section text-4xl md:text-5xl lg:text-6xl mb-12">
          Your best stories are already there.
          <br />
          <span className="text-[var(--foreground)]">Buried where no buyer will find them.</span>
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-[var(--background)] p-6 border-l-4 border-[var(--accent)]">
            <p className="text-[var(--accent)] text-sm font-bold mb-2">TESTIMONIALS</p>
            <p className="text-section text-xl mb-3">Hidden on page 47</p>
            <p className="text-body">That glowing quote from your biggest client? Buried in a case study nobody reads. We find it and show you where to surface it.</p>
          </div>

          <div className="bg-[var(--background)] p-6 border-l-4 border-[var(--accent)]">
            <p className="text-[var(--accent)] text-sm font-bold mb-2">SPECIFICS</p>
            <p className="text-section text-xl mb-3">The numbers that prove it</p>
            <p className="text-body">Project counts, completion rates, dollar figures - the proof is in your project descriptions. We extract it for headlines.</p>
          </div>

          <div className="bg-[var(--background)] p-6 border-l-4 border-[var(--accent)]">
            <p className="text-[var(--accent)] text-sm font-bold mb-2">DIFFERENTIATORS</p>
            <p className="text-section text-xl mb-3">What makes you actually different</p>
            <p className="text-body">Your process, your people, your track record. We find the real differences hiding in your LinkedIn posts and project pages.</p>
          </div>

          <div className="bg-[var(--background)] p-6 border-l-4 border-[var(--accent)]">
            <p className="text-[var(--accent)] text-sm font-bold mb-2">CLAIMS</p>
            <p className="text-section text-xl mb-3">Provable statements</p>
            <p className="text-body">&ldquo;Quality work&rdquo; is a claim. &ldquo;Zero callbacks on 23 projects&rdquo; is proof. We turn your vague claims into specific proof.</p>
          </div>

          <div className="bg-[var(--background)] p-6 border-l-4 border-[var(--accent)]">
            <p className="text-[var(--accent)] text-sm font-bold mb-2">VOICE</p>
            <p className="text-section text-xl mb-3">How you actually talk</p>
            <p className="text-body">Your LinkedIn posts sound like you. Your website sounds like a brochure. We find your real voice and show you how to use it.</p>
          </div>

          <div className="bg-[var(--background)] p-6 border-l-4 border-[var(--accent)]">
            <p className="text-[var(--accent)] text-sm font-bold mb-2">GAPS</p>
            <p className="text-section text-xl mb-3">What&apos;s missing entirely</p>
            <p className="text-body">No pricing guidance? No process explanation? No credentials? We flag what buyers need that you&apos;re not providing.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
