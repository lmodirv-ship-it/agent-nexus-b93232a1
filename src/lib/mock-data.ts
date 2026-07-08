// طبقة بيانات وهمية تفاعلية — جاهزة للاستبدال بـ REST API لاحقاً
// كل الأنواع مصدرة لاستخدامها في الصفحات

export type SiteStatus = "online" | "maintenance" | "offline";
export interface Site {
  id: string;
  domain: string;
  name: string;
  status: SiteStatus;
  users: number;
  cpu: number;
  ram: number;
  storage: string;
  db: "Postgres" | "MySQL" | "Mongo";
  replicas: number;
  hex: string;
}

export const MOCK_SITES: Site[] = [
  { id: "s1", domain: "souk.hn",     name: "سوق hn",       status: "online",      users: 12480, cpu: 62, ram: 71, storage: "480 GB", db: "Postgres", replicas: 3, hex: "#22d3ee" },
  { id: "s2", domain: "forum.hn",    name: "منتدى hn",     status: "online",      users: 8210,  cpu: 45, ram: 58, storage: "220 GB", db: "MySQL",    replicas: 2, hex: "#a78bfa" },
  { id: "s3", domain: "news.hn",     name: "أخبار hn",     status: "online",      users: 5430,  cpu: 30, ram: 42, storage: "95 GB",  db: "Postgres", replicas: 2, hex: "#38bdf8" },
  { id: "s4", domain: "learn.hn",    name: "منصة التعلم",  status: "maintenance", users: 3120,  cpu: 12, ram: 18, storage: "310 GB", db: "Mongo",    replicas: 1, hex: "#fbbf24" },
  { id: "s5", domain: "cloud.hn",    name: "التخزين",      status: "online",      users: 6980,  cpu: 78, ram: 82, storage: "1.2 TB", db: "Postgres", replicas: 4, hex: "#34d399" },
  { id: "s6", domain: "chat.hn",     name: "المحادثات",    status: "online",      users: 21050, cpu: 55, ram: 64, storage: "180 GB", db: "Mongo",    replicas: 3, hex: "#f472b6" },
  { id: "s7", domain: "pay.hn",      name: "المدفوعات",    status: "online",      users: 4310,  cpu: 40, ram: 51, storage: "60 GB",  db: "Postgres", replicas: 2, hex: "#22d3ee" },
  { id: "s8", domain: "dev.hn",      name: "بيئة التطوير", status: "offline",     users: 0,     cpu: 0,  ram: 0,  storage: "40 GB",  db: "Postgres", replicas: 0, hex: "#fb7185" },
];

export interface DbRow {
  id: string; name: string; engine: "Postgres" | "MySQL" | "Mongo" | "Redis";
  size: string; connections: number; queriesPerSec: number; status: "healthy" | "warning" | "critical";
  hex: string;
}
export const MOCK_DBS: DbRow[] = [
  { id: "d1", name: "hn_platform_core",   engine: "Postgres", size: "48 GB",  connections: 124, queriesPerSec: 830, status: "healthy",  hex: "#38bdf8" },
  { id: "d2", name: "souk_orders",        engine: "Postgres", size: "22 GB",  connections: 88,  queriesPerSec: 512, status: "healthy",  hex: "#22d3ee" },
  { id: "d3", name: "forum_threads",      engine: "MySQL",    size: "14 GB",  connections: 62,  queriesPerSec: 340, status: "warning",  hex: "#fbbf24" },
  { id: "d4", name: "chat_messages",      engine: "Mongo",    size: "72 GB",  connections: 210, queriesPerSec: 1210,status: "healthy",  hex: "#34d399" },
  { id: "d5", name: "sessions_cache",     engine: "Redis",    size: "1.8 GB", connections: 340, queriesPerSec: 4820,status: "healthy",  hex: "#fb7185" },
  { id: "d6", name: "analytics_events",   engine: "Postgres", size: "112 GB", connections: 45,  queriesPerSec: 190, status: "critical", hex: "#fb7185" },
];

export interface StorageItem { id: string; name: string; kind: "folder" | "file"; size: string; updated: string; visibility: "public" | "private" | "shared"; }
export const MOCK_STORAGE: StorageItem[] = [
  { id: "f1", name: "sites/",           kind: "folder", size: "820 GB", updated: "قبل 3 دقائق",  visibility: "shared" },
  { id: "f2", name: "backups/",         kind: "folder", size: "1.2 TB", updated: "قبل ساعة",      visibility: "private" },
  { id: "f3", name: "media/",           kind: "folder", size: "340 GB", updated: "قبل 12 دقيقة",  visibility: "public" },
  { id: "f4", name: "logs/",            kind: "folder", size: "68 GB",  updated: "الآن",           visibility: "private" },
  { id: "f5", name: "core-db.sql.gz",   kind: "file",   size: "428 MB", updated: "قبل 20 دقيقة",  visibility: "private" },
  { id: "f6", name: "banner-2026.jpg",  kind: "file",   size: "3.2 MB", updated: "أمس",            visibility: "public" },
  { id: "f7", name: "report-q2.pdf",    kind: "file",   size: "1.1 MB", updated: "قبل يومين",     visibility: "shared" },
];

