import type { Map as MapLibreMap, GeoJSONSource } from "maplibre-gl";
import type { GeoJSON } from "geojson";
import type { resolveMapData } from "@/lib/map/verified-data";

export const MAP_IDS = {
  boundary: "fc-boundary",
  boundaryFill: "fc-boundary-support",
  boundaryLine: "fc-boundary-line",
  blocks: "fc-blocks",
  blockFill: "fc-block-support",
  blockLine: "fc-block-line",
  hover: "fc-block-hover",
  selection: "fc-block-selection",
  hotspots: "fc-hotspots",
  provisionalHotspots: "fc-provisional-hotspots",
  aggregates: "fc-observed-aggregates",
  provisionalAggregates: "fc-provisional-aggregates",
} as const;

const EMPTY = { type: "FeatureCollection", features: [] } as const;

function source(map: MapLibreMap, id: string, data: GeoJSON | null) {
  const existing = map.getSource(id) as GeoJSONSource | undefined;
  if (existing) existing.setData(data ?? { type: "FeatureCollection", features: [] });
  else map.addSource(id, { type: "geojson", data: data ?? { ...EMPTY, features: [] } });
}

/**
 * Extracts numeric fire detection count from GeoJSON feature properties,
 * checking standard backend property aliases (count, viirs_count, estimated_viirs_count, etc.)
 */
