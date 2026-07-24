import React, { useEffect, useState, useRef } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  writeBatch,
  setDoc,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { Product, CartItem, Order, UserAccount } from './types';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import logoImg from './assets/images/pocket_cart_logo_1784818643788.jpg';

// Default image fallbacks
const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
const DEFAULT_LOGO_IMAGE = logoImg;

// Master Category Definitions with custom ball gradient themes and icons
const CATEGORIES_LIST = [
  { key: 'all', label: 'All Items', icon: '🔥', bg: 'from-emerald-500 to-teal-600' },
  { key: 'mens', label: "Men's Fashion", icon: '👔', bg: 'from-blue-600 to-indigo-600' },
  { key: 'womens', label: "Women's Fashion", icon: '👗', bg: 'from-pink-500 to-rose-500' },
  { key: 'gadgets', label: 'Gadgets & Tech', icon: '⚡', bg: 'from-purple-600 to-cyan-500' },
  { key: 'home', label: 'Home Living', icon: '🏡', bg: 'from-teal-600 to-emerald-600' },
  { key: 'kitchen', label: 'Kitchen Ware', icon: '🍳', bg: 'from-amber-500 to-orange-600' },
  { key: 'mysterybox', label: 'Mystery Box', icon: '🎁', bg: 'from-rose-600 to-red-600' },
  { key: 'footwear', label: 'Shoes & Boots', icon: '👟', bg: 'from-sky-600 to-blue-700' },
  { key: 'beauty', label: 'Beauty & Care', icon: '💄', bg: 'from-fuchsia-600 to-pink-600' },
  { key: 'bags', label: 'Bags & Luggage', icon: '🎒', bg: 'from-yellow-600 to-amber-600' },
];

// Color Code Helper function
function getColorCode(colorName: string): string {
  const name = colorName.trim().toLowerCase();
  const colorsMap: Record<string, string> = {
    'white': '#ffffff',
    'black': '#000000',
    'red': '#ef4444',
    'blue': '#3b82f6',
    'green': '#10b981',
    'navy blue': '#1e3a8a',
    'navy': '#1e3a8a',
    'pink': '#ec4899',
    'yellow': '#eab308',
    'orange': '#f97316',
    'purple': '#a855f7',
    'gray': '#6b7280',
    'grey': '#6b7280',
    'silver': '#94a3b8',
    'maroon': '#831843',
    'standard': '#10b981',
    'warm white': '#fef08a',
    'cool white': '#e0f2fe'
  };
  return colorsMap[name] || '#cbd5e1';
}

