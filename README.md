# MDLab-Resource-Utilization-Platform

A **Full-Stack Lab Resource Utilization Platform** built using **React.js**, **Spring Boot**, and **PostgreSQL** for managing laboratory equipment, scheduling, utilization monitoring, and resource sharing.

---

# Getting Started

## Prerequisites

Before running the project, ensure you have the following installed:

- Java 21 (or the version required by the project)
- Node.js & npm
- PostgreSQL
- Eclipse IDE (recommended for the backend)
- Maven

---

# Running the Frontend (React)

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

# Running the Backend (Spring Boot)

## Step 1: Enable Lombok

Navigate to the folder containing `lombok.jar` and run:

```bash
java -jar lombok.jar
```

Restart Eclipse after installation.

---

## Step 2: Enable Annotation Processing

In Eclipse:

```
Window
    → Preferences
        → Java Compiler
            → Annotation Processing
```

Enable:

- Annotation Processing
- Annotation Processing in Java Projects

---

## Step 3: Update Maven Project

Right-click the project:

```
Maven → Update Project
```

---

## Step 4: Configure PostgreSQL

Update your PostgreSQL credentials and database configuration inside:

```
application.properties
```

or

```
application.yml
```

depending on your project configuration.

---

## Step 5: Run the Application

Open

```
LabResourcePlatformApplication
```

and click **Run**.

---

# Authentication API

## User Roles

The application supports the following user roles:

```text
RESEARCHER
LAB_TECHNICIAN
LAB_MANAGER
DEPARTMENT_HEAD
INSTITUTION_ADMIN
SYSTEM_ADMIN
```

---

## 1. Register

**Method:** `POST`

**Endpoint**

```http
POST http://localhost:8080/api/auth/register
```

### Request Body

```json
{
  "username": "rahul",
  "email": "xyz@gmail.com",
  "password": "12345678",
  "role": "RESEARCHER",
  "department": "CS",
  "institution": "XYZ University"
}
```

### Response

```json
{
  "message": "Registration successful! Please check your email for OTP.",
  "email": "xyz@gmail.com"
}
```

An OTP will be sent to the registered email address.

---

## 2. Verify Email

**Method:** `POST`

**Endpoint**

```http
POST http://localhost:8080/api/auth/verify
```

### Request Body

```json
{
  "email": "xyz@gmail.com",
  "otp": "067263"
}
```

### Response

```json
{
  "message": "Email verified successfully!"
}
```

---

## 3. Login

**Method:** `POST`

**Endpoint**

```http
POST http://localhost:8080/api/auth/login
```

### Request Body

```json
{
  "email": "xyz@gmail.com",
  "password": "12345678"
}
```

### Response

```json
{
  "tokenType": "Bearer",
  "accessToken": "your_jwt_access_token"
}
```

### JWT Authentication

All protected endpoints require the JWT access token returned after login.

Include it in every request:

```http
Authorization: Bearer <your_jwt_access_token>
```

The JWT contains the authenticated user's:

- Email
- Username
- Role

The token remains valid for **30 days**, after which the user must log in again.

---

## 4. Resend OTP

**Method:** `POST`

**Endpoint**

```http
POST http://localhost:8080/api/auth/resend-otp
```

### Request Body

```json
{
  "email": "xyz@gmail.com"
}
```

### Response

```json
{
  "message": "OTP resent successfully!"
}
```

---

## 5. Request Password Reset

**Method:** `POST`

**Endpoint**

```http
POST http://localhost:8080/api/auth/reset-password-request
```

### Request Body

```json
{
  "email": "xyz@gmail.com"
}
```

### Response

```text
Reset OTP sent successfully!
```

---

## 6. Reset Password

**Method:** `POST`

**Endpoint**

```http
POST http://localhost:8080/api/auth/reset-password
```

### Request Body

```json
{
  "email": "xyz@gmail.com",
  "newPassword": "12345678",
  "otp": "814463"
}
```

### Response

```text
Password changed successfully!
```

---

## 7. Get User Details

**Method:** `GET`

**Endpoint**

```http
GET http://localhost:8080/api/auth/get-user-details
```

### Authentication

```http
Authorization: Bearer <your_jwt_access_token>
```

