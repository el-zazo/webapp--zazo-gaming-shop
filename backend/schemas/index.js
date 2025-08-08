const { Schema } = require("mongoose");

const AdminSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  avatar_url: { type: String },
  created_at: { type: Date, default: Date.now },
});

// Users Schema
const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  avatar_url: { type: String },
  created_at: { type: Date, default: Date.now },
});

// Categories Schema
const CategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  image_url: { type: String },
  description: { type: String },
});

// Products Schema
const ProductSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  price: { type: Number, required: true },
  original_price: { type: Number },
  images: { type: [String] },
  rating: { type: Number },
  stock_quantity: { type: Number, required: true },
  category_id: { type: Schema.Types.ObjectId, ref: "categories" },
  on_sale: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

// Forum Threads Schema
const ForumThreadSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  author_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Forum Replies Schema
const ForumReplySchema = new Schema({
  thread_id: { type: Schema.Types.ObjectId, ref: "forumThreads", required: true },
  author_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
  content: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

// Guides Schema
const GuideSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  image_url: { type: String },
  category: { type: String, required: true },
  description: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

// Faqs Schema
const FaqsSchema = new Schema({
  question: { type: String, required: true, unique: true, trim: true },
  answer: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  display_order: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
});

// Contact Messages Schema
const ContactMessageSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

// Newsletter Subscriptions Schema
const NewsletterSubscriptionSchema = new Schema({
  email: { type: String, required: true, unique: true },
  subscribed_at: { type: Date, default: Date.now },
});

// Quotes Schema
const QuoteSchema = new Schema({
  name: { type: String, required: true },
  avatar_url: { type: String, required: false },
  quote: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  display_order: { type: Number, required: true, default: 0 },
  created_at: { type: Date, default: Date.now },
});

// Reactions Schema
const ReactionSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
  target_id: { type: Schema.Types.ObjectId, required: true },
  target_model: { type: String, required: true, enum: ["ForumThread", "ForumReply"] },
  reaction_type: { type: String, required: true, enum: ["like", "dislike"] },
  created_at: { type: Date, default: Date.now },
});
// Add a compound index to ensure a user can only react once to a specific item.
ReactionSchema.index({ user_id: 1, target_id: 1, target_model: 1 }, { unique: true });

// Favorites Schema
const FavoriteSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
  product_id: { type: Schema.Types.ObjectId, ref: "products", required: true },
  created_at: { type: Date, default: Date.now },
});

// Carts Schema
const CartSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, unique: true },
  items: [
    {
      product_id: { type: Schema.Types.ObjectId, ref: "products", required: true },
      quantity: { type: Number, required: true, min: 1 },
      price_at_add: { type: Number, required: true },
    },
  ],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Orders Schema
const OrderSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
  items: [
    {
      product_id: { type: Schema.Types.ObjectId, ref: "products" },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true, min: 1 },
    },
  ],
  total_amount: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"], default: "Pending", required: true },
  shipping_address: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip_code: { type: String, required: true },
    country: { type: String, required: true },
  },
  payment_details: {
    method: { type: String, enum: ["Credit Card", "PayPal"], default: "Credit Card" },
    transaction_id: { type: String },
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = {
  AdminSchema,
  UserSchema,
  CategorySchema,
  ProductSchema,
  ForumThreadSchema,
  ForumReplySchema,
  GuideSchema,
  FaqsSchema,
  ContactMessageSchema,
  NewsletterSubscriptionSchema,
  QuoteSchema,
  ReactionSchema,
  FavoriteSchema,
  CartSchema,
  OrderSchema,
};
