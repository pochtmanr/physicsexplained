// Seed EM §12 Foundations (BRANCH-CLOSING)
// 6 physicists (Weyl, Aharonov, Bohm, Feynman, Yang, Mills) + 10 new glossary terms + 3 promotions
// Run: pnpm exec tsx --conditions=react-server scripts/content/seed-em-08.ts
import "dotenv/config";
import { createHash } from "node:crypto";
import { getServiceClient } from "@/lib/supabase-server";

interface PhysicistSeed {
  slug: string;
  name: string;
  shortName: string;
  born: string;
  died: string;
  nationality: string;
  oneLiner: string;
  bio: string;
  contributions: string[];
  majorWorks: string[];
  relatedTopics: { branchSlug: string; topicSlug: string }[];
}

interface GlossarySeed {
  slug: string;
  term: string;
  category: "concept" | "phenomenon" | "instrument" | "unit";
  shortDefinition: string;
  description: string;
  history?: string;
  relatedPhysicists?: string[];
  relatedTopics?: { branchSlug: string; topicSlug: string }[];
}

function parseMajorWork(s: string): { title: string; year: string; description: string } {
  const match = s.match(/^(.+?)\s*\(([^)]+)\)\s*(—\s*(.+))?$/);
  if (match) return { title: match[1].trim(), year: match[2].trim(), description: match[4]?.trim() ?? "" };
  return { title: s, year: "", description: "" };
}

function paragraphsToBlocks(text: string): Array<{ type: "paragraph"; inlines: string[] }> {
  return text
    .split("\n\n")
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => ({ type: "paragraph" as const, inlines: [p] }));
}

