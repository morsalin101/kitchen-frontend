import { useEffect, useMemo, useState } from "react";
import {
  createKitchen,
  getKitchens,
  type KitchenResponse,
} from "./api/kitchens";
import SellerApplicationModal, { type SellerApplicationDraft } from "./components/SellerApplicationModal";
import SellerAccessPage from "./pages/seller/SellerAccessPage";
import { toPortalRole, type LegacyRole, type SellerApplicationRecord } from "./types/roles";
type Role = LegacyRole;
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
  customer?: string;
};
type CheckoutDetails = { method: DeliveryMethod; address: string; phone: string; payment: string; coordinates: Coordinates | null };
type Meal = { id: number; bn: string; en: string; price: number; cat: string; kitchen: number; status: Status; portions: number; time: string; photo: number; mode: string };

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

const initialMeals: Meal[] = [
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
    next: "Next order", portions: "portions left", add: "Add", customer: "Buyer", kitchen: "Seller", admin: "Admin",
  },
  bn: {
    location: "ডেলিভারি লোকেশন", search: "খাবার বা কিচেন খুঁজুন", discover: "ঘরের রান্নার স্বাদ খুঁজুন",
    hero: "শিক্ষার্থীদের রান্না, শিক্ষার্থীদের জন্য।", sub: "বিশ্বস্ত ক্যাম্পাস কিচেন থেকে টাটকা, সাশ্রয়ী খাবার — ঠিক সময়ে আপনার কাছে।",
    explore: "আজকের মেনু দেখুন", available: "এখন পাওয়া যাচ্ছে", all: "সব খাবার", results: "টি খাবার কাছাকাছি",
    next: "পরবর্তী অর্ডার", portions: "পোরশন বাকি", add: "যোগ করুন", customer: "ক্রেতা", kitchen: "বিক্রেতা", admin: "অ্যাডমিন",
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

/** Google Maps preview used by both the header location editor and checkout.
 * It follows the prototype's original no-API-key Maps embed approach. */
function GoogleMapPreview({ address, coordinates, height = 210 }: {
  address: string;
  coordinates: Coordinates | null;
  height?: number;
}) {
  const coordinateQuery = coordinates ? `${coordinates.lat},${coordinates.lon}` : "";
  const query = coordinateQuery || address.trim();
  const [previewQuery, setPreviewQuery] = useState(query);

  // Debounce address edits so an iframe isn't reloaded after every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setPreviewQuery(query), 450);
    return () => window.clearTimeout(timer);
  }, [query]);

  if (!query) {
    return <div className="map-empty"><Icon name="pin" size={18} /> Enter a delivery address to preview it on Google Maps.</div>;
  }

  const encodedPreview = encodeURIComponent(previewQuery || query);
  const encodedOpen = encodeURIComponent(query);
  return <div className="google-map-preview">
    <iframe
      title="Google Maps delivery location preview"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
      style={{ height }}
      src={`https://www.google.com/maps?q=${encodedPreview}&z=16&output=embed`}
    />
    <div className="google-map-actions">
      <span><Icon name="pin" size={14} /> Map preview</span>
      <a href={`https://www.google.com/maps?q=${encodedOpen}`} target="_blank" rel="noreferrer">Open in Google Maps ↗</a>
    </div>
  </div>;
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
      <div className="role-switch" aria-label="Workspace preview">
        {(["customer", "kitchen", "admin"] as Role[]).map((item) => {
          const portalRole = toPortalRole(item);
          const visibleLabel = portalRole === "buyer" ? t.customer : portalRole === "seller" ? t.kitchen : t.admin;
          return <button key={item} className={role === item ? "active" : ""} onClick={() => setRole(item)} title={`${visibleLabel} workspace preview — real permissions require backend authentication`}>{visibleLabel}</button>;
        })}
      </div>
      <div className="header-actions">
        <button className="location" onClick={openLocation} title="Change delivery location"><Icon name="pin" size={18} /><span><small>{t.location}</small><strong>{address || "Add delivery address"}</strong></span></button>
        <div className="lang"><button className={lang === "bn" ? "active" : ""} onClick={() => setLang("bn")}>বাংলা</button><span>|</span><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button></div>
        <button
          className={`icon-button theme-toggle ${theme === "dark" ? "is-dark" : ""}`}
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          aria-pressed={theme === "dark"}
        >
          <span className="theme-toggle-scene" aria-hidden="true">
            <span className="theme-toggle-glyph theme-toggle-sun"><Icon name="sun" size={17} /></span>
            <span className="theme-toggle-glyph theme-toggle-moon"><Icon name="moon" size={17} /></span>
            <span className="theme-toggle-star star-one" />
            <span className="theme-toggle-star star-two" />
            <span className="theme-toggle-star star-three" />
          </span>
        </button>
        {role === "customer" && <button className="icon-button cart-button" onClick={openCart} aria-label="Open cart"><Icon name="bag" />{cartCount > 0 && <b>{cartCount}</b>}</button>}
        {role === "customer" && <button className="icon-button orders-shortcut" onClick={openOrders} title="Order history" aria-label="Order history"><Icon name="orders" /></button>}
        <button className="profile-button" onClick={user ? openAccount : openAuth} aria-label={user ? "Open account" : "Sign in or sign up"}><span>{initials}</span><strong className="profile-label">{user ? user.name.split(" ")[0] : "Sign in"}</strong><Icon name="chevron" size={16} /></button>
      </div>
    </div>
  </header>;
}

function FoodCard({ meal, lang, kitchenAccepting, onOpen, onAdd }: { meal: Meal; lang: Lang; kitchenAccepting: boolean; onOpen: () => void; onAdd: () => void }) {
  const t = copy[lang];
  const kitchen = kitchens[meal.kitchen];
  const enabled = kitchenAccepting && (meal.status === "open" || meal.status === "upcoming") && meal.portions > 0;
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
      <div className="card-footer"><span>{meal.portions || "No"} {t.portions}</span><Button onClick={onAdd} disabled={!enabled} variant={enabled ? "primary" : "secondary"}><Icon name="plus" size={17} /> {!kitchenAccepting ? "Kitchen paused" : meal.status === "upcoming" ? "Pre-order" : t.add}</Button></div>
    </div>
  </article>;
}

function CustomerHome({ lang, meals, categories, kitchenAccepting, addItem, openMeal, onBecomeSeller }: { lang: Lang; meals: Meal[]; categories: string[]; kitchenAccepting: boolean; addItem: (id: number) => void; openMeal: (id: number) => void; onBecomeSeller: () => void }) {
  const t = copy[lang];
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [availability, setAvailability] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState("any");
  const [sort, setSort] = useState("recommended");
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
  }), [meals, search, category, availability, deliveryMode, sort]);

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
        {!kitchenAccepting && <div className="dashboard-notice customer-pause-notice">The kitchen is paused, so new orders are temporarily unavailable.</div>}
        <div className="section-heading"><div><span className="eyebrow">{t.available}</span><h2>{lang === "bn" ? "আজ কী খেতে চান?" : "What are you craving today?"}</h2></div><button className={`availability-toggle ${availability ? "active" : ""}`} onClick={() => setAvailability(!availability)}><span></span> Open now</button></div>
        <div className="category-row">
          {categories.map((cat) => <button key={cat} className={category === cat ? "active" : ""} onClick={() => setCategory(cat)}>{cat === "All" ? t.all : cat}</button>)}
        </div>
        <div className="result-line" id="food-results"><strong>{filtered.length} {t.results}</strong><label className="sort-control">Sort by <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort food"><option value="recommended">Recommended</option><option value="rating">Top rated kitchens</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="portions">Most portions</option></select></label></div>
        <div className="food-grid">{filtered.map((meal) => <FoodCard key={meal.id} meal={meal} lang={lang} kitchenAccepting={kitchenAccepting} onOpen={() => openMeal(meal.id)} onAdd={() => addItem(meal.id)} />)}</div>
        {filtered.length === 0 && <div className="empty-state"><Icon name="search" size={32} /><strong>No meals found</strong><span>Try a different search or category.</span><Button variant="secondary" onClick={() => { setSearch(""); setCategory("All"); setAvailability(false); setDeliveryMode("any"); }}>Clear filters</Button></div>}
      </div>
    </section>

    <section className="seller-invite wrap" aria-labelledby="seller-invite-title">
      <div className="seller-invite-art" aria-hidden="true"><span>🍲</span><i>✦</i></div>
      <div className="seller-invite-copy">
        <span className="eyebrow">YOUR KITCHEN, YOUR COMMUNITY</span>
        <h2 id="seller-invite-title">Love cooking? Start selling on Khabar Koi.</h2>
        <p>Apply to open a kitchen, get reviewed by our team, and manage your menu once approved. You can still order from other kitchens as a Buyer.</p>
      </div>
      <Button onClick={onBecomeSeller}>Become a seller <Icon name="arrow" /></Button>
    </section>
  </main>;
}

