import { useEffect, useMemo, useState } from "react";

type Role = "customer" | "kitchen" | "admin";
type Lang = "en" | "bn";
type Status = "open" | "closed" | "soldout" | "upcoming";
type Theme = "light" | "dark";
type DeliveryMethod = "delivery" | "pickup";
type Coordinates = { lat: number; lon: number };
type DemoUser = { name: string; email: string };
type StoredOrder = {
  id: string;
  createdAt: string;
  items: { mealId: number; name: string; qty: number; price: number }[];
  subtotal: number;
  fee: number;
  total: number;
  method: DeliveryMethod;
  address: string;
  phone: string;
  payment: string;
  status: string;
  coordinates?: Coordinates | null;
};
type CheckoutDetails = { method: DeliveryMethod; address: string; phone: string; payment: string; coordinates: Coordinates | null };

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function detectBrowserLocation(
  success: (coordinates: Coordinates) => void,
  failure: (message: string) => void,
) {
  if (!navigator.geolocation) {
    failure("This browser does not support location detection. Enter your address manually.");
    return;
  }
  failure("Requesting your location permission…");
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => success({ lat: coords.latitude, lon: coords.longitude }),
    (error) => {
      const message = error.code === error.PERMISSION_DENIED
        ? "Location permission was denied. You can still enter your address manually."
        : error.code === error.TIMEOUT
          ? "Location detection timed out. Please enter your address manually."
          : "Unable to detect your location. Please enter your address manually.";
      failure(message);
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
  );
}

const photos = [
  "https://images.unsplash.com/photo-1631515242808-497c3fbd3972?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1634324092526-91f5e878b72f?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1644677867331-03f28942e35c?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1584010063908-c90644cae72a?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1565556250026-9ba22083e3e0?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1654849759930-ad32c07b293c?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1724331567780-8bcff2ca3ec9?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1739958370646-2927cd69558f?auto=format&fit=crop&w=900&q=85",
];

const kitchens = [
  { name: "Nabila's Kitchen", student: "Nabila Rahman", hall: "Shamsunnahar Hall", rating: 4.9, avatar: "NR" },
  { name: "Campus Curry", student: "Samiul Islam", hall: "Fazlul Huq Hall", rating: 4.8, avatar: "SI" },
  { name: "Mayer Hater Ranna", student: "Afsana Mim", hall: "Rokeya Hall", rating: 4.9, avatar: "AM" },
  { name: "Bhaat Ghor", student: "Tahmid Hasan", hall: "Jagannath Hall", rating: 4.7, avatar: "TH" },
  { name: "Spice & Smile", student: "Raisa Ahmed", hall: "Kuwait Maitree Hall", rating: 4.8, avatar: "RA" },
  { name: "Adda Bites", student: "Adnan Kabir", hall: "Surja Sen Hall", rating: 4.6, avatar: "AK" },
];

const meals = [
  { id: 1, bn: "ভাত-মুরগি", en: "Rice & Chicken Curry", price: 145, cat: "Lunch", kitchen: 0, status: "open" as Status, portions: 8, time: "12:30 PM", photo: 1, mode: "Delivery · Pickup" },
  { id: 2, bn: "ভুনা খিচুড়ি", en: "Bhuna Khichuri", price: 120, cat: "Lunch", kitchen: 2, status: "open" as Status, portions: 5, time: "1:00 PM", photo: 4, mode: "Delivery · Pickup" },
  { id: 3, bn: "কাচ্চি বিরিয়ানি", en: "Kacchi Biryani", price: 220, cat: "Dinner", kitchen: 1, status: "upcoming" as Status, portions: 12, time: "7:00 PM", photo: 0, mode: "Delivery" },
  { id: 4, bn: "ডিম ভাজি ও পরোটা", en: "Egg Fry & Paratha", price: 75, cat: "Breakfast", kitchen: 5, status: "closed" as Status, portions: 0, time: "Tomorrow 8:00 AM", photo: 3, mode: "Pickup" },
  { id: 5, bn: "সবজি ও ডাল", en: "Mixed Vegetables & Dal", price: 95, cat: "Vegetarian", kitchen: 4, status: "open" as Status, portions: 10, time: "12:45 PM", photo: 2, mode: "Delivery · Pickup" },
  { id: 6, bn: "গরুর তেহারি", en: "Beef Tehari", price: 180, cat: "Lunch", kitchen: 3, status: "soldout" as Status, portions: 0, time: "Tomorrow 1:00 PM", photo: 7, mode: "Delivery" },
  { id: 7, bn: "মাছ ভাত", en: "Fish Curry & Rice", price: 155, cat: "Lunch", kitchen: 0, status: "open" as Status, portions: 4, time: "1:15 PM", photo: 6, mode: "Delivery · Pickup" },
  { id: 8, bn: "চিকেন বিরিয়ানি", en: "Chicken Biryani", price: 165, cat: "Dinner", kitchen: 1, status: "upcoming" as Status, portions: 15, time: "6:30 PM", photo: 5, mode: "Delivery" },
  { id: 9, bn: "লুচি ও আলুর দম", en: "Luchi & Aloo Dum", price: 85, cat: "Breakfast", kitchen: 2, status: "upcoming" as Status, portions: 9, time: "Tomorrow 8:30 AM", photo: 3, mode: "Pickup" },
  { id: 10, bn: "মুরগির রোস্ট", en: "Chicken Roast Combo", price: 195, cat: "Dinner", kitchen: 4, status: "open" as Status, portions: 6, time: "7:30 PM", photo: 0, mode: "Delivery · Pickup" },
  { id: 11, bn: "ডাল-ভাত-ভর্তা", en: "Dal Rice & Bhorta", price: 90, cat: "Vegetarian", kitchen: 3, status: "open" as Status, portions: 11, time: "12:30 PM", photo: 4, mode: "Pickup" },
  { id: 12, bn: "মোগলাই পরোটা", en: "Mughlai Paratha", price: 110, cat: "Snacks", kitchen: 5, status: "soldout" as Status, portions: 0, time: "Tomorrow 4:30 PM", photo: 3, mode: "Pickup" },
  { id: 13, bn: "চিংড়ি ভুনা", en: "Prawn Bhuna & Rice", price: 185, cat: "Lunch", kitchen: 0, status: "open" as Status, portions: 3, time: "1:30 PM", photo: 6, mode: "Delivery" },
  { id: 14, bn: "পোলাও ও কোরমা", en: "Polao & Chicken Korma", price: 175, cat: "Dinner", kitchen: 2, status: "upcoming" as Status, portions: 14, time: "7:15 PM", photo: 7, mode: "Delivery · Pickup" },
];