### Response

```json
{
  "id": 1,
  "username": "rahul",
  "email": "xyz@gmail.com",
  "role": "RESEARCHER",
  "emailVerified": true,
  "department": "CS",
  "institution": "XYZ University"
}
```

---

# Equipment Management API

The Equipment Management module provides APIs for creating, updating, deleting, and retrieving laboratory equipment.

> **Authentication Required**
>
> All endpoints in this section require a valid JWT access token.
>
> Include the following header with every request:
>
> ```http
> Authorization: Bearer <your_jwt_access_token>
> ```
>
> Some endpoints also require an equipment **ID** as a path variable.

---

## 1. Add Equipment

**Method:** `POST`

**Endpoint**

```http
POST http://localhost:8080/api/equipment/add-equipment
```

### Request Body

```json
{
  "serial": "13s34s3",
  "equipmentName": "MicroScope",
  "category": "Micro Biology",
  "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
  "institution": "Cluster University"
}
```

### Response

```json
{
  "id": 8,
  "serial": "13s34ss3",
  "equipmentName": "MicroScope",
  "category": "Micro Biology",
  "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
  "acquisitionDate": "2026-07-07T21:42:26.214146",
  "institution": "Cluster University",
  "status": "AVAILABLE",
  "addedBy": "zahiq Ibrahim"
}
```

---

## 2. Update Equipment

**Method:** `PUT`

**Endpoint**

```http
PUT http://localhost:8080/api/equipment/update-equipment/{id}
```

**Example**

```http
PUT http://localhost:8080/api/equipment/update-equipment/1
```

### Request Body

```json
{
  "equipmentName": "MicroScope",
  "institution": "Cam University"
}
```

### Response

```json
{
  "id": 1,
  "serial": "1334s3",
  "equipmentName": "ocilo",
  "category": "Micro Biology",
  "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
  "acquisitionDate": "2026-07-07T20:16:58.1351",
  "institution": "Cam University",
  "addedBy": "zahiq Ibrahim",
  "status": "AVAILABLE"
}
```

---

## 3. Delete Equipment

**Method:** `DELETE`

**Endpoint**

```http
DELETE http://localhost:8080/api/equipment/delete-equipment/{id}
```

**Example**

```http
DELETE http://localhost:8080/api/equipment/delete-equipment/7
```

### Response

```text
Equipment Deleted Successfully
```

---

## 4. Get All Equipment

**Method:** `GET`

**Endpoint**

```http
GET http://localhost:8080/api/equipment/get-all-equipments
```

### Response

```json
[
  {
    "id": 7,
    "serial": "13s34s3",
    "equipmentName": "MicroScope",
    "category": "Micro Biology",
    "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
    "acquisitionDate": "2026-07-07T21:36:06.588868",
    "institution": "Cluster University",
    "addedBy": "zahiq Ibrahim",
    "status": "RETIRED"
  }
]
```

---

## 5. Update Equipment Status

**Method:** `PUT`

**Endpoint**

```http
PUT http://localhost:8080/api/equipment/update-equipment-status/{id}
```

**Example**

```http
PUT http://localhost:8080/api/equipment/update-equipment-status/2
```

### Request Body

```json
{
  "status": "UNDER_MAINTENANCE"
}
```

### Response

```json
{
  "id": 2,
  "serial": "1334s3",
  "equipmentName": "MicroScope",
  "category": "Micro Biology",
  "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
  "acquisitionDate": "2026-07-07T21:08:52.749123",
  "institution": "Cluster University",
  "addedBy": "zahiq Ibrahim",
  "status": "UNDER_MAINTENANCE"
}
```

---

## 6. Get My Equipment

Returns all equipment created by the currently authenticated user.

**Method:** `GET`

**Endpoint**

```http
GET http://localhost:8080/api/equipment/get-my-equipments
```

### Response

```json
[
  {
    "id": 7,
    "serial": "13s34s3",
    "equipmentName": "MicroScope",
    "category": "Micro Biology",
    "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
    "acquisitionDate": "2026-07-07T21:36:06.588868",
    "institution": "Cluster University",
    "addedBy": "zahiq Ibrahim",
    "status": "RETIRED"
  }
]
```
# Booking Management API Documentation

