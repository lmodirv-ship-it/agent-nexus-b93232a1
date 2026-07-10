import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Code2, Copy, Check } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/_authenticated/hub/sdk")({
  head: () => ({ meta: [{ title: "HN Hub SDK — SUPER ADMIN" }] }),
  component: SdkPage,
});

const PHP_CODE = `<?php
// hn-hub-sdk.php  — الصقه في كل موقع من مجموعة hn-group
define('HN_HUB_URL',    'https://project--ca0f222c-0da7-48ce-a954-6211a0ae6c4b.lovable.app');
define('HN_HUB_API_KEY',    getenv('HN_HUB_API_KEY'));     // من CSV
define('HN_HUB_SECRET',     getenv('HN_HUB_SECRET'));      // من CSV

function hn_hub_post($path, $payload) {
  $body = json_encode($payload);
  $sig  = hash_hmac('sha256', $body, HN_HUB_SECRET);
  $ch = curl_init(HN_HUB_URL . $path);
  curl_setopt_array($ch, [
    CURLOPT_POST => 1,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_RETURNTRANSFER => 1,
    CURLOPT_HTTPHEADER => [
      'Content-Type: application/json',
      'x-api-key: ' . HN_HUB_API_KEY,
      'x-hn-signature: ' . $sig,
    ],
  ]);
  $res = curl_exec($ch); curl_close($ch);
  return $res;
}

function hn_heartbeat() {
  return hn_hub_post('/api/public/hub/heartbeat',
    ['ts' => time(), 'version' => '1.0']);
}

function hn_emit($type, $payload = []) {
  return hn_hub_post('/api/public/hub/ingest',
    ['type' => $type, 'payload' => $payload]);
}

function hn_verify_incoming() {
  $body = file_get_contents('php://input');
  $sig  = $_SERVER['HTTP_X_HN_SIGNATURE'] ?? '';
  $calc = hash_hmac('sha256', $body, HN_HUB_SECRET);
  return hash_equals($calc, $sig) ? json_decode($body, true) : null;
}

// أمثلة:
//   hn_heartbeat();                                        // كل 30 ثانية (cron)
//   hn_emit('order.created', ['id' => 123, 'total' => 90]);
//   hn_emit('mail.received', ['from' => 'x@y.com', 'subject' => '...']);
`;

const NODE_CODE = `// hn-hub-sdk.mjs  — الصقه في كل موقع Node.js
import crypto from "node:crypto";

const HUB     = "https://project--ca0f222c-0da7-48ce-a954-6211a0ae6c4b.lovable.app";
const API_KEY = process.env.HN_HUB_API_KEY;   // من CSV
const SECRET  = process.env.HN_HUB_SECRET;    // من CSV

async function post(path, payload) {
  const body = JSON.stringify(payload);
  const sig  = crypto.createHmac("sha256", SECRET).update(body).digest("hex");
  const res  = await fetch(HUB + path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY,
      "x-hn-signature": sig,
    },
    body,
  });
  return res.json();
}

export const heartbeat = () =>
  post("/api/public/hub/heartbeat", { ts: Date.now(), version: "1.0" });

export const emit = (type, payload = {}) =>
  post("/api/public/hub/ingest", { type, payload });

export function verifyIncoming(req, rawBody) {
  const sig  = req.headers["x-hn-signature"] || "";
  const calc = crypto.createHmac("sha256", SECRET).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(calc));
}

// setInterval(heartbeat, 30_000);
// emit("order.created", { id: 123, total: 90 });
`;

function SdkPage() {
  const [tab, setTab] = useState<"php" | "node">("php");
  const [copied, setCopied] = useState(false);
  const code = tab === "php" ? PHP_CODE : NODE_CODE;

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <PageHeader
        icon={Code2}
        title="HN Hub SDK"
        subtitle="الصق هذا الملف في كل موقع من مجموعة hn-group — يحتاج فقط HN_HUB_API_KEY و HN_HUB_SECRET من ملف CSV"
      />

      <div className="panel p-3 mb-4 flex items-center gap-2">
        {(["php", "node"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              tab === t
                ? "border-cyan-neon/60 bg-cyan-neon/15 text-white"
                : "border-white/10 text-slate-400 hover:text-slate-200"
            }`}
          >
            {t === "php" ? "PHP" : "Node.js"}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={copy}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs border border-white/10 hover:border-emerald-400/50 text-slate-300 hover:text-emerald-300 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "تم النسخ" : "نسخ الكود"}
        </button>
      </div>

      <div className="panel p-0 overflow-hidden">
        <pre
          dir="ltr"
          className="p-5 text-xs leading-relaxed text-slate-200 overflow-auto max-h-[70vh] font-mono bg-black/40"
        >
          {code}
        </pre>
      </div>

      <div className="panel p-4 mt-4 text-sm text-slate-300 leading-relaxed">
        <div className="font-semibold text-white mb-2">التركيب في 3 خطوات:</div>
        <ol className="list-decimal pr-5 space-y-1 text-xs">
          <li>افتح ملف <code className="text-cyan-neon">CSV</code> الذي نزّلته من صفحة المواقع.</li>
          <li>خذ الصف الخاص بالموقع، اضبط <code>HN_HUB_API_KEY</code> و <code>HN_HUB_SECRET</code> كمتغيّرات بيئة.</li>
          <li>استدعِ <code>heartbeat()</code> كل 30 ثانية (cron) وأرسل الأحداث بـ <code>emit(type, payload)</code>.</li>
        </ol>
      </div>
    </div>
  );
}
