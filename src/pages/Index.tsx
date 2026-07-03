import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

interface Squad {
  id: number;
  name: string;
  handle: string;
  emoji: string;
  gradient: string;
  likes: number;
}

const STORAGE_KEY = 'camp_squad_likes_v1';
const ORDER_KEY = 'camp_squad_order_v1';

const initialSquads: Squad[] = [
  { id: 1, name: 'Отряд 1', handle: '@otryad_one', emoji: '🌷', gradient: 'from-[hsl(350,60%,88%)] to-[hsl(30,50%,86%)]', likes: 0 },
  { id: 2, name: 'Отряд 2', handle: '@otryad_two', emoji: '🌿', gradient: 'from-[hsl(140,30%,82%)] to-[hsl(40,45%,86%)]', likes: 0 },
  { id: 3, name: 'Отряд 3', handle: '@otryad_three', emoji: '☀️', gradient: 'from-[hsl(45,60%,84%)] to-[hsl(28,50%,84%)]', likes: 0 },
  { id: 4, name: 'Отряд 4', handle: '@otryad_four', emoji: '🍑', gradient: 'from-[hsl(20,55%,86%)] to-[hsl(350,50%,88%)]', likes: 0 },
];

const PASSWORD = 'blog2026';

interface FloatingHeart {
  id: number;
}

