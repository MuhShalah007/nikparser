# NikParser

NikParser is a web application for parsing and validating Indonesian National Identity Numbers (NIK). The application allows users to input 16-digit NIK numbers and extract detailed information such as province, city/regency, district, birth date, gender, and additional data like zodiac sign.

## Features

- Parse and validate NIK numbers
- Extract detailed information (province, city, district, birth date, gender)
- History management using browser localStorage (no server storage)
- NIK generator with region modification capabilities
- Support for dark/light mode
- Progressive Web App (PWA) with offline capabilities
- Modern, responsive UI/UX
- REST API for NIK validation (development server only)
- Completely offline functionality with no external dependencies

## CapRover Deployment

This application can be easily deployed on CapRover using the provided configuration files:

- `captain-definition`: Configures CapRover to use the Node.js 18-alpine image
- `Dockerfile`: Multi-stage Dockerfile that builds and serves the application

### Deployment Steps

1. Add your application to CapRover via Git or by building from source
2. The application will automatically build using the provided Dockerfile
3. Access your deployed application via the assigned domain

The application will be built and served as a static site on port 80.

## Local Development

To run the application locally:

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Build for production: `npm run build`

## API Endpoints (Development Server Only)

The development server includes REST API endpoints for NIK validation and parsing:

### GET /api/nik/validate
Validate and parse a NIK number using query parameters.

**Parameters:**
- `nik` (required): 16-digit NIK number

**Example:**
```
GET /api/nik/validate?nik=3310115904080003
```

### POST /api/validate/nik
Validate and parse a NIK number using request body.

**Request Body:**
```json
{
  "nik": "3310115904080003"
}
```

**Response Format:**
Both endpoints return the same response format:
```json
{
  "status": "success" | "error",
  "pesan": "message",
  "data": {
    "nik": "string",
    "kelamin": "string",
    "lahir": "string",
    "provinsi": "string",
    "kotakab": "string",
    "kecamatan": "string",
    "uniqcode": "string",
    "tambahan": {
      "kodepos": "string",
      "pasaran": "string",
      "usia": "string",
      "ultah": "string",
      "zodiak": "string"
    }
  }
}
```

## License

This project is open source and available under the [MIT License](LICENSE).