// A navigation gate for the synthetic demo, not authentication or authorization.
export const DEMO_SESSION_KEY = "finora.demo.session";
export function isDemoSession() {
  return (
    typeof window !== "undefined" &&
    window.sessionStorage.getItem(DEMO_SESSION_KEY) === "active"
  );
}
export function startDemoSession() {
  window.sessionStorage.setItem(DEMO_SESSION_KEY, "active");
}
export function endDemoSession() {
  Object.keys(window.sessionStorage)
    .filter((key) => key.startsWith("finora.demo."))
    .forEach((key) => window.sessionStorage.removeItem(key));
}
