"use client";

import { useEffect, useMemo, useState } from "react";
import { ADMIN_ACCESS, ADMIN_REVENUE_PLANS, ADMIN_SNAPSHOT } from "../config/admin";
import { FREE_USAGE_COPY } from "../config/usageLimits";
import { useAuth } from "../app/components/chrome-helpers";
import { fetchAdminUsageSettings, saveAdminUsageSettings, type AdminUsageLimits } from "../services/adminService";

function krw(value: number) {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(value);
}

function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <section className="rounded-[20px] border border-line bg-white p-5 shadow-sm">
      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-ink-4">{label}</p>
      <p className="mt-3 text-[30px] font-black tracking-[-0.04em] text-ink">{value}</p>
      <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3">{note}</p>
    </section>
  );
}

function AdminLogin({ onSignIn }: { onSignIn: (provider: string) => Promise<boolean> }) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-[26px] border border-line bg-white p-7 text-center shadow-[0_24px_70px_-40px_rgba(0,0,0,.5)]">
      <p className="text-[12px] font-black uppercase tracking-[0.22em] text-brand">MediQ Admin</p>
      <h1 className="mt-3 text-[28px] font-black tracking-[-0.04em] text-ink">운영자 콘솔</h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-3">
        슈퍼유저, 사용량, 접속 통계, 유료 사용자, 매출 지표를 관리하는 별도 진입로입니다.
      </p>
      <div className="mt-6 grid gap-2">
        <button
          type="button"
          onClick={() => void onSignIn("google")}
          className="h-12 rounded-xl bg-ink text-[14px] font-extrabold text-white transition hover:opacity-90 active:scale-[0.98]"
        >
          Google 운영자 로그인
        </button>
        <button
          type="button"
          onClick={() => void onSignIn("naver")}
          className="h-12 rounded-xl border border-line bg-surface text-[14px] font-extrabold text-ink-2 transition hover:border-brand-tint-2 hover:text-brand active:scale-[0.98]"
        >
          Naver 운영자 로그인
        </button>
      </div>
      <a className="mt-5 inline-block text-[12.5px] font-bold text-ink-4 underline-offset-2 hover:text-ink hover:underline" href="/">
        사용자 앱으로 돌아가기
      </a>
    </div>
  );
}

function AccessNotice({ email }: { email: string | null }) {
  return (
    <section className="mb-5 rounded-[20px] border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <p className="text-[12px] font-black uppercase tracking-[0.18em]">Superuser setup</p>
      <h2 className="mt-2 text-[20px] font-black tracking-[-0.03em]">슈퍼유저 허용 목록 설정 필요</h2>
      <p className="mt-2 text-[13px] leading-relaxed">
        현재 로그인 이메일: <strong>{email ?? "확인 안 됨"}</strong>. {ADMIN_ACCESS.setupHintKo}
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-amber-800">
        실제 고객 데이터는 아직 표시하지 않고, 운영 화면 구조와 지표 자리를 먼저 분리했습니다.
      </p>
    </section>
  );
}

