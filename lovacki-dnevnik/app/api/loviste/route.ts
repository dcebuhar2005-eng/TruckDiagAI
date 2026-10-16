// Koje je službeno (državno ili privatno) lovište na točki – pita WMS Ministarstva poljoprivrede,
// šumarstva i ribarstva (otvorena dozvola). Ide preko poslužitelja jer Ministarstvov servis ne
// dopušta izravne upite iz preglednika.

const WMS = "https://geoportal.mps.hr/geocluster/am2/wms";

export async function GET(request: Request) {
  const u = new URL(request.url);
  const lat = Number(u.searchParams.get("lat"));
  const lng = Number(u.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 42 || lat > 47 || lng < 13 || lng > 20) {
    return Response.json({ greska: "Točka nije u Hrvatskoj" }, { status: 400 });
  }
  // Mali okvir (~50 m) oko točke; upit za piksel u sredini.
  const d = 0.0005;
  const p = new URLSearchParams({
    service: "WMS",
    version: "1.1.1",
    request: "GetFeatureInfo",
    layers: "ForestManagementArea",
    query_layers: "ForestManagementArea",
    styles: "",
    srs: "EPSG:4326",
    bbox: [lng - d, lat - d, lng + d, lat + d].join(","),
    width: "101",
    height: "101",
    x: "50",
    y: "50",
    info_format: "application/json",
    feature_count: "1",
  });
  try {
    const r = await fetch(`${WMS}?${p}`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return Response.json({ greska: `Servis je vratio ${r.status}` }, { status: 502 });
    const j = (await r.json()) as { features?: { properties?: Record<string, unknown> }[] };
    const svojstva = j.features?.[0]?.properties ?? null;
    return Response.json({ loviste: svojstva }, { headers: { "Cache-Control": "public, max-age=86400" } });
  } catch {
    return Response.json({ greska: "Servis Ministarstva ne odgovara" }, { status: 504 });
  }
}
