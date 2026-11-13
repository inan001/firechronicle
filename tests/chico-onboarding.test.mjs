import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');

test('Chico Mascot component verification', () => {
  const mascotPath = join(root, 'src/components/onboarding/ChicoMascot.tsx');
  assert.ok(existsSync(mascotPath), 'ChicoMascot.tsx must exist');
  const content = readFileSync(mascotPath, 'utf8');

  // Verify mascot visual details
  assert.ok(content.includes('Chico Mendes Amazon Firefighter mascot'), 'Must cite Chico Mendes Amazon Firefighter mascot in accessible label');
  assert.ok(content.includes('chico-helmet-grad') || content.includes('FACC15'), 'Must render bright yellow firefighter helmet');
  assert.ok(content.includes('chico-leaf-grad') || content.includes('Amazon Leaf Badge'), 'Must feature small Amazon green leaf badge');
  assert.ok(content.includes('chico-jacket-grad') || content.includes('EA580C'), 'Must render red-orange fire-retardant jacket');
  assert.ok(content.includes('soot-grad') || content.includes('Soot-Smudged Cheeks'), 'Must render soot-smudged cheeks');
  assert.ok(content.includes('chico-highvis-grad'), 'Must render high-vis safety reflective band');

  // Verify supported poses
  assert.ok(content.includes('"wave"'), 'Must support wave pose');
  assert.ok(content.includes('"explain"'), 'Must support explain pose');
  assert.ok(content.includes('"point"'), 'Must support point pose');
  assert.ok(content.includes('"celebrate"'), 'Must support celebrate pose');

  // Verify compact sizing
  assert.ok(content.includes('w-24 h-24') || content.includes('w-28 h-28'), 'Must support compact 96px-112px tall sizing');
});

test('Chico Tour Guide steps and script verification', () => {
  const tourPath = join(root, 'src/components/onboarding/ChicoTourGuide.tsx');
  assert.ok(existsSync(tourPath), 'ChicoTourGuide.tsx must exist');
  const content = readFileSync(tourPath, 'utf8');

  // Step 1: Meet Chico
  assert.ok(content.includes("Oi! I'm Chico, your Pará Fire Watch Guide!"), 'Must contain Step 1 exact title');
  assert.ok(content.includes('tracking 19 years of wildfire activity across **Pará, Brazil (2002–2020)** on a 50 km spatial grid'), 'Must contain Step 1 exact body');

  // Step 2: The Sensor Gap Problem
  assert.ok(content.includes('The Sensor Gap Problem'), 'Must contain Step 2 exact title');
  assert.ok(content.includes('Modern **VIIRS** satellites detect small understory fires with sharp 375 m resolution, but they only launched in **2012**'), 'Must contain Step 2 exact body');

  // Step 3: Cross-Sensor Harmonization
  assert.ok(content.includes('Cross-Sensor Harmonization (NB2 v1.0)'), 'Must contain Step 3 exact title');
  assert.ok(content.includes('reconstructs VIIRS-equivalent fire activity back to **July 2002** across all 568 Pará grid blocks'), 'Must contain Step 3 exact body');

  // Step 4: Interactive Pará Map
  assert.ok(content.includes('Explore the 50 km Pará Grid'), 'Must contain Step 4 exact title');
  assert.ok(content.includes('[data-tour="map-canvas"]'), 'Must target data-tour="map-canvas"');

  // Step 5: Timeline & Era Switcher
  assert.ok(content.includes('Travel from 2002 to 2020'), 'Must contain Step 5 exact title');
  assert.ok(content.includes('Scrub across **222 months**'), 'Must contain Step 5 exact body');
  assert.ok(content.includes('[data-tour="timeline-controls"]'), 'Must target data-tour="timeline-controls"');

  // Step 6: Day / Night & Sensor Filters
  assert.ok(content.includes('Filter Day vs. Night Detections'), 'Must contain Step 6 exact title');
  assert.ok(content.includes('[data-tour="filter-controls"]'), 'Must target data-tour="filter-controls"');

  // Step 7: Ready to Investigate
  assert.ok(content.includes('Inspect Trends & Calibration Metrics'), 'Must contain Step 7 exact title');
  assert.ok(content.includes('[data-tour="analytics-panel"]'), 'Must target data-tour="analytics-panel"');

  // Tour controls
  assert.ok(content.includes('firechronicle_tour_completed'), 'Must use localStorage firechronicle_tour_completed key');
  assert.ok(content.includes('Ask Chico'), 'Must render Ask Chico pill button');
  assert.ok(content.includes('Start Exploring'), 'Must render Start Exploring button on final step');
});

test('Target components have non-intrusive data-tour attributes cleanly attached', () => {
  const mapWorkspace = readFileSync(join(root, 'src/components/map/map-workspace.tsx'), 'utf8');
  assert.ok(mapWorkspace.includes('data-tour="map-canvas"'), 'MapWorkspace must have data-tour="map-canvas"');

  const periodControls = readFileSync(join(root, 'src/components/calendar/period-controls.tsx'), 'utf8');
  assert.ok(periodControls.includes('data-tour="timeline-controls"'), 'PeriodControls must have data-tour="timeline-controls"');

  const layerControls = readFileSync(join(root, 'src/components/map/layer-controls.tsx'), 'utf8');
  assert.ok(layerControls.includes('data-tour="filter-controls"'), 'LayerControls must have data-tour="filter-controls"');

  const analysisPanel = readFileSync(join(root, 'src/components/layout/analysis-panel.tsx'), 'utf8');
  assert.ok(analysisPanel.includes('data-tour="analytics-panel"'), 'AnalysisPanel must have data-tour="analytics-panel"');
});

test('Chico API route handler security and scientific accuracy guardrails', () => {
  const apiRoutePath = join(root, 'src/app/api/chico/route.ts');
  assert.ok(existsSync(apiRoutePath), 'src/app/api/chico/route.ts must exist');
  const content = readFileSync(apiRoutePath, 'utf8');

  // Server-side security: NEVER NEXT_PUBLIC
  assert.ok(!content.includes('NEXT_PUBLIC_'), 'Must never use NEXT_PUBLIC variables for API keys');
  assert.ok(content.includes('process.env.GEMINI_API_KEY') || content.includes('process.env.OPENAI_API_KEY'), 'Must use server-side environment variables');

  // Scientific accuracy guardrails
  assert.ok(content.includes('568 canonical 50 km grid blocks'), 'Must cite 568 canonical 50 km blocks');
  assert.ok(content.includes('2002-07 through 2011-12'), 'Must cite estimated era 2002-07 to 2011-12');
  assert.ok(content.includes('2012-01 through 2020-12'), 'Must cite observed era 2012-01 to 2020-12');
  assert.ok(content.includes('NEVER interpret missing satellite coverage (NULL') || content.includes('NEVER interpret missing satellite coverage (`NULL`) as zero fires (`0`)'), 'Must forbid interpreting NULL as zero fires');
  assert.ok(content.includes('daynight=ALL'), 'Must document strict daynight=ALL contract');
});
