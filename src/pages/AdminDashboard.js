import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaBell, FaCalendar, FaSignOutAlt, FaEdit, FaTrash, FaTimes, FaCheckCircle, FaTimesCircle, FaComments, FaBars, FaImages, FaShoppingCart, FaStar, FaMapMarkerAlt, FaImage, FaClipboardList, FaUser, FaHandshake } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminChat from '../components/AdminChat';
import UserSubmissions from '../components/UserSubmissions';
import UserManagement from '../components/UserManagement';
import UserRequests from '../components/UserRequests';
import NotificationsManagement from '../components/NotificationsManagement';
import Modal from '../components/Modal';
import API_URL, { getImageUrl } from '../utils/api';
import { compressImage } from '../utils/imageCompressor';
import { PROPERTY_FIELDS_CONFIG, getDefaultFormValues, getFieldNamesForCategory } from '../utils/propertyFieldsConfig';
import { formatAreaDisplay } from '../utils/formatMeasurement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('properties');
  const [properties, setProperties] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [buySell, setBuySell] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [propertyLocations, setPropertyLocations] = useState([]);
  const [posters, setPosters] = useState([]);
  const [soldProperties, setSoldProperties] = useState([]);
  const [galleryEnabled, setGalleryEnabled] = useState(true);
  const [mapEnabled, setMapEnabled] = useState(true);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [showBuySellForm, setShowBuySellForm] = useState(false);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showPosterForm, setShowPosterForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [editingGallery, setEditingGallery] = useState(null);
  const [editingBuySell, setEditingBuySell] = useState(null);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [editingPoster, setEditingPoster] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, type: 'success', title: '', message: '', onConfirm: null, showCancel: false });
  const navigate = useNavigate();

  const [propertyForm, setPropertyForm] = useState(getDefaultFormValues());
  const [galleryForm, setGalleryForm] = useState({ title: '', category: '', image: '', description: '' });
  const [buySellForm, setBuySellForm] = useState({ title: '', location: '', price: '', area: '', type: 'sale', date: '', image: '' });
  const [testimonialForm, setTestimonialForm] = useState({ name: '', role: '', text: '', rating: 5, image: '' });
  const [locationForm, setLocationForm] = useState({ coordinates: '', propertyId: '', description: '' });
  const [posterForm, setPosterForm] = useState({ title: '', image: '', startDate: '', endDate: '', isActive: true });
  const [uploading, setUploading] = useState(false);

  const locations = ['Hyderabad', 'Secunderabad', 'Gachibowli', 'Madhapur', 'Kondapur', 'Kukatpally', 'Miyapur', 'Nizampet', 'Bachupally', 'Kompally'];
  const areas = ['500-1000 sq.ft', '1000-1500 sq.ft', '1500-2000 sq.ft', '2000-3000 sq.ft', '3000+ sq.ft', '1 Acre', '2 Acres', '5 Acres', '10+ Acres'];

  const parseDisplaySectionsFromString = (sectionString) => {
    if (!sectionString) return [];
    const normalized = sectionString.toString().trim().toLowerCase();
    const sections = [];
    if (normalized.includes('featured')) sections.push('featured');
    if (normalized.includes('highlight')) sections.push('highlights');
    if (normalized.includes('choice')) sections.push('choice');
    if (/user[-_\s]?submitted/.test(normalized)) sections.push('user-submitted');
    return [...new Set(sections)];
  };

  const normalizeDisplaySections = (sections) => {
    if (sections == null) return [];

    if (Array.isArray(sections)) {
      return sections.flatMap(normalizeDisplaySections);
    }

    if (typeof sections === 'object') {
      return Object.values(sections).flatMap(normalizeDisplaySections);
    }

    if (typeof sections === 'string') {
      const jsonCandidate = sections.trim();
      if ((jsonCandidate.startsWith('[') && jsonCandidate.endsWith(']')) || (jsonCandidate.startsWith('{') && jsonCandidate.endsWith('}'))) {
        try {
          const parsed = JSON.parse(jsonCandidate);
          return normalizeDisplaySections(parsed);
        } catch (error) {
          // ignore invalid JSON and continue with string parsing
        }
      }

      const tokens = sections.split(/[,;|\/]+/).map(s => s.trim()).filter(Boolean);
      if (tokens.length > 1) {
        return tokens.flatMap(parseDisplaySectionsFromString).filter(Boolean);
      }

      return parseDisplaySectionsFromString(sections);
    }

    return normalizeDisplaySections(String(sections));
  };

  const officeSpaceFields = [
    'builtUpArea',
    'pricePerSqFt',
    'expectedRent',
    'depositAmount',
    'floor',
    'plugAndPlay',
    'workStations',
    'cabins',
    'conferenceHall',
    'pantry',
    'washroomDetails',
    'parkingType',
    'parkingCount',
    'washroomInside',
    'washroomOutside',
    'washroomTotal'
  ];

  const getCleanPropertyFormForCategory = (category, currentForm) => {
    const baseForm = {
      title: currentForm.title,
      category,
      price: currentForm.price,
      expectedPrice: currentForm.expectedPrice,
      location: currentForm.location,
      area: currentForm.area,
      bedrooms: currentForm.bedrooms,
      bathrooms: currentForm.bathrooms,
      description: currentForm.description,
      features: currentForm.features,
      images: currentForm.images,
      video: currentForm.video,
      status: currentForm.status,
      sections: currentForm.sections,
      locationUrl: currentForm.locationUrl,
      // Office Space specific fields
      builtUpArea: currentForm.builtUpArea,
      pricePerSqFt: currentForm.pricePerSqFt,
      expectedRent: currentForm.expectedRent,
      depositAmount: currentForm.depositAmount,
      floor: currentForm.floor,
      plugAndPlay: currentForm.plugAndPlay,
      workStations: currentForm.workStations,
      cabins: currentForm.cabins,
      conferenceHall: currentForm.conferenceHall,
      pantry: currentForm.pantry,
      washroomDetails: currentForm.washroomDetails,
      parkingType: currentForm.parkingType,
      parkingCount: currentForm.parkingCount,
      // Washroom breakdown fields
      washroomInside: currentForm.washroomInside,
      washroomOutside: currentForm.washroomOutside,
      washroomTotal: currentForm.washroomTotal
    };

    const dynamicFieldNames = category === 'Office Space'
      ? officeSpaceFields
      : getFieldNamesForCategory(category);

    dynamicFieldNames.forEach((field) => {
      baseForm[field] = currentForm[field] || '';
    });

    return baseForm;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || user.role !== 'admin') {
      navigate('/');
      return;
    }
    Promise.all([fetchProperties(), fetchSchedules(), fetchGallery(), fetchBuySell(), fetchTestimonials(), fetchGallerySettings(), fetchMapSettings(), fetchLocations(), fetchPosters(), fetchSoldProperties()]).then(() => setLoading(false));
  }, [navigate]);

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/properties/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      // Filter to show only admin-posted properties (no name, email, phone)
      const adminProperties = data.filter(p => !p.name && !p.email && !p.phone);
      setProperties(adminProperties);
      return adminProperties;
    } catch (error) {
      console.error('Error fetching properties:', error);
      return [];
    }
  };

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/schedules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSchedules(data);
      return data;
    } catch (error) {
      console.error('Error fetching schedules:', error);
      return [];
    }
  };

  const fetchGallery = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/gallery/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setGallery(Array.isArray(data) ? data : []);
      return data;
    } catch (error) {
      console.error('Error fetching gallery:', error);
      setGallery([]);
      return [];
    }
  };

  const fetchGallerySettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings/gallery.enabled`);
      if (!res.ok) {
        console.warn('Settings API not available, defaulting to enabled');
        setGalleryEnabled(true);
        return null;
      }
      const data = await res.json();
      setGalleryEnabled(data.value !== false);
      return data;
    } catch (error) {
      console.error('Error fetching gallery settings:', error);
      setGalleryEnabled(true);
      return null;
    }
  };

  const fetchMapSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings/map.enabled`);
      if (!res.ok) {
        console.warn('Settings API not available, defaulting to enabled');
        setMapEnabled(true);
        return null;
      }
      const data = await res.json();
      setMapEnabled(data.value !== false);
      return data;
    } catch (error) {
      console.error('Error fetching map settings:', error);
      setMapEnabled(true);
      return null;
    }
  };

  const handleToggleGallerySection = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/settings/gallery.enabled`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          value: !galleryEnabled,
          description: 'Enable or disable the gallery section in the public portal'
        })
      });
      if (!res.ok) {
        showToast('Settings API not available. Please deploy the updated backend code.', 'error');
        return;
      }
      setGalleryEnabled(!galleryEnabled);
      showToast(`Gallery section ${!galleryEnabled ? 'enabled' : 'disabled'}!`, 'success');
    } catch (error) {
      showToast('Settings API not available. Please deploy the updated backend code.', 'error');
    }
  };

  const handleToggleMapSection = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/settings/map.enabled`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          value: !mapEnabled,
          description: 'Enable or disable the map section in the footer'
        })
      });
      if (!res.ok) {
        showToast('Settings API not available. Please deploy the updated backend code.', 'error');
        return;
      }
      setMapEnabled(!mapEnabled);
      showToast(`Map section ${!mapEnabled ? 'enabled' : 'disabled'}!`, 'success');
    } catch (error) {
      showToast('Settings API not available. Please deploy the updated backend code.', 'error');
    }
  };

  const fetchBuySell = async () => {
    try {
      const res = await fetch(`${API_URL}/api/buysell`);
      const data = await res.json();
      setBuySell(data);
      return data;
    } catch (error) {
      console.error('Error fetching buy/sell:', error);
      return [];
    }
  };

  const fetchTestimonials = async () => {
    try {
      const res = await fetch(`${API_URL}/api/testimonials`);
      const data = await res.json();
      setTestimonials(Array.isArray(data) ? data : []);
      return data;
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      setTestimonials([]);
      return [];
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/locations`);
      if (!res.ok) {
        console.warn('Locations API not available yet');
        setPropertyLocations([]);
        return [];
      }
      const data = await res.json();
      setPropertyLocations(Array.isArray(data) ? data : []);
      return data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      setPropertyLocations([]);
      return [];
    }
  };

  const fetchPosters = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/posters/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPosters(Array.isArray(data) ? data : []);
      return data;
    } catch (error) {
      console.error('Error fetching posters:', error);
      setPosters([]);
      return [];
    }
  };

  const fetchSoldProperties = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/chat/sold-properties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        console.warn('Sold properties API not available');
        setSoldProperties([]);
        return [];
      }
      const data = await res.json();
      setSoldProperties(Array.isArray(data) ? data : []);
      return data;
    } catch (error) {
      console.error('Error fetching sold properties:', error);
      setSoldProperties([]);
      return [];
    }
  };

  // Format number with Indian comma system (matching user side)
  const formatIndianNumber = (num) => {
    if (!num) return '';
    const numStr = num.toString().replace(/,/g, '');
    const lastThree = numStr.substring(numStr.length - 3);
    const otherNumbers = numStr.substring(0, numStr.length - 3);
    if (otherNumbers !== '') {
      return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
    }
    return lastThree;
  };

  const formatPrice = (value) => {
    const num = value.replace(/[^0-9]/g, '');
    if (!num) return '';
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatIndianPrice = (price) => {
    if (!price) return '0';
    // Remove any existing commas and non-numeric characters except digits
    const numericPrice = price.toString().replace(/[^0-9]/g, '');
    if (!numericPrice) return '0';
    // Format with Indian comma system
    return new Intl.NumberFormat('en-IN').format(numericPrice);
  };

  // Handle price input with Indian comma formatting (matching user side)
  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/[^0-9]/g, '');
    setPropertyForm({ ...propertyForm, [name]: numericValue });
  };

  // Handle numeric input (only numbers allowed) - matching user side
  const handleNumericChange = (field, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setPropertyForm({ ...propertyForm, [field]: numericValue });
  };

  const handleExpectedPriceChange = (e) => {
    const formatted = formatPrice(e.target.value);
    setPropertyForm({...propertyForm, expectedPrice: formatted});
  };

  const calculateOfficeSpaceExpectedRent = (builtUpArea, pricePerSqFt) => {
    const areaValue = Number(builtUpArea || propertyForm.builtUpArea);
    const rateValue = Number(pricePerSqFt || propertyForm.pricePerSqFt);
    if (!areaValue || !rateValue) return '';
    return (areaValue * rateValue).toLocaleString('en-IN');
  };

  const handleOfficeSpaceChange = (field, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    const updatedForm = { ...propertyForm, [field]: numericValue };

    if (field === 'builtUpArea' || field === 'pricePerSqFt') {
      updatedForm.expectedRent = calculateOfficeSpaceExpectedRent(
        field === 'builtUpArea' ? numericValue : propertyForm.builtUpArea,
        field === 'pricePerSqFt' ? numericValue : propertyForm.pricePerSqFt
      );
    }

    setPropertyForm(updatedForm);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    
    let uploadFile = file;
    try {
      uploadFile = await compressImage(file, 2);
    } catch (err) {
      console.log('Compression failed, using original:', err);
    }

    const formData = new FormData();
    formData.append('image', uploadFile);
    if (editingProperty?.propertyCode) {
      formData.append('propertyCode', editingProperty.propertyCode);
    }

    try {
      const token = localStorage.getItem('token');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit'
      });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (res.ok) {
        setPropertyForm({...propertyForm, images: [...propertyForm.images, data.url]});
        showToast('Image uploaded successfully!', 'success');
      } else {
        alert(`Upload failed: ${data.message || 'Server error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (error.name === 'AbortError') {
        alert('Upload timeout. Please check your internet connection and try again.');
      } else if (error.message === 'Failed to fetch') {
        alert('Cannot connect to server. Please check:\n1. Your internet connection\n2. Backend server is running\n3. Try again in a moment');
      } else {
        alert(`Error: ${error.message}`);
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index) => {
    setPropertyForm({...propertyForm, images: propertyForm.images.filter((_, i) => i !== index)});
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = async function() {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > 30) {
        alert('Video must be 30 seconds or less');
        e.target.value = '';
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        alert('Video size must be less than 50MB');
        e.target.value = '';
        return;
      }

      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append('video', file);

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/upload/video`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`
          },
          body: formDataUpload
        });
        
        const data = await res.json();
        if (res.ok) {
          setPropertyForm({...propertyForm, video: data.url});
          showToast('Video uploaded successfully!', 'success');
        } else {
          alert(`Upload failed: ${data.message}`);
        }
      } catch (error) {
        alert(`Error: ${error.message}`);
      } finally {
        setUploading(false);
        e.target.value = '';
      }
    };
    video.src = URL.createObjectURL(file);
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handlePropertySubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = editingProperty 
      ? `${API_URL}/api/properties/${editingProperty._id}`
      : `${API_URL}/api/properties`;
    
    // Validate required fields
    if (!propertyForm.title?.trim()) {
      showToast('Please enter a property title.', 'error');
      return;
    }
    if (!propertyForm.category) {
      showToast('Please select a property category.', 'error');
      return;
    }
    if (!propertyForm.location) {
      showToast('Please select a location.', 'error');
      return;
    }
    
    // Build body with all dynamic fields
    const priceValue = propertyForm.expectedRent || propertyForm.expectedPrice || propertyForm.price;
    if (!priceValue) {
      showToast('Please enter the price or expected rent for this property.', 'error');
      return;
    }

    // Construct area field from acres and guntas for Agricultural Land and Farmhouse
    let areaValue = propertyForm.area?.trim();
    if (propertyForm.category === 'Agricultural Land' || propertyForm.category === 'Farmhouse') {
      const acres = Number(propertyForm.acres) || 0;
      const guntas = Number(propertyForm.guntas) || 0;
      const parts = [];
      if (acres > 0) parts.push(`${acres} Acre${acres !== 1 ? 's' : ''}`);
      if (guntas > 0) parts.push(`${guntas} Gunta${guntas !== 1 ? 's' : ''}`);
      areaValue = parts.length > 0 ? parts.join(' ') : areaValue;
    }

    // Keep description as plain text - property details are stored in their own fields
    const descriptionValue = propertyForm.description?.trim() || '';

    const body = {
      title: propertyForm.title?.trim(),
      category: propertyForm.category,
      location: propertyForm.location,
      area: areaValue,
      price: priceValue,
      expectedPrice: priceValue,
      sections: normalizeDisplaySections(propertyForm.sections),
      features: propertyForm.features ? propertyForm.features.split(',').map(f => f.trim()).filter(f => f) : [],
      images: propertyForm.images,
      video: propertyForm.video?.trim(),
      status: propertyForm.status,
      description: descriptionValue,
      // Convert numeric fields properly
      bedrooms: propertyForm.bedrooms ? Number(propertyForm.bedrooms) : undefined,
      bathrooms: propertyForm.bathrooms ? Number(propertyForm.bathrooms) : undefined,
      acres: propertyForm.acres ? Number(propertyForm.acres) : undefined,
      guntas: propertyForm.guntas ? Number(propertyForm.guntas) : undefined,
      plotAreaSqYards: propertyForm.plotAreaSqYards ? Number(propertyForm.plotAreaSqYards) : undefined,
      totalFloors: propertyForm.totalFloors ? Number(propertyForm.totalFloors) : undefined,
      portions: propertyForm.portions ? Number(propertyForm.portions) : undefined,
      washrooms: propertyForm.washrooms ? Number(propertyForm.washrooms) : undefined,
      buildingAge: propertyForm.buildingAge ? Number(propertyForm.buildingAge) : undefined,
      numberOfCarParkings: propertyForm.numberOfCarParkings ? Number(propertyForm.numberOfCarParkings) : undefined,
      buildupArea: propertyForm.buildupArea ? Number(propertyForm.buildupArea) : undefined,
      propertyAge: propertyForm.propertyAge ? Number(propertyForm.propertyAge) : undefined,
      washroomInside: propertyForm.washroomInside ? Number(propertyForm.washroomInside) : undefined,
      washroomOutside: propertyForm.washroomOutside ? Number(propertyForm.washroomOutside) : undefined,
      washroomTotal: propertyForm.washroomTotal ? Number(propertyForm.washroomTotal) : undefined,
      numberOfCarParking: propertyForm.numberOfCarParking ? Number(propertyForm.numberOfCarParking) : undefined,
      plotArea: propertyForm.plotArea ? Number(propertyForm.plotArea) : undefined,
      farmhouseAreaAcres: propertyForm.farmhouseAreaAcres ? Number(propertyForm.farmhouseAreaAcres) : undefined,
      // Office Space specific fields
      builtUpArea: propertyForm.builtUpArea ? Number(propertyForm.builtUpArea) : undefined,
      pricePerSqFt: propertyForm.pricePerSqFt ? Number(propertyForm.pricePerSqFt) : undefined,
      expectedRent: propertyForm.expectedRent?.trim(),
      depositAmount: propertyForm.depositAmount ? Number(propertyForm.depositAmount) : undefined,
      floor: propertyForm.floor?.trim(),
      plugAndPlay: propertyForm.plugAndPlay?.trim(),
      workStations: propertyForm.workStations ? Number(propertyForm.workStations) : undefined,
      cabins: propertyForm.cabins ? Number(propertyForm.cabins) : undefined,
      conferenceHall: propertyForm.conferenceHall ? Number(propertyForm.conferenceHall) : undefined,
      pantry: propertyForm.pantry ? Number(propertyForm.pantry) : undefined,
      parkingType: propertyForm.parkingType?.trim(),
      parkingCount: propertyForm.parkingCount ? Number(propertyForm.parkingCount) : undefined,
      washroomDetails: propertyForm.washroomDetails?.trim(),
      // Dynamic fields from config (only those that exist in schema)
      road: propertyForm.road?.trim(),
      roadType: propertyForm.roadType?.trim(),
      propertyUnder: propertyForm.propertyUnder?.trim(),
      propertyFacing: propertyForm.propertyFacing?.trim(),
      boundaryType: propertyForm.boundaryType?.trim(),
      bore: propertyForm.bore?.trim(),
      anyPTCase: propertyForm.anyPTCase?.trim(),
      propertyLocation: propertyForm.propertyLocation?.trim(),
      'revenueRegistration/subRegister': propertyForm['revenueRegistration/subRegister']?.trim(),
      district: propertyForm.district?.trim(),
      state: propertyForm.state?.trim(),
      locationUrl: propertyForm.locationUrl?.trim(),
      flatType: propertyForm.flatType?.trim(),
      floorDetails: propertyForm.floorDetails?.trim(),
      furnishingStatus: propertyForm.furnishingStatus?.trim(),
      parkingDetails: propertyForm.parkingDetails?.trim(),
      swimmingPool: propertyForm.swimmingPool?.trim(),
      anyConstruction: propertyForm.anyConstruction?.trim(),
      commercialPropertyType: propertyForm.commercialPropertyType?.trim(),
      transactionType: propertyForm.transactionType?.trim(),
      garden: propertyForm.garden?.trim()
    };
    
    // Remove undefined values to avoid sending null for optional fields
    Object.keys(body).forEach(key => {
      if (body[key] === undefined) delete body[key];
    });
    
    console.log('Sending property data:', body);

    try {
      const res = await fetch(url, {
        method: editingProperty ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        const updatedProperty = data;
        console.log('Saved property:', updatedProperty);
        
        // If new property and has images without watermark, re-upload with property code
        if (!editingProperty && updatedProperty.propertyCode && propertyForm.images.length > 0) {
          setEditingProperty(updatedProperty);
          showToast('Property created! Images will be watermarked with ' + updatedProperty.propertyCode, 'success');
        }
        
        if (editingProperty) {
          setProperties(properties.map(p => p._id === updatedProperty._id ? updatedProperty : p));
        } else {
          setProperties([updatedProperty, ...properties]);
        }
        
        setShowPropertyForm(false);
        setEditingProperty(null);
        setPropertyForm(getDefaultFormValues());
        showToast(editingProperty ? 'Property updated successfully!' : 'Property added successfully!', 'success');
      } else {
        console.error('Backend error:', data);
        showToast(data.message || 'Failed to save property', 'error');
      }
    } catch (err) {
      console.error('Network error saving property:', err);
      showToast('Network error: ' + err.message + '. Please check your internet connection and backend server.', 'error');
    }
  };

  const handleDeleteProperty = async (id) => {
    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this property? This action cannot be undone.',
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
            setProperties(properties.filter(p => p._id !== id));
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

  const handleRenewProperty = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/properties/${id}/renew`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const renewed = await res.json();
        setProperties(properties.map(p => p._id === id ? renewed.property : p));
        showToast('Property renewed for 90 days!', 'success');
      } else {
        showToast('Failed to renew property', 'error');
      }
    } catch (error) {
      showToast('Failed to renew property', 'error');
    }
  };

  const handleEditProperty = (property) => {
    setEditingProperty(property);

    const existingSections = normalizeDisplaySections(property.sections || property.section || ['featured']);
    const featuresString = Array.isArray(property.features) ? property.features.join(', ') : property.features || '';

    const formValues = {
      ...getDefaultFormValues(),
      ...property,
      features: featuresString,
      sections: existingSections.length ? existingSections : ['featured']
    };

    setPropertyForm(formValues);
    setShowPropertyForm(true);
  };

  const handleScheduleStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/schedules/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updatedSchedule = await res.json();
        setSchedules(schedules.map(s => s._id === updatedSchedule._id ? updatedSchedule : s));
        showToast('Schedule updated!', 'success');
      } else {
        showToast('Failed to update schedule', 'error');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      showToast('Failed to update schedule', 'error');
    }
  };

  const handleGallerySubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = editingGallery ? `${API_URL}/api/gallery/${editingGallery._id}` : `${API_URL}/api/gallery`;
    try {
      const res = await fetch(url, {
        method: editingGallery ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(galleryForm)
      });
      if (res.ok) {
        const updatedItem = await res.json();
        
        if (editingGallery) {
          setGallery(gallery.map(g => g._id === updatedItem._id ? updatedItem : g));
        } else {
          setGallery([updatedItem, ...gallery]);
        }
        
        setShowGalleryForm(false);
        setEditingGallery(null);
        setGalleryForm({ title: '', category: '', image: '', description: '' });
        showToast(editingGallery ? 'Gallery updated!' : 'Gallery added!', 'success');
      } else {
        const error = await res.json();
        showToast(error.message || 'Failed to save gallery', 'error');
      }
    } catch (error) {
      showToast('Failed to save gallery', 'error');
    }
  };

  const handleDeleteGallery = async (id) => {
    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Confirm Delete',
      message: 'Delete this gallery item?',
      showCancel: true,
      onConfirm: async () => {
        setModal({ ...modal, isOpen: false });
        const token = localStorage.getItem('token');
        try {
          const res = await fetch(`${API_URL}/api/gallery/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            setGallery(gallery.filter(g => g._id !== id));
            showToast('Gallery deleted!', 'success');
          } else {
            showToast('Failed to delete', 'error');
          }
        } catch (error) {
          showToast('Failed to delete', 'error');
        }
      }
    });
  };

  const handleBuySellSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = editingBuySell ? `${API_URL}/api/buysell/${editingBuySell._id}` : `${API_URL}/api/buysell`;
    try {
      const res = await fetch(url, {
        method: editingBuySell ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(buySellForm)
      });
      if (res.ok) {
        const updatedItem = await res.json();
        
        if (editingBuySell) {
          setBuySell(buySell.map(b => b._id === updatedItem._id ? updatedItem : b));
        } else {
          setBuySell([updatedItem, ...buySell]);
        }
        
        setShowBuySellForm(false);
        setEditingBuySell(null);
        setBuySellForm({ title: '', location: '', price: '', area: '', type: 'sold', date: '', image: '' });
        showToast(editingBuySell ? 'Item updated!' : 'Item added!', 'success');
      } else {
        const error = await res.json();
        showToast(error.message || 'Failed to save', 'error');
      }
    } catch (error) {
      showToast('Failed to save', 'error');
    }
  };

  const handleDeleteBuySell = async (id) => {
    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Confirm Delete',
      message: 'Delete this item?',
      showCancel: true,
      onConfirm: async () => {
        setModal({ ...modal, isOpen: false });
        const token = localStorage.getItem('token');
        try {
          const res = await fetch(`${API_URL}/api/buysell/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            setBuySell(buySell.filter(b => b._id !== id));
            showToast('Item deleted!', 'success');
          } else {
            showToast('Failed to delete', 'error');
          }
        } catch (error) {
          showToast('Failed to delete', 'error');
        }
      }
    });
  };

  const handleTestimonialSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = editingTestimonial ? `${API_URL}/api/testimonials/${editingTestimonial._id}` : `${API_URL}/api/testimonials`;
    try {
      const res = await fetch(url, {
        method: editingTestimonial ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(testimonialForm)
      });
      if (res.ok) {
        const updatedItem = await res.json();
        if (editingTestimonial) {
          setTestimonials(testimonials.map(t => t._id === updatedItem._id ? updatedItem : t));
        } else {
          setTestimonials([updatedItem, ...testimonials]);
        }
        setShowTestimonialForm(false);
        setEditingTestimonial(null);
        setTestimonialForm({ name: '', role: '', text: '', rating: 5, image: '' });
        showToast(editingTestimonial ? 'Testimonial updated!' : 'Testimonial added!', 'success');
      } else {
        const error = await res.json();
        showToast(error.message || 'Failed to save', 'error');
      }
    } catch (error) {
      showToast('Failed to save', 'error');
    }
  };

  const handleDeleteTestimonial = async (id) => {
    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Confirm Delete',
      message: 'Delete this testimonial?',
      showCancel: true,
      onConfirm: async () => {
        setModal({ ...modal, isOpen: false });
        const token = localStorage.getItem('token');
        try {
          const res = await fetch(`${API_URL}/api/testimonials/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            setTestimonials(testimonials.filter(t => t._id !== id));
            showToast('Testimonial deleted!', 'success');
          } else {
            showToast('Failed to delete', 'error');
          }
        } catch (error) {
          showToast('Failed to delete', 'error');
        }
      }
    });
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = editingLocation ? `${API_URL}/api/locations/${editingLocation._id}` : `${API_URL}/api/locations`;
    try {
      const res = await fetch(url, {
        method: editingLocation ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(locationForm)
      });
      if (!res.ok) {
        if (res.status === 404) {
          showToast('Locations API not available. Please deploy the updated backend code.', 'error');
          return;
        }
        const error = await res.json();
        showToast(error.message || 'Failed to save', 'error');
        return;
      }
      const updatedItem = await res.json();
      if (editingLocation) {
        setPropertyLocations(propertyLocations.map(l => l._id === updatedItem._id ? updatedItem : l));
      } else {
        setPropertyLocations([updatedItem, ...propertyLocations]);
      }
      setShowLocationForm(false);
      setEditingLocation(null);
      setLocationForm({ coordinates: '', propertyId: '', description: '' });
      showToast(editingLocation ? 'Location updated!' : 'Location added!', 'success');
    } catch (error) {
      showToast('Locations API not available. Please deploy the updated backend code.', 'error');
    }
  };

  const handleDeleteLocation = async (id) => {
    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Confirm Delete',
      message: 'Delete this location?',
      showCancel: true,
      onConfirm: async () => {
        setModal({ ...modal, isOpen: false });
        const token = localStorage.getItem('token');
        try {
          const res = await fetch(`${API_URL}/api/locations/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) {
            if (res.status === 404) {
              showToast('Locations API not available. Please deploy the updated backend code.', 'error');
              return;
            }
            showToast('Failed to delete', 'error');
            return;
          }
          setPropertyLocations(propertyLocations.filter(l => l._id !== id));
          showToast('Location deleted!', 'success');
        } catch (error) {
          showToast('Locations API not available. Please deploy the updated backend code.', 'error');
        }
      }
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  const openGoogleMaps = (lat, lng) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else {
      showToast('Invalid coordinates', 'error');
    }
  };

  // Poster handlers
  const handlePosterSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = editingPoster ? `${API_URL}/api/posters/${editingPoster._id}` : `${API_URL}/api/posters`;
    const fallbackImage = 'https://via.placeholder.com/1200x300?text=Announcement';
    const payload = {
      ...posterForm,
      image: posterForm.image && posterForm.image.trim() ? posterForm.image : fallbackImage
    };
    try {
      const res = await fetch(url, {
        method: editingPoster ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const error = await res.json();
        showToast(error.message || 'Failed to save poster', 'error');
        return;
      }
      const updatedPoster = await res.json();
      if (editingPoster) {
        setPosters(posters.map(p => p._id === updatedPoster._id ? updatedPoster : p));
      } else {
        setPosters([updatedPoster, ...posters]);
      }
      setShowPosterForm(false);
      setEditingPoster(null);
      setPosterForm({ title: '', image: '', startDate: '', endDate: '', isActive: true });
      showToast(editingPoster ? 'Poster updated!' : 'Poster added!', 'success');
    } catch (error) {
      showToast('Failed to save poster', 'error');
    }
  };

  const handleDeletePoster = async (id) => {
    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Confirm Delete',
      message: 'Delete this poster?',
      showCancel: true,
      onConfirm: async () => {
        setModal({ ...modal, isOpen: false });
        const token = localStorage.getItem('token');
        try {
          const res = await fetch(`${API_URL}/api/posters/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) {
            showToast('Failed to delete poster', 'error');
            return;
          }
          setPosters(posters.filter(p => p._id !== id));
          showToast('Poster deleted!', 'success');
        } catch (error) {
          showToast('Failed to delete poster', 'error');
        }
      }
    });
  };

  const handleTogglePoster = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/posters/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        showToast('Failed to toggle poster', 'error');
        return;
      }
      const updatedPoster = await res.json();
      setPosters(posters.map(p => p._id === updatedPoster._id ? updatedPoster : p));
      showToast(`Poster ${updatedPoster.isActive ? 'activated' : 'deactivated'}!`, 'success');
    } catch (error) {
      showToast('Failed to toggle poster', 'error');
    }
  };

  const isPosterExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  const isPosterActive = (poster) => {
    const now = new Date();
    return poster.isActive && new Date(poster.startDate) <= now && new Date(poster.endDate) >= now;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100">
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        showCancel={modal.showCancel}
      />
      {toast.show && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fadeIn">
          <div className={`bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-scaleIn ${toast.type === 'success' ? 'border-t-4 border-green-500' : 'border-t-4 border-red-500'}`}>
            <div className="flex flex-col items-center text-center">
              {toast.type === 'success' ? (
                <FaCheckCircle className="text-green-500 text-6xl mb-4 animate-bounce" />
              ) : (
                <FaTimesCircle className="text-red-500 text-6xl mb-4 animate-bounce" />
              )}
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {toast.type === 'success' ? 'Success!' : 'Error!'}
              </h3>
              <p className="text-gray-600 text-lg">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white shadow md:pl-64">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="text-gray-700 hover:text-blue-600 p-2 md:hidden"
            >
              <FaBars size={24} />
            </button>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-700">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Persistent Sidebar (desktop) */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-white shadow overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Menu</h2>
        </div>
        <nav className="p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('properties')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'properties' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
          >
            <FaHome /> Properties
          </button>
          <button 
            onClick={() => setActiveTab('userSubmissions')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'userSubmissions' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
          >
            <FaClipboardList /> List Property
          </button>
          <button 
            onClick={() => setActiveTab('schedules')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'schedules' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
          >
            <FaCalendar /> Schedules
          </button>
          <button 
            onClick={() => setActiveTab('userRequests')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'userRequests' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
          >
            <FaHandshake /> User Requests
          </button>
          <button 
            onClick={() => setActiveTab('notifications')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'notifications' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
          >
            <FaBell /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab('gallery')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'gallery' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
          >
            <FaImages /> Gallery
          </button>
          <button 
            onClick={() => setActiveTab('buysell')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'buysell' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
          >
            <FaShoppingCart /> Buy/Sell
          </button>
          <button 
            onClick={() => setActiveTab('testimonials')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'testimonials' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
          >
            <FaStar /> Testimonials
          </button>
          <button 
            onClick={() => setActiveTab('locations')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'locations' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
          >
            <FaMapMarkerAlt /> Locations
          </button>
          <button 
            onClick={() => setActiveTab('posters')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'posters' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
          >
            <FaImage /> Posters
          </button>
          <button 
            onClick={() => setActiveTab('chat')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'chat' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
          >
            <FaComments /> Live Chat
          </button>
          <button 
            onClick={() => setActiveTab('users')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
          >
            <FaUser /> User Management
          </button>
          <button 
            onClick={() => setActiveTab('soldProperties')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'soldProperties' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
          >
            <FaCheckCircle /> Sold Properties
          </button>
        </nav>
      </div>

      {/* Side Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50" 
            onClick={() => setSidebarOpen(false)}
          ></div>
          
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl animate-slideInRight overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">Menu</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={24} />
              </button>
            </div>
            
            <nav className="p-4">
              <button 
                onClick={() => { setActiveTab('properties'); setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded mb-2 transition ${activeTab === 'properties' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <FaHome /> Properties
              </button>
              <button 
                onClick={() => { setActiveTab('userSubmissions'); setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded mb-2 transition ${activeTab === 'userSubmissions' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <FaClipboardList /> List Property
              </button>
              <button 
                onClick={() => { setActiveTab('schedules'); setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded mb-2 transition ${activeTab === 'schedules' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <FaCalendar /> Schedules
              </button>
              <button 
                onClick={() => { setActiveTab('userRequests'); setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded mb-2 transition ${activeTab === 'userRequests' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <FaHandshake /> User Requests
              </button>
              <button 
                onClick={() => { setActiveTab('notifications'); setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded mb-2 transition ${activeTab === 'notifications' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <FaBell /> Notifications
              </button>
              <button 
                onClick={() => { setActiveTab('gallery'); setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded mb-2 transition ${activeTab === 'gallery' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <FaImages /> Gallery
              </button>
              <button 
                onClick={() => { setActiveTab('buysell'); setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded mb-2 transition ${activeTab === 'buysell' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <FaShoppingCart /> Buy/Sell
              </button>
              <button 
                onClick={() => { setActiveTab('testimonials'); setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded mb-2 transition ${activeTab === 'testimonials' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <FaStar /> Testimonials
              </button>
              <button 
                onClick={() => { setActiveTab('locations'); setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded mb-2 transition ${activeTab === 'locations' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <FaMapMarkerAlt /> Locations
              </button>
              <button 
                onClick={() => { setActiveTab('posters'); setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded mb-2 transition ${activeTab === 'posters' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <FaImage /> Posters
              </button>
              <button 
                onClick={() => { setActiveTab('chat'); setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded mb-2 transition ${activeTab === 'chat' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <FaComments /> Live Chat
              </button>
              <button 
                onClick={() => { setActiveTab('users'); setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded mb-2 transition ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <FaUser /> User Management
              </button>
              <button 
                onClick={() => { setActiveTab('soldProperties'); setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded mb-2 transition ${activeTab === 'soldProperties' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              >
                <FaCheckCircle /> Sold Properties
              </button>
            </nav>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 md:ml-64">
        {activeTab === 'chat' && <AdminChat />}
        {activeTab === 'users' && <UserManagement showToast={showToast} setModal={setModal} />}
        {activeTab === 'notifications' && <NotificationsManagement showToast={showToast} />}
        {activeTab === 'userRequests' && (
          <UserRequests showToast={showToast} setModal={setModal} />
        )}

        {activeTab === 'properties' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Manage Properties</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const csvContent = [
                      ['Property ID', 'Title', 'Category', 'Price', 'Location', 'Area', 'Bedrooms', 'Bathrooms', 'Status', 'Section', 'Created Date'],
                      ...properties.map(p => [
                        p.propertyCode || 'N/A',
                        p.title,
                        p.category,
                        p.price,
                        p.location,
                        formatAreaDisplay(p),
                        p.bedrooms || 'N/A',
                        p.bathrooms || 'N/A',
                        p.status,
                        (p.sections || []).join(', '),
                        new Date(p.createdAt).toLocaleDateString()
                      ])
                    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `properties_report_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  📥 Download Report
                </button>
                <button onClick={() => { setShowPropertyForm(true); setEditingProperty(null); setPropertyForm(getDefaultFormValues()); }} className="bg-green-600 text-white px-4 py-2 rounded">
                  Add Property
                </button>
              </div>
            </div>

            {showPropertyForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideIn">
                  <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold">{editingProperty ? 'Edit' : 'Add'} Property</h3>
                    <button onClick={() => { setShowPropertyForm(false); setEditingProperty(null); }} className="text-gray-500 hover:text-gray-700 text-2xl">
                      <FaTimes />
                    </button>
                  </div>
                  <div className="p-6">
                    <form onSubmit={handlePropertySubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 mb-2">Property Title *</label>
                          <input 
                            type="text" 
                            value={propertyForm.title} 
                            onChange={(e) => setPropertyForm({...propertyForm, title: e.target.value})} 
                            className="w-full border p-3 rounded" 
                            required 
                            placeholder="Enter property title"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 mb-2">Category *</label>
                          <select 
                            value={propertyForm.category} 
                            onChange={(e) => setPropertyForm(getCleanPropertyFormForCategory(e.target.value, propertyForm))} 
                            className="w-full border p-3 rounded" 
                            required
                          >
                            <option value="">Select Category</option>
                            <option value="Agricultural Land">Agricultural Land</option>
                            <option value="Independent House">Independent House</option>
                            <option value="Open Plot">Open Plot</option>
                            <option value="Apartment">Apartment</option>
                            <option value="Farmhouse">Farmhouse</option>
                            <option value="Commercial Space">Commercial Space</option>
                            <option value="Office Space">Office Space</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-700 mb-2">Location *</label>
                          <select 
                            value={propertyForm.location} 
                            onChange={(e) => setPropertyForm({...propertyForm, location: e.target.value})} 
                            className="w-full border p-3 rounded" 
                            required
                          >
                            <option value="">Select Location</option>
                            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                          </select>
                        </div>
                        {/* Office Space specific fields */}
                        {propertyForm.category === 'Office Space' && (
                          <>
                            <div>
                              <label className="block text-gray-700 mb-2">Built-up Area *</label>
                              <div className="flex items-center border rounded overflow-hidden">
                                <span className="bg-gray-100 px-3 py-3 text-gray-600 border-r">Sq. Ft</span>
                                <input 
                                  type="text" 
                                  value={propertyForm.builtUpArea} 
                                  onChange={(e) => handleOfficeSpaceChange('builtUpArea', e.target.value)} 
                                  className="flex-1 p-3 outline-none" 
                                  required 
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-gray-700 mb-2">Floor *</label>
                              <input 
                                type="text" 
                                value={propertyForm.floor} 
                                onChange={(e) => setPropertyForm({...propertyForm, floor: e.target.value})} 
                                className="w-full border p-3 rounded" 
                                required
                                placeholder="Enter the floor"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 mb-2">Expected Price (Per Sq.Ft) *</label>
                              <input 
                                type="text" 
                                value={propertyForm.pricePerSqFt} 
                                onChange={(e) => handleOfficeSpaceChange('pricePerSqFt', e.target.value)} 
                                className="w-full border p-3 rounded" 
                                required 
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 mb-2">Deposit Amount *</label>
                              <input 
                                type="text" 
                                value={propertyForm.depositAmount} 
                                onChange={(e) => handleNumericChange('depositAmount', e.target.value)} 
                                className="w-full border p-3 rounded" 
                                required 
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 mb-2">Plug & Play *</label>
                              <select 
                                value={propertyForm.plugAndPlay} 
                                onChange={(e) => setPropertyForm({...propertyForm, plugAndPlay: e.target.value})} 
                                className="w-full border p-3 rounded"
                                required
                              >
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-gray-700 mb-2">Work Stations *</label>
                              <input 
                                type="text" 
                                value={propertyForm.workStations} 
                                onChange={(e) => handleNumericChange('workStations', e.target.value)} 
                                className="w-full border p-3 rounded" 
                                required
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 mb-2">Cabins *</label>
                              <input 
                                type="text" 
                                value={propertyForm.cabins} 
                                onChange={(e) => handleNumericChange('cabins', e.target.value)} 
                                className="w-full border p-3 rounded" 
                                required
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 mb-2">Conference Hall *</label>
                              <input 
                                type="text" 
                                value={propertyForm.conferenceHall} 
                                onChange={(e) => handleNumericChange('conferenceHall', e.target.value)} 
                                className="w-full border p-3 rounded" 
                                required
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 mb-2">Pantry *</label>
                              <input 
                                type="text" 
                                value={propertyForm.pantry} 
                                onChange={(e) => handleNumericChange('pantry', e.target.value)} 
                                className="w-full border p-3 rounded" 
                                required
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 mb-2">Parking Type *</label>
                              <select
                                value={propertyForm.parkingType}
                                onChange={(e) => setPropertyForm({...propertyForm, parkingType: e.target.value})}
                                className="w-full border p-3 rounded"
                                required
                              >
                                <option value="">Select Parking Type</option>
                                <option value="Public">Public</option>
                                <option value="Reserved">Reserved</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-gray-700 mb-2">Number of Car Parkings *</label>
                              <input
                                type="text"
                                placeholder="0"
                                value={propertyForm.parkingCount}
                                onChange={(e) => handleNumericChange('parkingCount', e.target.value)}
                                className="w-full border p-3 rounded"
                                required
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-gray-700 mb-2">Expected Rent (Auto-calculated)</label>
                              <input
                                type="text"
                                placeholder="₹ 0"
                                value={propertyForm.expectedRent ? `₹ ${formatIndianNumber(propertyForm.expectedRent)}` : ''}
                                readOnly
                                className="w-full border p-3 rounded bg-gray-100"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-gray-700 mb-2">Washroom Details *</label>
                              <input 
                                type="text" 
                                placeholder="Total-0, Inside-0, Outside-0" 
                                value={propertyForm.washroomDetails} 
                                onChange={(e) => setPropertyForm({...propertyForm, washroomDetails: e.target.value})} 
                                className="w-full border p-3 rounded" 
                                required 
                              />
                            </div>
                          </>
                        )}

                        {/* Non-Office Space categories */}
                        {propertyForm.category !== 'Office Space' && propertyForm.category && (
                          <>
                            <div>
                              <label className="block text-gray-700 mb-2">Price (INR) *</label>
                              <input 
                                type="text" 
                                name="price"
                                placeholder="₹ 0,00,000" 
                                value={propertyForm.price ? formatIndianNumber(propertyForm.price) : ''} 
                                onChange={handlePriceChange} 
                                className="w-full border p-3 rounded" 
                                required 
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 mb-2">Area (sq.ft) *</label>
                              <input 
                                type="text" 
                                value={propertyForm.area} 
                                onChange={(e) => setPropertyForm({...propertyForm, area: e.target.value})} 
                                className="w-full border p-3 rounded" 
                                required 
                                placeholder="Enter area in sq.ft"
                              />
                            </div>
                          </>
                        )}

                        {/* Bedrooms and Bathrooms for applicable categories */}
                        {propertyForm.category && !['Agricultural Land', 'Open Plot', 'Office Space'].includes(propertyForm.category) && (
                          <>
                            <div>
                              <label className="block text-gray-700 mb-2">Bedrooms *</label>
                              <input 
                                type="text" 
                                value={propertyForm.bedrooms} 
                                onChange={(e) => handleNumericChange('bedrooms', e.target.value)} 
                                className="w-full border p-3 rounded" 
                                required
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 mb-2">Bathrooms *</label>
                              <input 
                                type="text" 
                                value={propertyForm.bathrooms} 
                                onChange={(e) => handleNumericChange('bathrooms', e.target.value)} 
                                className="w-full border p-3 rounded" 
                                required
                                placeholder="0"
                              />
                            </div>
                          </>
                        )}

                        {/* Parking for applicable categories */}
                        {propertyForm.category && ['Apartment', 'Independent House'].includes(propertyForm.category) && (
                          <>
                            <div>
                              <label className="block text-gray-700 mb-2">Parking Type *</label>
                              <select 
                                value={propertyForm.parkingType} 
                                onChange={(e) => setPropertyForm({...propertyForm, parkingType: e.target.value})} 
                                className="w-full border p-3 rounded" 
                                required
                              >
                                <option value="">Select Parking Type</option>
                                <option value="Public">Public</option>
                                <option value="Reserved">Reserved</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-gray-700 mb-2">Number of Car Parkings *</label>
                              <input 
                                type="text" 
                                value={propertyForm.parkingCount} 
                                onChange={(e) => handleNumericChange('parkingCount', e.target.value)} 
                                className="w-full border p-3 rounded" 
                                required
                                placeholder="0" 
                              />
                            </div>
                          </>
                        )}

                        {/* Dynamic fields based on category from config */}
                        {propertyForm.category && PROPERTY_FIELDS_CONFIG[propertyForm.category] && !PROPERTY_FIELDS_CONFIG[propertyForm.category].isCustom && (
                          <>
                            {PROPERTY_FIELDS_CONFIG[propertyForm.category].fields.map((field) => (
                              <React.Fragment key={field.name}>
                                {field.type === 'washroom-group' ? (
                                  <div className="md:col-span-2">
                                    <label className="block text-gray-700 mb-2">
                                      {field.label} {field.required && '*'}
                                    </label>
                                    <div className="grid grid-cols-3 gap-4">
                                      <div>
                                        <input
                                          type="text"
                                          placeholder="Inside: 0"
                                          value={propertyForm.washroomInside || ''}
                                          onChange={(e) => handleNumericChange('washroomInside', e.target.value)}
                                          className="w-full border p-3 rounded"
                                          required={field.required}
                                        />
                                      </div>
                                      <div>
                                        <input
                                          type="text"
                                          placeholder="Outside: 0"
                                          value={propertyForm.washroomOutside || ''}
                                          onChange={(e) => handleNumericChange('washroomOutside', e.target.value)}
                                          className="w-full border p-3 rounded"
                                          required={field.required}
                                        />
                                      </div>
                                      <div>
                                        <input
                                          type="text"
                                          placeholder="Total: 0"
                                          value={propertyForm.washroomTotal || ''}
                                          onChange={(e) => handleNumericChange('washroomTotal', e.target.value)}
                                          className="w-full border p-3 rounded"
                                          required={field.required}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className={field.name === 'locationUrl' ? 'md:col-span-2' : ''}>
                                    <label className="block text-gray-700 mb-2">
                                      {field.label} {field.required && '*'}
                                    </label>
                                    {field.type === 'select' ? (
                                      <select
                                        value={propertyForm[field.name] || ''}
                                        onChange={(e) => setPropertyForm({...propertyForm, [field.name]: e.target.value})}
                                        className="w-full border p-3 rounded"
                                        required={field.required}
                                      >
                                        <option value="">Select {field.label}</option>
                                        {field.options.map((opt) => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                      </select>
                                    ) : field.type === 'url' ? (
                                      <input
                                        type="url"
                                        placeholder={field.placeholder}
                                        value={propertyForm[field.name] || ''}
                                        onChange={(e) => setPropertyForm({...propertyForm, [field.name]: e.target.value})}
                                        className="w-full border p-3 rounded"
                                        required={field.required}
                                      />
                                    ) : field.name.includes('Price') || field.name.includes('Area') || field.name.includes('acres') || field.name.includes('guntas') || field.name.includes('Floors') || field.name.includes('portions') || field.name.includes('bedrooms') || field.name.includes('washroom') || field.name.includes('Washroom') || field.name.includes('Parking') || field.name.includes('Age') || field.name.includes('age') ? (
                                      <input
                                        type="text"
                                        placeholder={field.placeholder}
                                        value={propertyForm[field.name] || ''}
                                        onChange={(e) => handleNumericChange(field.name, e.target.value)}
                                        className="w-full border p-3 rounded"
                                        required={field.required}
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        placeholder={field.placeholder} 
                                        value={propertyForm[field.name] || ''}
                                        onChange={(e) => setPropertyForm({...propertyForm, [field.name]: e.target.value})}
                                        className="w-full border p-3 rounded"
                                        required={field.required}
                                      />
                                    )}
                                  </div>
                                )}
                              </React.Fragment>
                            ))}
                          </>
                        )}

                        {/* Status dropdown */}
                        <div>
                          <label className="block text-gray-700 mb-2">Status</label>
                          <select 
                            value={propertyForm.status} 
                            onChange={(e) => setPropertyForm({...propertyForm, status: e.target.value})} 
                            className="w-full border p-3 rounded"
                          >
                            <option value="available">Available</option>
                            <option value="pending">Pending</option>
                            <option value="sold">Sold</option>
                          </select>
                        </div>
                      </div>
                      {/* Display Sections */}
                      <div>
                        <label className="block text-gray-700 mb-2">Display Sections (Select up to 3)</label>
                        <div className="flex gap-4">
                          {['featured', 'highlights', 'choice'].map(sec => (
                            <label key={sec} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={propertyForm.sections.includes(sec)}
                                onChange={(e) => {
                                  const newSections = e.target.checked
                                    ? [...propertyForm.sections, sec].slice(0, 3)
                                    : propertyForm.sections.filter(s => s !== sec);
                                  setPropertyForm({...propertyForm, sections: newSections});
                                }}
                                className="w-4 h-4"
                              />
                              <span className="capitalize">{sec === 'choice' ? 'Choice Property' : sec}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-gray-700 mb-2">Description *</label>
                        <textarea 
                          value={propertyForm.description} 
                          onChange={(e) => setPropertyForm({...propertyForm, description: e.target.value})} 
                          className="w-full border p-3 rounded" 
                          rows="4" 
                          required 
                          placeholder="Enter property description"
                        />
                      </div>

                      {/* Features */}
                      <div>
                        <label className="block text-gray-700 mb-2">Features (comma separated) *</label>
                        <input 
                          type="text" 
                          value={propertyForm.features} 
                          onChange={(e) => setPropertyForm({...propertyForm, features: e.target.value})} 
                          className="w-full border p-3 rounded" 
                          placeholder="e.g., Swimming Pool, Garden, Security"
                          required
                        />
                      </div>

                      {/* Property Images */}
                      <div>
                        <label className="block text-gray-700 mb-2">Property Images (Max 8 images) *</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                          className="w-full border p-3 rounded" 
                          disabled={uploading || propertyForm.images.length >= 8} 
                          required={propertyForm.images.length === 0} 
                        />
                        {uploading && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
                        {propertyForm.images.length >= 8 && <p className="text-sm text-red-600 mt-1">Maximum 8 images allowed</p>}
                        {propertyForm.images.length > 0 && (
                          <div className="grid grid-cols-4 gap-2 mt-3">
                            {propertyForm.images.map((img, idx) => (
                              <div key={idx} className="relative">
                                <img src={getImageUrl(img)} alt="Property" className="w-full h-20 object-cover rounded" />
                                <button type="button" onClick={() => removeImage(idx)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs">×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Property Video */}
                      <div>
                        <label className="block text-gray-700 mb-2">Property Video (Max 30 seconds, Optional)</label>
                        <input 
                          type="file" 
                          accept="video/*" 
                          onChange={handleVideoUpload} 
                          className="w-full border p-3 rounded" 
                          disabled={uploading} 
                        />
                        {uploading && <p className="text-sm text-blue-600 mt-1">Uploading video...</p>}
                        {propertyForm.video && (
                          <div className="mt-3 relative">
                            <video src={getImageUrl(propertyForm.video)} controls className="w-full max-h-60 rounded" />
                            <button type="button" onClick={() => setPropertyForm({...propertyForm, video: ''})} className="absolute top-2 right-2 bg-red-600 text-white rounded px-3 py-1 text-sm">Remove</button>
                          </div>
                        )}
                      </div>

                      {/* Property Location URL */}
                      <div>
                        <label className="block text-gray-700 mb-2">Property Location URL (Optional)</label>
                        <input 
                          type="url" 
                          value={propertyForm.locationUrl || ''} 
                          onChange={(e) => setPropertyForm({...propertyForm, locationUrl: e.target.value})} 
                          className="w-full border p-3 rounded" 
                          placeholder="https://maps.google.com/..." 
                        />
                        <p className="text-sm text-gray-500 mt-1">Add Google Maps link or any location URL for this property</p>
                      </div>

                      {/* Submit buttons */}
                      <div className="flex gap-2">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition">
                          {editingProperty ? 'Update' : 'Add'} Property
                        </button>
                        <button type="button" onClick={() => { setShowPropertyForm(false); setEditingProperty(null); }} className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Property ID</th>
                    <th className="px-6 py-4 text-left font-semibold">Title</th>
                    <th className="px-6 py-4 text-left font-semibold">Category</th>
                    <th className="px-6 py-4 text-left font-semibold">Price</th>
                    <th className="px-6 py-4 text-left font-semibold">Location</th>
                    <th className="px-6 py-4 text-left font-semibold">Section</th>
                    <th className="px-6 py-4 text-left font-semibold">Status</th>
                    <th className="px-6 py-4 text-left font-semibold">Created</th>
                    <th className="px-6 py-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map(property => {
                    const expiryDate = property.expiryDate ? new Date(property.expiryDate) : null;
                    const isExpired = expiryDate && expiryDate < new Date();
                    const daysLeft = expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
                    return (
                    <tr key={property._id} className="border-b hover:bg-blue-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
                          {property.propertyCode || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">{property.title}</td>
                      <td className="px-6 py-4 text-gray-700">{property.category}</td>
                      <td className="px-6 py-4 text-gray-700 font-semibold">₹{property.price}</td>
                      <td className="px-6 py-4 text-gray-700">{property.location}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(property.sections && property.sections.length > 0 ? property.sections : [property.section || 'featured']).map((sec, i) => (
                            <span key={i} className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                              {sec === 'choice' ? 'Choice' : sec === 'highlights' ? 'Highlights' : 'Featured'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${property.status === 'available' ? 'bg-green-100 text-green-800' : property.status === 'sold' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{property.status}</span></td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600">
                          {new Date(property.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(property.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleEditProperty(property)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-2 rounded-full transition mr-2" title="Edit">
                          <FaEdit size={18} />
                        </button>
                        <button onClick={() => handleDeleteProperty(property._id)} className="text-red-600 hover:text-red-800 hover:bg-red-100 p-2 rounded-full transition" title="Delete">
                          <FaTrash size={18} />
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'userSubmissions' && (
          <UserSubmissions 
            onEditProperty={(formData, submission) => {
              setEditingProperty(submission);
              setPropertyForm(formData);
              setShowPropertyForm(true);
            }}
            onSwitchToProperties={() => setActiveTab('properties')}
            showToast={showToast}
          />
        )}

        {activeTab === 'gallery' && (
          <div>
            <div className="space-y-4 mb-4">
              {/* Gallery Section Control */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800">Gallery Section Control</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      {galleryEnabled 
                        ? 'Gallery section is currently visible in the public portal' 
                        : 'Gallery section is currently hidden from the public portal'}
                    </p>
                  </div>
                  <button 
                    onClick={handleToggleGallerySection}
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                      galleryEnabled 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {galleryEnabled ? 'Disable Gallery' : 'Enable Gallery'}
                  </button>
                </div>
              </div>

              {/* Map Section Control */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800">Footer Map Control</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      {mapEnabled 
                        ? 'Map section is currently visible in the footer' 
                        : 'Map section is currently hidden from the footer'}
                    </p>
                  </div>
                  <button 
                    onClick={handleToggleMapSection}
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                      mapEnabled 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {mapEnabled ? 'Disable Map' : 'Enable Map'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Manage Gallery</h2>
              <button onClick={() => { setShowGalleryForm(true); setEditingGallery(null); setGalleryForm({ title: '', category: '', image: '', description: '' }); }} className="bg-green-600 text-white px-4 py-2 rounded">
                Add Gallery Item
              </button>
            </div>

            {showGalleryForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
                  <div className="border-b px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold">{editingGallery ? 'Edit' : 'Add'} Gallery Item</h3>
                    <button onClick={() => { setShowGalleryForm(false); setEditingGallery(null); }} className="text-gray-500 hover:text-gray-700 text-2xl"><FaTimes /></button>
                  </div>
                  <form onSubmit={handleGallerySubmit} className="p-6 space-y-4">
                    <input type="text" placeholder="Title" value={galleryForm.title} onChange={(e) => setGalleryForm({...galleryForm, title: e.target.value})} className="w-full border p-2 rounded" required />
                    <select value={galleryForm.category} onChange={(e) => setGalleryForm({...galleryForm, category: e.target.value})} className="w-full border p-2 rounded" required>
                      <option value="">Select Category</option>
                      <option value="Land">Land</option>
                      <option value="House">House</option>
                      <option value="Plot">Plot</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Farmhouse">Farmhouse</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                    <div>
                      <label className="block text-sm mb-1">Image</label>
                      <input type="file" accept="image/*" onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('image', file);
                        setUploading(true);
                        try {
                          const token = localStorage.getItem('token');
                          const res = await fetch(`${API_URL}/api/upload`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                            body: formData
                          });
                          const data = await res.json();
                          if (res.ok) setGalleryForm({...galleryForm, image: data.url});
                        } finally {
                          setUploading(false);
                          e.target.value = '';
                        }
                      }} className="w-full border p-2 rounded" disabled={uploading} />
                      {uploading && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
                      {galleryForm.image && <img src={getImageUrl(galleryForm.image)} alt="Preview" className="mt-2 h-32 object-cover rounded" onError={(e) => e.target.src = 'https://via.placeholder.com/200x200?text=No+Image'} />}
                    </div>
                    <textarea placeholder="Description (optional)" value={galleryForm.description} onChange={(e) => setGalleryForm({...galleryForm, description: e.target.value})} className="w-full border p-2 rounded" rows="3" />
                    <div className="flex gap-2">
                      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Save</button>
                      <button type="button" onClick={() => { setShowGalleryForm(false); setEditingGallery(null); }} className="bg-gray-400 text-white px-6 py-2 rounded">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Image</th>
                    <th className="px-6 py-4 text-left">Title</th>
                    <th className="px-6 py-4 text-left">Category</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {gallery.map(item => (
                    <tr key={item._id} className="border-b hover:bg-blue-50">
                      <td className="px-6 py-4"><img src={getImageUrl(item.image)} alt={item.title} className="h-16 w-16 object-cover rounded" onError={(e) => e.target.src = 'https://via.placeholder.com/200x200?text=No+Image'} /></td>
                      <td className="px-6 py-4 font-medium">{item.title}</td>
                      <td className="px-6 py-4">{item.category}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => { setEditingGallery(item); setGalleryForm(item); setShowGalleryForm(true); }} className="text-blue-600 hover:bg-blue-100 p-2 rounded mr-2"><FaEdit /></button>
                        <button onClick={() => handleDeleteGallery(item._id)} className="text-red-600 hover:bg-red-100 p-2 rounded"><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'buysell' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Manage Buy/Sell</h2>
              <button onClick={() => { setShowBuySellForm(true); setEditingBuySell(null); setBuySellForm({ title: '', location: '', price: '', area: '', type: 'sale', date: '', image: '' }); }} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Add Item
              </button>
            </div>

            {showBuySellForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
                  <div className="border-b px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold">{editingBuySell ? 'Edit' : 'Add'} Buy/Sell Item</h3>
                    <button onClick={() => { setShowBuySellForm(false); setEditingBuySell(null); }} className="text-gray-500 hover:text-gray-700 text-2xl"><FaTimes /></button>
                  </div>
                  <form onSubmit={handleBuySellSubmit} className="p-6 space-y-4">
                    <input type="text" placeholder="Title" value={buySellForm.title} onChange={(e) => setBuySellForm({...buySellForm, title: e.target.value})} className="w-full border p-2 rounded" required />
                    <select value={buySellForm.location} onChange={(e) => setBuySellForm({...buySellForm, location: e.target.value})} className="w-full border p-2 rounded" required>
                      <option value="">Select Location</option>
                      {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                    <input type="number" inputMode="numeric" placeholder="Price" value={buySellForm.price} onChange={(e) => setBuySellForm({...buySellForm, price: e.target.value})} className="w-full border p-2 rounded" required />
                    <input type="number" inputMode="numeric" placeholder="Area (sq.ft)" value={buySellForm.area} onChange={(e) => setBuySellForm({...buySellForm, area: e.target.value})} className="w-full border p-2 rounded" required />
                    <select value={buySellForm.type} onChange={(e) => setBuySellForm({...buySellForm, type: e.target.value})} className="w-full border p-2 rounded" required>
                      <option value="sale">Sale</option>
                      <option value="buy">Buy</option>
                    </select>
                    <input type="date" placeholder="Date" value={buySellForm.date} onChange={(e) => setBuySellForm({...buySellForm, date: e.target.value})} className="w-full border p-2 rounded" required />
                    <div>
                      <label className="block text-sm mb-1">Image</label>
                      <input type="file" accept="image/*" onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('image', file);
                        setUploading(true);
                        try {
                          const token = localStorage.getItem('token');
                          const res = await fetch(`${API_URL}/api/upload`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                            body: formData
                          });
                          const data = await res.json();
                          if (res.ok) setBuySellForm({...buySellForm, image: data.url});
                        } finally {
                          setUploading(false);
                          e.target.value = '';
                        }
                      }} className="w-full border p-2 rounded" disabled={uploading} />
                      {uploading && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
                      {buySellForm.image && <img src={getImageUrl(buySellForm.image)} alt="Preview" className="mt-2 h-32 object-cover rounded" onError={(e) => e.target.src = 'https://via.placeholder.com/200x200?text=No+Image'} />}
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Save</button>
                      <button type="button" onClick={() => { setShowBuySellForm(false); setEditingBuySell(null); }} className="bg-gray-400 text-white px-6 py-2 rounded">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Image</th>
                    <th className="px-6 py-4 text-left">Title</th>
                    <th className="px-6 py-4 text-left">Location</th>
                    <th className="px-6 py-4 text-left">Price</th>
                    <th className="px-6 py-4 text-left">Type</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {buySell.map(item => (
                    <tr key={item._id} className="border-b hover:bg-blue-50">
                      <td className="px-6 py-4"><img src={getImageUrl(item.image)} alt={item.title} className="h-16 w-16 object-cover rounded" onError={(e) => e.target.src = 'https://via.placeholder.com/200x200?text=No+Image'} /></td>
                      <td className="px-6 py-4 font-medium">{item.title}</td>
                      <td className="px-6 py-4">{item.location}</td>
                      <td className="px-6 py-4">₹{item.price}</td>
                      <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${(item.type === 'sold' || item.type === 'sale') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{(item.type === 'sold' || item.type === 'sale') ? 'Sale' : 'Buy'}</span></td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => { setEditingBuySell(item); setBuySellForm(item); setShowBuySellForm(true); }} className="text-blue-600 hover:bg-blue-100 p-2 rounded mr-2"><FaEdit /></button>
                        <button onClick={() => handleDeleteBuySell(item._id)} className="text-red-600 hover:bg-red-100 p-2 rounded"><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'testimonials' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Manage Testimonials</h2>
              <button onClick={() => { setShowTestimonialForm(true); setEditingTestimonial(null); setTestimonialForm({ name: '', role: '', text: '', rating: 5, image: '' }); }} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Add Testimonial
              </button>
            </div>

            {showTestimonialForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
                  <div className="border-b px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold">{editingTestimonial ? 'Edit' : 'Add'} Testimonial</h3>
                    <button onClick={() => { setShowTestimonialForm(false); setEditingTestimonial(null); }} className="text-gray-500 hover:text-gray-700 text-2xl"><FaTimes /></button>
                  </div>
                  <form onSubmit={handleTestimonialSubmit} className="p-6 space-y-4">
                    <input type="text" placeholder="Customer Name" value={testimonialForm.name} onChange={(e) => setTestimonialForm({...testimonialForm, name: e.target.value})} className="w-full border p-2 rounded" required />
                    <input type="text" placeholder="Role (e.g., Villa Owner)" value={testimonialForm.role} onChange={(e) => setTestimonialForm({...testimonialForm, role: e.target.value})} className="w-full border p-2 rounded" required />
                    <textarea placeholder="Testimonial Text" value={testimonialForm.text} onChange={(e) => setTestimonialForm({...testimonialForm, text: e.target.value})} className="w-full border p-2 rounded" rows="4" required />
                    <select value={testimonialForm.rating} onChange={(e) => setTestimonialForm({...testimonialForm, rating: Number(e.target.value)})} className="w-full border p-2 rounded" required>
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="2">2 Stars</option>
                      <option value="1">1 Star</option>
                    </select>
                    <div>
                      <label className="block text-sm mb-1">Customer Image</label>
                      <input type="file" accept="image/*" onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('image', file);
                        setUploading(true);
                        try {
                          const token = localStorage.getItem('token');
                          const res = await fetch(`${API_URL}/api/upload`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                            body: formData
                          });
                          const data = await res.json();
                          if (res.ok) setTestimonialForm({...testimonialForm, image: data.url});
                        } finally {
                          setUploading(false);
                          e.target.value = '';
                        }
                      }} className="w-full border p-2 rounded" disabled={uploading} />
                      {uploading && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
                      {testimonialForm.image && <img src={getImageUrl(testimonialForm.image)} alt="Preview" className="mt-2 h-20 w-20 rounded-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/200x200?text=No+Image'} />}
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Save</button>
                      <button type="button" onClick={() => { setShowTestimonialForm(false); setEditingTestimonial(null); }} className="bg-gray-400 text-white px-6 py-2 rounded">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Image</th>
                    <th className="px-6 py-4 text-left">Name</th>
                    <th className="px-6 py-4 text-left">Role</th>
                    <th className="px-6 py-4 text-left">Rating</th>
                    <th className="px-6 py-4 text-left">Testimonial</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.map(item => (
                    <tr key={item._id} className="border-b hover:bg-blue-50">
                      <td className="px-6 py-4"><img src={getImageUrl(item.image)} alt={item.name} className="h-12 w-12 rounded-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/200x200?text=No+Image'} /></td>
                      <td className="px-6 py-4 font-medium">{item.name}</td>
                      <td className="px-6 py-4">{item.role}</td>
                      <td className="px-6 py-4">{[...Array(item.rating)].map((_, i) => <span key={i} className="text-yellow-400">★</span>)}</td>
                      <td className="px-6 py-4 max-w-xs truncate">{item.text}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => { setEditingTestimonial(item); setTestimonialForm(item); setShowTestimonialForm(true); }} className="text-blue-600 hover:bg-blue-100 p-2 rounded mr-2"><FaEdit /></button>
                        <button onClick={() => handleDeleteTestimonial(item._id)} className="text-red-600 hover:bg-red-100 p-2 rounded"><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'locations' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Manage Locations</h2>
              <button onClick={() => { setShowLocationForm(true); setEditingLocation(null); setLocationForm({ coordinates: '', propertyId: '', description: '' }); }} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Add Location
              </button>
            </div>

            {showLocationForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
                  <div className="border-b px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold">{editingLocation ? 'Edit' : 'Add'} Location</h3>
                    <button onClick={() => { setShowLocationForm(false); setEditingLocation(null); }} className="text-gray-500 hover:text-gray-700 text-2xl"><FaTimes /></button>
                  </div>
                  <form onSubmit={handleLocationSubmit} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Property Location Link (Coordinates)</label>
                      <input 
                        type="text" 
                        placeholder="e.g., 16°54'38.2&quot;N 78°08'05.9&quot;E or 16.5438, 78.0809" 
                        value={locationForm.coordinates} 
                        onChange={(e) => setLocationForm({...locationForm, coordinates: e.target.value})} 
                        className="w-full border p-3 rounded" 
                        required 
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter coordinates in any format (DMS or decimal)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Link to Property (Optional)</label>
                      <select 
                        value={locationForm.propertyId} 
                        onChange={(e) => setLocationForm({...locationForm, propertyId: e.target.value})} 
                        className="w-full border p-3 rounded"
                      >
                        <option value="">Select Property (Optional)</option>
                        {properties.map(prop => (
                          <option key={prop._id} value={prop._id}>{prop.title} - {prop.location}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                      <textarea 
                        placeholder="Additional location details" 
                        value={locationForm.description} 
                        onChange={(e) => setLocationForm({...locationForm, description: e.target.value})} 
                        className="w-full border p-3 rounded" 
                        rows="3"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Save</button>
                      <button type="button" onClick={() => { setShowLocationForm(false); setEditingLocation(null); }} className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500">Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Property Location Link</th>
                    <th className="px-6 py-4 text-center">Copy Element</th>
                    <th className="px-6 py-4 text-center">Google Map Direction</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyLocations.map(location => (
                    <tr key={location._id} className="border-b hover:bg-blue-50">
                      <td className="px-6 py-4 font-mono text-sm">{location.coordinates}</td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => copyToClipboard(location.coordinates)} 
                          className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 text-sm font-medium"
                        >
                          Copy Element
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => openGoogleMaps(location.latitude, location.longitude)} 
                          className="bg-green-100 text-green-700 px-4 py-2 rounded hover:bg-green-200 inline-flex items-center gap-2"
                          disabled={!location.latitude || !location.longitude}
                        >
                          <span className="text-2xl">📍</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => { setEditingLocation(location); setLocationForm(location); setShowLocationForm(true); }} className="text-blue-600 hover:bg-blue-100 p-2 rounded mr-2"><FaEdit /></button>
                        <button onClick={() => handleDeleteLocation(location._id)} className="text-red-600 hover:bg-red-100 p-2 rounded"><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'posters' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Manage Announcement Marquee</h2>
              <button 
                onClick={() => { 
                  setShowPosterForm(true); 
                  setEditingPoster(null); 
                  const today = new Date().toISOString().split('T')[0];
                  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                  setPosterForm({ title: '', image: '', startDate: today, endDate: nextWeek, isActive: true }); 
                }} 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Add Announcement
              </button>
            </div>

            {showPosterForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl my-8">
                  <div className="border-b px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold">{editingPoster ? 'Edit' : 'Add'} Announcement</h3>
                    <button onClick={() => { setShowPosterForm(false); setEditingPoster(null); }} className="text-gray-500 hover:text-gray-700 text-2xl"><FaTimes /></button>
                  </div>
                  <form onSubmit={handlePosterSubmit} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Announcement Text *</label>
                      <input
                        type="text"
                        value={posterForm.title}
                        onChange={(e) => setPosterForm({...posterForm, title: e.target.value})}
                        required
                        className="w-full px-4 py-2 border rounded"
                        placeholder="Example: Mega offer this weekend at Shadnagar open plots..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Start Date *</label>
                        <input type="date" value={posterForm.startDate} onChange={(e) => setPosterForm({...posterForm, startDate: e.target.value})} required className="w-full px-4 py-2 border rounded" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">End Date *</label>
                        <input type="date" value={posterForm.endDate} onChange={(e) => setPosterForm({...posterForm, endDate: e.target.value})} required className="w-full px-4 py-2 border rounded" />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                        {editingPoster ? 'Update' : 'Add'} Announcement
                      </button>
                      <button type="button" onClick={() => { setShowPosterForm(false); setEditingPoster(null); }} className="px-6 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Announcement Text</th>
                    <th className="px-6 py-4 text-left">Duration</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posters.map(poster => (
                    <tr key={poster._id} className={`border-b hover:bg-blue-50 ${isPosterExpired(poster.endDate) ? 'bg-red-50' : isPosterActive(poster) ? 'bg-green-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="font-semibold">{poster.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div>Start: {new Date(poster.startDate).toLocaleDateString()}</div>
                          <div>End: {new Date(poster.endDate).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isPosterExpired(poster.endDate) ? (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Expired</span>
                        ) : isPosterActive(poster) ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Scheduled</span>
                        )}
                        <div className="mt-1">
                          <button 
                            onClick={() => handleTogglePoster(poster._id)} 
                            className={`text-xs px-2 py-1 rounded ${poster.isActive ? 'bg-gray-200 text-gray-700' : 'bg-green-200 text-green-700'}`}
                          >
                            {poster.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => { 
                            setEditingPoster(poster); 
                            setPosterForm({
                              title: poster.title,
                              image: poster.image,
                              startDate: poster.startDate.split('T')[0],
                              endDate: poster.endDate.split('T')[0],
                              isActive: poster.isActive
                            }); 
                            setShowPosterForm(true); 
                          }} 
                          className="text-blue-600 hover:bg-blue-100 p-2 rounded mr-2"
                        >
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDeletePoster(poster._id)} className="text-red-600 hover:bg-red-100 p-2 rounded"><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {posters.length === 0 && (
                <div className="text-center py-8 text-gray-500">No announcements yet. Add your first marquee text!</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'schedules' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Manage Schedules</h2>
              <button 
                onClick={() => {
                  const csvContent = [
                    ['Property ID', 'Property', 'Customer', 'Email', 'Phone', 'Date', 'Time', 'Status', 'Message'],
                    ...schedules.map(s => [
                      s.propertyCode || 'N/A',
                      s.propertyTitle,
                      s.name,
                      s.email,
                      s.phone,
                      s.date,
                      s.time,
                      s.status,
                      s.message || ''
                    ])
                  ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `schedules_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
              >
                📥 Download Report
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Property ID</th>
                    <th className="px-6 py-4 text-left font-semibold">Property</th>
                    <th className="px-6 py-4 text-left font-semibold">Customer</th>
                    <th className="px-6 py-4 text-left font-semibold">Contact</th>
                    <th className="px-6 py-4 text-left font-semibold">Date & Time</th>
                    <th className="px-6 py-4 text-left font-semibold">Status</th>
                    <th className="px-6 py-4 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map(schedule => (
                    <tr key={schedule._id} className="border-b hover:bg-blue-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
                          {schedule.propertyCode || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">{schedule.propertyTitle}</td>
                      <td className="px-6 py-4 text-gray-700">{schedule.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <a href={`tel:${schedule.phone}`} className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                              📞 {schedule.phone}
                            </a>
                            <span className="text-sm text-gray-500 block mt-1">{schedule.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{schedule.date} {schedule.time}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${schedule.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : schedule.status === 'approved' ? 'bg-blue-100 text-blue-800' : schedule.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {schedule.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {schedule.status === 'pending' && (
                          <button onClick={() => handleScheduleStatus(schedule._id, 'approved')} className="text-blue-600 hover:bg-blue-100 px-3 py-1 rounded transition mr-2">Approve</button>
                        )}
                        {schedule.status === 'approved' && (
                          <button onClick={() => handleScheduleStatus(schedule._id, 'completed')} className="text-green-600 hover:bg-green-100 px-3 py-1 rounded transition mr-2">Complete</button>
                        )}
                        <button onClick={() => handleScheduleStatus(schedule._id, 'cancelled')} className="text-red-600 hover:bg-red-100 px-3 py-1 rounded transition">Cancel</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'soldProperties' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Sold Properties (90-Day Confirmation)</h2>
              <button 
                onClick={() => {
                  const csvContent = [
                    ['Seller Name', 'Mobile Number', 'Property ID', 'Confirmed Date', 'Days Active'],
                    ...soldProperties.map(sp => [
                      sp.sellerName || sp.username,
                      sp.mobileNumber,
                      sp.propertyId || 'N/A',
                      new Date(sp.availabilityConfirmedAt).toLocaleDateString(),
                      Math.floor((new Date(sp.availabilityConfirmedAt) - new Date(sp.chatStartedAt)) / (1000 * 60 * 60 * 24))
                    ])
                  ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `sold_properties_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
              >
                📥 Download Report
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Seller Name</th>
                    <th className="px-6 py-4 text-left font-semibold">Mobile Number</th>
                    <th className="px-6 py-4 text-left font-semibold">Property ID</th>
                    <th className="px-6 py-4 text-left font-semibold">Chat Started</th>
                    <th className="px-6 py-4 text-left font-semibold">Confirmed Date</th>
                    <th className="px-6 py-4 text-left font-semibold">Days Active</th>
                  </tr>
                </thead>
                <tbody>
                  {soldProperties.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        No sold properties yet. Properties marked as sold after 90-day confirmation will appear here.
                      </td>
                    </tr>
                  ) : (
                    soldProperties.map(sp => {
                      const daysActive = Math.floor((new Date(sp.availabilityConfirmedAt) - new Date(sp.chatStartedAt)) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={sp._id} className="border-b hover:bg-red-50 transition-colors duration-200">
                          <td className="px-6 py-4 font-medium">{sp.sellerName || sp.username}</td>
                          <td className="px-6 py-4">
                            <a href={`tel:${sp.mobileNumber}`} className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                              📞 {sp.mobileNumber}
                            </a>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
                              {sp.propertyId || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {new Date(sp.chatStartedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {new Date(sp.availabilityConfirmedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                              {daysActive} days
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
