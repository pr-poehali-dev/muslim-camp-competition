import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

interface Member {
  id: string;
  name: string;
  likes: number;
}

interface Squad {
  id: number;
  name: string;
  handle: string;
  emoji: string;
  avatar?: string;
  gradient: string;
  teamLikes: number;
  members: Member[];
}

const COUNSELOR_KEY = 'camp_counselor_mode_v1';
const PASSWORD = 'blog2026';

const squadMemberNames: Record<number, string[]> = {
  1: ['Гилязутдинова Азалия', 'Гилязутдинова Диляра', 'Бикатова Камиля', 'Ломаева Алена', 'Балагатдинова Ясмина'],
  2: ['Саттарова Румия', 'Абдуллина Амина', 'Бекчанова Динара', 'Измайлова Асия', 'Рахимова Айша', 'Нургалиева Лейсан'],
  3: ['Мологалиева Риана', 'Нуруллина Амалия', 'Андреева Алина', 'Губайдуллина Джамиля', 'Хайдарова Зарина'],
  4: ['Ал Торшан Дана', 'Ал Торшан Ая', 'Хасанова Амина', 'Гайнетдинова Алия', 'Латыпова Малика'],
};

const baseSquads: Omit<Squad, 'teamLikes' | 'members'>[] = [
  { id: 1, name: 'Я.Д.А.К.А.', handle: '', emoji: '🌷', avatar: 'https://cdn.poehali.dev/projects/1b7a3993-47d5-493f-b6da-b2a3a96a6b72/bucket/6a48ba13-eb8f-45e6-a32c-a95ccb16665f.jpg', gradient: 'from-[hsl(350,60%,88%)] to-[hsl(30,50%,86%)]' },
  { id: 2, name: 'SABR', handle: '', emoji: '🌿', avatar: 'https://cdn.poehali.dev/projects/1b7a3993-47d5-493f-b6da-b2a3a96a6b72/bucket/e8169a59-5b19-4150-b08d-a0c86fe1a155.jpg', gradient: 'from-[hsl(140,30%,82%)] to-[hsl(40,45%,86%)]' },
  { id: 3, name: 'Никяхнулись с мемами', handle: '', emoji: '☀️', avatar: 'https://cdn.poehali.dev/projects/1b7a3993-47d5-493f-b6da-b2a3a96a6b72/bucket/144c7e0c-32d3-4537-8e67-d9c1732308dd.jpg', gradient: 'from-[hsl(45,60%,84%)] to-[hsl(28,50%,84%)]' },
  { id: 4, name: 'Мусульманки', handle: '', emoji: '🍑', avatar: 'https://cdn.poehali.dev/projects/1b7a3993-47d5-493f-b6da-b2a3a96a6b72/bucket/6f9c0728-d953-43cf-b018-884b6833d0dd.jpg', gradient: 'from-[hsl(20,55%,86%)] to-[hsl(350,50%,88%)]' },
];

const makeMembers = (squadId: number): Member[] =>
  (squadMemberNames[squadId] || []).map((name, i) => ({ id: `${squadId}-${i + 1}`, name, likes: 0 }));

const LIKES_API_URL = 'https://functions.poehali.dev/3c799b23-3771-470c-8583-75317ccb3b80';

const buildSquads = (teamMap: Record<number, number>, memberMap: Record<string, number>): Squad[] =>
  baseSquads.map((s) => ({
    ...s,
    teamLikes: teamMap[s.id] ?? 0,
    members: makeMembers(s.id).map((m) => ({ ...m, likes: memberMap[m.id] ?? 0 })),
  }));

const squadTotal = (s: Squad) => s.teamLikes + s.members.reduce((sum, m) => sum + m.likes, 0);

const computeSquadOrder = (list: Squad[]) => [...list].sort((a, b) => squadTotal(b) - squadTotal(a)).map((s) => s.id);
const computeMemberOrder = (squad: Squad) => [...squad.members].sort((a, b) => b.likes - a.likes).map((m) => m.id);

interface FloatingHeart {
  id: number;
}

