// Property fields configuration for each property type
// This defines the dynamic fields that should be shown based on the property category

export const PROPERTY_FIELDS_CONFIG = {
  'Agricultural Land': {
    fields: [
      { name: 'acres', label: 'Acres', type: 'text', placeholder: 'Enter acres', required: true },
      { name: 'guntas', label: 'Guntas', type: 'text', placeholder: 'Enter guntas', required: true },
      { name: 'expectedPrice', label: 'Expected Price', type: 'text', placeholder: '₹ 0,00,000', required: true },
      { name: 'propertyFacing', label: 'Property Facing', type: 'select', options: ['East', 'West', 'North', 'South', 'Corner'], required: true },
      { name: 'roadType', label: 'Road Type', type: 'select', options: ['Highway', 'BT Road', 'Matti Road'], required: true },
      { name: 'road', label: 'Road', type: 'text', placeholder: 'Enter road details', required: true },
      { name: 'propertyUnder', label: 'Property Under', type: 'select', options: ['GHMC', 'Municipal Corporation', 'Municipality', 'Gram Panchayat'], required: true },
      { name: 'boundaryType', label: 'Boundary Type', type: 'select', options: ['Compound Wall', 'Precast Compound', 'Fencing', 'Open'], required: true },
      { name: 'bore', label: 'Bore', type: 'text', placeholder: 'Enter bore details', required: true },
      { name: 'anyPTCase', label: 'Any PT Case', type: 'select', options: ['Yes', 'No'], required: true },
      { name: 'propertyLocation', label: 'Property Location', type: 'text', placeholder: 'Enter property location', required: true },
      { name: 'revenueRegistration/subRegister', label: 'Revenue Registration / Sub-Register', type: 'text', placeholder: 'Enter revenue registration', required: true },
      { name: 'propertyCity', label: 'Property City', type: 'text', placeholder: 'Enter city', required: true },
      { name: 'district', label: 'District', type: 'text', placeholder: 'Enter district', required: true },
      { name: 'state', label: 'State', type: 'text', placeholder: 'Enter state', required: true },
      { name: 'locationUrl', label: 'Property Location URL (Optional)', type: 'url', placeholder: 'https://maps.google.com/...', required: false }
    ],
    hasImages: true,
    maxImages: 8,
    hasVideo: true,
    maxVideoDuration: 30
  },
  'Independent House': {
    fields: [
      { name: 'plotAreaSqYards', label: 'Plot Area (Sq Yards)', type: 'text', placeholder: 'Enter plot area in sq yards', required: true },
      { name: 'totalFloors', label: 'Total Floors', type: 'text', placeholder: 'Enter total floors', required: true },
      { name: 'portions', label: 'Portions', type: 'text', placeholder: 'Enter portions', required: true },
      { name: 'bedrooms', label: 'Bedrooms', type: 'text', placeholder: '0', required: true },
      { name: 'washrooms', label: 'Washrooms', type: 'text', placeholder: '0', required: true },
      { name: 'furnishingStatus', label: 'Furnishing Status', type: 'select', options: ['Fully Furnished', 'Semi-Furnished', 'Unfurnished'], required: true },
      { name: 'buildingAge', label: 'Building Age', type: 'text', placeholder: 'Enter building age (years)', required: true },
      { name: 'parkingDetails', label: 'Parking Details', type: 'select', options: ['Public', 'Reserved'], required: true },
      { name: 'numberOfCarParkings', label: 'Number of Car Parkings', type: 'text', placeholder: '0', required: true },
      { name: 'expectedPrice', label: 'Expected Price', type: 'text', placeholder: '₹ 0,00,000', required: true },
      { name: 'bore', label: 'Bore', type: 'text', placeholder: 'Enter bore details', required: true },
      { name: 'roadType', label: 'Road Type', type: 'select', options: ['Highway-Commercial', 'Semi Commercial', 'Residential'], required: true },
      { name: 'road', label: 'Road', type: 'text', placeholder: 'Enter road details', required: true },
      { name: 'propertyUnder', label: 'Property Under', type: 'select', options: ['GHMC', 'Municipal Corporation', 'Municipality', 'Gram Panchayat'], required: true },
      { name: 'propertyFacing', label: 'Property Facing', type: 'select', options: ['East', 'West', 'North', 'South', 'Corner'], required: true },
      { name: 'propertyLocation', label: 'Property Location', type: 'text', placeholder: 'Enter property location', required: true },
      { name: 'district', label: 'District', type: 'text', placeholder: 'Enter district', required: true },
      { name: 'state', label: 'State', type: 'text', placeholder: 'Enter state', required: true },
      { name: 'locationUrl', label: 'Property Location URL (Optional)', type: 'url', placeholder: 'https://maps.google.com/...', required: false }
    ],
    hasImages: true,
    maxImages: 8,
    hasVideo: true,
    maxVideoDuration: 30
  },
  'Apartment': {
    fields: [
      { name: 'flatType', label: 'Flat Type', type: 'select', options: ['Single Bedroom', 'Double Bedroom', 'Triple Bedroom'], required: true },
      { name: 'buildupArea', label: 'Buildup Area', type: 'text', placeholder: 'Enter buildup area (sq ft)', required: true },
      { name: 'expectedPrice', label: 'Expected Price', type: 'text', placeholder: '₹ 0,00,000', required: true },
      { name: 'floorDetails', label: 'Floor Details', type: 'text', placeholder: 'Enter floor details', required: true },
      { name: 'propertyAge', label: 'Property Age', type: 'text', placeholder: 'Enter property age (years)', required: true },
      { name: 'furnishingStatus', label: 'Furnishing Status', type: 'select', options: ['Fully Furnished', 'Semi-Furnished', 'Unfurnished'], required: true },
      { name: 'washroomDetails', label: 'Washroom Details', type: 'washroom-group', required: true },
      { name: 'parkingDetails', label: 'Parking Details', type: 'text', placeholder: 'Enter parking details', required: true },
      { name: 'numberOfCarParking', label: 'Number of Car Parking', type: 'text', placeholder: '0', required: true },
      { name: 'roadType', label: 'Road Type', type: 'select', options: ['Highway', 'Commercial', 'Semi-Commercial', 'Residential'], required: true },
      { name: 'road', label: 'Road', type: 'text', placeholder: 'Enter road details', required: true },
      { name: 'propertyUnder', label: 'Property Under', type: 'select', options: ['GHMC', 'Municipal Corporation', 'Municipality', 'Gram Panchayat'], required: true },
      { name: 'propertyFacing', label: 'Property Facing', type: 'select', options: ['East', 'West', 'North', 'South', 'Corner'], required: true },
      { name: 'propertyLocation', label: 'Property Location', type: 'text', placeholder: 'Enter property location', required: true },
      { name: 'revenueRegistration/subRegister', label: 'Revenue Registration / Sub-Register', type: 'text', placeholder: 'Enter revenue registration', required: true },
      { name: 'propertyCity', label: 'Property City', type: 'text', placeholder: 'Enter city', required: true },
      { name: 'district', label: 'District', type: 'text', placeholder: 'Enter district', required: true },
      { name: 'state', label: 'State', type: 'text', placeholder: 'Enter state', required: true },
      { name: 'locationUrl', label: 'Property Location URL (Optional)', type: 'url', placeholder: 'https://maps.google.com/...', required: false }
    ],
    hasImages: true,
    maxImages: 8,
    hasVideo: true,
    maxVideoDuration: 30
  },
  'Open Plot': {
    fields: [
      { name: 'plotArea', label: 'Plot Area', type: 'text', placeholder: 'Enter plot area', required: true },
      { name: 'expectedPrice', label: 'Expected Price', type: 'text', placeholder: '₹ 0,00,000', required: true },
      { name: 'bore', label: 'Bore', type: 'text', placeholder: 'Enter bore details', required: true },
      { name: 'roadType', label: 'Road Type', type: 'select', options: ['Highway', 'Commercial', 'Semi-Commercial', 'Residential'], required: true },
      { name: 'road', label: 'Road', type: 'text', placeholder: 'Enter road details', required: true },
      { name: 'propertyUnder', label: 'Property Under', type: 'select', options: ['GHMC', 'Municipal Corporation', 'Municipality', 'Gram Panchayat'], required: true },
      { name: 'propertyFacing', label: 'Property Facing', type: 'select', options: ['East', 'West', 'North', 'South', 'Corner'], required: true },
      { name: 'propertyLocation', label: 'Property Location', type: 'text', placeholder: 'Enter property location', required: true },
      { name: 'revenueRegistration/subRegister', label: 'Revenue Registration / Sub-Register', type: 'text', placeholder: 'Enter revenue registration', required: true },
      { name: 'propertyCity', label: 'Property City', type: 'text', placeholder: 'Enter city', required: true },
      { name: 'district', label: 'District', type: 'text', placeholder: 'Enter district', required: true },
      { name: 'state', label: 'State', type: 'text', placeholder: 'Enter state', required: true },
      { name: 'locationUrl', label: 'Property Location URL (Optional)', type: 'url', placeholder: 'https://maps.google.com/...', required: false }
    ],
    hasImages: true,
    maxImages: 8,
    hasVideo: true,
    maxVideoDuration: 30
  },
  'Farmhouse': {
    fields: [
      { name: 'farmhouseAreaAcres', label: 'Farmhouse Area (Acres)', type: 'text', placeholder: 'Enter farmhouse area in acres', required: true },
      { name: 'guntas', label: 'Guntas', type: 'text', placeholder: 'Enter guntas', required: true },
      { name: 'expectedPrice', label: 'Expected Price', type: 'text', placeholder: '₹ 0,00,000', required: true },
      { name: 'roadType', label: 'Road Type', type: 'select', options: ['highway', 'bt road', 'matti road'], required: true },
      { name: 'road', label: 'Road', type: 'text', placeholder: 'Enter road details', required: true },
      { name: 'propertyUnder', label: 'Property Under', type: 'select', options: ['GHMC', 'Municipal Corporation', 'Municipality', 'Gram Panchayat'], required: true },
      { name: 'propertyFacing', label: 'Property Facing', type: 'select', options: ['East', 'West', 'North', 'South', 'Corner'], required: true },
      { name: 'boundaryType', label: 'Boundary Type', type: 'select', options: ['Compound Wall', 'Fencing', 'Precast Wall', 'Open'], required: true },
      { name: 'anyPTCase', label: 'Any PT Case', type: 'select', options: ['Yes', 'No'], required: true },
      { name: 'bore', label: 'Bore', type: 'select', options: ['Yes', 'No'], required: true },
      { name: 'swimmingPool', label: 'Swimming Pool', type: 'select', options: ['Yes', 'No'], required: true },
      { name: 'anyConstruction', label: 'Any Construction', type: 'select', options: ['Yes', 'No'], required: true },
      { name: 'washroomDetails', label: 'Washroom Details', type: 'washroom-group', required: true },
      { name: 'garden', label: 'Garden', type: 'select', options: ['Yes', 'No'], required: true },
      { name: 'propertyLocation', label: 'Property Location', type: 'text', placeholder: 'Enter property location', required: true },
      { name: 'revenueRegistration/subRegister', label: 'Revenue Registration / Sub-Register', type: 'text', placeholder: 'Enter revenue registration', required: true },
      { name: 'propertyCity', label: 'Property City', type: 'text', placeholder: 'Enter city', required: true },
      { name: 'district', label: 'District', type: 'text', placeholder: 'Enter district', required: true },
      { name: 'state', label: 'State', type: 'text', placeholder: 'Enter state', required: true },
      { name: 'locationUrl', label: 'Property Location URL (Optional)', type: 'url', placeholder: 'https://maps.google.com/...', required: false }
    ],
    hasImages: true,
    maxImages: 8,
    hasVideo: true,
    maxVideoDuration: 30
  },
  'Commercial Space': {
    fields: [
      { name: 'commercialPropertyType', label: 'Commercial Property Type', type: 'select', options: ['Office/Commercial Space', 'Commercial Open Space'], required: true },
      { name: 'transactionType', label: 'Transaction Type', type: 'select', options: ['Rent', 'Lease', 'Sale'], required: true },
      { name: 'roadType', label: 'Road Type', type: 'select', options: ['highway', 'commercial', 'semi commercial', 'residential'], required: true },
      { name: 'road', label: 'Road', type: 'text', placeholder: 'Enter road details', required: true },
      { name: 'propertyUnder', label: 'Property Under', type: 'select', options: ['GHMC', 'Municipal Corporation', 'Municipality', 'Gram Panchayat'], required: true },
      { name: 'propertyFacing', label: 'Property Facing', type: 'select', options: ['East', 'West', 'North', 'South', 'Corner'], required: true },
      { name: 'propertyLocation', label: 'Property Location', type: 'text', placeholder: 'Enter property location', required: true },
      { name: 'revenueRegistration/subRegister', label: 'Revenue Registration / Sub-Register', type: 'text', placeholder: 'Enter revenue registration', required: true },
      { name: 'propertyCity', label: 'Property City', type: 'text', placeholder: 'Enter city', required: true },
      { name: 'district', label: 'District', type: 'text', placeholder: 'Enter district', required: true },
      { name: 'state', label: 'State', type: 'text', placeholder: 'Enter state', required: true },
      { name: 'locationUrl', label: 'Property Location URL (Optional)', type: 'url', placeholder: 'https://maps.google.com/...', required: false }
    ],
    hasImages: true,
    maxImages: 8,
    hasVideo: true,
    maxVideoDuration: 30
  },
  'Office Space': {
    // Office Space has its own specific fields (already implemented)
    fields: [],
    hasImages: true,
    maxImages: 8,
    hasVideo: true,
    maxVideoDuration: 30,
    isCustom: true // Uses existing custom implementation
  }
};

