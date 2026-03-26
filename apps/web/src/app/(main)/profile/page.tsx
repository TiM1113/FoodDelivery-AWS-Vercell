import { redirect } from "next/navigation";
import { SignJWT } from "jose";

import { auth } from "@/auth";
import type { SavedAddress } from "@/types/address";
import { ProfileClient } from "./profile-client";

const API_URL = process.env.API_URL || "";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

async function mintJwt(userId: string) {
  return new SignJWT({ id: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

async function fetchAddresses(userId: string): Promise<SavedAddress[]> {
  const jwt = await mintJwt(userId);
  const res = await fetch(`${API_URL}/api/user/addresses`, {
    headers: { Cookie: `token=${jwt}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.success ? data.data : [];
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile");
  }

  const addresses = await fetchAddresses(session.user.id);

  return (
    <div className="mx-auto w-[90%] py-8 sm:w-[80%]">
      <h1 className="mb-6 text-2xl font-semibold">My Profile</h1>
      <ProfileClient
        initialName={session.user.name ?? ""}
        email={session.user.email ?? ""}
        initialAddresses={addresses}
      />
    </div>
  );
}
