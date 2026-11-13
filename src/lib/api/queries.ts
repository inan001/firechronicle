import { useQuery } from "@tanstack/react-query";
import { dataClient } from "@/lib/api";
import type { MapData, FrozenBoundary, VerifiedBlocks } from "@/types/map-data";

export const queryKeys = {
  all: ["firechronicle"] as const,
  mapData: () => [...queryKeys.all, "map-data"] as const,
  statewide: (mode: string) => [...queryKeys.all, "statewide", mode] as const,
  calendar: (mode: string) => [...queryKeys.all, "calendar", mode] as const,
  blocksSummary: (mode: string) => [...queryKeys.all, "blocks-summary", mode] as const,
  blockTimeSeries: (blockId: string | null, mode: string) => [...queryKeys.all, "block-timeseries", blockId, mode] as const,
  modelMetrics: (mode: string) => [...queryKeys.all, "model-metrics", mode] as const,
};

export async function fetchMapData(): Promise<MapData> {
  const [bRes, blkRes] = await Promise.all([
    fetch("/data/geo/para_boundary.json"),
    fetch("/data/geo/para_50km_blocks.json"),
  ]);

  if (!bRes.ok || !blkRes.ok) {
    throw new Error(`Failed to load geographic boundaries: boundary=${bRes.status}, blocks=${blkRes.status}`);
  }

  const boundary = (await bRes.json()) as FrozenBoundary;
  const blocks = (await blkRes.json()) as VerifiedBlocks;

  return {
    boundary,
    blocks,
    hotspots: null,
    aggregates: null,
  };
}

export function useMapData() {
  return useQuery({
    queryKey: queryKeys.mapData(),
    queryFn: fetchMapData,
    staleTime: Infinity, // Geographies are frozen
  });
}

export function useStatewideTimeSeries() {
  return useQuery({
    queryKey: queryKeys.statewide(dataClient.mode),
    queryFn: () => dataClient.getStatewideTimeSeries(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useCalendarMatrix() {
  return useQuery({
    queryKey: queryKeys.calendar(dataClient.mode),
    queryFn: () => dataClient.getCalendarMatrix(),
    staleTime: 1000 * 60 * 30,
  });
}

export function useBlocksSummary() {
  return useQuery({
    queryKey: queryKeys.blocksSummary(dataClient.mode),
    queryFn: () => dataClient.getBlocksSummary(),
    enabled: dataClient.mode !== "live",
    staleTime: 1000 * 60 * 30,
  });
}

export function useSpatialData(year: number, month: number, daynight: string = "ALL") {
  return useQuery({
    queryKey: [...queryKeys.all, "spatial", year, month, daynight, dataClient.mode],
    queryFn: async () => {
      if (typeof dataClient.getSpatial === "function") {
        return (await dataClient.getSpatial({ year, month, daynight })) as {
          type: "FeatureCollection";
          features: Array<{
            type: "Feature";
            properties: Record<string, unknown>;
            geometry: unknown;
          }>;
        };
      }
      return null;
    },
    enabled: dataClient.mode === "live",
    staleTime: 1000 * 60 * 10,
  });
}

export function useBlockTimeSeries(blockId: string | null) {
  const { data: blocksSummary, isLoading, error } = useBlocksSummary();

  const blockData = blockId && blocksSummary ? blocksSummary.blocks[blockId] ?? null : null;

  return {
    blockData,
    isLoading,
    error,
    periods: blocksSummary?.periods ?? [],
  };
}

export function useModelMetrics() {
  return useQuery({
    queryKey: queryKeys.modelMetrics(dataClient.mode),
    queryFn: () => dataClient.getModelMetrics(),
    staleTime: Infinity,
  });
}
