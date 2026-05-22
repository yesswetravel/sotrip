/**
 * Shared Google Maps style — warm palette matching SoTrip's ivory/teal/coral theme.
 * Used by: MapWrapper (native), MapWrapper.web (JS API), static map URLs (day view).
 */

export const MAP_STYLE = [
  // Global: desaturate + warm shift
  { featureType: "all", stylers: [{ saturation: -60 }, { lightness: 5 }] },

  // Water → warm teal (echoes our teal #4A6E6B but much lighter)
  { featureType: "water", stylers: [{ color: "#c4d4d1" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#7c8290" }] },

  // Land → our ivory #ECE6D6
  { featureType: "landscape", stylers: [{ color: "#ece6d6" }] },
  { featureType: "landscape.man_made", stylers: [{ color: "#e5dece" }] },

  // Roads → our mist #DED7C5, highways → sand #D6C6A2
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ded7c5" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#d6cfbe" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#d6c6a2" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#7c8290" }] },

  // Labels → our stone #7C8290
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#7c8290" }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#d6c6a2" }] },
  { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#ded7c5" }] },

  // Hide clutter
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

/**
 * Convert MAP_STYLE to Google Static Maps URL &style= params.
 */
export function mapStyleToUrlParams(): string {
  return MAP_STYLE.map((rule) => {
    const parts: string[] = [];
    if (rule.featureType) parts.push(`feature:${rule.featureType}`);
    if ((rule as any).elementType) parts.push(`element:${(rule as any).elementType}`);
    if (rule.stylers) {
      rule.stylers.forEach((s: any) => {
        const key = Object.keys(s)[0];
        parts.push(`${key}:${s[key]}`);
      });
    }
    return `&style=${parts.join("|")}`;
  }).join("");
}
