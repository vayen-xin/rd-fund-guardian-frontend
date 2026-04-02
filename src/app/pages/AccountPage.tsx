import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type AccountStatus = "启用" | "停用";

type Account = {
  id: string;
  username: string;
  createdAt: string;
  status: AccountStatus;
};

// ─── Mock Current User（模拟本地登录态）──────────────────────────────────────
const CURRENT_USER: Account = {
  id: "current",
  username: "admin",
  createdAt: "2026-01-01 00:00:00",
  status: "启用",
};

// Mock password for current user (purely frontend simulation)
const MOCK_CURRENT_PASSWORD = "admin123";

// ─── Mock Accounts（后端返回，不含自己）──────────────────────────────────────
const initialAccounts: Account[] = [
  { id: "2", username: "manager01",  createdAt: "2026-01-15 09:30:00", status: "启用" },
  { id: "3", username: "operator01", createdAt: "2026-01-20 14:22:00", status: "启用" },
  { id: "4", username: "operator02", createdAt: "2026-02-01 08:05:00", status: "启用" },
  { id: "5", username: "张伟",        createdAt: "2026-02-10 10:00:00", status: "启用" },
  { id: "6", username: "李娜",        createdAt: "2026-02-10 10:04:00", status: "停用" },
  { id: "7", username: "王芳",        createdAt: "2026-02-15 09:00:00", status: "启用" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function CloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-[32px] h-[32px] rounded-[8px] bg-[#f4f4f4] flex items-center justify-center text-[#6f767e] hover:text-[#272b30] transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="#9A9FA5" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="2" stroke="#9A9FA5" strokeWidth="1.4" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12M6.5 6.6A2 2 0 0010.4 10M4.15 4.2C2.6 5.2 1 8 1 8s2.5 5 7 5a7.1 7.1 0 003.85-1.2M6.5 3.1A7 7 0 0115 8s-.9 1.8-2.5 3" stroke="#9A9FA5" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function PasswordInput({
  placeholder, value, onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[44px] px-[14px] pr-[42px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[14px] outline-none focus:border-[#272b30] transition-colors"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#9a9fa5] hover:text-[#6f767e] transition-colors"
      >
        <EyeIcon show={show} />
      </button>
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-[4px] text-[#ff6a55] text-[12px]">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="#ff6a55" strokeWidth="1.2" />
        <path d="M6 4v3M6 8.5v.2" stroke="#ff6a55" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      {msg}
    </p>
  );
}

// ─── Add Account Modal ────────────────────────────────────────────────────────
function AddAccountModal({
  existingUsernames,
  onConfirm,
  onCancel,
}: {
  existingUsernames: string[];
  onConfirm: (username: string, password: string) => void;
  onCancel: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const errUsername =
    !username.trim() ? "用户名不能为空" :
    existingUsernames.includes(username.trim()) ? "用户名已存在" : "";
  const errPassword = password.length > 0 && password.length < 6 ? "密码至少 6 位" : "";
  const errConfirm = confirm && confirm !== password ? "两次密码输入不一致" : "";

  const isValid = !errUsername && password.length >= 6 && !errConfirm && confirm === password;

  const handleConfirm = () => {
    setSubmitted(true);
    if (isValid) onConfirm(username.trim(), password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[440px] p-[32px]">
        <div className="flex items-center justify-between mb-[24px]">
          <h3 className="font-semibold text-[#272b30] text-[18px]">添加账号</h3>
          <CloseBtn onClick={onCancel} />
        </div>
        <div className="flex flex-col gap-[16px]">
          {/* 用户名 */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[#6f767e] text-[13px] font-medium">用户名</label>
            <input
              type="text"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`h-[44px] px-[14px] rounded-[10px] border bg-[#f4f4f4] text-[#272b30] text-[14px] outline-none transition-colors ${submitted && errUsername ? "border-[#ff6a55]" : "border-[#efefef] focus:border-[#272b30]"}`}
            />
            {submitted && errUsername && <FieldError msg={errUsername} />}
          </div>
          {/* 密码 */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[#6f767e] text-[13px] font-medium">密码</label>
            <PasswordInput placeholder="请输入密码（至少 6 位）" value={password} onChange={setPassword} />
            {errPassword && <FieldError msg={errPassword} />}
          </div>
          {/* 确认密码 */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[#6f767e] text-[13px] font-medium">确认密码</label>
            <PasswordInput placeholder="请再次输入密码" value={confirm} onChange={setConfirm} />
            {errConfirm && <FieldError msg={errConfirm} />}
          </div>
        </div>
        <div className="flex gap-[12px] mt-[28px]">
          <button onClick={onCancel} className="flex-1 h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-semibold hover:bg-[#f4f4f4] transition-colors">取消</button>
          <button onClick={handleConfirm} className="flex-1 h-[44px] rounded-[10px] bg-[#272b30] text-white text-[14px] font-semibold hover:bg-[#1a1d1f] transition-colors">确认添加</button>
        </div>
      </div>
    </div>
  );
}

// ─── Change Password Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ onCancel }: { onCancel: () => void }) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);

  const errOld = submitted && oldPwd !== MOCK_CURRENT_PASSWORD ? "原密码不正确" : "";
  const errNew = newPwd.length > 0 && newPwd.length < 6 ? "新密码至少 6 位" : "";
  const errConfirm = confirm && confirm !== newPwd ? "两次密码输入不一致" : "";
  const isValid = oldPwd === MOCK_CURRENT_PASSWORD && newPwd.length >= 6 && confirm === newPwd;

  const handleConfirm = () => {
    setSubmitted(true);
    if (isValid) setSuccess(true);
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
        <div className="relative bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[440px] p-[40px] flex flex-col items-center text-center">
          <div className="w-[56px] h-[56px] rounded-full bg-[#e6f9f0] flex items-center justify-center mb-[16px]">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M5 13l5.5 5.5L21 8" stroke="#0d9f5f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="font-semibold text-[#272b30] text-[18px] mb-[8px]">密码修改成功</h3>
          <p className="text-[#6f767e] text-[14px] mb-[28px]">新密码已生效，下次登录请使用新密码</p>
          <button onClick={onCancel} className="w-full h-[44px] rounded-[10px] bg-[#272b30] text-white text-[14px] font-semibold hover:bg-[#1a1d1f] transition-colors">知道了</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[440px] p-[32px]">
        <div className="flex items-center justify-between mb-[8px]">
          <h3 className="font-semibold text-[#272b30] text-[18px]">修改密码</h3>
          <CloseBtn onClick={onCancel} />
        </div>
        <p className="text-[#9a9fa5] text-[13px] mb-[24px]">当前账号：<span className="text-[#272b30] font-semibold">{CURRENT_USER.username}</span></p>
        <div className="flex flex-col gap-[16px]">
          {/* 原密码 */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[#6f767e] text-[13px] font-medium">原密码</label>
            <PasswordInput placeholder="请输入原密码" value={oldPwd} onChange={setOldPwd} />
            {errOld && <FieldError msg={errOld} />}
          </div>
          {/* 新密码 */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[#6f767e] text-[13px] font-medium">新密码</label>
            <PasswordInput placeholder="请输入新密码（至少 6 位）" value={newPwd} onChange={setNewPwd} />
            {errNew && <FieldError msg={errNew} />}
          </div>
          {/* 确认新密码 */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[#6f767e] text-[13px] font-medium">确认新密码</label>
            <PasswordInput placeholder="请再次输入新密码" value={confirm} onChange={setConfirm} />
            {errConfirm && <FieldError msg={errConfirm} />}
          </div>
        </div>
        <div className="flex gap-[12px] mt-[28px]">
          <button onClick={onCancel} className="flex-1 h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-semibold hover:bg-[#f4f4f4] transition-colors">取消</button>
          <button onClick={handleConfirm} className="flex-1 h-[44px] rounded-[10px] bg-[#272b30] text-white text-[14px] font-semibold hover:bg-[#1a1d1f] transition-colors">确认修改</button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Confirm Modal ─────────────────────────────────────────────────────
function StatusConfirmModal({
  account,
  targetStatus,
  onConfirm,
  onCancel,
}: {
  account: Account;
  targetStatus: AccountStatus;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isDisabling = targetStatus === "停用";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-[16px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[400px] p-[32px]">
        <div className="flex items-start gap-[16px] mb-[16px]">
          <div className={`w-[44px] h-[44px] rounded-[12px] flex items-center justify-center flex-shrink-0 ${isDisabling ? "bg-[#fff5f4]" : "bg-[#e6f9f0]"}`}>
            {isDisabling ? (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="8" stroke="#ff6a55" strokeWidth="1.8" />
                <path d="M8 11h6" stroke="#ff6a55" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="8" stroke="#0d9f5f" strokeWidth="1.8" />
                <path d="M7.5 11l2.5 2.5 4.5-4.5" stroke="#0d9f5f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-[#272b30] text-[18px]">
              确认{isDisabling ? "停用" : "启用"}账号
            </h3>
            <p className="text-[#6f767e] text-[14px] mt-[6px]">
              确定要{isDisabling ? "停用" : "启用"}账号{" "}
              <span className="text-[#272b30] font-semibold">「{account.username}」</span>
              {isDisabling ? " 吗？停用后该账号将无法登录系统。" : " 吗？启用后该账号可正常登录。"}
            </p>
          </div>
        </div>
        <div className="flex gap-[12px] mt-[24px]">
          <button onClick={onCancel} className="flex-1 h-[44px] rounded-[10px] border border-[#efefef] bg-white text-[#6f767e] text-[14px] font-semibold hover:bg-[#f4f4f4] transition-colors">取消</button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-[44px] rounded-[10px] text-white text-[14px] font-semibold transition-colors ${isDisabling ? "bg-[#ff6a55] hover:bg-[#e55a45]" : "bg-[#0d9f5f] hover:bg-[#0b8a52]"}`}
          >
            确认{isDisabling ? "停用" : "启用"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, disabled, onClick }: { status: AccountStatus; disabled?: boolean; onClick?: () => void }) {
  const isActive = status === "启用";
  const base = "inline-flex items-center gap-[5px] px-[10px] h-[26px] rounded-[6px] text-[12px] font-semibold transition-colors select-none";
  const active = "bg-[#e6f9f0] text-[#0d9f5f]";
  const inactive = "bg-[#f4f4f4] text-[#9a9fa5]";
  const clickable = "cursor-pointer hover:opacity-80";
  const disabledCls = "cursor-not-allowed opacity-50";

  return (
    <span
      className={`${base} ${isActive ? active : inactive} ${disabled ? disabledCls : clickable}`}
      onClick={disabled ? undefined : onClick}
      title={disabled ? "不可操作自己的账号" : `点击${isActive ? "停用" : "启用"}此账号`}
    >
      <span className={`w-[6px] h-[6px] rounded-full ${isActive ? "bg-[#0d9f5f]" : "bg-[#9a9fa5]"}`} />
      {status}
    </span>
  );
}

// ─── Main Functional View ─────────────────────────────────────────────────────
function AccountMain() {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{ account: Account; to: AccountStatus } | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return accounts;
    return accounts.filter((a) => a.username.includes(search.trim()));
  }, [accounts, search]);

  // Does current user match search too?
  const showCurrentUser = !search.trim() || CURRENT_USER.username.includes(search.trim());

  const allUsernames = [CURRENT_USER.username, ...accounts.map((a) => a.username)];

  const handleAdd = (username: string) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setAccounts((prev) => [
      ...prev,
      { id: `acc-${Date.now()}`, username, createdAt, status: "启用" },
    ]);
    setShowAdd(false);
  };

  const handleStatusConfirm = () => {
    if (!statusTarget) return;
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === statusTarget.account.id ? { ...a, status: statusTarget.to } : a
      )
    );
    setStatusTarget(null);
  };

  // Build display rows: current user first (index 0), then filtered others
  const displayRows: { account: Account; isSelf: boolean; globalIdx: number }[] = [];
  let idx = 1;
  if (showCurrentUser) {
    displayRows.push({ account: CURRENT_USER, isSelf: true, globalIdx: idx++ });
  }
  filtered.forEach((a) => {
    displayRows.push({ account: a, isSelf: false, globalIdx: idx++ });
  });

  return (
    <div className="flex flex-col gap-[24px]">
      {/* ── 顶部操作区 ── */}
      <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-[20px]">
        <div className="flex items-center justify-between flex-wrap gap-[12px]">
          {/* 搜索框 */}
          <div className="relative">
            <svg className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#9a9fa5]" width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="搜索用户名"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-[40px] pl-[34px] pr-[14px] w-[220px] rounded-[10px] border border-[#efefef] bg-[#f4f4f4] text-[#272b30] text-[13px] outline-none focus:border-[#272b30] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#9a9fa5] hover:text-[#6f767e]"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {/* 按钮组 */}
          <div className="flex items-center gap-[10px]">
            <button
              onClick={() => setShowChangePwd(true)}
              className="flex items-center gap-[7px] h-[40px] px-[16px] rounded-[10px] border border-[#efefef] bg-white text-[#272b30] text-[13px] font-semibold hover:bg-[#f4f4f4] transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="#272B30" strokeWidth="1.4" />
                <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="#272B30" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="8" cy="10.5" r="1" fill="#272B30" />
              </svg>
              修改密码
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-[7px] h-[40px] px-[16px] rounded-[10px] bg-[#272b30] text-white text-[13px] font-semibold hover:bg-[#1a1d1f] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1.5v10M1.5 6.5h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              添加账号
            </button>
          </div>
        </div>
      </div>

      {/* ── 账号表格 ── */}
      <div className="bg-[#fcfcfc] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f4f4f4]">
                {["序号", "用户名", "创建时间", "状态"].map((h) => (
                  <th key={h} className="text-left px-[20px] py-[13px] text-[#6f767e] text-[12px] font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map(({ account, isSelf, globalIdx }) => (
                <tr
                  key={account.id}
                  className={`border-b border-[#f4f4f4] last:border-b-0 transition-colors ${isSelf ? "bg-[#fafaf8]" : "hover:bg-[#fafafa]"}`}
                >
                  {/* 序号 */}
                  <td className="px-[20px] py-[15px] text-[#9a9fa5] text-[13px] w-[72px] whitespace-nowrap">
                    {globalIdx}
                  </td>

                  {/* 用户名 */}
                  <td className="px-[20px] py-[15px] whitespace-nowrap">
                    <div className="flex items-center gap-[10px]">
                      <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center text-[13px] font-semibold ${isSelf ? "bg-[#272b30] text-white" : "bg-[#efefef] text-[#6f767e]"}`}>
                        {account.username.slice(-1).toUpperCase()}
                      </div>
                      <div className="flex flex-col gap-[1px]">
                        <span className="text-[#272b30] text-[13px] font-semibold">{account.username}</span>
                        {isSelf && (
                          <span className="text-[10px] text-[#6f767e] bg-[#efefef] px-[6px] py-[1px] rounded-[4px] w-fit leading-[16px]">当前账号</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 创建时间 */}
                  <td className="px-[20px] py-[15px] whitespace-nowrap">
                    {account.createdAt ? (
                      <div className="flex flex-col gap-[1px]">
                        <span className="text-[#272b30] text-[13px]">{account.createdAt.slice(0, 10)}</span>
                        <span className="text-[#9a9fa5] text-[12px]">{account.createdAt.slice(11)}</span>
                      </div>
                    ) : (
                      <span className="text-[#9a9fa5] text-[13px]">—</span>
                    )}
                  </td>

                  {/* 状态 */}
                  <td className="px-[20px] py-[15px] whitespace-nowrap">
                    <StatusBadge
                      status={account.status}
                      disabled={isSelf}
                      onClick={() =>
                        setStatusTarget({
                          account,
                          to: account.status === "启用" ? "停用" : "启用",
                        })
                      }
                    />
                  </td>
                </tr>
              ))}

              {displayRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-[56px] text-[#9a9fa5] text-[14px]">
                    未找到匹配的账号
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="px-[20px] py-[14px] border-t border-[#f4f4f4] flex items-center justify-between">
          <p className="text-[#9a9fa5] text-[12px]">
            共 <span className="text-[#272b30] font-semibold">{displayRows.length}</span> 个账号（含当前登录账号）
          </p>
          <p className="text-[#9a9fa5] text-[12px]">
            启用{" "}
            <span className="text-[#0d9f5f] font-semibold">
              {displayRows.filter((r) => r.account.status === "启用").length}
            </span>{" "}
            · 停用{" "}
            <span className="text-[#9a9fa5] font-semibold">
              {displayRows.filter((r) => r.account.status === "停用").length}
            </span>
          </p>
        </div>
      </div>

      {/* ── Modals ── */}
      {showAdd && (
        <AddAccountModal
          existingUsernames={allUsernames}
          onConfirm={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}
      {showChangePwd && (
        <ChangePasswordModal onCancel={() => setShowChangePwd(false)} />
      )}
      {statusTarget && (
        <StatusConfirmModal
          account={statusTarget.account}
          targetStatus={statusTarget.to}
          onConfirm={handleStatusConfirm}
          onCancel={() => setStatusTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export function AccountPage() {
  return (
    <div className="px-[40px] py-[40px]">
      <div className="flex items-center justify-between mb-[28px]">
        <h1 className="font-semibold text-[32px] text-[#272b30] leading-[40px] tracking-[-0.6px]">
          账号管理
        </h1>
      </div>

      <AccountMain />
    </div>
  );
}
