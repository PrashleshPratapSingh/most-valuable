"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Create Stripe checkout session for raffle entries and direct purchases
 * This runs on the server side for security
 */
export const createCheckoutSession: any = action({
  args: {
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    count: v.number(),
    bundle: v.optional(v.boolean()),
    successUrl: v.string(),
    cancelUrl: v.string(),
    ipAddress: v.optional(v.string()),
    // Product selection parameters
    productId: v.optional(v.string()),
    variantId: v.optional(v.string()),
    selectedColor: v.optional(v.string()),
    selectedSize: v.optional(v.string()),
    purchaseType: v.optional(v.string()),
    // Address information
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
  handler: async (ctx, args) => {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    // Determine if this is a direct purchase or raffle entry
    const isDirectPurchase = args.purchaseType === "direct" ||
      args.productId === "raffle" ||
      args.productId === "mv-hoodie" ||
      args.productId === "mv-tee" ||
      args.productId === "p6" ||
      args.productId === "p7" ||
      args.productId === "p1b" ||
      args.productId === "p1w" ||
      (args.productId?.startsWith("mv-v2-tee-") ?? false);

    // Calculate pricing based on purchase type
    let unitAmount: number;
    let productName: string;
    let productDescription: string;

    if (isDirectPurchase) {
      // Direct purchase pricing
      if (args.productId === "mv-hoodie") {
        unitAmount = 170000; // $1,700.00 in cents
        productName = "MV Members Only Hoodie";
        productDescription = `Premium hoodie - ${args.selectedColor || 'Black'} (Size: ${args.selectedSize || 'M'}) - 7g Gold Included`;
      } else if (args.productId === "mv-tee") {
        unitAmount = 35000; // $350.00 in cents
        productName = "MV Members Only Tee";
        productDescription = `Exclusive tee - ${args.selectedColor || 'Black'} (Size: ${args.selectedSize || 'M'}) - 1g Gold Included`;
      } else if (args.productId === "p6") {
        unitAmount = 170000; // $1,700.00 in cents
        productName = "Most Valuable Box Logo Hoodie";
        productDescription = `Premium box logo hoodie (Size: ${args.selectedSize || 'M'}) - 7g Gold Included`;
      } else if (args.productId === "p7") {
        unitAmount = 170000; // $1,700.00 in cents
        productName = "MV Traditional Hoodie";
        productDescription = `Traditional MV hoodie (Size: ${args.selectedSize || 'M'}) - 7g Gold Included`;
      } else if (args.productId === "p1b") {
        unitAmount = 35000; // $350.00 in cents
        productName = "Box Logo Tee - Black";
        productDescription = `Iconic box logo tee in black (Size: ${args.selectedSize || 'M'}) - 1g Gold Included`;
      } else if (args.productId === "p1w") {
        unitAmount = 35000; // $350.00 in cents
        productName = "Box Logo Tee - White";
        productDescription = `Iconic box logo tee in white (Size: ${args.selectedSize || 'M'}) - 1g Gold Included`;
      } else if (args.productId?.startsWith("mv-v2-tee-")) {
        const colorNames: Record<string, string> = {
          'mv-v2-tee-1': 'Black',
          'mv-v2-tee-3': 'Gold',
          'mv-v2-tee-4': 'Red',
          'mv-v2-tee-5': 'White',
        };
        const colorName = colorNames[args.productId] || 'Signature';
        unitAmount = 6500; // $65.00 in cents
        productName = `A Valuable Shirt - ${colorName}`;
        productDescription = `Premium heavyweight cotton tee from the Version 2.0 collection (Size: ${args.selectedSize || 'M'})`;
      } else if (args.productId === "raffle") {
        unitAmount = 10000; // $100.00 in cents
        productName = "A Valuable Shirt";
        productDescription = `A Valuable Shirt (Size: ${args.selectedSize || 'M'}) - Direct Purchase`;
      } else {
        unitAmount = 170000; // Default direct purchase price - $1,700.00 in cents
        productName = "Direct Purchase";
        productDescription = "Premium collection item";
      }
    } else {
      // Raffle entry pricing - need raffle config
      const raffle = await ctx.runQuery(api.payments.getRaffleConfig);
      if (!raffle) {
        throw new Error("No active raffle found");
      }

      // Check if raffle is accepting entries (use paymentStartDate for payments)
      const now = Date.now();
      // Use internal config to access paymentStartDate
      const raffleInternal = await ctx.runQuery(api.payments.getRaffleConfigInternal);
      const paymentStart = raffleInternal?.paymentStartDate || raffle.startDate;

      // For payments: check paymentStartDate vs endDate
      // This allows payments to work even if timer display hasn't started yet
      if (now < paymentStart || now > raffle.endDate) {
        throw new Error("Raffle is not currently accepting entries");
      }

      // Validate entry count
      if (args.count <= 0 || args.count > 100) {
        throw new Error("Invalid entry count");
      }

      if (args.bundle && args.count === raffle.bundleSize) {
        unitAmount = raffle.bundlePrice;
        productName = `${raffle.productName} - Bundle (${raffle.bundleSize} entries)`;
        productDescription = `${args.count} raffle ${args.count === 1 ? 'entry' : 'entries'} for ${raffle.productName}`;
      } else {
        unitAmount = args.count * raffle.pricePerEntry;
        productName = `${raffle.productName} - ${args.count} ${args.count === 1 ? 'entry' : 'entries'}`;
        productDescription = `${args.count} raffle ${args.count === 1 ? 'entry' : 'entries'} for ${raffle.productName}`;
      }
    }

    // Step 1: Create Stripe checkout session
    let session: any;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: args.successUrl,
        cancel_url: args.cancelUrl,
        ...(args.email ? { customer_email: args.email } : {}),
        // Mobile-friendly options
        billing_address_collection: 'auto',
        submit_type: 'pay',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: productName,
                description: productDescription,
                images: [],
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        metadata: {
          ...(args.email ? { email: args.email } : {}),
          phone: args.phone || '',
          count: args.count.toString(),
          bundle: (args.bundle || false).toString(),
          purchaseType: isDirectPurchase ? 'direct' : 'raffle',
          ...(args.productId ? { productId: args.productId } : {}),
          ...(args.selectedColor ? { selectedColor: args.selectedColor } : {}),
          ...(args.selectedSize ? { selectedSize: args.selectedSize } : {}),
          raffleId: isDirectPurchase ? 'none' : 'current',
        },
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
        locale: 'auto',
      });
    } catch (error: any) {
      console.error('Stripe checkout session creation failed:', error);
      throw new Error(`Payment processing failed: ${error.message}`);
    }

    // Step 2: Record pending entry in DB (separate from Stripe so errors are clearly attributed)
    try {
      await ctx.runMutation(api.payments.createPendingEntry, {
        email: args.email,
        phone: args.phone,
        count: args.count,
        bundle: args.bundle,
        stripeSessionId: session.id,
        ipAddress: args.ipAddress,
        productId: args.productId,
        variantId: args.variantId,
        selectedColor: args.selectedColor,
        selectedSize: args.selectedSize,
        shippingAddress: args.shippingAddress,
      });
    } catch (dbError: any) {
      // Log but don't fail — Stripe session exists, webhook will handle completion
      console.error('Failed to record pending entry (Stripe session created):', session.id, dbError);
    }

    console.log(`Created checkout session for ${args.email}: ${args.count} entries`);

    return {
      sessionId: session.id,
      url: session.url,
      amount: unitAmount,
      count: args.count,
    };

  },
});

