'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { analytics } from '@/components/analytics/GoogleAnalytics';

interface Order {
  id: string;
  date: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserAccountModal({ isOpen, onClose }: UserAccountModalProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'settings'>('profile');

  // Mock order data - в реальном проекте это будет из API
  const mockOrders: Order[] = [
    {
      id: '#VB-001',
      date: '2024-01-15',
      total: 125.99,
      status: 'delivered',
      items: [
        { name: 'Vintage Camera', quantity: 1, price: 125.99 }
      ]
    },
    {
      id: '#VB-002', 
      date: '2024-01-10',
      total: 89.50,
      status: 'shipped',
      items: [
        { name: 'Custom Adidas Sneakers', quantity: 1, price: 89.50 }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'shipped': return 'text-blue-600 bg-blue-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleTabClick = (tab: 'profile' | 'orders' | 'settings') => {
    setActiveTab(tab);
    analytics.event('user_account_tab_click', {
      tab: tab,
      event_category: 'User Account'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Personal Account</h2>
            <p className="text-gray-600 mt-1">
              Welcome back, {session?.user?.name || session?.user?.email}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => handleTabClick('profile')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'profile' 
                ? 'text-black border-b-2 border-black' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👤 Profile
          </button>
          <button
            onClick={() => handleTabClick('orders')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'orders' 
                ? 'text-black border-b-2 border-black' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📦 Order History
          </button>
          <button
            onClick={() => handleTabClick('settings')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'settings' 
                ? 'text-black border-b-2 border-black' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {session?.user?.name || 'Not specified'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {session?.user?.email}
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  🎉 VobVorot Member Benefits
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Exclusive access to new collections</li>
                  <li>• Priority customer support</li>
                  <li>• Special discounts on selected items</li>
                  <li>• Early notification about sales</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              {mockOrders.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Your Orders</h3>
                    <span className="text-sm text-gray-500">
                      {mockOrders.length} orders total
                    </span>
                  </div>
                  {mockOrders.map((order) => (
                    <div 
                      key={order.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-semibold text-gray-900">{order.id}</span>
                          <span className="text-gray-500 ml-2">
                            {new Date(order.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-bold">${order.total}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.name} × {item.quantity}
                            </span>
                            <span className="text-gray-900 font-medium">
                              ${item.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No orders yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Start shopping to see your order history here
                  </p>
                  <button 
                    onClick={onClose}
                    className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-3" defaultChecked />
                      <span className="text-sm">Email notifications about orders</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-3" defaultChecked />
                      <span className="text-sm">Newsletter and promotions</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-3" />
                      <span className="text-sm">SMS notifications</span>
                    </label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Privacy</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-3" defaultChecked />
                      <span className="text-sm">Analytics tracking</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-3" />
                      <span className="text-sm">Marketing cookies</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Account Actions</h3>
                <div className="space-y-3">
                  <button className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Download my data
                  </button>
                  <button className="w-full md:w-auto px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
                    Delete account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}