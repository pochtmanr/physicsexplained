"use client";

/**
 * FIG.04c — annotated facsimile of the opening of "Zur Elektrodynamik
 * bewegter Körper" ("On the Electrodynamics of Moving Bodies"), Annalen der
 * Physik 17 (1905), p. 891 — the paper in which Einstein, age 26, working as
 * a Patent Office clerk in Bern, replaced the aether with two postulates.
 *
 * This is a stylised SVG. The "manuscript" is presented as a column of
 * monospace lines on a parchment-coloured background; the two postulates are
 * highlighted in cyan and magenta and pulled out into side annotations.
 * The famous opening sentence — "It is known that Maxwell's electrodynamics
 * — as usually understood at the present time — when applied to moving
 * bodies, leads to asymmetries which do not appear to be inherent in the
 * phenomena" — sets up the problem. The line "The introduction of a
 * 'luminiferous aether' will prove to be superfluous" is the rupture.
 *
 * Translations are Stachel's, from THE COLLECTED PAPERS OF ALBERT EINSTEIN
 * vol. 2 (Princeton, 1989). Pull-quote text is rendered crisply rather than
 * scanned, so the typography stays legible at any zoom.
 */

const W = 760;
const H = 460;

export function Einstein1905PaperScene() {
  return (
    <div className="w-full max-w-[820px] mx-auto p-3 bg-[#0A0C12] rounded-md">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Einstein 1905 — On the Electrodynamics of Moving Bodies, opening paragraph annotated with the two postulates."
        className="w-full h-auto"
      >
        <defs>
          <linearGradient id="parchment" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#f5ecd6" />
            <stop offset="100%" stopColor="#e6d8b3" />
          </linearGradient>
          <filter id="paper-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.30  0 0 0 0.10 0"
            />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>

        {/* page */}
        <rect x="40" y="20" width={W - 80} height={H - 40} fill="url(#parchment)" rx="3" />
        <rect x="40" y="20" width={W - 80} height={H - 40} fill="#000" opacity="0.05" rx="3" filter="url(#paper-noise)" />

        {/* journal header */}
        <text x={W / 2} y="50" textAnchor="middle" fontSize="11" fontFamily="ui-serif, Georgia, serif" fill="#5b4a2a" fontStyle="italic">
          Annalen der Physik · Bd. 17 · 1905 · S. 891
        </text>
        <line x1="80" y1="62" x2={W - 80} y2="62" stroke="#5b4a2a" strokeWidth="0.5" />

        {/* title */}
        <text x={W / 2} y="92" textAnchor="middle" fontSize="18" fontFamily="ui-serif, Georgia, serif" fill="#2a1f0d" fontWeight="700">
          ZUR ELEKTRODYNAMIK BEWEGTER KÖRPER
        </text>
        <text x={W / 2} y="112" textAnchor="middle" fontSize="11" fontFamily="ui-serif, Georgia, serif" fill="#3a2c14" fontStyle="italic">
          (On the Electrodynamics of Moving Bodies)
        </text>
        <text x={W / 2} y="130" textAnchor="middle" fontSize="11" fontFamily="ui-serif, Georgia, serif" fill="#3a2c14">
          von A. Einstein
        </text>

        {/* opening prose, paraphrased English */}
        <g fontFamily="ui-serif, Georgia, serif" fontSize="11" fill="#2a1f0d">
          <text x="80" y="166">
            It is known that Maxwell&rsquo;s electrodynamics &mdash; as usually
            understood at the present time &mdash; when
          </text>
          <text x="80" y="182">
            applied to moving bodies, leads to asymmetries which do not appear
            to be inherent in the phenomena.
          </text>
          <text x="80" y="206">
            Examples of this sort, together with the unsuccessful attempts to
            discover any motion of the
          </text>
          <text x="80" y="222">
            earth relatively to the &ldquo;light medium&rdquo;, suggest that
            the phenomena of electrodynamics as well as of
          </text>
          <text x="80" y="238">
            mechanics possess no properties corresponding to the idea of
            absolute rest.
          </text>
        </g>

        {/* The big rupture line — superfluous aether */}
        <rect x="74" y="252" width={W - 148} height="22" fill="#f4a23e" opacity="0.18" rx="2" />
        <text
          x="80"
          y="268"
          fontFamily="ui-serif, Georgia, serif"
          fontSize="11"
          fill="#2a1f0d"
          fontWeight="600"
          fontStyle="italic"
        >
          The introduction of a &ldquo;luminiferous aether&rdquo; will prove to be superfluous.
        </text>

        {/* postulate 1 — cyan */}
        <rect x="74" y="288" width={W - 148} height="38" fill="#4cc7ff" opacity="0.16" rx="2" />
        <text x="80" y="304" fontFamily="ui-serif, Georgia, serif" fontSize="11" fill="#0d2a3a" fontWeight="700">
          1. The laws by which the states of physical systems undergo change are
          not affected, whether
        </text>
        <text x="80" y="320" fontFamily="ui-serif, Georgia, serif" fontSize="11" fill="#0d2a3a" fontWeight="700">
          these changes of state be referred to the one or the other of two
          systems of co-ordinates in
        </text>
        <text x="80" y="336" fontFamily="ui-serif, Georgia, serif" fontSize="11" fill="#0d2a3a" fontWeight="700">
          uniform translatory motion.
        </text>

        {/* postulate 2 — magenta */}
        <rect x="74" y="346" width={W - 148} height="38" fill="#cc6edc" opacity="0.18" rx="2" />
        <text x="80" y="362" fontFamily="ui-serif, Georgia, serif" fontSize="11" fill="#3a0d34" fontWeight="700">
          2. Any ray of light moves in the &ldquo;stationary&rdquo; system of
          co-ordinates with the determined
        </text>
        <text x="80" y="378" fontFamily="ui-serif, Georgia, serif" fontSize="11" fill="#3a0d34" fontWeight="700">
          velocity c, whether the ray be emitted by a stationary or by a moving
          body.
        </text>

        {/* signature line */}
        <text x={W / 2} y={H - 36} textAnchor="middle" fontFamily="ui-serif, Georgia, serif" fontSize="10" fill="#5b4a2a" fontStyle="italic">
          Bern, June 30, 1905. — A. Einstein, Patent Office (Third Class).
        </text>

        {/* annotations on the right margin — done OUTSIDE the page in dark UI colour */}
        <g fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="9" fill="#9aa3b2">
          <text x="20" y="263">[the rupture]</text>
          <line x1="60" y1="260" x2="78" y2="260" stroke="#f4a23e" strokeWidth="1" />
        </g>
        <g fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="9" fill="#4cc7ff">
          <text x="20" y="316">postulate 1</text>
          <text x="20" y="328">(relativity)</text>
          <line x1="60" y1="314" x2="78" y2="314" stroke="#4cc7ff" strokeWidth="1" />
        </g>
        <g fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="9" fill="#cc6edc">
          <text x="20" y="372">postulate 2</text>
          <text x="20" y="384">(constancy of c)</text>
          <line x1="60" y1="370" x2="78" y2="370" stroke="#cc6edc" strokeWidth="1" />
        </g>
      </svg>

      <p className="mt-2 font-mono text-xs text-white/50">
        Annalen der Physik 17 (1905) p. 891. Translation after Stachel, COLLECTED
        PAPERS, vol. 2 (Princeton, 1989). Two postulates. The rest of the paper
        — and a century of physics — drops out of these two sentences.
      </p>
    </div>
  );
}
