"use client";

import * as React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Mail,
  Phone,
  Headphones,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as d3 from "d3";
import { feature } from "topojson-client";
import type {
  Topology,
  GeometryCollection,
  GeometryObject,
} from "topojson-specification";
import type { GeoPermissibleObjects } from "d3";

const smoothEase = [0.25, 0.1, 0.25, 1] as const;

const CONTACT_LINKS = [
  {
    icon: Mail,
    label: "support@skillflowlearn.com",
    href: "mailto:support@skillflowlearn.com",
  },
  {
    icon: Phone,
    label: "+91 6364656848",
    href: "tel:6364656848",
  },
  {
    icon: Headphones,
    label: "WhatsApp: 6364656848",
    href: "https://wa.me/916364656848",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface GlobeWireframeProps {
  width?: number;
  height?: number;
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
  graticuleColor?: string;
  graticuleOpacity?: number;
  sphereOutlineColor?: string;
  sphereOutlineWidth?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  rotateCities?: string[];
  rotationSpeed?: number;
  initialRotation?: [number, number];
  enableInteraction?: boolean;
  showGraticule?: boolean;
  variant?: "wireframe" | "wireframesolid" | "solid";
  scale?: number;
  countryFillColor?: string;
  countryHoverColor?: string;
  backgroundColor?: string;
}

interface GeoFeature {
  type: string;
  geometry: GeometryObject;
  properties: Record<string, unknown>;
}

interface WorldAtlasTopology extends Topology {
  objects: { countries: GeometryCollection };
}

const cityCoordinates: Record<string, [number, number]> = {
  "new delhi": [28.6139, 77.209],
  mumbai: [19.076, 72.8777],
  bangalore: [12.9716, 77.5946],
  dubai: [25.2048, 55.2708],
  singapore: [1.3521, 103.8198],
  london: [51.5074, -0.1278],
  "new york": [40.7128, -74.006],
  tokyo: [35.6762, 139.6503],
  sydney: [-33.8688, 151.2093],
};

// ─── Globe Component ──────────────────────────────────────────────────────────
function GlobeWireframe({
  width,
  height,
  className = "aspect-square w-full",
  strokeColor = "currentColor",
  strokeWidth = 0.6,
  graticuleColor = "currentColor",
  graticuleOpacity = 0.12,
  sphereOutlineColor = "currentColor",
  sphereOutlineWidth = 1.5,
  autoRotate = true,
  autoRotateSpeed = 0.45,
  rotateCities = [],
  rotationSpeed = 3000,
  initialRotation = [0, 0],
  enableInteraction = true,
  showGraticule = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  variant: _variant = "wireframesolid",
  scale = 1,
  backgroundColor,
}: GlobeWireframeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [worldData, setWorldData] = useState<GeoFeature[]>([]);
  const [rotation, setRotation] = useState<[number, number]>(initialRotation);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState([0, 0]);
  const [isVisible, setIsVisible] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [currentCityIndex, setCurrentCityIndex] = useState(0);
  const animationFrame = useRef<number | null>(null);
  const rotationAnimFrame = useRef<number | null>(null);
  const rotationStartTime = useRef<number | null>(null);
  const rotationFrom = useRef<[number, number]>([0, 0]);
  const rotationTo = useRef<[number, number]>([0, 0]);
  const rotationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const rotationRef = useRef(rotation);

  useEffect(() => { rotationRef.current = rotation; }, [rotation]);

  const useResponsive = !width && !height;
  const finalWidth = useResponsive ? dimensions.width : width || 500;
  const finalHeight = useResponsive ? dimensions.height : height || 500;
  const defaultBg = backgroundColor || "transparent";

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const updateSize = () => {
      if (useResponsive) {
        const w = el.offsetWidth || 300;
        setDimensions({ width: w, height: w });
      }
    };
    updateSize();

    if (useResponsive) {
      resizeObserver.current = new ResizeObserver(updateSize);
      resizeObserver.current.observe(el);
    }

    const io = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    io.observe(el);

    return () => {
      resizeObserver.current?.disconnect();
      io.unobserve(el);
    };
  }, [useResponsive]);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((world: WorldAtlasTopology) => {
        setWorldData(feature(world, world.objects.countries).features as GeoFeature[]);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!autoRotate || !isVisible || isDragging || rotateCities.length > 0) {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      return;
    }
    const rotate = () => {
      setRotation((p) => [(p[0] + autoRotateSpeed) % 360, p[1]]);
      animationFrame.current = requestAnimationFrame(rotate);
    };
    animationFrame.current = requestAnimationFrame(rotate);
    return () => { if (animationFrame.current) cancelAnimationFrame(animationFrame.current); };
  }, [autoRotate, autoRotateSpeed, isVisible, isDragging, rotateCities.length]);

  const animateRotationTo = useCallback((target: [number, number], duration = 1200) => {
    if (rotationAnimFrame.current) cancelAnimationFrame(rotationAnimFrame.current);
    rotationFrom.current = rotationRef.current;
    rotationTo.current = target;
    rotationStartTime.current = performance.now();
    const animate = (time: number) => {
      const t = Math.min((time - (rotationStartTime.current || 0)) / duration, 1);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setRotation([
        rotationFrom.current[0] + (rotationTo.current[0] - rotationFrom.current[0]) * e,
        rotationFrom.current[1] + (rotationTo.current[1] - rotationFrom.current[1]) * e,
      ]);
      if (t < 1) rotationAnimFrame.current = requestAnimationFrame(animate);
    };
    rotationAnimFrame.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!rotateCities.length || !isVisible) return;
    const go = (idx: number) => {
      const coords = cityCoordinates[rotateCities[idx].toLowerCase()];
      if (coords) animateRotationTo([-coords[1], -coords[0]], rotationSpeed * 0.6);
    };
    go(currentCityIndex);
    rotationInterval.current = setInterval(() => {
      setCurrentCityIndex((i) => {
        const next = (i + 1) % rotateCities.length;
        go(next);
        return next;
      });
    }, rotationSpeed);
    return () => { if (rotationInterval.current) clearInterval(rotationInterval.current); };
  }, [rotateCities, isVisible, rotationSpeed, animateRotationTo]);

  // Mouse / touch handlers
  const startDrag = (x: number, y: number) => {
    if (!enableInteraction) return;
    setIsDragging(true);
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) setLastMouse([x - rect.left, y - rect.top]);
  };
  const moveDrag = (x: number, y: number) => {
    if (!isDragging || !enableInteraction) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = (x - rect.left) - lastMouse[0];
    const dy = (y - rect.top) - lastMouse[1];
    setRotation((p) => [p[0] + dx * 0.4, Math.max(-90, Math.min(90, p[1] - dy * 0.4))]);
    setLastMouse([x - rect.left, y - rect.top]);
  };
  const endDrag = () => setIsDragging(false);

  // Render globe via D3
  useEffect(() => {
    if (!svgRef.current || !worldData.length || !isVisible) return;
    if (useResponsive && !dimensions.width) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (defaultBg !== "transparent") {
      const r = (Math.min(finalWidth, finalHeight) / 2) * scale * 0.9;
      svg.append("circle").attr("cx", finalWidth / 2).attr("cy", finalHeight / 2).attr("r", r).attr("fill", defaultBg);
    }

    const projection = d3
      .geoOrthographic()
      .scale((Math.min(finalWidth, finalHeight) / 2) * scale * 0.9)
      .translate([finalWidth / 2, finalHeight / 2])
      .rotate([rotation[0], rotation[1]])
      .precision(0.1);
    const path = d3.geoPath().projection(projection);

    if (showGraticule && graticuleOpacity > 0) {
      const g = d3.geoGraticule();
      const gp = path(g());
      if (gp) svg.append("path").datum(g()).attr("d", gp).attr("fill", "none").attr("stroke", graticuleColor).attr("stroke-width", 1).attr("opacity", graticuleOpacity);
    }

    svg.selectAll(".country")
      .data(worldData)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", (d) => {
        try {
          const ps = path(d as unknown as GeoPermissibleObjects);
          if (!ps || ps.includes("NaN") || ps.includes("Infinity")) return "";
          return ps;
        } catch { return ""; }
      })
      .attr("fill", "none")
      .attr("stroke", strokeColor)
      .attr("stroke-width", strokeWidth)
      .style("visibility", function (this: SVGPathElement) {
        const pd = d3.select(this).attr("d");
        return pd && pd.length > 0 && !pd.includes("NaN") ? "visible" : "hidden";
      });

    const sp = path({ type: "Sphere" });
    if (sp) {
      svg.append("path").datum({ type: "Sphere" }).attr("d", sp).attr("fill", "none").attr("stroke", sphereOutlineColor).attr("stroke-width", sphereOutlineWidth).attr("opacity", 0.8);
    }
  }, [worldData, rotation, isVisible, finalWidth, finalHeight, strokeColor, strokeWidth, graticuleColor, graticuleOpacity, sphereOutlineColor, sphereOutlineWidth, showGraticule, scale, defaultBg, useResponsive, dimensions.width]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={finalWidth}
        height={finalHeight}
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={(e) => { if (e.touches[0]) startDrag(e.touches[0].clientX, e.touches[0].clientY); }}
        onTouchMove={(e) => { if (e.touches[0]) moveDrag(e.touches[0].clientX, e.touches[0].clientY); }}
        onTouchEnd={endDrag}
        className={useResponsive ? "w-full h-full transition-opacity duration-1000" : ""}
        style={{
          cursor: enableInteraction ? (isDragging ? "grabbing" : "grab") : "default",
          opacity: useResponsive ? (dimensions.width > 0 ? 1 : 0) : 1,
        }}
      />
    </div>
  );
}

