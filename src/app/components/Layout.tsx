import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import svgPaths from "../../imports/svg-i12ofgoty4";
import { fetchCurrentUser, logout, type CurrentUser } from "../api/auth";
import { clearStoredToken, readStoredToken } from "../api/http";
import { BrandLogo } from "./BrandLogo";

function IconHome({ active }: { active?: boolean }) {
  const color = active ? "#272b30" : "#6F767E";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path clipRule="evenodd" d={svgPaths.p743b400} fill={color} fillRule="evenodd" />
    </svg>
  );
}

function IconPerson({ active }: { active?: boolean }) {
  const color = active ? "#272b30" : "#6F767E";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path clipRule="evenodd" d={svgPaths.p2527880} fill={color} fillRule="evenodd" />
    </svg>
  );
}

function IconTool({ active }: { active?: boolean }) {
  const color = active ? "#272b30" : "#6F767E";
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <path clipRule="evenodd" d={svgPaths.p2121dc00} fill={color} fillRule="evenodd" />
    </svg>
  );
}

function IconSettings({ active }: { active?: boolean }) {
  const color = active ? "#272b30" : "#6F767E";
  return (
    <svg width="20" height="20" viewBox="0 0 20 22" fill="none">
      <path clipRule="evenodd" d={svgPaths.p54642b0} fill={color} fillRule="evenodd" />
    </svg>
  );
}

function IconSave({ active }: { active?: boolean }) {
  const color = active ? "#272b30" : "#6F767E";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path clipRule="evenodd" d={svgPaths.p22866482} fill={color} fillRule="evenodd" />
    </svg>
  );
}

function IconAttachment({ active }: { active?: boolean }) {
  const color = active ? "#272b30" : "#6F767E";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path clipRule="evenodd" d={svgPaths.pbf49200} fill={color} fillRule="evenodd" />
    </svg>
  );
}

function IconMessage() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path clipRule="evenodd" d={svgPaths.p642a680} fill="#6F767E" fillRule="evenodd" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path clipRule="evenodd" d={svgPaths.pcc6e100} fill="#6F767E" fillRule="evenodd" />
    </svg>
  );
}

function IconCreate({ active }: { active?: boolean }) {
  const color = active ? "#272b30" : "#6F767E";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path clipRule="evenodd" d={svgPaths.p54642b0} fill={color} fillRule="evenodd" />
    </svg>
  );
}

function IconSettle({ active }: { active?: boolean }) {
  const color = active ? "#272b30" : "#6F767E";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path clipRule="evenodd" d={svgPaths.p22866482} fill={color} fillRule="evenodd" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
      <path d="M4 6l4 4 4-4" stroke="#9A9FA5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type NavItem = {
  label: string;
  to: string;
  icon: (active: boolean) => ReactNode;
};

type Section = {
  label: string;
  emoji: string;
  items: NavItem[];
};

