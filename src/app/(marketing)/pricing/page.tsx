import { isClepEnabled, isDsstEnabled } from "@/lib/settings";
import PricingClient from "./pricing-client";

export default async function PricingPage() {
  const [clepOn, dsstOn] = await Promise.all([isClepEnabled(), isDsstEnabled()]);

  return <PricingClient clepEnabled={clepOn} dsstEnabled={dsstOn} />;
}
