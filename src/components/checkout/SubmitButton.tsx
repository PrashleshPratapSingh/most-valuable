import { TrustSignals } from './TrustSignals';

interface SubmitButtonProps {
    isLoading: boolean;
    isDisabled: boolean;
    price: number;
    buttonText?: string;
}

export function SubmitButton({
    isLoading,
    isDisabled,
    price,
    buttonText = "Complete Purchase",
}: SubmitButtonProps) {
    return (
        <div className="mt-8 max-w-md mx-auto">
            <button
                type="submit"
                disabled={isLoading || isDisabled}
                className={`w-full px-8 py-4 font-semibold rounded-lg transition-all duration-200 ${isLoading || isDisabled
                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transform hover:scale-105 shadow-lg hover:shadow-xl'
                    }`}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                    </div>
                ) : (
                    `${buttonText} - $${price.toLocaleString('en-US')}`
                )}
            </button>

            <TrustSignals />
        </div>
    );
}
