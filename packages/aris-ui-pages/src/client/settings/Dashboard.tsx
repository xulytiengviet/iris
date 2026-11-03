/**
 * Trung tâm điều hành IRIS: số liệu thực từ các API host aris, không có trạng thái giả.
 * Chỉ đọc; mọi thay đổi quyền, kênh, ký ức và skill được đưa về trang chuyên trách.
 */
import { Mascot, useInboxCount, useTeam, useTeamLive } from '@aris/ui-kit/react'
import type { PageProps } from '../page.js'
import { useGuardNow, useTodayTokens } from '../office/data.js'
import { fmtTokens, fmtUsd } from './stats-format.js'
import { useChannels, type ChannelSnapshot } from './channels-api.js'

type ChannelHealth = { name: string; ready: number; total: number; problem: boolean }

function channelHealth(data: ChannelSnapshot): ChannelHealth[] {
  const telegram = data.bots ?? []
  const zalo = data.zalo?.accounts ?? []
  const lark = data.lark?.apps ?? []
  return [
    {
      name: 'Telegram',
      total: telegram.length,
      ready: telegram.filter((a) => a.running && !a.error).length,
      problem: telegram.some((a) => !!a.error),
    },
    {
      name: 'Zalo',
      total: zalo.length,
      ready: zalo.filter((a) => a.running && a.state === 'listening' && !a.error).length,
      problem: zalo.some((a) => !!a.error || a.state === 'needs-qr'),
    },
    {
      name: 'Lark',
      total: lark.length,
      ready: lark.filter((a) => a.running && a.state === 'receiving' && !a.error).length,
      problem: lark.some((a) => !!a.error || a.state === 'error'),
    },
  ]
}

const STATUS: Record<string, { en: string; vi: string }> = {
  working: { en: 'Working', vi: 'Đang làm' },
  waiting: { en: 'Waiting', vi: 'Đang chờ' },
  idle: { en: 'Idle', vi: 'Nghỉ' },
  done: { en: 'Done', vi: 'Hoàn thành' },
  failed: { en: 'Failed', vi: 'Lỗi' },
}

const STYLES = `
.ap-command{flex:1;min-height:0;overflow-y:auto;padding:clamp(16px,3vw,32px);background:var(--a-bg);color:var(--a-ink)}
.ap-command *{box-sizing:border-box}
.ap-command-head{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:22px}
.ap-command h1{font-size:24px;letter-spacing:-.03em;font-weight:700;margin:0}
.ap-command .muted{color:var(--a-muted)}
.ap-command .eyebrow{font:600 11px/1.4 inherit;letter-spacing:.13em;text-transform:uppercase;color:var(--a-muted)}
.ap-command .description{margin:6px 0 0;font-size:13px}
.ap-command .actions,.ap-command .jump{display:flex;flex-wrap:wrap;gap:8px}
.ap-command button{color:inherit;font:inherit;cursor:pointer}
.ap-command .action{padding:9px 13px;border-radius:9px;border:1px solid var(--a-line);background:var(--a-panel);font-size:12.5px}
.ap-command .action:hover,.ap-command .jump button:hover{border-color:var(--a-accent);color:var(--a-accent)}
.ap-command .action.primary{background:var(--a-accent);color:white;border-color:var(--a-accent)}
.ap-command .stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:20px}
.ap-command .stat,.ap-command .panel{background:var(--a-panel);border:1px solid var(--a-line);border-radius:14px}
.ap-command .stat{padding:17px;min-width:0}
.ap-command .stat .value{font-size:27px;line-height:1.3;font-weight:700;font-variant-numeric:tabular-nums}
.ap-command .stat .label{font-size:12px;color:var(--a-muted);margin-top:5px}
.ap-command .warn{color:var(--a-warn)}
.ap-command .cols{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(290px,1fr);gap:14px;align-items:start}
.ap-command .panel{padding:17px;min-width:0}
.ap-command .panel h2{font-size:15px;display:flex;justify-content:space-between;gap:8px;align-items:center;margin:0 0 14px}
.ap-command .panel h2 button{font-size:12px;color:var(--a-accent);background:transparent;border:0}
.ap-command .botgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(176px,1fr));gap:10px}
.ap-command .bot{padding:12px;display:flex;align-items:center;gap:10px;text-align:left;min-width:0;border-radius:11px;border:1px solid var(--a-line);background:var(--a-bg)}
.ap-command .bot:hover{border-color:var(--a-accent)}
.ap-command .bot .name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ap-command .bot .status{font-size:11px;color:var(--a-muted);margin-top:3px}
.ap-command .state{width:7px;height:7px;flex:none;border-radius:50%;background:var(--a-muted);display:inline-block;margin-right:5px}
.ap-command .state.ok{background:var(--a-ok)}
.ap-command .state.warn{background:var(--a-warn)}
.ap-command .channel{display:flex;width:100%;align-items:center;gap:12px;justify-content:space-between;border:0;border-top:1px solid var(--a-line);background:none;text-align:left;padding:13px 2px}
.ap-command .channel:hover{color:var(--a-accent)}
.ap-command .channel .name{font-size:13px;font-weight:600}
.ap-command .channel small{display:block;font-size:11px;color:var(--a-muted);margin-top:3px}
.ap-command .jump{margin-top:16px}
.ap-command .jump button{flex:1 1 160px;text-align:left;padding:14px;border:1px solid var(--a-line);border-radius:11px;background:var(--a-panel);font-size:13px}
.ap-command .jump small{display:block;font-size:11px;color:var(--a-muted);margin-top:5px}
.ap-command .notice{font-size:12px;color:var(--a-muted);margin-top:14px;line-height:1.6}
@media(max-width:950px){.ap-command .stats{grid-template-columns:repeat(2,minmax(0,1fr))}.ap-command .cols{grid-template-columns:1fr}}
@media(max-width:540px){.ap-command .stats{gap:8px}.ap-command .stat{padding:12px}.ap-command .stat .value{font-size:21px}.ap-command h1{font-size:20px}.ap-command .panel{padding:12px}}
`