function Modal({ children, close, wide = false }: { children: React.ReactNode; close: () => void; wide?: boolean }) {
  return <div className="overlay" onMouseDown={close}><div className={`modal ${wide ? "modal-wide" : ""}`} onMouseDown={(e) => e.stopPropagation()}>{children}<button className="modal-close" onClick={close}><Icon name="close" /></button></div></div>;
}

function MealDetail({ id, lang, meals, kitchenAccepting, close, add }: { id: number; lang: Lang; meals: Meal[]; kitchenAccepting: boolean; close: () => void; add: (id: number, qty: number) => void }) {
  const meal = meals.find((m) => m.id === id)!;
  const kitchen = kitchens[meal.kitchen];
  const [qty, setQty] = useState(1);
  const [showKitchen, setShowKitchen] = useState(false);
  return <Modal close={close} wide>
    <div className="detail-grid">
      <div className="detail-image"><img src={photos[meal.photo]} alt={meal.en} /><StatusPill status={meal.status} /></div>
      <div className="detail-copy">
        <span className="eyebrow">{meal.cat} · {meal.mode}</span><h2>{lang === "bn" ? meal.bn : meal.en}</h2>
        <p>Fragrant rice served with slow-cooked curry, seasonal vegetables, fresh salad and a touch of homemade pickle.</p>
        <div className="detail-kitchen"><span className="avatar">{kitchen.avatar}</span><div><small>Prepared by</small><strong>{kitchen.name}</strong><span>{kitchen.student} · ★ {kitchen.rating}</span></div><Button variant="ghost" onClick={() => setShowKitchen((shown) => !shown)}>{showKitchen ? "Hide kitchen" : "View kitchen"}</Button></div>
        {showKitchen && <div className="kitchen-detail-inline"><strong>{kitchen.name}</strong><span>Run by {kitchen.student}</span><span>{kitchen.hall}</span><span>★ {kitchen.rating} customer rating</span><small>Student-run home kitchen · Orders are handled locally in this prototype.</small></div>}
        <div className="detail-info"><div><small>ORDER CUTOFF</small><strong>Today, 12:15 PM</strong></div><div><small>NEXT SLOT</small><strong>{meal.time}</strong></div><div><small>AVAILABLE</small><strong>{meal.portions} portions</strong></div></div>
        <label className="note-field">Special instruction <textarea placeholder="Less spicy, no onions..." /></label>
        <div className="detail-action"><div className="stepper"><button onClick={() => setQty(Math.max(1, qty - 1))}><Icon name="minus" /></button><strong>{qty}</strong><button onClick={() => setQty(qty + 1)}><Icon name="plus" /></button></div><Button onClick={() => { add(id, qty); close(); }} disabled={!kitchenAccepting || meal.status === "closed" || meal.status === "soldout" || meal.portions <= 0}>Add to cart · ৳{meal.price * qty}</Button></div>
      </div>
    </div>
  </Modal>;
}

