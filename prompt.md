Task: Finish Module 7 (Fluids) and audit the full Classical Mechanics branch for any gaps — missing topics, wrong metadata, missing translations — then close them.                              
                                                                                                                                                                                                   
  ## What I found that you need to fix                                                                                                                                                             
                                                            
  ### Module 7 was half-shipped                                                                                                                                                                    
  Commit 521a3cb ("feat(cm/fluids): ship Module 7") shipped MDX + scenes + physics libs + tests, but never flipped the registry. In `lib/content/branches.ts` the four fluids topics are still:    
  - `status: "coming-soon"`                                                                                                                                                                        
  - `readingMinutes: 1` (placeholder)                       
                                                                                                                                                                                                   
  Topics to flip live: `pressure-and-buoyancy`, `bernoullis-principle`, `viscosity-and-reynolds-number`, `turbulence`. Real reading minutes should come from the actual content length (open each  
  `content.en.mdx` and estimate — don't just copy what I said).                                                                                                                                    
                                                                                                                                                                                                   
  ### Hebrew translations missing                           
  Modules 5 (Waves), 7 (Fluids), 8 (Lagrangian & Hamiltonian) all shipped without `content.he.mdx`. Missing files:
  - waves: `the-wave-equation`, `standing-waves-and-modes`, `doppler-and-shock-waves`, `dispersion-and-group-velocity`                                                                             
  - fluids: all 4                                                                                                                                                                                  
  - lagrangian-hamiltonian: `the-principle-of-least-action`, `the-lagrangian`, `the-hamiltonian`, `phase-space`                                                                                    
                                                                                                                                                                                                   
  Use the same translation approach as the earlier live modules (check existing `content.he.mdx` files in `oscillations` / `orbital-mechanics` / `kinematics-newton` for voice + KaTeX handling +  
  RTL patterns). KaTeX stays LTR inside RTL — already handled in globals.css.                                                                                                                      
                                                                                                                                                                                                   
  ## Audit — do this first, then fix                                                                                                                                                               
  
  1. Open `docs/roadmap/01-classical-mechanics.md` — this is the source of truth: 8 modules, 31 topics, FIG.01 → FIG.31.                                                                           
  2. Cross-check against `lib/content/branches.ts` (`CLASSICAL_MECHANICS_MODULES` + `CLASSICAL_MECHANICS_TOPICS`) and the on-disk dirs under `app/[locale]/(topics)/classical-mechanics/`.
  3. Produce a gap table:                                                                                                                                                                          
     - Topics in roadmap but missing from registry → add    
     - Topics in registry but `coming-soon` when content is actually shipped → flip to `live` + fix readingMinutes                                                                                 
     - Topics with `content.en.mdx` but no `content.he.mdx` → translate                                                                                                                            
     - Any module index / FIG number mismatches                                                                                                                                                    
     - Any physicists / glossary terms promised in roadmap but not seeded (spot-check 2–3 per module)                                                                                              
  4. Show me the gap table before fixing — I want to see the scope in one view.                                                                                                                    
  5. Then fix everything in the audit in one branch. Group commits by module (e.g. `chore(cm/fluids): flip topics live + fix reading minutes`, `feat(cm/waves): add hebrew translations`).         
                                                                                                                                                                                                   
  ## Rules                                                                                                                                                                                         
  - Read `docs/roadmap/01-classical-mechanics.md` fully — it has per-topic hooks, sections, scene specs. Treat it as spec.                                                                         
  - Reading minutes: estimate from content word count (200 wpm for English prose, slower for math-heavy sections).                                                                                 
  - Do NOT invent new topics or reorder modules. Roadmap is the contract.                                                                                                                          
  - Hebrew translations match voice of existing `he` content in Modules 1, 4, 6. No Google-translate flavor.                                                                                       
  - When flipping status live, also verify the `page.tsx` exists and compiles (`pnpm tsc --noEmit` on just that path or a full typecheck at the end).                                              
  - Final verification: `pnpm build` must pass. Report any pre-existing errors separately so I know they're not yours.                                                                             
                                                                                                                                                                                                   
  Start by reading the roadmap and `branches.ts`, then produce the gap table.                             