import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ReactNode, useRef } from "react";

gsap.registerPlugin(useGSAP);

export function PageReveal({ routeKey, children }: { routeKey: string; children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!container.current) return;
      const elements = Array.from(container.current.children);
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline();
        timeline.fromTo(
          elements,
          { autoAlpha: 0, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.58,
            stagger: 0.065,
            ease: "power3.out",
            clearProps: "opacity,visibility,transform",
          },
        );
        timeline.fromTo(
          "[data-motion-card]",
          { scale: 0.985, transformOrigin: "50% 100%" },
          {
            scale: 1,
            duration: 0.34,
            stagger: 0.035,
            ease: "power2.out",
            clearProps: "transform",
          },
          0.08,
        );
      });

      return () => media.revert();
    },
    { scope: container, dependencies: [routeKey], revertOnUpdate: true },
  );

  return (
    <div ref={container} className="mx-auto w-full max-w-[1600px]">
      {children}
    </div>
  );
}
