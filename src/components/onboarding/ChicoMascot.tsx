"use client";

import React from "react";
import { motion } from "motion/react";

export type ChicoPose = "wave" | "explain" | "point" | "celebrate";

interface ChicoMascotProps {
  pose?: ChicoPose;
  className?: string;
  size?: "sm" | "md" | "lg" | "compact";
  showSpeechBubble?: boolean;
  speechText?: string;
}

export function ChicoMascot({
  pose = "wave",
  className = "",
  size = "md",
  showSpeechBubble = false,
  speechText,
}: ChicoMascotProps) {
  // Size presets adhering strictly to the 96px–112px requirement
  const sizeClasses = {
    sm: "w-20 h-20", // 80px
    compact: "w-24 h-24", // 96px (within 96-112px range)
    md: "w-28 h-28", // 112px (within 96-112px range)
    lg: "w-32 h-32", // 128px
  }[size];

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* Speech bubble indicator if requested */}
      {showSpeechBubble && speechText && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-950 shadow-md backdrop-blur-sm"
        >
          {speechText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-amber-500/90" />
        </motion.div>
      )}

      {/* Main Animated Mascot Canvas */}
      <motion.div
        animate={{
          y: [0, -3, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`${sizeClasses} relative`}
      >
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
          role="img"
          aria-label={`Chico Mendes Amazon Firefighter mascot in ${pose} pose`}
        >
          <defs>
            {/* Gradients */}
            {/* Firefighter Helmet Yellow Gradient */}
            <linearGradient id="chico-helmet-grad" x1="60" y1="6" x2="60" y2="46" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE047" /> {/* Bright Yellow */}
              <stop offset="50%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#EAB308" /> {/* Golden Amber */}
            </linearGradient>

            {/* Helmet Brim Gradient */}
            <linearGradient id="chico-brim-grad" x1="20" y1="42" x2="100" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#CA8A04" />
              <stop offset="50%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>

            {/* Fire Retardant Jacket Red-Orange Gradient */}
            <linearGradient id="chico-jacket-grad" x1="30" y1="72" x2="90" y2="116" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF6B35" /> {/* Vivid Red-Orange */}
              <stop offset="60%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#C2410C" /> {/* Deep Retardant Hue */}
            </linearGradient>

            {/* Brazilian Amazon Skin Tone Gradient */}
            <linearGradient id="chico-skin-grad" x1="60" y1="36" x2="60" y2="76" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F7C9A9" />
              <stop offset="100%" stopColor="#E7A87A" />
            </linearGradient>

            {/* High-Vis Lime Reflective Tape Gradient */}
            <linearGradient id="chico-highvis-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#84CC16" />
              <stop offset="50%" stopColor="#A3E635" />
              <stop offset="100%" stopColor="#84CC16" />
            </linearGradient>

            {/* Leaf Badge Gradient (Amazon Forest Green) */}
            <linearGradient id="chico-leaf-grad" x1="60" y1="18" x2="60" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>

            {/* Soot Smudge Mask/Filter */}
            <radialGradient id="soot-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#292524" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#44403C" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#44403C" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* BACK LAYER: Neck guard cape (black protective fire flap) */}
          <path
            d="M 38 42 C 38 42, 34 68, 36 74 C 44 77, 76 77, 84 74 C 86 68, 82 42, 82 42 Z"
            fill="#1E293B"
          />

          {/* CELEBRATION SPARKLES (Only active in celebrate pose) */}
          {pose === "celebrate" && (
            <g className="animate-pulse">
              {/* Left Star */}
              <path
                d="M 18 20 L 20 25 L 25 27 L 20 29 L 18 34 L 16 29 L 11 27 L 16 25 Z"
                fill="#FDE047"
                opacity="0.9"
              />
              {/* Right Star */}
              <path
                d="M 102 18 L 104 22 L 108 24 L 104 26 L 102 30 L 100 26 L 96 24 L 100 22 Z"
                fill="#34D399"
                opacity="0.9"
              />
              {/* Top Sparkle */}
              <circle cx="60" cy="4" r="2.5" fill="#FDE047" opacity="0.8" />
            </g>
          )}

          {/* BODY / JACKET LAYER */}
          {/* Main Retardant Jacket Torso */}
          <path
            d="M 36 72 Q 60 70 84 72 L 88 112 Q 60 116 32 112 Z"
            fill="url(#chico-jacket-grad)"
          />

          {/* High-Visibility Horizontal Safety Band (Lime & Silver Reflective) */}
          <path
            d="M 34 88 Q 60 86 86 88 L 87 95 Q 60 93 33 95 Z"
            fill="url(#chico-highvis-grad)"
          />
          <path
            d="M 34 91 Q 60 89 86 91 L 86.5 93 Q 60 91 33.5 93 Z"
            fill="#E2E8F0"
          />

          {/* Jacket Collar / Zipper Storm Flap */}
          <path
            d="M 52 71 L 52 114 M 68 71 L 68 114"
            stroke="#9A3412"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M 60 71 L 60 114"
            stroke="#7C2D12"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* HEAD & FACE LAYER */}
          <ellipse cx="60" cy="56" rx="22" ry="19" fill="url(#chico-skin-grad)" />

          {/* Friendly Rosy Cheeks */}
          <ellipse cx="45" cy="62" rx="4.5" ry="2.8" fill="#F87171" opacity="0.4" />
          <ellipse cx="75" cy="62" rx="4.5" ry="2.8" fill="#F87171" opacity="0.4" />

          {/* Soot-Smudged Cheeks (Authentic Firefighter Detail) */}
          <ellipse cx="43" cy="60" rx="5" ry="3.5" fill="url(#soot-grad)" />
          <ellipse cx="76" cy="59" rx="4.5" ry="3" fill="url(#soot-grad)" />
          <circle cx="78" cy="63" r="2.2" fill="url(#soot-grad)" />
          <circle cx="41" cy="57" r="1.8" fill="url(#soot-grad)" />

          {/* Expressive Friendly Eyes & Brows */}
          {pose === "celebrate" ? (
            /* Joyful Happy Arcs for Celebrate Pose */
            <g>
              <path
                d="M 46 54 Q 50 48 54 54"
                stroke="#1E293B"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 66 54 Q 70 48 74 54"
                stroke="#1E293B"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          ) : (
            /* Animated Blinking Big Cartoon Eyes */
            <g>
              {/* Left Eye */}
              <ellipse cx="50" cy="53" rx="4.2" ry="5.5" fill="#0F172A" />
              {/* Left Eye Specular Highlights */}
              <circle cx="48.5" cy="51" r="1.8" fill="#FFFFFF" />
              <circle cx="51.5" cy="55.5" r="0.9" fill="#FFFFFF" />

              {/* Right Eye */}
              <ellipse cx="70" cy="53" rx="4.2" ry="5.5" fill="#0F172A" />
              {/* Right Eye Specular Highlights */}
              <circle cx="68.5" cy="51" r="1.8" fill="#FFFFFF" />
              <circle cx="71.5" cy="55.5" r="0.9" fill="#FFFFFF" />

              {/* Eye Blink Overlay (SVG keyframe animation every 3.6s) */}
              <rect x="44" y="47" width="12" height="12" fill="url(#chico-skin-grad)">
                <animate
                  attributeName="height"
                  values="0;0;12;0;0"
                  keyTimes="0;0.92;0.96;0.98;1"
                  dur="3.6s"
                  repeatCount="indefinite"
                />
              </rect>
              <rect x="64" y="47" width="12" height="12" fill="url(#chico-skin-grad)">
                <animate
                  attributeName="height"
                  values="0;0;12;0;0"
                  keyTimes="0;0.92;0.96;0.98;1"
                  dur="3.6s"
                  repeatCount="indefinite"
                />
              </rect>

              {/* Friendly Eyebrows */}
              <path
                d="M 45 46 Q 50 43 55 45"
                stroke="#334155"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 65 45 Q 70 43 75 46"
                stroke="#334155"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          )}

          {/* Cute Nose */}
          <path
            d="M 58 58 Q 60 61 62 58"
            stroke="#C2410C"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />

          {/* Warm Friendly Smile */}
          {pose === "celebrate" ? (
            <path
              d="M 52 64 Q 60 74 68 64 Z"
              fill="#991B1B"
              stroke="#7F1D1D"
              strokeWidth="1.2"
            />
          ) : (
            <path
              d="M 52 64 Q 60 71 68 64"
              stroke="#431407"
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* FIREFIGHTER HELMET (Bright Yellow with Amazon Leaf Badge) */}
          {/* Main Helmet Dome */}
          <path
            d="M 33 42 C 33 16, 87 16, 87 42 C 87 43, 33 43, 33 42 Z"
            fill="url(#chico-helmet-grad)"
          />

          {/* Helmet Ridge / Center Crown Crest */}
          <path
            d="M 57 14 Q 60 10 63 14 L 62 38 Q 60 39 58 38 Z"
            fill="#FEF08A"
            stroke="#CA8A04"
            strokeWidth="1"
          />

          {/* Helmet Wide Protective Brim */}
          <path
            d="M 23 44 C 23 38, 97 38, 97 44 C 99 48, 21 48, 23 44 Z"
            fill="url(#chico-brim-grad)"
            stroke="#A16207"
            strokeWidth="1.2"
          />

          {/* Amazon Leaf Badge (Chico Mendes Tribute) */}
          {/* Badge Shield Base */}
          <path
            d="M 52 22 Q 60 18 68 22 L 67 33 Q 60 38 53 33 Z"
            fill="#1E293B"
            stroke="#FDE047"
            strokeWidth="1.2"
          />
          {/* Golden Amazon Leaf Emblem */}
          <path
            d="M 60 21 C 55 24, 55 31, 60 34 C 65 31, 65 24, 60 21 Z"
            fill="url(#chico-leaf-grad)"
          />
          {/* Leaf Central Vein */}
          <line x1="60" y1="23" x2="60" y2="33" stroke="#DCFCE7" strokeWidth="0.8" />
          <line x1="60" y1="26" x2="57.5" y2="28" stroke="#DCFCE7" strokeWidth="0.6" />
          <line x1="60" y1="28" x2="62.5" y2="30" stroke="#DCFCE7" strokeWidth="0.6" />

          {/* ARMS / GLOVES ACCORDING TO CURRENT POSE */}
          {pose === "wave" && (
            /* Waving Right Hand */
            <g>
              {/* Left resting arm */}
              <path
                d="M 33 76 L 24 94 Q 28 100 34 97 L 38 82 Z"
                fill="url(#chico-jacket-grad)"
              />
              <circle cx="28" cy="98" r="5" fill="#334155" /> {/* Left Glove */}

              {/* Right Waving Arm with CSS animation */}
              <g className="origin-[85px_76px] animate-[chico-wave_1.4s_ease-in-out_infinite]">
                <path
                  d="M 85 76 Q 98 68 104 54"
                  stroke="url(#chico-jacket-grad)"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Sleeve band */}
                <path d="M 97 60 L 103 64" stroke="#84CC16" strokeWidth="4" />
                {/* Firefighter Glove Waving Hand */}
                <ellipse cx="106" cy="50" rx="7" ry="6" fill="#334155" />
                <path
                  d="M 103 46 Q 106 42 109 46 M 106 44 Q 109 40 112 44"
                  stroke="#475569"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </g>
            </g>
          )}

          {pose === "explain" && (
            /* Explaining Hands Gesturing Open Forward */
            <g>
              {/* Left Arm Explaining */}
              <path
                d="M 34 76 Q 26 88 38 98"
                stroke="url(#chico-jacket-grad)"
                strokeWidth="11"
                strokeLinecap="round"
              />
              <circle cx="40" cy="99" r="6" fill="#334155" />
              {/* Right Arm Explaining */}
              <path
                d="M 86 76 Q 94 88 82 98"
                stroke="url(#chico-jacket-grad)"
                strokeWidth="11"
                strokeLinecap="round"
              />
              <circle cx="80" cy="99" r="6" fill="#334155" />
            </g>
          )}

          {pose === "point" && (
            /* Pointing Pose (Index Finger Pointing Right/Down Toward Tour Targets) */
            <g>
              {/* Left resting arm */}
              <path
                d="M 33 76 L 25 94 Q 29 100 35 97 L 38 82 Z"
                fill="url(#chico-jacket-grad)"
              />
              <circle cx="28" cy="98" r="5" fill="#334155" />

              {/* Right Arm Extended Pointing with subtle pulse */}
              <g className="origin-[85px_76px] animate-[chico-point_1.8s_ease-in-out_infinite]">
                <path
                  d="M 84 76 Q 96 82 106 85"
                  stroke="url(#chico-jacket-grad)"
                  strokeWidth="11"
                  strokeLinecap="round"
                />
                <circle cx="107" cy="85" r="6" fill="#334155" />
                {/* Outstretched Pointing Finger */}
                <path
                  d="M 107 85 L 117 87"
                  stroke="#334155"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </g>
            </g>
          )}

          {pose === "celebrate" && (
            /* Celebrating (Both Hands Raised in Triumph) */
            <g className="animate-[chico-celebrate_1.2s_ease-in-out_infinite]">
              {/* Left Arm Up */}
              <path
                d="M 36 74 Q 24 58 20 44"
                stroke="url(#chico-jacket-grad)"
                strokeWidth="11"
                strokeLinecap="round"
              />
              <circle cx="18" cy="42" r="6.5" fill="#334155" />
              <path d="M 16 38 L 19 43" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />

              {/* Right Arm Up */}
              <path
                d="M 84 74 Q 96 58 100 44"
                stroke="url(#chico-jacket-grad)"
                strokeWidth="11"
                strokeLinecap="round"
              />
              <circle cx="102" cy="42" r="6.5" fill="#334155" />
              <path d="M 104 38 L 101 43" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}
        </svg>
      </motion.div>
    </div>
  );
}

/**
 * Compact Chico Helmet Icon for pill buttons and mini badges
 */
export function ChicoHelmetIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Helmet dome */}
      <path
        d="M6 11C6 6.5 8.5 4 12 4C15.5 4 18 6.5 18 11H6Z"
        fill="#FACC15"
        stroke="#CA8A04"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Helmet crown crest */}
      <path d="M11 3.5H13V7H11V3.5Z" fill="#FEF08A" />
      {/* Wide Brim */}
      <path
        d="M3 12C3 10.5 21 10.5 21 12C21 13 3 13 3 12Z"
        fill="#EAB308"
        stroke="#A16207"
        strokeWidth="1"
      />
      {/* Amazon Leaf Badge */}
      <circle cx="12" cy="8" r="1.8" fill="#15803D" />
      <path d="M12 6.8C11 7.4 11 8.6 12 9C13 8.6 13 7.4 12 6.8Z" fill="#4ADE80" />
      {/* Neck guard shield */}
      <path d="M7 13L8 17C10 18 14 18 16 17L17 13" stroke="#334155" strokeWidth="1.5" />
    </svg>
  );
}
