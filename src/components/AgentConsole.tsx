'use client';
// The run log (creative direction §4): named agents post work as rows, and anything brand-facing
// waits at a human gate. The gate is the row whose resting status is `waiting` (the only pink pill).
//
// The server renders every row in its resting status, so no-JS and reduced motion get the full
// log, and the approve button still works there (it is plain state). With motion, one paused
// timeline per loop (toggled by ScrollTrigger) brings the rows in one by one: each shows `running`,
// then settles to its resting status from the data. The gate holds; the visitor approves it, or it
// approves itself after GATE_S idle seconds, and only then does the log hold and replay.
// Only approvals the visitor makes are announced (the loop would announce forever otherwise).
import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { consoleSection, type RunStatus } from '@/data/site';
import { usePage } from '@/engine/next';
import { ease, prefersReducedMotion } from '@/engine/env';

gsap.registerPlugin(ScrollTrigger);

const { rows, agents, points, serviceShort, statusLabels, approval, panel } = consoleSection;
const RESTING: RunStatus[] = rows.map((r) => r.status);
const agentName = Object.fromEntries(agents.map((a) => [a.id, a.name]));

const STEP = 0.45; // between row arrivals
const SETTLE = 1.1; // running → resting status
const GATE_S = 5; // idle gate auto-approves ("the team approved it")
const HOLD = 3; // after every row has settled

type Anim = { sync: () => void; hold: (on: boolean) => void };