## Authentication Requirements

The following APIs require a **Researcher Access Token**:

* Create Booking
* Calendar Data
* My Dashboard

For booking status modification:

* If a **Researcher** wants to cancel a booking request, pass the **Researcher Access Token**.
* If a **Lab Manager** wants to update the booking status, pass the **Manager Access Token**.

---

# 1. Create Booking

### Method

```
POST
```

### Endpoint

```
http://localhost:8080/api/bookings/create
```

### Request Body

```json
{
    "userId": 1,
    "equipmentId": 1,
    "startTime": "2026-07-09T10:00:00",
    "endTime": "2026-07-09T12:00:00"
}
```

### Response

```
Booking request submitted successfully. Awaiting Manager approval.
```

---

# 2. Create Booking - Conflict Check

When a requested booking slot conflicts with an active booking timeline, the request will automatically be added to the waitlist.

### Method

```
POST
```

### Endpoint

```
http://localhost:8080/api/bookings/create
```

### Request Body

```json
{
    "userId": 2,
    "equipmentId": 1,
    "startTime": "2026-07-09T10:30:00",
    "endTime": "2026-07-09T11:30:00"
}
```

### Response

```
Slot conflicting with an active timeline. Auto-added to the Waitlist.
```

---

# 3. Calendar Data

Returns the booking schedule for a specific equipment within the given time range.

### Method

```
GET
```

### Endpoint

```
http://localhost:8080/api/bookings/calendar?userId=2&start=2026-07-09T00:00:00&end=2026-07-09T23:59:59
```

### Request Body

```
None
```

### Response

```json
[
    {
        "id": 1,
        "equipment": {
            "id": 1,
            "serial": "13s34s3",
            "equipmentName": "MicroScope",
            "category": "Micro Biology",
            "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
            "acquisitionDate": "2026-07-08T14:05:09.306125",
            "institution": "Cluster University",
            "addedBy": "nani",
            "status": "AVAILABLE"
        },
        "user": {
            "id": 2,
            "username": "reseacher_r",
            "password": "$2a$12$PEGJqW3W7tL9Cs49PB/90.eYDyPjV/KbjjY1FAsBjVHzFLt.AIawO",
            "email": "onlinevoting630@gmail.com",
            "emailVerified": true,
            "verificationOtp": null,
            "otpGeneratedTime": null,
            "role": "RESEARCHER",
            "institution": "lbwe",
            "department": "Computer Science"
        },
        "startTime": "2026-07-09T05:30:00",
        "endTime": "2026-07-09T06:00:00",
        "status": "CANCELLED"
    },
    {
        "id": 3,
        "equipment": {
            "id": 2,
            "serial": "13s34s4",
            "equipmentName": "MicroScope",
            "category": "Micro Biology",
            "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
            "acquisitionDate": "2026-07-08T14:05:18.092768",
            "institution": "Cluster University",
            "addedBy": "nani",
            "status": "AVAILABLE"
        },
        "user": {
            "id": 2,
            "username": "reseacher_r",
            "password": "$2a$12$PEGJqW3W7tL9Cs49PB/90.eYDyPjV/KbjjY1FAsBjVHzFLt.AIawO",
            "email": "onlinevoting630@gmail.com",
            "emailVerified": true,
            "verificationOtp": null,
            "otpGeneratedTime": null,
            "role": "RESEARCHER",
            "institution": "lbwe",
            "department": "Computer Science"
        },
        "startTime": "2026-07-09T05:30:00",
        "endTime": "2026-07-09T06:00:00",
        "status": "CANCELLED"
    },
    {
        "id": 4,
        "equipment": {
            "id": 2,
            "serial": "13s34s4",
            "equipmentName": "MicroScope",
            "category": "Micro Biology",
            "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
            "acquisitionDate": "2026-07-08T14:05:18.092768",
            "institution": "Cluster University",
            "addedBy": "nani",
            "status": "AVAILABLE"
        },
        "user": {
            "id": 2,
            "username": "reseacher_r",
            "password": "$2a$12$PEGJqW3W7tL9Cs49PB/90.eYDyPjV/KbjjY1FAsBjVHzFLt.AIawO",
            "email": "onlinevoting630@gmail.com",
            "emailVerified": true,
            "verificationOtp": null,
            "otpGeneratedTime": null,
            "role": "RESEARCHER",
            "institution": "lbwe",
            "department": "Computer Science"
        },
        "startTime": "2026-07-09T05:30:00",
        "endTime": "2026-07-09T06:00:00",
        "status": "PENDING"
    }
]
```

