· MDLab-Resource-Utilization-Platform

A Full-Stack Lab Resource Utilization Platform built using React.js, Spring Boot, and PostgreSQL for managing laboratory equipment, scheduling, utilization monitoring, and resource sharing.

to run your  react frontend :

--> cd frontend

--> npm i

--> npm run dev

to run your spring boot bachend in eclipse :

--> goto lombok.jar folder in cmd run this command java -jar lombok.jar and restart eclipse

--> Enable annotation processing

      In Eclipse, go to:
      Window → Preferences → Java Compiler → Annotation Processing

      Enable Annotation Processing and Annotation Processing in Java Projects.

--> rigth click on project then click maven then click update project

--> change your postgresql credentials and database

--> open LabResourcePlatformApplication file then click run button

Auth Flow & API Endpoints

1. Register

POST http://localhost:8080/api/auth/register

Request Body

json{
"username": "rahul",
"email": "xyz@gmail.com",
"password": "12345678",
"role": "RESEARCHER",
"department": "CS",
"institution": "XYZ University"
}

these are the enum role
RESEARCHER,
LAB_TECHNICIAN,
LAB_MANAGER,
DEPARTMENT_HEAD,
INSTITUTION_ADMIN,
SYSTEM_ADMIN

Response

json{
"message": "Registration successful! Please check your email for OTP.",
"email": "xyz@gmail.com"
}

This sends an OTP to the given email.

2. Verify Email

POST http://localhost:8080/api/auth/verify

Request Body

json{
"email": "xyz@gmail.com",
"otp": "067263"
}

Response

json{
"message": "Email verified successfully!"
}

3. Login

POST http://localhost:8080/api/auth/login

Request Body

json{
"email": "xyz@gmail.com",
"password": "12345678"
}

Response

json{
"tokenType": "Bearer",
"accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiUkVTRUFSQ0hFUiIsInR5cGUiOiJhY2Nlc3MiLCJzdWIiOiJ6YWhpcWlicmFoaW1iaGF0QGdtYWlsLmNvbSIsImlhdCI6MTc4MzM2MDM2MCwiZXhwIjoxNzg1OTUyMzYwfQ.noYU1MgUfKnarSMs5kvUxus97VGS4HSiq8epemtlk8s"
}

This gives you an access token. All protected URLs will need this token, otherwise it will return unauthorized.

Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiUkVTRUFSQ0hFUi...

This token has the user's email, username, and role encoded in it.

This token will expire every 30 days, after which the user must log in again.

4. Resend OTP

POST http://localhost:8080/api/auth/resend-otp

Request Body

json{
"email" : "xyz@gmail.com"
}

Response

json{
"message": "OTP resent successfully!"
}

5. Reset Password Request

POST http://localhost:8080/api/auth/reset-password-request

Request Body

json{
"email" : "xyz@gmail.com"
}

Response

Reset OTP sent successfully!

6. Reset Password

POST http://localhost:8080/api/auth/reset-password

Request Body

json{
"email":"xyz@gmail.com",
"newPassword":"12345678",
"otp":"814463"
}

Response

Password changed successfully!

7. Get User Details

GET http://localhost:8080/api/auth/get-user-details

Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiUkVTRUFSQ0hFUi...

You must provide your JWT access token in this endpoint.

Response

json{
"id": 1,
"username": "rahul",
"email": "xyz@gmail.com",
"role": "RESEARCHER",
"emailVerified": true,
"department": "CS",
"institution": "XYZ University"
}