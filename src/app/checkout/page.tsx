"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import {
  CheckoutHeader,
  OrderSummaryBar,
  ContactForm,
  ShippingAddressForm,
  ErrorMessages,
  SubmitButton,
  LoadingFallback,
  useCheckoutForm,
  useProductPricing,
  ProductSelection,
} from "@/components/checkout";

function CheckoutPageContent() {
  const searchParams = useSearchParams();

  // Product selection state
  const [productSelection, setProductSelection] = useState<ProductSelection>({
    productId: "",
    variantId: "",
    selectedColor: "",
    selectedSize: "",
    purchaseType: "",
    quantity: 1,
  });

  // Form state from custom hook
  const {
    email,
    phone,
    shippingAddress,
    isLoading,
    error,
    emailError,
    addressErrors,
    handleEmailChange,
    handleContactPhoneChange,
    handleAddressChange,
    isFormValid,
    validateAndSubmit,
    setError,
    setIsLoading,
  } = useCheckoutForm();

  // Pricing from custom hook
  const { price, productName, savings, isBundle, isDirectPurchase } = useProductPricing({
    productId: productSelection.productId,
    purchaseType: productSelection.purchaseType,
    quantity: productSelection.quantity,
  });

  // Parse URL params on mount, or fall back to cart in localStorage
  useEffect(() => {
    const qtyParam = searchParams.get("quantity");
    const productIdParam = searchParams.get("product");
    const variantIdParam = searchParams.get("variant");
    const colorParam = searchParams.get("color");
    const sizeParam = searchParams.get("size");
    const typeParam = searchParams.get("type");

    if (productIdParam) {
      // Direct product link — use URL params as-is
      setProductSelection({
        productId: productIdParam,
        variantId: variantIdParam || "",
        selectedColor: colorParam || "",
        selectedSize: sizeParam || "",
        purchaseType: typeParam || "direct",
        quantity: qtyParam ? parseInt(qtyParam, 10) || 1 : 1,
      });
    } else {
      // Cart drawer checkout — reconstruct selection from the first cart item
      const savedCart = localStorage.getItem("mv-cart");
      if (savedCart) {
        try {
          const cart = JSON.parse(savedCart);
          if (Array.isArray(cart) && cart.length > 0) {
            const firstItem = cart[0];
            setProductSelection({
              productId: firstItem.id || "",
              variantId: firstItem.id || "",
              selectedColor: firstItem.color || "Default",
              selectedSize: firstItem.size || "M",
              purchaseType: "direct",
              quantity: cart.length,
            });
          }
        } catch {
          // Silently ignore malformed cart data
        }
      }
    }
  }, [searchParams]);

  // Checkout submission handler
  async function handleCheckout(e?: React.FormEvent) {
    e?.preventDefault();

    await validateAndSubmit(async () => {
      console.log("🚀 Starting checkout process...");
      setIsLoading(true);

      try {
        const requestBody = {
          quantity: productSelection.quantity,
          email: email.trim().toLowerCase(),
          phone: phone || undefined,
          productId: productSelection.productId || undefined,
          variantId: productSelection.variantId || undefined,
          selectedColor: productSelection.selectedColor || undefined,
          selectedSize: productSelection.selectedSize || undefined,
          purchaseType: productSelection.purchaseType || undefined,
          shippingAddress,
        };

        console.log("📦 Request body:", requestBody);

        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("❌ API Error:", errorText);
          throw new Error(errorText || `HTTP ${res.status}`);
        }

        const data = await res.json();
        console.log("✅ API Response:", data);

        if (data.url) {
          // Enhanced mobile redirect with fallback
          const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);

          if (isMobile) {
            setTimeout(() => {
              window.location.href = data.url;
            }, 100);
          } else {
            window.location.href = data.url;
          }
          return;
        } else {
          throw new Error("No checkout URL received from server");
        }
      } catch (err) {
        console.error("❌ Checkout error:", err);

        let errorMessage = "Something went wrong. Please try again.";
        if (err instanceof Error) {
          if (err.message.includes('fetch')) {
            errorMessage = "Unable to connect to payment system. Please check your internet connection and try again.";
          } else if (err.message.includes('entry')) {
            errorMessage = err.message;
          } else {
            errorMessage = err.message || errorMessage;
          }
        }

        setError(errorMessage);
        setIsLoading(false);
      }
    });
  }

  return (
    <main className="relative min-h-screen text-white bg-black">
      <CheckoutHeader />

      <OrderSummaryBar
        productName={productName}
        price={price}
        quantity={productSelection.quantity}
        selectedColor={productSelection.selectedColor}
        selectedSize={productSelection.selectedSize}
        savings={savings}
        isBundle={isBundle}
        isDirectPurchase={isDirectPurchase}
      />

      {/* Split Screen Form */}
      <div className="relative z-10 min-h-screen px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleCheckout}>
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Side - Contact Information */}
              <div className="space-y-6">
                <ContactForm
                  email={email}
                  phone={phone || shippingAddress.phone || ''}
                  emailError={emailError}
                  phoneError={addressErrors.phone}
                  isLoading={isLoading}
                  onEmailChange={handleEmailChange}
                  onPhoneChange={handleContactPhoneChange}
                />
              </div>

              {/* Right Side - Shipping Address */}
              <div className="space-y-6">
                <ShippingAddressForm
                  shippingAddress={shippingAddress}
                  phone={phone}
                  addressErrors={addressErrors}
                  isLoading={isLoading}
                  onAddressChange={handleAddressChange}
                />
              </div>
            </div>

            <ErrorMessages
              errors={addressErrors}
              generalError={error}
            />

            <SubmitButton
              isLoading={isLoading}
              isDisabled={!isFormValid()}
              price={price}
            />
          </form>
        </div>
      </div>

      {/* Back to Shop */}
      <div className="relative z-10 text-center pb-8">
        <Link href="/shop" className="text-sm text-slate-400 hover:text-white transition-colors">
          ← Back to shop
        </Link>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutPageContent />
    </Suspense>
  );
}
