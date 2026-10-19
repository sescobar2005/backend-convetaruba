### Variables
@baseUrl = http://localhost:3000

### Register user
POST {{baseUrl}}/users
Content-Type: application/json

{
  "firstName": "Convet",
  "lastName": "Aruba",
  "email": "convetaruba@example.com",
  "mobileNumber": "3001234567",
  "password": "Convet123456*",
  "acceptedTermsAndPrivacyPolicy": true,
  "whatsappReminders": false
}

### Register user - duplicate email
POST {{baseUrl}}/users
Content-Type: application/json

{
  "firstName": "Convet",
  "lastName": "Aruba",
  "email": "convetaruba@example.com",
  "mobileNumber": "3001234567",
  "password": "Convet123456*",
  "acceptedTermsAndPrivacyPolicy": true,
  "whatsappReminders": false
}
