import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import API_URL, { getImageUrl } from '../utils/api';
import { formatAreaDisplay } from '../utils/formatMeasurement';

const BuySell = () => {
  const [activeTab, setActiveTab] = useState('sold');
  const [properties, setProperties] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/buysell`)
      .then(res => res.json())
      .then(data => setProperties(data))
      .catch(err => console.error(err));
  }, []);

  const displayProperties = properties.filter(p => p.type === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:text-blue-700">
            <FaArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Buy & Sell Properties</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-center text-gray-600 mb-12">View all successful property transactions</p>

        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setActiveTab('sold')}
            className={`px-8 py-3 rounded-lg font-semibold transition ${
              activeTab === 'sold'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Sold Properties
          </button>
          <button
            onClick={() => setActiveTab('bought')}
            className={`px-8 py-3 rounded-lg font-semibold transition ${
              activeTab === 'bought'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Bought Properties
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProperties.map((property) => (
            <div key={property._id} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition">
              <div className="relative">
                <img src={getImageUrl(property.image)} alt={property.title} className="w-full h-48 object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'} />
                <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm">
                  <FaCheckCircle />
                  <span>{property.type === 'sold' ? 'Sold' : 'Bought'}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold mb-1">{property.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{property.location}</p>
                <p className="text-xl font-bold text-gray-900 mb-2">₹ {property.price}</p>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{formatAreaDisplay(property)}</span>
                  <span>{property.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuySell;
