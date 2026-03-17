# Multi-Page Form PDF Downloader (NestJS)

A robust service built with NestJS and Puppeteer to automate the capture and downloading of multi-step React forms into a single, merged PDF document.

## 🚀 API Usage

### Download Form PDF
Capture all pages of a form by providing the source link.

- **Endpoint:** `POST http://localhost:3000/forms/download-form`
- **Content-Type:** `application/json`

#### Request Payload
```json
{
  "link": "https://devfw.begindaily.in/?type=submission&formId=1&locationId=CL001LC004"
}
```

#### Response
```json
{
  "message": "Form Downloaded successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fileName": "complete_report.pdf",
    "storagePath": "/project/stored_forms_react/550e8400.../complete_report.pdf"
  },
  "statusCode": 200
}
```

---

## 🛠️ Features
- **Automated Navigation:** Automatically detects and clicks the "Next" button to traverse multi-step forms.
- **PDF Merging:** Uses `pdf-lib` to merge individual page captures into one consolidated file.
- **Headless Processing:** Runs Puppeteer in headless mode for server-side efficiency.
- **Auto-ID Generation:** Creates unique storage directories for every request using UUID.

---

## images


![1](https://i.ibb.co/4wGDLXNY/pdfd-api.png)


---


## 💻 Project Setup

### Installation
```bash
$ npm install
```

### Run the Project
```bash
# development
$ npm run start

# watch mode (recommended for dev)
$ npm run start:dev

# production mode
$ npm run start:prod
```

---

## 📝 Test Links
You can use these links to test the multi-page capture logic:
1. [Form Submission 1](https://devfw.begindaily.in/?type=submission&formId=1&locationId=CL001LC004)
2. [Form Submission 2](https://devfw.begindaily.in/?type=submission&formId=2&locationId=CL001LC004)

---

## 👤 Author
- **Gauri Bidwai** - [gauri@medianv.com](mailto:gauri@medianv.com)

---