const Index = () => {
  const [squads, setSquads] = useState<Squad[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<number, number>;
        return initialSquads.map((s) => ({ ...s, likes: parsed[s.id] ?? 0 }));
      }
    } catch { /* ignore */ }
    return initialSquads;
  });

  const [order, setOrder] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(ORDER_KEY);
      if (saved) return JSON.parse(saved) as number[];
    } catch { /* ignore */ }
    return [...squads].sort((a, b) => b.likes - a.likes).map((s) => s.id);
  });

  const [isCounselor, setIsCounselor] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [poppingId, setPoppingId] = useState<number | null>(null);
  const [floats, setFloats] = useState<Record<number, FloatingHeart[]>>({});
  const [justRefreshed, setJustRefreshed] = useState(false);
  const floatCounter = useRef(0);

  useEffect(() => {
    const map: Record<number, number> = {};
    squads.forEach((s) => { map[s.id] = s.likes; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }, [squads]);

  useEffect(() => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  }, [order]);

  const refreshOrder = () => {
    const newOrder = [...squads].sort((a, b) => b.likes - a.likes).map((s) => s.id);
    setOrder(newOrder);
    setJustRefreshed(true);
    setTimeout(() => setJustRefreshed(false), 900);
  };

  const isOrderStale = order.some((id, idx) => {
    const properOrder = [...squads].sort((a, b) => b.likes - a.likes).map((s) => s.id);
    return properOrder[idx] !== id;
  });

  const sorted = order
    .map((id) => squads.find((s) => s.id === id))
    .filter((s): s is Squad => Boolean(s));

  const addLike = (id: number) => {
    if (!isCounselor) return;
    setSquads((prev) => prev.map((s) => (s.id === id ? { ...s, likes: s.likes + 1 } : s)));
    setPoppingId(id);
    setTimeout(() => setPoppingId((p) => (p === id ? null : p)), 500);

    const fid = floatCounter.current++;
    setFloats((prev) => ({ ...prev, [id]: [...(prev[id] || []), { id: fid }] }));
    setTimeout(() => {
      setFloats((prev) => ({ ...prev, [id]: (prev[id] || []).filter((f) => f.id !== fid) }));
    }, 900);
  };

  const removeLike = (id: number) => {
    if (!isCounselor) return;
    setSquads((prev) => prev.map((s) => (s.id === id ? { ...s, likes: Math.max(0, s.likes - 1) } : s)));
  };

  const handleLogin = () => {
    if (password === PASSWORD) {
      setIsCounselor(true);
      setShowLogin(false);
      setError(false);
      setPassword('');
    } else {
      setError(true);
    }
  };

  const rankLabels = ['🥇', '🥈', '🥉', ''];

  return (
    <div className="min-h-screen w-full px-4 py-6 sm:px-6 lg:px-8">
      {/* Top bar */}
      <div className="mx-auto flex max-w-5xl items-center justify-end">
        {!isCounselor ? (
          <button
            onClick={() => { setShowLogin((v) => !v); setError(false); }}
            className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-cocoa shadow-[0_4px_20px_-6px_rgba(120,80,60,0.3)] transition-all hover:scale-105 hover:shadow-[0_6px_24px_-6px_rgba(120,80,60,0.4)]"
          >
            <Icon name="Lock" size={16} />
            Войти как вожатый
          </button>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <span className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-cocoa shadow-sm">
              Режим вожатого включён 🤎
            </span>
            <button
              onClick={() => setIsCounselor(false)}
              className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:scale-105"
            >
              <Icon name="LogOut" size={15} />
              Выйти
            </button>
          </div>
        )}
      </div>

      {isCounselor && (
        <div className="mx-auto mt-4 flex max-w-5xl justify-end">
          <button
            onClick={refreshOrder}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-all active:scale-95 ${
              isOrderStale
                ? 'animate-pulse bg-primary text-primary-foreground hover:brightness-105'
                : 'bg-card text-muted-foreground hover:scale-105'
            }`}
          >
            <Icon name={justRefreshed ? 'Check' : 'RefreshCw'} size={16} />
            {isOrderStale ? 'Обновить рейтинг' : 'Рейтинг актуален'}
          </button>
        </div>
      )}

      {/* Login panel */}
      {showLogin && !isCounselor && (
        <div className="mx-auto mt-3 flex max-w-xs animate-fade-in flex-col gap-3 rounded-3xl bg-card p-5 shadow-[0_10px_40px_-12px_rgba(120,80,60,0.35)] sm:ml-auto sm:mr-0 sm:max-w-sm">
          <label className="text-sm font-medium text-cocoa">Пароль вожатого</label>
          <input
            type="password"
            value={password}
            autoFocus
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••"
            className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {error && <p className="text-sm text-rosee">Кажется, пароль не подошёл 🌸</p>}
          <button
            onClick={handleLogin}
            className="rounded-2xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-95"
          >
            Войти
          </button>
        </div>
      )}

      {/* Header */}
      <header className="mx-auto mt-8 max-w-3xl animate-fade-in text-center">
        <h1 className="font-display text-3xl font-bold leading-tight text-cocoa sm:text-5xl">
          ❤️ Кто наберёт больше лайков?
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
          За хорошие поступки, участие в активностях, помощь и поддержку своего отряда.
        </p>
      </header>

      {/* Cards */}
      <main className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
        {sorted.map((squad, i) => (
          <article
            key={squad.id}
            className="group relative animate-card-rise overflow-hidden rounded-[2rem] bg-card shadow-[0_12px_40px_-16px_rgba(120,80,60,0.35)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_-16px_rgba(120,80,60,0.45)]"
            style={{ animationDelay: `${i * 90}ms`, opacity: 0 }}
          >
            {/* rank badge */}
            {!isOrderStale && rankLabels[i] && (
              <div className="absolute right-4 top-4 z-10 text-2xl drop-shadow-sm">{rankLabels[i]}</div>
            )}

            {/* profile header */}
            <div className={`bg-gradient-to-br ${squad.gradient} px-6 pb-8 pt-7`}>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-card bg-cream text-3xl shadow-md">
                  {squad.emoji}
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-cocoa">{squad.name}</h2>
                  <p className="text-sm text-cocoa/70">{squad.handle}</p>
                </div>
              </div>
              <p className="mt-4 text-sm italic text-cocoa/80">наш блог только начинается…</p>
            </div>

            {/* body */}
            <div className="relative flex flex-col items-center px-6 py-7">
              {/* floating hearts */}
              {(floats[squad.id] || []).map((f) => (
                <span
                  key={f.id}
                  className="pointer-events-none absolute left-1/2 top-8 z-20 animate-float-up text-3xl"
                >
                  ❤️
                </span>
              ))}

              <button
                onClick={() => addLike(squad.id)}
                disabled={!isCounselor}
                aria-label="Поставить лайк"
                className={`relative text-6xl transition-transform ${poppingId === squad.id ? 'animate-heart-pop' : ''} ${isCounselor ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-not-allowed opacity-60'}`}
              >
                ❤️
              </button>

              <div className="mt-3 font-display text-4xl font-bold text-cocoa">{squad.likes}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">лайков собрано</div>

              <div className="mt-5 flex w-full items-center gap-2">
                {isCounselor && (
                  <button
                    onClick={() => removeLike(squad.id)}
                    disabled={squad.likes === 0}
                    aria-label="Убрать лайк"
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-secondary text-cocoa transition-all hover:brightness-95 active:scale-95 ${
                      squad.likes === 0 ? 'cursor-not-allowed opacity-40' : ''
                    }`}
                  >
                    <Icon name="Minus" size={18} />
                  </button>
                )}
                <button
                  onClick={() => addLike(squad.id)}
                  disabled={!isCounselor}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-all ${
                    isCounselor
                      ? 'bg-primary text-primary-foreground hover:brightness-105 active:scale-95'
                      : 'cursor-not-allowed bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon name="Heart" size={17} />
                  Поставить лайк
                </button>
              </div>

              {!isCounselor && (
                <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon name="Lock" size={12} /> Лайки доступны только вожатым
                </p>
              )}
            </div>
          </article>
        ))}
      </main>

      {/* Footer */}
      <footer className="mx-auto mt-16 max-w-3xl pb-8 text-center">
        <p className="font-display text-lg text-cocoa">🤎 Каждое доброе дело имеет значение.</p>
      </footer>
    </div>
  );
};

export default Index;