function AdminDashboard({ email, canAttemptAdminApi, onSignOut }: { email: string | null; canAttemptAdminApi: boolean; onSignOut: () => Promise<void> }) {
  const [limits, setLimits] = useState<AdminUsageLimits>({
    hourlyAiRequests: 30,
    monthlyAiRequests: ADMIN_SNAPSHOT.monthlyAiLimitPerFreeUser,
  });
  const [loadingLimits, setLoadingLimits] = useState(false);
  const [savingLimits, setSavingLimits] = useState(false);
  const [usageMessage, setUsageMessage] = useState("운영 권한 연결 전에는 화면 구조만 표시됩니다.");

  useEffect(() => {
    if (!canAttemptAdminApi) return;
    let alive = true;
    setLoadingLimits(true);
    fetchAdminUsageSettings()
      .then((next) => {
        if (!alive) return;
        setLimits(next);
        setUsageMessage("서버 사용량 설정을 불러왔습니다.");
      })
      .catch((error: Error) => {
        if (!alive) return;
        setUsageMessage(error.message);
      })
      .finally(() => {
        if (alive) setLoadingLimits(false);
      });
    return () => {
      alive = false;
    };
  }, [canAttemptAdminApi]);

  async function saveLimits() {
    setSavingLimits(true);
    try {
      const saved = await saveAdminUsageSettings(limits);
      setLimits(saved);
      setUsageMessage("서버 사용량 설정을 저장했습니다.");
    } catch (error) {
      setUsageMessage((error as Error).message);
    } finally {
      setSavingLimits(false);
    }
  }

  const rows = useMemo(
    () => [
      { name: "슈퍼유저", scope: "관리자 권한", status: "설정 대기", owner: email ?? "미지정" },
      { name: "무료 회원", scope: `${FREE_USAGE_COPY.monthlyLabelKo} AI 사용`, status: "운영 중", owner: "Firebase Auth" },
      { name: "유료 사용자", scope: "Plus / Family", status: "결제 연동 대기", owner: "Billing" },
    ],
    [email],
  );

  return (
    <main className="min-h-screen bg-paper px-4 py-6 text-ink sm:px-6 sm:py-10">
      <section className="mx-auto max-w-6xl">
        <header className="rounded-[28px] border border-line bg-ink p-6 text-white shadow-[0_28px_80px_-52px_rgba(0,0,0,.75)] sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.22em] text-emerald-200">Admin Console</p>
              <h1 className="mt-3 text-[34px] font-black tracking-[-0.05em] sm:text-[44px]">운영 관리 센터</h1>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/70">
                일반 사용자 앱과 분리된 관리자 진입로입니다. 슈퍼유저 권한, 사용량 제한, 접속 통계, 유료 사용자, 매출액 관리를 한 화면에서 추적합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a className="rounded-xl bg-white/10 px-4 py-2 text-[12.5px] font-extrabold text-white ring-1 ring-white/15 transition hover:bg-white/15" href="/">
                사용자 앱
              </a>
              <button
                type="button"
                onClick={() => void onSignOut()}
                className="rounded-xl bg-white px-4 py-2 text-[12.5px] font-extrabold text-ink transition hover:opacity-90"
              >
                로그아웃
              </button>
            </div>
          </div>
        </header>

        {ADMIN_ACCESS.superuserEmails.length === 0 && <AccessNotice email={email} />}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="접속 통계" value={String(ADMIN_SNAPSHOT.activeUsersToday)} note="오늘 활성 사용자" />
          <StatCard label="사용량" value={String(ADMIN_SNAPSHOT.monthlyAiUsed)} note={`이번 달 AI 호출 / 무료 ${FREE_USAGE_COPY.monthlyLabelKo}`} />
          <StatCard label="유료 사용자" value={String(ADMIN_SNAPSHOT.paidUsers)} note="Plus·Family 결제 사용자" />
          <StatCard label="매출액" value={krw(ADMIN_SNAPSHOT.monthlyRevenueKrw)} note="이번 달 결제 매출" />
          <StatCard label="전환율" value={ADMIN_SNAPSHOT.conversionRate} note="무료 → 유료 전환" />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <section className="rounded-[24px] border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.18em] text-brand">Superusers & users</p>
                <h2 className="mt-1 text-[22px] font-black tracking-[-0.03em]">권한·사용자 관리</h2>
              </div>
              <button className="rounded-xl border border-line px-3 py-2 text-[12px] font-extrabold text-ink-3" type="button">
                사용자 동기화 준비
              </button>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-line">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead className="bg-ink-1/50 text-[11px] uppercase tracking-[0.12em] text-ink-4">
                  <tr>
                    <th className="px-4 py-3">그룹</th>
                    <th className="px-4 py-3">범위</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">소유</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.name} className="border-t border-line">
                      <td className="px-4 py-3 font-extrabold text-ink">{row.name}</td>
                      <td className="px-4 py-3 text-ink-3">{row.scope}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-brand-tint px-2.5 py-1 text-[11px] font-bold text-brand">{row.status}</span></td>
                      <td className="px-4 py-3 text-ink-3">{row.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[24px] border border-line bg-white p-5 shadow-sm">
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-brand">Revenue</p>
            <h2 className="mt-1 text-[22px] font-black tracking-[-0.03em]">유료 플랜·매출 관리</h2>
            <div className="mt-5 grid gap-3">
              {ADMIN_REVENUE_PLANS.map((plan) => (
                <div key={plan.name} className="rounded-2xl border border-line p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[15px] font-black text-ink">{plan.name}</p>
                      <p className="text-[12px] text-ink-4">사용자 {plan.users}명 · 단가 {krw(plan.priceKrw)}</p>
                    </div>
                    <p className="text-[16px] font-black text-ink">{krw(plan.revenueKrw)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-[24px] border border-line bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.18em] text-brand">Usage policy</p>
              <h2 className="mt-1 text-[22px] font-black tracking-[-0.03em]">무료 사용량 운영 설정</h2>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3">
                이 값은 /api/admin/usage-settings를 통해 Firestore adminConfig/usageLimits에 저장되고, AI 호출 제한에서 즉시 읽습니다.
              </p>
            </div>
            <span className="rounded-full bg-ink-1 px-3 py-1.5 text-[11.5px] font-bold text-ink-3">
              {loadingLimits ? "불러오는 중" : canAttemptAdminApi ? "관리 API 연결" : "권한 연결 필요"}
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="block">
              <span className="text-[12px] font-extrabold text-ink-3">시간당 AI 사용량</span>
              <input
                type="number"
                min={1}
                max={10000}
                value={limits.hourlyAiRequests}
                onChange={(event) => setLimits((prev) => ({ ...prev, hourlyAiRequests: Number(event.target.value) }))}
                className="mt-2 h-12 w-full rounded-xl border border-line bg-surface px-3 text-[15px] font-bold text-ink outline-none focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="text-[12px] font-extrabold text-ink-3">월간 무료 AI 사용량</span>
              <input
                type="number"
                min={1}
                max={1000000}
                value={limits.monthlyAiRequests}
                onChange={(event) => setLimits((prev) => ({ ...prev, monthlyAiRequests: Number(event.target.value) }))}
                className="mt-2 h-12 w-full rounded-xl border border-line bg-surface px-3 text-[15px] font-bold text-ink outline-none focus:border-brand"
              />
            </label>
            <button
              type="button"
              onClick={() => void saveLimits()}
              disabled={!canAttemptAdminApi || savingLimits}
              className="h-12 rounded-xl bg-ink px-5 text-[13px] font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-ink-4"
            >
              {savingLimits ? "저장 중" : "설정 저장"}
            </button>
          </div>
          <p className="mt-3 text-[12.5px] font-semibold text-ink-4">{usageMessage}</p>
        </section>

        <section className="mt-5 rounded-[24px] border border-line bg-white p-5 shadow-sm">
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-brand">Operations checklist</p>
          <h2 className="mt-1 text-[22px] font-black tracking-[-0.03em]">다음 연동 순서</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Firebase custom claims로 superuser 판별",
              "monthlyUsage 집계 API 연결",
              "Analytics 접속 통계 연동",
              "결제/구독 테이블과 매출 집계 연결",
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-ink-1/50 p-4 text-[13px] font-bold leading-relaxed text-ink-2">
                {item}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default function AdminConsole() {
  const { provider, user, signIn, signOut } = useAuth();
  const [authError, setAuthError] = useState("");
  const email = user?.email?.toLowerCase() ?? null;
  const allowed = Boolean(email && ADMIN_ACCESS.superuserEmails.includes(email));
  const setupMode = ADMIN_ACCESS.superuserEmails.length === 0;

  async function handleSignIn(providerKey: string) {
    setAuthError("");
    const ok = await signIn(providerKey);
    if (!ok) setAuthError("운영자 로그인에 실패했습니다. 다른 로그인 방식을 시도해 주세요.");
    return ok;
  }

  async function handleSignOut() {
    await signOut();
  }

  if (!provider) {
    return (
      <main className="min-h-screen bg-paper px-4 py-10">
        <AdminLogin onSignIn={handleSignIn} />
        {authError && <p className="mt-4 text-center text-[13px] font-bold text-red-600">{authError}</p>}
      </main>
    );
  }

  if (!allowed && !setupMode) {
    return (
      <main className="min-h-screen bg-paper px-4 py-10">
        <section className="mx-auto max-w-lg rounded-[24px] border border-red-200 bg-white p-7 text-center shadow-sm">
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-red-500">Access denied</p>
          <h1 className="mt-3 text-[26px] font-black tracking-[-0.04em] text-ink">슈퍼유저 권한이 필요합니다</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-3">현재 계정 {email ?? "알 수 없음"}은 관리자 허용 목록에 없습니다.</p>
          <div className="mt-5 flex justify-center gap-2">
            <a className="rounded-xl border border-line px-4 py-2 text-[13px] font-extrabold text-ink-3" href="/">사용자 앱</a>
            <button className="rounded-xl bg-ink px-4 py-2 text-[13px] font-extrabold text-white" type="button" onClick={() => void handleSignOut()}>로그아웃</button>
          </div>
        </section>
      </main>
    );
  }

  return <AdminDashboard email={email} canAttemptAdminApi={Boolean(user && provider !== "guest")} onSignOut={handleSignOut} />;
}
