'use client';

import { useABTest } from '@/lib/ab-testing';
import { Button } from '@/components/ui/Button';

// A/B Test Hero Button
export function ABTestHeroButton({ onClick, className }: { onClick?: () => void; className?: string }) {
  const { value, trackConversion } = useABTest('heroButtonText');
  
  const handleClick = () => {
    trackConversion('hero_button_click');
    onClick?.();
  };
  
  return (
    <Button onClick={handleClick} className={className}>
      {value}
    </Button>
  );
}

// A/B Test Product Card
interface ProductCardProps {
  product: {
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    badge?: string;
  };
  onClick?: () => void;
}

export function ABTestProductCard({ product, onClick }: ProductCardProps) {
  const { value: layout, trackConversion } = useABTest('productCardLayout');
  const { value: priceFormat } = useABTest('priceDisplayFormat');
  
  const handleClick = () => {
    trackConversion('product_click');
    onClick?.();
  };
  
  return (
    <div 
      className={`product-card cursor-pointer transition-transform hover:scale-105 ${
        layout === 'enhanced-with-badges' ? 'relative' : ''
      }`}
      onClick={handleClick}
    >
      {/* Enhanced layout with badges */}
      {layout === 'enhanced-with-badges' && product.badge && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white px-2 py-1 text-xs rounded">
          {product.badge}
        </div>
      )}
      
      <img 
        src={product.image} 
        alt={product.name}
        className="w-full h-64 object-cover rounded-lg"
      />
      
      <div className="mt-3">
        <h3 className="font-medium text-gray-900">{product.name}</h3>
        
        {/* Price display based on A/B test */}
        <div className="mt-1">
          {priceFormat === 'with-savings' && product.originalPrice ? (
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-red-600">${product.price}</span>
              <span className="text-sm line-through text-gray-500">${product.originalPrice}</span>
              <span className="text-sm text-green-600">
                Save ${product.originalPrice - product.price}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-900">${product.price}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// A/B Test Checkout Button
export function ABTestCheckoutButton({ onClick, children, className }: { 
  onClick?: () => void; 
  children: React.ReactNode;
  className?: string;
}) {
  const { value: buttonColor, trackConversion } = useABTest('checkoutButtonColor');
  
  const handleClick = () => {
    trackConversion('checkout_button_click');
    onClick?.();
  };
  
  return (
    <button
      onClick={handleClick}
      className={`px-6 py-3 text-white font-medium rounded-lg transition-colors hover:opacity-90 ${className}`}
      style={{ backgroundColor: buttonColor }}
    >
      {children}
    </button>
  );
}

// A/B Test Newsletter Popup
export function ABTestNewsletterPopup({ onClose, onSignup }: {
  onClose: () => void;
  onSignup: (email: string) => void;
}) {
  const { trackConversion } = useABTest('newsletterPopupTiming');
  
  const handleSignup = (email: string) => {
    trackConversion('newsletter_signup');
    onSignup(email);
  };
  
  const handleClose = () => {
    trackConversion('newsletter_popup_close');
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <button 
          onClick={handleClose}
          className="float-right text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        
        <h3 className="text-xl font-bold mb-4">Get 10% Off Your First Order!</h3>
        <p className="text-gray-600 mb-4">
          Subscribe to our newsletter for exclusive deals and new arrivals.
        </p>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const email = formData.get('email') as string;
          handleSignup(email);
        }}>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            className="w-full p-3 border rounded-lg mb-4"
            required
          />
          <button
            type="submit"
            className="w-full bg-black text-white p-3 rounded-lg hover:bg-gray-800"
          >
            Get 10% Off
          </button>
        </form>
      </div>
    </div>
  );
}