// Global motion for leadglobe. Runs once on the client, before the first page initializes.
// Motion verb: route. Things travel along a line and lock into place.
import { gsap } from 'gsap';
import { ease, isTouch, onPage, onScroll, prefersReducedMotion, setTransition } from '@/engine';

// Page transition: an ink panel sweeps up along the orbit's -30° angle, then clears upward.
const covered = 'polygon(0% 0%, 100% -45%, 100% 100%, 0% 145%)';
function sweep() {
  setTransition({
    leave: (c) => gsap.timeline()
      .set(c, { autoAlpha: 1 })
      .fromTo(c.querySelector('.curtain__panel'),
        { clipPath: 'polygon(0% 145%, 100% 100%, 100% 100%, 0% 145%)' },
        { clipPath: covered, duration: 0.8, ease: ease.inOut }),
    enter: (c) => gsap.timeline()
      .fromTo(c.querySelector('.curtain__panel'),
        { clipPath: covered },
        { clipPath: 'polygon(0% -45%, 100% -90%, 100% -90%, 0% -45%)', duration: 0.85, ease: ease.inOut })
      .set(c, { autoAlpha: 0 }),
  });
}

// Buttons: the fill floods in from where the pointer enters and drains toward where it leaves.
function buttonFill() {
  onPage(() => {
    if (isTouch() || prefersReducedMotion()) return; // CSS covers touch, keyboard and reduced motion
    const off: (() => void)[] = [];
    document.querySelectorAll<HTMLElement>('[data-fill]').forEach((btn) => {
      const fill = btn.querySelector<HTMLElement>('.btn__fill');
      if (!fill) return;
      const at = (e: PointerEvent) => {
        const r = btn.getBoundingClientRect();
        return `${e.clientX - r.left}px ${e.clientY - r.top}px`;
      };
      let closed = true;
      const open = (p: string) => {
        if (closed) gsap.set(fill, { clipPath: `circle(0% at ${p})` });
        closed = false;
        btn.classList.add('is-filled');
        gsap.to(fill, { clipPath: `circle(150% at ${p})`, duration: 0.55, ease: ease.soft, overwrite: true });
      };
      const close = (p: string) => {
        btn.classList.remove('is-filled');
        gsap.to(fill, { clipPath: `circle(0% at ${p})`, duration: 0.45, ease: ease.soft, overwrite: true, onComplete: () => { closed = true; } });
      };
      const enter = (e: PointerEvent) => open(at(e));
      const leave = (e: PointerEvent) => close(at(e));
      const focus = () => btn.matches(':focus-visible') && open('50% 50%');
      const blur = () => close('50% 50%');
      btn.addEventListener('pointerenter', enter);
      btn.addEventListener('pointerleave', leave);
      btn.addEventListener('focus', focus);
      btn.addEventListener('blur', blur);
      off.push(() => {
        btn.removeEventListener('pointerenter', enter);
        btn.removeEventListener('pointerleave', leave);
        btn.removeEventListener('focus', focus);
        btn.removeEventListener('blur', blur);
      });
    });
    return () => off.forEach((f) => f());
  });
}

// Header steps aside while reading down, returns on the way up; gains a hairline once scrolled.
function headerFrame() {
  let last = 0;
  onScroll(({ y }) => {
    const h = document.documentElement.classList;
    h.toggle('is-scrolled', y > 8);
    if (Math.abs(y - last) < 6) return;
    h.toggle('header-away', y > 240 && y > last && !h.contains('menu-open'));
    last = y;
  });
  onPage(() => { document.documentElement.classList.remove('header-away', 'is-scrolled'); });
}

export function setupMotion() {
  sweep();
  buttonFill();
  headerFrame();
}
