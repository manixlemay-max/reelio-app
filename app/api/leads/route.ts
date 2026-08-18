import { NextRequest, NextResponse } from "next/server";
import { createLead, listLeads, createProduct, createVideo } from "@/lib/db";
import { generateVideo } from "@/lib/videoProvider";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.name || !body.email || !body.businessName || !body.productDescription) {
    return NextResponse.json(
      { error: "Name, email, business name and product description are required." },
      { status: 400 }
    );
  }

  const lead = await createLead({
    name: body.name,
    email: body.email,
    businessName: body.businessName,
    productDescription: body.productDescription,
    socialHandles: body.socialHandles,
    notes: body.notes,
  });

  // Fully hands-off from here: create the client's first product from what
  // they just told us, and kick off their first AI video immediately — no
  // action needed from the dashboard. (generateVideo() only starts the job
  // and returns right away; the cron at /api/cron/process-videos picks it up
  // once it's actually rendered and posts it automatically.)
  try {
    const product = await createProduct({
      name: lead.businessName,
      description: lead.productDescription,
      leadId: lead.id,
    });

    const result = await generateVideo({
      productName: product.name,
      productDescription: product.description,
    });

    await createVideo({
      productId: product.id,
      provider: result.provider,
      status: result.status,
      videoUrl: result.videoUrl,
      externalJobId: result.externalJobId ?? null,
    });
  } catch (err) {
    // Never block the signup flow on this — worst case, the daily
    // recurring-video cron will pick up this client and generate one anyway.
    console.error("Auto product/video creation failed for lead", lead.id, err);
  }

  return NextResponse.json({ lead }, { status: 201 });
}

export async function GET() {
  const leads = await listLeads();
  return NextResponse.json({ leads });
}
