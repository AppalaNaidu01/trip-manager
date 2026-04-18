"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LandingFeaturesBento } from "@/components/landing/LandingFeaturesBento";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  function onExploreTrips() {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }

  return (
    <div className="min-h-dvh w-full bg-[#F9F9F7] pb-12 text-slate-900">
      <div className="mx-auto w-full max-w-lg px-4 pb-4 pt-2">
        <LandingHeader user={user} />
        <LandingHero onExploreTrips={onExploreTrips} />
        <LandingFeaturesBento />
      </div>
    </div>
  );
}
