import { NextRequest, NextResponse } from "next/server";
import { createProduct, listProducts, getProductsByLead, getLead, getSubscriptionByEmail } from "@/lib/db";
import { isDashboardAuthed } from "@/lib/auth";
import { TIERS } from "@/lib/pricing";

export async function GET(req: NextRequest) {
  if (!(await isDashboardAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ products: await listProducts() });
}

export async function POST(req: NextRequest) {
  if (!(await isDashboardAuthed(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.name || !body.description) {
    return NextResponse.json({ error: "name and description are required" }, { status: 400 });
  }

  // Enforce the client's plan limit on number of distinct products (Pro is
  // unlimited — productsAllowed: null). Only applies when this product is
  // tied to a real client; ad-hoc test products from the dashboard (no
  // leadId) aren't limited.
  if (body.leadId) {
    const lead = await getLead(body.leadId);
    if (lead) {
      const sub = await getSubscriptionByEmail(lead.email);
      const tier = TIERS.find((t) => t.id === sub?.tierId) ?? TIERS[0];
      if (tier.productsAllowed !== null) {
        const existing = await getProductsByLead(body.leadId);
        if (existing.length >= tier.productsAllowed) {
          return NextResponse.json(
            {
              error: `This client's ${tier.name} plan allows up to ${tier.productsAllowed} product(s). Upgrade their plan to add more.`,
            },
            { status: 400 }
          );
        }
      }
    }
  }

  const product = await createProduct({
    name: body.name,
    description: body.description,
    imageUrl: body.imageUrl,
    leadId: body.leadId || null,
  });
  return NextResponse.json({ product }, { status: 201 });
}