export default function App() {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

  // Filters & Search
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState<boolean>(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Product Detail View
  const [activeDetailProduct, setActiveDetailProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('White');
  const [selectedSize, setSelectedSize] = useState<string>('Free Size');
  const [detailQty, setDetailQty] = useState<number>(1);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState<boolean>(false);

  // Modals & Auth State
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<'upload' | 'orders'>('upload');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string>('');
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  // Form states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [regName, setRegName] = useState('');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regPass, setRegPass] = useState('');

  // Checkout Form
  const [chkName, setChkName] = useState('');
  const [chkPhone, setChkPhone] = useState('');
  const [chkAddress, setChkAddress] = useState('');
  const [shippingFee, setShippingFee] = useState<number>(60);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash on Delivery');

  // Admin Upload Form (Multi-photo enabled)
  const [newProdName, setNewProdName] = useState('');
  const [newProdCat, setNewProdCat] = useState('mens');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdOldPrice, setNewProdOldPrice] = useState('');
  const [newProdColors, setNewProdColors] = useState('');
  const [newProdSizes, setNewProdSizes] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdFiles, setNewProdFiles] = useState<File[]>([]);
  const [newProdImageUrls, setNewProdImageUrls] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    document.title = "Pocket Cart BD - All-In-One Market Experience";
  }, []);

  // 1. Live Firestore Listener for Products
  useEffect(() => {
    const productsRef = collection(db, 'products');
    const unsubscribe = onSnapshot(productsRef, async (snapshot) => {
      if (snapshot.empty) {
        // Auto-seed initial products to Firestore if collection is empty
        try {
          const batch = writeBatch(db);
          INITIAL_PRODUCTS.forEach((p) => {
            const docRef = doc(collection(db, 'products'));
            batch.set(docRef, { ...p, createdAt: Date.now() });
          });
          await batch.commit();
        } catch (err) {
          console.error("Error seeding initial products:", err);
        }
      } else {
        const loaded: Product[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();

          // Compile product images list
          let productImagesList: string[] = [];
          if (Array.isArray(data.images) && data.images.length > 0) {
            productImagesList = data.images.filter(Boolean);
          } else {
            if (data.colorImages && typeof data.colorImages === 'object') {
              const colValues = Object.values(data.colorImages) as string[];
              if (colValues.length > 0) {
                productImagesList = colValues.filter(Boolean);
              }
            }
            if (productImagesList.length === 0 && data.img) {
              productImagesList = [data.img];
            }
          }

          loaded.push({
            id: docSnap.id,
            name: data.name || '',
            category: data.category || 'mens',
            price: Number(data.price || 0),
            oldPrice: data.oldPrice ? Number(data.oldPrice) : null,
            img: data.img || DEFAULT_FALLBACK_IMAGE,
            images: productImagesList.length > 0 ? productImagesList : [data.img || DEFAULT_FALLBACK_IMAGE],
            description: data.description || '',
            colors: Array.isArray(data.colors) ? data.colors : ['White'],
            colorImages: data.colorImages || {},
            sizes: Array.isArray(data.sizes) ? data.sizes : ['Free Size'],
            createdAt: data.createdAt || 0
          });
        });
        setProducts(loaded);
        setLoadingProducts(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Live Firestore Listener for Orders
  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const loaded: Order[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loaded.push({
          id: docSnap.id,
          orderId: data.orderId || 'ORD-' + docSnap.id.slice(0, 6),
          date: data.date || new Date().toLocaleString(),
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
          shippingFee: Number(data.shippingFee || 60),
          paymentMethod: data.paymentMethod || 'Cash on Delivery',
          items: data.items || [],
          subtotal: Number(data.subtotal || 0),
          total: Number(data.total || 0),
          createdAt: data.createdAt || Date.now()
        });
      });
      loaded.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setOrders(loaded);
    });

    return () => unsubscribe();
  }, []);

  // 3. User Persistence & Firebase Auth Listener
  useEffect(() => {
    const savedUser = localStorage.getItem('pocket_current_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const emailLower = (fbUser.email || '').toLowerCase();
        const isAdmin = emailLower === 'pocketcartbd@gmail.com' || emailLower === 'admin@pocketcartbd.com';
        const userAcc: UserAccount = {
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Customer',
          identifier: fbUser.email || fbUser.phoneNumber || fbUser.uid,
          isAdmin,
          photoURL: fbUser.photoURL || undefined
        };
        setCurrentUser(userAcc);
        localStorage.setItem('pocket_current_user', JSON.stringify(userAcc));
      }
    });

    return () => unsubscribe();
  }, []);

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setAuthError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      const emailLower = (fbUser.email || '').toLowerCase();
      const isAdmin = emailLower === 'pocketcartbd@gmail.com' || emailLower === 'admin@pocketcartbd.com';
      const userAcc: UserAccount = {
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Customer',
        identifier: fbUser.email || fbUser.uid,
        isAdmin,
        photoURL: fbUser.photoURL || undefined
      };
      setCurrentUser(userAcc);
      localStorage.setItem('pocket_current_user', JSON.stringify(userAcc));

      // Sync user profile to Firestore
      try {
        await setDoc(doc(db, 'users', fbUser.uid), {
          uid: fbUser.uid,
          name: fbUser.displayName,
          email: fbUser.email,
          photoURL: fbUser.photoURL,
          lastLogin: Date.now()
        }, { merge: true });
      } catch (fErr) {
        console.warn("Firestore user sync note:", fErr);
      }

      setIsLoginOpen(false);
      setIsRegisterOpen(false);
      alert(`Welcome, ${fbUser.displayName || 'Customer'}! Signed in with Google.`);
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      if (err.code === 'auth/popup-blocked') {
        setAuthError("Popup blocked by browser. Please allow popups for Google Sign-In.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setAuthError("Google Sign-In popup closed before completing.");
      } else {
        setAuthError(err.message || "Google Sign-In failed. Please try again.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Predictive search live results for instant dropdown
  const predictiveSearchResults = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 6)
    : [];

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Helper to compile deduplicated list of all product images
  const getProductGalleryImages = (product: Product | null): string[] => {
    if (!product) return [DEFAULT_FALLBACK_IMAGE];
    const list: string[] = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach((img) => img && !list.includes(img) && list.push(img));
    }
    if (product.img && !list.includes(product.img)) {
      list.push(product.img);
    }
    if (product.colorImages) {
      Object.values(product.colorImages).forEach((img) => img && !list.includes(img) && list.push(img));
    }
    return list.length > 0 ? list : [DEFAULT_FALLBACK_IMAGE];
  };

  // Open Product Details
  const handleOpenProductDetails = (product: Product) => {
    setActiveDetailProduct(product);
    const firstColor = product.colors && product.colors.length > 0 ? product.colors[0] : 'White';
    const firstSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Free Size';
    setSelectedColor(firstColor);
    setSelectedSize(firstSize);
    setDetailQty(1);
    setSelectedPhotoIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShowHome = () => {
    setActiveDetailProduct(null);
  };

  // Cart operations
  const addToCartWithOptions = (product: Product, color: string, size: string, qty: number) => {
    const cartKey = `${product.id}-${color}-${size}`;
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.cartKey === cartKey);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].qty += qty;
        return updated;
      } else {
        return [
          ...prev,
          {
            cartKey,
            id: product.id,
            name: product.name,
            img: (product.colorImages && product.colorImages[color]) || product.img,
            price: product.price,
            color,
            size,
            qty
          }
        ];
      }
    });
    setIsCartOpen(true);
  };

  const addToCartDirect = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const defColor = product.colors && product.colors.length > 0 ? product.colors[0] : 'White';
    const defSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Free Size';
    addToCartWithOptions(product, defColor, defSize, 1);
  };

  const buyNowDirect = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const defColor = product.colors && product.colors.length > 0 ? product.colors[0] : 'White';
    const defSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Free Size';
    addToCartWithOptions(product, defColor, defSize, 1);
    handleProceedToCheckout();
  };

  const updateCartItemQty = (cartKey: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartKey === cartKey) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (cartKey: string) => {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Checkout Process (Saves directly to Firestore collection: orders)
  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      alert('Please add at least one product to the cart!');
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);

    if (currentUser && !currentUser.isAdmin) {
      setChkName(currentUser.name || '');
      if (!currentUser.identifier.includes('@')) {
        setChkPhone(currentUser.identifier || '');
      }
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chkName || !chkPhone || !chkAddress) return;

    const subtotal = cartSubtotal;
    const total = subtotal + shippingFee;
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    const newOrderData = {
      orderId,
      date: new Date().toLocaleString(),
      name: chkName,
      phone: chkPhone,
      address: chkAddress,
      shippingFee,
      paymentMethod,
      items: cart,
      subtotal,
      total,
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, 'orders'), newOrderData);
      alert('Congratulations! Your order has been placed successfully in Firestore. Pocket Cart BD team will contact you soon. Hotline: 01926951361');
      setCart([]);
      setIsCheckoutOpen(false);
      setChkName('');
      setChkPhone('');
      setChkAddress('');
    } catch (err) {
      console.error("Error submitting order to Firestore:", err);
      alert("Error saving order to database. Please try again.");
    }
  };

  // Auth Operations
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const id = loginIdentifier.trim().toLowerCase();
    const pass = loginPass.trim();

    if (id === 'admin' && pass === 'admin123') {
      const adminUser: UserAccount = { name: 'Admin', identifier: 'admin', isAdmin: true };
      setCurrentUser(adminUser);
      localStorage.setItem('pocket_current_user', JSON.stringify(adminUser));
      alert('Successfully logged in as Admin!');
      setIsLoginOpen(false);
      setLoginIdentifier('');
      setLoginPass('');
      return;
    }

    const regUsers = JSON.parse(localStorage.getItem('pocket_users') || '[]');
    const user = regUsers.find((u: any) => u.identifier === id && u.password === pass);
    if (user) {
      const standardUser: UserAccount = { name: user.name, identifier: user.identifier, isAdmin: false };
      setCurrentUser(standardUser);
      localStorage.setItem('pocket_current_user', JSON.stringify(standardUser));
      alert(`Welcome back, ${user.name}!`);
      setIsLoginOpen(false);
      setLoginIdentifier('');
      setLoginPass('');
    } else {
      alert('Invalid email/phone or password. Please register if you do not have an account.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const name = regName.trim();
    const id = regIdentifier.trim().toLowerCase();
    const pass = regPass.trim();

    const regUsers = JSON.parse(localStorage.getItem('pocket_users') || '[]');
    const existing = regUsers.find((u: any) => u.identifier === id);
    if (existing) {
      alert('An account with this email or phone number already exists!');
      return;
    }

    const newUserObj = { name, identifier: id, password: pass, isAdmin: false };
    regUsers.push(newUserObj);
    localStorage.setItem('pocket_users', JSON.stringify(regUsers));

    const userAcc: UserAccount = { name, identifier: id, isAdmin: false };
    setCurrentUser(userAcc);
    localStorage.setItem('pocket_current_user', JSON.stringify(userAcc));

    alert(`Registration successful! Welcome, ${name}`);
    setIsRegisterOpen(false);
    setRegName('');
    setRegIdentifier('');
    setRegPass('');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Signout error:", e);
    }
    setCurrentUser(null);
    localStorage.removeItem('pocket_current_user');
    alert('Successfully logged out!');
  };

  // Admin Product Upload (Saves to Firestore collection: products)
  const handleProductUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) return;

    setIsUploading(true);

    const price = Number(newProdPrice);
    const oldPrice = newProdOldPrice ? Number(newProdOldPrice) : null;
    const description = newProdDesc.trim() || 'No description provided.';
    const colors = newProdColors.trim()
      ? newProdColors.split(',').map((c) => c.trim()).filter(Boolean)
      : ['White'];
    const sizes = newProdSizes.trim()
      ? newProdSizes.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Free Size'];

    const uploadedImagesList: string[] = [];

    // 1. Process uploaded files if any
    if (newProdFiles && newProdFiles.length > 0) {
      for (let i = 0; i < newProdFiles.length; i++) {
        const file = newProdFiles[i];
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve((ev.target?.result as string) || '');
          reader.readAsDataURL(file);
        });
        if (dataUrl) uploadedImagesList.push(dataUrl);
      }
    }

    // 2. Process image URLs entered into textarea (comma or newline separated)
    if (newProdImageUrls.trim()) {
      const urls = newProdImageUrls
        .split(/[\n,]+/)
        .map((u) => u.trim())
        .filter((u) => u.length > 5);
      uploadedImagesList.push(...urls);
    }

    // Fallback image if none uploaded
    if (uploadedImagesList.length === 0) {
      uploadedImagesList.push(
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'
      );
    }

    const mainImg = uploadedImagesList[0];

    const colorImagesMap: Record<string, string> = {};
    colors.forEach((col, idx) => {
      colorImagesMap[col] = uploadedImagesList[idx] || mainImg;
    });

    const newDoc = {
      name: newProdName,
      category: newProdCat,
      price,
      oldPrice,
      description,
      img: mainImg,
      images: uploadedImagesList,
      colors,
      colorImages: colorImagesMap,
      sizes,
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, 'products'), newDoc);
      alert(`Success! Product created with ${uploadedImagesList.length} photos and saved to Firestore database.`);
      setIsAdminModalOpen(false);

      setNewProdName('');
      setNewProdPrice('');
      setNewProdOldPrice('');
      setNewProdDesc('');
      setNewProdColors('');
      setNewProdSizes('');
      setNewProdFiles([]);
      setNewProdImageUrls('');
    } catch (err) {
      console.error("Error uploading product to Firestore:", err);
      alert("Failed to save product to Firestore.");
    } finally {
      setIsUploading(false);
    }
  };

  // Admin Delete Product
  const handleDeleteProduct = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this product from Firestore?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (err) {
        console.error("Error deleting product from Firestore:", err);
      }
    }
  };

  // Admin Delete Order
  const handleDeleteOrder = async (orderDocId: string) => {
    if (confirm('Are you sure you want to delete this order record?')) {
      try {
        await deleteDoc(doc(db, 'orders', orderDocId));
      } catch (err) {
        console.error("Error deleting order from Firestore:", err);
      }
    }
  };

  // Admin Clear All Orders
  const handleClearAllOrders = async () => {
    if (confirm('Are you sure you want to clear all order history from Firestore?')) {
      try {
        const batch = writeBatch(db);
        orders.forEach((o) => {
          batch.delete(doc(db, 'orders', o.id));
        });
        await batch.commit();
      } catch (err) {
        console.error("Error clearing orders from Firestore:", err);
      }
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white min-h-screen flex flex-col font-sans">
      {/* Top Bar - Account & Authentication Navigation */}
      <div className="bg-slate-950/90 text-white text-xs py-1.5 px-3 sm:px-4 border-b border-slate-800/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-end items-center">
          <div className="flex gap-3 items-center font-medium text-xs">
            {currentUser && (
              <div className="flex items-center gap-1.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.name}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-emerald-400/50 object-cover"
                  />
                ) : (
                  <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-600 text-white text-[9px] sm:text-[10px] font-extrabold flex items-center justify-center">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="text-[11px] sm:text-xs font-semibold text-emerald-200">
                  {currentUser.name} {currentUser.isAdmin && '(Admin)'}
                </span>
              </div>
            )}
            {!currentUser ? (
              <div className="flex items-center gap-2 text-[11px] sm:text-xs">
                <button
                  onClick={() => {
                    setAuthModalTab('login');
                    setIsLoginOpen(true);
                  }}
                  className="hover:text-emerald-300 transition font-medium"
                >
                  Login
                </button>
                <span className="opacity-40">|</span>
                <button
                  onClick={() => {
                    setAuthModalTab('register');
                    setIsLoginOpen(true);
                  }}
                  className="hover:text-emerald-300 transition font-medium"
                >
                  Register
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="hover:text-emerald-300 transition text-emerald-300 font-semibold text-[11px] sm:text-xs"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Header */}
      <header className="bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-800/80 transition-all shadow-xl shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3 sm:gap-6">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group shrink-0"
            onClick={handleShowHome}
          >
            <img
              src={DEFAULT_LOGO_IMAGE}
              alt="Pocket Cart BD Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-xl sm:rounded-2xl shadow-lg shadow-blue-900/50 group-hover:scale-105 transition-transform bg-white p-0.5 border border-blue-500/30"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_LOGO_IMAGE;
              }}
            />
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-none flex items-center gap-1">
                Pocket Cart{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  BD
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              </h1>
              <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold tracking-widest uppercase">
                All In One Market
              </span>
            </div>
          </div>

          {/* Desktop Search Bar with Instant Predictive Search */}
          <div className="flex-1 max-w-xl relative hidden md:block">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder="Search products by name, category..."
                className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl py-2.5 pl-4 pr-20 focus:outline-none focus:bg-slate-950 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 text-sm text-white placeholder-slate-400 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-14 text-slate-400 hover:text-white text-xs font-bold p-1"
                >
                  ✕
                </button>
              )}
              <div className="absolute right-1 top-1 bottom-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 rounded-xl text-xs font-bold flex items-center justify-center">
                🔍
              </div>
            </div>

            {/* Predictive Search Dropdown */}
            {isSearchFocused && searchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 px-3 py-1 flex justify-between items-center border-b border-slate-800">
                  <span>Search Suggestions</span>
                  <button
                    onClick={() => setIsSearchFocused(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Close ✕
                  </button>
                </div>
                {predictiveSearchResults.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 px-3 text-center">
                    No products matching "<strong className="text-emerald-400">{searchQuery}</strong>"
                  </p>
                ) : (
                  predictiveSearchResults.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        handleOpenProductDetails(prod);
                        setIsSearchFocused(false);
                      }}
                      className="flex items-center gap-3 p-2 hover:bg-slate-800/80 rounded-xl cursor-pointer transition"
                    >
                      <img
                        src={prod.img || DEFAULT_FALLBACK_IMAGE}
                        alt={prod.name}
                        className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">
                          {prod.name}
                        </p>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase">
                          {prod.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-400">
                          TK {prod.price}
                        </span>
                        {prod.oldPrice && (
                          <span className="text-[10px] text-slate-500 line-through block">
                            TK {prod.oldPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsCategoryMenuOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl transition border border-slate-700/80 font-extrabold text-xs shadow-sm"
              title="Open Category Menu"
            >
              <span>☰</span>
              <span className="hidden sm:inline">Categories</span>
            </button>

            {currentUser?.isAdmin && (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="bg-purple-950/90 text-purple-200 text-xs px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl font-bold border border-purple-800/80 hover:bg-purple-900 transition flex items-center gap-1.5 shadow-md"
              >
                <span>⚙️</span> <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition border border-slate-700/80 relative group shadow-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <span className="text-xs font-bold hidden sm:inline">Cart</span>
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-extrabold shadow-lg shadow-emerald-600/50">
                {totalCartCount}
              </span>
            </button>

            {/* Login / Register or Account Button in Header */}
            {!currentUser ? (
              <button
                onClick={() => {
                  setAuthModalTab('login');
                  setIsLoginOpen(true);
                }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl font-extrabold transition shadow-md hover:opacity-95 flex items-center gap-1.5"
              >
                <span>🔐</span>
                <span className="hidden sm:inline">Login / Register</span>
                <span className="sm:hidden">Login</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAccountModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl font-bold transition border border-emerald-500/40 flex items-center gap-2 shadow-sm"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.name}
                    className="w-5 h-5 rounded-full object-cover border border-emerald-400"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden sm:inline font-semibold text-white">
                  {currentUser.name.split(' ')[0]}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar with Instant Suggestions */}
        <div className="px-4 pb-3 md:hidden relative">
          <div className="relative flex items-center">
            <input
              id="mobile-search-input"
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              placeholder="Search products by name or category..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2 pl-3 pr-16 text-xs text-white focus:outline-none focus:border-emerald-500 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-10 text-slate-400 text-xs font-bold p-1"
              >
                ✕
              </button>
            )}
            <span className="absolute right-2 text-xs text-emerald-400">🔍</span>
          </div>

          {/* Mobile Predictive Search Dropdown */}
          {isSearchFocused && searchQuery.trim() !== '' && (
            <div className="absolute top-full left-4 right-4 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 p-2 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 flex justify-between items-center border-b border-slate-800">
                <span>Search Suggestions</span>
                <button
                  onClick={() => setIsSearchFocused(false)}
                  className="text-slate-400 text-[10px]"
                >
                  Close ✕
                </button>
              </div>
              {predictiveSearchResults.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No products found for "<strong className="text-emerald-400">{searchQuery}</strong>"
                </p>
              ) : (
                predictiveSearchResults.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      handleOpenProductDetails(prod);
                      setIsSearchFocused(false);
                    }}
                    className="flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition"
                  >
                    <img
                      src={prod.img || DEFAULT_FALLBACK_IMAGE}
                      alt={prod.name}
                      className="w-9 h-9 object-cover rounded border border-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{prod.name}</p>
                      <span className="text-[9px] text-emerald-400 font-bold uppercase">
                        {prod.category}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-400">
                      TK {prod.price}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Dynamic Content Container */}
      {!activeDetailProduct ? (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 mt-3 sm:mt-6 space-y-3 sm:space-y-6 flex-1 w-full">
          {/* Category Balls Horizontal Sliding Carousel Section - Compact Mobile Sizing */}
          <section
            id="category-section"
            className="bg-slate-900/80 backdrop-blur-md p-3 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-800/90 relative group"
          >
            <div className="flex justify-between items-center mb-2.5 sm:mb-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                <h3 className="text-sm sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  <span>Shop By Category</span>
                </h3>
                <span className="text-[11px] text-slate-400 hidden sm:inline font-medium">
                  • Slide to filter
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setIsCategoryMenuOpen(true)}
                  className="text-[11px] sm:text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-slate-950/80 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-slate-800 transition mr-0.5 shadow-sm"
                >
                  <span>Menu ☰</span>
                </button>
                <button
                  onClick={() => scrollCategories('left')}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-950 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-emerald-600 hover:border-emerald-500 flex items-center justify-center font-bold text-xs sm:text-sm shadow-md transition"
                  title="Slide Left"
                >
                  ‹
                </button>
                <button
                  onClick={() => scrollCategories('right')}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-950 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-emerald-600 hover:border-emerald-500 flex items-center justify-center font-bold text-xs sm:text-sm shadow-md transition"
                  title="Slide Right"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Sliding Category Balls Container - Lower size for mobile users */}
            <div
              ref={categoryScrollRef}
              className="flex items-center gap-2.5 sm:gap-6 overflow-x-auto scrollbar-none py-1.5 px-0.5 scroll-smooth"
            >
              {CATEGORIES_LIST.map((cat) => {
                const isActive = activeCategory === cat.key;
                const prodCount =
                  cat.key === 'all'
                    ? products.length
                    : products.filter((p) => p.category === cat.key).length;

                return (
                  <button
                    key={cat.key}
                    onClick={() => {
                      setActiveCategory(cat.key);
                      setSearchQuery('');
                    }}
                    className="flex flex-col items-center group/ball shrink-0 focus:outline-none transition-transform duration-200 cursor-pointer"
                  >
                    {/* Circle Ball Avatar - Compact 48px on mobile, 80px on desktop */}
                    <div
                      className={`w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-xl sm:text-3xl transition-all duration-300 relative shadow-md ${
                        isActive
                          ? 'bg-gradient-to-br ' + cat.bg + ' ring-2 sm:ring-4 ring-emerald-400/60 scale-105 shadow-emerald-500/30'
                          : 'bg-slate-950/90 border-2 border-slate-800 group-hover/ball:border-emerald-400/80 group-hover/ball:scale-105 group-hover/ball:shadow-emerald-500/20'
                      }`}
                    >
                      <span className="drop-shadow-md select-none">{cat.icon}</span>
                      {isActive && (
                        <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-400 text-slate-950 text-[8px] sm:text-[10px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-black border-2 border-slate-900 shadow">
                          ✓
                        </span>
                      )}
                    </div>

                    {/* Category Label */}
                    <span
                      className={`mt-1.5 text-[10px] sm:text-xs font-bold transition tracking-tight text-center max-w-[62px] sm:max-w-[90px] leading-tight truncate ${
                        isActive ? 'text-emerald-400 font-extrabold' : 'text-slate-300 group-hover/ball:text-white'
                      }`}
                    >
                      {cat.label}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5">
                      ({prodCount})
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Product Section */}
          <section className="bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-5 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="bg-emerald-500/10 text-emerald-400 text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider inline-block border border-emerald-500/20">
                    ⚡ Trending Store
                  </span>
                  {activeCategory !== 'all' && (
                    <span className="bg-blue-500/10 text-blue-400 text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider inline-block border border-blue-500/20">
                      Category: {CATEGORIES_LIST.find((c) => c.key === activeCategory)?.label}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {activeCategory === 'all'
                    ? 'Featured Products'
                    : CATEGORIES_LIST.find((c) => c.key === activeCategory)?.label || 'Products'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Explore our handpicked collection with instant nationwide delivery
                </p>
              </div>

              {/* Category Controls */}
              <div className="flex items-center gap-2">
                {activeCategory !== 'all' && (
                  <button
                    onClick={() => setActiveCategory('all')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl font-bold transition flex items-center gap-1 border border-slate-700"
                  >
                    <span>✕ Clear Filter</span>
                  </button>
                )}
                <button
                  onClick={() => setIsCategoryMenuOpen(true)}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs px-4 py-2 rounded-xl font-bold transition shadow-md flex items-center gap-1.5 hover:opacity-90"
                >
                  <span>All Categories ☰</span>
                </button>
              </div>
            </div>

            {/* Product Grid */}
            {loadingProducts ? (
              <div className="py-16 text-center text-slate-400">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-medium">Loading products from Firestore...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className="col-span-full text-center text-slate-400 py-16 text-sm font-medium">
                No products found matching your search!
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="group bg-slate-900 rounded-2xl border border-slate-800 shadow-md hover:shadow-2xl hover:border-emerald-500/50 transition-all duration-300 overflow-hidden flex flex-col justify-between relative"
                  >
                    {currentUser?.isAdmin && (
                      <button
                        onClick={(e) => handleDeleteProduct(e, p.id)}
                        className="absolute top-2.5 right-2.5 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-md hover:bg-rose-700 z-10"
                      >
                        Delete
                      </button>
                    )}

                    <div
                      onClick={() => handleOpenProductDetails(p)}
                      className="cursor-pointer overflow-hidden relative bg-slate-950 aspect-square"
                    >
                      <img
                        src={p.img || DEFAULT_FALLBACK_IMAGE}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                        }}
                      />
                      {p.oldPrice && (
                        <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                          Sale
                        </span>
                      )}
                      {p.images && p.images.length > 1 && (
                        <span className="absolute bottom-2.5 right-2.5 bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                          <span>📷</span> {p.images.length} photos
                        </span>
                      )}
                    </div>

                    <div
                      onClick={() => handleOpenProductDetails(p)}
                      className="p-4 cursor-pointer flex-1 flex flex-col justify-between"
                    >
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-200 line-clamp-2 group-hover:text-emerald-400 transition">
                        {p.name}
                      </h4>
                      <div className="mt-3">
                        <div className="text-emerald-400 font-extrabold text-sm sm:text-base">
                          TK {p.price}{' '}
                          {p.oldPrice && (
                            <span className="text-slate-500 line-through text-xs font-normal ml-1">
                              TK {p.oldPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 pt-0 grid grid-cols-2 gap-2 bg-slate-900">
                      <button
                        onClick={(e) => addToCartDirect(e, p)}
                        className="bg-amber-500 text-slate-950 text-[11px] py-2 px-1 rounded-xl font-extrabold hover:bg-amber-400 transition shadow-sm flex items-center justify-center gap-1"
                      >
                        <span>🛒</span> Cart
                      </button>
                      <button
                        onClick={(e) => buyNowDirect(e, p)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] py-2 px-1 rounded-xl font-bold hover:opacity-95 transition shadow-sm flex items-center justify-center gap-1"
                      >
                        <span>⚡</span> Buy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Attractive Promo Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-emerald-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center border border-blue-700/30">
            <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl">
              <span className="bg-white/15 backdrop-blur-md text-emerald-300 text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider inline-block mb-4 border border-white/20">
                ✨ Smart Online Store 2026
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold mb-3 tracking-tight leading-tight">
                All-In-One Market Experience with Pocket Cart BD
              </h2>
              <p className="text-sm sm:text-base mb-6 text-slate-200 font-medium leading-relaxed">
                Fast Nationwide Delivery • Inside Dhaka 60 TK, Outside Dhaka 120 TK. Order today and
                experience premium quality.
              </p>
              <div>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="bg-emerald-500 text-slate-950 font-extrabold px-8 py-4 rounded-2xl shadow-xl hover:bg-emerald-400 transition transform hover:-translate-y-0.5 text-sm"
                >
                  Explore All Collections
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Product Details View with Multi-Photo Interactive Gallery & Custom Layout */
        (() => {
          const galleryImages = getProductGalleryImages(activeDetailProduct);
          const activePhotoUrl =
            galleryImages[selectedPhotoIndex] || galleryImages[0] || DEFAULT_FALLBACK_IMAGE;

          const oldPriceVal = activeDetailProduct.oldPrice || 0;
          const hasDiscount = oldPriceVal > activeDetailProduct.price;
          const discountPercent = hasDiscount
            ? Math.round(((oldPriceVal - activeDetailProduct.price) / oldPriceVal) * 100)
            : 0;
          const savingsAmount = hasDiscount ? oldPriceVal - activeDetailProduct.price : 0;

          const whatsappMessage = encodeURIComponent(
            `Hi Pocket Cart BD, I want to order:\nProduct: ${activeDetailProduct.name}\nColor: ${selectedColor}\nSize: ${selectedSize}\nQty: ${detailQty}\nPrice: TK ${activeDetailProduct.price * detailQty}`
          );

          return (
            <div className="max-w-7xl mx-auto px-4 mt-6 flex-1 w-full pb-12">
              {/* Back Button */}
              <button
                onClick={handleShowHome}
                className="mb-5 bg-slate-900 border border-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-md flex items-center gap-2 w-max group"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Store
              </button>

              <div className="bg-slate-900/90 backdrop-blur-md p-6 sm:p-10 rounded-3xl shadow-2xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                {/* Left Column: Interactive Multi-Photo Gallery (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Featured Photo Display */}
                  <div className="bg-slate-950 rounded-3xl p-3 sm:p-4 border border-slate-800 relative overflow-hidden group shadow-inner">
                    <div className="relative h-80 sm:h-[460px] w-full flex items-center justify-center rounded-2xl overflow-hidden bg-black/40">
                      <img
                        src={activePhotoUrl}
                        alt={activeDetailProduct.name}
                        className="w-full h-full object-cover rounded-2xl shadow-xl transition-all duration-300 cursor-zoom-in"
                        onClick={() => setIsImageZoomOpen(true)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                        }}
                      />

                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {hasDiscount && (
                          <span className="bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-black px-3 py-1 rounded-xl shadow-lg border border-rose-400/40 animate-pulse">
                            🔥 SAVE {discountPercent}% OFF
                          </span>
                        )}
                        <span className="bg-emerald-950/90 backdrop-blur-md text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-3 py-1 rounded-xl shadow-md">
                          In Stock & Quality Checked
                        </span>
                      </div>

                      {/* Top Right Zoom Button */}
                      <button
                        onClick={() => setIsImageZoomOpen(true)}
                        className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg backdrop-blur-md transition flex items-center gap-1.5"
                        title="Click to Zoom Fullscreen"
                      >
                        <span>🔍</span> Zoom
                      </button>

                      {/* Left / Right Gallery Navigation Arrows */}
                      {galleryImages.length > 1 && (
                        <>
                          <button
                            onClick={() =>
                              setSelectedPhotoIndex(
                                (prev) => (prev - 1 + galleryImages.length) % galleryImages.length
                              )
                            }
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/90 hover:bg-emerald-600 text-white border border-slate-700 hover:border-emerald-500 flex items-center justify-center font-black text-lg shadow-2xl transition opacity-90 hover:opacity-100 hover:scale-110"
                            title="Previous Photo"
                          >
                            ‹
                          </button>
                          <button
                            onClick={() =>
                              setSelectedPhotoIndex((prev) => (prev + 1) % galleryImages.length)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/90 hover:bg-emerald-600 text-white border border-slate-700 hover:border-emerald-500 flex items-center justify-center font-black text-lg shadow-2xl transition opacity-90 hover:opacity-100 hover:scale-110"
                            title="Next Photo"
                          >
                            ›
                          </button>
                        </>
                      )}

                      {/* Bottom Photo Count Pill */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950/85 backdrop-blur-md border border-slate-800 text-slate-200 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                        <span>📷 Photo {selectedPhotoIndex + 1} of {galleryImages.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Photo Thumbnails Strip */}
                  {galleryImages.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Product Gallery ({galleryImages.length} Photos):
                        </span>
                        <span className="text-[11px] text-emerald-400 font-medium">
                          Click thumbnail to switch view
                        </span>
                      </div>
                      <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1.5 px-1">
                        {galleryImages.map((imgUrl, idx) => {
                          const isActive = selectedPhotoIndex === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedPhotoIndex(idx)}
                              className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden shrink-0 transition-all duration-200 border-2 cursor-pointer ${
                                isActive
                                  ? 'border-emerald-400 ring-2 ring-emerald-500/50 scale-105 shadow-lg shadow-emerald-500/20'
                                  : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                              }`}
                            >
                              <img
                                src={imgUrl}
                                alt={`Thumbnail ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                                }}
                              />
                              {isActive && (
                                <span className="absolute inset-0 bg-emerald-500/10 border-2 border-emerald-400 rounded-2xl pointer-events-none" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Guarantee & Delivery Feature Cards */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 flex items-center gap-3">
                      <span className="text-2xl">🚚</span>
                      <div>
                        <p className="text-xs font-bold text-white">Cash on Delivery</p>
                        <p className="text-[10px] text-slate-400">Pay after receiving item</p>
                      </div>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 flex items-center gap-3">
                      <span className="text-2xl">🛡️</span>
                      <div>
                        <p className="text-xs font-bold text-white">7-Day Guarantee</p>
                        <p className="text-[10px] text-slate-400">Easy exchange / return</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Custom Product Details & Order Options (5 cols) */}
                <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
                  <div className="space-y-5">
                    {/* Category Tag & Title */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-block border border-emerald-500/20">
                          Category: {activeDetailProduct.category}
                        </span>
                        <span className="bg-blue-500/10 text-blue-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-block border border-blue-500/20">
                          100% Authentic
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                        {activeDetailProduct.name}
                      </h2>
                    </div>

                    {/* Price Banner */}
                    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-0.5">
                          Price
                        </span>
                        <div className="flex items-baseline gap-3">
                          <span className="text-3xl font-black text-emerald-400">
                            TK {activeDetailProduct.price}
                          </span>
                          {activeDetailProduct.oldPrice && (
                            <span className="text-slate-500 line-through text-sm font-medium">
                              TK {activeDetailProduct.oldPrice}
                            </span>
                          )}
                        </div>
                      </div>
                      {hasDiscount && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-extrabold">
                          You Save TK {savingsAmount} ({discountPercent}%)
                        </div>
                      )}
                    </div>

                    {/* Dynamic Color Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex justify-between">
                        <span>Select Color:</span>
                        <span className="text-emerald-400 font-bold">{selectedColor}</span>
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        {(activeDetailProduct.colors || ['White']).map((col) => {
                          const isSelected = selectedColor === col;
                          return (
                            <button
                              key={col}
                              onClick={() => {
                                setSelectedColor(col);
                                if (
                                  activeDetailProduct.colorImages &&
                                  activeDetailProduct.colorImages[col]
                                ) {
                                  const colImg = activeDetailProduct.colorImages[col];
                                  const matchIdx = galleryImages.findIndex((img) => img === colImg);
                                  if (matchIdx !== -1) {
                                    setSelectedPhotoIndex(matchIdx);
                                  }
                                }
                              }}
                              className={`flex items-center gap-2 border px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                isSelected
                                  ? 'border-2 border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-md shadow-emerald-500/10'
                                  : 'border-slate-800 text-slate-300 hover:border-slate-700 bg-slate-950'
                              }`}
                            >
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-slate-500 inline-block shadow-sm"
                                style={{ backgroundColor: getColorCode(col) }}
                              />
                              <span>{col}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dynamic Size Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex justify-between">
                        <span>Select Size:</span>
                        <span className="text-emerald-400 font-bold">{selectedSize}</span>
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        {(activeDetailProduct.sizes || ['Free Size']).map((sz) => {
                          const isSelected = selectedSize === sz;
                          return (
                            <button
                              key={sz}
                              onClick={() => setSelectedSize(sz)}
                              className={`border px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                isSelected
                                  ? 'border-2 border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-md'
                                  : 'border-slate-800 text-slate-300 hover:border-slate-700 bg-slate-950'
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quantity & Subtotal Preview */}
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Quantity:
                        </label>
                        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                          <button
                            onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black flex items-center justify-center transition"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-extrabold text-white text-sm">
                            {detailQty}
                          </span>
                          <button
                            onClick={() => setDetailQty((q) => q + 1)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black flex items-center justify-center transition"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                          Total Payable:
                        </span>
                        <span className="text-xl font-black text-emerald-400">
                          TK {activeDetailProduct.price * detailQty}
                        </span>
                      </div>
                    </div>

                    {/* Action Order Buttons (Direct Order & WhatsApp) */}
                    <div className="space-y-2.5 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() =>
                            addToCartWithOptions(
                              activeDetailProduct,
                              selectedColor,
                              selectedSize,
                              detailQty
                            )
                          }
                          className="bg-amber-500 text-slate-950 py-3.5 px-4 rounded-2xl font-extrabold hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 text-xs sm:text-sm flex items-center justify-center gap-2"
                        >
                          <span>🛒</span> Add to Cart
                        </button>

                        <button
                          onClick={() => {
                            addToCartWithOptions(
                              activeDetailProduct,
                              selectedColor,
                              selectedSize,
                              detailQty
                            );
                            handleProceedToCheckout();
                          }}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 px-4 rounded-2xl font-extrabold hover:opacity-95 transition shadow-lg shadow-emerald-600/30 text-xs sm:text-sm flex items-center justify-center gap-2"
                        >
                          <span>⚡</span> Buy Now
                        </button>
                      </div>

                      {/* Order via WhatsApp */}
                      <a
                        href={`https://wa.me/8801926951361?text=${whatsappMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 py-3 px-4 rounded-2xl font-bold transition text-xs flex items-center justify-center gap-2 shadow-md"
                      >
                        <span>💬</span> Order via WhatsApp (01926951361)
                      </a>
                    </div>

                    {/* Product Description */}
                    <div className="border-t border-slate-800 pt-4">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span>📝</span> Product Specifications & Details:
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800 whitespace-pre-line">
                        {activeDetailProduct.description || 'No detailed description provided.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* Fullscreen Product Image Zoom Lightbox */}
      {isImageZoomOpen && activeDetailProduct && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex flex-col items-center justify-between p-4 sm:p-8">
          {/* Lightbox Header */}
          <div className="w-full max-w-5xl flex justify-between items-center text-white border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                {activeDetailProduct.name}
              </h3>
              <p className="text-xs text-emerald-400 font-medium">
                High Resolution Photo Preview
              </p>
            </div>
            <button
              onClick={() => setIsImageZoomOpen(false)}
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-rose-600 text-white flex items-center justify-center font-bold text-lg transition shadow-lg"
            >
              ✕
            </button>
          </div>

          {/* Lightbox Main Image Display */}
          <div className="relative w-full max-w-4xl flex-1 flex items-center justify-center my-4 overflow-hidden">
            {(() => {
              const galleryImages = getProductGalleryImages(activeDetailProduct);
              const zoomImg = galleryImages[selectedPhotoIndex] || galleryImages[0] || DEFAULT_FALLBACK_IMAGE;

              return (
                <div className="relative flex items-center justify-center w-full h-full">
                  <img
                    src={zoomImg}
                    alt="Zoom view"
                    className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800"
                  />

                  {galleryImages.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setSelectedPhotoIndex(
                            (prev) => (prev - 1 + galleryImages.length) % galleryImages.length
                          )
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900/90 hover:bg-emerald-600 text-white border border-slate-700 flex items-center justify-center font-black text-2xl shadow-2xl transition"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() =>
                          setSelectedPhotoIndex((prev) => (prev + 1) % galleryImages.length)
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900/90 hover:bg-emerald-600 text-white border border-slate-700 flex items-center justify-center font-black text-2xl shadow-2xl transition"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Lightbox Bottom Thumbnails */}
          <div className="w-full max-w-2xl flex items-center justify-center gap-3 overflow-x-auto scrollbar-none py-2">
            {getProductGalleryImages(activeDetailProduct).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedPhotoIndex(idx)}
                className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                  selectedPhotoIndex === idx
                    ? 'border-emerald-400 ring-2 ring-emerald-500 scale-110'
                    : 'border-slate-800 opacity-50 hover:opacity-100'
                }`}
              >
                <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex justify-end transition-opacity">
          <div className="bg-slate-900 w-full max-w-md h-full p-6 sm:p-8 flex flex-col justify-between shadow-2xl border-l border-slate-800">
            <div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-5">
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <span>🛒</span> Shopping Cart
                </h3>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-slate-300 transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 max-h-[58vh] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <p className="text-center text-slate-400 py-16 text-sm font-medium">
                    Your cart is empty
                  </p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.cartKey}
                      className="flex justify-between items-center border-b border-slate-800 pb-4 gap-3"
                    >
                      <div className="flex gap-3 items-center">
                        <img
                          src={item.img || DEFAULT_FALLBACK_IMAGE}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded-xl border border-slate-800 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                          }}
                        />
                        <div>
                          <h5 className="text-xs font-bold text-white line-clamp-1">{item.name}</h5>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Color: {item.color} | Size: {item.size}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                              <button
                                onClick={() => updateCartItemQty(item.cartKey, -1)}
                                className="w-5 h-5 rounded bg-slate-900 text-white font-bold text-xs flex items-center justify-center hover:bg-slate-800"
                              >
                                -
                              </button>
                              <span className="w-5 text-center font-bold text-xs text-white">
                                {item.qty}
                              </span>
                              <button
                                onClick={() => updateCartItemQty(item.cartKey, 1)}
                                className="w-5 h-5 rounded bg-slate-900 text-white font-bold text-xs flex items-center justify-center hover:bg-slate-800"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-xs text-emerald-400 font-extrabold">
                              TK {item.price * item.qty}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.cartKey)}
                        className="text-rose-400 text-xs font-bold hover:underline px-1"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-5">
              <div className="flex justify-between font-extrabold text-base mb-5 text-white">
                <span>Subtotal:</span>
                <span className="text-emerald-400">TK {cartSubtotal}</span>
              </div>
              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-xl font-bold hover:opacity-95 transition shadow-lg shadow-emerald-600/35 text-sm"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-3xl p-6 sm:p-8 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-800 flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-5">
              <h3 className="text-xl font-extrabold text-purple-400 flex items-center gap-2">
                <span>⚙️</span> Admin Dashboard
              </h3>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-slate-300 transition"
              >
                ✕
              </button>
            </div>

            {/* Admin Tabs Navigation */}
            <div className="flex gap-3 mb-6 border-b border-slate-800 pb-4">
              <button
                onClick={() => setAdminTab('upload')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-md ${
                  adminTab === 'upload'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                ➕ Upload Product
              </button>
              <button
                onClick={() => setAdminTab('orders')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition border border-slate-800 ${
                  adminTab === 'orders'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                }`}
              >
                📦 View Orders ({orders.length})
              </button>
            </div>

            {/* Tab 1: Upload Product Form */}
            {adminTab === 'upload' && (
              <form onSubmit={handleProductUpload} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Product Name*
                  </label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition"
                    placeholder="e.g., Men's Casual Shirt"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Category*
                  </label>
                  <select
                    value={newProdCat}
                    onChange={(e) => setNewProdCat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition"
                  >
                    <option value="mens">Men's Item</option>
                    <option value="womens">Women's Item</option>
                    <option value="home">Home Item</option>
                    <option value="kitchen">Kitchen Item</option>
                    <option value="mysterybox">Mystery Box</option>
                    <option value="gadgets">Gadgets</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Price (TK)*
                    </label>
                    <input
                      type="number"
                      required
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition"
                      placeholder="1500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Old Price (TK)
                    </label>
                    <input
                      type="number"
                      value={newProdOldPrice}
                      onChange={(e) => setNewProdOldPrice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition"
                      placeholder="2000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Available Colors
                    </label>
                    <input
                      type="text"
                      value={newProdColors}
                      onChange={(e) => setNewProdColors(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition"
                      placeholder="White, Black, Red, Blue"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Separate by comma (,)</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Available Sizes
                    </label>
                    <input
                      type="text"
                      value={newProdSizes}
                      onChange={(e) => setNewProdSizes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition"
                      placeholder="Free Size, M, L, XL"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Separate by comma (,)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Product Description
                  </label>
                  <textarea
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition h-24"
                    placeholder="Write detailed product features, material, warranty info..."
                  />
                </div>

                {/* Multi-Photo Upload Options */}
                <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>📸 Select Multiple Photo Files</span>
                      <span className="text-[10px] text-purple-400 font-normal">Select 1 or more photos</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          setNewProdFiles(Array.from(e.target.files));
                        }
                      }}
                      className="w-full border-2 border-dashed border-slate-800 p-3 rounded-xl text-xs bg-slate-900 text-slate-300 cursor-pointer hover:border-purple-500/50 transition"
                    />
                    {newProdFiles.length > 0 && (
                      <p className="text-[11px] text-emerald-400 font-bold mt-1.5">
                        ✓ {newProdFiles.length} photo file(s) selected
                      </p>
                    )}
                  </div>

                  <div className="border-t border-slate-800/80 pt-3">
                    <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
                      🌐 OR Add Photo Web Links (URLs)
                    </label>
                    <textarea
                      value={newProdImageUrls}
                      onChange={(e) => setNewProdImageUrls(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition h-16 font-mono"
                      placeholder="Paste image links separated by comma or new line&#10;https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Paste web links for multiple product photos
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-bold hover:bg-purple-500 transition shadow-lg shadow-purple-600/30 mt-2"
                >
                  {isUploading ? 'Uploading to Firestore...' : 'Upload Product'}
                </button>
              </form>
            )}

            {/* Tab 2: View Customer Orders */}
            {adminTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                    All Customer Orders (Saved in Firestore)
                  </h4>
                  {orders.length > 0 && (
                    <button
                      onClick={handleClearAllOrders}
                      className="text-rose-400 text-xs font-bold hover:underline"
                    >
                      Clear All Orders
                    </button>
                  )}
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {orders.length === 0 ? (
                    <p className="text-center text-slate-400 py-12 text-xs font-medium">
                      No customer orders received yet.
                    </p>
                  ) : (
                    orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3"
                      >
                        <div className="flex justify-between items-start border-b border-slate-900 pb-2.5">
                          <div>
                            <span className="text-[10px] font-extrabold bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-md border border-purple-500/30">
                              {ord.orderId}
                            </span>
                            <span className="text-xs text-slate-400 ml-2">{ord.date}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteOrder(ord.id)}
                            className="text-rose-400 text-xs font-bold hover:underline"
                          >
                            Delete Order
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                          <div>
                            <strong className="text-white">Customer:</strong> {ord.name}
                          </div>
                          <div>
                            <strong className="text-white">Phone:</strong>{' '}
                            <a href={`tel:${ord.phone}`} className="text-emerald-400 underline">
                              {ord.phone}
                            </a>
                          </div>
                          <div className="sm:col-span-2">
                            <strong className="text-white">Address:</strong> {ord.address}
                          </div>
                          <div>
                            <strong className="text-white">Payment:</strong> {ord.paymentMethod}
                          </div>
                          <div>
                            <strong className="text-white">Delivery Fee:</strong> TK {ord.shippingFee}
                          </div>
                        </div>

                        <div className="border-t border-slate-900 pt-2.5">
                          <p className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                            Ordered Items:
                          </p>
                          <div className="space-y-1.5">
                            {ord.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center text-xs bg-slate-900 p-2 rounded-xl"
                              >
                                <span className="text-white font-medium">
                                  {item.name} ({item.color}, {item.size}) x{' '}
                                  <strong className="text-emerald-400">{item.qty}</strong>
                                </span>
                                <span className="text-slate-300">TK {item.price * item.qty}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-900 pt-2.5 font-extrabold text-xs">
                          <span className="text-slate-300">Total Bill (Incl. Delivery):</span>
                          <span className="text-emerald-400 text-sm">TK {ord.total}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-xl p-6 sm:p-8 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-5">
              <h3 className="text-xl font-extrabold text-emerald-400">
                Pocket Cart BD - Checkout
              </h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-slate-300 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name*
                </label>
                <input
                  type="text"
                  required
                  value={chkName}
                  onChange={(e) => setChkName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Phone Number*
                </label>
                <input
                  type="tel"
                  required
                  value={chkPhone}
                  onChange={(e) => setChkPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition"
                  placeholder="017xxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Address*
                </label>
                <textarea
                  required
                  value={chkAddress}
                  onChange={(e) => setChkAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition h-20"
                  placeholder="House no, Road, Area, City"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Delivery Area*
                </label>
                <select
                  value={shippingFee}
                  onChange={(e) => setShippingFee(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value={60}>Inside Dhaka - TK 60</option>
                  <option value={120}>Outside Dhaka - TK 120</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Payment Method*
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="Cash on Delivery">Cash on Delivery</option>
                  <option value="bKash Payment">bKash Payment</option>
                </select>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl space-y-1.5 border border-slate-800 text-xs font-medium">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>{' '}
                  <span className="font-bold text-white">TK {cartSubtotal}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Delivery Charge:</span>{' '}
                  <span className="font-bold text-white">TK {shippingFee}</span>
                </div>
                <div className="flex justify-between font-extrabold text-emerald-400 border-t border-slate-800 pt-2 text-sm">
                  <span>Total Payable:</span> <span>TK {cartSubtotal + shippingFee}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-xl font-bold hover:opacity-95 transition shadow-lg shadow-emerald-600/35 mt-2"
              >
                Confirm Order
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Auth Modal (Login / Register / Google Sign-In) */}
      {(isLoginOpen || isRegisterOpen) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-800 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <img
                  src={DEFAULT_LOGO_IMAGE}
                  alt="Pocket Cart BD"
                  className="w-8 h-8 rounded-lg object-contain bg-white p-0.5"
                />
                <h3 className="text-lg font-extrabold text-white">
                  Pocket Cart <span className="text-emerald-400">BD</span>
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsLoginOpen(false);
                  setIsRegisterOpen(false);
                  setAuthError('');
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-slate-300 transition"
              >
                ✕
              </button>
            </div>

            {/* Auth Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('login');
                  setIsLoginOpen(true);
                  setIsRegisterOpen(false);
                  setAuthError('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  authModalTab === 'login'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab('register');
                  setIsRegisterOpen(true);
                  setIsLoginOpen(false);
                  setAuthError('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                  authModalTab === 'register'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Auth Error Banner */}
            {authError && (
              <div className="bg-rose-950/80 border border-rose-800/80 text-rose-200 p-3 rounded-xl text-xs font-medium mb-4 flex items-start gap-2">
                <span>⚠️</span>
                <span>{authError}</span>
              </div>
            )}

            {/* Google One-Click Sign In Button */}
            <div className="mb-6">
              <button
                type="button"
                disabled={isGoogleLoading}
                onClick={handleGoogleSignIn}
                className="w-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold py-3 px-4 rounded-2xl flex items-center justify-center gap-3 transition shadow-lg hover:shadow-xl disabled:opacity-50 text-xs sm:text-sm border border-slate-300"
              >
                {isGoogleLoading ? (
                  <span className="animate-spin text-lg">⏳</span>
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                )}
                <span>
                  {isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}
                </span>
              </button>

              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-slate-800"></div>
                <span className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  or email login
                </span>
                <div className="flex-1 border-t border-slate-800"></div>
              </div>
            </div>

            {/* Email Login Form */}
            {authModalTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email or Phone Number*
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition"
                    placeholder="user@email.com or 017xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Password*
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition"
                    placeholder="Enter password"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-bold hover:opacity-95 transition shadow-lg shadow-emerald-600/35 mt-2"
                >
                  Sign In to Account
                </button>
              </form>
            ) : (
              /* Registration Form */
              <form onSubmit={handleRegister} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name*
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition"
                    placeholder="Your Full Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email or Phone Number*
                  </label>
                  <input
                    type="text"
                    required
                    value={regIdentifier}
                    onChange={(e) => setRegIdentifier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition"
                    placeholder="user@email.com or 017xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Password*
                  </label>
                  <input
                    type="password"
                    required
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition"
                    placeholder="Create a password"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-bold hover:opacity-95 transition shadow-lg shadow-emerald-600/35 mt-2"
                >
                  Create New Account
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Category Slide-Over Drawer / Menu Modal */}
      {isCategoryMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsCategoryMenuOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in"
          ></div>

          {/* Drawer Content */}
          <div className="relative bg-slate-900 w-full max-w-sm h-full shadow-2xl border-l border-slate-800 flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center gap-2.5">
                <img
                  src={DEFAULT_LOGO_IMAGE}
                  alt="Pocket Cart BD"
                  className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 border border-slate-700"
                />
                <div>
                  <h3 className="font-extrabold text-white text-base">Browse Categories</h3>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    Pocket Cart BD Market
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Category List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {CATEGORIES_LIST.map((cat) => {
                const isActive = activeCategory === cat.key;
                const catProductCount =
                  cat.key === 'all'
                    ? products.length
                    : products.filter((p) => p.category === cat.key).length;

                return (
                  <button
                    key={cat.key}
                    onClick={() => {
                      setActiveCategory(cat.key);
                      setSearchQuery('');
                      setIsCategoryMenuOpen(false);
                      handleShowHome();
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition border cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/50 shadow-lg shadow-emerald-600/30 font-bold'
                        : 'bg-slate-950/90 text-slate-200 hover:bg-slate-800 border-slate-800/90'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                        {cat.icon}
                      </span>
                      <div className="text-left">
                        <span className="text-xs sm:text-sm font-bold block">{cat.label}</span>
                        <span className="text-[10px] opacity-70 font-medium">
                          {catProductCount} Items available
                        </span>
                      </div>
                    </div>
                    <span className="text-slate-400 font-bold text-sm">›</span>
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 text-center text-xs text-slate-400">
              <p>🚚 Cash on Delivery Nationwide</p>
              <p className="text-[10px] text-slate-500 mt-1">Pocket Cart BD • All In One Market</p>
            </div>
          </div>
        </div>
      )}

      {/* Account Profile Modal */}
      {isAccountModalOpen && currentUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm p-6 rounded-3xl shadow-2xl border border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xl">👤</span>
                <h3 className="text-base font-extrabold text-white">My Account</h3>
              </div>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-slate-300 transition"
              >
                ✕
              </button>
            </div>

            {/* User Profile Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center mb-5">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-emerald-400 mb-3 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black text-2xl flex items-center justify-center mx-auto mb-3 border-2 border-emerald-400/50 shadow-md">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <h4 className="text-base font-extrabold text-white">{currentUser.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{currentUser.identifier}</p>
              <div className="mt-2.5 inline-block bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {currentUser.isAdmin ? '👑 Admin Account' : '🛍️ Verified Customer'}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              {currentUser.isAdmin && (
                <button
                  onClick={() => {
                    setIsAccountModalOpen(false);
                    setIsAdminModalOpen(true);
                  }}
                  className="w-full bg-purple-950/90 text-purple-200 border border-purple-800/80 hover:bg-purple-900 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <span>⚙️</span> Open Admin Dashboard
                </button>
              )}
              <button
                onClick={() => {
                  setIsAccountModalOpen(false);
                  setAuthModalTab('login');
                  setIsLoginOpen(true);
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700"
              >
                <span>🔄</span> Switch Account / Login Another
              </button>
              <button
                onClick={() => {
                  setIsAccountModalOpen(false);
                  handleLogout();
                }}
                className="w-full bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/80 py-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-md"
              >
                <span>🚪</span> Sign Out / Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Chat Button */}
      <div className="fixed bottom-20 right-4 sm:right-6 md:bottom-6 z-40">
        <a
          href="https://wa.me/8801926951361?text=Hello%20Pocket%20Cart%20BD,%20I%20need%20help%20with%20your%20products."
          target="_blank"
          rel="noopener noreferrer"
          title="Chat on WhatsApp"
          className="bg-emerald-500 text-slate-950 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-emerald-400 transition-all duration-300 hover:scale-110 shadow-emerald-500/40 border-2 border-slate-900"
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
        </a>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 py-1.5 px-3 flex justify-around items-center md:hidden shadow-2xl">
        {/* Home Item */}
        <button
          onClick={() => {
            handleShowHome();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center text-slate-400 hover:text-emerald-400 py-1 px-2 rounded-xl transition"
        >
          <span className="text-lg">🏠</span>
          <span className="text-[10px] font-bold">Home</span>
        </button>

        {/* Search Item */}
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => {
              document.getElementById('mobile-search-input')?.focus();
            }, 100);
          }}
          className="flex flex-col items-center justify-center text-slate-400 hover:text-emerald-400 py-1 px-2 rounded-xl transition"
        >
          <span className="text-lg">🔍</span>
          <span className="text-[10px] font-bold">Search</span>
        </button>

        {/* Categories Item */}
        <button
          onClick={() => {
            setIsCategoryMenuOpen(true);
          }}
          className="flex flex-col items-center justify-center text-slate-400 hover:text-emerald-400 py-1 px-2 rounded-xl transition"
        >
          <span className="text-lg">🏷️</span>
          <span className="text-[10px] font-bold">Categories</span>
        </button>

        {/* Cart Item */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center text-slate-400 hover:text-emerald-400 py-1 px-2 rounded-xl transition relative"
        >
          <span className="text-lg">🛒</span>
          <span className="text-[10px] font-bold">Cart</span>
          {totalCartCount > 0 && (
            <span className="absolute top-0 right-1 bg-emerald-500 text-slate-950 font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
              {totalCartCount}
            </span>
          )}
        </button>

        {/* Register & Login / Account Item */}
        {!currentUser ? (
          <button
            onClick={() => {
              setAuthModalTab('login');
              setIsLoginOpen(true);
            }}
            className="flex flex-col items-center justify-center text-emerald-400 hover:text-emerald-300 py-1 px-2 rounded-xl transition"
          >
            <span className="text-lg">🔐</span>
            <span className="text-[10px] font-extrabold text-emerald-400">Login / Register</span>
          </button>
        ) : (
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="flex flex-col items-center justify-center text-slate-400 hover:text-emerald-400 py-1 px-2 rounded-xl transition"
          >
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.name}
                className="w-5 h-5 rounded-full object-cover border border-emerald-400"
              />
            ) : (
              <span className="text-lg">👤</span>
            )}
            <span className="text-[10px] font-bold">
              {currentUser.name.split(' ')[0]}
            </span>
          </button>
        )}
      </nav>

      {/* Footer */}
      <footer className="bg-slate-950 text-white mt-16 pb-24 md:pb-12 pt-10 border-t border-slate-900">
        {/* Smart Online Store 2026 & Fast Nationwide Delivery Banner */}
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/90 rounded-2xl p-4 sm:p-5 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  ✨ Smart Online Store 2026
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-extrabold text-white">
                All-In-One Market Experience with Pocket Cart BD
              </h4>
            </div>
            <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800/80 text-xs text-slate-300 text-center sm:text-right">
              <p className="font-medium">
                <span className="text-emerald-400 font-bold">Fast Nationwide Delivery</span> • Inside Dhaka <strong className="text-white">60 TK</strong>, Outside Dhaka <strong className="text-white">120 TK</strong>.
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Order today and experience premium quality.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img
                src={DEFAULT_LOGO_IMAGE}
                alt="Pocket Cart BD Logo"
                className="w-8 h-8 rounded-lg object-contain bg-white p-0.5"
              />
              <h3 className="font-extrabold text-lg text-emerald-400">Pocket Cart BD</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your ultimate trusted e-commerce destination for quality gadgets, fashion, and living
              items with fast nationwide delivery across Bangladesh.
            </p>
          </div>
          <div>
            <h3 className="font-extrabold text-lg mb-3 text-emerald-400">Shipping & Hotline</h3>
            <p className="text-sm text-slate-400">
              Inside Dhaka: <span className="text-white font-medium">TK 60</span>
            </p>
            <p className="text-sm text-slate-400">
              Outside Dhaka: <span className="text-white font-medium">TK 120</span>
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Hotline: <span className="font-bold text-emerald-400">01926951361</span>
            </p>
          </div>
          <div>
            <h3 className="font-extrabold text-lg mb-3 text-emerald-400">Support & Payment</h3>
            <p className="text-sm text-slate-400">WhatsApp Live Chat Ready (24/7)</p>
            <p className="text-sm text-slate-400 mt-1">Accepted: bKash, Cash on Delivery</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-600 mt-10 border-t border-slate-900/85 pt-6">
          © 2026 Pocket Cart BD. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
