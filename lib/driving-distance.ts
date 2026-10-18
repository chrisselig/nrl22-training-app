export const CALGARY = { lat: 51.0447, lng: -114.0719 };

export function googleMapsDirectionsUrl(destination: string): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", "Calgary, AB");
  url.searchParams.set("destination", destination);
  return url.toString();
}
