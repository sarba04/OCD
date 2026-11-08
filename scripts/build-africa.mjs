// Génère src/lib/geo/africa.ts : silhouette de l'Afrique (SVG path) + villes projetées.
// Usage : npm run geo   (dépendances de dev : world-atlas, topojson-client, d3-geo)
import { readFileSync, writeFileSync } from "node:fs";
import { merge } from "topojson-client";
import { geoMercator, geoPath, geoArea } from "d3-geo";

const topo = JSON.parse(readFileSync(new URL("../node_modules/world-atlas/countries-50m.json", import.meta.url)));
const AFRICA = new Set([
  "Algeria","Angola","Benin","Botswana","Burkina Faso","Burundi","Cameroon","Central African Rep.","Chad","Congo",
  "Dem. Rep. Congo","Côte d'Ivoire","Djibouti","Egypt","Eq. Guinea","Eritrea","eSwatini","Ethiopia","Gabon","Gambia",
  "Ghana","Guinea","Guinea-Bissau","Kenya","Lesotho","Liberia","Libya","Madagascar","Malawi","Mali","Mauritania",
  "Morocco","Mozambique","Namibia","Niger","Nigeria","Rwanda","Senegal","Sierra Leone","Somalia","Somaliland",
  "South Africa","S. Sudan","Sudan","Tanzania","Togo","Tunisia","Uganda","W. Sahara","Zambia","Zimbabwe",
]);
const geoms = topo.objects.countries.geometries.filter((g) => AFRICA.has(g.properties.name));
const merged = merge(topo, geoms); // MultiPolygon
// garde le continent + Madagascar (supprime les îlots)
merged.coordinates = merged.coordinates.filter((poly) => geoArea({ type: "Polygon", coordinates: poly }) > 0.0004);

const W = 1000, H = 1060;
const projection = geoMercator().fitExtent([[10, 10], [W - 10, H - 10]], merged);
// Douglas-Peucker sur les coordonnées projetées (tolérance en px du viewBox)
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  let max = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    const d = Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
    if (d > max) { max = d; idx = i; }
  }
  if (max <= tol) return [pts[0], pts[pts.length - 1]];
  return [...dp(pts.slice(0, idx + 1), tol).slice(0, -1), ...dp(pts.slice(idx), tol)];
}
const TOL = 1.6;
const r1 = (n) => Math.round(n * 10) / 10;
const path = merged.coordinates.map((poly) => poly.map((ring) => {
  const proj = ring.map((c) => projection(c));
  // anneau fermé : on coupe au point le plus éloigné du départ puis on simplifie chaque moitié
  let far = 0, fd = 0;
  proj.forEach(([x, y], i) => { const d = Math.hypot(x - proj[0][0], y - proj[0][1]); if (d > fd) { fd = d; far = i; } });
  const pts = [...dp(proj.slice(0, far + 1), TOL).slice(0, -1), ...dp(proj.slice(far), TOL)];
  return "M" + pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join("L") + "Z";
}).join("")).join("");

const CITIES = {
  lome: [1.2123, 6.1375], douala: [9.7085, 4.0511], abidjan: [-4.0083, 5.36], dakar: [-17.4467, 14.6928],
  kinshasa: [15.2663, -4.4419], ndjamena: [15.0444, 12.1348], bangui: [18.5582, 4.3947], libreville: [9.4673, 0.4162],
  bamako: [-8.0029, 12.6392], ouagadougou: [-1.5197, 12.3714], niamey: [2.1098, 13.5116], cotonou: [2.3912, 6.3703],
  lagos: [3.3792, 6.5244], accra: [-0.187, 5.6037], nairobi: [36.8219, -1.2921], casablanca: [-7.5898, 33.5731],
  johannesburg: [28.0473, -26.2041], brazzaville: [15.2832, -4.2634], conakry: [-13.5784, 9.6412],
};
const cities = Object.fromEntries(Object.entries(CITIES).map(([k, c]) => {
  const [x, y] = projection(c); return [k, [Math.round(x * 10) / 10, Math.round(y * 10) / 10]];
}));

const out = `// Fichier généré par scripts/build-africa.mjs — ne pas modifier à la main.
// Source : Natural Earth 1:50m via world-atlas, projection Mercator.
export const AFRICA_VIEWBOX = { width: ${W}, height: ${H} } as const;
export const AFRICA_PATH = ${JSON.stringify(path)};
export const AFRICA_CITIES = ${JSON.stringify(cities)} as const;
export type CityKey = keyof typeof AFRICA_CITIES;
`;
writeFileSync(new URL("../src/lib/geo/africa.ts", import.meta.url), out);
console.log("africa.ts", out.length, "bytes; polygons:", merged.coordinates.length, "lome", cities.lome);
