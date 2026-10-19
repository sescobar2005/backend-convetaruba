
@baseUrl = http://localhost:3000

### Iniciar sesión
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "TU_EMAIL_DE_PRUEBA",
  "password": "TU_CONTRASEÑA_DE_PRUEBA"
}
