"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Sun, Moon } from "lucide";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { cn } from "@/lib/utils";

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number;
}

export const AnimatedThemeToggler = ({
  className,
  duration = 700,
  ...props
}: AnimatedThemeTogglerProps) => {
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return;

    // @ts-ignore
    if (!document.startViewTransition) {
      const newTheme = !isDark;
      setIsDark(newTheme);
      if (newTheme) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", newTheme ? "dark" : "light");
      return;
    }

    // @ts-ignore
    await document.startViewTransition(() => {
      flushSync(() => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        if (newTheme) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", newTheme ? "dark" : "light");
      });
    }).ready;

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top),
    );

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  }, [isDark, duration]);

  return (
    <button
      id="theme-toggler-btn"
      ref={buttonRef}
      onClick={toggleTheme}
      aria-label="Cambiar tema"
      className={cn(
        "group flex items-center justify-center cursor-pointer transition-all active:scale-95 relative z-50",
        className,
      )}
      {...props}
    >
      <div className="relative size-7 transition-transform duration-500 ease-out group-hover:scale-125 group-hover:-rotate-90">
        <MorphHoverIcon
          from={isDark ? Moon : Sun}
          to={isDark ? Sun : Moon}
          size={28}
          color="#facc15"
          strokeWidth={2}
          spring="snappy"
        />
      </div>
    </button>
  );
};
