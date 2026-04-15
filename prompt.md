Smoke-test the physics-mcp server. Run each tool and show me the raw result.                                                                                                                     
  If any tool is missing from your tool list, stop and tell me — the server                                                                                                                        
  isn't connected.                                                                                                                                                                                 
1. mcp__physics-mcp__list_slugs({ kind: "branch" })                                                                                                                                              
     Expected: ["classical-mechanics","electromagnetism","thermodynamics","relativity","quantum","modern-physics"]                                                                                 
2. mcp__physics-mcp__list_slugs({ kind: "topic" })                                                                                                                                               
     Expected: 7 entries, all under classical-mechanics (the-simple-pendulum,                                                                                                                      
     beyond-small-angles, oscillators-everywhere, kepler, universal-gravitation,                                                                                                                   
     energy-in-orbit, tides-and-three-body)                                                                                                                                                        
3. mcp__physics-mcp__list_slugs({ kind: "term" })                                                                                                                                                
     Expected: 35 slugs starting with "pendulum-clock", "telescope", "quadrant",
     "astrolabe", "isochronism"
4. mcp__physics-mcp__list_slugs({ kind: "physicist" })
     Expected: 16 physicist slugs starting with "galileo-galilei", "isaac-newton"

  5. mcp__physics-mcp__list_slugs({ kind: "locale" })
     Expected: ["en","he"]

  6. mcp__physics-mcp__get_terminology({ en: "isochronism" })
     Expected: { he: "םזינורכוזיא" }
                                                                                                                                                                                                   
  7. mcp__physics-mcp__get_terminology({ en: "isochronism", locale: "he" })
     Expected: the string "םזינורכוזיא" (not wrapped in an object)                                                                                                                                 
                                                            
  8. mcp__physics-mcp__get_terminology({ en: "this-term-does-not-exist" })
     Expected: { he: null }

  Do NOT run add_topic, add_dictionary_term, or add_locale in this session —
  those are destructive and need real inputs. We're just proving the server is
  wired.