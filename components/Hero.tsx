import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { HeroStats } from "./HeroStats";
import { LOGO } from "@/lib/logo";
import { NextEvent } from "./NextEvent";
import { HeroTitle } from "./HeroTitle";

const i = (n: number) => ({ "--i": n }) as React.CSSProperties;
const d = (s: number) => ({ "--d": `${s}s` }) as React.CSSProperties;

export function Hero() {
  return (
    <section id="home" aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="aurora absolute inset-0 -z-10" />
      <div aria-hidden="true" className="dots absolute inset-0 -z-10 opacity-60" />
      {/* Phones: no separate logo block; the mark sits faintly behind the text instead. */}
      <Image src={LOGO.src} alt="" aria-hidden="true" width={LOGO.width} height={LOGO.height} priority sizes="20rem"
        className="pointer-events-none absolute -right-16 top-24 -z-10 h-auto w-80 select-none opacity-[0.07] lg:hidden" />
      <div className="container-x grid min-h-[100svh] items-center gap-10 lg:min-h-[92svh] lg:gap-14 pb-16 pt-28 lg:pb-20 lg:pt-32 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="badge hero-in" style={d(0.05)}><span className="badge-dot" aria-hidden="true" />CSE Department · AITR · Indore</p>
          <HeroTitle className="mt-7 max-w-3xl">
            <span className="hero-word"><span className="hero-word-in text-grad" data-hero-grad style={i(0)}>Tech.</span></span>{" "}
            <span className="hero-word"><span className="hero-word-in text-grad" data-hero-grad style={i(1)}>Culture.</span></span>{" "}
            <span className="hero-word"><span className="hero-word-in text-accent-grad" style={i(2)}>Innovation.</span></span>
          </HeroTitle>
          <p className="hero-in mt-7 max-w-xl text-lg leading-relaxed" style={d(0.5)}>
            The official student club of the CSE Department at AITR, Indore. A place where coders, creators, performers and builders come together to learn, compete and celebrate.
          </p>
          <div className="hero-in mt-9 flex flex-col gap-3 sm:flex-row" style={d(0.62)}>
            <Link href="/events/" className="group btn btn-primary">
              Explore events <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
            </Link>
          </div>
          <HeroStats />
        </div>

        <div className="relative mx-auto w-full max-w-md max-lg:hidden max-lg:has-[#next-event]:block">
          <div aria-hidden="true" className="hero-in relative hidden lg:block" style={d(0.35)}>
            <div className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(94, 224, 208,0.28),transparent)] blur-2xl" />
            <div className="glass relative flex aspect-[5/4] items-start justify-center rounded-[2.25rem] px-10 pt-12">
              <Image src={LOGO.src} alt="" width={LOGO.width} height={LOGO.height} priority sizes="24rem" className="h-auto w-[64%] opacity-95" />
            </div>
          </div>
          <NextEvent className="hero-in relative z-10 lg:-mt-20 lg:mx-5" style={d(0.5)} />
        </div>
      </div>
    </section>
  );
}