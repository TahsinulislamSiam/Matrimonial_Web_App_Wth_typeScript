export const DEMO_MODE =
  process.env.DEMO_MODE === "1" && process.env.NODE_ENV !== "production";

export const APP_NAME = "CampusMatch";

export function assertDemoSafety() {
  if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE === "1") {
    throw new Error("DEMO_MODE must be 0 in production");
  }
}