function CartDrawer({ cart, meals, update, close, checkout, accepting }: { cart: Record<number, number>; meals: Meal[]; update: (id: number, qty: number) => void; close: () => void; checkout: () => void; accepting: boolean }) {
  const entries = Object.entries(cart).filter(([, qty]) => qty > 0).map(([id, qty]) => ({ meal: meals.find((m) => m.id === Number(id))!, qty })).filter((entry) => Boolean(entry.meal));
  const subtotal = entries.reduce((sum, x) => sum + x.meal.price * x.qty, 0);
  return <div className="drawer-overlay" onMouseDown={close}><aside className="drawer" onMouseDown={(e) => e.stopPropagation()}>
    <div className="drawer-head"><div><span className="eyebrow">Your order</span><h2>Cart <small>{entries.length} items</small></h2></div><button className="modal-close static" onClick={close}><Icon name="close" /></button></div>
    <div className="cart-kitchen"><span className="mini-avatar">{kitchens[0].avatar}</span><div><strong>{kitchens[0].name}</strong><small>Delivery at 1:00–1:30 PM</small></div></div>
    <div className="cart-items">{entries.map(({ meal, qty }) => <div className="cart-item" key={meal.id}><img src={photos[meal.photo]} alt={meal.en} /><div><strong>{meal.en}</strong><small>৳{meal.price}</small><div className="mini-stepper"><button onClick={() => update(meal.id, qty - 1)}>−</button><span>{qty}</span><button onClick={() => update(meal.id, qty + 1)}>+</button></div></div><b>৳{meal.price * qty}</b></div>)}</div>
    {entries.length === 0 && <div className="empty-cart"><Icon name="bag" size={40} /><strong>Your cart is empty</strong><span>Add something delicious from today's menu.</span></div>}
    {!accepting && <p className="dashboard-notice">This kitchen is paused and is not accepting orders right now.</p>}
    <div className="drawer-summary"><div><span>Subtotal</span><strong>৳{subtotal}</strong></div><div><span>Delivery fee</span><strong>৳{subtotal ? 25 : 0}</strong></div><div className="total"><span>Total</span><strong>৳{subtotal ? subtotal + 25 : 0}</strong></div><Button onClick={checkout} disabled={!subtotal || !accepting} className="full">Continue to checkout <Icon name="arrow" /></Button></div>
  </aside></div>;
}

function Checkout({ subtotal, defaultAddress, defaultCoordinates, close, placeOrder, accepting }: {
  subtotal: number; defaultAddress: string; defaultCoordinates: Coordinates | null; close: () => void; placeOrder: (details: CheckoutDetails) => void; accepting: boolean;
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
    if (!accepting) { setError("The kitchen is paused and is not accepting orders right now."); return; }
    if (method === "delivery" && !address.trim()) { setError("Please enter a delivery address or use your current location."); return; }
    if (phone.replace(/\D/g, "").length < 8) { setError("Please enter a valid phone number so the kitchen or rider can contact you."); return; }
    placeOrder({ method, address: address.trim(), phone: phone.trim(), payment, coordinates });
  };
  return <Modal close={close}>
    <div className="checkout"><span className="eyebrow">Almost there</span><h2>Checkout</h2>
      <div className="choice-grid"><button className={method === "delivery" ? "active" : ""} onClick={() => { setMethod("delivery"); setError(""); }}><Icon name="pin" /><strong>Delivery</strong><small>25–35 min · ৳25</small></button><button className={method === "pickup" ? "active" : ""} onClick={() => { setMethod("pickup"); setError(""); }}><Icon name="bag" /><strong>Pickup</strong><small>Collect from the kitchen · free</small></button></div>
      {!accepting && <p className="form-error" role="alert">The kitchen is currently paused. Please try again later.</p>}
      {method === "delivery" && <div className="checkout-location-group"><label>Delivery location<input value={address} onChange={(e) => { const nextAddress = e.target.value; setAddress(nextAddress); setCoordinates((current) => current && nextAddress.startsWith(`Current location · ${current.lat.toFixed(5)}, ${current.lon.toFixed(5)}`) ? current : null); setLocationMessage(""); setError(""); }} placeholder="Hall, building, room and nearby landmark" required /></label><Button variant="secondary" onClick={useCurrentLocation}><Icon name="locate" size={17} /> Use my current location</Button>{locationMessage && <small className="helper-text">{locationMessage}</small>}{coordinates && <small className="coordinate-note"><Icon name="check" size={13} /> GPS coordinates attached to this order</small>}<GoogleMapPreview address={address} coordinates={coordinates} height={190} /></div>}
      <label>Phone number<input value={phone} onChange={(e) => { setPhone(e.target.value); setError(""); }} placeholder="e.g. +880 17XX-XXXXXX" inputMode="tel" required /></label>
      <div className="payment"><strong>Payment method</strong><label><input type="radio" checked={payment === "Cash on delivery"} onChange={() => setPayment("Cash on delivery")} name="pay" /> Cash on delivery <span>Recommended</span></label><label><input type="radio" checked={payment === "bKash / Nagad (demo)"} onChange={() => setPayment("bKash / Nagad (demo)")} name="pay" /> bKash / Nagad <small>Demo selection only</small></label></div>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="checkout-total"><span>Total to pay</span><strong>৳{total}</strong></div><Button className="full" onClick={submit} disabled={!accepting}>Place order <Icon name="arrow" /></Button>
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
  return <Modal close={close} wide><div className="location-editor"><span className="eyebrow">Delivery address</span><h2>Where should we deliver?</h2><p>Enter an address or use your current position. The map preview updates to the address or GPS coordinates you choose.</p><label>Address<input value={address} onChange={(e) => { const nextAddress = e.target.value; setAddress(nextAddress); setCoordinates((current) => current && nextAddress.startsWith(`Current location · ${current.lat.toFixed(5)}, ${current.lon.toFixed(5)}`) ? current : null); setMessage(""); setError(""); }} placeholder="Hall, building, room and landmark" /></label><Button variant="secondary" onClick={useCurrentLocation}><Icon name="locate" size={17} /> Use my current location</Button>{message && <small className="helper-text">{message}</small>}{coordinates && <small className="coordinate-note"><Icon name="check" size={13} /> GPS coordinates will be attached to your checkout</small>}<GoogleMapPreview address={address} coordinates={coordinates} height={260} />{error && <p className="form-error">{error}</p>}<Button className="full" onClick={() => { if (!address.trim()) { setError("Enter an address or use your current location."); return; } save(address.trim(), coordinates); }}>Save location</Button><p className="demo-note">Your address is kept in this browser for this prototype. Google Maps opens separately if you need to inspect the location.</p></div></Modal>;
}

function OrdersModal({ orders, close, track }: { orders: StoredOrder[]; close: () => void; track: (order: StoredOrder) => void }) {
  return <Modal close={close} wide><div className="orders-modal"><span className="eyebrow">Your activity</span><h2>Order history</h2>{orders.length === 0 ? <div className="empty-state"><Icon name="orders" size={30} /><strong>No orders yet</strong><span>Your placed orders will appear here on this device.</span></div> : <div className="orders-list">{orders.map((order) => <article className="history-order" key={order.id}><div className="history-order-top"><div><strong>{order.id}</strong><small>{new Date(order.createdAt).toLocaleString()}</small></div><span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span></div><div className="history-order-items">{order.items.map((item) => <span key={item.mealId}>{item.name} × {item.qty}</span>)}</div><div className="history-order-bottom"><span>{order.method === "pickup" ? "Pickup" : "Delivery"} · ৳{order.total}</span><Button variant="secondary" onClick={() => track(order)}>View order</Button></div></article>)}</div>}</div></Modal>;
}

function AccountModal({ user, close, signOut, openOrders, applications, onCreateKitchen, openSellerPortal }: {
  user: DemoUser;
  close: () => void;
  signOut: () => void;
  openOrders: () => void;
  applications: SellerApplicationRecord[];
  onCreateKitchen: () => void;
  openSellerPortal: () => void;
}) {
  const initials = user.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const latestApplication = [...applications].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  return <Modal close={close}><div className="account-modal"><span className="account-avatar">{initials}</span><span className="eyebrow">Your account</span><h2>{user.name}</h2><p>{user.email}</p>
    <div className="account-actions-group">
      <Button className="full" onClick={openOrders}><Icon name="orders" /> View order history</Button>
      {latestApplication && <div className="account-seller-summary">
        <div><strong>Your seller activity</strong><span className={`application-status-text status-${latestApplication.status.toLowerCase()}`}>{latestApplication.status.replace(/_/g, " ")}</span></div>
        <p>{latestApplication.kitchenName} · Kitchen #{latestApplication.kitchenId}</p>
        <Button variant="secondary" className="full" onClick={openSellerPortal}>Open Seller workspace</Button>
      </div>}
      <Button className="full" onClick={onCreateKitchen}><Icon name="plus" /> {applications.length ? "Create another kitchen" : "Become a Seller · Create a kitchen"}</Button>
      <Button variant="ghost" className="full" onClick={signOut}><Icon name="logout" /> Sign out</Button>
    </div>
    <p className="demo-note">Demo profile only. Your buyer account remains available even if you open a kitchen; server authentication and role enforcement are still to be implemented.</p>
  </div></Modal>;
}

const orderRows = [
  { id: "#1024", customer: "Sadia Rahman", meal: "Rice & Chicken Curry × 2", time: "12:45 PM", amount: 290, status: "Preparing" },
  { id: "#1023", customer: "Rafi Ahmed", meal: "Fish Curry & Rice × 1", time: "1:00 PM", amount: 155, status: "Confirmed" },
  { id: "#1022", customer: "Maliha Noor", meal: "Prawn Bhuna & Rice × 1", time: "1:15 PM", amount: 185, status: "Ready" },
  { id: "#1021", customer: "Nafis Khan", meal: "Rice & Chicken Curry × 1", time: "12:30 PM", amount: 145, status: "Delivered" },
];

type MealDraft = Omit<Meal, "id" | "kitchen" | "photo">;
type ScheduleSlot = { name: string; start: string; end: string; enabled: boolean };
type AdminUser = { id: string; name: string; email: string; role: string; status: "Active" | "Blocked" };
type DashboardOrderRow = { id: string; customer: string; meal: string; time: string; amount: number; status: string; order?: StoredOrder };

function DashboardShell({ role, children, active, setActive, workspaceName }: { role: "kitchen" | "admin"; children: React.ReactNode; active: string; setActive: (x: string) => void; workspaceName?: string }) {
  const kitchenNav = [["home", "Overview"], ["grid", "Menu items"], ["clock", "Schedule"], ["orders", "Orders"], ["chart", "Earnings"]];
  const adminNav = [["home", "Overview"], ["users", "Kitchens"], ["orders", "All orders"], ["grid", "Categories"], ["user", "Users"], ["chart", "Analytics"]];
  const nav = role === "kitchen" ? kitchenNav : adminNav;
  return <div className="dashboard-shell"><aside className="sidebar"><Logo /><div className="workspace"><span className="avatar">{role === "kitchen" ? "NR" : "AD"}</span><div><small>{role === "kitchen" ? "KITCHEN WORKSPACE" : "PLATFORM ADMIN"}</small><strong>{workspaceName || (role === "kitchen" ? "Nabila's Kitchen" : "Khabar Koi")}</strong></div></div><nav aria-label={`${role} navigation`}>{nav.map(([icon, label]) => <button key={label} onClick={() => setActive(label)} className={active === label ? "active" : ""} aria-current={active === label ? "page" : undefined}><Icon name={icon} />{label}</button>)}</nav><div className="sidebar-help"><strong>Need help?</strong><span>Our team is here for you.</span><Button variant="secondary" onClick={() => { window.location.href = "mailto:support@khabarkoi.example?subject=Khabar%20Koi%20support"; }}>Contact support</Button></div></aside><section className="dashboard-content">{children}</section></div>;
}

function Metric({ label, value, change, icon }: { label: string; value: string; change: string; icon: string }) {
  return <div className="metric"><div className="metric-top"><span>{label}</span><i><Icon name={icon} /></i></div><strong>{value}</strong><small>{change}</small></div>;
}

function MealEditorModal({ initial, categories, close, save }: { initial: Meal | null; categories: string[]; close: () => void; save: (draft: MealDraft) => void }) {
  const [name, setName] = useState(initial?.en ?? "");
  const [nameBn, setNameBn] = useState(initial?.bn ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [category, setCategory] = useState(initial?.cat ?? "Lunch");
  const [portions, setPortions] = useState(String(initial?.portions ?? "5"));
  const [time, setTime] = useState(initial?.time ?? "1:00 PM");
  const [mode, setMode] = useState(initial?.mode ?? "Delivery · Pickup");
  const [status, setStatus] = useState<Status>(initial?.status ?? "open");
  const [error, setError] = useState("");
  return <Modal close={close} wide><div className="dashboard-form-modal"><span className="eyebrow">Menu management</span><h2>{initial ? "Edit menu item" : "Add a menu item"}</h2><p>Changes are saved in this browser and immediately appear in the customer menu.</p><form onSubmit={(event) => { event.preventDefault(); const parsedPrice = Number(price); const parsedPortions = Number(portions); if (!name.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0 || !Number.isInteger(parsedPortions) || parsedPortions < 0) { setError("Enter a name, a positive price, and a whole-number portion count."); return; } save({ en: name.trim(), bn: nameBn.trim() || name.trim(), price: parsedPrice, cat: category, portions: parsedPortions, time: time.trim() || "Available today", mode, status: parsedPortions === 0 && status === "open" ? "soldout" : status }); }}>
    <div className="form-grid"><label>Meal name (English)<input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Chicken khichuri" /></label><label>Meal name (Bangla)<input value={nameBn} onChange={(e) => setNameBn(e.target.value)} placeholder="বাংলা নাম" /></label><label>Price (৳)<input type="number" min="1" step="1" value={price} onChange={(e) => setPrice(e.target.value)} required /></label><label>Portions available<input type="number" min="0" step="1" value={portions} onChange={(e) => setPortions(e.target.value)} required /></label><label>Category<select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.filter((x) => x !== "All").map((x) => <option key={x}>{x}</option>)}{!categories.includes(category) && <option>{category}</option>}</select></label><label>Ready time<input value={time} onChange={(e) => setTime(e.target.value)} placeholder="1:00 PM" /></label><label>Fulfilment<select value={mode} onChange={(e) => setMode(e.target.value)}><option>Delivery · Pickup</option><option>Delivery</option><option>Pickup</option></select></label><label>Availability<select value={status} onChange={(e) => setStatus(e.target.value as Status)}><option value="open">Open now</option><option value="upcoming">Pre-order / upcoming</option><option value="closed">Closed</option><option value="soldout">Sold out</option></select></label></div>
    {error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button type="button" className="button button-secondary" onClick={close}>Cancel</button><button className="button button-primary" type="submit">{initial ? "Save changes" : "Add item"}</button></div>
  </form></div></Modal>;
}

function rowsFromOrders(orders: StoredOrder[]): DashboardOrderRow[] {
  if (!orders.length) return orderRows.map((row) => ({ ...row }));
  return orders.map((order) => ({ id: order.id, customer: order.customer || "Guest customer", meal: order.items.map((item) => `${item.name} × ${item.qty}`).join(", "), time: new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), amount: order.total, status: order.status, order }));
}

function KitchenDashboard({ meals, setMeals, orders, setOrders, categories, accepting, setAccepting, kitchenName }: { meals: Meal[]; setMeals: React.Dispatch<React.SetStateAction<Meal[]>>; orders: StoredOrder[]; setOrders: React.Dispatch<React.SetStateAction<StoredOrder[]>>; categories: string[]; accepting: boolean; setAccepting: (next: boolean) => void; kitchenName?: string }) {
  const [active, setActive] = useState("Overview");
  const [editor, setEditor] = useState<Meal | "new" | null>(null);
  const [menuSearch, setMenuSearch] = useState("");
  const [menuStatusFilter, setMenuStatusFilter] = useState("");
  const [notice, setNotice] = useState("");
  const [demoStatuses, setDemoStatuses] = useState<Record<string, string>>(() => Object.fromEntries(orderRows.map((o) => [o.id, o.status])));
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(() => readStorage<ScheduleSlot[]>("khabarkoi.kitchen.schedule", [
    { name: "Breakfast", start: "08:00", end: "10:00", enabled: false }, { name: "Lunch", start: "12:30", end: "14:30", enabled: true }, { name: "Dinner", start: "19:00", end: "21:00", enabled: true },
  ]));
  useEffect(() => { localStorage.setItem("khabarkoi.kitchen.schedule", JSON.stringify(schedule)); }, [schedule]);
  const myMeals = meals.filter((meal) => meal.kitchen === 0);
  const available = myMeals.filter((m) => m.status === "open" && m.portions > 0).length;
  const effectiveRows = rowsFromOrders(orders).map((row) => row.order ? row : ({ ...row, status: demoStatuses[row.id] || row.status }));
  const advanceOrder = (row: DashboardOrderRow) => {
    const flow = ["Confirmed", "Preparing", "Ready", "Delivered"];
    const next = flow[Math.min(Math.max(0, flow.indexOf(row.status)) + 1, flow.length - 1)];
    if (row.order) setOrders((current) => current.map((order) => order.id === row.id ? { ...order, status: next } : order));
    else setDemoStatuses((current) => ({ ...current, [row.id]: next }));
    setNotice(`${row.id} moved to ${next}.`);
  };
  const saveMeal = (draft: MealDraft) => {
    if (editor && editor !== "new") {
      setMeals((current) => current.map((meal) => meal.id === editor.id ? { ...meal, ...draft } : meal));
      setNotice(`${draft.en} updated.`);
    } else {
      const newId = Math.max(0, ...meals.map((meal) => meal.id)) + 1;
      setMeals((current) => [...current, { ...draft, id: newId, kitchen: 0, photo: newId % photos.length }]);
      setNotice(`${draft.en} added to the menu.`);
    }
    setEditor(null);
  };
  const updateMeal = (meal: Meal, patch: Partial<Meal>) => setMeals((current) => current.map((item) => item.id === meal.id ? { ...item, ...patch } : item));
  const exportOrders = () => downloadCsv("khabarkoi-kitchen-orders.csv", ["Order", "Customer", "Items", "Amount", "Status", "Time"], effectiveRows.map((r) => [r.id, r.customer, r.meal, r.amount, r.status, r.time]));
  return <DashboardShell role="kitchen" workspaceName={kitchenName} active={active} setActive={(value) => { setActive(value); setNotice(""); }}>
    <div className="dashboard-header"><div><span className="eyebrow">KITCHEN WORKSPACE · {active.toUpperCase()}</span><h1>{active === "Overview" ? "Good morning, Nabila" : active}</h1><p>{active === "Overview" ? "A real-time view of your campus kitchen prototype." : `Manage your kitchen ${active.toLowerCase()} here.`}</p></div><div className="open-control"><span><i className={accepting ? "on" : ""}></i><div><strong>{accepting ? "Accepting orders" : "Kitchen paused"}</strong><small>{accepting ? "Customers can place orders" : "New orders are paused"}</small></div></span><button onClick={() => { setAccepting(!accepting); setNotice(accepting ? "Kitchen paused; customers will see the pause on this dashboard." : "Kitchen is accepting orders again."); }} className={accepting ? "switch on" : "switch"} aria-label="Toggle kitchen accepting orders"><i></i></button></div></div>
    {notice && <p className="dashboard-notice" role="status">{notice}</p>}
    {active === "Overview" && <>
      <div className="metrics"><Metric label="Today's sales" value={`৳${orders.reduce((sum, order) => sum + order.total, 2840).toLocaleString()}`} change="Includes demo baseline + placed orders" icon="chart" /><Metric label="Orders today" value={String(18 + orders.length)} change={`${orders.length} real prototype orders`} icon="orders" /><Metric label="Avg. rating" value="4.9" change="Based on demo reviews" icon="user" /><Metric label="Available items" value={String(available)} change={`${myMeals.length} items in your menu`} icon="grid" /></div>
      <div className="dashboard-grid"><div className="panel span-2"><div className="panel-head"><div><h2>Incoming orders</h2><span>Click an order action to advance its status</span></div><Button variant="ghost" onClick={() => setActive("Orders")}>View all <Icon name="arrow" /></Button></div><OrderTable rows={effectiveRows.slice(0, 4)} advance={advanceOrder} /></div><div className="panel schedule-panel"><div className="panel-head"><div><h2>Meal schedule</h2><span>{schedule.filter((s) => s.enabled).length} time windows enabled</span></div></div>{schedule.map((slot) => <div className="schedule-item" key={slot.name}><span className={`schedule-icon ${slot.enabled ? "live" : "closed"}`}><Icon name="clock" /></span><div><strong>{slot.name}</strong><small>{slot.start}–{slot.end}</small></div><b className={slot.enabled ? "live" : "closed"}>{slot.enabled ? "Live" : "Off"}</b></div>)}<Button variant="secondary" className="full" onClick={() => setActive("Schedule")}>Edit schedule</Button></div>
      <div className="panel span-2"><div className="panel-head"><div><h2>Today's menu</h2><span>Manage portions and availability</span></div><Button onClick={() => setEditor("new")}><Icon name="plus" /> Add item</Button></div><MenuManageList meals={myMeals.slice(0, 3)} updateMeal={updateMeal} editMeal={(meal) => setEditor(meal)} deleteMeal={(meal) => setMeals((current) => current.filter((item) => item.id !== meal.id))} /></div><div className="panel sales-panel"><div className="panel-head"><div><h2>Sales this week</h2><span>৳{(12480 + orders.reduce((sum, order) => sum + order.total, 0)).toLocaleString()} including demo baseline</span></div></div><MiniBarChart /></div></div>
    </>}
    {active === "Menu items" && <div className="panel"><div className="panel-head"><div><h2>Your menu</h2><span>{myMeals.length} items · changes also appear on the customer menu</span></div><Button onClick={() => setEditor("new")}><Icon name="plus" /> Add item</Button></div><div className="panel-tools dashboard-filters"><div><Icon name="search" /><input value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} placeholder="Search your menu" /></div><select aria-label="Filter menu availability" value={menuStatusFilter} onChange={(e) => setMenuStatusFilter(e.target.value)}><option value="">All availability</option><option value="open">Open now</option><option value="upcoming">Upcoming</option><option value="closed">Closed</option><option value="soldout">Sold out</option></select></div><MenuManageList meals={myMeals.filter((m) => `${m.en} ${m.bn} ${m.cat}`.toLowerCase().includes(menuSearch.toLowerCase()) && (!menuStatusFilter || m.status === menuStatusFilter))} updateMeal={updateMeal} editMeal={(meal) => setEditor(meal)} deleteMeal={(meal) => { setMeals((current) => current.filter((item) => item.id !== meal.id)); setNotice(`${meal.en} deleted.`); }} /></div>}
    {active === "Schedule" && <div className="panel"><div className="panel-head"><div><h2>Meal schedule</h2><span>Enable and adjust the time windows offered to customers.</span></div><Button variant="secondary" onClick={() => setSchedule([{ name: "Breakfast", start: "08:00", end: "10:00", enabled: false }, { name: "Lunch", start: "12:30", end: "14:30", enabled: true }, { name: "Dinner", start: "19:00", end: "21:00", enabled: true }])}>Reset defaults</Button></div><div className="schedule-editor">{schedule.map((slot, index) => <div className="schedule-edit-row" key={slot.name}><div><strong>{slot.name}</strong><small>{slot.enabled ? "Accepting orders for this window" : "This time window is turned off"}</small></div><label>Start<input type="time" value={slot.start} onChange={(e) => setSchedule((list) => list.map((row, i) => i === index ? { ...row, start: e.target.value } : row))} /></label><label>End<input type="time" value={slot.end} onChange={(e) => setSchedule((list) => list.map((row, i) => i === index ? { ...row, end: e.target.value } : row))} /></label><button className={`switch ${slot.enabled ? "on" : ""}`} onClick={() => setSchedule((list) => list.map((row, i) => i === index ? { ...row, enabled: !row.enabled } : row))} aria-label={`Toggle ${slot.name}`}><i /></button></div>)}</div><p className="demo-note">Your schedule is saved locally in this browser. A connected backend would synchronize it across accounts.</p></div>}
    {active === "Orders" && <div className="panel"><div className="panel-head"><div><h2>Order management</h2><span>Advance statuses as the kitchen prepares each order.</span></div><Button variant="secondary" onClick={exportOrders}>Export CSV</Button></div><OrderTable rows={effectiveRows} advance={advanceOrder} /></div>}
    {active === "Earnings" && <><div className="metrics"><Metric label="Recorded orders" value={String(orders.length)} change="Orders placed in this browser" icon="orders" /><Metric label="Order revenue" value={`৳${orders.reduce((sum, order) => sum + order.total, 0).toLocaleString()}`} change="From locally stored orders" icon="chart" /><Metric label="Average order" value={`৳${orders.length ? Math.round(orders.reduce((sum, order) => sum + order.total, 0) / orders.length) : 0}`} change="Calculated from your orders" icon="bag" /><Metric label="Menu items" value={String(myMeals.length)} change={`${available} currently available`} icon="grid" /></div><div className="panel"><div className="panel-head"><div><h2>Recent transactions</h2><span>Amounts include the demo checkout total.</span></div><Button variant="secondary" onClick={exportOrders}>Download report</Button></div>{orders.length ? <OrderTable rows={rowsFromOrders(orders)} advance={() => {}} showAction={false} /> : <div className="empty-state"><Icon name="chart" size={30} /><strong>No real orders recorded yet</strong><span>Place a test order from the customer view to see it here.</span></div>}</div></>}
    {editor && <MealEditorModal initial={editor === "new" ? null : editor} categories={categories} close={() => setEditor(null)} save={saveMeal} />}
  </DashboardShell>;
}

function MenuManageList({ meals, updateMeal, editMeal, deleteMeal }: { meals: Meal[]; updateMeal: (meal: Meal, patch: Partial<Meal>) => void; editMeal: (meal: Meal) => void; deleteMeal: (meal: Meal) => void }) {
  if (!meals.length) return <div className="empty-state"><Icon name="grid" size={30} /><strong>No menu items found</strong><span>Add a new item or clear your search.</span></div>;
  return <div className="menu-manage menu-manage-functional">{meals.map((meal) => <div className="manage-item" key={meal.id}><img src={photos[meal.photo]} alt={meal.en} /><div className="manage-meal-name"><strong>{meal.en}</strong><small>৳{meal.price} · {meal.time}</small><small>{meal.cat} · {meal.status}</small></div><label>PORTIONS<div className="mini-stepper"><button aria-label={`Reduce ${meal.en} portions`} onClick={() => { const qty = Math.max(0, meal.portions - 1); updateMeal(meal, { portions: qty, status: qty === 0 && meal.status === "open" ? "soldout" : meal.status }); }}>−</button><span>{meal.portions}</span><button aria-label={`Increase ${meal.en} portions`} onClick={() => updateMeal(meal, { portions: meal.portions + 1, status: meal.status === "soldout" ? "open" : meal.status })}>+</button></div></label><div className="manage-actions"><button title="Edit item" onClick={() => editMeal(meal)}>Edit</button><button title="Toggle availability" onClick={() => updateMeal(meal, { status: meal.status === "open" ? "closed" : "open", portions: meal.status === "open" ? meal.portions : Math.max(1, meal.portions) })}>{meal.status === "open" ? "Pause" : "Open"}</button><button title="Delete item" onClick={() => { if (window.confirm(`Delete ${meal.en} from the menu?`)) deleteMeal(meal); }}>×</button></div></div>)}</div>;
}

function OrderTable({ rows, advance, showAction = true }: { rows: DashboardOrderRow[]; advance: (row: DashboardOrderRow) => void; showAction?: boolean }) {
  return <div className="table-scroll"><div className="order-table"><div className="table-head"><span>ORDER</span><span>CUSTOMER & ITEM</span><span>TIME</span><span>AMOUNT</span><span>STATUS</span>{showAction && <span>ACTION</span>}</div>{rows.map((order) => <div className="table-row" key={order.id}><strong>{order.id}</strong><span><b>{order.customer}</b><small>{order.meal}</small></span><span>{order.time}</span><strong>৳{order.amount}</strong><span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span>{showAction && <button className="row-action" title={`Advance ${order.id} status`} onClick={() => advance(order)}><Icon name="chevron" /></button>}</div>)}</div>{!rows.length && <div className="empty-state"><strong>No orders yet</strong><span>New checkout orders will appear here.</span></div>}</div>;
}

function MiniBarChart() {
  const values = [45, 64, 52, 82, 71, 94, 38];
  return <div className="bar-chart">{values.map((height, i) => <div key={i}><span style={{ height: `${height}%` }}></span><small>{["M", "T", "W", "T", "F", "S", "S"][i]}</small></div>)}</div>;
}

const initialAdminKitchens = kitchens.map((k, i) => ({ ...k, orders: [248, 186, 312, 154, 221, 98][i], status: i === 5 ? "Suspended" : i === 4 ? "Pending" : "Approved", revenue: [34200, 28640, 41180, 19750, 26420, 12380][i] }));
const initialAdminUsers: AdminUser[] = [
  { id: "u1", name: "Sadia Rahman", email: "sadia@example.com", role: "Buyer", status: "Active" },
  { id: "u2", name: "Rafi Ahmed", email: "rafi@example.com", role: "Buyer", status: "Active" },
  { id: "u3", name: "Nabila Rahman", email: "nabila@example.com", role: "Seller", status: "Active" },
  { id: "u4", name: "Adnan Kabir", email: "adnan@example.com", role: "Rider", status: "Blocked" },
];

function AdminDashboard({ orders, setOrders, categories, setCategories, meals, backendKitchens, backendLoading, backendError, onRefreshKitchens }: { orders: StoredOrder[]; setOrders: React.Dispatch<React.SetStateAction<StoredOrder[]>>; categories: string[]; setCategories: React.Dispatch<React.SetStateAction<string[]>>; meals: Meal[]; backendKitchens: KitchenResponse[]; backendLoading: boolean; backendError: string | null; onRefreshKitchens: () => void }) {
  const [active, setActive] = useState("Overview");
  const [list, setList] = useState(() => readStorage("khabarkoi.adminKitchens", initialAdminKitchens));
  const [users, setUsers] = useState<AdminUser[]>(() => readStorage<AdminUser[]>("khabarkoi.adminUsers", initialAdminUsers).map((user) => ({
    ...user,
    role: user.role === "Customer" ? "Buyer" : user.role === "Kitchen owner" ? "Seller" : user.role,
  })));
  const [newCategory, setNewCategory] = useState("");
  const [kitchenSearch, setKitchenSearch] = useState("");
  const [kitchenFilter, setKitchenFilter] = useState("All");
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("All");
  const [demoStatuses, setDemoStatuses] = useState<Record<string, string>>(() => Object.fromEntries(orderRows.map((o) => [o.id, o.status])));
  const [notice, setNotice] = useState("");
  useEffect(() => { localStorage.setItem("khabarkoi.adminKitchens", JSON.stringify(list)); }, [list]);
  useEffect(() => { localStorage.setItem("khabarkoi.adminUsers", JSON.stringify(users)); }, [users]);
  const setKitchenStatus = (index: number, status: string) => { setList((current: typeof initialAdminKitchens) => current.map((k, i) => i === index ? { ...k, status } : k)); setNotice(`Kitchen status changed to ${status}.`); };
  const allRows = rowsFromOrders(orders).map((row) => row.order ? row : ({ ...row, status: demoStatuses[row.id] || row.status }));
  const advanceOrder = (row: DashboardOrderRow) => { const flow = ["Confirmed", "Preparing", "Ready", "Delivered"]; const next = flow[Math.min(Math.max(0, flow.indexOf(row.status)) + 1, 3)]; if (row.order) setOrders((current) => current.map((order) => order.id === row.id ? { ...order, status: next } : order)); else setDemoStatuses((current) => ({ ...current, [row.id]: next })); setNotice(`${row.id} moved to ${next}.`); };
  const exportOrders = () => downloadCsv("khabarkoi-orders.csv", ["Order", "Customer", "Items", "Amount", "Status", "Time"], allRows.map((r) => [r.id, r.customer, r.meal, r.amount, r.status, r.time]));
  const filteredKitchens = list.map((k, index) => ({ ...k, originalIndex: index })).filter((k) => `${k.name} ${k.student} ${k.hall}`.toLowerCase().includes(kitchenSearch.toLowerCase()) && (kitchenFilter === "All" || k.status === kitchenFilter));
  const filteredUsers = users.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(userSearch.toLowerCase()) && (userFilter === "All" || u.status === userFilter));
  return <DashboardShell role="admin" active={active} setActive={(value) => { setActive(value); setNotice(""); }}>
    <div className="dashboard-header"><div><span className="eyebrow">PLATFORM CONTROL · {active.toUpperCase()}</span><h1>{active === "Overview" ? "Admin command center" : active}</h1><p>{active === "Overview" ? "Monitor kitchens, orders, users and platform health." : `Manage platform ${active.toLowerCase()} in this prototype.`}</p></div><div className="header-date"><Icon name="clock" /> Local demo data <span>✓</span></div></div>
    <div className="role-demo-warning"><strong>Admin preview workspace</strong><span>This UI preview is not a security boundary. Real admin access and moderation actions must be authorized by the Spring Boot backend before production.</span></div>
    {notice && <p className="dashboard-notice" role="status">{notice}</p>}
    {active === "Overview" && <><div className="metrics"><Metric label="Gross sales" value={`৳${(482000 + orders.reduce((sum, o) => sum + o.total, 0)).toLocaleString()}`} change="Demo baseline + test orders" icon="chart" /><Metric label="Total orders" value={(3248 + orders.length).toLocaleString()} change={`${orders.length} locally placed orders`} icon="orders" /><Metric label="Active kitchens" value={String(list.filter((k) => k.status === "Approved").length)} change={`${list.filter((k) => k.status === "Pending").length} awaiting approval`} icon="grid" /><Metric label="Active users" value={String(users.filter((u) => u.status === "Active").length)} change="Local demo accounts" icon="users" /></div><div className="admin-top"><div className="panel revenue-panel"><div className="panel-head"><div><h2>Sales performance</h2><span>Illustrative trend with local order totals shown above</span></div><div className="legend"><span><i></i>Revenue</span><span><i></i>Orders</span></div></div><div className="line-chart"><div className="chart-y"><span>100k</span><span>75k</span><span>50k</span><span>25k</span><span>0</span></div><svg viewBox="0 0 600 190" preserveAspectRatio="none"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f7a55" stopOpacity=".22" /><stop offset="1" stopColor="#1f7a55" stopOpacity="0" /></linearGradient></defs><path d="M0 160 C60 145,70 110,120 125 S210 80,270 92 S360 42,420 65 S520 20,600 28 L600 190 L0 190Z" fill="url(#area)" /><path d="M0 160 C60 145,70 110,120 125 S210 80,270 92 S360 42,420 65 S520 20,600 28" fill="none" stroke="#1f7a55" strokeWidth="4" /><path d="M0 170 C60 160,90 145,130 150 S210 120,270 130 S370 85,430 105 S520 72,600 78" fill="none" stroke="#ec8d32" strokeWidth="3" strokeDasharray="7 6" /></svg><div className="chart-x">{["May 19", "May 26", "Jun 2", "Jun 9", "Jun 16"].map((x) => <span key={x}>{x}</span>)}</div></div></div><div className="panel quick-panel"><div className="panel-head"><div><h2>Needs attention</h2><span>{list.filter((k) => k.status === "Pending").length} kitchen applications pending</span></div></div><button onClick={() => setActive("Kitchens")}><span className="attention-icon orange"><Icon name="users" /></span><div><strong>Kitchen applications</strong><small>Review pending kitchens</small></div><Icon name="chevron" /></button><button onClick={() => setActive("All orders")}><span className="attention-icon red"><Icon name="orders" /></span><div><strong>Order management</strong><small>Track and advance demo orders</small></div><Icon name="chevron" /></button><button onClick={() => setActive("Users")}><span className="attention-icon green"><Icon name="user" /></span><div><strong>User access</strong><small>Manage demo accounts</small></div><Icon name="chevron" /></button><Button className="full" variant="secondary" onClick={() => setActive("Analytics")}>View analytics</Button></div></div><div className="panel"><div className="panel-head"><div><h2>Recent orders</h2><span>Change order status with the action control.</span></div><Button variant="ghost" onClick={() => setActive("All orders")}>View all <Icon name="arrow" /></Button></div><OrderTable rows={allRows.slice(0, 4)} advance={advanceOrder} /></div></>}
    {active === "Kitchens" && <div className="panel"><div className="panel-head"><div><h2>Kitchen management</h2><span>Approve applications, suspend or restore kitchens.</span></div><span>{filteredKitchens.length} shown</span></div><div className="panel-tools dashboard-filters"><div><Icon name="search" /><input value={kitchenSearch} onChange={(e) => setKitchenSearch(e.target.value)} placeholder="Search kitchens" /></div><select value={kitchenFilter} onChange={(e) => setKitchenFilter(e.target.value)} aria-label="Filter kitchen status"><option>All</option><option>Pending</option><option>Approved</option><option>Suspended</option></select></div><div className="admin-table"><div className="table-head"><span>KITCHEN</span><span>RATING</span><span>ORDERS</span><span>REVENUE</span><span>STATUS</span><span>ACTION</span></div>{filteredKitchens.map((k) => <div className="table-row" key={k.name}><span className="kitchen-cell"><i>{k.avatar}</i><span><strong>{k.name}</strong><small>{k.student} · {k.hall}</small></span></span><strong>★ {k.rating}</strong><span>{k.orders}</span><strong>৳{k.revenue.toLocaleString()}</strong><span className={`order-status ${k.status.toLowerCase()}`}>{k.status}</span><span className="admin-actions">{k.status === "Pending" && <button onClick={() => setKitchenStatus(k.originalIndex, "Approved")}>Approve</button>}<button onClick={() => setKitchenStatus(k.originalIndex, k.status === "Suspended" ? "Approved" : "Suspended")}>{k.status === "Suspended" ? "Restore" : "Suspend"}</button></span></div>)}</div></div>}
    {active === "Kitchens" && <div className="panel live-kitchens-panel">
      <div className="panel-head"><div><h2>Connected database kitchens</h2><span>Live records from Spring Boot / PostgreSQL. These are separate from the sample kitchen rows above.</span></div><Button variant="secondary" onClick={onRefreshKitchens} disabled={backendLoading}>{backendLoading ? "Refreshing…" : "Refresh records"}</Button></div>
      {backendError && <p className="form-error" role="alert">Could not load backend kitchens: {backendError}</p>}
      {!backendError && backendKitchens.length === 0 && <div className="empty-state"><strong>{backendLoading ? "Loading database kitchens…" : "No kitchens found"}</strong><span>New seller applications will appear here after they are saved.</span></div>}
      {backendKitchens.length > 0 && <div className="live-kitchens-list">{backendKitchens.map((kitchen) => <div className="live-kitchen-row" key={kitchen.id}>
        <div className="live-kitchen-avatar">{kitchen.name.slice(0, 1).toUpperCase()}</div>
        <div className="live-kitchen-copy"><strong>{kitchen.name}</strong><span>Kitchen #{kitchen.id}{kitchen.description ? ` · ${kitchen.description}` : ""}</span><small>Submitted {new Date(kitchen.createdAt).toLocaleString()}</small></div>
        <span className={`order-status ${kitchen.status === "ACTIVE" ? "approved" : kitchen.status === "REJECTED" ? "suspended" : "pending"}`}>{kitchen.status.replace(/_/g, " ")}</span>
      </div>)}</div>}
      <p className="demo-note">This list is read-only for now. The current backend does not yet expose an admin approve/reject endpoint, so the UI does not pretend to change the database status.</p>
    </div>}
    {active === "All orders" && <div className="panel"><div className="panel-head"><div><h2>All orders</h2><span>Advance through Confirmed → Preparing → Ready → Delivered.</span></div><Button variant="secondary" onClick={exportOrders}>Export CSV</Button></div><OrderTable rows={allRows} advance={advanceOrder} /></div>}
    {active === "Categories" && <div className="panel"><div className="panel-head"><div><h2>Food categories</h2><span>Changes immediately update the customer menu filters and item editor.</span></div><span>{categories.filter((c) => c !== "All").length} categories</span></div><form className="add-category-form" onSubmit={(event) => { event.preventDefault(); const label = newCategory.trim(); if (!label || categories.some((c) => c.toLowerCase() === label.toLowerCase())) { setNotice("Enter a unique category name."); return; } setCategories((current) => [...current, label]); setNewCategory(""); setNotice(`${label} category added.`); }}><input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name" aria-label="New category name" required /><button type="submit" className="button button-primary"><Icon name="plus" /> Add category</button></form><div className="category-admin-list">{categories.map((cat) => <div className="category-admin-row" key={cat}><div><strong>{cat}</strong><small>{cat === "All" ? "Default filter · cannot be deleted" : `${meals.filter((meal) => meal.cat === cat).length} menu item(s) match this category`}</small></div><span className="category-pill">{cat === "All" ? "System" : "Customizable"}</span>{cat !== "All" && <button onClick={() => { if (window.confirm(`Delete category ${cat}? Menu items in this category will remain but can be recategorized.`)) { setCategories((current) => current.filter((c) => c !== cat)); setNotice(`${cat} category deleted.`); } }}>Delete</button>}</div>)}</div></div>}
    {active === "Users" && <div className="panel"><div className="panel-head"><div><h2>User management</h2><span>Block or restore demo accounts. No real accounts are affected.</span></div><span>{filteredUsers.length} shown</span></div><div className="panel-tools dashboard-filters"><div><Icon name="search" /><input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search users" /></div><select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} aria-label="Filter user status"><option>All</option><option>Active</option><option>Blocked</option></select></div><div className="users-table"><div className="users-head"><span>USER</span><span>ROLE</span><span>STATUS</span><span>ACTION</span></div>{filteredUsers.map((u) => <div className="users-row" key={u.id}><div className="user-cell"><span className="avatar">{u.name.split(/\s+/).map((v) => v[0]).slice(0, 2).join("")}</span><span><strong>{u.name}</strong><small>{u.email}</small></span></div><span>{u.role}</span><span className={`order-status ${u.status === "Active" ? "approved" : "suspended"}`}>{u.status}</span><button className="text-action" onClick={() => { setUsers((current) => current.map((row) => row.id === u.id ? { ...row, status: row.status === "Active" ? "Blocked" : "Active" } : row)); setNotice(`${u.name} is now ${u.status === "Active" ? "blocked" : "active"}.`); }}>{u.status === "Active" ? "Block user" : "Restore user"}</button></div>)}</div></div>}
    {active === "Analytics" && <><div className="metrics"><Metric label="Recorded sales" value={`৳${orders.reduce((sum, o) => sum + o.total, 0).toLocaleString()}`} change="Actual local prototype orders" icon="chart" /><Metric label="Recorded orders" value={String(orders.length)} change="Stored in this browser" icon="orders" /><Metric label="Menu catalogue" value={String(categories.length - 1)} change="Customer-facing categories" icon="grid" /><Metric label="Approved kitchens" value={String(list.filter((k) => k.status === "Approved").length)} change="In admin demo list" icon="users" /></div><div className="panel"><div className="panel-head"><div><h2>Analytics export</h2><span>Download actual prototype orders as a CSV for review.</span></div><Button onClick={exportOrders}>Export order report</Button></div>{orders.length ? <OrderTable rows={rowsFromOrders(orders)} advance={() => {}} showAction={false} /> : <div className="empty-state"><Icon name="chart" size={30} /><strong>Waiting for checkout activity</strong><span>Place customer test orders to populate real prototype metrics.</span></div>}</div></>}
  </DashboardShell>;
}


function downloadCsv(filename: string, headers: unknown[], rows: unknown[][]) {
  const escapeCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}

export default function App() {
  const [role, setRole] = useState<Role>("customer");
  const [backendKitchens, setBackendKitchens] =
      useState<KitchenResponse[]>([]);

  const [backendLoading, setBackendLoading] = useState(true);

  const [backendError, setBackendError] = useState<string | null>(null);
  const [creatingKitchen, setCreatingKitchen] = useState(false);
  const [createKitchenError, setCreateKitchenError] = useState<string | null>(null);
  const [sellerApplicationOpen, setSellerApplicationOpen] = useState(false);
  const [pendingSellerIntent, setPendingSellerIntent] = useState(false);
  const [sellerApplications, setSellerApplications] = useState<Record<string, SellerApplicationRecord[]>>(() => readStorage<Record<string, SellerApplicationRecord[]>>("khabarkoi.sellerApplications", {}));
  const [lang, setLang] = useState<Lang>(() => readStorage<Lang>("khabarkoi.lang", "en"));
  const [categories, setCategories] = useState<string[]>(() => readStorage<string[]>("khabarkoi.categories", ["All", "Breakfast", "Lunch", "Dinner", "Vegetarian", "Snacks"]));
  const [theme, setTheme] = useState<Theme>(() => readStorage<Theme>("khabarkoi.theme", "light"));
  const [kitchenAccepting, setKitchenAccepting] = useState<boolean>(() => readStorage<boolean>("khabarkoi.kitchen.accepting", true));
  const [mealList, setMealList] = useState<Meal[]>(() => readStorage<Meal[]>("khabarkoi.meals", initialMeals));
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

  useEffect(() => {
    let cancelled = false;

    async function loadKitchens() {
      try {
        setBackendLoading(true);
        setBackendError(null);

        const data = await getKitchens();

        if (!cancelled) {
          setBackendKitchens(data);
        }
      } catch (error) {
        if (!cancelled) {
          setBackendError(
              error instanceof Error
                  ? error.message
                  : "Failed to load kitchens"
          );
        }
      } finally {
        if (!cancelled) {
          setBackendLoading(false);
        }
      }
    }

    void loadKitchens();

    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("khabarkoi.theme", JSON.stringify(theme)); }, [theme]);
  useEffect(() => { localStorage.setItem("khabarkoi.lang", JSON.stringify(lang)); }, [lang]);
  useEffect(() => { localStorage.setItem("khabarkoi.categories", JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem("khabarkoi.meals", JSON.stringify(mealList)); }, [mealList]);
  useEffect(() => { localStorage.setItem("khabarkoi.cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { const indexed = new Map(mealList.map((meal) => [meal.id, meal])); setCart((current) => { const next: Record<number, number> = {}; Object.entries(current).forEach(([id, qty]) => { const meal = indexed.get(Number(id)); if (meal && qty > 0 && meal.portions > 0) next[Number(id)] = Math.min(qty, meal.portions); }); return JSON.stringify(next) === JSON.stringify(current) ? current : next; }); }, [mealList]);
  useEffect(() => { localStorage.setItem("khabarkoi.orders", JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem("khabarkoi.address", JSON.stringify(address)); }, [address]);
  useEffect(() => { localStorage.setItem("khabarkoi.coordinates", JSON.stringify(deliveryCoordinates)); }, [deliveryCoordinates]);
  useEffect(() => { if (user) localStorage.setItem("khabarkoi.user", JSON.stringify(user)); else localStorage.removeItem("khabarkoi.user"); }, [user]);
  useEffect(() => { localStorage.setItem("khabarkoi.sellerApplications", JSON.stringify(sellerApplications)); }, [sellerApplications]);
  useEffect(() => {
    if (!backendKitchens.length) return;
    setSellerApplications((current) => {
      let changed = false;
      const next: Record<string, SellerApplicationRecord[]> = {};
      for (const [email, applications] of Object.entries(current)) {
        next[email] = applications.map((application) => {
          const backendRecord = backendKitchens.find((item) => item.id === application.kitchenId);
          if (backendRecord && backendRecord.status !== application.status) {
            changed = true;
            return { ...application, status: backendRecord.status };
          }
          return application;
        });
      }
      return changed ? next : current;
    });
  }, [backendKitchens]);

  const addItem = (id: number, qty = 1) => setCart((current) => {
    const meal = mealList.find((item) => item.id === id);
    if (!meal || !kitchenAccepting || meal.portions <= 0 || (meal.status !== "open" && meal.status !== "upcoming")) return current;
    return { ...current, [id]: Math.min(meal.portions, (current[id] || 0) + qty) };
  });
  const updateItem = (id: number, qty: number) => setCart((current) => { const next = { ...current }; const meal = mealList.find((item) => item.id === id); if (qty <= 0 || !meal || meal.portions <= 0) delete next[id]; else next[id] = Math.min(qty, meal.portions); return next; });
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = Object.entries(cart).reduce((sum, [id, qty]) => sum + (mealList.find((meal) => meal.id === Number(id))?.price ?? 0) * qty, 0);
  const handleAuthenticated = (nextUser: DemoUser) => {
    setUser(nextUser);
    setAuthMode(null);
    setAccountOpen(false);
    setRole("customer");
    if (pendingSellerIntent) {
      setPendingSellerIntent(false);
      setCreateKitchenError(null);
      setSellerApplicationOpen(true);
    }
  };
  const signOut = () => { setUser(null); setAccountOpen(false); setSellerApplicationOpen(false); setRole("customer"); };

  const beginSellerApplication = () => {
    setAccountOpen(false);
    setCreateKitchenError(null);
    if (!user) {
      setPendingSellerIntent(true);
      setAuthMode("signup");
      return;
    }
    setSellerApplicationOpen(true);
  };

  const handleWorkspaceChange = (nextRole: Role) => {
    if (nextRole !== "kitchen") {
      setRole(nextRole);
      return;
    }
    if (!user) {
      setPendingSellerIntent(true);
      setAuthMode("signup");
      return;
    }
    const applications = sellerApplications[user.email.toLowerCase()] ?? [];
    if (applications.length === 0) {
      setSellerApplicationOpen(true);
      return;
    }
    setRole("kitchen");
  };

  const refreshKitchens = async () => {
    setBackendLoading(true);
    setBackendError(null);
    try {
      setBackendKitchens(await getKitchens());
    } catch (error) {
      setBackendError(error instanceof Error ? error.message : "Failed to load kitchens");
    } finally {
      setBackendLoading(false);
    }
  };
  const placeOrder = (details: CheckoutDetails) => {
    const fee = details.method === "delivery" ? 25 : 0;
    const order: StoredOrder = {
      id: `KK-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      items: Object.entries(cart).filter(([, qty]) => qty > 0).map(([id, qty]) => {
        const meal = mealList.find((item) => item.id === Number(id))!;
        return { mealId: meal.id, name: lang === "bn" ? meal.bn : meal.en, qty, price: meal.price };
      }),
      subtotal, fee, total: subtotal + fee, method: details.method, address: details.address, phone: details.phone,
      payment: details.payment, status: "Confirmed", coordinates: details.coordinates, customer: user?.name || "Guest customer",
    };
    setOrders((current) => [order, ...current]);
    setTrackingOrder(order);
    setCart({});
    setCheckoutOpen(false);
  };
  const trackOrder = (order: StoredOrder) => { setOrdersOpen(false); setTrackingOrder(order); };
  const mySellerApplications = user ? (sellerApplications[user.email.toLowerCase()] ?? []) : [];
  const currentSellerApplication = [...mySellerApplications].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).find((application) => application.status === "ACTIVE")
    ?? [...mySellerApplications].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0]
    ?? null;
  const openSellerPortal = () => {
    setAccountOpen(false);
    if (!user) {
      setPendingSellerIntent(true);
      setAuthMode("signup");
      return;
    }
    if (!mySellerApplications.length) {
      setSellerApplicationOpen(true);
      return;
    }
    setRole("kitchen");
  };

  const handleCreateKitchen = async ({ name, description }: SellerApplicationDraft) => {
    if (!user) {
      setPendingSellerIntent(true);
      setAuthMode("signup");
      return;
    }

    setCreatingKitchen(true);
    setCreateKitchenError(null);
    const ownerEmail = user.email.toLowerCase();
    try {
      const createdKitchen = await createKitchen({
        // Temporary development-only owner; real authentication will derive this from the server session.
        ownerId: 1,
        name,
        description,
      });
      const application: SellerApplicationRecord = {
        userEmail: ownerEmail,
        kitchenId: createdKitchen.id,
        kitchenName: createdKitchen.name,
        description,
        status: createdKitchen.status,
        submittedAt: new Date().toISOString(),
      };
      setSellerApplications((current) => ({
        ...current,
        [ownerEmail]: [...(current[ownerEmail] ?? []), application],
      }));
      setBackendKitchens((current) => [
        createdKitchen,
        ...current.filter((item) => item.id !== createdKitchen.id),
      ]);
      setSellerApplicationOpen(false);
      setRole("kitchen");
      void refreshKitchens();
    } catch (error) {
      setCreateKitchenError(error instanceof Error ? error.message : "Failed to create kitchen.");
    } finally {
      setCreatingKitchen(false);
    }
  };
  return (
      <div className="app" data-theme={theme}>
        <Header
            lang={lang}
            setLang={setLang}
            role={role}
            setRole={handleWorkspaceChange}
            cartCount={cartCount}
            openCart={() => setCartOpen(true)}
            theme={theme}
            setTheme={setTheme}
            user={user}
            openAuth={() => setAuthMode("login")}
            openAccount={() => setAccountOpen(true)}
            address={address}
            openLocation={() => setLocationOpen(true)}
            openOrders={() => setOrdersOpen(true)}
        />

        <div className="workspace-mobile-switch" aria-label="Workspace preview">
          <button className={role === "customer" ? "active" : ""} onClick={() => handleWorkspaceChange("customer")}>Buyer</button>
          <button className={role === "kitchen" ? "active" : ""} onClick={() => handleWorkspaceChange("kitchen")}>Seller</button>
          <button className={role === "admin" ? "active" : ""} onClick={() => handleWorkspaceChange("admin")}>Admin preview</button>
        </div>

        {role === "customer" && (
            <CustomerHome
                lang={lang}
                meals={mealList}
                categories={categories}
                kitchenAccepting={kitchenAccepting}
                addItem={addItem}
                openMeal={setMealId}
                onBecomeSeller={beginSellerApplication}
            />
        )}

        {role === "kitchen" && currentSellerApplication && currentSellerApplication.status !== "ACTIVE" && (
            <SellerAccessPage
                application={currentSellerApplication}
                onBackToBuyer={() => setRole("customer")}
                onCreateAnother={beginSellerApplication}
                onRefresh={refreshKitchens}
                refreshing={backendLoading}
                refreshError={backendError}
            />
        )}

        {role === "kitchen" && currentSellerApplication?.status === "ACTIVE" && (
            <KitchenDashboard
                meals={mealList}
                setMeals={setMealList}
                orders={orders}
                setOrders={setOrders}
                categories={categories}
                accepting={kitchenAccepting}
                setAccepting={setKitchenAccepting}
                kitchenName={currentSellerApplication.kitchenName}
            />
        )}

        {role === "admin" && (
            <AdminDashboard
                orders={orders}
                setOrders={setOrders}
                categories={categories}
                setCategories={setCategories}
                meals={mealList}
                backendKitchens={backendKitchens}
                backendLoading={backendLoading}
                backendError={backendError}
                onRefreshKitchens={refreshKitchens}
            />
        )}

        {mealId && (
            <MealDetail
                id={mealId}
                lang={lang}
                meals={mealList}
                kitchenAccepting={kitchenAccepting}
                close={() => setMealId(null)}
                add={addItem}
            />
        )}

        {cartOpen && (
            <CartDrawer
                cart={cart}
                meals={mealList}
                update={updateItem}
                accepting={kitchenAccepting}
                close={() => setCartOpen(false)}
                checkout={() => {
                  setCartOpen(false);
                  setCheckoutOpen(true);
                }}
            />
        )}

        {checkoutOpen && (
            <Checkout
                subtotal={subtotal}
                defaultAddress={address}
                defaultCoordinates={deliveryCoordinates}
                accepting={kitchenAccepting}
                close={() => setCheckoutOpen(false)}
                placeOrder={(details) => {
                  setAddress(details.address || address);
                  setDeliveryCoordinates(details.coordinates);
                  placeOrder(details);
                }}
            />
        )}

        {trackingOrder && (
            <Tracking
                order={trackingOrder}
                close={() => setTrackingOrder(null)}
            />
        )}

        {authMode && (
            <AuthModal
                initialMode={authMode}
                close={() => setAuthMode(null)}
                onAuthenticated={handleAuthenticated}
            />
        )}

        {accountOpen && user && (
            <AccountModal
                user={user}
                close={() => setAccountOpen(false)}
                signOut={signOut}
                applications={mySellerApplications}
                onCreateKitchen={beginSellerApplication}
                openSellerPortal={openSellerPortal}
                openOrders={() => {
                  setAccountOpen(false);
                  setOrdersOpen(true);
                }}
            />
        )}

        {sellerApplicationOpen && (
            <SellerApplicationModal
                submitting={creatingKitchen}
                error={createKitchenError}
                onClose={() => { if (!creatingKitchen) setSellerApplicationOpen(false); }}
                onSubmit={handleCreateKitchen}
            />
        )}

        {locationOpen && (
            <LocationEditor
                initialAddress={address}
                initialCoordinates={deliveryCoordinates}
                close={() => setLocationOpen(false)}
                save={(nextAddress, coords) => {
                  setAddress(nextAddress);
                  setDeliveryCoordinates(coords);
                  setLocationOpen(false);
                }}
            />
        )}

        {ordersOpen && (
            <OrdersModal
                orders={orders}
                close={() => setOrdersOpen(false)}
                track={trackOrder}
            />
        )}

        {role === "customer" && (
            <nav className="mobile-nav">
              <button
                  className="active"
                  onClick={() =>
                      window.scrollTo({ top: 0, behavior: "smooth" })
                  }
              >
                <Icon name="home" />
                <span>Home</span>
              </button>

              <button
                  onClick={() =>
                      document
                          .getElementById("menu")
                          ?.scrollIntoView({ behavior: "smooth" })
                  }
              >
                <Icon name="search" />
                <span>Explore</span>
              </button>

              <button onClick={() => setCartOpen(true)}>
                <Icon name="bag" />
                <span>Cart</span>
                {cartCount > 0 && <b>{cartCount}</b>}
              </button>

              <button onClick={() => setOrdersOpen(true)}>
                <Icon name="orders" />
                <span>Orders</span>
              </button>
            </nav>
        )}
      </div>
  );
}
