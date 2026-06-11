export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">

      {/* ── Sea wave background photo ─────────────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/sea-wave-bg.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />

      {/* ── Dark teal overlay — preserves glassmorphism palette ── */}
      <div className="absolute inset-0" style={{
        zIndex: 1,
        background: "linear-gradient(160deg, rgba(7,27,30,0.82) 0%, rgba(12,42,48,0.78) 45%, rgba(7,27,30,0.88) 100%)",
      }} />

      {/* ── Ambient glow orbs (on top of overlay) ────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full"
             style={{ background: "radial-gradient(circle, rgba(24,178,188,0.14) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -left-32 w-[450px] h-[450px] rounded-full"
             style={{ background: "radial-gradient(circle, rgba(245,166,35,0.10) 0%, transparent 70%)" }} />
      </div>

      <div className="relative w-full" style={{ zIndex: 3 }}>{children}</div>
    </div>
  );
}