// Helper function to get all field names for a category
export const getFieldNamesForCategory = (category) => {
  const config = PROPERTY_FIELDS_CONFIG[category];
  if (!config || config.isCustom) return [];
  return config.fields.map(f => f.name);
};

// Helper function to get default values for all fields
export const getDefaultFormValues = () => {
  const defaults = {
    title: '',
    category: '',
    price: '',
    location: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    description: '',
    features: '',
    images: [],
    video: '',
    status: 'available',
    sections: ['featured'],
    locationUrl: '',
    // Office Space specific fields
    builtUpArea: '',
    pricePerSqFt: '',
    expectedRent: '',
    depositAmount: '',
    floor: '',
    plugAndPlay: '',
    workStations: '',
    cabins: '',
    conferenceHall: '',
    pantry: '',
    washroomDetails: '',
    parkingType: '',
    parkingCount: '',
    // Washroom breakdown fields
    washroomInside: '',
    washroomOutside: '',
    washroomTotal: '',
    // Common fields from config (only those that exist in schema)
    road: '',
    roadType: '',
    propertyUnder: '',
    propertyFacing: '',
    boundaryType: '',
    bore: '',
    anyPTCase: '',
    propertyLocation: '',
    'revenueRegistration/subRegister': '',
    district: '',
    state: '',
    flatType: '',
    floorDetails: '',
    buildupArea: '',
    propertyAge: '',
    buildingAge: '',
    furnishingStatus: '',
    parkingDetails: '',
    numberOfCarParking: '',
    numberOfCarParkings: '',
    plotArea: '',
    plotAreaSqYards: '',
    totalFloors: '',
    portions: '',
    washrooms: '',
    farmhouseAreaAcres: '',
    swimmingPool: '',
    anyConstruction: '',
    commercialPropertyType: '',
    transactionType: '',
    garden: '',
    acres: '',
    guntas: ''
  };

  return defaults;
};
