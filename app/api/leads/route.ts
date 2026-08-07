import { NextRequest, NextResponse } from "next/server";
import { createLead, listLeads } from "@/lib/db";

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

  return NextResponse.json({ lead }, { status: 201 });
}

export async function GET() {
  const leads = await listLeads();
  return NextResponse.json({ leads });
}
