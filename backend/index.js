const Joi = require("joi");
const { DB } = require("@el-zazo/server-creator");
const schemas = require("./schemas");
const config = require("./config");

// Create DB instance with configuration
const db = new DB({
  adapterConfig: {
    mongodb: {
      uri: config.database.uri,
      connectionOptions: config.database.connectionOptions,
      cache: config.database.cache,
    },
  },

  // Configure collections
  collections: {
    admins: {
      schema: schemas.AdminSchema,
      routerOptions: {
        routes: [],
        auth: {
          keys: {
            identifiantKey: "email",
            passwordKey: "password_hash",
          },
          additionalFields: {
            username: Joi.string().required().min(10),
          },
          routes: ["login", "refreshToken", "getUserByToken"],
          protectedRoutes: true,
          collectionAccess: {
            accessDefault: false,
            collections: {
              users: false,
              admins: false,
            },
          },
        },
      },
    },

    users: {
      schema: schemas.UserSchema,
      fields: { password_hash: 0 }, // Exclude password_hash from responses
      routerOptions: {
        auth: {
          keys: {
            identifiantKey: "email",
            passwordKey: "password_hash",
          },
          additionalFields: {
            username: Joi.string().required().min(10),
          },
          routes: ["login", "register", "refreshToken", "getUserByToken"],
          protectedRoutes: true,
          collectionAccess: {
            accessDefault: false,
            collections: {
              users: false,
              admins: true,
            },
          },
        },
      },
    },

    categories: {
      schema: schemas.CategorySchema,
      routerOptions: {
        auth: {
          protectedRoutes: ["addOne", "addMany", "updateOneById", "updateMany", "deleteById", "deleteMany"],
          collectionAccess: {
            accessDefault: false,
            collections: {
              users: false,
              admins: true,
            },
          },
        },
      },
    },

    products: {
      schema: schemas.ProductSchema,
      routerOptions: {
        auth: {
          protectedRoutes: ["addOne", "addMany", "updateOneById", "updateMany", "deleteById", "deleteMany"],
          collectionAccess: {
            accessDefault: false,
            collections: {
              users: false,
              admins: true,
            },
          },
        },
      },
    },

    forumthreads: {
      schema: schemas.ForumThreadSchema,
      routerOptions: {
        auth: {
          protectedRoutes: ["addOne", "addMany", "updateOneById", "updateMany", "deleteById", "deleteMany"],
          collectionAccess: {
            accessDefault: false,
            collections: {
              users: true,
              admins: true,
            },
          },
        },
      },
    },

    forumreplies: {
      schema: schemas.ForumReplySchema,
      routerOptions: {
        auth: {
          protectedRoutes: ["addOne", "addMany", "updateOneById", "updateMany", "deleteById", "deleteMany"],
          collectionAccess: {
            accessDefault: false,
            collections: {
              users: true,
              admins: true,
            },
          },
        },
      },
    },

    guides: {
      schema: schemas.GuideSchema,
      routerOptions: {
        auth: {
          protectedRoutes: ["addOne", "addMany", "updateOneById", "updateMany", "deleteById", "deleteMany"],
          collectionAccess: {
            accessDefault: false,
            collections: {
              users: false,
              admins: true,
            },
          },
        },
      },
    },

    faqs: {
      schema: schemas.FaqsSchema,
      routerOptions: {
        auth: {
          protectedRoutes: ["addOne", "addMany", "updateOneById", "updateMany", "deleteById", "deleteMany"],
          collectionAccess: {
            accessDefault: false,
            collections: {
              users: false,
              admins: true,
            },
          },
        },
      },
    },

    "contact-messages": {
      schema: schemas.ContactMessageSchema,
      routerOptions: {
        auth: {
          protectedRoutes: ["getAll", "getOneById", "search", "addMany", "updateOneById", "updateMany", "deleteById", "deleteMany"],
          collectionAccess: {
            accessDefault: false,
            collections: {
              users: false,
              admins: true,
            },
          },
        },
      },
    },

    "newsletter-subscriptions": {
      schema: schemas.NewsletterSubscriptionSchema,
      routerOptions: {
        auth: {
          protectedRoutes: ["getAll", "getOneById", "search", "addMany", "updateOneById", "updateMany", "deleteById", "deleteMany"],
          collectionAccess: {
            accessDefault: false,
            collections: {
              users: false,
              admins: true,
            },
          },
        },
      },
    },

    quotes: {
      schema: schemas.QuoteSchema,
      routerOptions: {
        auth: {
          protectedRoutes: ["addOne", "addMany", "updateOneById", "updateMany", "deleteById", "deleteMany"],
          collectionAccess: {
            accessDefault: false,
            collections: {
              users: false,
              admins: true,
            },
          },
        },
      },
    },

    reactions: {
      schema: schemas.ReactionSchema,
      routerOptions: {
        auth: {
          protectedRoutes: ["addOne", "addMany", "updateOneById", "updateMany", "deleteById", "deleteMany"],
          collectionAccess: {
            accessDefault: false,
            collections: {
              users: true,
              admins: true,
            },
          },
        },
      },
    },

    favorites: {
      schema: schemas.FavoriteSchema,
      routerOptions: {
        auth: {
          protectedRoutes: true,
          collectionAccess: {
            accessDefault: false,
            collections: {
              users: true,
              admins: true,
            },
          },
        },
      },
    },

    carts: {
      schema: schemas.CartSchema,
      routerOptions: {
        auth: {
          protectedRoutes: true,
          collectionAccess: {
            accessDefault: false,
            collections: {
              users: true,
              admins: true,
            },
          },
        },
      },
    },

    orders: {
      schema: schemas.OrderSchema,
      routerOptions: {
        auth: {
          protectedRoutes: true,
          collectionAccess: {
            accessDefault: false,
            collections: {
              users: true,
              admins: true,
            },
          },
        },
      },
    },
  },

  // Global router options
  routerOptions: {
    auth: {
      authMiddlewareOptions: {
        secret: config.jwt.secret,
      },
    },
  },

  otherRoutes: [
    {
      method: "GET",
      path: "/all-users-info",
      handler: async (req, res, next) => {
        try {
          const UsersModel = db.models.users;
          const users = await UsersModel.getAll({ fields: { password_hash: 0, created_at: 0 } });

          res.json({
            success: true,
            data: users,
          });
        } catch (error) {
          next(error);
        }
      },
    },
  ],

  // Server configuration
  serverOptions: {
    port: config.server.port,
  },
});

// Start the server
db.start(() => {
  console.log(`GearUp API Server is running on port ${config.server.port}`);
});
