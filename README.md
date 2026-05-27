# Tanavi Properties - Admin Portal

This is a separate admin portal for managing Buy/Sell properties.

## Setup Instructions

1. Install dependencies:
```bash
cd admin-portal
npm install
npm install tailwindcss autoprefixer
```

2. Start the admin portal:
```bash
npm start
```

The admin portal runs on: **http://localhost:3001**

## Features

- Admin Login (same credentials as main site)
- Buy/Sell Property Management
  - Add new buy/sell properties
  - Edit existing properties
  - Delete properties
  - Upload images

## Admin Access

**Login URL**: http://localhost:3001

**Default Credentials**:
- Email: admin@tanavi.com
- Password: admin123

## Deployment

For production deployment as a subdomain (e.g., admin.tanaviproperties.com):

1. Build the admin portal:
```bash
npm run build
```

2. Deploy the `build` folder to your subdomain

3. Update `.env` with production API URL:
```
REACT_APP_API_URL=https://your-api-domain.com
```

## Tech Stack

- React
- React Router
- Tailwind CSS
- React Icons

## Note

This admin portal connects to the same backend API as the main website but runs on a different port (3001) for local development.
