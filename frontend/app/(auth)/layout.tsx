export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden"
         style={{ background: "linear-gradient(160deg, #071B1E 0%, #0C2A30 45%, #071B1E 100%)" }}>

      {/* ── Ambient glow orbs — mirrors the reference UI lighting ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Teal radial glow — top right */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full"
             style={{ background: "radial-gradient(circle, rgba(24,178,188,0.18) 0%, transparent 70%)" }} />
        {/* Amber radial glow — bottom left */}
        <div className="absolute -bottom-32 -left-32 w-[450px] h-[450px] rounded-full"
             style={{ background: "radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)" }} />
        {/* Soft teal mid glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full"
             style={{ background: "radial-gradient(ellipse, rgba(24,178,188,0.06) 0%, transparent 65%)" }} />
      </div>

      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
