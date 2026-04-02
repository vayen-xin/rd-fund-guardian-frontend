import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router";
import svgPaths from "../../imports/svg-i12ofgoty4";

// ─── Sidebar Icons ────────────────────────────────────────────────────────────
function IconHome({ active }: { active?: boolean }) {
  const c = active ? "#272b30" : "#6F767E";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path clipRule="evenodd" d={svgPaths.p743b400} fill={c} fillRule="evenodd" />
    </svg>
  );
}
function IconPerson({ active }: { active?: boolean }) {
  const c = active ? "#272b30" : "#6F767E";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path clipRule="evenodd" d={svgPaths.p2527880} fill={c} fillRule="evenodd" />
    </svg>
  );
}
function IconTool({ active }: { active?: boolean }) {
  const c = active ? "#272b30" : "#6F767E";
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <path clipRule="evenodd" d={svgPaths.p2121dc00} fill={c} fillRule="evenodd" />
    </svg>
  );
}
function IconSettings({ active }: { active?: boolean }) {
  const c = active ? "#272b30" : "#6F767E";
  return (
    <svg width="20" height="20" viewBox="0 0 20 22" fill="none">
      <path clipRule="evenodd" d={svgPaths.p54642b0} fill={c} fillRule="evenodd" />
    </svg>
  );
}
function IconSave({ active }: { active?: boolean }) {
  const c = active ? "#272b30" : "#6F767E";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path clipRule="evenodd" d={svgPaths.p22866482} fill={c} fillRule="evenodd" />
    </svg>
  );
}
function IconAttachment({ active }: { active?: boolean }) {
  const c = active ? "#272b30" : "#6F767E";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path clipRule="evenodd" d={svgPaths.pbf49200} fill={c} fillRule="evenodd" />
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
  const c = active ? "#272b30" : "#6F767E";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path clipRule="evenodd" d={svgPaths.p54642b0} fill={c} fillRule="evenodd" />
    </svg>
  );
}
function IconSettle({ active }: { active?: boolean }) {
  const c = active ? "#272b30" : "#6F767E";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path clipRule="evenodd" d={svgPaths.p22866482} fill={c} fillRule="evenodd" />
    </svg>
  );
}
// Chevron down/up
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
      <path d="M4 6l4 4 4-4" stroke="#9A9FA5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Sidebar section with collapsible children ────────────────────────────────
type NavItem = { label: string; to: string; icon: (active: boolean) => JSX.Element };
type Section = { label: string; emoji: string; items: NavItem[] };