export function AgentConsole() {
  const root = useRef<HTMLDivElement>(null);
  const live = useRef<RunStatus[]>(RESTING); // source of truth for timeline callbacks
  const anim = useRef<Anim | null>(null);
  const [status, setStatus] = useState<RunStatus[]>(RESTING);
  const [shown, setShown] = useState(rows.length);
  const [announce, setAnnounce] = useState('');

  const commit = (next: RunStatus[]) => {
    live.current = next;
    setStatus(next);
    anim.current?.sync();
  };

  const approve = (i: number, byUser: boolean) => {
    if (live.current[i] !== 'waiting') return;
    const n = [...live.current];
    n[i] = 'approved';
    commit(n);
    if (!byUser) return;
    setAnnounce(`${approval.approved} ${approval.byPrefix} ${approval.by}: ${rows[i].task}`);
    // The button unmounts; keep focus on its row instead of dropping it to <body>.
    root.current?.querySelector<HTMLElement>(`[data-row="${i}"]`)?.focus({ preventScroll: true });
  };

  usePage(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const items = [...el.querySelectorAll<HTMLElement>('.console__row')];
    let dead = false;
    let onScreen = false;
    let awaiting = false; // the loop reached its end with a gate still open
    let held = false; // the visitor is on the approve button: don't approve under them
    let gate: gsap.core.Tween | null = null;
    let gateRow = -1;
    const safe = (fn: () => void) => () => { if (!dead) fn(); };
    const set = (i: number, st: RunStatus) => {
      const n = [...live.current];
      n[i] = st;
      commit(n);
    };

    const tl = gsap.timeline({ paused: true, repeat: -1 });
    tl.call(safe(() => { commit(rows.map(() => 'running')); setShown(0); }), [], 0);
    tl.set(items, { autoAlpha: 0, y: 8 }, 0);
    rows.forEach((r, i) => {
      const t = 0.3 + i * STEP;
      tl.call(safe(() => { set(i, 'running'); setShown(i + 1); }), [], t);
      tl.to(items[i], { autoAlpha: 1, y: 0, duration: 0.6, ease: ease.out }, t);
      tl.call(safe(() => set(i, r.status)), [], t + SETTLE);
    });
    tl.call(safe(() => { if (live.current.includes('waiting')) { awaiting = true; tl.pause(); } }), [], '>');
    tl.to(items, { autoAlpha: 0, duration: 0.4, ease: ease.soft }, `>+${HOLD}`);

    const gatePaused = () => !onScreen || held;
    anim.current = {
      // After every status change: (re)arm the idle gate, and finish the loop once it is approved.
      sync: () => {
        const w = live.current.indexOf('waiting');
        if (w !== gateRow) {
          gate?.kill();
          gate = null;
          gateRow = w;
          held = false; // the old button unmounted without a blur/leave
          if (w >= 0) gate = gsap.delayedCall(GATE_S, safe(() => approve(w, false))).paused(gatePaused());
        }
        if (awaiting && !live.current.includes('waiting')) {
          awaiting = false;
          if (onScreen) tl.play();
        }
      },
      hold: (on) => { held = on; gate?.paused(gatePaused()); },
    };

    gsap.set(items, { autoAlpha: 0, y: 8 }); // nothing shows before the console is reached
    setShown(0);
    el.classList.add('is-looping');
    const st = ScrollTrigger.create({
      trigger: el.querySelector('.console__panel'),
      start: 'top 85%',
      end: 'bottom top',
      onToggle: (s) => {
        onScreen = s.isActive;
        if (onScreen && !awaiting) tl.play();
        else if (!onScreen) tl.pause();
        gate?.paused(gatePaused());
      },
    });

    return () => {
      dead = true;
      anim.current = null;
      tl.kill();
      gate?.kill();
      st.kill();
      gsap.set(items, { clearProps: 'opacity,visibility,transform' });
      el.classList.remove('is-looping');
      commit(RESTING);
      setShown(rows.length);
    };
  });

  return (
    <div className="console" ref={root}>
      <div className="console__side">
        <ol className="console__points">
          {points.map((p, i) => (
            <li key={p.name} data-reveal="up" data-delay={String(i * 0.06)}>
              <span className="console__n" aria-hidden="true">0{i + 1}</span>
              <h3 className="console__point-name">{p.name}</h3>
              <p className="console__point-text">{p.text}</p>
            </li>
          ))}
        </ol>
        <dl className="console__agents" data-reveal="up" data-delay="0.2">
          {agents.map((a) => (
            <div key={a.id} className="console__agent-item">
              <dt>{a.name}</dt>
              <dd>{a.role}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="console__main">
        <div className="console__panel">
          <div className="console__bar" aria-hidden="true">
            <span className="console__dot" />
            <span className="console__bar-title">{panel.title}</span>
            <span className="console__count">{shown} {shown === 1 ? panel.row : panel.rows}</span>
          </div>
          <h3 id="console-log-title" className="sr-only">{panel.title}</h3>
          <ol className="console__list" aria-labelledby="console-log-title" aria-describedby="console-log-caption">
            {rows.map((r, i) => {
              const s = status[i];
              return (
                <li key={r.task} className={`console__row is-${s}`} data-row={i} tabIndex={-1}>
                  <p className="console__meta">
                    <span className="console__agent">{agentName[r.agent]}</span>
                    <span className="badge badge--line console__svc">{serviceShort[r.service]}</span>
                  </p>
                  <p className="console__task">{r.task}</p>
                  <p className="console__result">{r.result}</p>
                  <div className="console__state">
                    <span className={`status console__pill console__pill--${s}`}>{statusLabels[s]}</span>
                    {s === 'waiting' && (
                      <button
                        type="button"
                        className="console__approve"
                        aria-label={`${approval.action}: ${r.task}`}
                        onClick={() => approve(i, true)}
                        onFocus={() => anim.current?.hold(true)}
                        onBlur={() => anim.current?.hold(false)}
                        onPointerEnter={() => anim.current?.hold(true)}
                        onPointerLeave={() => anim.current?.hold(false)}
                      >
                        {approval.action}
                      </button>
                    )}
                    {s === 'approved' && <span className="console__by">{approval.byPrefix} {approval.by}</span>}
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="sr-only" aria-live="polite">{announce}</p>
        </div>
        <p id="console-log-caption" className="label console__caption">{consoleSection.caption}</p>
      </div>
    </div>
  );
}