/**
 * Handle Stripe webhook events
 * This processes payment confirmations and failures
 */
export const handleStripeWebhook: any = action({
  args: {
    eventType: v.string(),
    eventId: v.string(),
    sessionId: v.optional(v.string()),
    paymentIntentId: v.optional(v.string()),
    rawData: v.string(),
  },
  handler: async (ctx, { eventType, eventId, sessionId, paymentIntentId, rawData }) => {
    console.log(`Processing Stripe webhook: ${eventType} (${eventId})`);

    try {
      switch (eventType) {
        case 'checkout.session.completed':
          if (!sessionId) {
            throw new Error('Session ID required for checkout.session.completed');
          }

          return await ctx.runMutation(api.payments.handlePaymentSuccess, {
            stripeSessionId: sessionId,
            stripePaymentIntent: paymentIntentId || '',
            webhookEventId: eventId,
          });

        case 'checkout.session.expired':
        case 'payment_intent.payment_failed':
          if (!sessionId) {
            console.log('No session ID for failed payment event');
            return { success: true, message: 'No session to process' };
          }

          return await ctx.runMutation(api.payments.handlePaymentFailure, {
            stripeSessionId: sessionId,
            webhookEventId: eventId,
            errorMessage: `Payment ${eventType.includes('expired') ? 'expired' : 'failed'}`,
          });

        default:
          console.log(`Unhandled webhook event type: ${eventType}`);
          return { success: true, message: 'Event type not handled' };
      }
    } catch (error: any) {
      console.error(`Webhook processing error for ${eventId}:`, error);

      // Log failed webhook for manual review
      await ctx.runMutation(api.payments.handlePaymentFailure, {
        stripeSessionId: sessionId || 'unknown',
        webhookEventId: eventId,
        errorMessage: `Webhook processing failed: ${error.message}`,
      });

      throw error;
    }
  },
});

