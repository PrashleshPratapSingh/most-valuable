"use client";

import React, { useState } from "react";
import Image from "next/image";

const COMING_SOON_DATA = [
  {
    name: "MV Track Pants",
    category: "Apparel",
    dropDate: "2025-06-15",
    image: "/Coming Soon/CF2BAE50-F485-43C3-8AE4-D638F71275F6.jpeg",
    goldDetail: "24K gold zip pulls"
  },
  {
    name: "A Valuable Pillow",
    category: "Home",
    dropDate: "2025-06-25",
    image: "/Coming Soon/524427C4-666D-47BB-933D-A8F3B52A4CD1.png",
    goldDetail: "24K gold embroidered emblem"
  },
  {
    name: "A Valuable Jacket",
    category: "Outerwear",
    dropDate: "2025-07-01",
    image: "/Coming Soon/D6437BC8-D0C1-4CBC-8651-366AB706D6C8.png",
    goldDetail: "24K gold monogram on back"
  },
  {
    name: "A Valuable Beanbag",
    category: "Home",
    dropDate: "2025-07-10",
    image: "/Coming Soon/705FF280-F144-486E-BB41-671B313F606A.jpeg",
    goldDetail: "24K gold hardware detailing"
  },
  {
    name: "Valuable Glasses",
    category: "Accessories",
    dropDate: "2025-07-20",
    image: "/Coming Soon/60FDA3FE-A017-4C7A-91E7-17D1CB040313.jpeg",
    goldDetail: "24K gold frame inlay"
  }
];

export default function ComingSoon() {
  const [notified, setNotified] = useState<Record<string, boolean>>({});

  const calculateDaysRemaining = (dateStr: string) => {
    const today = new Date();
    const dropDate = new Date(dateStr);
    const diffTime = dropDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleNotify = (name: string) => {
    setNotified(prev => ({ ...prev, [name]: true }));
  };

  return (
    <section id="coming-soon" className="w-full bg-white py-24 px-5 sm:px-12 flex flex-col items-center scroll-mt-24 border-t border-black/5">
      {/* Section Header */}
      <div className="text-center mb-12">
        <p className="text-black/40 text-[11px] tracking-[0.18em] uppercase font-medium">
          PREVIEW
        </p>
        <h2 className="text-black font-bold tracking-tight uppercase mt-3 mb-3" style={{ fontSize: "clamp(32px, 5vw, 56px)" }}>
          Coming Soon
        </h2>
        <div className="w-10 h-[1px] bg-black/20 mx-auto" />
      </div>

      {/* Grid Layout */}
      <div className="w-full max-w-[1200px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {COMING_SOON_DATA.map((item) => {
          const days = calculateDaysRemaining(item.dropDate);
          const isNotified = notified[item.name];

          return (
            <div key={item.name} className="group bg-white border border-black/10 flex flex-col">
              {/* Image Container */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5">
                <Image 
                  src={item.image} 
                  alt={item.name} 
                  fill
                  className="object-cover transition-all duration-700 group-hover:scale-[1.02]"
                />
                {/* Countdown Badge */}
                {days > 0 && (
                  <div className="absolute top-0 left-0 bg-black text-white text-[10px] tracking-[0.1em] px-3 py-1.5 uppercase font-bold">
                    Drops in {days} days
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-5 flex flex-col gap-4">
                <div className="flex flex-col">
                  <p className="text-black/40 text-[10px] tracking-[0.12em] uppercase mb-1">
                    {item.category}
                  </p>
                  <h3 className="text-black text-[14px] font-semibold uppercase tracking-[0.06em]">
                    {item.name}
                  </h3>
                </div>
                
                <button
                  disabled={isNotified}
                  onClick={() => handleNotify(item.name)}
                  className={`w-full py-3 text-[11px] tracking-[0.12em] uppercase font-bold transition-all duration-300 border ${
                    isNotified 
                      ? "bg-[#1D9E75] border-[#1D9E75] text-white cursor-default" 
                      : "border-black/10 text-black hover:bg-black hover:text-white"
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  {isNotified ? "✓ Notified" : "Notify Me"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
