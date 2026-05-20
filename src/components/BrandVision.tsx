"use client";

import React from "react";
import { motion } from "framer-motion";

export default function BrandVision() {
  return (
    <section 
      id="vision" 
      className="relative w-full bg-[#0a0a0a] overflow-hidden py-32 sm:py-48 px-6 sm:px-12 flex flex-col items-center scroll-mt-24"
    >
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-[900px] mx-auto text-center">
        {/* Overline */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-white/30 text-[10px] tracking-[0.4em] uppercase font-medium mb-12"
        >
          The Vision
        </motion.p>

        {/* Manifesto Content */}
        <div className="flex flex-col gap-10">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-white font-light italic leading-[1.3] tracking-tight" 
            style={{ fontSize: "clamp(28px, 5vw, 48px)", fontFamily: "var(--font-serif, serif)" }}
          >
            &quot;Perspective Creates Value.&quot;
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="w-16 h-[1px] bg-white/20 mx-auto"
          />

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-white/70 text-lg sm:text-2xl leading-[1.7] max-w-[800px] mx-auto font-extralight tracking-wide"
          >
            Most Valuable exists to remind people that <span className="text-white font-normal">perspective creates value</span>. 
            A Valuable Shirt represents the belief that every individual view, story, and vision carries weight, 
            because what you see, think, and bring to the world matters.
          </motion.p>
        </div>

        {/* Decorative Element */}
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 1.2, ease: "circOut" }}
          className="mt-24 h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
      </div>
    </section>
  );
}