/**
 * Get Stripe session details (for debugging)
 */
export const getStripeSession = action({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return {
        id: session.id,
        payment_status: session.payment_status,
        status: session.status,
        amount_total: session.amount_total,
        customer_email: session.customer_email,
        metadata: session.metadata,
        created: session.created,
        expires_at: session.expires_at,
      };
    } catch (error: any) {
      console.error('Failed to retrieve Stripe session:', error);
      throw new Error(`Failed to get session details: ${error.message}`);
    }
  },
});

/**
 * Create refund for an entry (admin function)
 */
export const createRefund = action({
  args: {
    adminToken: v.string(),
    paymentIntentId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { adminToken, paymentIntentId, reason }) => {
    // Verify admin authorization
    if (adminToken !== process.env.ADMIN_TOKEN) {
      throw new Error("Unauthorized: Invalid admin token");
    }

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: reason || 'requested_by_customer',
      });

      console.log(`Refund created: ${refund.id} for payment ${paymentIntentId}`);

      return {
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
        created: refund.created,
      };
    } catch (error: any) {
      console.error('Refund creation failed:', error);
      throw new Error(`Refund failed: ${error.message}`);
    }
  },
});

/**
 * Get payment statistics from Stripe (admin function)
 */
export const getStripeStats = action({
  args: { adminToken: v.string() },
  handler: async (ctx, { adminToken }) => {
    // Verify admin authorization
    if (adminToken !== process.env.ADMIN_TOKEN) {
      throw new Error("Unauthorized: Invalid admin token");
    }

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    try {
      // Get recent payments (last 30 days)
      const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);

      const charges = await stripe.charges.list({
        created: { gte: thirtyDaysAgo },
        limit: 100,
      });

      const successful = charges.data.filter((charge: any) => charge.status === 'succeeded');
      const totalAmount = successful.reduce((sum: number, charge: any) => sum + charge.amount, 0);

      return {
        totalTransactions: successful.length,
        totalAmount,
        averageAmount: successful.length > 0 ? Math.round(totalAmount / successful.length) : 0,
        successRate: charges.data.length > 0 ? (successful.length / charges.data.length) * 100 : 0,
        timeframe: '30 days',
      };
    } catch (error: any) {
      console.error('Failed to get Stripe stats:', error);
      throw new Error(`Failed to get payment statistics: ${error.message}`);
    }
  },
});
