export function HomePage() {
  const stats = [
    { label: "员工总数", value: "128", sub: "较上月 +3", color: "bg-[#e8f0fe]", text: "text-[#3b5bdb]" },
    { label: "在职设备", value: "64",  sub: "设备在线率 92%", color: "bg-[#e6f9f0]", text: "text-[#0d9f5f]" },
    { label: "项目数量", value: "12",  sub: "进行中 8 个", color: "bg-[#fff8e6]", text: "text-[#d48806]" },
    { label: "本月打卡", value: "3,840", sub: "异常记录 6 条", color: "bg-[#fce8f3]", text: "text-[#c2185b]" },
  ];

  return (
    <div className="px-[40px] py-[40px]">
      <h1 className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold text-[32px] text-[#272b30] leading-[40px] tracking-[-0.6px] mb-[28px]">
        首页
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-[16px] mb-[32px]">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#fcfcfc] rounded-[16px] p-[24px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className={`inline-flex px-[10px] py-[4px] rounded-[8px] ${s.color} ${s.text} text-[12px] font-semibold mb-[12px]`}>
              {s.label}
            </div>
            <p className="font-['Inter:Semi_Bold','Noto_Sans_SC:Bold',sans-serif] font-semibold text-[32px] text-[#272b30] leading-[40px] tracking-[-0.6px]">{s.value}</p>
            <p className="text-[#9a9fa5] text-[13px] mt-[4px]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="bg-[#fcfcfc] rounded-[16px] p-[24px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <p className="font-semibold text-[16px] text-[#272b30] mb-[16px]">快速入口</p>
        <div className="grid grid-cols-3 gap-[12px]">
          {[
            { label: "人员管理", desc: "查看与管理员工信息", to: "/personnel", color: "bg-[#e8f0fe]" },
            { label: "设备管理", desc: "管理研发设备资产",   to: "/equipment", color: "bg-[#e6f9f0]" },
            { label: "打卡记录", desc: "导入员工打卡数据",   to: "/attendance", color: "bg-[#fff8e6]" },
            { label: "项目列表", desc: "查看所有研发项目",   to: "/projects",   color: "bg-[#fce8f3]" },
            { label: "操作日志", desc: "系统操作记录查询",   to: "/operation-log", color: "bg-[#f0f0ff]" },
            { label: "账号管理", desc: "管理系统用户账号",   to: "/accounts",   color: "bg-[#fff0e6]" },
          ].map((item) => (
            <a key={item.label} href={item.to}
              className="flex items-center gap-[14px] p-[16px] rounded-[12px] border border-[#f4f4f4] hover:border-[#e0e0e0] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all cursor-pointer">
              <div className={`w-[40px] h-[40px] rounded-[10px] ${item.color} flex items-center justify-center flex-shrink-0`}>
                <span className="text-[18px]">→</span>
              </div>
              <div>
                <p className="font-semibold text-[14px] text-[#272b30]">{item.label}</p>
                <p className="text-[#9a9fa5] text-[12px] mt-[2px]">{item.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