const PHYSICISTS: PhysicistSeed[] = [
  {
    slug: "hermann-weyl",
    name: "Hermann Weyl",
    shortName: "Weyl",
    born: "1885",
    died: "1955",
    nationality: "German",
    oneLiner: "German mathematician whose 1918 attempt to unify gravity and electromagnetism by a length-rescaling 'gauge' (German Eichmaß) Einstein dismissed — and who in 1929 retooled the same idea as a phase rotation in the new quantum mechanics, where it worked. The U(1) gauge symmetry of QED is Weyl's, and the gauge principle behind every fundamental force traces to that 1929 retooling.",
    bio: `Hermann Weyl was born in Elmshorn, near Hamburg, in 1885. He studied at Munich and Göttingen, took his doctorate at Göttingen in 1908 under David Hilbert (with a dissertation on singular integral equations), and remained one of Hilbert's closest mathematical descendants for the rest of his life. After a habilitation lectureship at Göttingen and a brief return to Munich, he was called in 1913 to ETH Zürich, where Einstein had just arrived as professor of theoretical physics. The two became close — Weyl's 1918 monograph *Raum, Zeit, Materie* (*Space, Time, Matter*) is one of the great expositions of general relativity, written within three years of Einstein's 1915 field equations — and Weyl held the ETH chair until 1930, when he succeeded Hilbert at Göttingen. He held the Göttingen chair for only three years; in 1933 the Nazi seizure of power and his Jewish wife Helene's situation made staying impossible. He emigrated to Princeton's Institute for Advanced Study, where he remained Einstein's neighbour and colleague until his retirement in 1951.

Weyl's 1918 attempt to unify gravity and electromagnetism is the origin of the word "gauge" in modern physics. He proposed that the local scale of length — the *Eichmaß*, German for gauge — was not absolute but could vary from point to point in spacetime, and that this local scale invariance, together with the metric of general relativity, would generate electromagnetism as a second connection. Einstein flat-out rejected the proposal: a clock transported around a closed loop would, in Weyl's theory, return with a different rate, contradicting the observed constancy of atomic spectral lines. Weyl conceded the point but kept the underlying idea — that a *local* symmetry of the wavefunction could generate a force. In 1929, with quantum mechanics now in hand, he retooled the construction: the local symmetry is a phase rotation ψ → e^{iqΛ(x)/ℏ}ψ of the complex wavefunction, and the gauge field that compensates for it is the electromagnetic four-potential A_μ. The U(1) gauge symmetry of QED, the modern derivation of charge conservation from gauge invariance via Noether's theorem, and the entire gauge-theoretic backbone of the Standard Model trace to that 1929 paper. The Yang-Mills 1954 generalisation to non-abelian groups SU(N) is the same construction with a richer symmetry; Weyl himself recognised the connection to spinors and group representations and laid the mathematical groundwork in his 1928 *Gruppentheorie und Quantenmechanik*.

Weyl's broader mathematical legacy is enormous: foundational work on the representation theory of compact Lie groups (the Weyl character formula, Weyl chamber, Weyl group), the 1918 *Riemann-Hurwitz* calculations for Riemann surfaces, the *Weyl spinor* (the two-component massless spinor used by every particle physicist), Weyl semimetals (named for the 1929 fermion equation he wrote down), and the 1952 popular essay *Symmetry*, still in print and one of the loveliest pieces of writing on mathematics in the twentieth century. He died of a heart attack outside a Zurich post office on 8 December 1955, on his 70th birthday, while mailing a stack of letters thanking colleagues for their birthday wishes.`,
    contributions: [
      "Coined the word 'gauge' (Eichmaß) in 1918 for a local rescaling symmetry, originally proposed as a unification of gravity and electromagnetism — Einstein rejected the version, but the word and the idea stuck",
      "Retooled gauge invariance in 1929 as a phase rotation of the quantum wavefunction ψ → e^{iqΛ(x)/ℏ}ψ, deriving electromagnetism as the gauge field that compensates the local U(1) symmetry — the modern foundation of QED",
      "Developed the representation theory of compact Lie groups (Weyl character formula, Weyl chamber, Weyl group), foundational to the entire mathematics of gauge theory and particle physics",
      "Wrote *Raum, Zeit, Materie* (1918), one of the great early expositions of general relativity, within three years of Einstein's field equations",
      "Wrote down the Weyl equation (1929) for two-component massless fermions — the basis of every modern treatment of neutrinos and the namesake of Weyl semimetals",
      "Authored *Symmetry* (1952), the still-in-print popular essay on mathematical symmetry that shaped how generations of physicists and mathematicians think about the topic",
    ],
    majorWorks: [
      "Raum, Zeit, Materie (1918) — exposition of general relativity and the first articulation of the gauge principle as a length-rescaling symmetry",
      "Gruppentheorie und Quantenmechanik (1928) — group representation theory applied to the new quantum mechanics, the foundation of modern particle physics",
      "Symmetry (1952) — the popular essay, written at Princeton, that became the standard reference on mathematical symmetry for non-specialists",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
    ],
  },
  {
    slug: "yakir-aharonov",
    name: "Yakir Aharonov",
    shortName: "Aharonov",
    born: "1932",
    died: "",
    nationality: "Israeli",
    oneLiner: "Israeli theoretical physicist who, with David Bohm in 1959, predicted the eponymous quantum effect: charged particles passing through field-free regions still acquire a measurable phase shift from the enclosed magnetic flux. The cleanest experimental demonstration that the electromagnetic potential — not just the field — is the real physical object.",
    bio: `Yakir Aharonov was born in Haifa in 1932, during the British Mandate for Palestine. He studied physics at the Technion in Haifa, took his BSc in 1956, and went to England for graduate work, where he became one of David Bohm's first doctoral students at Bristol. The match was decisive: Bohm had recently arrived in Bristol after his McCarthy-era exile from US academia, and his focus on the foundations of quantum mechanics — the meaning of the wavefunction, the role of the potential versus the field, the structure of measurement — was unusual at the time and matched Aharonov's interests precisely. Aharonov took his PhD under Bohm in 1960 with the thesis that contained the result for which both men are now remembered.

The 1959 paper *Significance of Electromagnetic Potentials in the Quantum Theory*, written while Aharonov was at Brandeis and Bohm at Bristol, predicted the effect now universally called the Aharonov-Bohm effect. The setup is simple: send an electron beam through a two-slit apparatus with a thin solenoid centred between the slits, with the magnetic field tightly confined to the solenoid's interior so that the electron paths through both slits pass through regions where B is identically zero. Classically nothing should happen — no force acts on the electrons. Quantum-mechanically, however, the electrons accumulate a phase shift Φ = (q/ℏ) ∮ A·dℓ around the loop, which by Stokes's theorem equals (q/ℏ)Φ_B where Φ_B is the magnetic flux enclosed by the solenoid. The interference fringes shift laterally on the detection screen. Robert Chambers observed the effect at Bristol in 1960, the year after the prediction; Akira Tonomura's electron-holography experiment at Hitachi in 1986 closed every conceivable loophole and is now the standard demonstration. The effect is among the most-cited results in twentieth-century physics — it forced the gauge potential A_μ, not just the field tensor F^{μν}, into the foundational vocabulary of quantum theory.

Aharonov's later work has continued to centre on the foundations of quantum mechanics. With Lev Vaidman and Daniel Albert he developed the *two-state vector formalism* (a time-symmetric reformulation of quantum measurement), and with Albert and Vaidman in 1988 introduced *weak measurements* — the technique behind the now-celebrated experimental result that a measurement of the spin component of a spin-½ particle can yield a value of 100 (the so-called "amplification by post-selection"). The Aharonov-Casher effect (1984), an electric dual of the AB effect, predicts a phase shift for a neutral particle with magnetic moment moving past a line charge. Aharonov has held positions at Tel Aviv, the University of South Carolina, and currently James J. Farley Professorship at Chapman University. He won the Wolf Prize in 1998 (shared with Michael Berry for the Berry phase, which generalised the AB phase to arbitrary parameter spaces) and the US National Medal of Science in 2010.`,
    contributions: [
      "Predicted the Aharonov-Bohm effect (1959, with David Bohm) — quantum charged particles in field-free regions acquire a measurable phase shift from the enclosed magnetic flux, demonstrating that the gauge potential is more fundamental than the field",
      "Predicted the Aharonov-Casher effect (1984, with Aharon Casher) — a neutral particle with magnetic moment passing a line charge acquires an analogous phase shift, the electric dual of the AB effect",
      "Co-developed the two-state vector formalism for quantum measurement (with Albert, Bergmann, and Vaidman) — a time-symmetric reformulation in which both initial and final states constrain the measurement outcome",
      "Co-introduced weak measurements (1988, with Albert and Vaidman) — the technique behind 'amplification by post-selection' and the experimental observation of trajectories in two-slit experiments",
      "Won the 1998 Wolf Prize in Physics (with Michael Berry, for the Berry phase) and the 2010 US National Medal of Science for foundational work in quantum mechanics",
    ],
    majorWorks: [
      "Significance of Electromagnetic Potentials in the Quantum Theory (1959) — with David Bohm, the founding paper of the Aharonov-Bohm effect and one of the most cited results in 20th-century quantum physics",
      "How the Result of a Measurement of a Component of the Spin of a Spin-½ Particle Can Turn Out to Be 100 (1988) — with Albert and Vaidman, the introduction of weak measurements and post-selection amplification",
      "Quantum Paradoxes: Quantum Theory for the Perplexed (2005) — with Daniel Rohrlich, the textbook treatment of the foundational problems and resolutions Aharonov has worked on for six decades",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "aharonov-bohm-effect" },
    ],
  },
  {
    slug: "david-bohm",
    name: "David Bohm",
    shortName: "Bohm",
    born: "1917",
    died: "1992",
    nationality: "American-British",
    oneLiner: "American-British theoretical physicist whose 1952 pilot-wave interpretation of quantum mechanics offered a deterministic alternative to Copenhagen, and whose 1959 paper with Yakir Aharonov predicted the Aharonov-Bohm effect. Blacklisted from US academia during McCarthyism for refusing to testify; spent the rest of his life in São Paulo, Haifa, and London.",
    bio: `David Bohm was born in Wilkes-Barre, Pennsylvania, in 1917, the son of a Jewish furniture-store owner whose family had fled the pogroms in Hungary. He took his bachelor's degree at Pennsylvania State University and went to Berkeley for graduate work, where he became one of Robert Oppenheimer's last doctoral students before Oppenheimer left for the Manhattan Project. Bohm's 1943 PhD on neutron-proton scattering was so directly relevant to weapons design that the work was classified before he could publish it — Oppenheimer arranged for Bohm's Berkeley faculty to certify the thesis on his word that it was complete, since they could no longer read it. Bohm joined the Manhattan Project's Berkeley division but, as a member of the Communist Party USA in the late 1930s and a participant in left-wing political circles, was denied access to Los Alamos for security reasons. His Berkeley work on plasma diagnostics (the now-named "Bohm diffusion" coefficient) became foundational to magnetic-confinement fusion.

The McCarthy era reshaped Bohm's life. In 1949, called before the House Un-American Activities Committee to testify against Oppenheimer's Berkeley circle, he refused to name names and pleaded the Fifth Amendment. Princeton, where he had taken an assistant professorship in 1947, declined to renew his contract in 1951; he was unable to find another US academic position despite his abilities and the high regard in which Einstein and others held him. He left for São Paulo in 1951 (where he wrote the 1952 papers on the pilot-wave interpretation of quantum mechanics — Einstein, Schrödinger, and de Broglie all praised the work but Bohm himself was unhappy in São Paulo and the exile poisoned the reception of an already-controversial idea), then Haifa from 1955 to 1957 (where he met and worked with the young Yakir Aharonov), then Bristol from 1957 to 1961, and finally Birkbeck College in London from 1961 until his retirement.

The Bohm-Aharonov 1959 paper *Significance of Electromagnetic Potentials in the Quantum Theory* was written across the Bristol-Brandeis Atlantic divide; the 1952 *A Suggested Interpretation of the Quantum Theory in Terms of Hidden Variables* gives the deterministic pilot-wave (Bohmian mechanics) reformulation of nonrelativistic quantum mechanics. Bohm's later work turned increasingly philosophical: he had long correspondences with the Indian-born philosopher Jiddu Krishnamurti, wrote *Wholeness and the Implicate Order* (1980) on his ideas about the structure of reality, and pursued the implications of nonlocality and wholeness for fields outside physics. He died of a heart attack in London in 1992. Bohmian mechanics, once a fringe pursuit, is now taken seriously by a sub-school of philosophers of physics and a small but committed community of theoretical physicists; the Aharonov-Bohm effect is in every quantum mechanics textbook.`,
    contributions: [
      "Co-predicted the Aharonov-Bohm effect (1959, with Yakir Aharonov) — among the most-cited results in 20th-century quantum physics, demonstrating that the EM potential is fundamental to the quantum description",
      "Developed the pilot-wave (Bohmian mechanics) interpretation of quantum mechanics in 1952 — a deterministic, hidden-variable reformulation that reproduces all standard quantum predictions and is taken seriously today by a sub-school of philosophers of physics",
      "Discovered Bohm diffusion in plasma physics (1949, while at Berkeley) — anomalous transport across magnetic-confinement boundaries that became a foundational problem in fusion research",
      "Wrote *Quantum Theory* (1951) — the standard graduate textbook, completed at Princeton just before his exile, that explained the Copenhagen interpretation cleanly enough that he then proceeded to disagree with it",
      "Maintained a decades-long philosophical dialogue with Jiddu Krishnamurti and wrote *Wholeness and the Implicate Order* (1980) on his ideas about non-local structure in physics and reality",
    ],
    majorWorks: [
      "Quantum Theory (1951) — the graduate textbook completed at Princeton, an exemplary clean exposition of the Copenhagen interpretation",
      "A Suggested Interpretation of the Quantum Theory in Terms of Hidden Variables (1952) — the founding papers of pilot-wave / Bohmian mechanics, written from exile in São Paulo",
      "Significance of Electromagnetic Potentials in the Quantum Theory (1959) — with Yakir Aharonov, the prediction of the Aharonov-Bohm effect",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "aharonov-bohm-effect" },
    ],
  },
  {
    slug: "richard-feynman",
    name: "Richard Feynman",
    shortName: "Feynman",
    born: "1918",
    died: "1988",
    nationality: "American",
    oneLiner: "American theoretical physicist whose 1948–1949 path-integral and diagram formulations of quantum electrodynamics (with Schwinger and Tomonaga) won the 1965 Nobel Prize and recast every quantum-field calculation that has been done since. Manhattan Project veteran, Caltech professor for forty years, and author of the *Lectures on Physics* every undergraduate physicist still reads.",
    bio: `Richard Phillips Feynman was born in 1918 in Far Rockaway, Queens. His father Melville, a uniform salesman with no formal scientific training, taught the young Feynman to ask why — to demand a mechanism for any phenomenon, never to be satisfied with a name in place of an explanation — and that habit shaped the rest of Feynman's intellectual life. He took his bachelor's at MIT in 1939 and went to Princeton for graduate work under John Archibald Wheeler. The 1942 PhD thesis *The Principle of Least Action in Quantum Mechanics* introduced the path-integral formulation of quantum mechanics: the amplitude for a particle to go from one spacetime point to another is the sum over all possible paths between them, weighted by e^{iS/ℏ} where S is the classical action. The reformulation was equivalent to Schrödinger's wave mechanics but radically more flexible, and it became the foundation for everything Feynman did afterward.

Feynman went directly from Princeton to the Manhattan Project at Los Alamos (1943–1945, T-Division — theoretical calculations of critical mass, with Hans Bethe), then to Cornell (1945–1950) and Caltech (1950 to retirement). At Cornell, between 1947 and 1949, he developed the diagrammatic formulation of quantum electrodynamics that now bears his name: each Feynman diagram represents a term in the perturbative expansion of a quantum-mechanical amplitude, with virtual particles propagating along the lines and interacting at the vertices. The diagrams, the path-integral derivation of the Feynman rules, and the careful treatment of regularisation and renormalisation made calculations that had been intractable in 1947 routine by 1950. Feynman shared the 1965 Nobel Prize for physics with Julian Schwinger (Harvard, who had developed an equivalent operator-based formulation) and Sin-Itiro Tomonaga (Tokyo, who had derived essentially the same results during the war and the Allied bombing).

At Caltech Feynman taught the famous two-year introductory physics course (1961–1963) whose lecture notes, edited by Robert Leighton and Matthew Sands and published as *The Feynman Lectures on Physics*, are still the most-cited physics textbook in print. Volume II, on electromagnetism, derives Maxwell's equations from the photon — a striking inversion of the historical order, and the §12.4 voice anchor of this site. Feynman also did important work on superfluidity, the parton model of hadron structure (1969), and quantum computing (1981). The investigation of the 1986 Challenger disaster — for which he served on the Rogers Commission and gave the famous televised demonstration of the O-ring's loss of resilience in ice water — was the most-watched moment of public-facing physics ever broadcast in the United States. He died in 1988 at Caltech of liposarcoma. *Surely You're Joking, Mr. Feynman!* (1985) remains in print as one of the most popular memoirs by any scientist of the twentieth century.`,
    contributions: [
      "Developed the path-integral formulation of quantum mechanics (1942 PhD, published 1948) — the amplitude for a particle to go from A to B is a sum over all paths weighted by e^{iS/ℏ}; the foundation of every quantum field theory calculation since",
      "Introduced Feynman diagrams (1949) — the visual and computational language in which every perturbative quantum-field calculation is now performed, from QED scattering amplitudes to lattice QCD",
      "Shared the 1965 Nobel Prize in Physics with Julian Schwinger and Sin-Itiro Tomonaga for the development of quantum electrodynamics — the most-precisely-tested physical theory in history",
      "Wrote *The Feynman Lectures on Physics* (1963, with Leighton and Sands), still the most-cited introductory physics textbook in print; Volume II derives Maxwell's equations from the photon",
      "Investigated the 1986 Challenger disaster as a member of the Rogers Commission — the televised O-ring-in-ice-water demonstration is one of the most-watched moments of public-facing physics",
    ],
    majorWorks: [
      "Space-Time Approach to Non-Relativistic Quantum Mechanics (1948) — the published version of the 1942 PhD, the founding paper of the path-integral formulation",
      "The Feynman Lectures on Physics (1963) — with Leighton and Sands, the introductory physics textbook still on every graduate-school bookshelf",
      "QED: The Strange Theory of Light and Matter (1985) — the popular-science exposition of quantum electrodynamics, distilled from the 1979 Mautner lectures at UCLA",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "classical-limit-of-qed" },
    ],
  },
  {
    slug: "chen-ning-yang",
    name: "Chen-Ning Yang",
    shortName: "Yang",
    born: "1922",
    died: "",
    nationality: "Chinese-American",
    oneLiner: "Chinese-American theoretical physicist whose 1954 paper with Robert Mills generalised gauge theory from the abelian U(1) of electromagnetism to non-abelian groups SU(N) — the template for the weak and strong nuclear forces and the mathematical backbone of the Standard Model. 1957 Nobel Prize (with T.D. Lee) for parity violation in the weak interaction.",
    bio: `Chen-Ning Yang was born in Hefei, Anhui province, in 1922, the son of a mathematics professor at Southwest Associated University (Xinan Lianda) — the wartime-evacuation merger of Tsinghua, Peking, and Nankai universities that operated in Kunming during the Sino-Japanese War. Yang took his BSc at Lianda in 1942 and his MSc in 1944, then went to the University of Chicago on a Boxer Indemnity Scholarship, taking his PhD in 1948 under Edward Teller with a thesis on angular distributions in nuclear reactions. His Chicago classmate and lifelong collaborator T.D. Lee arrived a year after him, and the two became inseparable scientific partners.

Yang joined the Institute for Advanced Study at Princeton in 1949 (overlapping with Einstein, Gödel, von Neumann, and Pauli) and remained for sixteen years. In the summer of 1953, while visiting Brookhaven, Yang and the postdoctoral fellow Robert Mills wrote the paper *Conservation of Isotopic Spin and Isotopic Gauge Invariance* (published 1954). The construction generalised Weyl's 1929 gauge principle from the abelian U(1) phase rotation of QED to non-abelian groups (specifically SU(2), the symmetry of nuclear isospin), and the resulting field equations were highly non-trivial because the gauge fields themselves carried charge under the gauge group — the field strength tensor acquired a self-interaction term g f^{abc} A^b_μ A^c_ν that was absent in the abelian case. Pauli, who had independently considered the same construction, raised an objection at Yang's 1954 IAS seminar that the resulting gauge bosons would have to be massless and therefore long-range — contradicting the short range of the strong force the construction was meant to describe. Yang famously had no good answer, and the paper sat largely unused for a decade until the development of the Higgs mechanism and dimensional regularisation in the 1960s gave it the missing ingredients. The construction is now the mathematical backbone of the entire Standard Model: the weak force is an SU(2) gauge theory, the strong force is an SU(3) gauge theory, and the electroweak unification is an SU(2)×U(1) gauge theory.

In 1956, Yang and Lee proposed that parity — the symmetry under spatial reflection — was *not* conserved in the weak interaction, in defiance of forty years of physical intuition. Chien-Shiung Wu's experiment at Columbia in late 1956 confirmed the prediction within months; Yang and Lee shared the 1957 Nobel Prize (the fastest Nobel ever awarded after the experimental confirmation). Yang moved to Stony Brook in 1965 to found the Institute for Theoretical Physics there, retired from Stony Brook in 1999, and returned permanently to Tsinghua University in Beijing in 2003. He has been an active physicist into his late nineties; the 2019 Nobel ceremony in Stockholm noted that Yang-Mills theory remains the most-cited single result in modern theoretical physics.`,
    contributions: [
      "Co-authored the Yang-Mills paper (1954, with Robert Mills) — the generalisation of gauge theory from the abelian U(1) of QED to non-abelian SU(N) groups; the mathematical backbone of the Standard Model",
      "Co-proposed parity violation in the weak interaction (1956, with T.D. Lee) — confirmed within months by Chien-Shiung Wu's Columbia experiment, overturning forty years of physical intuition",
      "Shared the 1957 Nobel Prize in Physics with T.D. Lee for the parity-violation prediction — the fastest Nobel ever awarded after experimental confirmation",
      "Co-discovered the Yang-Baxter equation (1967) — a foundational result in integrable systems and quantum-group theory, with applications across statistical mechanics, knot theory, and condensed-matter physics",
      "Founded and directed the Institute for Theoretical Physics at Stony Brook (1965–1999), establishing it as a major centre of theoretical physics in the US",
    ],
    majorWorks: [
      "Conservation of Isotopic Spin and Isotopic Gauge Invariance (1954) — with Robert Mills, the foundational paper of non-abelian gauge theory",
      "Question of Parity Conservation in Weak Interactions (1956) — with T.D. Lee, the paper that overturned the assumption of parity conservation",
      "Selected Papers (1983) — the autobiographical retrospective covering Yang's first thirty-five years of work, with extensive personal commentary",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
    ],
  },
  {
    slug: "robert-mills",
    name: "Robert Mills",
    shortName: "Mills",
    born: "1927",
    died: "1999",
    nationality: "American",
    oneLiner: "American theoretical physicist whose 1954 collaboration with Chen-Ning Yang at Brookhaven produced the Yang-Mills paper — the generalisation of gauge theory to non-abelian groups, and the mathematical foundation of the Standard Model. Spent the rest of his career at Ohio State; the 1954 paper remained the work for which he was known.",
    bio: `Robert Laurence Mills was born in Englewood, New Jersey, in 1927. He took his bachelor's at Columbia in 1948 and his PhD at Columbia in 1955 under Norman Kroll, with a dissertation on quantum electrodynamics of bound states. The decisive event of his career came in the summer of 1953, before he had even finished the thesis: as a postdoctoral fellow at Brookhaven National Laboratory, Mills shared an office with the visiting Chen-Ning Yang from the Institute for Advanced Study, and the two of them, in the course of conversations about how to extend gauge theory beyond the abelian U(1) of electromagnetism, worked out the construction now called Yang-Mills theory.

The collaboration was a genuine fifty-fifty partnership. Mills's own two-page recollection (published in *American Journal of Physics* in 1989) describes the work plainly: Yang had been thinking for some years about whether isospin symmetry — the SU(2) symmetry that interchanged protons and neutrons — could be made into a *local* gauge symmetry the way the U(1) of QED was. The mathematics had stalled because the resulting field strength tensor was not simply F_{μν} = ∂_μ A_ν − ∂_ν A_μ but acquired a non-linear self-interaction term g f^{abc} A^b_μ A^c_ν reflecting the non-commutativity of the SU(2) generators. Yang and Mills worked through the construction over several weeks at Brookhaven, derived the modified field equations and the modified Bianchi identity, recognised that the resulting gauge bosons had to be massless (which was an obvious problem if the symmetry was supposed to describe the short-range strong force), and submitted the paper to *Physical Review* in October 1953. It was published in 1954.

After Brookhaven, Mills joined the Ohio State University faculty in 1956 and remained there for the rest of his career, becoming full professor in 1962 and retiring in 1995. His subsequent work was in the same area — gauge field theory, statistical mechanics, theoretical condensed matter — but never approached the impact of the 1954 paper, which became progressively more important as the Standard Model took shape in the late 1960s and 1970s. Mills was modest about the partnership and consistently deferred to Yang, both because Yang had been the senior figure on the original problem and because Yang's later work (parity violation, the Yang-Baxter equation, sustained leadership of theoretical physics for half a century) gave him a more visible scientific career. Mills died of cancer in 1999 in Charlestown, West Virginia. The Yang-Mills construction is the mathematical backbone of every gauge theory in modern physics: SU(2) for the weak force, SU(3) for the strong force, SU(3)×SU(2)×U(1) for the Standard Model as a whole.`,
    contributions: [
      "Co-authored the Yang-Mills paper (1954, with Chen-Ning Yang at Brookhaven) — the generalisation of gauge theory from the abelian U(1) of QED to non-abelian gauge groups SU(N), the mathematical foundation of the Standard Model",
      "Worked out the non-linear self-interaction term g f^{abc} A^b_μ A^c_ν of the Yang-Mills field strength tensor — the technical innovation that made non-abelian gauge theory possible",
      "Held the Ohio State University theoretical physics professorship from 1956 until his retirement in 1995, training generations of students in gauge field theory and statistical mechanics",
      "Wrote a clear-eyed two-page recollection (1989, *American Journal of Physics*) of how the 1954 paper was written, providing one of the few first-person accounts of a foundational physics paper in the post-war era",
      "Continued to work on gauge field theory and statistical mechanics throughout his Ohio State career, including significant contributions to the theory of gauge invariance in lattice models",
    ],
    majorWorks: [
      "Conservation of Isotopic Spin and Isotopic Gauge Invariance (1954) — with Chen-Ning Yang, the foundational paper of non-abelian gauge theory",
      "Gauge Fields (1989) — the personal recollection of the 1954 paper, published in *American Journal of Physics* on the 35th anniversary",
      "Space, Time, and Quanta: An Introduction to Contemporary Physics (1994) — the textbook synthesising thirty years of teaching at Ohio State",
    ],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
    ],
  },
];