const copy = {
  en: {
    location: "Delivering to", search: "Search meals or kitchens", discover: "Discover home-cooked goodness",
    hero: "Meals made by students, for students.", sub: "Fresh, affordable food from trusted campus kitchens — delivered right when you need it.",
    explore: "Explore today's menu", available: "Available now", all: "All meals", results: "meals near you",
    next: "Next order", portions: "portions left", add: "Add", customer: "Order food", kitchen: "Kitchen studio", admin: "Admin",
  },
  bn: {
    location: "ডেলিভারি লোকেশন", search: "খাবার বা কিচেন খুঁজুন", discover: "ঘরের রান্নার স্বাদ খুঁজুন",
    hero: "শিক্ষার্থীদের রান্না, শিক্ষার্থীদের জন্য।", sub: "বিশ্বস্ত ক্যাম্পাস কিচেন থেকে টাটকা, সাশ্রয়ী খাবার — ঠিক সময়ে আপনার কাছে।",
    explore: "আজকের মেনু দেখুন", available: "এখন পাওয়া যাচ্ছে", all: "সব খাবার", results: "টি খাবার কাছাকাছি",
    next: "পরবর্তী অর্ডার", portions: "পোরশন বাকি", add: "যোগ করুন", customer: "খাবার অর্ডার", kitchen: "কিচেন স্টুডিও", admin: "অ্যাডমিন",
  },
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bag: <><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10M9 21v-7h6v7" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    orders: <><path d="M6 3h12v18H6z" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
    users: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2" /><path d="M3 20a6 6 0 0 1 12 0M14 15a5 5 0 0 1 7 5" /></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
    moon: <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z" />,
    locate: <><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Button({ children, onClick, variant = "primary", disabled = false, className = "" }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "orange"; disabled?: boolean; className?: string }) {
  return <button className={`button button-${variant} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Logo() {
  return <div className="logo"><div className="logo-mark"><span></span><span></span><span></span></div><div><strong>Khabar Koi</strong><small>খাবার কই?</small></div></div>;
}

function StatusPill({ status }: { status: Status }) {
  const labels = { open: "Open now", closed: "Closed", soldout: "Sold out", upcoming: "Upcoming" };
  return <span className={`status status-${status}`}><i></i>{labels[status]}</span>;
}

function Header({ lang, setLang, role, setRole, cartCount, openCart, theme, setTheme, user, openAuth, openAccount, address, openLocation, openOrders }: {
  lang: Lang; setLang: (l: Lang) => void; role: Role; setRole: (r: Role) => void; cartCount: number; openCart: () => void;
  theme: Theme; setTheme: (theme: Theme) => void; user: DemoUser | null; openAuth: () => void; openAccount: () => void;
  address: string; openLocation: () => void; openOrders: () => void;
}) {
  const t = copy[lang];
  const initials = user?.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "SR";
  return <header className="topbar">
    <div className="header-main">
      <Logo />
      <div className="role-switch">
        {(["customer", "kitchen", "admin"] as Role[]).map((item) => <button key={item} className={role === item ? "active" : ""} onClick={() => setRole(item)}>{t[item]}</button>)}
      </div>
      <div className="header-actions">
        <button className="location" onClick={openLocation} title="Change delivery location"><Icon name="pin" size={18} /><span><small>{t.location}</small><strong>{address || "Add delivery address"}</strong></span></button>
        <div className="lang"><button className={lang === "bn" ? "active" : ""} onClick={() => setLang("bn")}>বাংলা</button><span>|</span><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button></div>
        <button className="icon-button theme-toggle" onClick={() => setTheme(theme === "light" ? "dark" : "light")} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`} aria-label="Toggle color theme"><Icon name={theme === "light" ? "moon" : "sun"} /></button>
        {role === "customer" && <button className="icon-button cart-button" onClick={openCart} aria-label="Open cart"><Icon name="bag" />{cartCount > 0 && <b>{cartCount}</b>}</button>}
        {role === "customer" && <button className="icon-button orders-shortcut" onClick={openOrders} title="Order history" aria-label="Order history"><Icon name="orders" /></button>}
        <button className="profile-button" onClick={user ? openAccount : openAuth} aria-label={user ? "Open account" : "Sign in or sign up"}><span>{initials}</span><strong className="profile-label">{user ? user.name.split(" ")[0] : "Sign in"}</strong><Icon name="chevron" size={16} /></button>
      </div>
    </div>
  </header>;
}

function FoodCard({ meal, lang, onOpen, onAdd }: { meal: typeof meals[number]; lang: Lang; onOpen: () => void; onAdd: () => void }) {
  const t = copy[lang];
  const kitchen = kitchens[meal.kitchen];
  const enabled = meal.status === "open" || meal.status === "upcoming";
  return <article className="food-card">
    <button className="food-image" onClick={onOpen}>
      <img src={photos[meal.photo]} alt={meal.en} />
      <StatusPill status={meal.status} />
      {meal.status === "open" && meal.portions <= 4 && <span className="low-stock">Only {meal.portions} left</span>}
    </button>
    <div className="food-body">
      <button className="food-title" onClick={onOpen}><strong>{lang === "bn" ? meal.bn : meal.en}</strong><span>৳{meal.price}</span></button>
      <div className="kitchen-row"><span className="mini-avatar">{kitchen.avatar}</span><div><strong>{kitchen.name}</strong><small>{kitchen.student} · ★ {kitchen.rating}</small></div></div>
      <div className="food-meta"><span><Icon name="clock" size={15} />{t.next}: {meal.time}</span><span>{meal.mode}</span></div>
      <div className="card-footer"><span>{meal.portions || "No"} {t.portions}</span><Button onClick={onAdd} disabled={!enabled} variant={enabled ? "primary" : "secondary"}><Icon name="plus" size={17} /> {meal.status === "upcoming" ? "Pre-order" : t.add}</Button></div>
    </div>
  </article>;
}

