import { NextResponse } from "next/server";

interface ChicoMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChicoRequestBody {
  message: string;
  history?: ChicoMessage[];
  context?: {
    year?: number;
    month?: number;
    block_id?: string | null;
    activeLayer?: string;
  };
}

const CHICO_SYSTEM_PROMPT = `You are Chico, the friendly Amazon Firefighter guide for FireChronicle (named after Brazilian Amazon conservationist Chico Mendes).
You wear a bright yellow firefighter helmet with a small leaf badge, a red-orange fire-retardant jacket, soot-smudged cheeks, and have friendly expressive eyes.

Scientific Accuracy Guardrails you MUST strictly follow:
1. Spatial scope: Pará, Brazil (BR-PA) only. There are exactly 568 canonical 50 km grid blocks based on EPSG:6933 equal-area projection.
2. Era distinction:
   - Estimated era: 2002-07 through 2011-12. These are NB2 v1.0 model estimates translating 1 km Aqua MODIS detections to 375 m VIIRS S-NPP-equivalent counts.
   - Observed era: 2012-01 through 2020-12. These are actual direct S-NPP VIIRS satellite observations.
   - Pre-commissioning period: 2002-01 through 2002-06 is unsupported because Aqua MODIS became operational in July 2002.
   - Transition/commissioning months: July 2002 (Aqua MODIS partial commissioning, 37 complete pairs, 170 single-pass blocks) and January 2012 (S-NPP partial month, unobserved Jan 1-19).
3. Missing data vs Zero fires:
   - NEVER interpret missing satellite coverage (NULL / unobserved passes / coverage_status) as zero fires (0)!
   - An unobserved pass or missing data record preserves NULL. A true zero detection requires confirmed satellite observation evidence with 0 positive detections.
4. Day/Night contract:
   - Daytime (D) and Nighttime (N) passes exist.
   - Under strict daynight=ALL, a monthly block value requires both Daytime and Nighttime passes. If only one pass exists, the combined ALL value is NULL (not zero).
5. Tone:
   - Warm, encouraging, scientifically precise, and passionate about Amazon rainforest conservation.
   - Keep answers clear, accessible, and grounded in FireChronicle's data.`;