const GLOSSARY: GlossarySeed[] = [
  // §12.1 ──────────────────────────────────────────────────────────────────
  {
    slug: "gauge-group",
    term: "Gauge group",
    category: "concept",
    shortDefinition: "The Lie group whose local symmetry transformations leave a gauge theory's Lagrangian invariant. U(1) for electromagnetism (one phase parameter), SU(2) for the weak force (three parameters, three W-bosons), SU(3) for QCD (eight parameters, eight gluons). The Standard Model gauge group is SU(3)×SU(2)×U(1).",
    description: `A gauge group is the Lie group whose local symmetry transformations leave a gauge theory's Lagrangian invariant. The simplest case is U(1), the group of complex phase rotations e^{iqΛ(x)/ℏ} acting on a charged matter field — this is the gauge group of electromagnetism, and the unique gauge field A_μ that compensates the local U(1) transformation is the electromagnetic four-potential. Because U(1) is a one-parameter abelian group, electromagnetism has a single gauge boson (the photon), the gauge fields commute among themselves, and the field strength tensor F^{μν} is purely linear in A^μ.

For non-abelian groups the structure is richer. SU(2) — the weak isospin gauge group — has three real parameters and three gauge bosons (W^+, W^−, W^0 before electroweak mixing). SU(3) — the strong color gauge group of QCD — has eight parameters and eight gluons. SU(N) in general has N²−1 generators T^a satisfying [T^a, T^b] = i f^{abc} T^c with structure constants f^{abc}, and the field strength tensor acquires a non-linear self-interaction term: F^{a}_{μν} = ∂_μ A^a_ν − ∂_ν A^a_μ + g f^{abc} A^b_μ A^c_ν. The self-interaction means non-abelian gauge bosons carry charge under the very gauge group they mediate — gluons interact with gluons, W bosons interact with W bosons, in a way photons never interact with photons. The Standard Model gauge group is the product SU(3)_color × SU(2)_weak × U(1)_hypercharge, with twelve gauge bosons total before symmetry breaking and (after the Higgs mechanism) eight gluons, three weak bosons, and one photon.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
    ],
  },
  {
    slug: "non-abelian-gauge",
    term: "Non-abelian gauge theory",
    category: "concept",
    shortDefinition: "A gauge theory whose gauge group is non-commutative, so the gauge fields themselves carry charge under the group and the field strength tensor acquires a self-interaction term. Yang-Mills 1954 introduced the construction; QCD and the weak force are non-abelian; QED is the abelian exception.",
    description: `A non-abelian gauge theory is a gauge theory whose gauge group does not commute — that is, two gauge transformations performed in different orders give different results. The condition T^a T^b ≠ T^b T^a translates into the structure-constant relation [T^a, T^b] = i f^{abc} T^c, with f^{abc} the non-zero structure constants of the gauge group's Lie algebra. Yang and Mills introduced the construction in 1954 by generalising Weyl's 1929 abelian gauge principle to the SU(2) symmetry of nuclear isospin.

The defining feature of non-abelian gauge theory is that the field strength tensor is no longer linear in the gauge potential: F^{a}_{μν} = ∂_μ A^a_ν − ∂_ν A^a_μ + g f^{abc} A^b_μ A^c_ν. The extra non-linear term g f^{abc} A^b_μ A^c_ν means that the gauge bosons themselves carry charge under the gauge group and self-interact at every order in the coupling. In QCD this self-interaction is the source of asymptotic freedom (the running coupling decreases at high energy because gluon-gluon loops dominate quark-antiquark loops in the beta function) and confinement (the same self-interaction prevents quarks from being separated to large distances). The mathematical machinery — covariant derivatives D_μ = ∂_μ + i g A^a_μ T^a, gauge-covariant field strengths, lattice regularisations — is universal across all non-abelian theories. The Yang-Mills 1954 paper is one of the most-cited results in twentieth-century theoretical physics; the entire Standard Model is built on its construction.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
    ],
  },
  {
    slug: "yang-mills-equations",
    term: "Yang-Mills equations",
    category: "concept",
    shortDefinition: "The non-abelian generalisation of Maxwell's equations: D_μ F^{aμν} = J^{aν}, where the covariant derivative D_μ = ∂_μ + i g [A_μ, ·] couples the gauge field to itself through the structure constants of the gauge group. The field equations of every non-abelian gauge theory in physics.",
    description: `The Yang-Mills equations are the non-abelian generalisation of Maxwell's equations to gauge theories with arbitrary Lie-group structure. For a gauge group with generators T^a and structure constants f^{abc}, the field strength tensor is F^{a}_{μν} = ∂_μ A^a_ν − ∂_ν A^a_μ + g f^{abc} A^b_μ A^c_ν, and the equations of motion are D_μ F^{aμν} = J^{aν}, where the gauge-covariant derivative D_μ = ∂_μ + i g A^b_μ T^b acts on field-tensor components by the appropriate adjoint representation. The non-abelian part of D_μ contributes a term g f^{abc} A^b_μ F^{cμν} to the divergence — gluons sourcing gluons, W bosons sourcing W bosons.

For an abelian gauge group like U(1), the structure constants vanish, the covariant derivative reduces to the ordinary partial derivative, and the Yang-Mills equations reduce to Maxwell's: ∂_μ F^{μν} = J^ν. For non-abelian groups, the equations are highly non-linear and admit no general analytical solution; instanton solutions in Euclidean SU(2) Yang-Mills theory (Belavin-Polyakov-Schwarz-Tyupkin 1975) and lattice gauge-theory simulations are the workhorses. The Bianchi identity D_μ *F^{aμν} = 0 holds automatically as a consequence of F = dA + A∧A, and the gauge invariance under A_μ → U(x) A_μ U(x)⁻¹ + (i/g) U(x) ∂_μ U(x)⁻¹ generalises the abelian gauge transformation. The 2000 Clay Mathematics Institute "Yang-Mills mass gap" Millennium Prize Problem asks for a proof that pure SU(N) Yang-Mills theory in four dimensions has a mass gap; this remains one of the seven unsolved problems of mathematics, and a $1 million bounty awaits anyone who can prove that the lightest excitation has positive mass.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
    ],
  },
  // §12.2 ──────────────────────────────────────────────────────────────────
  {
    slug: "aharonov-bohm-phase",
    term: "Aharonov-Bohm phase",
    category: "concept",
    shortDefinition: "The quantum-mechanical phase Φ = (q/ℏ) ∮ A·dℓ acquired by a charged particle traversing a closed loop, equal to (q/ℏ) times the enclosed magnetic flux. Periodic in the flux quantum Φ_0 = h/|q|; demonstrates that the four-potential is observable in quantum mechanics even where the field is zero.",
    description: `The Aharonov-Bohm phase is the quantum-mechanical phase Φ_AB = (q/ℏ) ∮ A·dℓ acquired by a charged particle traversing a closed spatial loop in a region where the electromagnetic vector potential A is non-zero. By Stokes's theorem the loop integral equals the magnetic flux Φ_B enclosed by the loop, so Φ_AB = (q/ℏ) Φ_B. The phase is gauge-invariant in the sense that adding a gradient ∂_μΛ to A_μ changes the open-path integral but leaves the closed-loop integral unchanged (the gradient integrates to zero around any closed loop in a simply-connected region of A).

Because phases are physically observable only modulo 2π, the AB phase is periodic in the magnetic flux quantum Φ_0 = h/|q|. For an electron (q = e) this is h/e ≈ 4.14 × 10^{−15} Wb; for a Cooper pair (q = 2e) the relevant quantum is half this, the superconducting flux quantum. As the enclosed flux increases from 0 to Φ_0, the AB phase advances from 0 to 2π and the interference pattern in a two-slit setup shifts laterally by exactly one fringe — at Φ_B = Φ_0/2 the interference fringes flip from constructive to destructive at the original maxima, and at Φ_B = Φ_0 the pattern returns to its original position. The 1959 Aharonov-Bohm prediction and the 1986 Tonomura electron-holography experiment that closed every classical loophole made this the cleanest experimental demonstration that the four-potential A^μ — not just the field tensor F^{μν} — is the fundamental observable in quantum electrodynamics.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "aharonov-bohm-effect" },
    ],
  },
  // §12.3 ──────────────────────────────────────────────────────────────────
  {
    slug: "dirac-quantization-condition",
    term: "Dirac quantization condition",
    category: "concept",
    shortDefinition: "The 1931 Dirac result that the existence of a single magnetic monopole anywhere in the universe forces electric charge to be quantised in integer multiples of e = 2πℏ/(g μ₀ c), where g is the magnetic charge. Turns the empirical fact of charge quantisation into a theoretical consequence.",
    description: `The Dirac quantization condition is the 1931 result by Paul Dirac that the existence of even a single magnetic monopole anywhere in the universe forces electric charge to be quantised. Specifically, if a magnetic monopole carries magnetic charge g and an electric particle carries charge q, the consistency of the quantum-mechanical wavefunction in the presence of both requires q g = 2 π n ℏ for some integer n. Equivalently, q g / (2 π ℏ) ∈ ℤ. The smallest nontrivial monopole charge is therefore g_D = 2 π ℏ / e ≈ 4.14 × 10^{−15} Wb, which is exactly the magnetic flux quantum Φ_0 = h / e.

Dirac's argument proceeds by considering the wavefunction of an electric charge in the field of a magnetic monopole. The vector potential A of an isolated monopole cannot be defined globally — there is necessarily a "Dirac string" emerging from the monopole, a singular line along which A blows up. The string's location is gauge-dependent; physically, two different choices of string location must give equivalent physics, which requires the integrated phase ∮ A·dℓ around any small loop encircling the string to be a multiple of 2π. This forces e g = 2 π n ℏ. The deep consequence is that the empirical fact of electric-charge quantisation — the otherwise-mysterious observation that every elementary particle has charge that is an integer multiple of e/3 — becomes a theoretical *consequence* of monopole existence. The flip side is that the absence of observed monopoles after sixty years of dedicated search (MoEDAL at the LHC, lunar-regolith analyses, dedicated solenoid experiments) is one of the puzzles motivating cosmological models with monopole inflation or with monopole production cut off below the Hubble horizon.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetic-monopoles-and-duality" },
    ],
  },
  {
    slug: "electromagnetic-duality",
    term: "Electromagnetic duality",
    category: "concept",
    shortDefinition: "The symmetry E → cB, cB → −E (equivalently F^{μν} → *F^{μν}) that maps the source-free Maxwell equations to themselves. In a universe with magnetic monopoles, the duality extends to interchanging electric and magnetic charges/currents, restoring perfect E↔B symmetry to the field equations.",
    description: `Electromagnetic duality is the discrete symmetry E → cB, cB → −E (equivalently F^{μν} → *F^{μν} where *F^{μν} = ½ ε^{μνρσ} F_{ρσ} is the dual field tensor) that maps the source-free Maxwell equations to themselves. In a vacuum region with no charges or currents, the four equations ∇·E = 0, ∇·B = 0, ∇×E = −∂B/∂t, ∇×B = (1/c²) ∂E/∂t are invariant under the rotation by 90° in the (E, cB) plane. The two Lorentz invariants of the EM field, E·B and |E|² − c²|B|², transform as the components of a complex scalar under the duality rotation, and free electromagnetic waves in vacuum display the duality manifestly.

In the actual universe, where electric charges and currents exist but magnetic charges and currents do not, the duality is broken at the level of source equations: ∂_μ F^{μν} = μ₀ J^ν (electric four-current sources F^{μν}) but ∂_μ *F^{μν} = 0 (no magnetic source for *F^{μν}). If magnetic monopoles existed the equations would become ∂_μ F^{μν} = μ₀ J_e^ν and ∂_μ *F^{μν} = μ₀ J_m^ν, restoring perfect duality at the field-equation level — and the duality transformation would map (J_e, J_m) → (J_m, −J_e) just as it maps (E, cB) → (cB, −E). This *S-duality* generalises in supersymmetric Yang-Mills theory to a continuous SL(2, ℤ) action on the complexified coupling τ = θ/(2π) + 4πi/g², connecting strongly-coupled to weakly-coupled regimes via the duality and underlying the Seiberg-Witten 1994 solution of N=2 SU(2) gauge theory. In string theory the same idea — T-duality, S-duality, the M-theory web — connects ostensibly different theories as different limits of one underlying structure.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetic-monopoles-and-duality" },
    ],
  },
  // §12.4 ──────────────────────────────────────────────────────────────────
  {
    slug: "coherent-state",
    term: "Coherent state",
    category: "concept",
    shortDefinition: "An eigenstate |α⟩ of the photon annihilation operator â with complex eigenvalue α, possessing a Poisson photon-number distribution ⟨n⟩ = |α|², σ_n = |α|, σ_n/⟨n⟩ = 1/|α|. In the |α|² → ∞ limit the relative quantum fluctuation vanishes and ⟨α|Ê|α⟩ approaches the classical EM field exactly. The bridge from QED to classical electromagnetism.",
    description: `A coherent state of the electromagnetic field is an eigenstate |α⟩ of the photon annihilation operator â for a single mode, satisfying â|α⟩ = α|α⟩ for some complex number α. Glauber introduced the formalism in 1963 and earned the 2005 Nobel Prize for it. The photon-number distribution |⟨n|α⟩|² = e^{−|α|²} |α|^{2n} / n! is Poisson with mean ⟨n⟩ = |α|² and standard deviation σ_n = |α|. The relative quantum fluctuation σ_n / ⟨n⟩ = 1 / |α| therefore decreases as 1/√⟨n⟩ as the mean photon number increases.

The coherent state is the bridge from quantum electrodynamics to classical electromagnetism. The expectation value of the electric-field operator in a coherent state ⟨α| Ê(x, t) |α⟩ is exactly the classical electric field of a wave with the corresponding amplitude and phase — α directly encodes the classical field's amplitude (|α|) and phase (arg α). In the high-occupation-number limit |α|² → ∞ the relative quantum fluctuation vanishes, the field operator Ê becomes effectively diagonal on the coherent state, and the quantum description becomes indistinguishable from the classical description. A laser at full power produces a coherent state with ⟨n⟩ ≈ 10^{15} photons per mode; the relative quantum fluctuation is ≈ 10^{−7.5}, far below any experimental sensitivity, and the laser's output is treated classically as a complex-amplitude wave to better than parts-per-million accuracy. The classical limit of QED is therefore not a special case but a high-N statistical regime — exactly analogous to the way a Bose-Einstein condensate's quantum field becomes a classical wavefunction at macroscopic occupation. Maxwell's equations are the high-N limit of the photon's quantum field, and the coherent state |α⟩ is the eigenstate that makes the limit explicit.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "classical-limit-of-qed" },
    ],
  },
  {
    slug: "running-coupling",
    term: "Running coupling",
    category: "concept",
    shortDefinition: "The energy-dependent value α(E) of the QED fine-structure constant, increasing from α ≈ 1/137 at low energies to α ≈ 1/128 at the Z-pole and toward 1 at the Landau pole. The breakdown of perturbation theory at high energy is one of the doors from QED to deeper theory.",
    description: `The running coupling α(E) of quantum electrodynamics is the energy-dependent value of the fine-structure constant, generated by quantum corrections from virtual electron-positron pairs that screen the bare electric charge. At low energies (E ≪ m_e c²) the coupling has its measured low-energy value α ≈ 1/137.036, but at higher energies the screening becomes less effective — the probe penetrates closer to the bare charge — and the effective coupling grows. The one-loop QED renormalisation-group equation gives α(E) ≈ α(0) / (1 − (α/3π) ln(E²/m_e²c⁴)) at energies above the electron mass, valid for E ≪ Λ where Λ ≈ m_e c² · exp(3π/α) ≈ 10^{286} GeV is the Landau pole.

By the time the energy reaches the Z-boson pole (≈ 91 GeV) the QED coupling has run from 1/137 to about 1/128 — a 7% change measurable in precision LEP-era Z-pole observables. Far above this scale the coupling continues to grow until perturbation theory breaks down at the Landau pole. The Landau pole is far above the Planck scale, so for all practical purposes it is moot, but the existence of the divergence is a sign that QED is not a complete UV theory — it must be embedded in a larger theory (the electroweak SU(2)×U(1) gauge theory, then the Standard Model, then whatever lies beyond) at energies long before the Landau pole becomes relevant. The non-abelian gauge theories of the Standard Model run in the *opposite* direction: SU(3) QCD has *asymptotic freedom* (α_s → 0 as E → ∞, the discovery for which Gross, Politzer, and Wilczek shared the 2004 Nobel Prize), while the SU(2) electroweak coupling also decreases at high energy. The grand-unification proposal that all three Standard Model couplings meet at a common high-energy scale (≈ 10^{16} GeV in supersymmetric models) hinges on the running of α, α_s, and α_w being precisely tuned to converge.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "classical-limit-of-qed" },
    ],
  },
  {
    slug: "anomalous-magnetic-moment",
    term: "Anomalous magnetic moment",
    category: "concept",
    shortDefinition: "The deviation of the electron's gyromagnetic ratio from the Dirac value g = 2: a_e ≡ (g − 2)/2 = α/(2π) + O(α²) ≈ 0.00115965218... — the most precisely-tested prediction in physics, agreeing with experiment to 12 decimal places. Schwinger's 1948 calculation was the first triumph of QED.",
    description: `The anomalous magnetic moment of the electron is the small but measurable deviation of the electron's gyromagnetic ratio g from the Dirac value g = 2 predicted by relativistic quantum mechanics with a structureless point electron. The defining quantity is a_e ≡ (g − 2) / 2, the fractional anomalous excess. The Dirac equation alone predicts a_e = 0; QED's one-loop vacuum-polarisation and vertex corrections give Schwinger's 1948 leading-order result a_e = α / (2π) ≈ 0.00115965, the first triumph of perturbative quantum electrodynamics and one of the most-quoted single-line formulas in twentieth-century physics.

Higher-order corrections have been computed to five-loop accuracy: a_e = (α/2π) − 0.328 (α/π)² + 1.182 (α/π)³ − ... The five-loop value of a_e is known theoretically to about 12 significant figures and agrees with the experimental measurement (Penning-trap measurements of trapped electrons, Hanneke-Fogwell-Gabrielse 2008 and refinements through 2023) to about the same precision. The electron magnetic moment is therefore the most-precisely-tested prediction in all of physics. The muon's anomalous magnetic moment a_μ shows a small but persistent ~4σ tension between the Standard Model prediction and the Brookhaven E821 (2001) and Fermilab Run-1 + Run-2 (2021–2023) measurements, of intense interest as a possible signal of physics beyond the Standard Model — though improvements in the QCD hadronic-vacuum-polarisation calculations have somewhat reduced the tension. The clean agreement for the electron and the persistent puzzle for the muon are emblematic of how precisely classical electromagnetism, in its quantum-electrodynamic completion, has been pinned down by experiment.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "classical-limit-of-qed" },
    ],
  },
  {
    slug: "classical-limit-of-qed",
    term: "Classical limit of QED",
    category: "concept",
    shortDefinition: "The high-occupation-number limit of quantum electrodynamics in which Maxwell's equations are recovered exactly as the expectation value of the photon field operator in a coherent state with |α|² → ∞. The classical theory is incomplete but consistent: every successor theory (QED, gauge unification, beyond) has had to learn to speak Maxwell.",
    description: `The classical limit of quantum electrodynamics is the high-occupation-number regime in which Maxwell's equations are recovered as expectation values of the underlying quantum-field operators in coherent states with macroscopic photon occupation. For a single mode of the EM field with annihilation operator â, the coherent state |α⟩ satisfies â|α⟩ = α|α⟩ with complex amplitude α, and the expectation value ⟨α| Ê |α⟩ of the electric-field operator is exactly the classical electric field of a wave with amplitude |α| and phase arg α. The relative quantum fluctuation σ_E / ⟨E⟩ scales as 1/√⟨n⟩ where ⟨n⟩ = |α|² is the mean photon number, so for a laser at full power (⟨n⟩ ≈ 10^{15}) the fluctuation is ≈ 10^{−7.5} and the classical wave description is accurate to parts per million.

The historical inversion — that classical electromagnetism is the limit of a quantum theory, not the foundation that quantum mechanics modifies — was Feynman's pedagogical organisation in Volume II of the *Lectures on Physics* (1963): he derives Maxwell's equations *from* the photon, not the other way around. Two corrections to Maxwell's equations cannot be derived from the classical theory and instead come directly from QED at one loop: the Lamb shift (1947) of hydrogen-atom energy levels by ≈ 1057 MHz, due to vacuum polarisation; and Schwinger's anomalous magnetic moment a_e = α/(2π) ≈ 0.00116, the most-precisely-tested prediction in physics. Both are quantum effects with no classical limit — they vanish as ℏ → 0 — and both signal that the classical theory is incomplete. But the classical theory is consistent, computable, and the language every successor theory has had to learn: QED is built on Maxwell's vector potential A^μ, the Standard Model gauge unification builds on QED, and whatever theory eventually subsumes the Standard Model will build on the structure already in place. The next branch of physics is QUANTUM. Maxwell's equations come along for the ride.`,
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "classical-limit-of-qed" },
    ],
  },
  // PROMOTIONS — overwrite Session 7 forward-ref placeholders ──────────────
  {
    slug: "gauge-theory-origins",
    term: "Gauge theory origins",
    category: "concept",
    shortDefinition: "The intellectual lineage from the 1865-1867 observation of gauge freedom in electromagnetism, through Hermann Weyl's 1918 unification attempt and 1929 retooling as a quantum-phase symmetry, to Yang-Mills 1954 and the Standard Model. The gauge principle is the template behind every fundamental force in nature.",
    description: `Gauge theory's origins trace through three phases that span a century of theoretical physics. The first phase is the observation, in classical electromagnetism, that the four-potential A^μ is not uniquely determined by the field tensor F^{μν} = ∂^μ A^ν − ∂^ν A^μ — adding the four-gradient ∂_μ Λ of any scalar function Λ leaves F^{μν} invariant. This redundancy in the description was first identified explicitly by Maxwell and Helmholtz in 1865 and by Ludvig Lorenz in 1867 (in his now-famous Lorenz gauge condition). At the time it was a curiosity: a freedom in the choice of mathematical representation that seemed to have no physical content.

The second phase is Hermann Weyl's 1918 attempt to derive electromagnetism from a local rescaling symmetry of length — the *Eichmaß*, German for gauge or measure — which would unify gravity and electromagnetism in a single geometric theory. Einstein flat-out rejected the proposal: a clock transported around a closed loop would, in Weyl's theory, return at a different rate, contradicting the constancy of atomic spectral lines. But Weyl kept the underlying idea, and in 1929 — with quantum mechanics now in hand — he retooled it: the local symmetry is a phase rotation ψ → e^{iqΛ(x)/ℏ}ψ of the complex wavefunction, and the gauge field that compensates this local symmetry is the four-potential A_μ. The construction works. Charge conservation falls out of Noether's theorem applied to the U(1) gauge symmetry, and the entire structure of QED as a gauge theory becomes manifest. The word "gauge" in modern physics is Weyl's, even though the meaning is nothing like the original 1918 length-rescaling.

The third phase is Yang-Mills 1954: the generalisation of Weyl's abelian U(1) construction to non-abelian gauge groups SU(2), SU(3), and beyond. The non-abelian generalisation introduces the self-interaction term g f^{abc} A^b_μ A^c_ν in the field strength tensor — gauge bosons carrying charge under the very gauge group they mediate. Initially shelved because the resulting massless gauge bosons seemed incompatible with the short-range strong force, the construction was rescued in the 1960s by the Higgs mechanism (which gives mass to the W and Z bosons of the weak SU(2)×U(1)) and asymptotic freedom (which explains why QCD's massless gluons confine quarks at low energy). The Standard Model gauge group SU(3)×SU(2)×U(1), with its twelve gauge bosons and the discovered Higgs particle, is the modern incarnation of Weyl's 1929 retooling — and the entire structure traces, through Yang-Mills, back through Weyl, back to that 1865-1867 observation about a redundancy in the choice of vector potential.`,
    relatedPhysicists: ["hermann-weyl", "chen-ning-yang", "robert-mills", "emmy-noether", "james-clerk-maxwell"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "gauge-theory-origins" },
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
    ],
  },
  {
    slug: "aharonov-bohm-effect",
    term: "Aharonov-Bohm effect",
    category: "phenomenon",
    shortDefinition: "The 1959 prediction (Yakir Aharonov and David Bohm) that quantum charged particles passing through field-free regions still acquire a measurable phase shift Φ = (q/ℏ)Φ_B from the enclosed magnetic flux. Confirmed by Chambers (1960) and decisively by Tonomura (1986). The cleanest demonstration that the EM potential is more fundamental than the field.",
    description: `The Aharonov-Bohm effect is the quantum-mechanical phenomenon, predicted by Yakir Aharonov and David Bohm in 1959 and confirmed experimentally by Robert Chambers (1960) and decisively by Akira Tonomura's electron-holography experiment at Hitachi (1986), that a charged particle following a path enclosing a region of magnetic flux acquires a phase shift Φ_AB = (q/ℏ) ∮ A·dℓ — even when the magnetic field B is identically zero everywhere along the particle's worldline. By Stokes's theorem the loop integral equals (q/ℏ)Φ_B where Φ_B is the magnetic flux enclosed by the loop. The effect is the cleanest experimental demonstration that the electromagnetic four-potential A^μ — not just the field tensor F^{μν} — is a fundamental observable in quantum electrodynamics.

The classic experimental setup is two-slit electron interference with a thin solenoid centred between the slits. The solenoid's field is tightly confined to its interior, so the electron paths through both slits pass through regions where B is identically zero. Classically nothing should happen — no force acts on the electrons. Quantum-mechanically, however, the interference pattern on the detection screen shifts laterally as the solenoid's flux is varied; one full flux quantum Φ_0 = h/|q| corresponds to a 2π phase shift and one full fringe-width displacement, and the pattern returns to its original position. Tonomura's 1986 experiment used a permalloy-coated superconducting toroid to confine the field tightly and ruled out every conceivable classical-leakage explanation; the effect is now textbook material in every quantum mechanics course. The deeper consequence is that two configurations of A^μ that differ by a non-zero closed-loop integral are physically distinct in quantum mechanics, even when their F^{μν} are identical — the gauge potential, not just the field, is the right object.

The AB effect generalises in striking ways. The Berry phase (1984) is its differential-geometric extension to arbitrary parameter spaces, with applications across condensed matter (the integer quantum Hall effect, topological insulators, the spin-Hall effect). The Aharonov-Casher effect (1984) is the electric dual: a neutral particle with magnetic moment passing a line charge acquires an analogous phase. Variants involving heavier mesons, neutrons, and macroscopic Cooper pairs in superconducting rings (the SQUID, where AB-like phase quantisation produces the dc Josephson effect) populate condensed-matter and quantum-information experiments to this day. The Aharonov-Bohm effect was Aharonov and Bohm's introduction to physics; it remains, sixty-five years later, one of the most-cited results in twentieth-century theoretical physics.`,
    relatedPhysicists: ["yakir-aharonov", "david-bohm"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "aharonov-bohm-effect" },
      { branchSlug: "electromagnetism", topicSlug: "four-potential-and-em-lagrangian" },
    ],
  },
  {
    slug: "magnetic-monopole",
    term: "Magnetic monopole",
    category: "concept",
    shortDefinition: "A hypothetical particle carrying isolated magnetic charge g, sourcing the dual field tensor *F^{μν} the way an electron sources F^{μν}. Predicted in 1931 by Dirac as quantum-mechanically consistent; force charge quantisation; arise naturally in grand-unified theories. Never observed despite sixty years of dedicated search.",
    description: `A magnetic monopole is a hypothetical elementary particle that carries an isolated magnetic charge g, sourcing the dual electromagnetic field tensor *F^{μν} = ½ ε^{μνρσ} F_{ρσ} the way an electron with charge q sources F^{μν}. If magnetic monopoles existed, the symmetric Maxwell equations would read ∂_μ F^{μν} = μ₀ J_e^ν (electric four-current sourcing F) and ∂_μ *F^{μν} = μ₀ J_m^ν (magnetic four-current sourcing *F), restoring perfect E↔B duality at the level of the field equations. The actual second Maxwell equation in our universe, ∂_μ *F^{μν} = 0, is a statement of the experimental absence of magnetic monopoles to the precision of every search ever conducted.

Paul Dirac in 1931 showed that magnetic monopoles are *consistent* with quantum mechanics, with one striking consequence. The wavefunction of an electric particle in the field of a monopole cannot be globally single-valued unless the product of the electric charge q and the magnetic charge g satisfies the *Dirac quantisation condition* q g = 2π n ℏ for some integer n. The smallest non-trivial monopole charge is therefore g_D = 2π ℏ / e ≈ 4.14 × 10^{−15} Wb (= Φ_0, the magnetic flux quantum). The argument turns the empirical fact of electric-charge quantisation — that every elementary particle has charge a multiple of e/3 — into a *theoretical consequence* of monopole existence. For physicists who view charge quantisation as one of the deepest unexplained facts in nature, the existence of even a single magnetic monopole anywhere in the universe would make it suddenly comprehensible.

In grand-unified theories (GUTs) like SU(5) and SO(10), magnetic monopoles arise *automatically* as topological solitons — stable lumps of energy density that emerge whenever a non-abelian gauge group breaks to a subgroup containing an unbroken U(1). The 't Hooft-Polyakov monopole (1974) is the canonical example: a finite-energy stable solution of the SU(2)→U(1) Higgs model with magnetic charge g_D and mass on the order of M_GUT/α. Cosmological monopole production in the early universe (Kibble mechanism) would generically have produced enough monopoles to overclose the universe by many orders of magnitude — the *monopole problem* of GUT cosmology, which Alan Guth proposed in 1980 to solve by inflation (which dilutes the relic monopole density to negligible). Despite this rich theoretical motivation and sixty years of dedicated experimental search — the MoEDAL detector at the LHC, lunar-regolith analyses by the Maryland-Stanford collaboration, the Cabrera 1982 single-event candidate at Stanford that has never repeated — no magnetic monopole has ever been observed. We have not found one. We have not ruled them out. Dirac showed they would not break anything.`,
    relatedPhysicists: ["paul-dirac", "hermann-minkowski"],
    relatedTopics: [
      { branchSlug: "electromagnetism", topicSlug: "magnetic-monopoles-and-duality" },
      { branchSlug: "electromagnetism", topicSlug: "the-electromagnetic-field-tensor" },
    ],
  },
];