export interface AttackAttempt {
  id: string; ip: string; country: string; flag: string; type: "brute-force" | "sqli" | "xss" | "ddos" | "scan"; target: string; blocked: boolean; time: string;
}
export const MOCK_ATTACKS: AttackAttempt[] = [
  { id: "a1", ip: "41.92.10.44",    country: "المغرب",  flag: "🇲🇦", type: "brute-force", target: "souk.hn/admin",  blocked: true,  time: "12:31:00" },
  { id: "a2", ip: "185.220.101.7",  country: "ألمانيا", flag: "🇩🇪", type: "sqli",        target: "forum.hn/api",    blocked: true,  time: "12:29:14" },
  { id: "a3", ip: "104.28.14.180",  country: "أمريكا",  flag: "🇺🇸", type: "ddos",        target: "chat.hn",         blocked: true,  time: "12:22:00" },
  { id: "a4", ip: "203.0.113.44",   country: "الصين",   flag: "🇨🇳", type: "scan",        target: "pay.hn",          blocked: true,  time: "12:15:11" },
  { id: "a5", ip: "94.156.35.10",   country: "روسيا",   flag: "🇷🇺", type: "xss",         target: "news.hn/comment", blocked: false, time: "12:10:00" },
  { id: "a6", ip: "45.155.205.99",  country: "هولندا",  flag: "🇳🇱", type: "brute-force", target: "learn.hn/login",  blocked: true,  time: "12:04:22" },
];

export interface ApiKey { id: string; label: string; prefix: string; scopes: string[]; created: string; lastUsed: string; active: boolean; }
export const MOCK_KEYS: ApiKey[] = [
  { id: "k1", label: "لوحة المالك",        prefix: "sk_live_a91c…", scopes: ["*"],                    created: "2026-01-14", lastUsed: "الآن",       active: true },
  { id: "k2", label: "تطبيق souk",         prefix: "sk_live_71fe…", scopes: ["sites:read", "db:read"], created: "2026-03-02", lastUsed: "قبل 3 د",   active: true },
  { id: "k3", label: "خدمة النسخ الاحتياطي", prefix: "sk_live_a3d0…", scopes: ["backup:*"],              created: "2026-02-11", lastUsed: "قبل ساعة", active: true },
  { id: "k4", label: "مطور خارجي — مجمّد",   prefix: "sk_live_00fa…", scopes: ["sites:read"],           created: "2025-12-05", lastUsed: "قبل شهر",  active: false },
];

export interface Backup {
  id: string; name: string; target: "قاعدة الدماغ" | "قواعد المواقع" | "التخزين"; size: string; created: string;
  status: "completed" | "running" | "failed"; type: "auto" | "manual";
}
export const MOCK_BACKUPS: Backup[] = [
  { id: "b1", name: "core_db_2026-07-08_12-00", target: "قاعدة الدماغ",  size: "428 MB", created: "12:00", status: "completed", type: "auto" },
  { id: "b2", name: "sites_all_2026-07-08_11-00",target: "قواعد المواقع",size: "3.4 GB", created: "11:00", status: "completed", type: "auto" },
  { id: "b3", name: "storage_2026-07-08_10-00",  target: "التخزين",       size: "18 GB",  created: "10:00", status: "completed", type: "auto" },
  { id: "b4", name: "core_db_2026-07-08_09-00",  target: "قاعدة الدماغ",  size: "420 MB", created: "09:00", status: "completed", type: "auto" },
  { id: "b5", name: "manual_2026-07-08_08-32",   target: "قواعد المواقع", size: "3.1 GB", created: "08:32", status: "running",   type: "manual" },
  { id: "b6", name: "core_db_2026-07-07_23-00",  target: "قاعدة الدماغ",  size: "415 MB", created: "أمس",   status: "failed",    type: "auto" },
];

// موقع IP على خريطة مسطحة (equirectangular): lat/lng → x/y بنسبة 0..1
export const ATTACK_COORDS: { x: number; y: number; hex: string }[] = [
  { x: 0.52, y: 0.42, hex: "#fb7185" }, // Morocco
  { x: 0.53, y: 0.30, hex: "#a78bfa" }, // Germany
  { x: 0.22, y: 0.36, hex: "#22d3ee" }, // USA
  { x: 0.82, y: 0.40, hex: "#fbbf24" }, // China
  { x: 0.62, y: 0.25, hex: "#fb7185" }, // Russia
  { x: 0.53, y: 0.29, hex: "#34d399" }, // NL
];
