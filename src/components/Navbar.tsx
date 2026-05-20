"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { name: "Shop", href: "#collection" },
  { name: "The Vault", href: "#the-vault" },
  { name: "Our Story", href: "#vision" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<{ id: string; name: string; price: string; size: string; color: string }[]>([]);

  const loadCart = () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mv-cart");
      if (saved) setCart(JSON.parse(saved));
    }
  };

  useEffect(() => {
    loadCart();
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };

    const handleCartUpdate = () => loadCart();

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("cart-updated", handleCartUpdate);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, []);

  const handleCheckout = () => {
    setIsCartOpen(false);
    if (cart.length > 0) {
      const firstItem = cart[0];
      const params = new URLSearchParams({
        quantity: String(cart.length),
        product: firstItem.id || "",
        variant: firstItem.id || "",
        color: firstItem.color || "Default",
        size: firstItem.size || "M",
        type: "direct",
      });
      window.location.href = `/checkout?${params.toString()}`;
    } else {
      window.location.href = "/checkout";
    }
  };

  const removeFromCart = (index: number) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    localStorage.setItem("mv-cart", JSON.stringify(updatedCart));
    setCart(updatedCart);
    window.dispatchEvent(new Event("cart-updated"));
  };

  const cartCount = cart.length;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 h-16 z-[100] flex items-center justify-between transition-all duration-300 ease-in-out px-5 sm:px-12 ${
          isScrolled 
            ? "bg-[#0a0a0a] border-b border-white/10" 
            : "bg-transparent border-b border-transparent"
        }`}
        style={{
          borderBottom: isScrolled ? "1px solid rgba(255,255,255,0.08)" : "none"
        }}
      >
        {/* Left: Logo Wordmark */}
        <div className="flex-1 flex justify-start">
          <Link 
            href="#hero" 
            className="text-white font-bold text-[14px] tracking-[0.12em] uppercase whitespace-nowrap"
          >
            MOST VALUABLE
          </Link>
        </div>

        {/* Center: Navigation Links (Desktop only) */}
        <div className="hidden md:flex items-center gap-10">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-white/70 hover:text-white text-[13px] tracking-[0.06em] uppercase transition-colors duration-300 font-medium"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right: Cart & Hamburger */}
        <div className="flex-1 flex justify-end items-center gap-6">
          {/* Cart Icon & Badge */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative text-white/70 hover:text-white transition-colors duration-300 p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C9972B] text-white text-[9px] font-bold rounded-full flex items-center justify-center pointer-events-none">
                {cartCount}
              </span>
            )}
          </button>

          {/* Hamburger (Mobile only) */}
          <button 
            className="md:hidden text-white p-1"
            onClick={() => setIsMenuOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-[#0a0a0a] z-[200] flex flex-col items-center justify-center p-6"
          >
            {/* Close Button */}
            <button 
              className="absolute top-6 right-6 sm:right-12 text-white p-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Vertically Stacked Links */}
            <div className="flex flex-col items-center gap-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-white text-[28px] font-semibold uppercase tracking-wider"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Cart Drawer Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250]"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-[#0a0a0a] z-[300] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-white text-[14px] font-bold tracking-[0.12em] uppercase">Shopping Cart</h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Cart Content */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
                {cartCount === 0 ? (
                  <div className="text-center">
                    <p className="text-white/40 text-[13px] tracking-wide mb-8">Your cart is currently empty.</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="border border-[#C9972B] text-[#C9972B] px-8 py-3 text-[11px] uppercase tracking-[0.12em] hover:bg-[#C9972B] hover:text-black transition-all"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <div className="w-full text-white flex flex-col gap-6">
                    {cart.map((item, i) => (
                      <div key={i} className="flex justify-between items-start border-b border-white/5 pb-4">
                        <div className="flex-1">
                          <p className="text-[12px] font-bold uppercase tracking-wider">{item.name}</p>
                          <p className="text-[10px] text-white/40 mt-1 uppercase">{item.size} / {item.color}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-[12px] font-medium">{item.price}</p>
                          <button 
                            onClick={() => removeFromCart(i)}
                            className="text-[9px] uppercase tracking-[0.1em] text-white/30 hover:text-[#C9972B] transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {cartCount > 0 && (
                <div className="p-6 border-t border-white/10 bg-[#111]">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-white/60 text-[12px] uppercase tracking-wider">Subtotal</span>
                    <span className="text-white text-[16px] font-bold">
                      ${cart.reduce((acc, item) => acc + (parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-[#C9972B] text-black py-4 text-[12px] font-bold uppercase tracking-[0.15em] hover:bg-[#b08425] transition-colors"
                  >
                    Checkout Now
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