function CustomerHome({ lang, addItem, openMeal }: { lang: Lang; addItem: (id: number) => void; openMeal: (id: number) => void }) {
  const t = copy[lang];
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [availability, setAvailability] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState("any");
  const [sort, setSort] = useState("recommended");
  const categories = ["All", "Breakfast", "Lunch", "Dinner", "Vegetarian", "Snacks"];
  const filtered = useMemo(() => meals.filter((meal) => {
    const matchSearch = `${meal.en} ${meal.bn} ${kitchens[meal.kitchen].name}`.toLowerCase().includes(search.toLowerCase().trim());
    const matchCat = category === "All" || meal.cat === category;
    const matchAvailability = !availability || meal.status === "open";
    const matchMode = deliveryMode === "any" || meal.mode.toLowerCase().includes(deliveryMode);
    return matchSearch && matchCat && matchAvailability && matchMode;
  }).sort((a, b) => {
    if (sort === "price-low") return a.price - b.price;
    if (sort === "price-high") return b.price - a.price;
    if (sort === "rating") return kitchens[b.kitchen].rating - kitchens[a.kitchen].rating;
    if (sort === "portions") return b.portions - a.portions;
    return Number(b.status === "open") - Number(a.status === "open") || a.id - b.id;
  }), [search, category, availability, deliveryMode, sort]);

  return <main>
    <section className="hero wrap">
      <div className="hero-copy">
        <span className="eyebrow"><i></i>{t.discover}</span>
        <h1>{t.hero}</h1>
        <p>{t.sub}</p>
        <Button onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}>{t.explore}<Icon name="arrow" /></Button>
        <div className="trust-row"><div className="avatar-stack">{kitchens.slice(0, 4).map((k) => <span key={k.avatar}>{k.avatar}</span>)}</div><span><strong>2,400+</strong> happy campus foodies</span></div>
      </div>
      <div className="hero-visual">
        <div className="hero-circle"></div>
        <img src={photos[0]} alt="A table of fresh home-cooked dishes" />
        <div className="floating-card rating-card"><span>★</span><div><strong>4.9 average rating</strong><small>from verified students</small></div></div>
        <div className="floating-card time-card"><Icon name="clock" /><div><strong>Lunch is live</strong><small>Order before 12:15 PM</small></div></div>
      </div>
    </section>

    <section className="menu-section" id="menu">
      <div className="wrap">
        <div className="search-panel">
          <Icon name="search" /><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") document.getElementById("food-results")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} placeholder={t.search} aria-label={t.search} />
          <select className="filter-select" value={deliveryMode} onChange={(e) => setDeliveryMode(e.target.value)} aria-label="Filter by fulfilment"><option value="any">Delivery: Any</option><option value="delivery">Delivery</option><option value="pickup">Pickup</option></select>
          <Button onClick={() => document.getElementById("food-results")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Search</Button>
        </div>
        <div className="section-heading"><div><span className="eyebrow">{t.available}</span><h2>{lang === "bn" ? "আজ কী খেতে চান?" : "What are you craving today?"}</h2></div><button className={`availability-toggle ${availability ? "active" : ""}`} onClick={() => setAvailability(!availability)}><span></span> Open now</button></div>
        <div className="category-row">
          {categories.map((cat) => <button key={cat} className={category === cat ? "active" : ""} onClick={() => setCategory(cat)}>{cat === "All" ? t.all : cat}</button>)}
        </div>
        <div className="result-line" id="food-results"><strong>{filtered.length} {t.results}</strong><label className="sort-control">Sort by <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort food"><option value="recommended">Recommended</option><option value="rating">Top rated kitchens</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="portions">Most portions</option></select></label></div>
        <div className="food-grid">{filtered.map((meal) => <FoodCard key={meal.id} meal={meal} lang={lang} onOpen={() => openMeal(meal.id)} onAdd={() => addItem(meal.id)} />)}</div>
        {filtered.length === 0 && <div className="empty-state"><Icon name="search" size={32} /><strong>No meals found</strong><span>Try a different search or category.</span><Button variant="secondary" onClick={() => { setSearch(""); setCategory("All"); setAvailability(false); setDeliveryMode("any"); }}>Clear filters</Button></div>}
      </div>
    </section>
  </main>;
}

function Modal({ children, close, wide = false }: { children: React.ReactNode; close: () => void; wide?: boolean }) {
  return <div className="overlay" onMouseDown={close}><div className={`modal ${wide ? "modal-wide" : ""}`} onMouseDown={(e) => e.stopPropagation()}>{children}<button className="modal-close" onClick={close}><Icon name="close" /></button></div></div>;
}

function MealDetail({ id, lang, close, add }: { id: number; lang: Lang; close: () => void; add: (id: number, qty: number) => void }) {
  const meal = meals.find((m) => m.id === id)!;
  const kitchen = kitchens[meal.kitchen];
  const [qty, setQty] = useState(1);
  return <Modal close={close} wide>
    <div className="detail-grid">
      <div className="detail-image"><img src={photos[meal.photo]} alt={meal.en} /><StatusPill status={meal.status} /></div>
      <div className="detail-copy">
        <span className="eyebrow">{meal.cat} · {meal.mode}</span><h2>{lang === "bn" ? meal.bn : meal.en}</h2>
        <p>Fragrant rice served with slow-cooked curry, seasonal vegetables, fresh salad and a touch of homemade pickle.</p>
        <div className="detail-kitchen"><span className="avatar">{kitchen.avatar}</span><div><small>Prepared by</small><strong>{kitchen.name}</strong><span>{kitchen.student} · ★ {kitchen.rating}</span></div><Button variant="ghost">View kitchen</Button></div>
        <div className="detail-info"><div><small>ORDER CUTOFF</small><strong>Today, 12:15 PM</strong></div><div><small>NEXT SLOT</small><strong>{meal.time}</strong></div><div><small>AVAILABLE</small><strong>{meal.portions} portions</strong></div></div>
        <label className="note-field">Special instruction <textarea placeholder="Less spicy, no onions..." /></label>
        <div className="detail-action"><div className="stepper"><button onClick={() => setQty(Math.max(1, qty - 1))}><Icon name="minus" /></button><strong>{qty}</strong><button onClick={() => setQty(qty + 1)}><Icon name="plus" /></button></div><Button onClick={() => { add(id, qty); close(); }} disabled={meal.status === "closed" || meal.status === "soldout"}>Add to cart · ৳{meal.price * qty}</Button></div>
      </div>
    </div>
  </Modal>;
}