function SidebarSection({ section, defaultOpen = true }: { section: Section; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const location = useLocation();
  const isAnyActive = section.items.some((i) => location.pathname === i.to || location.pathname.startsWith(i.to + "/"));

  return (
    <div className="flex flex-col">
      {/* Section header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between px-[12px] py-[8px] rounded-[8px] hover:bg-[#f4f4f4] transition-colors group"
      >
        <div className="flex items-center gap-[8px]">
          <span className="text-[14px]">{section.emoji}</span>
          <span className={`font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold text-[13px] leading-[20px] tracking-[-0.1px] ${isAnyActive ? "text-[#272b30]" : "text-[#9a9fa5]"}`}>
            {section.label}
          </span>
        </div>
        <IconChevron open={open} />
      </button>

      {/* Sub items */}
      {open && (
        <div className="flex flex-col gap-[2px] mt-[2px] ml-[8px] pl-[12px] border-l border-[#efefef]">
          {section.items.map((item) => {
            const active = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-[10px] px-[12px] py-[10px] rounded-[10px] transition-colors ${
                  active
                    ? "bg-[#efefef] shadow-[inset_0px_-2px_1px_0px_rgba(0,0,0,0.05),inset_0px_1px_1px_0px_white]"
                    : "hover:bg-[#f4f4f4]"
                }`}
              >
                {item.icon(active)}
                <span className={`font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold text-[14px] leading-[22px] tracking-[-0.14px] ${active ? "text-[#272b30]" : "text-[#6f767e]"}`}>
                  {item.label}
                </span>
                {active && <div className="ml-auto w-[6px] h-[6px] rounded-full bg-[#272b30]" />}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export function Layout() {
  const location = useLocation();

  const sections: Section[] = [
    {
      label: "基础数据",
      emoji: "📚",
      items: [
        { label: "人员管理", to: "/personnel", icon: (a) => <IconPerson active={a} /> },
        { label: "设备管理", to: "/equipment", icon: (a) => <IconTool active={a} /> },
        { label: "打卡记录导入", to: "/attendance", icon: (a) => <IconSave active={a} /> },
      ],
    },
    {
      label: "项目管理",
      emoji: "📁",
      items: [
        { label: "项目列表", to: "/projects", icon: (a) => <IconAttachment active={a} /> },
        { label: "创建项目", to: "/projects/create", icon: (a) => <IconCreate active={a} /> },
        { label: "月度总结", to: "/projects/monthly", icon: (a) => <IconSave active={a} /> },
        { label: "待结算项目", to: "/projects/pending-settlement", icon: (a) => <IconSettle active={a} /> },
      ],
    },
    {
      label: "系统管理",
      emoji: "⚙️",
      items: [
        { label: "操作日志", to: "/operation-log", icon: (a) => <IconSave active={a} /> },
        { label: "账号管理", to: "/accounts", icon: (a) => <IconSettings active={a} /> },
      ],
    },
  ];

  return (
    <div className="bg-[#f4f4f4] min-h-screen w-full flex">
      {/* ── Sidebar ── */}
      <div className="w-[260px] min-h-screen bg-[#fcfcfc] flex-shrink-0 shadow-[inset_-1px_0_0_#f4f4f4] flex flex-col">
        <div className="flex flex-col gap-[32px] px-[20px] py-[24px] flex-1">
          {/* Logo */}
          <div className="flex gap-[12px] items-center px-[4px]">
            <div className="relative shrink-0 size-[40px]">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 48 48">
                <path d={svgPaths.p36aee800} fill="#272B30" />
                <rect fill="url(#sb_g0)" height="8" rx="2" width="4" x="14" y="20" />
                <rect fill="white" height="12" rx="2" width="4" x="22" y="18" />
                <rect fill="url(#sb_g1)" height="8" rx="2" width="4" x="30" y="20" />
                <defs>
                  <linearGradient id="sb_g0" x1="16" x2="16" y1="20" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" /><stop offset="1" stopColor="#D0D0D0" />
                  </linearGradient>
                  <linearGradient id="sb_g1" x1="32" x2="32" y1="20" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" /><stop offset="1" stopColor="#D0D0D0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <p className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold text-[13px] text-[#272b30] leading-[20px] tracking-[-0.1px]">
              研发费用合规<br />智能管理系统
            </p>
          </div>

          {/* 首页 */}
          <div className="flex flex-col gap-[4px]">
            <NavLink
              to="/"
              end
              className={`flex items-center gap-[10px] px-[12px] py-[10px] rounded-[10px] transition-colors ${
                location.pathname === "/"
                  ? "bg-[#efefef] shadow-[inset_0px_-2px_1px_0px_rgba(0,0,0,0.05),inset_0px_1px_1px_0px_white]"
                  : "hover:bg-[#f4f4f4]"
              }`}
            >
              <IconHome active={location.pathname === "/"} />
              <span className={`font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold text-[14px] leading-[22px] tracking-[-0.14px] ${location.pathname === "/" ? "text-[#272b30]" : "text-[#6f767e]"}`}>
                首页
              </span>
              {location.pathname === "/" && <div className="ml-auto w-[6px] h-[6px] rounded-full bg-[#272b30]" />}
            </NavLink>
          </div>

          {/* Sections */}
          <div className="flex flex-col gap-[20px]">
            {sections.map((s) => (
              <SidebarSection key={s.label} section={s} defaultOpen={true} />
            ))}
          </div>
        </div>

        {/* Bottom avatar */}
        <div className="px-[20px] py-[20px] border-t border-[#f4f4f4]">
          <div className="flex items-center gap-[10px]">
            <div className="overflow-clip relative rounded-full size-[36px] bg-gradient-to-br from-[#ffbc99] to-[#ff9a6c] flex-shrink-0 flex items-center justify-center">
              <span className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold text-[14px] text-white">管</span>
            </div>
            <div className="flex flex-col">
              <span className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold text-[13px] text-[#272b30] leading-[18px]">管理员</span>
              <span className="text-[11px] text-[#9a9fa5] font-['Inter:Regular',sans-serif] leading-[16px]">admin@system.com</span>
            </div>
            <button className="ml-auto text-[#9a9fa5] hover:text-[#272b30] transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 2l4 4-4 4M14 6H6M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <div className="h-[72px] bg-[#fcfcfc] flex items-center justify-end px-[40px] flex-shrink-0 shadow-[inset_0_-1px_0_#f4f4f4]">
          <div className="flex gap-[8px] items-center">
            <div className="relative w-[40px] h-[40px] rounded-[10px] hover:bg-[#f4f4f4] flex items-center justify-center cursor-pointer transition-colors">
              <IconMessage />
              <div className="absolute top-[8px] right-[8px] w-[7px] h-[7px] bg-[#ff6a55] rounded-full border-2 border-[#fcfcfc]" />
            </div>
            <div className="relative w-[40px] h-[40px] rounded-[10px] hover:bg-[#f4f4f4] flex items-center justify-center cursor-pointer transition-colors">
              <IconBell />
              <div className="absolute top-[8px] right-[8px] w-[7px] h-[7px] bg-[#ff6a55] rounded-full border-2 border-[#fcfcfc]" />
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}