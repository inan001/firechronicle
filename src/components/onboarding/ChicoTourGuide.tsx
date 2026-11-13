"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Send,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { ChicoMascot, ChicoHelmetIcon, type ChicoPose } from "./ChicoMascot";
import { Button } from "@/components/ui/button";
import { useSelection } from "@/store/selection-store";

export interface TourStep {
  id: number;
  title: string;
  body: string;
  pose: ChicoPose;
  target?: string; // CSS selector e.g. '[data-tour="map-canvas"]'
  badge?: string;
}

export const CHICO_TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    title: "Oi! I'm Chico, your Pará Fire Watch Guide!",
    body: "Welcome to **FireChronicle** — an interactive satellite observatory tracking 19 years of wildfire activity across **Pará, Brazil (2002–2020)** on a 50 km spatial grid.",
    pose: "wave",
    badge: "Welcome",
  },
  {
    id: 2,
    title: "The Sensor Gap Problem",
    body: "Modern **VIIRS** satellites detect small understory fires with sharp 375 m resolution, but they only launched in **2012**. Before 2012, only coarser 1 km **MODIS** observations existed — creating a 10-year blind spot when comparing long-term fire trends.",
    pose: "explain",
    badge: "The Challenge",
  },
  {
    id: 3,
    title: "Cross-Sensor Harmonization (NB2 v1.0)",
    body: "Using 9 years of overlapping MODIS + VIIRS observations (2012–2020), our **Negative Binomial (NB2)** statistical model reconstructs VIIRS-equivalent fire activity back to **July 2002** across all 568 Pará grid blocks — while keeping estimated (`2002–2011`) and observed (`2012–2020`) eras strictly labeled.",
    pose: "explain",
    badge: "The Solution",
  },
  {
    id: 4,
    title: "Explore the 50 km Pará Grid",
    body: "Pan, zoom, and hover over any of the **568 canonical 50 km blocks** inside Pará to inspect localized fire intensity, hotspot counts, and satellite coverage status.",
    pose: "point",
    target: '[data-tour="map-canvas"]',
    badge: "Spatial Grid",
  },
  {
    id: 5,
    title: "Travel from 2002 to 2020",
    body: "Scrub across **222 months**. Months from **2002-07 to 2011-12** display NB2 model estimates, while **2012-01 to 2020-12** display direct satellite observations (with `NULL` preserved whenever satellite coverage is missing).",
    pose: "point",
    target: '[data-tour="timeline-controls"]',
    badge: "Time Machine",
  },
  {
    id: 6,
    title: "Filter Day vs. Night Detections",
    body: "Toggle between **All**, **Daytime (D)**, and **Nighttime (N)** passes to separate agricultural daytime burns from persistent overnight fires.",
    pose: "point",
    target: '[data-tour="filter-controls"]',
    badge: "Sensors & Passes",
  },
  {
    id: 7,
    title: "Inspect Trends & Calibration Metrics",
    body: "Check the time-series charts and Sensor Lab metrics to compare model accuracy against ground-truth observations. Click **Start Exploring** to jump in!",
    pose: "celebrate",
    target: '[data-tour="analytics-panel"]',
    badge: "Analytics & Metrics",
  },
];

