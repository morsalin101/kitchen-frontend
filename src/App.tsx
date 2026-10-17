import { useMemo, useState } from "react";

type Role = "customer" | "kitchen" | "admin";
type Lang = "en" | "bn";
type Status = "open" | "closed" | "soldout" | "upcoming";

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

function Header({ lang, setLang, role, setRole, cartCount, openCart }: { lang: Lang; setLang: (l: Lang) => void; role: Role; setRole: (r: Role) => void; cartCount: number; openCart: () => void }) {
  const t = copy[lang];
  return <header className="topbar">
    <div className="header-main">
      <Logo />
      <div className="role-switch">
        {(["customer", "kitchen", "admin"] as Role[]).map((item) => <button key={item} className={role === item ? "active" : ""} onClick={() => setRole(item)}>{t[item]}</button>)}
      </div>
      <div className="header-actions">
        <button className="location"><Icon name="pin" size={18} /><span><small>{t.location}</small><strong>Dhaka University</strong></span></button>
        <div className="lang"><button className={lang === "bn" ? "active" : ""} onClick={() => setLang("bn")}>বাংলা</button><span>|</span><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button></div>
        {role === "customer" && <button className="icon-button cart-button" onClick={openCart}><Icon name="bag" />{cartCount > 0 && <b>{cartCount}</b>}</button>}
        <button className="profile-button"><span>SR</span><Icon name="chevron" size={16} /></button>
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
  const categories = ["All", "Breakfast", "Lunch", "Dinner", "Vegetarian", "Snacks"];
  const filtered = useMemo(() => meals.filter((meal) => {
    const matchSearch = `${meal.en} ${meal.bn} ${kitchens[meal.kitchen].name}`.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || meal.cat === category;
    return matchSearch && matchCat && (!availability || meal.status === "open");
  }), [search, category, availability]);

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
          <Icon name="search" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} />
          <button className="filter-trigger">Delivery: Any <span>⌄</span></button>
          <Button>Search</Button>
        </div>
        <div className="section-heading"><div><span className="eyebrow">{t.available}</span><h2>{lang === "bn" ? "আজ কী খেতে চান?" : "What are you craving today?"}</h2></div><button className={`availability-toggle ${availability ? "active" : ""}`} onClick={() => setAvailability(!availability)}><span></span> Open now</button></div>
        <div className="category-row">
          {categories.map((cat) => <button key={cat} className={category === cat ? "active" : ""} onClick={() => setCategory(cat)}>{cat === "All" ? t.all : cat}</button>)}
        </div>
        <div className="result-line"><strong>{filtered.length} {t.results}</strong><button>Recommended <span>⌄</span></button></div>
        <div className="food-grid">{filtered.map((meal) => <FoodCard key={meal.id} meal={meal} lang={lang} onOpen={() => openMeal(meal.id)} onAdd={() => addItem(meal.id)} />)}</div>
        {filtered.length === 0 && <div className="empty-state"><Icon name="search" size={32} /><strong>No meals found</strong><span>Try a different search or category.</span></div>}
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

function Checkout({ total, close, placeOrder }: { total: number; close: () => void; placeOrder: () => void }) {
  const [method, setMethod] = useState("delivery");
  return <Modal close={close}>
    <div className="checkout"><span className="eyebrow">Almost there</span><h2>Checkout</h2>
      <div className="choice-grid"><button className={method === "delivery" ? "active" : ""} onClick={() => setMethod("delivery")}><Icon name="pin" /><strong>Delivery</strong><small>25–35 min · ৳25</small></button><button className={method === "pickup" ? "active" : ""} onClick={() => setMethod("pickup")}><Icon name="bag" /><strong>Pickup</strong><small>Ready by 1:00 PM</small></button></div>
      <label>Delivery location<input defaultValue="Shamsunnahar Hall, Gate 2" /></label>
      <label>Phone number<input defaultValue="+880 1712 345 678" /></label>
      <div className="payment"><strong>Payment method</strong><label><input type="radio" defaultChecked name="pay" /> Cash on delivery <span>Recommended</span></label><label><input type="radio" name="pay" /> bKash / Nagad</label></div>
      <div className="checkout-total"><span>Total to pay</span><strong>৳{total}</strong></div><Button className="full" onClick={placeOrder}>Place order <Icon name="arrow" /></Button>
    </div>
  </Modal>;
}

function Tracking({ close }: { close: () => void }) {
  return <Modal close={close}><div className="tracking"><span className="success-mark">✓</span><span className="eyebrow">Order #KK-1024</span><h2>Your lunch is being prepared</h2><p>Estimated delivery: <strong>1:00–1:20 PM</strong></p>
    <div className="timeline"><div className="done"><i>✓</i><div><strong>Order confirmed</strong><small>12:03 PM</small></div></div><div className="active"><i></i><div><strong>Cooking in progress</strong><small>Nabila started preparing your meal</small></div></div><div><i></i><div><strong>Ready for delivery</strong><small>Up next</small></div></div><div><i></i><div><strong>Delivered</strong></div></div></div>
    <div className="rider"><span className="avatar">RI</span><div><small>DELIVERY PARTNER</small><strong>Rifat Islam</strong><span>★ 4.9 · Campus runner</span></div><Button variant="secondary">Call</Button></div>
    <Button className="full" variant="ghost" onClick={close}>Back to menu</Button>
  </div></Modal>;
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
  const [lang, setLang] = useState<Lang>("en");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [mealId, setMealId] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const addItem = (id: number, qty = 1) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + qty }));
  const updateItem = (id: number, qty: number) => setCart((c) => ({ ...c, [id]: Math.max(0, qty) }));
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = Object.entries(cart).reduce((sum, [id, qty]) => sum + meals.find((m) => m.id === Number(id))!.price * qty, 0) + 25;
  return <div className="app">
    <Header lang={lang} setLang={setLang} role={role} setRole={setRole} cartCount={cartCount} openCart={() => setCartOpen(true)} />
    {role === "customer" && <CustomerHome lang={lang} addItem={addItem} openMeal={setMealId} />}
    {role === "kitchen" && <KitchenDashboard />}
    {role === "admin" && <AdminDashboard />}
    {mealId && <MealDetail id={mealId} lang={lang} close={() => setMealId(null)} add={addItem} />}
    {cartOpen && <CartDrawer cart={cart} update={updateItem} close={() => setCartOpen(false)} checkout={() => { setCartOpen(false); setCheckoutOpen(true); }} />}
    {checkoutOpen && <Checkout total={total} close={() => setCheckoutOpen(false)} placeOrder={() => { setCheckoutOpen(false); setCart({}); setTrackingOpen(true); }} />}
    {trackingOpen && <Tracking close={() => setTrackingOpen(false)} />}
    {role === "customer" && <nav className="mobile-nav"><button className="active"><Icon name="home" /><span>Home</span></button><button><Icon name="search" /><span>Explore</span></button><button onClick={() => setCartOpen(true)}><Icon name="bag" /><span>Cart</span>{cartCount > 0 && <b>{cartCount}</b>}</button><button><Icon name="orders" /><span>Orders</span></button></nav>}
  </div>;
}