// Rulebook-grounded fallback responses when external LLM API key is not configured in local environment
function getKnowledgeResponse(userQuery: string, context?: ChicoRequestBody["context"]): string {
  const q = userQuery.toLowerCase();

  if (q.includes("who are you") || q.includes("who is chico") || q.includes("name")) {
    return "Oi! I'm **Chico**, your Pará Fire Watch Guide! I'm named in honor of Chico Mendes, the legendary Brazilian rubber tapper and Amazon rainforest conservationist. I wear my yellow helmet with our green leaf badge to help you navigate 19 years of satellite fire observations across Pará (2002–2020).";
  }

  if (q.includes("sensor gap") || q.includes("modis") || q.includes("viirs")) {
    return "The **Sensor Gap Problem** arises because modern **VIIRS** satellites—which detect smaller understory fires with crisp 375 m resolution—only began collecting data in **January 2012**. Before 2012, only coarser 1 km **MODIS** observations were available. Our **Negative Binomial (NB2 v1.0)** model bridges this 10-year gap by harmonizing MODIS observations into VIIRS-equivalent estimates back to July 2002!";
  }

  if (q.includes("null") || q.includes("zero") || q.includes("missing")) {
    return "**Crucial scientific rule:** We NEVER interpret missing satellite coverage (`NULL`) as zero fires (`0`)! If a satellite pass was blocked, clouded, or unobserved, we preserve `NULL` so we don't underestimate fire activity. A recorded `0` requires confirmed satellite observation evidence verifying no hotspots were detected.";
  }

  if (q.includes("day") || q.includes("night") || q.includes("pass")) {
    return "Satellite observations distinguish **Daytime (D)** passes from **Nighttime (N)** passes! Daytime passes capture peak agricultural clearing burns (driven by hot, dry midday conditions), while nighttime passes detect deep, persistent forest smoldering. Under our strict `daynight=ALL` contract, both passes must be complete for a block-month combined value, preserving data integrity.";
  }

  if (q.includes("nb2") || q.includes("model") || q.includes("formula") || q.includes("harmoniz")) {
    return "Our **Negative Binomial (NB2 v1.0)** model was calibrated using 9 years (2012–2020) of simultaneous overlapping MODIS and VIIRS observations. It predicts expected VIIRS detection counts using `log1p(modis_count)`, nighttime indicators (`daynight_N`), and monthly fixed seasonal effects, achieving a correlation of 0.994 on geographic holdouts across Pará!";
  }

  if (q.includes("era") || q.includes("estimated") || q.includes("observed") || q.includes("2012") || q.includes("2002")) {
    return "FireChronicle strictly separates two distinct eras:\n- **Estimated era (2002-07 to 2011-12):** Precomputed NB2 model extrapolations from Aqua MODIS.\n- **Observed era (2012-01 to 2020-12):** Ground-truth direct S-NPP VIIRS detections.\nMonths before July 2002 are marked as unsupported pre-commissioning because Aqua MODIS launched in mid-2002.";
  }

  if (q.includes("grid") || q.includes("block") || q.includes("568") || q.includes("50 km") || q.includes("map")) {
    return "Pará is partitioned into **568 canonical 50 km grid blocks** using the authoritative equal-area EPSG:6933 projection (nested from 10 km cells). Each block tracks monthly hotspot detections, historical coverage, and sensor status across the entire state boundary (IBGE 2024).";
  }

  // Context-aware general answer
  let contextBlurb = "";
  if (context?.year) {
    const eraName = context.year < 2012 ? "NB2 Estimated era" : "VIIRS Observed era";
    contextBlurb = ` (Currently viewing ${context.year} in the ${eraName})`;
  }

  return `Oi! I'm here to help you inspect FireChronicle's satellite observatory${contextBlurb}! You can ask me about:\n- How **MODIS and VIIRS** sensors differ\n- How the **NB2 v1.0 harmonization model** works\n- Why **NULL** values are never counted as zero fires\n- Daytime vs. Nighttime fire detection passes\n- The **568 Pará grid blocks** and 2002–2020 timeline`;
}

export async function POST(req: Request) {
  try {
    const body: ChicoRequestBody = await req.json();
    const { message, history = [], context } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "A message string is required." }, { status: 400 });
    }

    // Server-Side API Key Security Check (server-only environment variable, NEVER exposed to browser)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openAiApiKey = process.env.OPENAI_API_KEY;

    if (geminiApiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: CHICO_SYSTEM_PROMPT }],
              },
              contents: [
                ...history.slice(-6).map((h) => ({
                  role: h.role === "assistant" ? "model" : "user",
                  parts: [{ text: h.content }],
                })),
                {
                  role: "user",
                  parts: [
                    {
                      text: `${message}\n\n[Current UI Context: Year=${context?.year ?? 2020}, Month=${context?.month ?? 9}, Layer=${context?.activeLayer ?? "observed"}, Block=${context?.block_id ?? "All Pará"}]`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 600,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            return NextResponse.json({ reply: candidateText, source: "ai" });
          }
        }
      } catch {
        // Fall back gracefully to rulebook knowledge base on network or auth errors
      }
    } else if (openAiApiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: CHICO_SYSTEM_PROMPT },
              ...history.slice(-6).map((h) => ({
                role: h.role,
                content: h.content,
              })),
              {
                role: "user",
                content: `${message}\n\n[Current UI Context: Year=${context?.year ?? 2020}, Month=${context?.month ?? 9}, Layer=${context?.activeLayer ?? "observed"}, Block=${context?.block_id ?? "All Pará"}]`,
              },
            ],
            temperature: 0.4,
            max_tokens: 600,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({ reply, source: "ai" });
          }
        }
      } catch {
        // Fall back gracefully to rulebook knowledge base
      }
    }

    // Default: Authoritative Rulebook & Scientific Knowledge Base
    const reply = getKnowledgeResponse(message, context);
    return NextResponse.json({ reply, source: "rulebook" });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to process message at this time.",
      },
      { status: 500 }
    );
  }
}