const STORAGE_KEY = "firechronicle_tour_completed";

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export function ChicoTourGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);

  // Chat Q&A state
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content:
        "Oi! I'm Chico! Ask me anything about the 2002–2020 satellite fire records, our 568 Pará grid blocks, MODIS vs. VIIRS, or why missing coverage stays NULL!",
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Current selections for context-aware Q&A
  const year = useSelection((s) => s.year);
  const month = useSelection((s) => s.month);
  const activeLayer = useSelection((s) => s.activeLayer);
  const block_id = useSelection((s) => s.block_id);

  const currentStep = CHICO_TOUR_STEPS[currentStepIndex];

  // Callbacks declared before effects
  const handleComplete = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore storage errors
    }
    setIsOpen(false);
  }, []);

  const handleSkip = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore storage errors
    }
    setIsOpen(false);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStepIndex < CHICO_TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStepIndex, handleComplete]);

  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  // Auto-open on initial user visit
  useEffect(() => {
    try {
      const completed = localStorage.getItem(STORAGE_KEY);
      if (!completed) {
        // Small initial delay so UI elements mount properly
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 650);
        return () => clearTimeout(timer);
      }
    } catch {
      // Gracefully ignore local storage restrictions
    }
  }, []);

  // Update spotlight bounding box
  const updateTargetRect = useCallback(() => {
    if (!isOpen || !currentStep?.target) {
      setTargetRect(null);
      return;
    }

    try {
      const el = document.querySelector(currentStep.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Check if element has usable dimensions
        if (rect.width > 20 && rect.height > 20) {
          // Add comfortable padding around highlighted element
          const padding = 8;
          setTargetRect({
            top: Math.max(0, rect.top - padding),
            left: Math.max(0, rect.left - padding),
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
            bottom: rect.bottom + padding,
            right: rect.right + padding,
          });

          // Smoothly scroll target into view if outside viewport
          if (rect.top < 60 || rect.bottom > window.innerHeight) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          return;
        }
      }
      setTargetRect(null);
    } catch {
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    const handleResize = () => updateTargetRect();
    const rafId = requestAnimationFrame(() => {
      updateTargetRect();
    });
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [updateTargetRect]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleSkip();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleBack, handleNext, handleSkip]);

  const startTour = () => {
    setShowChatModal(false);
    setCurrentStepIndex(0);
    setIsOpen(true);
  };

  // Helper to render markdown bold and inline code in tour body
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-emerald-300">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="rounded bg-muted/80 px-1 py-0.5 font-mono text-[11px] text-amber-300"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Interactive Q&A submission
  const handleSendQuestion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputQuestion.trim();
    if (!query || isAsking) return;

    setInputQuestion("");
    const newHistory = [...messages, { role: "user" as const, content: query }];
    setMessages(newHistory);
    setIsAsking(true);

    try {
      const res = await fetch("/api/chico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: newHistory,
          context: { year, month, activeLayer, block_id },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant" as const, content: data.reply ?? "I'm checking our satellite records!" },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant" as const,
            content:
              "Oi! I couldn't reach the server right now, but remember: in Pará (2002–2020), 2002–2011 are NB2 estimates from Aqua MODIS, and 2012–2020 are direct S-NPP VIIRS observations, with NULL preserved for unobserved passes!",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content:
            "Oi! I had a little hiccup connecting, but I'm right here to guide your Pará fire watch!",
        },
      ]);
    } finally {
      setIsAsking(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  // 2. RE-OPEN TRIGGER: FLOATING "ASK CHICO" PILL BUTTON (Bottom-Right)
  const floatingAskChicoPill = (
    <aside aria-label="FireChronicle Onboarding & Chico Assistant">
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 select-none pointer-events-auto">
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <Button
            onClick={() => setShowChatModal(true)}
            aria-label="Open Chico Fire Watch Guide and Assistant"
            className="h-11 rounded-full border border-amber-500/40 bg-card/95 px-4 py-2 text-xs font-medium text-foreground shadow-xl backdrop-blur-md transition-all hover:border-amber-400 hover:bg-card hover:shadow-amber-500/10 flex items-center gap-2.5"
          >
            <div className="relative flex size-6 shrink-0 items-center justify-center">
              <ChicoHelmetIcon className="size-5.5 text-amber-400" />
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>
            <span className="font-semibold tracking-tight text-amber-400">Ask Chico</span>
            <span className="hidden sm:inline text-[11px] text-muted-foreground">
              • Pará Guide
            </span>
          </Button>
        </motion.div>
      </div>
    </aside>
  );

  // 3. INTERACTIVE "ASK CHICO" Q&A & TOUR MODAL
  const interactiveChatModal = (
    <AnimatePresence>
      {showChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-xs"
            onClick={() => setShowChatModal(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl flex flex-col h-[520px] max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10">
                  <ChicoHelmetIcon className="size-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    Chico
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-mono text-emerald-400">
                      Fire Watch Guide
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Pará, Brazil (BR-PA) • 2002–2020 Observatory
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startTour}
                  className="h-8 gap-1.5 text-xs text-primary hover:text-primary"
                  title="Replay the 7-step guided walkthrough"
                >
                  <RefreshCw className="size-3.5" />
                  Replay Tour
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowChatModal(false)}
                  className="size-8"
                  aria-label="Close dialogue"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Chat Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs leading-relaxed">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="size-7 shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 flex items-center justify-center">
                      <ChicoHelmetIcon className="size-4.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "border border-border/80 bg-muted/40 text-foreground"
                    }`}
                  >
                    {renderFormattedText(m.content)}
                  </div>
                </div>
              ))}
              {isAsking && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs py-2 pl-9">
                  <Loader2 className="size-3.5 animate-spin text-amber-400" />
                  Chico is consulting the Pará satellite records...
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick suggestion pills */}
            <div className="px-3 py-2 border-t border-border/50 bg-background/50 flex flex-wrap gap-1.5">
              {[
                "Why do missing passes stay NULL?",
                "How does the NB2 model work?",
                "Tell me about MODIS vs. VIIRS",
                "Why are there 568 blocks?",
              ].map((promptText) => (
                <button
                  key={promptText}
                  onClick={() => {
                    setInputQuestion(promptText);
                  }}
                  className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                >
                  {promptText}
                </button>
              ))}
            </div>

            {/* Chat input box */}
            <form
              onSubmit={handleSendQuestion}
              className="flex items-center gap-2 border-t border-border p-3 bg-card"
            >
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Ask Chico a question about the data..."
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-ring"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!inputQuestion.trim() || isAsking}
                className="h-8 gap-1.5 px-3 text-xs"
              >
                <Send className="size-3" />
                Ask
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // 1. When the tour is closed or skipped (!isOpen), return null for the tour overlay,
  // rendering ONLY the floating bottom-right "Ask Chico" pill button (and chat modal if open)
  // so zero full-screen overlay elements remain in the DOM.
  if (!isOpen) {
    return (
      <>
        {floatingAskChicoPill}
        {interactiveChatModal}
      </>
    );
  }

  // 2. When the tour IS open, set pointer-events-none on the outer full-screen SVG spotlight backdrop
  // and pointer-events-auto only on the Chico dialogue card itself so the underlying map and controls are never locked.
  return (
    <>
      {/* 1. TOUR OVERLAY & SPOTLIGHT CUTOUT */}
      <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
        {/* Spotlight backdrop with pointer-events-none */}
        {targetRect ? (
          /* SVG Mask Cutout with soft glow and dimmed backdrop */
          <svg className="absolute inset-0 h-full w-full pointer-events-none transition-all duration-300">
            <defs>
              <mask id="chico-spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect
                  x={targetRect.left}
                  y={targetRect.top}
                  width={targetRect.width}
                  height={targetRect.height}
                  rx="16"
                  ry="16"
                  fill="black"
                />
              </mask>
              <linearGradient id="chico-ring-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
            {/* Dark semi-transparent backdrop using the cutout mask */}
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(4, 10, 16, 0.76)"
              mask="url(#chico-spotlight-mask)"
            />
            {/* Glowing boundary ring around target element */}
            <rect
              x={targetRect.left}
              y={targetRect.top}
              width={targetRect.width}
              height={targetRect.height}
              rx="16"
              ry="16"
              fill="none"
              stroke="url(#chico-ring-glow)"
              strokeWidth="2.5"
              className="animate-pulse"
            />
          </svg>
        ) : (
          /* Centered soft backdrop for intro steps 1, 2, 3 or missing targets */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-xs transition-opacity pointer-events-none"
          />
        )}

        {/* TOUR DIALOG CARD - pointer-events-none on wrapper, pointer-events-auto ONLY on dialogue card */}
        <div
          className={`absolute inset-0 flex p-4 pointer-events-none ${
            targetRect
              ? "items-end justify-center pb-8 sm:items-center sm:justify-center"
              : "items-center justify-center"
          }`}
        >
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative pointer-events-auto w-full max-w-lg rounded-2xl border border-border/80 bg-card/98 p-6 shadow-2xl backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chico-tour-title"
          >
            {/* DOCKED CHICO MASCOT (Compact 96-112px tall, neatly docked at top-left) */}
            <div className="absolute -top-14 -left-3 sm:-top-16 sm:-left-6 z-10 pointer-events-none drop-shadow-xl">
              <ChicoMascot pose={currentStep.pose} size="md" />
            </div>

            {/* Top header line: Step badge & skip button */}
            <div className="flex items-center justify-between pl-20 sm:pl-22 mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                  {currentStep.badge}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  Step {currentStep.id} of {CHICO_TOUR_STEPS.length}
                </span>
              </div>

              <button
                onClick={handleSkip}
                aria-label="Skip onboarding tour"
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Title & Body */}
            <div className="space-y-2.5 pt-1 pl-2">
              <h3
                id="chico-tour-title"
                className="text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-center gap-2"
              >
                {currentStep.title}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                {renderFormattedText(currentStep.body)}
              </p>
            </div>

            {/* Progress Dots Indicator */}
            <div className="mt-5 flex items-center justify-center gap-1.5 py-1">
              {CHICO_TOUR_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  aria-label={`Go to step ${s.id}`}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? "w-6 bg-primary"
                      : idx < currentStepIndex
                      ? "w-2 bg-primary/40"
                      : "w-1.5 bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Bottom Controls */}
            <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className="h-9 gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
                Back
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="h-9 text-xs text-muted-foreground hover:text-foreground"
                >
                  Skip Tour
                </Button>

                <Button
                  size="sm"
                  onClick={handleNext}
                  className="h-9 gap-1.5 px-4 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                >
                  {currentStepIndex === CHICO_TOUR_STEPS.length - 1 ? (
                    <>
                      Start Exploring
                      <Sparkles className="size-3.5" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Keyboard hints */}
            <div className="mt-3 text-center text-[10px] text-muted-foreground/60 font-mono hidden sm:block">
              [Arrow keys: navigate • Enter: continue • Esc: skip]
            </div>
          </motion.div>
        </div>
      </div>

      {floatingAskChicoPill}
      {interactiveChatModal}
    </>
  );
}
