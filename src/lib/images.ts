import showroomImage from "@/assets/ozee-showroom.jpg";
import switchImage from "@/assets/ozee-switch.jpg";
import solarImage from "@/assets/ozee-solar.jpg";
import chandelierImage from "@/assets/ozee-chandelier.jpg";
import batteryImage from "@/assets/ozee-battery.jpg";
import logoImage from "@/assets/ozee-logo.jpg";

// The seed migration stores dev-only source paths (e.g. "/src/assets/ozee-solar.jpg")
// which Vite does not serve as-is in a production build. Map those known seed paths to
// the actual bundled assets; any other value (a real Supabase Storage URL from a future
// admin upload) is returned unchanged.
const SEED_ASSET_MAP: Record<string, string> = {
  "/src/assets/ozee-showroom.jpg": showroomImage,
  "/src/assets/ozee-switch.jpg": switchImage,
  "/src/assets/ozee-solar.jpg": solarImage,
  "/src/assets/ozee-chandelier.jpg": chandelierImage,
  "/src/assets/ozee-battery.jpg": batteryImage,
};

export function resolveImage(url: string | null | undefined): string {
  if (!url) return showroomImage;
  return SEED_ASSET_MAP[url] ?? url;
}

export { showroomImage, logoImage };