export function extractBlockValue(properties: Record<string, unknown> | null | undefined): number | null {
  if (!properties) return null;
  const val =
    properties.current_value ??
    properties.viirs_count ??
    properties.estimated_viirs_count ??
    properties.harmonized_count ??
    properties.count ??
    properties.estimated_count ??
    properties.modis_count ??
    null;
  if (val === null || val === undefined) return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

/**
 * Builds data-driven fill color expression based on era (estimated amber vs observed emerald)
 * and monthly detection counts. True NULL / unobserved blocks remain transparent.
 */
function getBlockFillColor(
  colors: { green: string; amber: string; text: string; border: string },
  era?: "estimated" | "observed" | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const isHist = era === "estimated";

  if (isHist) {
    // Warm Amber ramp for historical estimated era (2002-2011)
    return [
      "case",
      ["==", ["get", "current_value"], null], "rgba(0,0,0,0)",
      ["<=", ["get", "current_value"], 0], "rgba(0,0,0,0)",
      [
        "step",
        ["get", "current_value"],
        "#fef08a", // 1-10
        10, "#fbbf24", // 11-50
        50, "#f59e0b", // 51-200
        200, "#d97706", // 201-1000
        1000, "#b45309" // >1000
      ]
    ];
  }

  // Light-to-dark emerald ramp for modern observed era (2012-2020)
  return [
    "case",
    ["==", ["get", "current_value"], null], "rgba(0,0,0,0)",
    ["<=", ["get", "current_value"], 0], "rgba(0,0,0,0)",
    [
      "step",
      ["get", "current_value"],
      "#a7f3d0", // 1-10 (light green)
      10, "#34d399", // 11-50
      50, "#10b981", // 51-200
      200, "#059669", // 201-1000
      1000, "#047857" // >1000 (dark green)
    ]
  ];
}

/**
 * Builds data-driven fill opacity expression.
 * True NULL / unobserved blocks remain transparent (0.0), while active detections scale up (0.35 to 0.90).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getBlockFillOpacity(): any {
  return [
    "case",
    ["==", ["get", "current_value"], null], 0.0,
    ["<=", ["get", "current_value"], 0], 0.0,
    [
      "step",
      ["get", "current_value"],
      0.35, // 1-10
      10, 0.50, // 11-50
      50, 0.65, // 51-200
      200, 0.80, // 201-1000
      1000, 0.90 // >1000
    ]
  ];
}

/**
 * Synchronizes MapLibre layers with verified boundary, canonical 50 km blocks,
 * and quantitative monthly block detection values.
 */
export function syncMapLayers(
  map: MapLibreMap,
  data: ReturnType<typeof resolveMapData>,
  colors: { green: string; amber: string; text: string; border: string },
  blockValues?: Record<string, number | null> | null,
  era?: "estimated" | "observed" | null
) {
  source(map, MAP_IDS.boundary, data.boundary?.geojson ?? null);

  // Attach current period's detection values to block feature properties
  let blocksGeojson: GeoJSON | null = null;
  if (data.blocks?.geojson) {
    blocksGeojson = {
      ...data.blocks.geojson,
      features: data.blocks.geojson.features.map((f) => {
        const explicitVal = blockValues ? (blockValues[f.properties.block_id] ?? null) : null;
        const val = explicitVal !== null ? explicitVal : extractBlockValue(f.properties);
        return {
          ...f,
          properties: {
            ...f.properties,
            current_value: val,
          },
        };
      }),
    };
  }
  source(map, MAP_IDS.blocks, blocksGeojson);

  source(map, MAP_IDS.hotspots, data.hotspots?.layer === "observed" ? data.hotspots.geojson : null);
  source(map, MAP_IDS.provisionalHotspots, data.hotspots?.layer === "provisional" ? data.hotspots.geojson : null);
  source(map, MAP_IDS.aggregates, data.aggregates?.layer === "observed" ? data.aggregates.geojson : null);
  source(map, MAP_IDS.provisionalAggregates, data.aggregates?.layer === "provisional" ? data.aggregates.geojson : null);

  const fillColor = getBlockFillColor(colors, era);
  const fillOpacity = getBlockFillOpacity();

  // If layers already exist, update paint properties dynamically
  if (map.getLayer(MAP_IDS.blockFill)) {
    map.setPaintProperty(MAP_IDS.blockFill, "fill-color", fillColor);
    map.setPaintProperty(MAP_IDS.blockFill, "fill-opacity", fillOpacity);
    return;
  }

  // Initial layer creation
  map.addLayer({
    id: MAP_IDS.boundaryFill,
    type: "fill",
    source: MAP_IDS.boundary,
    paint: { "fill-color": colors.green, "fill-opacity": 0.035 },
  });
  map.addLayer({
    id: MAP_IDS.aggregates,
    type: "line",
    source: MAP_IDS.aggregates,
    paint: { "line-color": colors.green, "line-width": 1 },
  });
  map.addLayer({
    id: MAP_IDS.provisionalAggregates,
    type: "line",
    source: MAP_IDS.provisionalAggregates,
    paint: { "line-color": colors.amber, "line-width": 1, "line-dasharray": [1, 2] },
  });
  map.addLayer({
    id: MAP_IDS.blockFill,
    type: "fill",
    source: MAP_IDS.blocks,
    paint: { "fill-color": fillColor, "fill-opacity": fillOpacity },
  });
  map.addLayer({
    id: MAP_IDS.blockLine,
    type: "line",
    source: MAP_IDS.blocks,
    paint: { "line-color": colors.border, "line-width": 1, "line-dasharray": [3, 2] },
  });
  map.addLayer({
    id: MAP_IDS.boundaryLine,
    type: "line",
    source: MAP_IDS.boundary,
    paint: { "line-color": colors.green, "line-width": 2 },
  });

  for (const [id, color, width] of [
    [MAP_IDS.hover, colors.text, 2],
    [MAP_IDS.selection, colors.green, 3],
  ] as const) {
    map.addLayer({
      id,
      type: "line",
      source: MAP_IDS.blocks,
      filter: ["==", ["get", "block_id"], ""],
      paint: { "line-color": color, "line-width": width },
    });
  }

  map.addLayer({
    id: MAP_IDS.hotspots,
    type: "circle",
    source: MAP_IDS.hotspots,
    paint: {
      "circle-radius": 3,
      "circle-color": colors.amber,
      "circle-stroke-color": colors.text,
      "circle-stroke-width": 0.5,
    },
  });
  map.addLayer({
    id: MAP_IDS.provisionalHotspots,
    type: "circle",
    source: MAP_IDS.provisionalHotspots,
    paint: {
      "circle-radius": 4,
      "circle-opacity": 0,
      "circle-stroke-color": colors.amber,
      "circle-stroke-width": 1.5,
    },
  });
}

export function highlightBlock(
  map: MapLibreMap,
  id: typeof MAP_IDS.hover | typeof MAP_IDS.selection,
  blockId: string | null
) {
  if (map.getLayer(id)) map.setFilter(id, ["==", ["get", "block_id"], blockId ?? ""]);
}
