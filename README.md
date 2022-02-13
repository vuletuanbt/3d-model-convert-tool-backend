# Requirement

NodeJS 14

MySQL 8

# Installation

- Start your MySQL
- Change config in .env

```bash
cp .env.template .env

```

- Generate JWT public and private keys and set them into your .env

```bash

ssh-keygen -t rsa -b 2048 -m PEM -f jwtRS256.key
# Don't add passphrase
openssl rsa -in jwtRS256.key -pubout -outform PEM -out jwtRS256.key.pub

# generate JWT_PUBLIC_KEY_BASE64
base64 -i jwtRS256.key

# generate JWT_PRIVATE_KEY_BASE64
base64 -i jwtRS256.key.pub
```

```bash
# In your .env
JWT_PUBLIC_KEY_BASE64=BASE64_OF_JWT_PUBLIC_KEY
JWT_PRIVATE_KEY_BASE64=BASE64_OF_JWT_PRIVATE_KEY
```

- Install dependencies

```bash
npm install 
```

- Run migration and seeder

```bash
npm run migration:run
npm run seed:run
```


# ****Running the app****

```bash
npm run start:dev
```
