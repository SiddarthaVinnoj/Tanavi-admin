import React, { useState, useEffect, useCallback } from 'react';
import { FaCheckCircle, FaTimesCircle, FaEdit, FaClipboardList, FaMapMarkerAlt, FaTimes, FaTrash } from 'react-icons/fa';
import Modal from './Modal';
import API_URL, { getImageUrl } from '../utils/api';
import { formatAreaDisplay } from '../utils/formatMeasurement';

const UserSubmissions = ({ onEditProperty, onSwitchToProperties, showToast }) => {
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [publishedUserProperties, setPublishedUserProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmissionDetail, setShowSubmissionDetail] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [activeView, setActiveView] = useState('pending');
  const [modal, setModal] = useState({ isOpen: false, type: 'success', title: '', message: '', onConfirm: null, showCancel: false });

  const fetchUserSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/properties/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const submissions = data.filter(p => 
        p.sections && p.sections.includes('user-submitted') && p.status === 'pending'
      );
      const published = data.filter(p => 
        p.name && p.email && p.phone && p.status !== 'pending'
      );
      setUserSubmissions(submissions);
      setPublishedUserProperties(published);
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      showToast('Failed to fetch user submissions', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUserSubmissions();
  }, [fetchUserSubmissions]);

  const formatIndianPrice = (price) => {
    if (!price) return '0';
    const numericPrice = price.toString().replace(/[^0-9]/g, '');
    if (!numericPrice) return '0';
    return new Intl.NumberFormat('en-IN').format(numericPrice);
  };

  const formatSubmissionFieldValue = (key, value) => {
    if (value === null || value === undefined || value === '') return '-';
    if (key === 'road') {
      const roadStr = String(value).trim();
      const match = roadStr.match(/\d+/);
      if (match) return `${match[0]} Feet Road`;
      return roadStr;
    }
    return value;
  };

  const handleApproveSubmission = async (id) => {
    setModal({
      isOpen: true,
      type: 'info',
      title: 'Confirm Approval',
      message: 'Approve this property submission? It will be published on the public portal.',
      showCancel: true,
      onConfirm: async () => {
        setModal({ ...modal, isOpen: false });
        const token = localStorage.getItem('token');
        const submission = userSubmissions.find(s => s._id === id);
        if (!submission) {
          showToast('Submission not found', 'error');
          return;
        }
        try {
          // Simply approve - property details are already in their own fields
          const updateData = { 
            status: 'available', 
            sections: ['featured']
          };
          
          const res = await fetch(`${API_URL}/api/properties/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(updateData)
          });
          if (res.ok) {
            await fetchUserSubmissions();
            setModal({
              isOpen: true,
              type: 'success',
              title: 'Success!',
              message: 'Property approved and published on public portal!',
              onConfirm: () => setModal({ ...modal, isOpen: false })
            });
          } else {
            const error = await res.json();
            setModal({
              isOpen: true,
              type: 'error',
              title: 'Approval Failed',
              message: error.message || 'Failed to approve property',
              onConfirm: () => setModal({ ...modal, isOpen: false })
            });
          }
        } catch (error) {
          console.error('Approval error:', error);
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Approval Failed',
            message: 'Failed to approve property',
            onConfirm: () => setModal({ ...modal, isOpen: false })
          });
        }
      }
    });
  };

  const handleRejectSubmission = async (id) => {
    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Confirm Rejection',
      message: 'Reject and delete this property submission? This action cannot be undone.',
      showCancel: true,
      onConfirm: async () => {
        setModal({ ...modal, isOpen: false });
        const token = localStorage.getItem('token');
        try {
          const res = await fetch(`${API_URL}/api/properties/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            await fetchUserSubmissions();
            showToast('Property submission rejected and deleted!', 'success');
          } else {
            showToast('Failed to reject property', 'error');
          }
        } catch (error) {
          showToast('Failed to reject property', 'error');
        }
      }
    });
  };

  const handleEditAndApprove = (submission) => {
    // Parse description JSON if it exists
    let parsedFields = {};
    if (submission.description) {
      try {
        const parsed = JSON.parse(submission.description);
        if (typeof parsed === 'object' && parsed !== null) {
          parsedFields = parsed;
        }
      } catch (e) {
        // Not JSON, keep as text description
      }
    }

    onEditProperty({
      title: submission.title,
      category: submission.category,
      price: submission.price,
      location: submission.location,
      area: submission.area || '',
      acres: submission.acres || '',
      guntas: submission.guntas || '',
      bedrooms: submission.bedrooms || '',
      bathrooms: submission.bathrooms || '',
      description: typeof parsedFields === 'object' && Object.keys(parsedFields).length > 0 ? '' : (submission.description || ''),
      features: submission.features?.join(', ') || '',
      images: submission.images || [],
      video: submission.video || '',
      status: 'available',
      sections: ['featured'],
      locationUrl: submission.locationUrl || '',
      // Office Space specific fields
      builtUpArea: submission.builtUpArea || '',
      pricePerSqFt: submission.pricePerSqFt || '',
      expectedRent: submission.expectedRent || '',
      depositAmount: submission.depositAmount || '',
      floor: submission.floor || '',
      plugAndPlay: submission.plugAndPlay || '',
      workStations: submission.workStations || '',
      cabins: submission.cabins || '',
      conferenceHall: submission.conferenceHall || '',
      pantry: submission.pantry || '',
      washroomDetails: submission.washroomDetails || '',
      parkingType: submission.parkingType || '',
      parkingCount: submission.parkingCount || '',
      // All dynamic fields - prefer direct property, fallback to parsed JSON
      road: submission.road || parsedFields.road || '',
      roadType: submission.roadType || parsedFields.roadType || '',
      propertyUnder: submission.propertyUnder || parsedFields.propertyUnder || '',
      propertyFacing: submission.propertyFacing || parsedFields.propertyFacing || '',
      boundaryType: submission.boundaryType || parsedFields.boundaryType || '',
      bore: submission.bore || parsedFields.bore || '',
      anyPTCase: submission.anyPTCase || parsedFields.anyPTCase || '',
      propertyLocation: submission.propertyLocation || parsedFields.propertyLocation || '',
      'revenueRegistration/subRegister': submission['revenueRegistration/subRegister'] || parsedFields['revenueRegistration/subRegister'] || '',
      district: submission.district || parsedFields.district || '',
      state: submission.state || parsedFields.state || '',
      propertyCity: submission.propertyCity || parsedFields.propertyCity || '',
      flatType: submission.flatType || parsedFields.flatType || '',
      floorDetails: submission.floorDetails || parsedFields.floorDetails || '',
      buildupArea: submission.buildupArea || parsedFields.buildupArea || '',
      propertyAge: submission.propertyAge || parsedFields.propertyAge || '',
      buildingAge: submission.buildingAge || parsedFields.buildingAge || '',
      furnishingStatus: submission.furnishingStatus || parsedFields.furnishingStatus || '',
      parkingDetails: submission.parkingDetails || parsedFields.parkingDetails || '',
      numberOfCarParking: submission.numberOfCarParking || '',
      numberOfCarParkings: submission.numberOfCarParkings || '',
      plotArea: submission.plotArea || parsedFields.plotArea || '',
      plotAreaSqYards: submission.plotAreaSqYards || parsedFields.plotAreaSqYards || '',
      totalFloors: submission.totalFloors || parsedFields.totalFloors || '',
      portions: submission.portions || parsedFields.portions || '',
      washrooms: submission.washrooms || '',
      washroomInside: submission.washroomInside || '',
      washroomOutside: submission.washroomOutside || '',
      washroomTotal: submission.washroomTotal || '',
      farmhouseAreaAcres: submission.farmhouseAreaAcres || '',
      swimmingPool: submission.swimmingPool || parsedFields.swimmingPool || '',
      anyConstruction: submission.anyConstruction || parsedFields.anyConstruction || '',
      commercialPropertyType: submission.commercialPropertyType || parsedFields.commercialPropertyType || '',
      transactionType: submission.transactionType || parsedFields.transactionType || '',
      garden: submission.garden || parsedFields.garden || ''
    }, submission);
    onSwitchToProperties();
  };

  const handleEditPublishedProperty = (property) => {
    // Parse description JSON if it exists
    let parsedFields = {};
    if (property.description) {
      try {
        const parsed = JSON.parse(property.description);
        if (typeof parsed === 'object' && parsed !== null) {
          parsedFields = parsed;
        }
      } catch (e) {
        // Not JSON, keep as text description
      }
    }

    onEditProperty({
      title: property.title,
      category: property.category,
      price: property.price,
      location: property.location,
      area: property.area || '',
      acres: property.acres || '',
      guntas: property.guntas || '',
      bedrooms: property.bedrooms || '',
      bathrooms: property.bathrooms || '',
      description: typeof parsedFields === 'object' && Object.keys(parsedFields).length > 0 ? '' : (property.description || ''),
      features: property.features?.join(', ') || '',
      images: property.images || [],
      video: property.video || '',
      status: property.status,
      sections: property.sections || ['featured'],
      locationUrl: property.locationUrl || '',
      // Office Space specific fields
      builtUpArea: property.builtUpArea || '',
      pricePerSqFt: property.pricePerSqFt || '',
      expectedRent: property.expectedRent || '',
      depositAmount: property.depositAmount || '',
      floor: property.floor || '',
      plugAndPlay: property.plugAndPlay || '',
      workStations: property.workStations || '',
      cabins: property.cabins || '',
      conferenceHall: property.conferenceHall || '',
      pantry: property.pantry || '',
      washroomDetails: property.washroomDetails || '',
      parkingType: property.parkingType || '',
      parkingCount: property.parkingCount || '',
      // All dynamic fields - prefer direct property, fallback to parsed JSON
      road: property.road || parsedFields.road || '',
      roadType: property.roadType || parsedFields.roadType || '',
      propertyUnder: property.propertyUnder || parsedFields.propertyUnder || '',
      propertyFacing: property.propertyFacing || parsedFields.propertyFacing || '',
      boundaryType: property.boundaryType || parsedFields.boundaryType || '',
      bore: property.bore || parsedFields.bore || '',
      anyPTCase: property.anyPTCase || parsedFields.anyPTCase || '',
      propertyLocation: property.propertyLocation || parsedFields.propertyLocation || '',
      'revenueRegistration/subRegister': property['revenueRegistration/subRegister'] || parsedFields['revenueRegistration/subRegister'] || '',
      district: property.district || parsedFields.district || '',
      state: property.state || parsedFields.state || '',
      propertyCity: property.propertyCity || parsedFields.propertyCity || '',
      flatType: property.flatType || parsedFields.flatType || '',
      floorDetails: property.floorDetails || parsedFields.floorDetails || '',
      buildupArea: property.buildupArea || parsedFields.buildupArea || '',
      propertyAge: property.propertyAge || parsedFields.propertyAge || '',
      buildingAge: property.buildingAge || parsedFields.buildingAge || '',
      furnishingStatus: property.furnishingStatus || parsedFields.furnishingStatus || '',
      parkingDetails: property.parkingDetails || parsedFields.parkingDetails || '',
      numberOfCarParking: property.numberOfCarParking || '',
      numberOfCarParkings: property.numberOfCarParkings || '',
      plotArea: property.plotArea || parsedFields.plotArea || '',
      plotAreaSqYards: property.plotAreaSqYards || parsedFields.plotAreaSqYards || '',
      totalFloors: property.totalFloors || parsedFields.totalFloors || '',
      portions: property.portions || parsedFields.portions || '',
      washrooms: property.washrooms || '',
      washroomInside: property.washroomInside || '',
      washroomOutside: property.washroomOutside || '',
      washroomTotal: property.washroomTotal || '',
      farmhouseAreaAcres: property.farmhouseAreaAcres || '',
      swimmingPool: property.swimmingPool || parsedFields.swimmingPool || '',
      anyConstruction: property.anyConstruction || parsedFields.anyConstruction || '',
      commercialPropertyType: property.commercialPropertyType || parsedFields.commercialPropertyType || '',
      transactionType: property.transactionType || parsedFields.transactionType || '',
      garden: property.garden || parsedFields.garden || ''
    }, property);
    onSwitchToProperties();
  };

  const handleDeletePublishedProperty = async (id) => {
    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this published property? This action cannot be undone.',
      showCancel: true,
      onConfirm: async () => {
        setModal({ ...modal, isOpen: false });
        const token = localStorage.getItem('token');
        try {
          const res = await fetch(`${API_URL}/api/properties/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            await fetchUserSubmissions();
            showToast('Property deleted successfully!', 'success');
          } else {
            const error = await res.json();
            setModal({
              isOpen: true,
              type: 'error',
              title: 'Delete Failed',
              message: error.message || 'Failed to delete property',
              onConfirm: () => setModal({ ...modal, isOpen: false })
            });
          }
        } catch (error) {
          console.error('Error deleting property:', error);
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Delete Failed',
            message: 'Failed to delete property',
            onConfirm: () => setModal({ ...modal, isOpen: false })
          });
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        showCancel={modal.showCancel}
      />
      
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">User Property Submissions</h2>
          <p className="text-sm text-gray-600 mt-1">Review and manage properties submitted by users from the public portal</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const dataToExport = activeView === 'pending' ? userSubmissions : publishedUserProperties;
              const csvContent = [
                ['Property ID', 'Title', 'Category', 'Price', 'Location', 'Area', 'Submitter Name', 'Email', 'Phone', 'Status', 'Submitted Date'],
                ...dataToExport.map(p => [
                  p.propertyCode || 'N/A',
                  p.title,
                  p.category,
                  p.price,
                  p.location,
                  formatAreaDisplay(p),
                  p.name || 'N/A',
                  p.email || 'N/A',
                  p.phone || 'N/A',
                  p.status,
                  new Date(p.createdAt).toLocaleDateString()
                ])
              ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
              
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `user_submissions_${activeView}_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2"
          >
            📥 Download Report
          </button>
          <button
            onClick={() => setActiveView('pending')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeView === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pending ({userSubmissions.length})
          </button>
          <button
            onClick={() => setActiveView('published')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeView === 'published'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Published ({publishedUserProperties.length})
          </button>
        </div>
      </div>

      {activeView === 'pending' && userSubmissions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <FaClipboardList className="mx-auto text-gray-300 text-6xl mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Pending Submissions</h3>
          <p className="text-gray-500">All user property submissions have been reviewed</p>
        </div>
      ) : activeView === 'pending' ? (
        <div>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Click on any row to view complete property details
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Submitted Date</th>
                  <th className="px-6 py-4 text-left font-semibold">User Details</th>
                  <th className="px-6 py-4 text-left font-semibold">Property Details</th>
                  <th className="px-6 py-4 text-left font-semibold">Location & Price</th>
                  <th className="px-6 py-4 text-left font-semibold">Images</th>
                  <th className="px-6 py-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userSubmissions.map(submission => (
                  <tr 
                    key={submission._id} 
                    className="border-b hover:bg-green-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-800">
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {new Date(submission.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-800">{submission.name || '-'}</div>
                        <div className="text-gray-600">{submission.email || '-'}</div>
                        <div className="text-gray-600">{submission.phone || '-'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-800">{submission.title}</div>
                        <div className="text-gray-600">{submission.category}</div>
                        {submission.area && <div className="text-gray-500 text-xs">{formatAreaDisplay(submission)}</div>}
                        {submission.bedrooms && <div className="text-gray-500 text-xs">{submission.bedrooms} BHK</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-semibold text-green-700">₹{formatIndianPrice(submission.price)}</div>
                        <div className="text-gray-600">{submission.location}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {submission.images && submission.images.length > 0 ? (
                        <div className="flex gap-1">
                          {submission.images.slice(0, 3).map((img, idx) => (
                            <img 
                              key={idx}
                              src={getImageUrl(img)} 
                              alt="Property" 
                              className="w-12 h-12 object-cover rounded border"
                              onError={(e) => e.target.src = 'https://via.placeholder.com/50x50?text=No+Image'}
                            />
                          ))}
                          {submission.images.length > 3 && (
                            <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center text-xs text-gray-600">
                              +{submission.images.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No images</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => handleApproveSubmission(submission._id)} 
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-semibold transition flex items-center justify-center gap-2"
                        >
                          <FaCheckCircle /> Approve
                        </button>
                        <button 
                          onClick={() => handleRejectSubmission(submission._id)} 
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-semibold transition flex items-center justify-center gap-2"
                        >
                          <FaTimesCircle /> Reject
                        </button>
                        <button 
                          onClick={() => handleEditAndApprove(submission)} 
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold transition flex items-center justify-center gap-2"
                        >
                          <FaEdit /> Edit & Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          {publishedUserProperties.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <FaCheckCircle className="mx-auto text-gray-300 text-6xl mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Published Properties</h3>
              <p className="text-gray-500">No user-submitted properties have been published yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Property ID</th>
                    <th className="px-6 py-4 text-left font-semibold">Property Details</th>
                    <th className="px-6 py-4 text-left font-semibold">Submitter</th>
                    <th className="px-6 py-4 text-left font-semibold">Location & Price</th>
                    <th className="px-6 py-4 text-left font-semibold">Status</th>
                    <th className="px-6 py-4 text-left font-semibold">Published On</th>
                    <th className="px-6 py-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {publishedUserProperties.map(property => (
                    <tr key={property._id} className="border-b hover:bg-green-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
                          {property.propertyCode || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-semibold text-gray-800">{property.title}</div>
                          <div className="text-gray-600">{property.category}</div>
                          {property.area && <div className="text-gray-500 text-xs">{formatAreaDisplay(property)}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-semibold text-gray-800">{property.name}</div>
                          <div className="text-gray-600 text-xs">{property.phone}</div>
                          <div className="text-gray-500 text-xs">{property.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-semibold text-green-700">₹{formatIndianPrice(property.price)}</div>
                          <div className="text-gray-600">{property.location}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          property.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : property.status === 'sold'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {property.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {new Date(property.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(property.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEditPublishedProperty(property)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-2 rounded-full transition"
                            title="Edit"
                          >
                            <FaEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeletePublishedProperty(property._id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-100 p-2 rounded-full transition"
                            title="Delete"
                          >
                            <FaTrash size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSubmissions;
