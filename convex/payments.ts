import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

function getProductName(productId: string): string {
  if (productId.startsWith("mv-v2-tee-")) {
    const colors: Record<string, string> = {
      "mv-v2-tee-1": "Black",
      "mv-v2-tee-3": "Gold",
      "mv-v2-tee-4": "Red",
      "mv-v2-tee-5": "White",
    };
    return `A Valuable Shirt - ${colors[productId] || "Signature"}`;
  }
  switch (productId) {
    case "mv-hoodie": return "MV Members Only Hoodie";
    case "mv-tee": return "MV Members Only Tee";
    case "p6": return "Most Valuable Box Logo Hoodie";
    case "p7": return "MV Traditional Hoodie";
    case "p1b": return "Box Logo Tee - Black";
    case "p1w": return "Box Logo Tee - White";
    case "box-logo-zipper": return "Box Logo Zipper";
    case "box-logo-beanie": return "Box Logo Beanie";
    case "raffle": return "A Valuable Shirt";
    default: return "Your Purchase";
  }
}

/**
 * Create a pending entry before Stripe checkout
 * This will be updated after successful payment
 */
export const createPendingEntry = mutation({
  args: {
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    count: v.number(),
    bundle: v.optional(v.boolean()),
    stripeSessionId: v.string(),
    ipAddress: v.optional(v.string()),
    // Product selection parameters
    productId: v.optional(v.string()),
    variantId: v.optional(v.string()),
    selectedColor: v.optional(v.string()),
    selectedSize: v.optional(v.string()),
    // Shipping address
    shippingAddress: v.optional(v.object({
      firstName: v.string(),
      lastName: v.string(),
      company: v.optional(v.string()),
      address1: v.string(),
      address2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      postalCode: v.string(),
      country: v.string(),
      phone: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { email, phone, count, bundle, stripeSessionId, ipAddress, productId, variantId, selectedColor, selectedSize, shippingAddress }) => {
    // Normalize optional email
    const normalizedEmail = email ? email.toLowerCase() : "";

    if (count <= 0 || count > 100) {
      throw new Error("Invalid entry count");
    }

    // Determine if this is a direct purchase or raffle entry
    const isDirectPurchase = productId === "raffle" ||
      productId === "mv-hoodie" ||
      productId === "mv-tee" ||
      productId === "p6" ||
      productId === "p7" ||
      productId === "p1b" ||
      productId === "p1w" ||
      productId === "box-logo-zipper" ||
      productId === "box-logo-beanie" ||
      (productId?.startsWith("mv-v2-tee-") ?? false);

    let amount: number;

    if (isDirectPurchase) {
      // Direct purchase pricing - calculate from product ID
      if (productId === "mv-hoodie") {
        amount = 170000; // $1,700.00 in cents
      } else if (productId === "mv-tee") {
        amount = 35000; // $350.00 in cents
      } else if (productId === "p6") {
        amount = 170000; // $1,700.00 in cents
      } else if (productId === "p7") {
        amount = 170000; // $1,700.00 in cents
      } else if (productId === "p1b") {
        amount = 35000; // $350.00 in cents
      } else if (productId === "p1w") {
        amount = 35000; // $350.00 in cents
      } else if (productId === "raffle") {
        amount = 10000; // $100.00 in cents
      } else if (productId?.startsWith("mv-v2-tee-")) {
        amount = 6500; // $65.00 in cents
      } else if (productId === "box-logo-zipper" || productId === "box-logo-beanie") {
        amount = 8500; // $85.00 in cents
      } else {
        amount = 6500; // Safe default for unknown direct products
      }
    } else {
      // Raffle entry pricing - need raffle config
      const activeRaffle = await ctx.db
        .query("raffleConfig")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .first();

      if (!activeRaffle) {
        throw new Error("No active raffle found");
      }

      // Check if raffle is accepting entries (use paymentStartDate for payments)
      const now = Date.now();
      const paymentStart = activeRaffle.paymentStartDate || activeRaffle.startDate;

      // For payments: check paymentStartDate vs endDate
      // This allows payments to work even if timer hasn't started yet
      if (now < paymentStart || now > activeRaffle.endDate) {
        throw new Error("Raffle is not currently accepting entries");
      }

      // Calculate amount based on bundle or individual pricing
      if (bundle && count === activeRaffle.bundleSize) {
        amount = activeRaffle.bundlePrice;
      } else {
        amount = count * activeRaffle.pricePerEntry;
      }
    }

    // Create pending entry
    const now = Date.now();
    return await ctx.db.insert("entries", {
      email: normalizedEmail,
      phone,
      count,
      amount,
      stripeSessionId,
      paymentStatus: "pending",
      bundle: bundle || false,
      ipAddress,
      // Product selection data
      productId,
      variantId,
      variantColor: selectedColor,
      size: selectedSize,
      // Address information (only stored after successful payment)
      shippingAddress,
      createdAt: now,
    });
  },
});

/**
 * Handle successful payment webhook
 */
export const handlePaymentSuccess = mutation({
  args: {
    stripeSessionId: v.string(),
    stripePaymentIntent: v.string(),
    webhookEventId: v.string(),
  },
  handler: async (ctx, { stripeSessionId, stripePaymentIntent, webhookEventId }) => {
    // Check if this webhook has already been processed
    const existingEvent = await ctx.db
      .query("paymentEvents")
      .withIndex("by_stripe_event", (q) => q.eq("stripeEventId", webhookEventId))
      .first();

    if (existingEvent?.processed) {
      console.log(`Webhook ${webhookEventId} already processed`);
      return { success: true, alreadyProcessed: true };
    }

    // Find the pending entry
    const entry = await ctx.db
      .query("entries")
      .withIndex("by_stripe_session", (q) => q.eq("stripeSessionId", stripeSessionId))
      .first();

    if (!entry) {
      throw new Error(`Entry not found for session: ${stripeSessionId}`);
    }

    if (entry.paymentStatus === "completed") {
      console.log(`Entry ${entry._id} already completed`);
      return { success: true, alreadyCompleted: true };
    }

    // Update entry status
    await ctx.db.patch(entry._id, {
      paymentStatus: "completed",
      stripePaymentIntent,
    });

    // Determine if this is a direct purchase or raffle entry
    const isDirectPurchase = entry.productId === "raffle" ||
      entry.productId === "mv-hoodie" ||
      entry.productId === "mv-tee" ||
      entry.productId === "p6" ||
      entry.productId === "p7" ||
      entry.productId === "p1b" ||
      entry.productId === "p1w" ||
      entry.productId === "box-logo-zipper" ||
      entry.productId === "box-logo-beanie" ||
      (entry.productId?.startsWith("mv-v2-tee-") ?? false);

    // Only update raffle entries for actual raffle purchases
    if (!isDirectPurchase) {
      // Update raffle total entries
      const activeRaffle = await ctx.db
        .query("raffleConfig")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .first();

      if (activeRaffle) {
        await ctx.db.patch(activeRaffle._id, {
          totalEntries: activeRaffle.totalEntries + entry.count,
        });
      }
    }

    // Log the webhook event
    await ctx.db.insert("paymentEvents", {
      eventType: "payment_succeeded",
      stripeEventId: webhookEventId,
      paymentIntent: stripePaymentIntent,
      sessionId: stripeSessionId,
      email: entry.email,
      amount: entry.amount,
      status: "completed",
      rawData: JSON.stringify({ stripeSessionId, stripePaymentIntent }),
      processed: true,
      createdAt: Date.now(),
    });

    console.log(`Payment completed for ${entry.email}: ${isDirectPurchase ? 'Direct purchase' : entry.count + ' entries'}`);

    // Only assign raffle tickets for actual raffle purchases
    if (!isDirectPurchase) {
      try {
        await ctx.runMutation(api.raffleTickets.assignTicketsToEntry, {
          entryId: entry._id,
        });
        console.log(`🎫 Assigned ${entry.count} raffle tickets to ${entry.email}`);
      } catch (ticketError) {
        console.error('Failed to assign raffle tickets:', ticketError);
        // Don't fail the payment processing if ticket assignment fails
      }
    }

    // Queue confirmation email for processing
    try {
      const emailSubject = isDirectPurchase
        ? `🛒 Order Confirmed - ${entry.productId ? getProductName(entry.productId) : 'Your Purchase'}`
        : `🏆 Gold Rush Entry Confirmed - ${entry.count} ${entry.count === 1 ? 'Entry' : 'Entries'} Secured`;

      await ctx.runMutation(api.emailLogs.createEmailLog, {
        to: entry.email,
        subject: emailSubject,
        message: isDirectPurchase ? 'Order confirmation email - queued for sending' : 'Purchase confirmation email - queued for sending',
        data: JSON.stringify({
          entryId: entry._id,
          count: entry.count,
          type: isDirectPurchase ? 'order_confirmation' : 'purchase_confirmation',
          productId: entry.productId,
          size: entry.size,
          color: entry.variantColor
        }),
        status: 'pending',
        sentAt: Date.now(),
      });
      console.log(`📅 ${isDirectPurchase ? 'Order' : 'Purchase'} confirmation email queued for ${entry.email}`);
    } catch (emailError) {
      console.error('Failed to queue confirmation email:', emailError);
      // Don't fail the payment processing if email queuing fails
    }

    // Notify admin of new order
    try {
      await ctx.runMutation(api.notifications.notifyAdminOfNewOrder, {
        entryId: entry._id,
        email: entry.email,
        count: entry.count,
        amount: entry.amount,
        stripeSessionId,
      });
    } catch (notificationError) {
      console.error('Failed to send admin notification:', notificationError);
      // Don't fail the payment processing if notification fails
    }

    return {
      success: true,
      entryId: entry._id,
      email: entry.email,
      count: entry.count
    };
  },
});

/**
 * Handle failed payment webhook
 */
export const handlePaymentFailure = mutation({
  args: {
    stripeSessionId: v.string(),
    webhookEventId: v.string(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { stripeSessionId, webhookEventId, errorMessage }) => {
    // Check if this webhook has already been processed
    const existingEvent = await ctx.db
      .query("paymentEvents")
      .withIndex("by_stripe_event", (q) => q.eq("stripeEventId", webhookEventId))
      .first();

    if (existingEvent?.processed) {
      console.log(`Webhook ${webhookEventId} already processed`);
      return { success: true, alreadyProcessed: true };
    }

    // Find the pending entry
    const entry = await ctx.db
      .query("entries")
      .withIndex("by_stripe_session", (q) => q.eq("stripeSessionId", stripeSessionId))
      .first();

    if (!entry) {
      console.log(`Entry not found for session: ${stripeSessionId}`);
      return { success: true, entryNotFound: true };
    }

    // Update entry status
    await ctx.db.patch(entry._id, {
      paymentStatus: "failed",
    });

    // Log the webhook event
    await ctx.db.insert("paymentEvents", {
      eventType: "payment_failed",
      stripeEventId: webhookEventId,
      sessionId: stripeSessionId,
      email: entry.email,
      amount: entry.amount,
      status: "failed",
      rawData: JSON.stringify({ stripeSessionId, errorMessage }),
      processed: true,
      error: errorMessage,
      createdAt: Date.now(),
    });

    console.log(`Payment failed for ${entry.email}: ${errorMessage}`);

    return {
      success: true,
      entryId: entry._id,
      email: entry.email
    };
  },
});

/**
 * Get payment events for debugging (admin only)
 */
export const getPaymentEvents = query({
  args: {
    limit: v.optional(v.number()),
    eventType: v.optional(v.string())
  },
  handler: async (ctx, { limit = 50, eventType }) => {
    let query = ctx.db.query("paymentEvents").order("desc");

    if (eventType) {
      query = query.filter((q) => q.eq(q.field("eventType"), eventType));
    }

    return await query.take(limit);
  },
});

/**
 * Get unprocessed payment events
 */
export const getUnprocessedEvents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("paymentEvents")
      .withIndex("by_processed", (q) => q.eq("processed", false))
      .order("desc")
      .collect();
  },
});

/**
 * Get entry by Stripe session ID
 */
export const getEntryBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("entries")
      .withIndex("by_stripe_session", (q) => q.eq("stripeSessionId", sessionId))
      .first();
  },
});

/**
 * Get current raffle configuration (public)
 */
export const getRaffleConfig = query({
  args: {},
  handler: async (ctx) => {
    const raffle = await ctx.db
      .query("raffleConfig")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (!raffle) {
      return null;
    }

    // Return public information only
    return {
      name: raffle.name,
      startDate: raffle.startDate,
      endDate: raffle.endDate,
      timerDisplayDate: raffle.timerDisplayDate, // For frontend timer display
      isActive: raffle.isActive,
      totalEntries: raffle.totalEntries,
      pricePerEntry: raffle.pricePerEntry,
      bundlePrice: raffle.bundlePrice,
      bundleSize: raffle.bundleSize,
      productName: raffle.productName,
      productDescription: raffle.productDescription,
      hasWinner: !!raffle.winner,
      maxWinners: raffle.maxWinners || 1,
    };
  },
});

/**
 * Get current raffle configuration (internal - includes all fields)
 */
export const getRaffleConfigInternal = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("raffleConfig")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
  },
});
