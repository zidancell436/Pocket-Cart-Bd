import { Product } from '../types';

export const INITIAL_PRODUCTS: Omit<Product, 'id'>[] = [
  { 
    name: "Men's Premium Casual Cotton Shirt", 
    category: "mens", 
    price: 850, 
    oldPrice: 1200, 
    img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Premium quality 100% cotton casual shirt designed for modern comfort. Breathable fabric, tailored fit, perfect for daily wear and formal outings.",
    colors: ["White", "Black", "Navy Blue", "Red"],
    colorImages: {
      "White": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
      "Black": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
      "Navy Blue": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
      "Red": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80"
    },
    sizes: ["M", "L", "XL"]
  },
  { 
    name: "Women's Elegant Embroidered Three-Piece", 
    category: "womens", 
    price: 1650, 
    oldPrice: 2200, 
    img: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Elegant embroidered three-piece suit made with premium fabric. Comfortable, stylish, and perfect for festive occasions, parties, and everyday traditional look.",
    colors: ["White", "Maroon", "Red", "Pink"],
    colorImages: {
      "White": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
      "Maroon": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80",
      "Red": "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
      "Pink": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
    },
    sizes: ["Free Size", "Semi-Long"]
  },
  { 
    name: "Modern LED Living Room Wall Decor Lamp", 
    category: "home", 
    price: 1450, 
    oldPrice: 1900, 
    img: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Modern LED wall decor lamp that adds a touch of elegance to your living room or bedroom. Energy efficient with warm and cool light options.",
    colors: ["White", "Warm White", "Cool White"],
    colorImages: {
      "White": "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80",
      "Warm White": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
      "Cool White": "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=800&q=80"
    },
    sizes: ["Standard"]
  },
  { 
    name: "Stainless Steel Kitchen Blender & Chopper", 
    category: "kitchen", 
    price: 1750, 
    oldPrice: 2400, 
    img: "https://images.unsplash.com/photo-1570222094114-d074f7e1e6e0?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1570222094114-d074f7e1e6e0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80"
    ],
    description: "High-performance stainless steel kitchen blender and chopper. Durable blades, easy to clean, ideal for quick cooking and meal prep.",
    colors: ["White", "Silver", "Black"],
    colorImages: {
      "White": "https://images.unsplash.com/photo-1570222094114-d074f7e1e6e0?auto=format&fit=crop&w=800&q=80",
      "Silver": "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80",
      "Black": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80"
    },
    sizes: ["Standard"]
  },
  { 
    name: "Surprise Tech & Gadget Mystery Box", 
    category: "mysterybox", 
    price: 999, 
    oldPrice: 1500, 
    img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80"
    ],
    description: "A mysterious box packed with amazing high-value tech gadgets and accessories. Get more value than what you pay for!",
    colors: ["Standard"],
    colorImages: {
      "Standard": "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80"
    },
    sizes: ["Mystery Size"]
  },
  { 
    name: "Ultra Series 8 Smart Watch with Amoled Display", 
    category: "gadgets", 
    price: 1850, 
    oldPrice: 2500, 
    img: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Ultra Series 8 Smart Watch featuring a vivid AMOLED display, fitness tracking, heart rate monitor, Bluetooth calling, and long battery life.",
    colors: ["Black", "Silver", "Orange"],
    colorImages: {
      "Black": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
      "Silver": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      "Orange": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80"
    },
    sizes: ["Free Size"]
  }
];
