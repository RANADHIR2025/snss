"use client";

import { cn } from "@/lib/utils";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Handshake, Sparkles } from "lucide-react";
import { BGPattern } from "@/components/ui/bg-pattern";

// Shader Background Component
const ShaderBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const vsSource = `
    attribute vec4 aVertexPosition;
    void main() {
      gl_Position = aVertexPosition;
    }
  `;

  const fsSource = `
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;

    const float overallSpeed = 0.15;
    const float gridSmoothWidth = 0.015;
    const float axisWidth = 0.05;
    const float majorLineWidth = 0.025;
    const float minorLineWidth = 0.0125;
    const float majorLineFrequency = 5.0;
    const float minorLineFrequency = 1.0;
    const vec4 gridColor = vec4(0.3);
    const float scale = 4.0;
    const vec4 lineColor = vec4(0.6, 0.8, 1.0, 0.8);
    const float minLineWidth = 0.008;
    const float maxLineWidth = 0.15;
    const float lineSpeed = 1.0 * overallSpeed;
    const float lineAmplitude = 0.8;
    const float lineFrequency = 0.15;
    const float warpSpeed = 0.15 * overallSpeed;
    const float warpFrequency = 0.4;
    const float warpAmplitude = 0.5;
    const float offsetFrequency = 0.3;
    const float offsetSpeed = 1.2 * overallSpeed;
    const float minOffsetSpread = 0.5;
    const float maxOffsetSpread = 1.5;
    const int linesPerGroup = 12;

    #define drawCircle(pos, radius, coord) smoothstep(radius + gridSmoothWidth, radius, length(coord - (pos)))
    #define drawSmoothLine(pos, halfWidth, t) smoothstep(halfWidth, 0.0, abs(pos - (t)))
    #define drawCrispLine(pos, halfWidth, t) smoothstep(halfWidth + gridSmoothWidth, halfWidth, abs(pos - (t)))
    #define drawPeriodicLine(freq, width, t) drawCrispLine(freq / 2.0, width, abs(mod(t, freq) - (freq) / 2.0))

    float drawGridLines(float axis) {
      return drawCrispLine(0.0, axisWidth, axis)
            + drawPeriodicLine(majorLineFrequency, majorLineWidth, axis)
            + drawPeriodicLine(minorLineFrequency, minorLineWidth, axis);
    }

    float drawGrid(vec2 space) {
      return min(1.0, drawGridLines(space.x) + drawGridLines(space.y));
    }

    float random(float t) {
      return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0;
    }

    float getPlasmaY(float x, float horizontalFade, float offset) {
      return random(x * lineFrequency + iTime * lineSpeed) * horizontalFade * lineAmplitude + offset;
    }

    void main() {
      vec2 fragCoord = gl_FragCoord.xy;
      vec4 fragColor;
      vec2 uv = fragCoord.xy / iResolution.xy;
      vec2 space = (fragCoord - iResolution.xy / 2.0) / iResolution.x * 2.0 * scale;

      float horizontalFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
      float verticalFade = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);

      space.y += random(space.x * warpFrequency + iTime * warpSpeed) * warpAmplitude * (0.5 + horizontalFade);
      space.x += random(space.y * warpFrequency + iTime * warpSpeed + 2.0) * warpAmplitude * horizontalFade;

      vec4 lines = vec4(0.0);
      vec4 bgColor1 = vec4(0.05, 0.05, 0.1, 1.0);
      vec4 bgColor2 = vec4(0.1, 0.1, 0.2, 1.0);

      for(int l = 0; l < linesPerGroup; l++) {
        float normalizedLineIndex = float(l) / float(linesPerGroup);
        float offsetTime = iTime * offsetSpeed;
        float offsetPosition = float(l) + space.x * offsetFrequency;
        float rand = random(offsetPosition + offsetTime) * 0.5 + 0.5;
        float halfWidth = mix(minLineWidth, maxLineWidth, rand * horizontalFade) / 2.0;
        float offset = random(offsetPosition + offsetTime * (1.0 + normalizedLineIndex)) * mix(minOffsetSpread, maxOffsetSpread, horizontalFade);
        float linePosition = getPlasmaY(space.x, horizontalFade, offset);
        float line = drawSmoothLine(linePosition, halfWidth, space.y) / 2.0 + drawCrispLine(linePosition, halfWidth * 0.15, space.y);

        float circleX = mod(float(l) + iTime * lineSpeed, 20.0) - 10.0;
        vec2 circlePosition = vec2(circleX, getPlasmaY(circleX, horizontalFade, offset));
        float circle = drawCircle(circlePosition, 0.008, space) * 3.0;

        line = line + circle;
        lines += line * lineColor * rand;
      }

      fragColor = mix(bgColor1, bgColor2, uv.x);
      fragColor *= verticalFade;
      fragColor.a = 0.7;
      fragColor += lines;

      gl_FragColor = fragColor;
    }
  `;

  const loadShader = (
    gl: WebGLRenderingContext,
    type: number,
    source: string,
  ) => {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error: ", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  const initShaderProgram = (
    gl: WebGLRenderingContext,
    vsSource: string,
    fsSource: string,
  ) => {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) {
      return null;
    }

    const shaderProgram = gl.createProgram();
    if (!shaderProgram) return null;

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error(
        "Shader program link error: ",
        gl.getProgramInfoLog(shaderProgram),
      );
      return null;
    }

    return shaderProgram;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.warn("WebGL not supported.");
      return;
    }

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    if (!shaderProgram) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      },
      uniformLocations: {
        resolution: gl.getUniformLocation(shaderProgram, "iResolution"),
        time: gl.getUniformLocation(shaderProgram, "iTime"),
      },
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    let startTime = Date.now();
    let animationFrameId: number;

    const render = () => {
      const currentTime = (Date.now() - startTime) / 1000;

      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(programInfo.program);

      gl.uniform2f(
        programInfo.uniformLocations.resolution,
        canvas.width,
        canvas.height,
      );
      gl.uniform1f(programInfo.uniformLocations.time, currentTime);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        2,
        gl.FLOAT,
        false,
        0,
        0,
      );
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full -z-10 opacity-30"
    />
  );
};