async function main() {
  const client = getServiceClient();

  console.log(`Seeding ${PHYSICISTS.length} physicists + ${GLOSSARY.length} glossary terms (en)…`);

  for (const p of PHYSICISTS) {
    const blocks = paragraphsToBlocks(p.bio);
    const meta = {
      shortName: p.shortName,
      born: p.born,
      died: p.died,
      nationality: p.nationality,
      contributions: p.contributions,
      majorWorks: p.majorWorks.map(parseMajorWork),
      relatedTopics: p.relatedTopics.map(({ branchSlug, topicSlug }) => ({ branchSlug, topicSlug })),
    };
    const payload = JSON.stringify({ title: p.name, subtitle: p.oneLiner, blocks, meta });
    const source_hash = createHash("sha256").update(payload).digest("hex");

    const { error } = await client.from("content_entries").upsert({
      kind: "physicist",
      slug: p.slug,
      locale: "en",
      title: p.name,
      subtitle: p.oneLiner,
      blocks,
      aside_blocks: [],
      meta,
      source_hash,
    });
    if (error) throw new Error(`physicist ${p.slug}: ${error.message}`);
    console.log(`  ✓ physicist ${p.slug}`);
  }

  for (const g of GLOSSARY) {
    const blocks = paragraphsToBlocks(g.description);
    const meta: Record<string, unknown> = {
      category: g.category,
      relatedPhysicists: g.relatedPhysicists ?? [],
      relatedTopics: (g.relatedTopics ?? []).map(({ branchSlug, topicSlug }) => ({ branchSlug, topicSlug })),
    };
    if (g.history) meta.history = g.history;
    const payload = JSON.stringify({ title: g.term, subtitle: g.shortDefinition, blocks, meta });
    const source_hash = createHash("sha256").update(payload).digest("hex");

    const { error } = await client.from("content_entries").upsert({
      kind: "glossary",
      slug: g.slug,
      locale: "en",
      title: g.term,
      subtitle: g.shortDefinition,
      blocks,
      aside_blocks: [],
      meta,
      source_hash,
    });
    if (error) throw new Error(`glossary ${g.slug}: ${error.message}`);
    console.log(`  ✓ glossary ${g.slug}`);
  }

  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
