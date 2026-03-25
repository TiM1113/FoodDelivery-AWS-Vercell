import { redirect } from "next/navigation";
import { SignJWT } from "jose";

import { auth } from "@/auth";
import type { Order } from "@/types/order";
import { OrderList } from "./order-list";

const API_URL = process.env.API_URL || "";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

async function fetchUserOrders(userId: string): Promise<Order[]> {
  const backendJwt = await new SignJWT({ id: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const res = await fetch(`${API_URL}/api/order/userorders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `token=${backendJwt}`,
    },
    body: JSON.stringify({ userId }),
    cache: "no-store",
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.success ? data.data : [];
}

export default async function MyOrdersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/myorders");
  }

  const orders = await fetchUserOrders(session.user.id);

  return (
    <div className="mx-auto w-[90%] py-8 sm:w-[80%]">
      <h1 className="mb-6 text-2xl font-semibold">My Orders</h1>
      <OrderList initialOrders={orders} />
    </div>
  );
}