export function Dashboard({ t, nav }: PageProps) {
  const team = useTeam(t('of.dp.loose'))
  const live = useTeamLive()
  const pending = useInboxCount()
  const channels = useChannels()
  const tokens = useTodayTokens()
  const guard = useGuardNow()
  const vi = t('of.title') === 'Văn phòng'
  const tr = (viText: string, enText: string) => (vi ? viText : enText)
  const members = [team.commander, ...team.groups.flatMap((g) => g.members)].filter(
    (m, i, all) => all.findIndex((x) => x.id === m.id) === i,
  )
  const working = members.filter((m) => (live?.status[m.id]?.status ?? m.status) === 'working').length
  const health = channels.data ? channelHealth(channels.data) : null
  const money = guard ? fmtUsd(guard.spent, t('sx.dec')) + ' $' : '—'
  const totalChannels = health?.reduce((n, c) => n + c.total, 0)
  const readyChannels = health?.reduce((n, c) => n + c.ready, 0)
  const cards = [
    { value: team.ready ? String(members.length) : '—', label: tr('Bot trong đội', 'Team members'), sub: tr(String(working) + ' đang làm', String(working) + ' working') },
    { value: tokens ? fmtTokens(tokens.tokens, t('sx.dec')) : '—', label: tr('Token hôm nay', 'Tokens today'), sub: tr('Dữ liệu từ DSH', 'From DSH') },
    { value: money, label: tr('Chi phí hôm nay', 'Spent today'), sub: guard?.settings.teamCapUsd ? tr('Trần: ', 'Cap: ') + fmtUsd(guard.settings.teamCapUsd, t('sx.dec')) + ' $' : tr('Chưa đặt trần', 'No configured cap') },
    { value: String(pending), label: tr('Chờ phê duyệt / tự học', 'Pending review / learning'), sub: tr('Mở hộp duyệt để xử lý', 'Open approvals to review') },
  ]
  return (
    <main className="ap-command">
      <style>{STYLES}</style>
      <div className="ap-command-head">
        <div>
          <div className="eyebrow">IRIS / DEEPSEEK HARNESS</div>
          <h1>{tr('Trung tâm điều hành AI', 'AI command center')}</h1>
          <p className="description muted">{tr('Đội bot · Telegram · Zalo · Lark · Bộ não · Skill · Tự học', 'Bots · Telegram · Zalo · Lark · Brain · Skills · Learning')}</p>
        </div>
        <div className="actions">
          <button className="action" onClick={() => nav.go('settings', { section: 'channels' })}>{tr('Cấu hình kênh', 'Channel settings')}</button>
          <button className="action primary" onClick={() => nav.go('office')}>{tr('Vào văn phòng', 'Open office')}</button>
        </div>
      </div>
      <div className="stats">
        {cards.map((c) => <div className="stat" key={c.label}>
          <div className="value">{c.value}</div>
          <div className="label">{c.label}</div>
          <div className="muted" style={{ fontSize: 11, marginTop: 7 }}>{c.sub}</div>
        </div>)}
      </div>
      <div className="cols">
        <section className="panel" aria-label={tr('Đội bot AI', 'AI bot team')}>
          <h2>{tr('Đội bot AI cá nhân', 'Personal AI team')}
            <button onClick={() => nav.go('office')}>{tr('Xem 2D / 3D', 'View 2D / 3D')}</button>
          </h2>
          {!team.ready ? <div className="muted">{tr('Đang đọc dữ liệu đội…', 'Loading team…')}</div> : members.length === 0 ? <div className="muted">{tr('Chưa có thành viên. Tạo bot trong Văn phòng.', 'No members yet. Create bots in Office.')}</div> :
            <div className="botgrid">
              {members.map((m) => {
                const status = live?.status[m.id]?.status ?? m.status
                const label = STATUS[status] ?? STATUS.idle
                return <button key={m.id} className="bot" onClick={() => nav.go(m.id === 'aris' ? 'office' : 'bot', m.id === 'aris' ? {} : { id: m.id })}>
                  <Mascot id={m.mascot ?? m.id} accessory={m.accessory} size={35} />
                  <span style={{ minWidth: 0 }}>
                    <div className="name">{m.name}</div>
                    <div className="status"><span className={'state ' + (status === 'working' ? 'ok' : status === 'waiting' || status === 'failed' ? 'warn' : '')} />{vi ? label.vi : label.en}</div>
                  </span>
                </button>
              })}
            </div>}
        </section>
        <section className="panel" aria-label={tr('Trạng thái kênh', 'Channel health')}>
          <h2>{tr('Kênh liên lạc', 'Messaging channels')}
            <button onClick={() => nav.go('settings', { section: 'channels' })}>{tr('Quản lý', 'Manage')}</button>
          </h2>
          <p className="muted" style={{ fontSize: 12 }}>{health ? tr('Đang nghe ', 'Listening ') + readyChannels + '/' + totalChannels + tr(' tài khoản', ' accounts') : channels.error ? tr('Chưa đọc được API kênh.', 'Channel API unavailable.') : tr('Đang kiểm tra kết nối…', 'Checking connections…')}</p>
          {(health ?? [{ name: 'Telegram', total: 0, ready: 0, problem: false }, { name: 'Zalo', total: 0, ready: 0, problem: false }, { name: 'Lark', total: 0, ready: 0, problem: false }]).map((c) => (
            <button key={c.name} className="channel" onClick={() => nav.go('settings', { section: 'channels' })}>
              <span><span className={'state ' + (health && c.ready > 0 ? 'ok' : health && c.problem ? 'warn' : '')} /><span className="name">{c.name}</span>
                <small>{!health ? tr('Chưa có trạng thái', 'Status unavailable') : c.total === 0 ? tr('Chưa thiết lập', 'Not configured') : tr('Đang chạy ', 'Running ') + c.ready + '/' + c.total}</small></span>
              <span className="muted" aria-hidden="true">›</span>
            </button>
          ))}
        </section>
      </div>
      <nav className="jump" aria-label={tr('Lối tắt', 'Quick actions')}>
        <button onClick={() => nav.go('brain', { view: 'graph' })}>◈ {tr('Bộ não tri thức', 'Knowledge graph')}<small>{tr('Xem đồ thị, ghi chú, nguồn', 'Graph, notes, sources')}</small></button>
        <button onClick={() => nav.go('learn', { tab: 'inbox' })}>◎ {tr('Hộp duyệt tự học', 'Learning approvals')}<small>{tr('Kiểm chứng trước khi ghi nhớ', 'Review before saving')}</small></button>
        <button onClick={() => nav.go('learn', { tab: 'skills' })}>✦ {tr('Thư viện kỹ năng', 'Skills library')}<small>{tr('Nhập, duyệt và gán skill', 'Import, review and assign')}</small></button>
        <button onClick={() => nav.go('routine')}>↻ {tr('Lịch tự động', 'Automations')}<small>{tr('Quản lý routine và thời điểm chạy', 'Scheduled tasks and routines')}</small></button>
        <button onClick={() => nav.go('settings', { section: 'stats' })}>▥ {tr('Báo cáo vận hành', 'Runtime reports')}<small>{tr('Chi phí, phiên làm việc và nhật ký', 'Costs, sessions and logs')}</small></button>
      </nav>
      <p className="notice">{tr('Chỉ hiển thị dữ liệu thật mà API cung cấp. Dấu “—” nghĩa là chưa có số liệu. Việc cấp quyền, tự học, gửi tin và thay đổi cấu hình chỉ thực hiện tại màn hình chuyên trách.', 'Only real API data is shown; “—” means unavailable. Permissions, learning, messaging and configuration changes are handled in their dedicated screens.')}</p>
    </main>
  )
}