---

# 4. Update Booking Status (Researcher / Lab Manager)

## Authorization Rules

### Researcher

A researcher can cancel their own booking request.

Required:

```
Researcher Access Token
```

Example action:

```
Cancel booking request
```

---

### Lab Manager

A lab manager can update the booking status.

Required:

```
Manager Access Token
```

Example actions:

```
Approve booking
Reject booking
Cancel booking
Update booking status
```

---

## Cancel Booking Request

### Method

```
POST
```

### Endpoint

```
http://localhost:8080/api/bookings/4/status?status=CANCELLED
```

### Request Body

```
None
```

### Response

```
Booking status updated to CANCELLED. Waitlist verified.
```

---

# 5. My Dashboard - Booking and Waitlist Data

Returns the user's booking history and waitlist information.

### Method

```
GET
```

### Endpoint

```
http://localhost:8080/api/bookings/my-dashboard/2
```

### Request Body

```
None
```

### Response

```json
{
    "bookings": [
        {
            "id": 1,
            "equipment": {
                "id": 1,
                "serial": "13s34s3",
                "equipmentName": "MicroScope",
                "category": "Micro Biology",
                "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
                "acquisitionDate": "2026-07-08T14:05:09.306125",
                "institution": "Cluster University",
                "addedBy": "nani",
                "status": "AVAILABLE"
            },
            "user": {
                "id": 2,
                "username": "reseacher_r",
                "email": "onlinevoting630@gmail.com",
                "role": "RESEARCHER",
                "institution": "lbwe",
                "department": "Computer Science"
            },
            "startTime": "2026-07-09T05:30:00",
            "endTime": "2026-07-09T06:00:00",
            "status": "CANCELLED"
        },
        {
            "id": 3,
            "equipment": {
                "id": 2,
                "serial": "13s34s4",
                "equipmentName": "MicroScope",
                "category": "Micro Biology",
                "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
                "acquisitionDate": "2026-07-08T14:05:18.092768",
                "institution": "Cluster University",
                "addedBy": "nani",
                "status": "AVAILABLE"
            },
            "user": {
                "id": 2,
                "username": "reseacher_r",
                "email": "onlinevoting630@gmail.com",
                "role": "RESEARCHER",
                "institution": "lbwe",
                "department": "Computer Science"
            },
            "startTime": "2026-07-09T05:30:00",
            "endTime": "2026-07-09T06:00:00",
            "status": "CANCELLED"
        },
        {
            "id": 4,
            "equipment": {
                "id": 2,
                "serial": "13s34s4",
                "equipmentName": "MicroScope",
                "category": "Micro Biology",
                "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
                "acquisitionDate": "2026-07-08T14:05:18.092768",
                "institution": "Cluster University",
                "addedBy": "nani",
                "status": "AVAILABLE"
            },
            "user": {
                "id": 2,
                "username": "reseacher_r",
                "email": "onlinevoting630@gmail.com",
                "role": "RESEARCHER",
                "institution": "lbwe",
                "department": "Computer Science"
            },
            "startTime": "2026-07-09T05:30:00",
            "endTime": "2026-07-09T06:00:00",
            "status": "PENDING"
        }
    ],
    "waitlistEntries": []
}
```

---

# API Authorization Summary

| API                    | Researcher Access Token | Manager Access Token |
| ---------------------- | ----------------------- | -------------------- |
| Create Booking         | Required                | Not Required         |
| Calendar Data          | Required                | Not Required         |
| My Dashboard           | Required                | Not Required         |
| Cancel Booking Request | Required                | Not Required         |
| Approve Booking        | Not Required            | Required             |
| Reject Booking         | Not Required            | Required             |
| Update Booking Status  | Not Required            | Required             |

---

# Base URL

```
http://localhost:8080
```