// Custom Partner Card Component - LOGO ONLY, NO BORDER BOX
function PartnerCard({ name, image }: { name: string; image: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      ref={cardRef}
      className="relative flex flex-col items-center justify-center rounded-xl transition-all duration-500 p-3 md:p-4 w-[140px] md:w-[180px] h-[80px] md:h-[100px] shrink-0 mx-1 md:mx-2 hover:scale-105 hover:shadow-2xl overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(235,245,255,0.9) 100%)",
        boxShadow: "0 4px 20px rgba(59, 130, 246, 0.15)",
      }}
    >
      {/* Animated blue-white gradient border - Only affects card border */}
      <div
        className="absolute inset-0 rounded-xl overflow-hidden"
        style={{
          background: isHovered
            ? "linear-gradient(45deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 25%, rgba(147,197,253,0.1) 50%, rgba(59,130,246,0.05) 75%, rgba(59,130,246,0.1) 100%)"
            : "linear-gradient(45deg, rgba(59,130,246,0.05) 0%, rgba(59,130,246,0.02) 50%, rgba(147,197,253,0.05) 100%)",
          transition: "all 0.5s ease",
        }}
      >
        {/* Animated shimmer effect */}
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundPosition: isHovered ? ["0% 0%", "200% 200%"] : "0% 0%",
          }}
          transition={{
            duration: isHovered ? 2 : 0,
            repeat: isHovered ? Infinity : 0,
            ease: "linear",
          }}
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
            backgroundSize: "200% 200%",
          }}
        />
      </div>

      {/* Outer glow effect on hover */}
      <div className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-70 transition-all duration-500">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 via-cyan-300/10 to-blue-400/20 animate-pulse" />
      </div>

      {/* Logo Container - LOGO ONLY, NO BOX, NO BACKGROUND */}
      <div className="relative w-full h-[40px] md:h-[60px] mb-1 flex items-center justify-center z-20">
        {/* Logo image only - no container, no background, no border */}
        <img
          src={image}
          alt={name}
          className="w-auto h-full max-w-full object-contain transition-all duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              const fallback = document.createElement("div");
              fallback.className =
                "w-full h-full flex items-center justify-center";
              fallback.innerHTML = `
                <div class="text-center px-2">
                  <div class="text-xs md:text-sm font-semibold text-gray-800">${name}</div>
                  <div class="text-[10px] text-gray-600 mt-1">Partner</div>
                </div>
              `;
              parent.appendChild(fallback);
            }
          }}
        />
      </div>

      {/* Company Name */}
      <span className="relative text-xs text-gray-800 font-medium text-center truncate w-full px-1 z-20 mt-1">
        {name}
        {/* Animated underline on hover */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:w-8 transition-all duration-300" />
      </span>

      {/* Floating blue particles effect - removed from logo area */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            animate={{
              y: [0, -10, 0],
              x: [0, Math.random() * 10 - 5, 0],
              opacity: [0, 0.4, 0],
            }}
            transition={{
              duration: 2 + Math.random(),
              repeat: Infinity,
              delay: i * 0.3,
            }}
            style={{
              width: "2px",
              height: "2px",
              background:
                "radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(147,197,253,0.3) 100%)",
              left: `${10 + i * 10}%`,
              top: `${60 + i * 4}%`, // Positioned lower to avoid logo area
              filter: "blur(0.5px)",
            }}
          />
        ))}
      </div>

      {/* Blue-white radial gradient overlay on hover - excluded from logo area */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
        style={{
          maskImage: "linear-gradient(to bottom, transparent 40%, black 60%, black 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 40%, black 60%, black 100%)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 80%, rgba(59,130,246,0.2) 0%, rgba(147,197,253,0.1) 50%, transparent 70%)",
          }}
        />
      </div>
    </div>
  );
}