function SidebarSection({ section, defaultOpen = true }: { section: Section; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const location = useLocation();
  const isAnyActive = section.items.some((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex items-center justify-between rounded-[8px] px-[12px] py-[8px] transition-colors hover:bg-[#f4f4f4]"
      >
        <div className="flex items-center gap-[8px]">
          <span className="text-[14px]">{section.emoji}</span>
          <span
            className={`font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] text-[13px] font-semibold leading-[20px] tracking-[-0.1px] ${
              isAnyActive ? "text-[#272b30]" : "text-[#9a9fa5]"
            }`}
          >
            {section.label}
          </span>
        </div>
        <IconChevron open={open} />
      </button>

      {open ? (
        <div className="mt-[2px] ml-[8px] flex flex-col gap-[2px] border-l border-[#efefef] pl-[12px]">
          {section.items.map((item) => {
            const active = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-[10px] rounded-[10px] px-[12px] py-[10px] transition-colors ${
                  active
                    ? "bg-[#efefef] shadow-[inset_0px_-2px_1px_0px_rgba(0,0,0,0.05),inset_0px_1px_1px_0px_white]"
                    : "hover:bg-[#f4f4f4]"
                }`}
              >
                {item.icon(active)}
                <span
                  className={`font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] text-[14px] font-semibold leading-[22px] tracking-[-0.14px] ${
                    active ? "text-[#272b30]" : "text-[#6f767e]"
                  }`}
                >
                  {item.label}
                </span>
                {active ? <div className="ml-auto h-[6px] w-[6px] rounded-full bg-[#272b30]" /> : null}
              </NavLink>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function getRoleLabel(role?: string) {
  switch (role) {
    case "admin":
      return "平台管理员";
    case "branch_admin":
      return "公司管理员";
    case "user":
      return "普通用户";
    default:
      return "未登录";
  }
}

function getAvatarText(user: CurrentUser | null) {
  if (!user) {
    return "访";
  }
  return user.name?.slice(-1) || user.username?.slice(-1) || "用";
}

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    if (!readStoredToken()) {
      setLoadingUser(false);
      setCurrentUser(null);
      return;
    }

    let cancelled = false;

    fetchCurrentUser()
      .then((user) => {
        if (!cancelled) {
          setCurrentUser(user);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCurrentUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingUser(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loadingUser && !currentUser) {
      navigate("/login", { replace: true });
    }
  }, [currentUser, loadingUser, navigate]);

  const sections: Section[] = [
    {
      label: "基础数据",
      emoji: "📘",
      items: [
        { label: "人员管理", to: "/personnel", icon: (active) => <IconPerson active={active} /> },
        { label: "设备管理", to: "/equipment", icon: (active) => <IconTool active={active} /> },
        { label: "打卡记录导入", to: "/attendance", icon: (active) => <IconSave active={active} /> },
      ],
    },
    {
      label: "项目管理",
      emoji: "📁",
      items: [
        { label: "项目列表", to: "/projects", icon: (active) => <IconAttachment active={active} /> },
        { label: "创建项目", to: "/projects/create", icon: (active) => <IconCreate active={active} /> },
        { label: "月度汇总", to: "/projects/monthly", icon: (active) => <IconSave active={active} /> },
        { label: "待结算项目", to: "/projects/pending-settlement", icon: (active) => <IconSettle active={active} /> },
      ],
    },
    {
      label: "系统管理",
      emoji: "⚙️",
      items: [
        { label: "操作日志", to: "/operation-log", icon: (active) => <IconSave active={active} /> },
        { label: "账号管理", to: "/accounts", icon: (active) => <IconSettings active={active} /> },
      ],
    },
  ];

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // 后端退出失败时也清理本地 token，避免界面卡住。
    } finally {
      clearStoredToken();
      setCurrentUser(null);
      navigate("/login", { replace: true });
    }
  }

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f4f4]">
        <div className="rounded-[20px] bg-white px-[28px] py-[20px] text-[14px] text-[#6f767e] shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          正在加载系统...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-[#f4f4f4]">
      <div className="sticky top-0 flex h-screen w-[260px] flex-shrink-0 flex-col bg-[#fcfcfc] shadow-[inset_-1px_0_0_#f4f4f4]">
        <div className="flex flex-1 flex-col gap-[32px] px-[20px] py-[24px]">
          <div className="flex items-center gap-[12px] px-[4px]">
            <BrandLogo size={40} />
            <p className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] text-[13px] font-semibold leading-[20px] tracking-[-0.1px] text-[#272b30]">
              研发费用合规
              <br />
              智能管理系统
            </p>
          </div>

          <div className="flex flex-col gap-[4px]">
            <NavLink
              to="/"
              end
              className={`flex items-center gap-[10px] rounded-[10px] px-[12px] py-[10px] transition-colors ${
                location.pathname === "/"
                  ? "bg-[#efefef] shadow-[inset_0px_-2px_1px_0px_rgba(0,0,0,0.05),inset_0px_1px_1px_0px_white]"
                  : "hover:bg-[#f4f4f4]"
              }`}
            >
              <IconHome active={location.pathname === "/"} />
              <span
                className={`font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] text-[14px] font-semibold leading-[22px] tracking-[-0.14px] ${
                  location.pathname === "/" ? "text-[#272b30]" : "text-[#6f767e]"
                }`}
              >
                首页
              </span>
              {location.pathname === "/" ? <div className="ml-auto h-[6px] w-[6px] rounded-full bg-[#272b30]" /> : null}
            </NavLink>
          </div>

          <div className="flex flex-col gap-[20px]">
            {sections.map((section) => (
              <SidebarSection key={section.label} section={section} />
            ))}
          </div>
        </div>

        <div className="border-t border-[#f4f4f4] px-[20px] py-[20px]">
          <div className="flex items-center gap-[10px]">
            <div className="relative flex size-[36px] flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#ffbc99] to-[#ff9a6c]">
              <span className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] text-[14px] font-semibold text-white">
                {getAvatarText(currentUser)}
              </span>
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="truncate font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] text-[13px] font-semibold leading-[18px] text-[#272b30]">
                {currentUser?.name || currentUser?.username || "未登录"}
              </span>
              <span className="truncate font-['Inter:Regular',sans-serif] text-[11px] leading-[16px] text-[#9a9fa5]">
                {currentUser?.email || getRoleLabel(currentUser?.role)}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="ml-auto text-[#9a9fa5] transition-colors hover:text-[#272b30]"
              title="退出登录"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 2l4 4-4 4M14 6H6M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <div className="flex h-[72px] flex-shrink-0 items-center justify-end bg-[#fcfcfc] px-[40px] shadow-[inset_0_-1px_0_#f4f4f4]">
          <div className="flex items-center gap-[8px]">
            <div className="relative flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-[10px] transition-colors hover:bg-[#f4f4f4]">
              <IconMessage />
              <div className="absolute top-[8px] right-[8px] h-[7px] w-[7px] rounded-full border-2 border-[#fcfcfc] bg-[#ff6a55]" />
            </div>
            <div className="relative flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-[10px] transition-colors hover:bg-[#f4f4f4]">
              <IconBell />
              <div className="absolute top-[8px] right-[8px] h-[7px] w-[7px] rounded-full border-2 border-[#fcfcfc] bg-[#ff6a55]" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