// ─── Dot Separator ────────────────────────────────────────────────────────────
const FormDots = React.forwardRef<
  React.ComponentRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => {
  const isH = orientation === "horizontal";
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn("shrink-0 flex items-center justify-center overflow-hidden", isH ? "w-full" : "h-full", className)}
      {...props}
    >
      <div className={cn("relative", isH ? "w-full h-4" : "h-full w-4")}>
        <div
          className="absolute inset-0 bg-repeat text-zinc-600"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 0.8px, transparent 0.8px)",
            backgroundSize: isH ? "6px 100%" : "100% 6px",
            maskImage: isH
              ? "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)"
              : "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
          }}
        />
      </div>
    </SeparatorPrimitive.Root>
  );
});
FormDots.displayName = "FormDots";

// ─── Main Contact Component ───────────────────────────────────────────────────
interface ContactWithGlobeProps {
  title?: string;
  subtitle?: string;
  description?: string;
  className?: string;
  onBack?: () => void;
  isFullPage?: boolean;
}

export default function ContactWithGlobe({
  title = "Contact us",
  subtitle = "SkillFlow Learning",
  description = "We are always here to help. Reach out with any questions about courses, certifications, or registrations.",
  className,
  onBack,
}: ContactWithGlobeProps) {
  const [formData, setFormData] = useState({
    name: "",
    contactNo: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch("https://formsubmit.co/ajax/support@skillflowlearn.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          NAME: formData.name,
          "Contact No": formData.contactNo,
          "Mail ID": formData.email,
          Message: formData.message || "—",
          _subject: `New Lead: ${formData.name} — SkillFlow Contact`,
          _template: "table",
          _captcha: "false",
        }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  // Shared dark input class matching the reference screenshot
  const inputCls =
    "w-full bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 transition-all duration-200";

  return (
    <section
      className={cn(
        "relative w-full min-h-screen bg-zinc-950 text-white overflow-x-hidden py-10 sm:py-16 px-4 sm:px-6 lg:px-8",
        className,
      )}
    >
      {/* Subtle top glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-700/8 blur-[140px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-7xl">

        {/* Back button */}
        {onBack && (
          <div className="mb-8 sm:mb-10">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/60 border border-zinc-700 hover:bg-zinc-700/60 hover:border-zinc-600 text-sm font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        )}

        {/* Heading */}
        <div className="flex flex-col items-center text-center gap-3 sm:gap-4 mb-10 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: smoothEase }}
            className="inline-flex items-center px-4 py-1.5 rounded-full bg-zinc-800 border border-zinc-700"
          >
            <span className="text-xs sm:text-sm text-zinc-300 font-medium">{subtitle}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.15, ease: smoothEase }}
            className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white"
          >
            {title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.3, ease: smoothEase }}
            className="text-sm sm:text-base text-zinc-400 max-w-md leading-relaxed"
          >
            {description}
          </motion.p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 max-w-5xl mx-auto items-start">

          {/* ── Left: Get in touch + Globe ── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, delay: 0.2, ease: smoothEase }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-semibold text-white">Get in touch</h3>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
                Reach out via any channel below. We typically reply within one business day.
              </p>
            </div>

            {/* Contact links */}
            <div className="flex flex-col gap-3">
              {CONTACT_LINKS.map(({ icon: Icon, label, href }, i) => (
                <motion.a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease: smoothEase }}
                  className="group flex items-center gap-3 w-fit text-sm text-zinc-400 hover:text-white transition-colors duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700 group-hover:border-zinc-500 group-hover:bg-zinc-700/60 flex items-center justify-center shrink-0 transition-all duration-200">
                    <Icon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors duration-200" />
                  </div>
                  {label}
                </motion.a>
              ))}
            </div>

            {/* Globe */}
            <div className="relative overflow-hidden h-52 sm:h-64">
              <GlobeWireframe
                className="w-full aspect-square max-w-full absolute top-0 left-0"
                variant="wireframesolid"
                strokeColor="rgba(255,255,255,0.7)"
                sphereOutlineColor="rgba(255,255,255,0.4)"
                autoRotate
                autoRotateSpeed={0.45}
                strokeWidth={0.6}
                showGraticule={false}
                rotateCities={["new delhi", "mumbai", "dubai", "singapore", "london", "new york", "tokyo"]}
                rotationSpeed={3000}
              />
              {/* Fade-out gradient at bottom */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-zinc-950 to-transparent" />
            </div>
          </motion.div>

          {/* ── Right: Contact Form ── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, delay: 0.35, ease: smoothEase }}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 flex flex-col gap-5"
          >
            {isSubmitted ? (
              /* ── Success ── */
              <div className="text-center py-8 space-y-5">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-zinc-400 text-sm max-w-sm mx-auto">
                    Thanks, <span className="font-semibold text-white">{formData.name}</span>. We've received your
                    details at{" "}
                    <span className="text-zinc-300">support@skillflowlearn.com</span>.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-zinc-800 border border-zinc-700 space-y-2">
                  <p className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
                    Any doubt? Contact this no:
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="w-5 h-5 text-emerald-400 animate-pulse" />
                    <a
                      href="tel:6364656848"
                      className="text-2xl sm:text-3xl font-extrabold text-white hover:text-zinc-300 transition-colors"
                    >
                      6364656848
                    </a>
                  </div>
                  <p className="text-xs text-zinc-500">Available on Call &amp; WhatsApp</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="tel:6364656848"
                    className="flex-1 py-3 rounded-xl font-semibold bg-zinc-700 hover:bg-zinc-600 text-white transition-colors text-sm text-center"
                  >
                    Call Now
                  </a>
                  <a
                    href="https://wa.me/916364656848"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-xl font-semibold bg-zinc-700 hover:bg-zinc-600 text-white transition-colors text-sm text-center"
                  >
                    WhatsApp
                  </a>
                  {onBack && (
                    <button
                      onClick={onBack}
                      className="flex-1 py-3 rounded-xl font-semibold bg-white text-zinc-900 hover:bg-zinc-100 transition-colors text-sm cursor-pointer"
                    >
                      Done
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* ── Form ── */
              <>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-0.5">Send a message</h3>
                  <p className="text-sm text-zinc-500">
                    Fill out the form and we'll get back to you promptly.
                  </p>
                </div>

                <FormDots />

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Name + Contact No */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold tracking-widest uppercase text-zinc-500">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder=""
                        className={inputCls}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold tracking-widest uppercase text-zinc-500">
                        Contact No <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="contactNo"
                        required
                        pattern="[0-9]{10}"
                        title="Enter a valid 10-digit number"
                        value={formData.contactNo}
                        onChange={handleChange}
                        placeholder=""
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Mail ID */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold tracking-widest uppercase text-zinc-500">
                      Mail ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder=""
                      className={inputCls}
                    />
                  </div>

                  {/* Message */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold tracking-widest uppercase text-zinc-500">
                      Message
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder=""
                      className={cn(inputCls, "resize-none")}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-fit h-11 px-8 rounded-xl font-semibold text-sm bg-white hover:bg-zinc-100 text-zinc-900 group cursor-pointer transition-all duration-200 shadow-lg disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Submit
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </span>
                    )}
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