// Main Partners Component
export function Partners() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true });

  // Company names with sequential image files
  const PARTNERS = [
    { name: "", image: "/comp2.png" },
    { name: "", image: "/comp5.png" },
    { name: "", image: "/comp4.png" },
    { name: "", image: "/comp8.png" },
    { name: "", image: "/comp9.png" },
    { name: "", image: "/comp10.png" },
    { name: "", image: "/comp13.png" },
    { name: "", image: "/comp15.png" },
    { name: "", image: "/comp6.png" },
    { name: "", image: "/comp1.png" },
    { name: "", image: "/comp3.png" },
  ];

  // Responsive marquee styles
  const marqueeStyles = {
    animation: "marquee 40s linear infinite",
  };

  const marqueeReverseStyles = {
    animation: "marqueeReverse 40s linear infinite",
  };

  return (
    <section
      id="partners"
      className="relative overflow-hidden py-12 md:py-20"
      ref={sectionRef}
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--background)) 0%, rgba(235, 245, 255, 0.8) 50%, hsl(var(--background)) 100%)",
      }}
    >
      {/* Blue-white gradient background */}
      <div className="absolute inset-0 -z-20 opacity-90">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, hsl(210, 100%, 99%) 0%, rgba(235, 245, 255, 0.95) 25%, rgba(255, 255, 255, 0.98) 50%, rgba(235, 245, 255, 0.95) 75%, hsl(210, 100%, 99%) 100%)",
          }}
        />
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10">
          <div
            className="w-full h-full rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(147,197,253,0.1) 50%, transparent 70%)",
              animation: "pulse-soft 8s ease-in-out infinite",
            }}
          />
        </div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-5">
          <div
            className="w-full h-full rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(147,197,253,0.2) 0%, rgba(59,130,246,0.1) 50%, transparent 70%)",
              animation: "pulse-soft 12s ease-in-out infinite 1s",
            }}
          />
        </div>
      </div>

      {/* Enhanced Dotted Pattern with blue-white gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.15) 2px, transparent 2px),
              radial-gradient(circle at 75% 75%, rgba(147, 197, 253, 0.1) 2px, transparent 2px)
            `,
            backgroundSize: "60px 60px, 80px 80px",
            opacity: "0.4",
          }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(147,197,253,0.03) 50%, rgba(59,130,246,0.05) 100%)",
          }}
        />
      </div>

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 -z-5 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(59, 130, 246, 0.15) 1px, transparent 1px),
              linear-gradient(180deg, rgba(147, 197, 253, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            maskImage:
              "radial-gradient(ellipse 80% 50% at 50% 50%, #000 30%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 50% at 50% 50%, #000 30%, transparent 70%)",
          }}
        >
          {/* Animated scan lines */}
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundPositionY: ["0px", "40px"],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              backgroundImage:
                "linear-gradient(180deg, transparent 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%)",
              backgroundSize: "100% 4px",
            }}
          />
        </div>
      </div>

      {/* Shader Background */}
      <div className="absolute inset-0 -z-15">
        <ShaderBackground />
      </div>

      {/* Enhanced blue-white gradient floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-xl"
            animate={{
              y: [0, 100, 0],
              x: [0, Math.sin(i) * 50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 15 + i * 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              width: `${100 + i * 30}px`,
              height: `${100 + i * 30}px`,
              background: `radial-gradient(circle, rgba(${59 + i * 10}, ${130 + i * 20}, 246, 0.1) 0%, rgba(${147 - i * 10}, ${197 - i * 20}, 253, 0.05) 50%, transparent 70%)`,
              left: `${10 + i * 15}%`,
              top: `${10 + i * 10}%`,
            }}
          />
        ))}
      </div>

      {/* Inline CSS for animations */}
      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes marqueeReverse {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }

        @keyframes scanline {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }

        @keyframes pulse-soft {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.2;
          }
        }

        @keyframes float-particle {
          0%,
          100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-12px) translateX(6px) scale(1.1);
            opacity: 0.5;
          }
          50% {
            transform: translateY(0) translateX(12px) scale(1);
            opacity: 0.3;
          }
          75% {
            transform: translateY(12px) translateX(6px) scale(0.9);
            opacity: 0.5;
          }
        }

        @keyframes shimmer-border {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 200% 200%;
          }
        }

        .marquee-container:hover .marquee-content {
          animation-play-state: paused !important;
        }

        @media (max-width: 768px) {
          #partners {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }

          .marquee-content {
            animation-duration: 30s !important;
          }
        }
      `}</style>

      <div className="container mx-auto px-4 relative z-10">
        {/* Animated Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-10 md:mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-full backdrop-blur-sm border mb-6 md:mb-8 hover:shadow-lg transition-all duration-300 hover:scale-105 relative overflow-hidden group"
            style={{
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(235,245,255,0.95) 100%)",
              borderColor: "rgba(59, 130, 246, 0.3)",
            }}
          >
            {/* Blue gradient background on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background:
                  "linear-gradient(45deg, rgba(59,130,246,0.1) 0%, rgba(147,197,253,0.05) 100%)",
              }}
            />
            <Handshake className="w-4 h-4 md:w-5 md:h-5 text-blue-600 relative z-10" />
            <span className="text-sm md:text-base font-medium text-gray-800 relative z-10">
              Our Trusted Partners
            </span>
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-blue-400 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6">
            Trusted by{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500">
              Industry Leaders
            </span>
          </h2>
          <p className="text-gray-700 text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
            We collaborate with the world's most innovative companies to deliver
            exceptional results.
          </p>
        </motion.div>

        {/* Marquee Containers with blue-white gradient backgrounds */}
        <div className="space-y-6 md:space-y-8">
          {/* Second Marquee (Reverse) */}
          <div
            className="relative w-full overflow-hidden py-4 md:py-6 rounded-2xl backdrop-blur-sm"
            style={{
              background:
                "linear-gradient(90deg, rgba(255, 255, 255, 0.8) 0%, rgba(235, 245, 255, 0.6) 50%, rgba(255, 255, 255, 0.8) 100%)",
              border: "1px solid rgba(59, 130, 246, 0.15)",
            }}
          >
            {/* Gradient edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-cyan-50/60 to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-cyan-50/60 to-transparent z-10" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex whitespace-nowrap marquee-content"
              style={marqueeReverseStyles}
            >
              {[...PARTNERS, ...PARTNERS].map((partner, index) => (
                <PartnerCard
                  key={`second-${index}`}
                  name={partner.name}
                  image={partner.image}
                />
              ))}
            </motion.div>
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12 md:mt-16"
        >
          <div
            className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg relative overflow-hidden group cursor-pointer"
            style={{
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(235,245,255,0.98) 100%)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background:
                  "linear-gradient(45deg, rgba(59,130,246,0.15) 0%, rgba(147,197,253,0.1) 50%, rgba(59,130,246,0.15) 100%)",
                animation: "shimmer-border 3s linear infinite",
                backgroundSize: "200% 200%",
              }}
            />
            <span className="text-gray-800 font-medium text-sm md:text-base relative z-10">
              Want to become a partner?
            </span>
            <div className="w-6 h-px bg-gradient-to-r from-blue-400 to-cyan-400 relative z-10 group-hover:w-8 transition-all duration-300" />
            <div className="text-blue-600 font-semibold text-sm md:text-base relative z-10">
              Contact us
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}