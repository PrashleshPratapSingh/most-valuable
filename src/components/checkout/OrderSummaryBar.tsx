interface OrderSummaryBarProps {
    productName: string;
    price: number;
    quantity: number;
    selectedColor?: string;
    selectedSize?: string;
    savings?: string;
    isBundle?: boolean;
    isDirectPurchase?: boolean;
}

export function OrderSummaryBar({
    productName,
    price,
    quantity,
    selectedColor,
    selectedSize,
    savings,
    isBundle,
    isDirectPurchase,
}: OrderSummaryBarProps) {
    return (
        <div className="relative z-10 bg-white/5 border-b border-white/10 px-6 py-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-lg">
                            {isDirectPurchase
                                ? productName
                                : (isBundle ? "4 Entries" : `${quantity} Entry${quantity > 1 ? 's' : ''}`)}
                        </h3>
                        <p className="text-sm text-slate-300">
                            {isDirectPurchase ? "Premium Collection" : "Gold Rush collection"}
                        </p>

                        {/* Product Selection Details */}
                        {(selectedColor || selectedSize) && (
                            <div className="mt-2 flex items-center space-x-4">
                                {selectedColor && (
                                    <span className="text-xs text-slate-300">
                                        <span className="text-slate-400">Color:</span>
                                        <span className="text-white font-medium capitalize ml-1">{selectedColor}</span>
                                    </span>
                                )}
                                {selectedSize && (
                                    <span className="text-xs text-slate-300">
                                        <span className="text-slate-400">Size:</span>
                                        <span className="text-white font-medium ml-1">{selectedSize}</span>
                                    </span>
                                )}
                            </div>
                        )}

                        {savings && (
                            <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-green-500/20 text-green-300 rounded-full">
                                {savings}
                            </span>
                        )}
                    </div>

                    <div className="text-right">
                        <div className="text-2xl font-bold">${price.toLocaleString('en-US')}</div>
                        {isBundle && (
                            <div className="text-sm text-slate-400 line-through">$200</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
