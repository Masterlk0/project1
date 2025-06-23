# MongoDB Schema for E-commerce Platform

This document outlines the MongoDB collections and their schemas for the e-commerce platform.

## 1. Users Collection (`users`)

- `_id`: ObjectId (Primary Key)
- `username`: String, Required, Unique
- `email`: String, Required, Unique
- `password`: String, Required (will be hashed)
- `role`: String, Enum: \["seller", "buyer", "admin"], Required
- `firstName`: String
- `lastName`: String
- `address`: Object
    - `street`: String
    - `city`: String
    - `state`: String
    - `zipCode`: String
    - `country`: String
- `phoneNumber`: String
- `createdAt`: Date, Default: Current Timestamp
- `updatedAt`: Date, Default: Current Timestamp

## 2. Products Collection (`products`)

- `_id`: ObjectId (Primary Key)
- `name`: String, Required
- `description`: String
- `category`: String, Required (e.g., Fashion, Electronics, Home)
- `price`: Number, Required
- `stock`: Number, Required, Default: 0
- `images`: Array of Strings (URLs to product images)
- `sellerId`: ObjectId, Ref: `users`, Required
- `location`: String (City/Region, for filtering)
- `isFeatured`: Boolean, Default: false
- `viewCount`: Number, Default: 0
- `createdAt`: Date, Default: Current Timestamp
- `updatedAt`: Date, Default: Current Timestamp

## 3. Services Collection (`services`)

- `_id`: ObjectId (Primary Key)
- `name`: String, Required
- `description`: String
- `type`: String, Required (e.g., Beauty, Home Repair, Transport)
- `price`: Number, Required (can be per hour, fixed, etc.)
- `pricingModel`: String (e.g., "hourly", "fixed", "per_session")
- `availability`: String (e.g., "Mon-Fri 9am-5pm", specific dates)
- `location`: String (Service area/City, for filtering)
- `sellerId`: ObjectId, Ref: `users`, Required
- `demandScore`: Number, Default: 0 (for AI boosting)
- `isFeatured`: Boolean, Default: false
- `viewCount`: Number, Default: 0
- `createdAt`: Date, Default: Current Timestamp
- `updatedAt`: Date, Default: Current Timestamp

## 4. Orders Collection (`orders`)

- `_id`: ObjectId (Primary Key)
- `buyerId`: ObjectId, Ref: `users`, Required
- `sellerId`: ObjectId, Ref: `users`, Required
- `items`: Array of Objects
    - `itemId`: ObjectId, Required (Ref: `products` or `services`)
    - `itemType`: String, Enum: \["product", "service"], Required
    - `quantity`: Number (for products, default 1 for services)
    - `priceAtPurchase`: Number
- `totalAmount`: Number, Required
- `paymentDetails`: Object
    - `method`: String (e.g., "stripe", "paypal_placeholder")
    - `transactionId`: String
    - `status`: String, Enum: \["pending", "completed", "failed", "refunded"]
- `status`: String, Enum: \["pending_confirmation", "confirmed", "processing", "shipped", "delivered", "booked", "completed", "cancelled"], Required
- `shippingAddress`: Object (for products)
    - `street`: String
    - `city`: String
    - `state`: String
    - `zipCode`: String
    - `country`: String
- `serviceDate`: Date (for services)
- `createdAt`: Date, Default: Current Timestamp
- `updatedAt`: Date, Default: Current Timestamp

## 5. Leads Collection (`leads`)

- `_id`: ObjectId (Primary Key)
- `userId`: ObjectId, Ref: `users` (User who showed interest)
- `itemId`: ObjectId (Ref: `products` or `services`)
- `itemType`: String, Enum: \["product", "service"]
- `interestType`: String (e.g., "view", "addToCart", "inquiry", "saveForLater")
- `engagementScore`: Number, Default: 1 (incremented based on interaction)
- `userProfileHints`: Object (for AI, e.g., age, location, past behavior if available and privacy-compliant)
    - `age`: Number
    - `location`: String
    - `interests`: Array of Strings
- `createdAt`: Date, Default: Current Timestamp

## 6. Chats Collection (`chats`)

- `_id`: ObjectId (Primary Key)
- `participants`: Array of ObjectId, Ref: `users`, Required (Should contain buyerId and sellerId)
- `messages`: Array of Objects
    - `senderId`: ObjectId, Ref: `users`, Required
    - `receiverId`: ObjectId, Ref: `users`, Required
    - `content`: String, Required
    - `timestamp`: Date, Default: Current Timestamp
    - `isRead`: Boolean, Default: false
- `lastMessageAt`: Date, Default: Current Timestamp
- `createdAt`: Date, Default: Current Timestamp
- `updatedAt`: Date, Default: Current Timestamp
