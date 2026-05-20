import { NextResponse } from "next/server";

// POST /api/checkout
// Body: { quantity: number, email?: string, phone?: string }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const quantity = Number(body?.quantity ?? 0);
    let email = typeof body?.email === "string" ? body.email : undefined;
    const phone = typeof body?.phone === "string" ? body.phone : undefined;
    
    // Product selection data
    const productId = typeof body?.productId === "string" ? body.productId : undefined;
    const variantId = typeof body?.variantId === "string" ? body.variantId : undefined;
    const selectedColor = typeof body?.selectedColor === "string" ? body.selectedColor : undefined;
    const selectedSize = typeof body?.selectedSize === "string" ? body.selectedSize : undefined;
    const purchaseType = typeof body?.purchaseType === "string" ? body.purchaseType : undefined;
    
    // Shipping address data
    const shippingAddress = body?.shippingAddress ? {
      firstName: body.shippingAddress.firstName || '',
      lastName: body.shippingAddress.lastName || '',
      company: body.shippingAddress.company || undefined,
      address1: body.shippingAddress.address1 || '',
      address2: body.shippingAddress.address2 || undefined,
      city: body.shippingAddress.city || '',
      state: body.shippingAddress.state || '',
      postalCode: body.shippingAddress.postalCode || '',
      country: body.shippingAddress.country || 'US',
      phone: body.shippingAddress.phone || undefined,
    } : undefined;

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    // Delegate to Convex action which also creates a pending entry
    const { ConvexHttpClient } = await import("convex/browser");
    const { api } = await import("../../../../convex/_generated/api");

    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      return NextResponse.json({ error: "Convex URL not configured" }, { status: 500 });
    }

    const origin = (typeof req.headers.get === "function" && req.headers.get("origin")) || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const ipAddress =
      (typeof req.headers.get === "function" && (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip"))) ||
      undefined;

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

    // isBundle only makes sense for raffle entries (4-pack discount).
    // Direct purchases never use bundle pricing regardless of quantity.
    const isDirectPurchase = purchaseType === "direct" ||
      (productId !== undefined && productId !== "" && productId !== null);
    const isBundle = !isDirectPurchase && quantity === 4;

    // Synthesize a guest email only if truly absent (form should always collect one)
    if (!email) {
      const ts = Date.now();
      email = `guest+${ts}@example.com`;
    }

    // Append purchaseType to success URL so the thank-you page can show the right copy
    const successUrl = `${origin}/thank-you?type=${isDirectPurchase ? "direct" : "raffle"}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await convex.action((api as unknown as any).stripeActions.createCheckoutSession, {
      email: email?.toLowerCase(),
      phone,
      count: quantity,
      bundle: isBundle,
      successUrl,
      cancelUrl: `${origin}/shop`,
      ipAddress,
      // Product selection data
      productId,
      variantId,
      selectedColor,
      selectedSize,
      purchaseType,
      // Shipping address
      shippingAddress,
    });

    return NextResponse.json({ url: result.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err ?? "Bad request");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