const Index = () => {
  const [squads, setSquads] = useState<Squad[]>(() => buildSquads({}, {}));
  const [orderIds, setOrderIds] = useState<number[]>(baseSquads.map((s) => s.id));
  const [memberOrder, setMemberOrder] = useState<Record<number, string[]>>({});

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [isCounselor, setIsCounselor] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COUNSELOR_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [poppingId, setPoppingId] = useState<string | null>(null);
  const [floats, setFloats] = useState<Record<number, FloatingHeart[]>>({});
  const [entryAnimationDone, setEntryAnimationDone] = useState(false);
  const floatCounter = useRef(0);

  const isDirtyRef = useRef(false);
  const isSavingRef = useRef(false);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  useEffect(() => {
    const timer = setTimeout(() => setEntryAnimationDone(true), 900);
    return () => clearTimeout(timer);
  }, []);

  const applyOrder = (list: Squad[]) => {
    setOrderIds(computeSquadOrder(list));
    const mo: Record<number, string[]> = {};
    list.forEach((s) => { mo[s.id] = computeMemberOrder(s); });
    setMemberOrder(mo);
  };

  const fetchLikes = async (force = false) => {
    if ((isDirtyRef.current || isSavingRef.current) && !force) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${LIKES_API_URL}?t=${Date.now()}`, { cache: 'no-store', signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        setLoadError(true);
        return;
      }
      const data = await res.json();
      const teamMap: Record<number, number> = {};
      Object.entries(data?.squads || {}).forEach(([k, v]) => { teamMap[Number(k)] = Number(v); });
      const memberMap: Record<string, number> = {};
      Object.entries(data?.members || {}).forEach(([k, v]) => { memberMap[k] = Number(v); });
      const fresh = buildSquads(teamMap, memberMap);
      setSquads(fresh);
      applyOrder(fresh);
      setIsLoaded(true);
      setLoadError(false);
      setIsDirty(false);
    } catch {
      setLoadError(true);
    }
  };

  useEffect(() => {
    fetchLikes();
    const interval = setInterval(() => fetchLikes(), 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(COUNSELOR_KEY, isCounselor ? 'true' : 'false');
    } catch { /* ignore */ }
  }, [isCounselor]);

  const orderedSquads = orderIds
    .map((id) => squads.find((s) => s.id === id))
    .filter((s): s is Squad => Boolean(s));

  const popHeart = (key: string) => {
    setPoppingId(key);
    setTimeout(() => setPoppingId((p) => (p === key ? null : p)), 500);
  };

  const spawnFloat = (id: number) => {
    const fid = floatCounter.current++;
    setFloats((prev) => ({ ...prev, [id]: [...(prev[id] || []), { id: fid }] }));
    setTimeout(() => {
      setFloats((prev) => ({ ...prev, [id]: (prev[id] || []).filter((f) => f.id !== fid) }));
    }, 900);
  };

  const addTeamLike = (id: number) => {
    if (!isCounselor) return;
    setSquads((prev) => prev.map((s) => (s.id === id ? { ...s, teamLikes: s.teamLikes + 1 } : s)));
    setIsDirty(true);
    popHeart(`team-${id}`);
    spawnFloat(id);
  };

  const removeTeamLike = (id: number) => {
    if (!isCounselor) return;
    setSquads((prev) => prev.map((s) => (s.id === id ? { ...s, teamLikes: Math.max(0, s.teamLikes - 1) } : s)));
    setIsDirty(true);
  };

  const addMemberLike = (squadId: number, memberId: string) => {
    if (!isCounselor) return;
    setSquads((prev) => prev.map((s) => (
      s.id === squadId
        ? { ...s, members: s.members.map((m) => (m.id === memberId ? { ...m, likes: m.likes + 1 } : m)) }
        : s
    )));
    setIsDirty(true);
    popHeart(memberId);
  };

  const removeMemberLike = (squadId: number, memberId: string) => {
    if (!isCounselor) return;
    setSquads((prev) => prev.map((s) => (
      s.id === squadId
        ? { ...s, members: s.members.map((m) => (m.id === memberId ? { ...m, likes: Math.max(0, m.likes - 1) } : m)) }
        : s
    )));
    setIsDirty(true);
  };

  const saveChanges = async () => {
    setIsSaving(true);
    setSaveError(false);
    try {
      const squadsPayload: Record<number, number> = {};
      const membersPayload: Record<string, number> = {};
      squads.forEach((s) => {
        squadsPayload[s.id] = s.teamLikes;
        s.members.forEach((m) => { membersPayload[m.id] = m.likes; });
      });

      const res = await fetch(LIKES_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ squads: squadsPayload, members: membersPayload }),
      });

      if (!res.ok) throw new Error('save failed');

      applyOrder(squads);
      setIsDirty(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    } catch {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
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

  const squadMedals = ['🥇', '🥈', '🥉', ''];
  const memberMedals = ['🥇', '🥈', '🥉', '', ''];

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
        <div className="mx-auto mt-4 flex max-w-5xl flex-col items-end gap-2">
          <button
            onClick={saveChanges}
            disabled={!isDirty || isSaving}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-95 ${
              !isDirty && !isSaving
                ? 'bg-card text-muted-foreground'
                : 'bg-primary text-primary-foreground hover:brightness-105'
            } ${(!isDirty || isSaving) ? 'cursor-not-allowed opacity-70' : ''}`}
          >
            <Icon name={isSaving ? 'Loader2' : justSaved ? 'Check' : 'Save'} size={16} className={isSaving ? 'animate-spin' : ''} />
            {isSaving ? 'Сохраняем…' : justSaved ? 'Сохранено!' : isDirty ? 'Сохранить изменения' : 'Все изменения сохранены'}
          </button>
          {saveError && (
            <p className="flex items-center gap-1 text-xs text-rosee">
              <Icon name="TriangleAlert" size={13} /> Не удалось сохранить — проверь интернет и попробуй ещё раз
            </p>
          )}
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
      </header>

      {/* Criteria */}
      <section className="mx-auto mt-8 grid max-w-4xl animate-fade-in grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-3xl bg-card p-6 shadow-[0_10px_36px_-16px_rgba(120,80,60,0.3)]">
          <div className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cocoa">
            <Icon name="Sparkles" size={20} className="text-primary" />
            Как получить баллы
          </div>
          <ul className="space-y-2.5 text-sm text-cocoa/85">
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-cocoa">+1</span>
              участие в мастер-классах
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-cocoa">+3</span>
              активность на уроках, мастер-классах
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-cocoa">+3</span>
              дежурство
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-cocoa">+1–5</span>
              помощь вожатым
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-cocoa">+25</span>
              победа в конкурсе
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-cocoa">+25</span>
              самый успешный блог (в конце лагеря)
            </li>
          </ul>
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-[0_10px_36px_-16px_rgba(120,80,60,0.3)]">
          <div className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cocoa">
            <Icon name="TriangleAlert" size={20} className="text-destructive" />
            Как потерять баллы
          </div>
          <ul className="space-y-2.5 text-sm text-cocoa/85">
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">−1</span>
              опоздание на МК/урок
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">−3</span>
              неучастие в запланированном занятии
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">−3</span>
              использование ненормативной лексики
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">−3</span>
              несоблюдение хиджаба на улице
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">−10</span>
              нарушение тишины после отбоя
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">−25</span>
              пропуск намаза
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">−25</span>
              выход с территории лагеря
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">−25</span>
              выход из дома ночью
            </li>
          </ul>
        </div>
      </section>

      {/* Cards */}
      {!isLoaded && !loadError && (
        <div className="mx-auto mt-12 flex max-w-5xl items-center justify-center gap-2 text-sm text-muted-foreground">
          <Icon name="Loader2" size={18} className="animate-spin" />
          Загружаем баллы…
        </div>
      )}
      {!isLoaded && loadError && (
        <div className="mx-auto mt-12 flex max-w-5xl flex-col items-center justify-center gap-3 text-center">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="WifiOff" size={18} />
            Не получилось загрузить баллы — проверь интернет
          </p>
          <button
            onClick={() => fetchLikes(true)}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-95"
          >
            <Icon name="RefreshCw" size={15} />
            Попробовать ещё раз
          </button>
        </div>
      )}
      <main className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
        {isLoaded && orderedSquads.map((squad, i) => {
          const total = squadTotal(squad);
          const orderIdsForSquad = memberOrder[squad.id] || computeMemberOrder(squad);
          const orderedMembers = orderIdsForSquad
            .map((mid) => squad.members.find((m) => m.id === mid))
            .filter((m): m is Member => Boolean(m));

          return (
            <article
              key={squad.id}
              className={`group relative overflow-hidden rounded-[2rem] bg-card shadow-[0_12px_40px_-16px_rgba(120,80,60,0.35)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_-16px_rgba(120,80,60,0.45)] ${entryAnimationDone ? '' : 'animate-card-rise'}`}
              style={entryAnimationDone ? undefined : { animationDelay: `${i * 90}ms`, opacity: 0 }}
            >
              {/* rank badge */}
              {!isDirty && squadMedals[i] && (
                <div className="absolute right-4 top-4 z-10 text-2xl drop-shadow-sm">{squadMedals[i]}</div>
              )}

              {/* profile header */}
              <div className={`bg-gradient-to-br ${squad.gradient} px-6 pb-8 pt-7`}>
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-cream text-3xl shadow-md">
                    {squad.avatar ? (
                      <img src={squad.avatar} alt={squad.name} className="h-full w-full object-cover" />
                    ) : (
                      squad.emoji
                    )}
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-cocoa">{squad.name}</h2>
                  </div>
                </div>
                <p className="mt-4 text-sm italic text-cocoa/80">наш блог только начинается…</p>
              </div>

              {/* total score */}
              <div className="px-6 pb-1 pt-6 text-center">
                <div className="font-display text-5xl font-bold text-cocoa">{total}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">баллов у отряда</div>
              </div>

              {/* team likes */}
              <div className="px-6 pb-5 pt-5">
                <div className="relative flex items-center justify-between gap-3 rounded-2xl bg-secondary/60 px-4 py-3">
                  {(floats[squad.id] || []).map((f) => (
                    <span
                      key={f.id}
                      className="pointer-events-none absolute left-8 top-0 z-20 animate-float-up text-2xl"
                    >
                      ❤️
                    </span>
                  ))}
                  <button
                    onClick={() => addTeamLike(squad.id)}
                    disabled={!isCounselor}
                    aria-label="Лайк отряду"
                    className={`text-3xl transition-transform ${poppingId === `team-${squad.id}` ? 'animate-heart-pop' : ''} ${isCounselor ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-not-allowed opacity-60'}`}
                  >
                    ❤️
                  </button>
                  <div className="flex-1 leading-tight">
                    <div className="font-display text-lg font-bold text-cocoa">{squad.teamLikes}</div>
                    <div className="text-[11px] text-muted-foreground">командных баллов</div>
                  </div>
                  {isCounselor && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeTeamLike(squad.id)}
                        disabled={squad.teamLikes === 0}
                        aria-label="Убрать командный балл"
                        className={`flex h-9 w-9 items-center justify-center rounded-xl bg-card text-cocoa transition-all hover:brightness-95 active:scale-90 ${squad.teamLikes === 0 ? 'cursor-not-allowed opacity-40' : ''}`}
                      >
                        <Icon name="Minus" size={15} />
                      </button>
                      <button
                        onClick={() => addTeamLike(squad.id)}
                        aria-label="Добавить командный балл"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:brightness-105 active:scale-90"
                      >
                        <Icon name="Plus" size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* members ranking */}
              <div className="px-6 pb-6">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Icon name="Users" size={13} />
                  Рейтинг участниц
                </div>
                <div className="space-y-2">
                  {orderedMembers.map((member, mi) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-2xl bg-secondary/40 px-3 py-2.5"
                    >
                      <span className="w-5 flex-shrink-0 text-center text-sm">
                        {!isDirty && memberMedals[mi] ? memberMedals[mi] : (
                          <span className="text-xs font-semibold text-cocoa/50">{mi + 1}</span>
                        )}
                      </span>
                      <span className="flex-1 truncate text-sm font-medium text-cocoa">{member.name}</span>
                      <span className={`flex items-center gap-1 text-sm font-bold text-cocoa transition-transform ${poppingId === member.id ? 'animate-heart-pop' : ''}`}>
                        ❤️ {member.likes}
                      </span>
                      {isCounselor && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => removeMemberLike(squad.id, member.id)}
                            disabled={member.likes === 0}
                            aria-label="Убрать лайк участнице"
                            className={`flex h-7 w-7 items-center justify-center rounded-lg bg-card text-cocoa transition-all hover:brightness-95 active:scale-90 ${member.likes === 0 ? 'cursor-not-allowed opacity-40' : ''}`}
                          >
                            <Icon name="Minus" size={12} />
                          </button>
                          <button
                            onClick={() => addMemberLike(squad.id, member.id)}
                            aria-label="Поставить лайк участнице"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:brightness-105 active:scale-90"
                          >
                            <Icon name="Plus" size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!isCounselor && (
                  <p className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Icon name="Lock" size={12} /> Лайки доступны только вожатым
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="mx-auto mt-16 max-w-3xl pb-8 text-center">
        <p className="font-display text-lg text-cocoa">🤎 Каждое доброе дело имеет значение.</p>
      </footer>
    </div>
  );
};

export default Index;
