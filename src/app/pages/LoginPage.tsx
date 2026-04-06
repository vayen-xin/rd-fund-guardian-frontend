import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { fetchCurrentUser, login } from "../api/auth";
import homeIllustration from "../assets/home.png";
import { BrandLogo } from "../components/BrandLogo";
import { readStoredToken } from "../api/http";

const featureItems = ["轻量高效", "审计友好", "政策对齐", "责任可溯"];

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => username.trim() && password.trim(), [password, username]);

  useEffect(() => {
    if (!readStoredToken()) {
      setChecking(false);
      return;
    }

    let cancelled = false;

    fetchCurrentUser()
      .then(() => {
        if (!cancelled) {
          navigate("/", { replace: true });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setChecking(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setChecking(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login({
        username: username.trim(),
        password: password.trim(),
      });
      navigate("/", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fcfcfc]">
        <div className="rounded-[20px] bg-white px-[28px] py-[20px] text-[14px] text-[#6f767e] shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          正在检查登录状态...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-[20px] md:p-[28px]">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-[1440px] overflow-hidden rounded-[32px] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.08)]">
        <aside className="relative hidden w-[440px] shrink-0 flex-col justify-between overflow-hidden bg-[#f4f4f4] px-[36px] py-[34px] lg:flex">
          <div className="absolute inset-0">
            <div className="absolute left-[-120px] top-[-120px] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,_rgba(42,133,255,0.18),_rgba(42,133,255,0))]" />
            <div className="absolute bottom-[-140px] right-[-80px] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,_rgba(26,29,31,0.14),_rgba(26,29,31,0))]" />
          </div>

          <div className="relative z-[1] flex items-center gap-[14px]">
            <BrandLogo size={58} />
            <div>
              <p className="text-[14px] font-semibold tracking-[0.06em] text-[#1a1d1f]">研发费用合规</p>
              <p className="text-[20px] font-semibold tracking-[0.02em] text-[#1a1d1f]">智能管理系统</p>
            </div>
          </div>

          <div className="relative z-[1] flex flex-1 flex-col justify-center">
            <div className="rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,249,251,0.68))] px-[28px] py-[30px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_24px_48px_rgba(26,29,31,0.06)]">
              <div className="mb-[28px] overflow-hidden rounded-[24px] border border-dashed border-[#d9dde3] bg-[linear-gradient(135deg,#ffffff_0%,#eef4ff_50%,#edf1f5_100%)]">
                <img
                  src={homeIllustration}
                  alt="系统登录页插画"
                  className="h-[220px] w-full object-cover object-center"
                  draggable={false}
                />
              </div>

              <p className="text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-[#1a1d1f]">智能管理</p>
              <p className="mt-[14px] max-w-[280px] text-[14px] leading-[24px] text-[#6f767e]">
                面向研发费用归集、月度结算与审计留痕的一体化协同工作台。
              </p>
            </div>
          </div>

          <div className="relative z-[1] flex flex-wrap gap-[12px]">
            {featureItems.map((item) => (
              <div
                key={item}
                className="flex items-center gap-[8px] rounded-full bg-white/80 px-[14px] py-[10px] text-[13px] font-medium text-[#6f767e] shadow-[0_8px_24px_rgba(26,29,31,0.04)]"
              >
                <span className="h-[8px] w-[8px] rounded-full bg-[#2a85ff]" />
                {item}
              </div>
            ))}
          </div>
        </aside>

        <main className="flex flex-1 flex-col bg-[#fcfcfc] px-[22px] py-[24px] sm:px-[34px] sm:py-[30px] lg:px-[48px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[12px] lg:hidden">
              <BrandLogo size={52} />
              <div>
                <p className="text-[13px] font-semibold text-[#1a1d1f]">研发费用合规</p>
                <p className="text-[18px] font-semibold text-[#1a1d1f]">智能管理系统</p>
              </div>
            </div>

            <Link
              to="mailto:support@example.com"
              className="ml-auto rounded-full px-[12px] py-[8px] text-[13px] font-medium text-[#6f767e] transition hover:bg-white hover:text-[#1a1d1f]"
            >
              需要帮助？联系我们
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-[460px]">
              <div className="mb-[28px]">
                <h1 className="text-[42px] font-semibold tracking-[-0.05em] text-[#1a1d1f]">登录</h1>
                <p className="mt-[10px] text-[14px] text-[#9a9fa5]">欢迎回来，请输入您的账号信息</p>
              </div>

              <div className="mb-[24px] h-px w-full bg-[#efefef]" />

              <form
                onSubmit={handleSubmit}
                className="rounded-[24px] border border-white bg-white p-[22px] shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:p-[28px]"
              >
                <div className="space-y-[18px]">
                  <div>
                    <label htmlFor="username" className="mb-[10px] block text-[13px] font-medium text-[#6f767e]">
                      账号
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="请输入用户名"
                      className="h-[48px] w-full rounded-[14px] border border-transparent bg-[#f4f4f4] px-[16px] text-[14px] text-[#1a1d1f] outline-none transition placeholder:text-[#9a9fa5] focus:border-[#b8d4ff] focus:bg-white focus:shadow-[0_0_0_4px_rgba(42,133,255,0.08)]"
                    />
                  </div>

                  <div>
                    <div className="mb-[10px] flex items-center justify-between">
                      <label htmlFor="password" className="block text-[13px] font-medium text-[#6f767e]">
                        密码
                      </label>
                      <button type="button" className="text-[13px] font-medium text-[#2a85ff] transition hover:text-[#0058d8]">
                        忘记密码？
                      </button>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="请输入密码"
                      className="h-[48px] w-full rounded-[14px] border border-transparent bg-[#f4f4f4] px-[16px] text-[14px] text-[#1a1d1f] outline-none transition placeholder:text-[#9a9fa5] focus:border-[#b8d4ff] focus:bg-white focus:shadow-[0_0_0_4px_rgba(42,133,255,0.08)]"
                    />
                  </div>
                </div>

                {error ? (
                  <div className="mt-[16px] rounded-[14px] border border-[#ffd9d4] bg-[#fff3f1] px-[14px] py-[12px] text-[13px] text-[#d84c2f]">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className="mt-[22px] flex h-[52px] w-full items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#2a85ff_0%,#0066cc_100%)] text-[15px] font-semibold text-white shadow-[0_18px_34px_rgba(42,133,255,0.28)] transition hover:translate-y-[-1px] hover:shadow-[0_24px_40px_rgba(42,133,255,0.32)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? "登录中..." : "登录"}
                </button>

                <p className="mt-[18px] text-center text-[12px] leading-[20px] text-[#9a9fa5]">
                  需要新建账号请联系系统管理员
                </p>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
