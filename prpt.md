## Goal
  Make the /ask chat feel fast: first text token streams within ~2s for any question, tool invocations (graphs, scenes, web search) render as inline placeholders with their own progress state    
  instead of blocking the whole reply, and the UI shows what the model is currently doing rather than a silent "Streaming…" spinner.                                                               
                                                                                                                                                                                                   
  ## Context                                                                                                                                                                                       
  - **Project**: physics (Physics.explained)                                                                                      
  - **Path**: `~/Developer/physics/`                                                                                                                                                               
  - **Stack**: Next.js 15 App Router, TypeScript strict, Tailwind v4, next-intl, Anthropic SDK, Supabase (physics-supabase ref)                                                                    
  - **Feature owner path**: `/ask` — AI physics tutor with tool use (plots, scenes, glossary, web search)                                                                                          
  - **Model**: Claude (configurable via model-picker). Uses streaming + tool_use via Anthropic SDK                                                                                                 
  - **Transport**: SSE — `app/api/ask/stream/route.ts` → browser EventSource consumer in `components/ask/chat-screen.tsx`                                                                          
                                                                                                                                                                                                   
  ## Before Starting                                                                                                                                                                               
  Read these files first, in order:                                                                                                                                                                
  1. `app/api/ask/stream/route.ts` — SSE route, tool loop, event shapes                                                                                                                            
  2. `lib/ask/pipeline.ts` — message assembly + tool orchestration                                                                                                                                 
  3. `lib/ask/toolset.ts` — full tool definitions currently passed to the model                                                                                                                    
  4. `lib/ask/tool-schemas.ts` — input schemas                                                                                                                                                     
  5. `lib/ask/prompts.ts` — system prompt + tool-routing instructions                                                                                                                              
  6. `lib/ask/sse.ts` — event encoder/decoder                                                                                                                                                      
  7. `components/ask/chat-screen.tsx` — client SSE reader and message state                                                                                                                        
  8. `components/ask/streaming-message.tsx` — partial-text renderer                                                                                                                                
  9. `components/ask/progress-tree.tsx` — current "what the AI is doing" UI (underused)                                                                                                            
  10. `components/ask/math-plot.tsx` + `components/ask/inline-scene.tsx` — heavy renderers we need to lazy-placeholder                                                                             
                                                                                                                                                                                                   
  Then profile a real slow request: open devtools → Network → send a simple question ("what is gravity?") and capture:                                                                             
  - Time to first SSE event                                                                                                                                                                        
  - Time to first `text_delta`                                                                                                                                                                     
  - Full tool-use sequence (which tools fired, when)                                                                                                                                               
  - Total duration
                                                                                                                                                                                                   
  Report these numbers in the first message before writing any code.
                                                                                                                                                                                                   
  ## Tasks                                                                                                                                                                                         
  1. **Measure baseline.** Instrument `app/api/ask/stream/route.ts` with `console.time` markers: `tools_loaded`, `first_anthropic_request`, `first_sdk_event`, `first_text_delta`,
  `first_tool_use`, `stop`. Send 3 test questions (trivial / medium / graph-requiring) and record numbers. Paste the table in chat before touching anything else.                                  
                                                         
  2. **Shrink the tool surface for trivial answers.** In `lib/ask/prompts.ts` and `lib/ask/toolset.ts`, move from "always pass all tools" to a conditional toolset. Rules:                         
     - On the first model turn, pass ONLY the minimal toolset (no heavyweight tools like web_search or scene builders).
     - Upgrade to the full toolset only if the model explicitly requests a capability (tool_use with a "request_more_tools" sentinel) or the user message matches a router heuristic (graph        
  keywords, "plot", "simulate", "cite", "latest"). Put the heuristic in `lib/ask/pipeline.ts` as `selectInitialTools(userMessage)`.                                                                
     - Keep the system prompt ≤ 800 tokens for the trivial path; measure with `countTokens` before committing.                                                                                     
                                                                                                                                                                                                   
  3. **Stream text before tools resolve.** Audit the tool loop in `app/api/ask/stream/route.ts`. Right now any tool_use appears to pause visible output. Change to:                                
     - Always flush `text_delta` events to the client immediately, regardless of whether the model will also emit tool_use blocks in the same turn.                                                
     - When a `tool_use` block opens, emit a new SSE event `tool_start` with `{ id, name, title }` and continue streaming text. Do not wait for the tool result before flushing already-buffered   
  text.                                                                                                                                                                                            
     - When the tool finishes, emit `tool_result` with the payload. When it errors, emit `tool_error`.                                                                                             
                                                                                                                                                                                                   
  4. **Inline placeholder UI for pending tools.** In `components/ask/chat-screen.tsx`, build a `pendingTools: Record<id, {name,title,startedAt}>` map driven by `tool_start` / `tool_result`       
  events. Render a placeholder card in the message stream at the position of the tool:                                                                                                             
     - Plot tool → `<MathPlotPlaceholder title="Rendering plot…" />` (spinner + skeleton of the axes).                                                                                             
     - Scene tool → `<InlineScenePlaceholder title="Building scene…" />`.                                                                                                                          
     - Web search → `<SearchPlaceholder query={args.query} />` showing "Searching the web for: …".                                                                                                 
     - Glossary batch → small inline "Fetching definitions…" chip.                                                                                                                                 
     Replace each placeholder in-place when `tool_result` arrives. Use `<Suspense>` + `React.lazy` for `math-plot.tsx` and `inline-scene.tsx` so the heavy renderers don't block initial paint.    
                                                                                                                                                                                                   
  5. **Drive ProgressTree from real events.** `components/ask/progress-tree.tsx` exists but does not seem to surface detail. Feed it the live event stream so users see: "Thinking → Calling tool: 
  plot_function → Streaming answer → Done." Each step shows elapsed time. Remove the generic "Streaming…" spinner in favor of the last step's label.                                               
                                                                                                                                                                                                   
  6. **Parallelize independent tool calls.** In `lib/ask/pipeline.ts`, if a model turn emits multiple tool_use blocks, run them in `Promise.all` rather than sequentially. Guard each with its own 
  try/catch so one failure doesn't cancel the others.
                                                                                                                                                                                                   
  7. **Cut context bloat.** In `lib/ask/context.ts`:                                                                                                                                               
     - Cap message history sent to the model to the last N turns (default 8) + a compact summary of earlier turns.
     - For tool_result blocks from past turns, keep only a truncated summary (first 200 chars) unless the model explicitly re-references them.                                                     
     - Add prompt caching (`cache_control: { type: "ephemeral" }`) to the system prompt + the top of message history so repeat turns in one conversation hit the cache.                            
                                                                                                                                                                                                   
  8. **Kill sequential awaits in the route.** Scan `app/api/ask/stream/route.ts` for `await` chains that could run in parallel (rate-limit check + quota check + conversation load + user context).
   Use `Promise.all` for the ones without data dependencies.                                                                                                                                       
                                                                                                                                                                                                   
  9. **Smaller default model for router turn.** If routing is added in task 2, the router turn (pure classification) should use Haiku 4.5 (`claude-haiku-4-5-20251001`), not whatever the picker   
  selected. Keep the user-selected model for the actual answer.
                                                                                                                                                                                                   
  10. **Test: golden path + graph path + web path.**                                                                                                                                               
      - Golden path: send "What is momentum?" — first text visible < 2s, no tools fire, total < 6s.
      - Graph path: send "Plot sin(x) from 0 to 2π" — text starts < 2s, plot placeholder visible immediately, plot renders when ready, ProgressTree shows tool step.                               
      - Web path: send "What's the current value of the fine-structure constant?" — text starts < 2s, "Searching web for …" placeholder visible, result inlined.                                   
      Record the same baseline metrics from task 1 and paste the before/after table.                                                                                                               
                                                                                                                                                                                                   
  ## Constraints                                                                                                                                                                                   
  - Do NOT hardcode API keys or model IDs — Anthropic key from env, model from `lib/ask/provider.ts` / picker.                                                                                     
  - Do NOT break existing conversations in Supabase — preserve the saved message shape; only additive SSE events.                                                                                  
  - Do NOT remove tools without gating them behind the conditional toolset — heavy questions must still work.                                                                                      
  - Keep strict TypeScript. Named exports. kebab-case files.                                                                                                                                       
  - Do NOT bypass `lib/ask/rate-limit.ts` or `lib/ask/cost.ts` — both must still run on every request.                                                                                             
  - Respect the kill switch (`components/ask/kill-switch-banner.tsx`) — if off, no changes to that path.                                                                                           
  - Fail loudly: any tool error → structured `tool_error` SSE event, never silent swallow.                                                                                                         
  - Prompt caching must not leak across conversations — cache key scoped per conversation.                                                                                                         
                                                                                                                                                                                                   
  ## Success Criteria                                                                                                                                                                              
  - [ ] First `text_delta` visible in the UI within 2s for a trivial question (measured, not felt).                                                                                                
  - [ ] No more silent > 10s "Streaming…" state — ProgressTree always shows the current step with elapsed time.                                                                                    
  - [ ] Tool-backed answers (plot, scene, web search) show inline placeholders that morph into the final artifact without blocking the surrounding text.                                           
  - [ ] Before/after latency table posted in chat showing ≥ 40% reduction in time-to-first-text for the 3 test prompts.                                                                            
  - [ ] All 1093 existing tests still pass. New tests added for `selectInitialTools()` router and for SSE event ordering (`text_delta` can precede `tool_result`).                                 
  - [ ] No regression in saved conversations — old transcripts still load and render correctly.                                                                                                    
                                                                                                                                                                                                   
  Save this verbatim and paste it at the start of your next /ask optimization session.  