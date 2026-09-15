"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { ArrowRight, Globe2, MapPin, ShieldCheck } from "lucide-react";
import type { HeroPerson } from "@/lib/psychologists";
import styles from "./hero-visual.module.css";

function firstNames(name: string | null): string {
  const parts = (name || "Psicólogo(a)").trim().split(/\s+/).filter((w) => !/^(dr|dra|prof|profa)\.?$/i.test(w));
  return parts[1] ? `${parts[0]} ${parts[1][0]}.` : parts[0] || "Psicólogo(a)";
}

export function HeroVisual({ people = [] }: { people?: HeroPerson[] }) {
  const [active, setActive] = useState(0);

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const moving = !hovered && !focused && !reduced && inView && pageVisible;
  const count = people.length;
  const current = count ? active % count : 0;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    const visibility = () => setPageVisible(!document.hidden);
    sync(); visibility();
    media.addEventListener("change", sync);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    if (root.current) observer.observe(root.current);
    return () => {
      media.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", visibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!moving || count < 2) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % count), 6500);
    return () => window.clearInterval(timer);
  }, [moving, count]);

  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--tilt-x", `${-((event.clientY - bounds.top) / bounds.height - 0.5) * 12}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${((event.clientX - bounds.left) / bounds.width - 0.5) * 16}deg`);
  }

  return (
    <div ref={root} className={styles.portal} data-moving={moving} role="region" aria-label="Conheça os profissionais da Ayumana"
      onPointerMove={tilt}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty("--tilt-x", "0deg");
        event.currentTarget.style.setProperty("--tilt-y", "0deg");
      }}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    >
      <div className={styles.viewport}>
        <div className={styles.scene}>
          <div className={styles.world} aria-hidden="true">
            <div className={styles.halo} />
            <div className={styles.orbit}><i /></div>
            <div className={`${styles.orbit} ${styles.orbitTwo}`}><i /></div>
            <div className={`${styles.orbit} ${styles.orbitThree}`} />
            <div className={styles.globe}>
              <svg viewBox="0 0 320 320" className={styles.grid} fill="none">
                <circle cx="160" cy="160" r="157" />
                {[45, 90, 135].map((rx) => <ellipse key={rx} cx="160" cy="160" rx={rx} ry="157" />)}
                {[65, 110, 160, 210, 255].map((cy) => <ellipse key={cy} cx="160" cy={cy} rx={Math.sqrt(157 ** 2 - (cy - 160) ** 2)} ry="19" />)}
                <path className={styles.connection} d="M83 230 Q90 40 226 102 M83 230 Q248 264 260 153 M83 230 Q8 130 119 92" />
                <g className={styles.nodes}><circle cx="83" cy="230" r="5" /><circle cx="226" cy="102" r="4" /><circle cx="260" cy="153" r="4" /><circle cx="119" cy="92" r="4" /></g>
              </svg>
              <div className={styles.brandCore}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/ayumana-symbol.png" alt="" width="68" height="68" />
                <span>ayumana</span><small>O cuidado aproxima.</small>
              </div>
              <div className={styles.reflection} />
            </div>
            <span className={`${styles.country} ${styles.portugal}`}>PT <b>Portugal</b></span>
            <span className={`${styles.country} ${styles.brasil}`}>BR <b>Brasil</b></span>
            <span className={`${styles.country} ${styles.japan}`}>JP <b>Japão</b></span>
            <div className={styles.floor} />
          </div>
          {people.map((person, index) => {
            const offset = (index - current + count) % count;
            const slot = offset === 0 ? "front" : offset === 1 ? "back" : offset === count - 1 ? "side" : "hidden";
            const name = firstNames(person.name);
            const content = <>
              <div className={styles.cardLabel}><span /> CUIDADO EM PORTUGUÊS <ShieldCheck size={13} /></div>
              <div className={styles.person}>
                <div className={styles.avatar}>
                  {person.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={person.avatar_url} alt="" width="56" height="56" />
                  ) : <span>{name.slice(0, 1)}</span>}
                </div>
                <div className={styles.identity}><strong>{name}</strong><span>{person.role}</span></div>
              </div>
              <div className={styles.location}><MapPin size={12} /><span>{person.place}</span></div>
              {person.slug && <div className={styles.cardCta}>Conhecer profissional <ArrowRight size={15} /></div>}
            </>;
            const props = {
              className: styles.card, "data-slot": slot,
              "aria-hidden": slot === "hidden" ? true : undefined,
              tabIndex: slot === "hidden" ? -1 : 0,
              onPointerEnter: () => setHovered(true), onPointerLeave: () => setHovered(false),
            };
            return person.slug ? (
              <Link key={person.slug} href={`/psicologo/${person.slug}`} prefetch={false} aria-label={`Conhecer ${person.name || name}`} {...props}>{content}</Link>
            ) : <div key={index} {...props}>{content}</div>;
          })}
          {!count && <Link href="/psicologos" className={`${styles.card} ${styles.empty}`} data-slot="front"><Globe2 size={24} /><strong>O cuidado vai até você.</strong><span>Encontre seu psicólogo <ArrowRight size={16} /></span></Link>}
        </div>
      </div>
      <div className={styles.controls}>
        <span className={styles.caption}>Perto de você. Em qualquer lugar.</span>
      </div>
    </div>
  );
}