function CartDrawer({ cart, update, close, checkout }: { cart: Record<number, number>; update: (id: number, qty: number) => void; close: () => void; checkout: () => void }) {
  const entries = Object.entries(cart).filter(([, qty]) => qty > 0).map(([id, qty]) => ({ meal: meals.find((m) => m.id === Number(id))!, qty }));
  const subtotal = entries.reduce((sum, x) => sum + x.meal.price * x.qty, 0);
  return <div className="drawer-overlay" onMouseDown={close}><aside className="drawer" onMouseDown={(e) => e.stopPropagation()}>
    <div className="drawer-head"><div><span className="eyebrow">Your order</span><h2>Cart <small>{entries.length} items</small></h2></div><button className="modal-close static" onClick={close}><Icon name="close" /></button></div>
    <div className="cart-kitchen"><span className="mini-avatar">{kitchens[0].avatar}</span><div><strong>{kitchens[0].name}</strong><small>Delivery at 1:00–1:30 PM</small></div></div>
    <div className="cart-items">{entries.map(({ meal, qty }) => <div className="cart-item" key={meal.id}><img src={photos[meal.photo]} alt={meal.en} /><div><strong>{meal.en}</strong><small>৳{meal.price}</small><div className="mini-stepper"><button onClick={() => update(meal.id, qty - 1)}>−</button><span>{qty}</span><button onClick={() => update(meal.id, qty + 1)}>+</button></div></div><b>৳{meal.price * qty}</b></div>)}</div>
    {entries.length === 0 && <div className="empty-cart"><Icon name="bag" size={40} /><strong>Your cart is empty</strong><span>Add something delicious from today's menu.</span></div>}
    <div className="drawer-summary"><div><span>Subtotal</span><strong>৳{subtotal}</strong></div><div><span>Delivery fee</span><strong>৳{subtotal ? 25 : 0}</strong></div><div className="total"><span>Total</span><strong>৳{subtotal ? subtotal + 25 : 0}</strong></div><Button onClick={checkout} disabled={!subtotal} className="full">Continue to checkout <Icon name="arrow" /></Button></div>
  </aside></div>;
}

function Checkout({ subtotal, defaultAddress, defaultCoordinates, close, placeOrder }: {
  subtotal: number; defaultAddress: string; defaultCoordinates: Coordinates | null; close: () => void; placeOrder: (details: CheckoutDetails) => void;
}) {
  const [method, setMethod] = useState<DeliveryMethod>("delivery");
  const [address, setAddress] = useState(defaultAddress);
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState("Cash on delivery");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(defaultCoordinates);
  const [locationMessage, setLocationMessage] = useState("");
  const [error, setError] = useState("");
  const total = subtotal + (method === "delivery" ? 25 : 0);
  const useCurrentLocation = () => detectBrowserLocation((coords) => {
    setCoordinates(coords);
    setAddress(`Current location · ${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`);
    setLocationMessage("Location captured. Add a nearby hall, building, room or landmark for the rider.");
    setError("");
  }, setLocationMessage);
  const submit = () => {
    if (method === "delivery" && !address.trim()) { setError("Please enter a delivery address or use your current location."); return; }
    if (phone.replace(/\D/g, "").length < 8) { setError("Please enter a valid phone number so the kitchen or rider can contact you."); return; }
    placeOrder({ method, address: address.trim(), phone: phone.trim(), payment, coordinates });
  };
  return <Modal close={close}>
    <div className="checkout"><span className="eyebrow">Almost there</span><h2>Checkout</h2>
      <div className="choice-grid"><button className={method === "delivery" ? "active" : ""} onClick={() => { setMethod("delivery"); setError(""); }}><Icon name="pin" /><strong>Delivery</strong><small>25–35 min · ৳25</small></button><button className={method === "pickup" ? "active" : ""} onClick={() => { setMethod("pickup"); setError(""); }}><Icon name="bag" /><strong>Pickup</strong><small>Collect from the kitchen · free</small></button></div>
      {method === "delivery" && <div className="checkout-location-group"><label>Delivery location<input value={address} onChange={(e) => { const nextAddress = e.target.value; setAddress(nextAddress); setCoordinates((current) => current && nextAddress.startsWith(`Current location · ${current.lat.toFixed(5)}, ${current.lon.toFixed(5)}`) ? current : null); setLocationMessage(""); setError(""); }} placeholder="Hall, building, room and nearby landmark" required /></label><Button variant="secondary" onClick={useCurrentLocation}><Icon name="locate" size={17} /> Use my current location</Button>{locationMessage && <small className="helper-text">{locationMessage}</small>}{coordinates && <small className="coordinate-note"><Icon name="check" size={13} /> GPS coordinates attached to this order</small>}</div>}
      <label>Phone number<input value={phone} onChange={(e) => { setPhone(e.target.value); setError(""); }} placeholder="e.g. +880 17XX-XXXXXX" inputMode="tel" required /></label>
      <div className="payment"><strong>Payment method</strong><label><input type="radio" checked={payment === "Cash on delivery"} onChange={() => setPayment("Cash on delivery")} name="pay" /> Cash on delivery <span>Recommended</span></label><label><input type="radio" checked={payment === "bKash / Nagad (demo)"} onChange={() => setPayment("bKash / Nagad (demo)")} name="pay" /> bKash / Nagad <small>Demo selection only</small></label></div>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="checkout-total"><span>Total to pay</span><strong>৳{total}</strong></div><Button className="full" onClick={submit}>Place order <Icon name="arrow" /></Button>
      <p className="demo-note">Prototype checkout: no real payment is processed. Your order is saved in this browser only.</p>
    </div>
  </Modal>;
}

function Tracking({ close, order }: { close: () => void; order: StoredOrder | null }) {
  return <Modal close={close}><div className="tracking"><span className="success-mark">✓</span><span className="eyebrow">Order {order?.id ?? "confirmed"}</span><h2>Your order has been placed</h2><p>Estimated delivery: <strong>{order?.method === "pickup" ? "Ready for pickup in about 20–30 minutes" : "25–35 minutes"}</strong></p>
    <div className="order-confirmation"><div><span>Order total</span><strong>৳{order?.total ?? 0}</strong></div><div><span>Fulfilment</span><strong>{order?.method === "pickup" ? "Pickup" : "Delivery"}</strong></div>{order?.address && order.method === "delivery" && <div><span>Deliver to</span><strong>{order.address}</strong></div>}<div><span>Payment</span><strong>{order?.payment}</strong></div></div>
    <div className="timeline"><div className="done"><i>✓</i><div><strong>Order confirmed</strong><small>{order ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}</small></div></div><div className="active"><i></i><div><strong>Kitchen notified</strong><small>This prototype simulates order status locally</small></div></div><div><i></i><div><strong>Preparing your meal</strong><small>Up next</small></div></div><div><i></i><div><strong>{order?.method === "pickup" ? "Ready for pickup" : "Out for delivery"}</strong></div></div></div>
    <Button className="full" variant="ghost" onClick={close}>Back to menu</Button>
  </div></Modal>;
}

function AuthModal({ initialMode, close, onAuthenticated }: { initialMode: "login" | "signup"; close: () => void; onAuthenticated: (user: DemoUser) => void }) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) { setError("Enter a valid email address."); return; }
    if (password.length < 6) { setError("Use at least 6 characters for the demo password."); return; }
    if (mode === "signup" && !name.trim()) { setError("Please enter your name."); return; }
    if (mode === "signup" && password !== confirm) { setError("The passwords do not match."); return; }
    const profiles = readStorage<DemoUser[]>("khabarkoi.demoProfiles", []);
    let nextUser: DemoUser;
    if (mode === "signup") {
      if (profiles.some((profile) => profile.email === normalizedEmail)) { setError("This email has a demo profile already. Switch to sign in."); return; }
      nextUser = { name: name.trim(), email: normalizedEmail };
      window.localStorage.setItem("khabarkoi.demoProfiles", JSON.stringify([...profiles, nextUser]));
    } else {
      const existing = profiles.find((profile) => profile.email === normalizedEmail);
      nextUser = existing ?? { name: normalizedEmail.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()), email: normalizedEmail };
    }
    onAuthenticated(nextUser);
  };
  return <Modal close={close}>
    <div className="auth-modal"><div className="auth-mark"><Logo /></div><span className="eyebrow">Welcome to Khabar Koi</span><h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2><p className="auth-subtitle">{mode === "login" ? "Sign in to keep track of your campus food orders." : "Join the campus community for homemade meals."}</p>
      <div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign in</button><button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); }}>Sign up</button></div>
      <form onSubmit={submit}>
        {mode === "signup" && <label>Full name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" required /></label>}
        <label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
        <label>Password<div className="password-input"><input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={6} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button></div></label>
        {mode === "signup" && <label>Confirm password<input type={showPassword ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" autoComplete="new-password" required minLength={6} /></label>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <Button className="full" onClick={undefined}>{mode === "login" ? "Sign in" : "Create account"}<Icon name="arrow" /></Button>
      </form>
      <p className="demo-note">Demo authentication only. Passwords are not stored or sent to a server. Use any valid email and a 6+ character password to sign in.</p>
    </div>
  </Modal>;
}

function LocationEditor({ initialAddress, initialCoordinates, close, save }: { initialAddress: string; initialCoordinates: Coordinates | null; close: () => void; save: (address: string, coordinates: Coordinates | null) => void }) {
  const [address, setAddress] = useState(initialAddress);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(initialCoordinates);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const useCurrentLocation = () => detectBrowserLocation((coords) => {
    setCoordinates(coords);
    setAddress(`Current location · ${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`);
    setMessage("GPS position captured. Add a hall, building, room or landmark to help the rider find you.");
    setError("");
  }, setMessage);
  return <Modal close={close}><div className="location-editor"><span className="eyebrow">Delivery address</span><h2>Where should we deliver?</h2><p>Use your current position or enter a clear address and landmark.</p><label>Address<input value={address} onChange={(e) => { const nextAddress = e.target.value; setAddress(nextAddress); setCoordinates((current) => current && nextAddress.startsWith(`Current location · ${current.lat.toFixed(5)}, ${current.lon.toFixed(5)}`) ? current : null); setMessage(""); }} placeholder="Hall, building, room and landmark" /></label><Button variant="secondary" onClick={useCurrentLocation}><Icon name="locate" size={17} /> Use my current location</Button>{message && <small className="helper-text">{message}</small>}{coordinates && <small className="coordinate-note"><Icon name="check" size={13} /> GPS coordinates will be attached to your checkout</small>}{error && <p className="form-error">{error}</p>}<Button className="full" onClick={() => { if (!address.trim()) { setError("Enter an address or use your current location."); return; } save(address.trim(), coordinates); }}>Save location</Button><p className="demo-note">Your address is kept in this browser for this prototype.</p></div></Modal>;
}

function OrdersModal({ orders, close, track }: { orders: StoredOrder[]; close: () => void; track: (order: StoredOrder) => void }) {
  return <Modal close={close} wide><div className="orders-modal"><span className="eyebrow">Your activity</span><h2>Order history</h2>{orders.length === 0 ? <div className="empty-state"><Icon name="orders" size={30} /><strong>No orders yet</strong><span>Your placed orders will appear here on this device.</span></div> : <div className="orders-list">{orders.map((order) => <article className="history-order" key={order.id}><div className="history-order-top"><div><strong>{order.id}</strong><small>{new Date(order.createdAt).toLocaleString()}</small></div><span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span></div><div className="history-order-items">{order.items.map((item) => <span key={item.mealId}>{item.name} × {item.qty}</span>)}</div><div className="history-order-bottom"><span>{order.method === "pickup" ? "Pickup" : "Delivery"} · ৳{order.total}</span><Button variant="secondary" onClick={() => track(order)}>View order</Button></div></article>)}</div>}</div></Modal>;
}

function AccountModal({ user, close, signOut, openOrders }: { user: DemoUser; close: () => void; signOut: () => void; openOrders: () => void }) {
  const initials = user.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <Modal close={close}><div className="account-modal"><span className="account-avatar">{initials}</span><span className="eyebrow">Your account</span><h2>{user.name}</h2><p>{user.email}</p><Button className="full" onClick={openOrders}><Icon name="orders" /> View order history</Button><Button variant="secondary" className="full" onClick={signOut}><Icon name="logout" /> Sign out</Button><p className="demo-note">This demo profile is stored locally in this browser only.</p></div></Modal>;
}

const orderRows = [
  { id: "#1024", customer: "Sadia Rahman", meal: "Rice & Chicken Curry × 2", time: "12:45 PM", amount: 290, status: "Preparing" },
  { id: "#1023", customer: "Rafi Ahmed", meal: "Fish Curry & Rice × 1", time: "1:00 PM", amount: 155, status: "Confirmed" },
  { id: "#1022", customer: "Maliha Noor", meal: "Prawn Bhuna & Rice × 1", time: "1:15 PM", amount: 185, status: "Ready" },
  { id: "#1021", customer: "Nafis Khan", meal: "Rice & Chicken Curry × 1", time: "12:30 PM", amount: 145, status: "Delivered" },
];

function DashboardShell({ role, children, active, setActive }: { role: "kitchen" | "admin"; children: React.ReactNode; active: string; setActive: (x: string) => void }) {
  const kitchenNav = [["home", "Overview"], ["grid", "Menu items"], ["clock", "Schedule"], ["orders", "Orders"], ["chart", "Earnings"]];
  const adminNav = [["home", "Overview"], ["users", "Kitchens"], ["orders", "All orders"], ["grid", "Categories"], ["user", "Users"], ["chart", "Analytics"]];
  const nav = role === "kitchen" ? kitchenNav : adminNav;
  return <div className="dashboard-shell"><aside className="sidebar"><Logo /><div className="workspace"><span className="avatar">{role === "kitchen" ? "NR" : "AD"}</span><div><small>{role === "kitchen" ? "KITCHEN WORKSPACE" : "PLATFORM ADMIN"}</small><strong>{role === "kitchen" ? "Nabila's Kitchen" : "Khabar Koi"}</strong></div></div><nav>{nav.map(([icon, label]) => <button key={label} onClick={() => setActive(label)} className={active === label ? "active" : ""}><Icon name={icon} />{label}</button>)}</nav><div className="sidebar-help"><strong>Need help?</strong><span>Our team is here for you.</span><Button variant="secondary">Contact support</Button></div></aside><section className="dashboard-content">{children}</section></div>;
}

function Metric({ label, value, change, icon }: { label: string; value: string; change: string; icon: string }) {
  return <div className="metric"><div className="metric-top"><span>{label}</span><i><Icon name={icon} /></i></div><strong>{value}</strong><small>{change}</small></div>;
}

function KitchenDashboard() {
  const [active, setActive] = useState("Overview");
  const [accepting, setAccepting] = useState(true);
  const [statuses, setStatuses] = useState<Record<string, string>>(Object.fromEntries(orderRows.map((o) => [o.id, o.status])));
  const [portions, setPortions] = useState(8);
  const changeStatus = (id: string) => {
    const flow = ["Confirmed", "Preparing", "Ready", "Delivered"];
    setStatuses({ ...statuses, [id]: flow[Math.min(flow.indexOf(statuses[id]) + 1, 3)] });
  };
  return <DashboardShell role="kitchen" active={active} setActive={setActive}>
    <div className="dashboard-header"><div><span className="eyebrow">Monday, 16 June</span><h1>Good morning, Nabila</h1><p>Here's how your kitchen is doing today.</p></div><div className="open-control"><span><i className={accepting ? "on" : ""}></i><div><strong>{accepting ? "Accepting orders" : "Kitchen paused"}</strong><small>Next cutoff at 12:15 PM</small></div></span><button onClick={() => setAccepting(!accepting)} className={accepting ? "switch on" : "switch"}><i></i></button></div></div>
    <div className="metrics"><Metric label="Today's sales" value="৳2,840" change="↑ 18% from yesterday" icon="chart" /><Metric label="Orders today" value="18" change="12 completed · 6 active" icon="orders" /><Metric label="Avg. rating" value="4.9" change="Based on 86 reviews" icon="user" /><Metric label="Available items" value="3" change="1 item low in stock" icon="grid" /></div>
    <div className="dashboard-grid">
      <div className="panel span-2"><div className="panel-head"><div><h2>Incoming orders</h2><span>Updated just now</span></div><Button variant="ghost">View all <Icon name="arrow" /></Button></div><div className="order-table"><div className="table-head"><span>ORDER</span><span>CUSTOMER & ITEM</span><span>SLOT</span><span>AMOUNT</span><span>STATUS</span><span></span></div>{orderRows.map((order) => <div className="table-row" key={order.id}><strong>{order.id}</strong><span><b>{order.customer}</b><small>{order.meal}</small></span><span>{order.time}</span><strong>৳{order.amount}</strong><span className={`order-status ${statuses[order.id].toLowerCase()}`}>{statuses[order.id]}</span><button className="row-action" onClick={() => changeStatus(order.id)}><Icon name="chevron" /></button></div>)}</div></div>
      <div className="panel schedule-panel"><div className="panel-head"><div><h2>Today's schedule</h2><span>3 meal windows</span></div></div>{[["Breakfast", "8:00–10:00 AM", "Closed"], ["Lunch", "12:30–2:30 PM", "Live"], ["Dinner", "7:00–9:00 PM", "Upcoming"]].map((slot) => <div className="schedule-item" key={slot[0]}><span className={`schedule-icon ${slot[2].toLowerCase()}`}><Icon name="clock" /></span><div><strong>{slot[0]}</strong><small>{slot[1]}</small></div><b className={slot[2].toLowerCase()}>{slot[2]}</b></div>)}<Button variant="secondary" className="full">Edit schedule</Button></div>
      <div className="panel span-2"><div className="panel-head"><div><h2>Today's menu</h2><span>Manage portions and availability</span></div><Button><Icon name="plus" /> Add item</Button></div><div className="menu-manage">{meals.filter((m) => m.kitchen === 0).map((meal, i) => <div className="manage-item" key={meal.id}><img src={photos[meal.photo]} alt={meal.en} /><div><strong>{meal.en}</strong><small>৳{meal.price} · {meal.time}</small></div><label>PORTIONS<div className="mini-stepper"><button onClick={() => i === 0 && setPortions(Math.max(0, portions - 1))}>−</button><span>{i === 0 ? portions : meal.portions}</span><button onClick={() => i === 0 && setPortions(portions + 1)}>+</button></div></label><button className="more">•••</button></div>)}</div></div>
      <div className="panel sales-panel"><div className="panel-head"><div><h2>Sales this week</h2><span>৳12,480 total</span></div></div><div className="bar-chart">{[45, 64, 52, 82, 71, 94, 38].map((height, i) => <div key={i}><span style={{ height: `${height}%` }}></span><small>{["M", "T", "W", "T", "F", "S", "S"][i]}</small></div>)}</div></div>
    </div>
  </DashboardShell>;
}

const adminKitchens = kitchens.map((k, i) => ({ ...k, orders: [248, 186, 312, 154, 221, 98][i], status: i === 5 ? "Suspended" : i === 4 ? "Pending" : "Approved", revenue: [34200, 28640, 41180, 19750, 26420, 12380][i] }));

function AdminDashboard() {
  const [active, setActive] = useState("Overview");
  const [list, setList] = useState(adminKitchens);
  const setKitchenStatus = (index: number, status: string) => setList(list.map((k, i) => i === index ? { ...k, status } : k));
  return <DashboardShell role="admin" active={active} setActive={setActive}>
    <div className="dashboard-header"><div><span className="eyebrow">PLATFORM OVERVIEW</span><h1>Admin command center</h1><p>Monitor kitchens, orders, users and platform health.</p></div><div className="header-date"><Icon name="clock" /> Last 30 days <span>⌄</span></div></div>
    <div className="metrics"><Metric label="Gross sales" value="৳4.82L" change="↑ 22.4% this month" icon="chart" /><Metric label="Total orders" value="3,248" change="↑ 14.8% this month" icon="orders" /><Metric label="Active kitchens" value="42" change="5 awaiting approval" icon="grid" /><Metric label="Active users" value="8,420" change="624 new this month" icon="users" /></div>
    <div className="admin-top">
      <div className="panel revenue-panel"><div className="panel-head"><div><h2>Sales performance</h2><span>Revenue and orders over time</span></div><div className="legend"><span><i></i>Revenue</span><span><i></i>Orders</span></div></div><div className="line-chart"><div className="chart-y"><span>100k</span><span>75k</span><span>50k</span><span>25k</span><span>0</span></div><svg viewBox="0 0 600 190" preserveAspectRatio="none"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f7a55" stopOpacity=".22" /><stop offset="1" stopColor="#1f7a55" stopOpacity="0" /></linearGradient></defs><path d="M0 160 C60 145,70 110,120 125 S210 80,270 92 S360 42,420 65 S520 20,600 28 L600 190 L0 190Z" fill="url(#area)" /><path d="M0 160 C60 145,70 110,120 125 S210 80,270 92 S360 42,420 65 S520 20,600 28" fill="none" stroke="#1f7a55" strokeWidth="4" /><path d="M0 170 C60 160,90 145,130 150 S210 120,270 130 S370 85,430 105 S520 72,600 78" fill="none" stroke="#ec8d32" strokeWidth="3" strokeDasharray="7 6" /></svg><div className="chart-x">{["May 19", "May 26", "Jun 2", "Jun 9", "Jun 16"].map((x) => <span key={x}>{x}</span>)}</div></div></div>
      <div className="panel quick-panel"><div className="panel-head"><div><h2>Needs attention</h2><span>5 actions pending</span></div></div><button><span className="attention-icon orange"><Icon name="users" /></span><div><strong>5 kitchen applications</strong><small>Waiting for verification</small></div><Icon name="chevron" /></button><button><span className="attention-icon red"><Icon name="orders" /></span><div><strong>3 disputed orders</strong><small>Require resolution</small></div><Icon name="chevron" /></button><button><span className="attention-icon green"><Icon name="user" /></span><div><strong>12 support tickets</strong><small>4 marked urgent</small></div><Icon name="chevron" /></button><Button className="full" variant="secondary">Open task center</Button></div>
    </div>
    <div className="panel"><div className="panel-head"><div><h2>Kitchen management</h2><span>Review performance and control platform access</span></div><div className="panel-tools"><div><Icon name="search" /><input placeholder="Search kitchens" /></div><Button variant="secondary">All status <span>⌄</span></Button></div></div>
      <div className="admin-table"><div className="table-head"><span>KITCHEN</span><span>RATING</span><span>ORDERS</span><span>REVENUE</span><span>STATUS</span><span>ACTION</span></div>{list.map((k, i) => <div className="table-row" key={k.name}><span className="kitchen-cell"><i>{k.avatar}</i><span><strong>{k.name}</strong><small>{k.student} · {k.hall}</small></span></span><strong>★ {k.rating}</strong><span>{k.orders}</span><strong>৳{k.revenue.toLocaleString()}</strong><span className={`order-status ${k.status.toLowerCase()}`}>{k.status}</span><span className="admin-actions">{k.status === "Pending" && <button onClick={() => setKitchenStatus(i, "Approved")}>Approve</button>}<button onClick={() => setKitchenStatus(i, k.status === "Suspended" ? "Approved" : "Suspended")}>{k.status === "Suspended" ? "Restore" : "Suspend"}</button></span></div>)}</div>
    </div>
  </DashboardShell>;
}

export default function App() {
  const [role, setRole] = useState<Role>("customer");
  const [lang, setLang] = useState<Lang>(() => readStorage<Lang>("khabarkoi.lang", "en"));
  const [theme, setTheme] = useState<Theme>(() => readStorage<Theme>("khabarkoi.theme", "light"));
  const [cart, setCart] = useState<Record<number, number>>(() => readStorage<Record<number, number>>("khabarkoi.cart", {}));
  const [user, setUser] = useState<DemoUser | null>(() => readStorage<DemoUser | null>("khabarkoi.user", null));
  const [orders, setOrders] = useState<StoredOrder[]>(() => readStorage<StoredOrder[]>("khabarkoi.orders", []));
  const [address, setAddress] = useState(() => readStorage<string>("khabarkoi.address", "Shamsunnahar Hall, Gate 2"));
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<Coordinates | null>(() => readStorage<Coordinates | null>("khabarkoi.coordinates", null));
  const [mealId, setMealId] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<StoredOrder | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup" | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("khabarkoi.theme", JSON.stringify(theme)); }, [theme]);
  useEffect(() => { localStorage.setItem("khabarkoi.lang", JSON.stringify(lang)); }, [lang]);
  useEffect(() => { localStorage.setItem("khabarkoi.cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("khabarkoi.orders", JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem("khabarkoi.address", JSON.stringify(address)); }, [address]);
  useEffect(() => { localStorage.setItem("khabarkoi.coordinates", JSON.stringify(deliveryCoordinates)); }, [deliveryCoordinates]);
  useEffect(() => { if (user) localStorage.setItem("khabarkoi.user", JSON.stringify(user)); else localStorage.removeItem("khabarkoi.user"); }, [user]);

  const addItem = (id: number, qty = 1) => setCart((current) => {
    const meal = meals.find((item) => item.id === id);
    if (!meal || (meal.status !== "open" && meal.status !== "upcoming")) return current;
    const maxQty = Math.max(meal.portions, current[id] || 0);
    return { ...current, [id]: Math.min(maxQty, (current[id] || 0) + qty) };
  });
  const updateItem = (id: number, qty: number) => setCart((current) => ({ ...current, [id]: Math.max(0, qty) }));
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = Object.entries(cart).reduce((sum, [id, qty]) => sum + (meals.find((meal) => meal.id === Number(id))?.price ?? 0) * qty, 0);
  const handleAuthenticated = (nextUser: DemoUser) => { setUser(nextUser); setAuthMode(null); setAccountOpen(false); setRole("customer"); };
  const signOut = () => { setUser(null); setAccountOpen(false); setRole("customer"); };
  const placeOrder = (details: CheckoutDetails) => {
    const fee = details.method === "delivery" ? 25 : 0;
    const order: StoredOrder = {
      id: `KK-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      items: Object.entries(cart).filter(([, qty]) => qty > 0).map(([id, qty]) => {
        const meal = meals.find((item) => item.id === Number(id))!;
        return { mealId: meal.id, name: lang === "bn" ? meal.bn : meal.en, qty, price: meal.price };
      }),
      subtotal, fee, total: subtotal + fee, method: details.method, address: details.address, phone: details.phone,
      payment: details.payment, status: "Confirmed", coordinates: details.coordinates,
    };
    setOrders((current) => [order, ...current]);
    setTrackingOrder(order);
    setCart({});
    setCheckoutOpen(false);
  };
  const trackOrder = (order: StoredOrder) => { setOrdersOpen(false); setTrackingOrder(order); };
  return <div className="app" data-theme={theme}>
    <Header lang={lang} setLang={setLang} role={role} setRole={setRole} cartCount={cartCount} openCart={() => setCartOpen(true)} theme={theme} setTheme={setTheme} user={user} openAuth={() => setAuthMode("login")} openAccount={() => setAccountOpen(true)} address={address} openLocation={() => setLocationOpen(true)} openOrders={() => setOrdersOpen(true)} />
    {role === "customer" && <CustomerHome lang={lang} addItem={addItem} openMeal={setMealId} />}
    {role === "kitchen" && <KitchenDashboard />}
    {role === "admin" && <AdminDashboard />}
    {mealId && <MealDetail id={mealId} lang={lang} close={() => setMealId(null)} add={addItem} />}
    {cartOpen && <CartDrawer cart={cart} update={updateItem} close={() => setCartOpen(false)} checkout={() => { setCartOpen(false); setCheckoutOpen(true); }} />}
    {checkoutOpen && <Checkout subtotal={subtotal} defaultAddress={address} defaultCoordinates={deliveryCoordinates} close={() => setCheckoutOpen(false)} placeOrder={(details) => { setAddress(details.address || address); setDeliveryCoordinates(details.coordinates); placeOrder(details); }} />}
    {trackingOrder && <Tracking order={trackingOrder} close={() => setTrackingOrder(null)} />}
    {authMode && <AuthModal initialMode={authMode} close={() => setAuthMode(null)} onAuthenticated={handleAuthenticated} />}
    {accountOpen && user && <AccountModal user={user} close={() => setAccountOpen(false)} signOut={signOut} openOrders={() => { setAccountOpen(false); setOrdersOpen(true); }} />}
    {locationOpen && <LocationEditor initialAddress={address} initialCoordinates={deliveryCoordinates} close={() => setLocationOpen(false)} save={(nextAddress, coords) => { setAddress(nextAddress); setDeliveryCoordinates(coords); setLocationOpen(false); }} />}
    {ordersOpen && <OrdersModal orders={orders} close={() => setOrdersOpen(false)} track={trackOrder} />}
    {role === "customer" && <nav className="mobile-nav"><button className="active" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><Icon name="home" /><span>Home</span></button><button onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}><Icon name="search" /><span>Explore</span></button><button onClick={() => setCartOpen(true)}><Icon name="bag" /><span>Cart</span>{cartCount > 0 && <b>{cartCount}</b>}</button><button onClick={() => setOrdersOpen(true)}><Icon name="orders" /><span>Orders</span></button></nav>}
  </div>;
}
