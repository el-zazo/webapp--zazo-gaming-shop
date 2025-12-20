# GearUp Database Schema

## Overview

This document describes the database schema for the GearUp application. The database is built using MongoDB with Mongoose as the ODM (Object Document Mapper). The schema is designed to support an online gaming shop with features for product management, user accounts, forums, guides, and e-commerce functionality.

## Database Entities

### Admin

Stores information about administrative users with elevated privileges.

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| username | String | Admin's username | required, unique |
| email | String | Admin's email address | required, unique |
| password_hash | String | Hashed password | required |
| avatar_url | String | URL to admin's avatar image | optional |
| created_at | Date | Account creation timestamp | default: current date |

### User

Stores information about regular users of the platform.

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| username | String | User's username | required, unique |
| email | String | User's email address | required, unique |
| password_hash | String | Hashed password | required |
| avatar_url | String | URL to user's avatar image | optional |
| created_at | Date | Account creation timestamp | default: current date |

### Category

Stores product categories for organization.

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| name | String | Category name | required, unique |
| slug | String | URL-friendly version of name | required, unique |
| image_url | String | URL to category image | optional |
| description | String | Category description | optional |

### Product

Stores information about gaming products available in the shop.

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| name | String | Product name | required |
| slug | String | URL-friendly version of name | required, unique |
| description | String | Product description | optional |
| price | Number | Current product price | required |
| original_price | Number | Original price (for discounted items) | optional |
| images | [String] | Array of image URLs | optional |
| rating | Number | Product rating | optional |
| stock_quantity | Number | Available quantity | required |
| category_id | ObjectId | Reference to Categories collection | optional, ref: "categories" |
| on_sale | Boolean | Whether product is on sale | default: false |
| created_at | Date | Creation timestamp | default: current date |

### ForumThread

Stores forum discussion threads.

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| title | String | Thread title | required |
| content | String | Thread content | required |
| category | String | Thread category | required |
| author_id | ObjectId | Reference to Users collection | required, ref: "users" |
| created_at | Date | Creation timestamp | default: current date |
| updated_at | Date | Last update timestamp | default: current date |

### ForumReply

Stores replies to forum threads.

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| thread_id | ObjectId | Reference to ForumThreads collection | required, ref: "forumThreads" |
| author_id | ObjectId | Reference to Users collection | required, ref: "users" |
| content | String | Reply content | required |
| created_at | Date | Creation timestamp | default: current date |

### Guide

Stores gaming guides and tutorials.

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| title | String | Guide title | required |
| slug | String | URL-friendly version of title | required, unique |
| content | String | Guide content | required |
| image_url | String | URL to guide image | optional |
| category | String | Guide category | required |
| description | String | Guide description | required |
| created_at | Date | Creation timestamp | default: current date |

### Faqs

Stores frequently asked questions.

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| question | String | FAQ question | required, unique, trimmed |
| answer | String | FAQ answer | required, trimmed |
| category | String | FAQ category | required, trimmed |
| display_order | Number | Order for display | required |
| created_at | Date | Creation timestamp | default: current date |

### ContactMessage

Stores customer contact form submissions.

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| name | String | Sender's name | required |
| email | String | Sender's email | required |
| message | String | Message content | required |
| created_at | Date | Submission timestamp | default: current date |

### NewsletterSubscription

Stores email addresses for newsletter subscriptions.

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| email | String | Subscriber's email | required, unique |
| subscribed_at | Date | Subscription timestamp | default: current date |

### Quote

Stores customer testimonials and quotes.

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| name | String | Customer name | required |
| avatar_url | String | URL to customer avatar | optional |
| quote | String | Testimonial content | required |
| rating | Number | Rating (1-5) | required, min: 1, max: 5 |
| display_order | Number | Order for display | required, default: 0 |
| created_at | Date | Creation timestamp | default: current date |

### Reaction

Stores user reactions to forum content.

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| user_id | ObjectId | Reference to Users collection | required, ref: "users" |
| target_id | ObjectId | ID of the target content | required |
| target_model | String | Type of target ("ForumThread" or "ForumReply") | required, enum |
| reaction_type | String | Type of reaction ("like" or "dislike") | required, enum |
| created_at | Date | Creation timestamp | default: current date |

**Note**: This schema has a compound index on `{ user_id: 1, target_id: 1, target_model: 1 }` with the `unique: true` constraint to ensure a user can only react once to a specific item.

### Favorite

Stores user product favorites/wishlist.

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| user_id | ObjectId | Reference to Users collection | required, ref: "users" |
| product_id | ObjectId | Reference to Products collection | required, ref: "products" |
| created_at | Date | Creation timestamp | default: current date |

### Cart

Stores user shopping carts.

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| user_id | ObjectId | Reference to Users collection | required, ref: "users", unique |
| items | Array | Array of cart items | see below |
| created_at | Date | Creation timestamp | default: current date |
| updated_at | Date | Last update timestamp | default: current date |

#### Cart Items Schema

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| product_id | ObjectId | Reference to Products collection | required, ref: "products" |
| quantity | Number | Quantity in cart | required, min: 1 |
| price_at_add | Number | Price at time of adding to cart | required |

### Order

Stores customer orders.

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| user_id | ObjectId | Reference to Users collection | required, ref: "users" |
| items | Array | Array of order items | see below |
| total_amount | Number | Total order amount | required |
| status | String | Order status | required, enum, default: "Pending" |
| shipping_address | Object | Shipping address details | see below |
| payment_details | Object | Payment method details | see below |
| created_at | Date | Order creation timestamp | default: current date |
| updated_at | Date | Last update timestamp | default: current date |

#### Order Items Schema

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| product_id | ObjectId | Reference to Products collection | optional, ref: "products" |
| name | String | Product name at time of order | required |
| price | Number | Price at time of order | required |
| quantity | Number | Quantity ordered | required, min: 1 |

#### Shipping Address Schema

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| name | String | Recipient name | required |
| address | String | Street address | required |
| city | String | City | required |
| state | String | State/Province | required |
| zip_code | String | Postal/ZIP code | required |
| country | String | Country | required |

#### Payment Details Schema

| Field | Type | Description | Constraints |
|-------|------|-------------|--------------|
| method | String | Payment method | enum: ["Credit Card", "PayPal"], default: "Credit Card" |
| transaction_id | String | Payment transaction ID | optional |

## Relationships

- Users can have multiple Orders, ForumThreads, ForumReplies, Reactions, and Favorites
- Products belong to a Category
- Products can have multiple Favorites
- ForumThreads can have multiple ForumReplies and Reactions
- ForumReplies can have multiple Reactions

## Indexes

The following indexes are explicitly defined:

- Reaction: Compound index on `{ user_id: 1, target_id: 1, target_model: 1 }` with `unique: true`

Additionally, MongoDB automatically creates indexes for:
- All `_id` fields
- All fields with the `unique: true` constraint

## Notes

- All timestamps are stored using JavaScript's `Date.now` function
- MongoDB ObjectIds are used as primary keys and for references between collections
- The schema uses Mongoose's referencing system with the `ref` property to establish relationships between collections