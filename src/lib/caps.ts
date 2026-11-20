"use client";

export type Caps = {
  webcodecs: boolean;
  webgpu: boolean;
  indexeddb: boolean;
  offscreen: boolean;
  h264: boolean | null;
};

export async function detectCaps(): Promise<Caps> {
  const g = globalThis as unknown as Record<string, unknown>;
  const webcodecs = "VideoEncoder" in g && "VideoDecoder" in g && "AudioDecoder" in g;
  let webgpu = false;
  try {
    const gpu = (navigator as unknown as { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    webgpu = !!(gpu && (await gpu.requestAdapter()));
  } catch {
    webgpu = false;
  }
  let h264: boolean | null = null;
  if (webcodecs) {
    try {
      const VE = g.VideoEncoder as { isConfigSupported(c: object): Promise<{ supported?: boolean }> };
      const r = await VE.isConfigSupported({ codec: "avc1.640028", width: 1080, height: 1920, bitrate: 8e6, framerate: 30 });
      h264 = !!r.supported;
    } catch {
      h264 = false;
    }
  }
  return { webcodecs, webgpu, indexeddb: "indexedDB" in g, offscreen: "OffscreenCanvas" in g, h264 };
}
