import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Sparkles, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Send, 
  Image, 
  Download, 
  Sliders, 
  Maximize2, 
  X, 
  Menu, 
  Check, 
  ArrowUpRight, 
  Loader2, 
  Flame, 
  Brain, 
  Activity, 
  Dumbbell, 
  Zap, 
  RotateCcw,
  User,
  Star,
  Compass,
  ChevronRight,
  Sparkle
} from "lucide-react";

// Types
interface Message {
  role: "user" | "assistant";
  content: string;
  isThinking?: boolean;
}

interface WorkoutItem {
  id: number;
  name: string;
  meta: string;
  done: boolean;
  emoji: string;
}

export default function App() {
  // Mobile Nav Drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Active section highlighters
  const [activeSection, setActiveSection] = useState("hero");

  // Gym Challenge Row checkboxes
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([
    { id: 1, name: "Bench Press", meta: "4 sets × 10 reps", done: true, emoji: "🏋️" },
    { id: 2, name: "Pull-Ups", meta: "3 sets × 12 reps", done: true, emoji: "💪" },
    { id: 3, name: "Shoulder Press", meta: "4 sets × 8 reps", done: false, emoji: "🔥" },
  ]);

  // Floating AI drawers
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isImageLabOpen, setIsImageLabOpen] = useState(false);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Let's work, champion. I am Coach Arjun. Whether you need an elite calorie-shredding meal program, a brutal biomechanically sound split, or raw power calibration, name your objective. Let's forge those limits."
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatMode, setChatMode] = useState<"pro" | "standard" | "lite">("standard");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Image Lab State
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditingImage, setIsEditingImage] = useState(false);

  // Stats Counters
  const [statsData, setStatsData] = useState({
    members: 0,
    rating: 0,
    years: 0,
    success: 0,
  });

  // Current day of the week (0 = Sunday, 1 = Monday, ...)
  const [currentDay, setCurrentDay] = useState(1);

  // Hero Mouse Parallax (Desktop Only)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll state trigger
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);

      // Simple active link checking
      const sections = ["programs", "trainer", "pricing", "reviews", "contact"];
      let current = "hero";
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) {
            current = section;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    
    // Set current weekday
    const day = new Date().getDay();
    // In our order, 0 is Sunday, 1-5 is Mon-Fri, 6 is Sat.
    setCurrentDay(day === 0 ? 0 : day); // Sunday=0, Monday=1, etc.

    // Scroll reveal triggers
    const revealElements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            // Highlight counts on stats band if that elements is intersecting
            if (entry.target.classList.contains("stats-band-trigger")) {
              animateCounters();
            }
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -50px 0px" }
    );
    
    revealElements.forEach((el) => observer.observe(el));

    // Custom cursor system logic (Fixed Aurora Borealis Effect purely in JS)
    const TRAIL = 12;
    const colors = [
      'rgba(200,255,0,',
      'rgba(0,255,180,',
      'rgba(140,80,255,',
      'rgba(0,210,255,'
    ];
    const sizes = [
      [180,78],[158,68],[138,60],[118,52],
      [100,44],[84,37],[70,31],[57,26],
      [46,20],[36,16],[26,12],[17,8]
    ];
    const opacities = [
      0.22,0.20,0.18,0.16,0.14,0.12,
      0.10,0.09,0.08,0.07,0.06,0.05
    ];
    const lags = [
      0.18,0.14,0.12,0.10,0.09,0.08,
      0.07,0.06,0.055,0.05,0.045,0.04
    ];

    interface Particle {
      el: HTMLDivElement;
      x: number;
      y: number;
      angle: number;
    }

    // Create particles
    const particles: Particle[] = [];
    for (let i = 0; i < TRAIL; i++) {
      const el = document.createElement('div');
      const color = colors[i % 4];
      const op = opacities[i];
      const [w, h] = sizes[i];
      Object.assign(el.style, {
        position: 'fixed',
        pointerEvents: 'none',
        borderRadius: '50%',
        zIndex: '9997',
        width: w + 'px',
        height: h + 'px',
        background: `radial-gradient(ellipse, ${color}0.9) 0%, transparent 70%)`,
        filter: 'blur(10px)',
        opacity: op.toString(),
        willChange: 'transform',
        top: '0px',
        left: '0px',
        transform: 'translate(-9999px,-9999px)'
      });
      document.body.appendChild(el);
      particles.push({
        el,
        x: -999,
        y: -999,
        angle: 0
      });
    }

    let mouseX = -999;
    let mouseY = -999;
    let rafId: number;
    let started = false;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!started) started = true;
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      if (started) {
        // First particle follows mouse directly
        particles[0].x = lerp(particles[0].x, mouseX, lags[0]);
        particles[0].y = lerp(particles[0].y, mouseY, lags[0]);

        // Each follows the one before
        for (let i = 1; i < TRAIL; i++) {
          particles[i].x = lerp(
            particles[i].x, particles[i-1].x, lags[i]
          );
          particles[i].y = lerp(
            particles[i].y, particles[i-1].y, lags[i]
          );
        }

        // Apply position and rotation
        for (let i = 0; i < TRAIL; i++) {
          const p = particles[i];
          
          // Only rotate if actually moving
          if (i > 0) {
            const dx = particles[i-1].x - p.x;
            const dy = particles[i-1].y - p.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 1) {
              const target = Math.atan2(dy, dx) * (180 / Math.PI);
              // Smooth angle interpolation
              let diff = target - p.angle;
              // Normalize to -180 to 180
              while (diff > 180) diff -= 360;
              while (diff < -180) diff += 360;
              p.angle += diff * 0.15;
            }
          }

          p.el.style.transform = `translate(${p.x - sizes[i][0]/2}px, ${p.y - sizes[i][1]/2}px) rotate(${p.angle}deg)`;
        }
      }
      rafId = requestAnimationFrame(animate);
    };

    // Hide on touch/mobile
    const isTouch = window.matchMedia('(hover:none)').matches || window.innerWidth <= 768;
    if (isTouch) {
      particles.forEach(p => {
        p.el.style.display = 'none';
      });
    }

    window.addEventListener('mousemove', onMouseMove);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
      particles.forEach(p => {
        if (p.el.parentNode) {
          p.el.parentNode.removeChild(p.el);
        }
      });
    };
  }, []);

  // Stats Counter Animation
  const animateCounters = () => {
    let startTimestamp: number | null = null;
    const duration = 2000;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing: easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);

      setStatsData({
        members: Math.floor(ease * 500),
        rating: parseFloat((ease * 4.9).toFixed(1)),
        years: Math.floor(ease * 8),
        success: Math.floor(ease * 95),
      });

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  // Mouse move parallax on Hero
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = heroRef.current.getBoundingClientRect();
    const x = ((clientX - left) / width) * 20 - 10; // -10 to 10
    const y = ((clientY - top) / height) * 20 - 10;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Chat submit to backend
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;

    const userMsg = inputMessage.trim();
    setInputMessage("");
    
    const newMessages = [...chatMessages, { role: "user" as const, content: userMsg }];
    setChatMessages(newMessages);
    setIsChatLoading(true);

    // Scroll bottom
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          chatId: "ironpeak-session-1",
          mode: chatMode,
          history: chatMessages // send existing list as multi-turn state reference
        })
      });

      const data = await response.json();
      if (response.ok) {
        setChatMessages(prev => [...prev, { role: "assistant", content: data.text }]);
      } else {
        setChatMessages(prev => [...prev, { role: "assistant", content: `⚠️ Coach warning: ${data.error || "System misfire. Reset your metrics and let's try again."}` }]);
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "⚠️ Lost connection to India's server node. Maintain stance and try sending another command." }]);
    } finally {
      setIsChatLoading(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInputMessage(promptText);
  };

  // Image Creation submit to backend
  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePrompt.trim() || isImageLoading) return;

    setIsImageLoading(true);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          aspectRatio: aspectRatio
        })
      });

      const data = await response.json();
      if (response.ok && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setIsEditingImage(false);
      } else {
        alert(data.error || "Generation mismatch. Adjust prompt details.");
      }
    } catch (err) {
      alert("Render node exception. Check network.");
    } finally {
      setIsImageLoading(false);
    }
  };

  // Image Edit submit to backend
  const handleEditImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim() || !generatedImage || isImageLoading) return;

    setIsImageLoading(true);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editPrompt: editPrompt,
          base64Image: generatedImage,
          aspectRatio: aspectRatio
        })
      });

      const data = await response.json();
      if (response.ok && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setEditPrompt("");
      } else {
        alert(data.error || "Edit calibration mismatch.");
      }
    } catch (err) {
      alert("Edit context exception.");
    } finally {
      setIsImageLoading(false);
    }
  };

  // Toggle single workout challenge completion
  const handleToggleWorkout = (id: number) => {
    setWorkouts(prev => prev.map(w => w.id === id ? { ...w, done: !w.done } : w));
  };

  // Live progress percentage from checked challenge items
  const totalWorkoutsCount = workouts.length;
  const doneWorkoutsCount = workouts.filter(w => w.done).length;
  const progressRatio = totalWorkoutsCount > 0 ? Math.round((doneWorkoutsCount / totalWorkoutsCount) * 100) : 0;

  return (
    <div id="root-viewport" className="relative min-h-screen bg-bg text-white overflow-hidden selection:bg-lime selection:text-bg">
      {/* CUSTOM MOUSE CURSOR */}
      
      {/* COGNITIVE GRAIN OVERLAY */}
      <svg className="noise-overlay" xmlns="http://www.w3.org/2000/svg">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.03 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>

      {/* DYNAMIC BACKDROP ORBS */}
      <div className="glow-orb-lime"></div>
      <div className="glow-orb-red"></div>

      {/* NAVIGATION SECTION */}
      <nav id="navbar" className={`fixed top-0 left-0 w-full z-[100] transition-all duration-400 px-6 py-5 md:px-12 flex justify-between items-center ${isScrolled ? "bg-[rgba(7,7,7,0.92)] border-b border-[rgba(200,255,0,0.08)] backdrop-blur-md" : "bg-[rgba(7,7,7,0.2)] border-b border-[rgba(255,255,255,0.04)] backdrop-blur-[24px]"}`}>
        
        {/* Logo */}
        <a href="#root-viewport" className="flex items-center gap-0 no-underline select-none">
          <span className="font-display font-black text-white text-lg tracking-[0.15em]">IRON</span>
          <span className="font-display font-black text-lime text-lg tracking-[0.15em]">PEAK</span>
        </a>

        {/* Center Links (Desktop only) */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Programs", id: "#programs" },
            { label: "Trainer", id: "#trainer" },
            { label: "Pricing", id: "#pricing" },
            { label: "Reviews", id: "#reviews" },
            { label: "Contact", id: "#contact" }
          ].map((lnk) => (
            <a 
              key={lnk.label} 
              href={lnk.id} 
              className={`font-body font-medium text-[11px] tracking-[0.12em] uppercase transition-colors no-underline duration-200 hover:text-white ${activeSection === lnk.id.replace("#", "") ? "text-lime font-semibold" : "text-[#888]"}`}
            >
              {lnk.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA Trigger */}
        <div className="hidden md:block">
          <a 
            href="#trial" 
            className="inline-block bg-lime hover:bg-[#D4FF1A] text-bg font-body font-bold text-[11px] tracking-[0.12em] uppercase py-3 px-6 rounded-[2px] transition-all duration-200 hover:-translate-y-[1px] cursor-pointer"
          >
            FREE TRIAL ↗
          </a>
        </div>

        {/* Hamburger Menu button */}
        <button 
          id="mobile-nav-toggle"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex md:hidden flex-col gap-1.5 cursor-pointer bg-transparent border-none p-1 focus:outline-none"
          aria-label="Open navigation menu"
        >
          <div className="w-6 h-0.5 bg-white transition-all"></div>
          <div className="w-6 h-0.5 bg-white transition-all"></div>
          <div className="w-6 h-0.5 bg-white transition-all"></div>
        </button>
      </nav>

      {/* MOBILE DRAWER OVERLAY */}
      <div className={`fixed inset-0 bg-[rgba(7,7,7,0.98)] backdrop-blur-[40px] z-[2000] flex flex-col items-center justify-center gap-8 ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} transition-opacity duration-300`}>
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-[22px] right-[22px] bg-transparent border-none text-muted font-mono tracking-widest text-sm uppercase px-3 py-2 cursor-pointer outline-none hover:text-white"
        >
          [ CLOSE ✕ ]
        </button>
        {[
          { label: "PROGRAMS", id: "#programs" },
          { label: "TRAINER", id: "#trainer" },
          { label: "PRICING", id: "#pricing" },
          { label: "REVIEWS", id: "#reviews" },
          { label: "CONTACT", id: "#contact" }
        ].map((item) => (
          <a
            key={item.label}
            href={item.id}
            onClick={() => setIsMobileMenuOpen(false)}
            className="font-display font-black text-3xl text-white tracking-tight hover:text-lime transition-all"
          >
            {item.label}
          </a>
        ))}
        <a
          href="#trial"
          onClick={() => setIsMobileMenuOpen(false)}
          className="mt-4 bg-lime text-bg font-body font-bold text-xs tracking-wider uppercase py-4 px-10 rounded-[2px] cursor-pointer"
        >
          CLAIM FREE TRIAL ↗
        </a>
      </div>


      {/* SECTION 2 — HERO */}
      <header 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative min-h-[100svh] pt-[120px] pb-16 px-6 md:px-12 xl:px-24 flex items-center overflow-hidden"
      >
        {/* Hero Background Layers */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#070707] via-[#0D0D0D] to-[#0A0A06] z-1"></div>
        
        {/* Athlete Background Mask */}
        <div 
          className="absolute right-0 top-0 w-full md:w-[55%] h-full z-2 bg-no-repeat bg-cover bg-[center_top] opacity-40 md:opacity-85 mix-blend-luminosity pointer-events-none"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1100&q=85')" }}
        >
          {/* Fades */}
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-[rgba(7,7,7,0.7)] via-35% to-transparent z-1"></div>
          <div className="absolute top-0 left-0 w-full h-[15%] bg-gradient-to-b from-bg to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-[20%] bg-gradient-to-t from-bg to-transparent"></div>
        </div>



        {/* Content Container */}
        <div className="relative w-full max-w-[1320px] mx-auto z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center max-lg:overflow-hidden lg:overflow-visible">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Top Enrollment Badge */}
            <div className="inline-flex items-center gap-2 bg-[rgba(200,255,0,0.08)] border border-[rgba(200,255,0,0.2)] rounded-full px-4 py-1.5 mb-7 select-none">
              <span className="w-1.5 h-1.5 bg-lime rounded-full blink-dot"></span>
              <span className="font-mono text-[9px] tracking-[0.15em] text-lime uppercase font-semibold">NOW ENROLLING — MUMBAI</span>
            </div>

            {/* H1 Title */}
            <h1 className="font-display text-white text-[clamp(44px,8vw,90px)] font-black leading-[0.92] tracking-[-0.02em] mb-6">
              FORGE <br />
              YOUR <br />
              <span className="text-lime drop-shadow-[0_0_40px_rgba(200,255,0,0.3)]">LIMITS.</span>
            </h1>

            {/* Description */}
            <p className="font-body font-normal text-muted-grey text-[clamp(14px,1.5vh,16px)] leading-relaxed max-w-[460px] mb-8">
              Elite coaching. Premium level equipment. Zero excuses. Join Mumbai's most results-driven performance and power lifting athlete colony.
            </p>

            {/* Button Rows */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mb-10">
              <a 
                href="#trial" 
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-lime hover:bg-[#D4FF1A] text-bg font-body font-extrabold text-[13px] tracking-[0.08em] uppercase py-4 px-8 rounded-[2px] transition-all duration-250 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(200,255,0,0.25)] min-h-[52px]"
              >
                <Zap className="w-4 h-4 fill-bg" /> START FREE TRIAL
              </a>
              <a 
                href="#programs" 
                className="w-full sm:w-auto flex items-center justify-center gap-1 bg-transparent hover:bg-[rgba(200,255,0,0.04)] text-white font-body font-semibold text-[13px] tracking-[0.08em] uppercase py-4 px-8 rounded-[2px] border border-[rgba(255,255,255,0.15)] hover:border-[rgba(200,255,0,0.35)] transition-all duration-250 min-h-[52px]"
              >
                VIEW PROGRAMS →
              </a>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-6 sm:gap-10">
              {[
                { count: "500+", lbl: "MEMBERS" },
                { count: "8 YRS", lbl: "EXPERIENCE" },
                { count: "4.9★", lbl: "RATING" },
                { count: "95%", lbl: "SUCCESS RATE" }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <span className="font-display font-black text-2xl text-white tracking-tight">{stat.count}</span>
                  <span className="font-mono text-[9px] text-[#777] tracking-[0.12em] uppercase mt-1">{stat.lbl}</span>
                </div>
              ))}
            </div>

          </div>

          {/* Right Floating Card Column */}
          <div className="lg:col-span-5 flex justify-center w-full max-w-full lg:overflow-visible">
            <div 
              style={{
                transform: (typeof window !== "undefined" && window.innerWidth >= 1024)
                  ? `perspective(1000px) rotateY(${-4 + mousePos.x * 0.4}deg) rotateX(${4 - mousePos.y * 0.4}deg)` 
                  : "none"
              }}
              className="strong-glass-card w-full lg:max-w-[420px] max-lg:!transform-none max-lg:w-full mt-8 lg:mt-0 p-6 md:p-8 relative transition-all duration-300"
            >
              
              {/* Card Title */}
              <div className="flex justify-between items-center mb-6">
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase flex items-center gap-2">
                  <span className="text-lime">TODAY'S CHALLENGE</span>
                </span>
                <span className="font-mono text-[9px] tracking-[0.15em] text-muted-grey">DAY 14/30</span>
              </div>

              <h3 className="font-display font-black text-xl text-white mb-5 tracking-tight">UPPER BODY BLAST</h3>

              {/* Challenge Workout List */}
              <div className="flex flex-col gap-2.5 mb-6">
                {workouts.map((work) => (
                  <div 
                    key={work.id}
                    onClick={() => handleToggleWorkout(work.id)}
                    className="group flex items-center justify-between p-3.5 bg-[rgba(255,255,255,0.015)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(200,255,0,0.04)] hover:border-[rgba(200,255,0,0.15)] cursor-pointer select-none transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <span className="flex items-center justify-center w-8 h-8 bg-[rgba(200,255,0,0.08)] border border-[rgba(200,255,0,0.12)] text-base">
                        {work.emoji}
                      </span>
                      {/* Description */}
                      <div className="flex flex-col">
                        <span className="font-body text-xs font-semibold text-white tracking-wider group-hover:text-lime transition-colors">{work.name}</span>
                        <span className="font-mono text-[9px] text-[#777] uppercase mt-0.5">{work.meta}</span>
                      </div>
                    </div>

                    {/* Status Circle */}
                    <div className="flex-shrink-0">
                      {work.done ? (
                        <div className="w-5 h-5 rounded-full bg-lime border border-lime flex items-center justify-center text-bg text-[10px] font-bold">
                          ✓
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-[rgba(255,255,255,0.15)] flex items-center justify-center text-[10px] text-transparent">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic Progress indicator */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-[9.5px] tracking-widest text-[#999] uppercase">WEEKLY PROGRESS</span>
                  <span className="font-mono text-xs font-bold text-lime">{progressRatio}%</span>
                </div>
                
                {/* Gauge bar */}
                <div className="w-full h-[3px] bg-[rgba(255,255,255,0.06)] overflow-hidden">
                  <div 
                    className="h-full bg-lime shadow-[0_0_10px_#C8FF00] transition-all duration-500 ease-out"
                    style={{ width: `${progressRatio}%` }}
                  ></div>
                </div>
              </div>

              {/* Card Join Action */}
              <a 
                href="#trial"
                className="w-full bg-lime hover:bg-[#D4FF1A] text-bg font-body font-bold text-xs tracking-wider uppercase py-3.5 flex items-center justify-center gap-1 cursor-pointer transition-all hover:translate-y-[-1px] no-underline"
              >
                JOIN THE CHALLENGE →
              </a>
            </div>
          </div>

        </div>
      </header>

      {/* SECTION 3 — STATS BAND (Fluid intersection counts) */}
      <section className="reveal stats-band-trigger w-full bg-[rgba(200,255,0,0.03)] border-t border-b border-[rgba(200,255,0,0.08)] py-14 px-6 md:px-12 xl:px-24">
        <div className="max-w-[1320px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-[rgba(255,255,255,0.06)]">
          
          <div className="flex flex-col items-center justify-center text-center p-3">
            <div className="font-display font-black text-5xl md:text-7xl text-white tracking-tight leading-none">
              {statsData.members || "500"}<span className="text-lime inline-block ml-1">+</span>
            </div>
            <span className="font-mono text-[10px] text-[#777] tracking-[0.15em] uppercase mt-3">ACTIVE MEMBERS</span>
          </div>

          <div className="flex flex-col items-center justify-center text-center p-3 pt-6 md:pt-3">
            <div className="font-display font-black text-5xl md:text-7xl text-white tracking-tight leading-none">
              {statsData.rating || "4.9"}<span className="text-lime inline-block ml-1">★</span>
            </div>
            <span className="font-mono text-[10px] text-[#777] tracking-[0.15em] uppercase mt-3">AVERAGE RATING</span>
          </div>

          <div className="flex flex-col items-center justify-center text-center p-3 pt-6 md:pt-3">
            <div className="font-display font-black text-5xl md:text-7xl text-white tracking-tight leading-none">
              {statsData.years || "8"}<span className="text-lime inline-block ml-1">+</span>
            </div>
            <span className="font-mono text-[10px] text-[#777] tracking-[0.15em] uppercase mt-3">YEARS OPERATING</span>
          </div>

          <div className="flex flex-col items-center justify-center text-center p-3 pt-6 md:pt-3">
            <div className="font-display font-black text-5xl md:text-7xl text-white tracking-tight leading-none">
              {statsData.success || "95"}<span className="text-lime inline-block ml-1">%</span>
            </div>
            <span className="font-mono text-[10px] text-[#777] tracking-[0.15em] uppercase mt-3">SUCCESS RATE</span>
          </div>

        </div>
      </section>


      {/* SECTION 4 — PROGRAMS FEATURE GRID */}
      <section id="programs" className="reveal py-24 px-6 md:px-12 xl:px-24">
        <div className="max-w-[1320px] mx-auto">
          
          {/* Header Block inline */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-16">
            <div className="max-w-[580px]">
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase flex items-center gap-2 mb-3">
                <span className="text-lime">WHAT WE OFFER</span>
              </span>
              <h2 className="text-white text-[clamp(30px,5vw,56px)] leading-[0.95] mb-5">
                PROGRAMS BUILT <br />
                FOR <span className="text-lime">RESULTS.</span>
              </h2>
            </div>
            <p className="font-body font-normal text-muted-grey text-[15px] leading-relaxed max-w-[440px]">
              From first-day registration to elite contest prepping — every session is programmatically targeted to actual, sustainable body composition gains.
            </p>
          </div>

          {/* Grid list (sharp styling box grid layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-transparent">
            
            {[
              {
                emoji: "🏋️", 
                title: "WEIGHT TRAINING", 
                descr: "Progressive strength templates built specifically around your major compound lifts. Hypertrophy meets physical science."
              },
              {
                emoji: "🔥", 
                title: "CARDIO BLAST", 
                descr: "High-intensity aerobic conditioning designed to strip body-fat without compromising muscular volume."
              },
              {
                emoji: "⚡", 
                title: "HIIT CYCLES", 
                descr: "Fast 45-minute structured clusters designed to spike metabolic rate for sustained calorie burning post-workout."
              },
              {
                emoji: "🧘", 
                title: "YOGA & MOBILITY", 
                descr: "Regain joint range of motion, target kinetic imbalances, and clear nervous stress to support lifting durability."
              },
              {
                emoji: "🥗", 
                title: "NUTRITION PLAN", 
                descr: "Macros calculated exactly based on energy demands and sleep metrics. Completely custom, highly direct food strategies."
              },
              {
                emoji: "🎯", 
                title: "PERSONAL COACHING", 
                descr: "1-on-1 focus. Access the direct counsel of Coach Arjun with live updates, and strict form evaluation."
              }
            ].map((prog, index) => (
              <div 
                key={index}
                onClick={() => {
                  setIsChatOpen(true);
                  setChatMessages(prev => [...prev, {
                    role: "assistant",
                    content: `Excellent selection. Tell me what your personal goals are for **${prog.title}** so I can formulate a targeted plan.`
                  }]);
                }}
                className="strong-glass-card group p-8 cursor-pointer transition-all duration-300 relative overflow-hidden"
              >
                {/* Active line accent top overlay */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-lime opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Inner Icon block */}
                <div className="w-[48px] h-[48px] bg-[rgba(200,255,0,0.08)] border border-[rgba(200,255,0,0.15)] flex items-center justify-center text-2xl mb-6">
                  {prog.emoji}
                </div>

                <h3 className="font-display font-black text-xl text-white mb-3 tracking-tight group-hover:text-lime transition-colors">
                  {prog.title}
                </h3>
                
                <p className="font-body font-normal text-muted-grey text-xs leading-relaxed mb-6 group-hover:text-[#aaa] transition-colors">
                  {prog.descr}
                </p>

                <div className="font-mono text-[10px] text-lime tracking-widest uppercase flex items-center gap-1 group-hover:gap-2.5 transition-all">
                  EXPLORE AI ADVICE <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}

          </div>

        </div>
      </section>


      {/* SECTION 5 — COACH / TRAINER SPOTLIGHT */}
      <section id="trainer" className="reveal bg-bg-2 py-24 px-6 md:px-12 xl:px-24">
        <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column Stick Image */}
          <div className="lg:col-span-5 relative lg:sticky lg:top-[120px] w-full">
            <div className="relative aspect-[3/4] md:aspect-square lg:aspect-[3/4] bg-[rgba(255,255,255,0.02)] overflow-hidden">
              <img 
                loading="lazy"
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&q=85" 
                alt="Coach Arjun Singh" 
                className="w-full h-full object-cover mix-blend-luminosity filter contrast-[1.1] hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(13,13,13,1)] via-transparent to-transparent"></div>
            </div>

            {/* Float badges (Desktop only) */}
            <div className="hidden lg:block absolute top-4 left-[-16px] bg-[rgba(10,10,10,0.85)] border border-lime p-3 font-mono text-[9px] text-lime font-bold shadow-xl">
              ⚡ 20+ YRS OF COMBINED TEAM EXP
            </div>
            <div className="hidden lg:block absolute bottom-8 right-[-16px] bg-[rgba(10,10,10,0.85)] border border-lime p-3 font-mono text-[9px] text-lime font-bold shadow-xl">
              💪 500+ CLIENTS TRANSFORMED
            </div>
          </div>

          {/* Right Info block */}
          <div className="strong-glass-card lg:col-span-7 p-8 md:p-12 relative transition-all duration-300">
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase flex items-center gap-2 mb-4">
              <span className="text-lime">MEET YOUR HEAD COACH</span>
            </span>
            
            <h2 className="font-display font-black text-3xl md:text-5xl text-white mb-2 leading-none">Arjun Singh</h2>
            <span className="font-body text-sm font-semibold text-lime block mb-6">ACE Certified Personal Coach & Fitness Nutrition Specialist</span>

            <div className="w-full h-[1px] bg-[rgba(255,255,255,0.06)] mb-6"></div>

            <p className="font-body font-normal text-muted-grey text-[14px] leading-relaxed mb-6">
              With over 8 years of transformative results across Mumbai's elite fitness landscape, Coach Arjun matches progressive biomechanical training protocols with calculated macronutrient planning. No shortcuts, no lazy empty promises. Just scientifically backed weight adjustment and physical progression designed to stick for life.
            </p>

            {/* Credential Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {[
                "ACE Personal Trainer Core",
                "Senior Nutrition Counselor",
                "Active Power Trainer (8+ Yrs)",
                "500+ Guaranteed Body Transformations"
              ].map((cred, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-[rgba(200,255,0,0.03)] border border-[rgba(200,255,0,0.12)] rounded-full px-4 py-2">
                  <Check className="w-3.5 h-3.5 text-lime flex-shrink-0" />
                  <span className="font-body text-[12px] font-semibold text-[rgba(255,255,255,0.85)] leading-tight">{cred}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                setIsChatOpen(true);
                setChatMessages(prev => [...prev, {
                  role: "assistant",
                  content: "Let's calibrate your workout structure. Give me your current bodyweight, target weight, and any persistent injuries we need to navigate. I will customize a layout right now."
                }]);
              }}
              className="w-full bg-lime hover:bg-[#D4FF1A] text-bg font-body font-black text-xs tracking-wider uppercase py-4 flex items-center justify-center gap-1 cursor-pointer transition-all hover:shadow-[0_8px_32px_rgba(200,255,0,0.15)]"
            >
              TRAIN WITH COACH ARJUN (AI OPEN) →
            </button>
          </div>

        </div>
      </section>


      {/* SECTION 6 — WHY IRONPEAK (BUILT DIFFERENT) */}
      <section className="reveal py-24 px-6 md:px-12 xl:px-24 text-center">
        <div className="max-w-[1320px] mx-auto">
          
          <div className="max-w-[580px] mx-auto mb-16">
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase flex items-center justify-center gap-2 mb-3">
              <span className="text-lime">THE IRONPEAK STANDARD</span>
            </span>
            <h2 className="text-white text-[clamp(30px,5vw,56px)] leading-[0.95] mb-4">
              BUILT DIFFERENT. <br />
              DELIVERS DIFFERENT.
            </h2>
          </div>

          {/* Grid display of cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-transparent">
            
            {[
              {
                emoji: "🏆",
                title: "ELITE HEAVY REGS",
                descr: "Every machine and piece of hardware matches competition lifting standards. Impeccable daily maintenance, zero platform downtime."
              },
              {
                emoji: "👥",
                title: "ONLY EXPERIENCED COACHES",
                descr: "No freshly graduated apprentices. Every supervisor on our platforms holds valid international certifications and years of active lifting pedigree."
              },
              {
                emoji: "📈",
                title: "95% OBJECTIVE RETURN",
                descr: "A stunning 95% of active members realize major muscle gain, fat adjustment, or physical calibration targets within the first 90 days. Period."
              }
            ].map((box, i) => (
              <div key={i} className="strong-glass-card p-10 flex flex-col items-center transition-all duration-300">
                <span className="text-[52px] block mb-6 select-none">{box.emoji}</span>
                <h3 className="font-display font-black text-xl text-white mb-3 tracking-tight">{box.title}</h3>
                <p className="font-body font-normal text-muted-grey text-[13px] leading-relaxed max-w-[280px]">
                  {box.descr}
                </p>
              </div>
            ))}

          </div>

        </div>
      </section>


      {/* SECTION 7 — PRICING (BATTLE SCHEMES) */}
      <section id="pricing" className="reveal bg-bg-2 py-24 px-6 md:px-12 xl:px-24">
        <div className="max-w-[1320px] mx-auto">
          
          <div className="text-center max-w-[580px] mx-auto mb-16">
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase flex items-center justify-center gap-2 mb-3">
              <span className="text-lime">PRICE PACKS</span>
            </span>
            <h2 className="text-white text-[clamp(30px,5vw,56px)] leading-[0.95] mb-4">
              CHOOSE YOUR <span className="text-lime">BATTLE PLAN.</span>
            </h2>
          </div>

          {/* Table list */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-transparent items-start">
            
            {/* Starter Plan */}
            <div className="strong-glass-card p-8 transition-all duration-300">
              <span className="font-mono text-[11px] font-bold text-muted-grey tracking-[0.15em] uppercase block mb-5">STARTER SCHEME</span>
              
              {/* Cost label */}
              <div className="flex items-baseline mb-6">
                <span className="font-body text-2xl font-medium text-muted-grey mr-1">₹</span>
                <span className="font-display font-black text-5xl text-white leading-none">1,499</span>
                <span className="font-body text-xs text-muted-grey ml-1">/mo</span>
              </div>

              <div className="w-full h-[1px] bg-[rgba(255,255,255,0.06)] mb-6"></div>

              {/* List item arrays */}
              <ul className="flex flex-col gap-3.5 mb-8 p-0 list-none text-left">
                {[
                  "3 Days / Week Platform Access",
                  "Access to standard group slots",
                  "Locker room authorization",
                  "Standard basic diet templates"
                ].map((feat, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs font-body text-[#bbb]">
                    <Check className="w-4 h-4 text-lime mt-0.5 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <a 
                href="#trial" 
                className="w-full inline-flex items-center justify-center border border-[rgba(255,255,255,0.12)] hover:border-lime hover:bg-[rgba(200,255,0,0.04)] text-white text-xs font-body font-bold py-4 transition-all uppercase rounded-[2px]"
              >
                SELECT SCHEME
              </a>
            </div>

            {/* Featured Pro Plan (Slightly larger, glowing accent background) */}
            <div className="featured-pricing-card p-8 relative lg:translate-y-[-8px] z-10 transition-all duration-300">
              
              {/* Top Pop badge */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-lime text-bg font-mono font-bold text-[9px] tracking-[0.18em] py-1.5 px-4 uppercase rounded-b-md">
                MOST POPULAR
              </div>

              <span className="font-mono text-[11px] font-bold text-lime tracking-[0.15em] uppercase block mt-3 mb-5">PRO ATHLETE</span>
              
              <div className="flex items-baseline mb-6">
                <span className="font-body text-2xl font-medium text-lime mr-1">₹</span>
                <span className="font-display font-black text-[56px] text-white leading-none">2,499</span>
                <span className="font-body text-xs text-muted-grey ml-1 font-semibold">/mo</span>
              </div>

              <div className="w-full h-[1px] bg-[rgba(255,255,255,0.06)] mb-6"></div>

              <ul className="flex flex-col gap-3.5 mb-8 p-0 list-none text-left">
                {[
                  "Unlimited Heavy Platform Access",
                  "2 Head-Coach PT sessions per month",
                  "Fully customized adaptive meal logs",
                  "Digital progression tracker updates",
                  "24/7 dedicated Coach WhatsApp support"
                ].map((feat, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs font-body text-white">
                    <Check className="w-4 h-4 text-lime mt-0.5 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <a 
                href="#trial" 
                className="w-full inline-flex items-center justify-center bg-lime hover:brightness-110 text-bg text-xs font-body font-black py-4 transition-all uppercase rounded-[2px]"
              >
                START TRAINING ⚡
              </a>
            </div>

            {/* Elite Plan */}
            <div className="strong-glass-card p-8 transition-all duration-300">
              <span className="font-mono text-[11px] font-bold text-muted-grey tracking-[0.15em] uppercase block mb-5">ELITE TITAN PACK</span>
              
              <div className="flex items-baseline mb-6">
                <span className="font-body text-2xl font-medium text-[#777] mr-1">₹</span>
                <span className="font-display font-black text-5xl text-white leading-none">3,999</span>
                <span className="font-body text-xs text-muted-grey ml-1">/mo</span>
              </div>

              <div className="w-full h-[1px] bg-[rgba(255,255,255,0.06)] mb-6"></div>

              <ul className="flex flex-col gap-3.5 mb-8 p-0 list-none text-left">
                {[
                  "All access + unlimited daily PT guidance",
                  "Custom daily macro prepped meals guide",
                  "Advanced bio-chem supplementation mapping",
                  "First priority platform & locker reservation",
                  "Ultra-detailed weekly body composite reports"
                ].map((feat, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs font-body text-[#bbb]">
                    <Check className="w-4 h-4 text-lime mt-0.5 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <a 
                href="#trial" 
                className="w-full inline-flex items-center justify-center border border-[rgba(255,255,255,0.12)] hover:border-lime hover:bg-[rgba(200,255,0,0.04)] text-white text-xs font-body font-bold py-4 transition-all uppercase rounded-[2px]"
              >
                SELECT SCHEME
              </a>
            </div>

          </div>

        </div>
      </section>


      {/* SECTION 8 — TESTIMONIAL CARDS */}
      <section id="reviews" className="reveal py-24 px-6 md:px-12 xl:px-24">
        <div className="max-w-[1320px] mx-auto">
          
          <div className="text-center max-w-[580px] mx-auto mb-16">
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase flex items-center justify-center gap-2 mb-3">
              <span className="text-lime">PHYSICAL PROOF</span>
            </span>
            <h2 className="text-white text-[clamp(30px,5vw,56px)] leading-[0.95] mb-4">
              THEY LIFTED IT. <br />
              WE PROVED IT.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-transparent">
            
            {[
              {
                stars: 5,
                quote: "Dropped 15kg in 3 months. Coach Arjun's conditioning splits are absolute fire. Best financial investment I've made. IronPeak entirely changes physical structure and metal fortitude.",
                name: "Vikram D.",
                loc: "Andheri West, Mumbai"
              },
              {
                stars: 5,
                quote: "Tried 4 standard multi-chain commercial gyms before. The major difference is custom programming — the supervisors actually log your weights, call you by name, and target your lifting limits.",
                name: "Neha R.",
                loc: "Bandra, Mumbai"
              },
              {
                stars: 5,
                quote: "Entered as a absolute lifting clean slate. Six months later, I smashed my first 10k race and benched my bodyweight. The high-protein mapping structure from Coach Arjun is incredible.",
                name: "Sameer K.",
                loc: "Juhu Central, Mumbai"
              }
            ].map((rev, i) => (
              <div key={i} className="strong-glass-card p-8 transition-all duration-300">
                {/* Gold Stars */}
                <span className="text-[#FFD700] text-sm tracking-widest block mb-4">★★★★★</span>
                
                <p className="font-body text-xs font-normal text-white italic leading-relaxed mb-6">
                  "{rev.quote}"
                </p>

                {/* Author Info block */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[rgba(200,255,0,0.3)] to-[rgba(200,255,0,0.1)] border border-[rgba(200,255,0,0.2)] flex items-center justify-center font-display font-black text-[#070707] text-xs">
                    {rev.name.substring(0,2)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body font-bold text-xs text-white leading-tight">{rev.name}</span>
                    <span className="font-mono text-[9px] text-[#777] uppercase tracking-wider mt-0.5">{rev.loc}</span>
                  </div>
                </div>
              </div>
            ))}

          </div>

        </div>
      </section>


      {/* SECTION 9 — LOCATION & DAILY HOURS */}
      <section id="contact" className="reveal bg-bg-2 py-24 px-6 md:px-12 xl:px-24">
        <div className="max-w-[1320px] mx-auto">
          
          <div className="text-center max-w-[580px] mx-auto mb-16">
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase flex items-center justify-center gap-2 mb-3">
              <span className="text-lime">VISIT OUR STATION</span>
            </span>
            <h2 className="text-white text-[clamp(30px,5vw,56px)] leading-[0.95] mb-4">
              YOUR ARENA <br />
              AWAITS.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-transparent">
            
            {/* Hours card (Dynamic Today highlight inside) */}
            <div className="strong-glass-card p-8 md:p-10 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-lg bg-[rgba(200,255,0,0.08)] border border-[rgba(200,255,0,0.2)] p-2">🕐</span>
                <h3 className="font-display font-black text-white text-base">GYM INTENSITY HOURS</h3>
              </div>

              <div className="flex flex-col gap-1 w-full">
                {[
                  { name: "Monday – Friday", time: "5:00 AM – 11:00 PM", isWeek: true, days: [1, 2, 3, 4, 5] },
                  { name: "Saturday", time: "6:00 AM – 10:00 PM", isWeek: false, days: [6] },
                  { name: "Sunday", time: "7:00 AM – 8:00 PM", isWeek: false, days: [0] }
                ].map((row, index) => {
                  const isToday = row.days.includes(currentDay);
                  return (
                    <div 
                      key={index} 
                      className={`flex justify-between items-center py-4 border-b border-[rgba(255,255,255,0.04)] last:border-b-0 ${isToday ? "text-lime bg-[rgba(200,255,0,0.02)] px-2" : "text-[#999]"}`}
                    >
                      <span className={`font-body text-xs ${isToday ? "font-bold text-lime" : "text-[#777]"}`}>{row.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-white">{row.time}</span>
                        {isToday && (
                          <span className="font-mono text-[8px] bg-[rgba(200,255,0,0.15)] border border-lime text-lime px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            TODAY
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Address Info lists */}
            <div className="strong-glass-card p-8 md:p-10 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-lg bg-[rgba(200,255,0,0.08)] border border-[rgba(200,255,0,0.2)] p-2">📍</span>
                <h3 className="font-display font-black text-white text-base">FIND THE PEAK</h3>
              </div>

              <div className="flex flex-col gap-6">
                {[
                  { label: "ADDRESS", val: "Plot 5, Sports Center Complex, Link Road, Andheri West, Mumbai, Maharashtra 400001" },
                  { label: "PHONE", val: "+91 98765 11111 (Direct Desk)" },
                  { label: "EMAIL", val: "info@ironpeakfitness.in" },
                  { label: "WHATSAPP", val: "+91 98765 11111 (Direct Message Line)" }
                ].map((pItem, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-9 h-9 bg-[rgba(200,255,0,0.08)] border border-[rgba(200,255,0,0.12)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="w-3.5 h-3.5 text-lime" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-mono text-[9px] text-[#777] tracking-widest">{pItem.label}</span>
                      <span className="font-body text-xs text-white leading-relaxed mt-1 font-semibold">{pItem.val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* SECTION 10 — FINAL LAUNCHER CALL CARD */}
      <section id="trial" className="reveal py-24 px-6 md:px-12 xl:px-24">
        <div className="max-w-[1320px] mx-auto">
          
          <div className="bg-[rgba(255,255,255,0.04)] backdrop-blur-[24px] border border-[rgba(200,255,0,0.12)] p-12 md:p-24 shadow-2xl relative text-center overflow-hidden">
            
            {/* Top border ambient glow line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-lime to-transparent"></div>
            
            {/* Center background glow effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,255,0,0.04)_0%,transparent_65%)] pointer-events-none"></div>

            <h2 className="relative z-10 text-white text-[clamp(42px,7vw,85px)] font-black leading-[0.92] mb-6">
              READY TO <br />
              <span className="text-lime">TRANSFORM?</span>
            </h2>

            <p className="relative z-10 font-body font-normal text-muted-grey text-base max-w-[520px] mx-auto leading-relaxed mb-10">
              The first week is on Mumbai's server tab. zero contracts needed. No credit details. Simple physical registration, walk in and let's lift.
            </p>

            <div className="relative z-10 flex flex-col sm:flex-row justify-center items-center gap-3.5 max-w-[420px] mx-auto">
              <button 
                onClick={() => {
                  setIsChatOpen(true);
                  setChatMessages(prev => [...prev, {
                    role: "assistant",
                    content: "Welcome to Mumbai's primary performance program. I need 2 details first to authorize your free trial: Is your current objective muscle mass accrual, power training, or body recomposition?"
                  }]);
                }}
                className="w-full bg-lime hover:bg-[#D4FF1A] text-bg font-body font-black text-xs tracking-wider uppercase py-4 px-8 rounded-[2px] transition-all cursor-pointer shadow-lg hover:shadow-[0_8px_32px_rgba(200,255,0,0.25)] flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4 fill-bg" /> CLAIM FREE WEEK (AI)
              </button>
              
              <a 
                href="https://wa.me/919876511111"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center bg-transparent hover:bg-[rgba(200,255,0,0.04)] border border-lime text-lime font-body font-bold text-xs tracking-wider py-4 px-8 rounded-[2px] cursor-pointer"
              >
                💬 WHATSAPP RECEPTION
              </a>
            </div>

          </div>

        </div>
      </section>


      {/* FOOTER */}
      <footer className="bg-black/80 border-t border-[rgba(255,255,255,0.04)] py-10 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6 text-center select-none">
        
        {/* Foot Logo */}
        <a href="#root-viewport" className="flex items-center gap-0 no-underline">
          <span className="font-display font-black text-white text-base tracking-[0.15em]">IRON</span>
          <span className="font-display font-black text-lime text-base tracking-[0.15em]">PEAK</span>
        </a>

        {/* Mid Copyright */}
        <span className="font-mono text-[9px] text-[rgba(255,255,255,0.25)] tracking-wider">
          © 2026 IRONPEAK FITNESS ATHLETE MATRIX. DECORATIVE SENSORY PROTOCOL.
        </span>

        {/* Right Links */}
        <div className="flex gap-6 justify-center">
          <button 
            onClick={() => setIsChatOpen(true)}
            className="bg-transparent border-none font-mono text-[10px] text-lime font-semibold uppercase hover:underline cursor-pointer"
          >
            AI COACH
          </button>
          <button 
            onClick={() => setIsImageLabOpen(true)} 
            className="bg-transparent border-none font-mono text-[10px] text-[rgba(255,255,255,0.4)] uppercase hover:text-white cursor-pointer"
          >
            CREATIVE GRAPHICS LAB
          </button>
        </div>
      </footer>





      {/* FLOATING WHATSAPP GLOW BUTTON */}
      <div className="fixed bottom-6 right-6 z-[99]">
        <a 
          href="https://wa.me/919876511111"
          target="_blank"
          rel="noreferrer"
          className="wa-pulse-button w-[50px] h-[50px] md:w-[54px] md:h-[54px] bg-[#25D366] rounded-full flex items-center justify-center text-white text-2xl shadow-2xl transition-transform hover:scale-110 duration-200"
          title="Chat on WhatsApp"
        >
          <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.1 1.45 4.6 1.453 5.3 0 9.6-4.3 9.6-9.6 0-2.56-1-4.96-2.8-6.77-1.8-1.82-4.2-2.82-6.8-2.82-5.32 0-9.64 4.32-9.64 9.64.001 1.63.45 3.21 1.3 4.62l-1.01 3.68 3.75-.98z"/>
          </svg>
        </a>
      </div>


      {/* INTERACTIVE COACH ARJUN CHAT SYSTEM DRAWER */}
      <div className={`fixed top-0 right-0 w-full sm:w-[520px] h-full bg-[#0a0a0add]/95 border-l border-[rgba(255,255,255,0.08)] z-[2001] shadow-2xl transition-transform duration-300 transform ${isChatOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}>
        
        {/* Header panel */}
        <div className="p-5 border-b border-[rgba(255,255,255,0.08)] bg-bg/90 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-lime border border-lime flex items-center justify-center font-display text-bg text-[10px]">
              AS
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-xs text-white uppercase tracking-tight">COACH ARJUN CO-PILOT</span>
              <span className="font-mono text-[8px] text-lime font-bold uppercase tracking-wider block mt-0.5">MATRIX PLATFORM ACTIVE</span>
            </div>
          </div>
          <button 
            onClick={() => setIsChatOpen(false)}
            aria-label="Close Chat"
            className="text-muted hover:text-white bg-transparent border-none cursor-pointer outline-none transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Model selectors (pro/standard/lite) */}
        <div className="p-3.5 bg-bg/40 border-b border-[rgba(255,255,255,0.05)] grid grid-cols-3 gap-2">
          <button 
            onClick={() => setChatMode("lite")}
            className={`py-2 px-1 text-center border font-mono text-[8.5px] uppercase tracking-wider flex flex-col items-center justify-center gap-0.5 transition-all ${chatMode === "lite" ? "bg-[rgba(200,255,0,0.15)] border-lime text-lime font-bold" : "border-[rgba(255,255,255,0.06)] text-[#666] hover:text-[#999]"}`}
          >
            <Zap className="w-3 h-3 text-currentColor" />
            <span>⚡ LITE AUTO</span>
          </button>
          
          <button 
            onClick={() => setChatMode("standard")}
            className={`py-2 px-1 text-center border font-mono text-[8.5px] uppercase tracking-wider flex flex-col items-center justify-center gap-0.5 transition-all ${chatMode === "standard" ? "bg-[rgba(200,255,0,0.15)] border-lime text-lime font-bold" : "border-[rgba(255,255,255,0.06)] text-[#666] hover:text-[#999]"}`}
          >
            <Activity className="w-3 h-3 text-currentColor" />
            <span>🔥 STANDARD</span>
          </button>

          <button 
            onClick={() => setChatMode("pro")}
            className={`py-2 px-1 text-center border font-mono text-[8.5px] uppercase tracking-wider flex flex-col items-center justify-center gap-0.5 transition-all ${chatMode === "pro" ? "bg-[rgba(255,255,255,0.06)] border-[#FF3D00] text-red-500 font-bold" : "border-[rgba(255,255,255,0.06)] text-[#666] hover:text-[#999]"}`}
            title="Uses gemini-3.1-pro-preview with high thinking level"
          >
            <Brain className="w-3 h-3 text-currentColor" />
            <span className="flex items-center gap-1">🧠 HIGH THINKING</span>
          </button>
        </div>

        {/* Messaging Area thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Preset Prompts selection slider */}
          <div className="space-y-1.5 pb-2">
            <span className="font-mono text-[8.5px] text-muted-grey uppercase tracking-wider block">QUICK CALIBRATION QUERIES:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Give me a brutal 4-day compound power routing template",
                "Construct a high-protein recipe guide for hardgainers",
                "Analyze deadlifting biomechanics to escape spinal compression"
              ].map((qp, id) => (
                <button 
                  key={id} 
                  onClick={() => handleQuickPrompt(qp)}
                  className="bg-[rgba(255,255,255,0.015)] hover:bg-[rgba(200,255,0,0.04)] border border-[rgba(255,255,255,0.05)] text-left px-3 py-1.5 text-[11px] text-white rounded-[2px] transition-all max-w-full cursor-pointer leading-snug"
                >
                  📄 {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className="flex items-center gap-1.5 mb-1 text-muted-grey text-[9px] font-mono uppercase">
                {msg.role === "user" ? (
                  <>
                    <span>CHAMPION RECTANGLE</span>
                    <User className="w-2.5 h-2.5" />
                  </>
                ) : (
                  <>
                    <Zap className="w-2.5 h-2.5 text-lime" />
                    <span>COACH ARJUN ({chatMode.toUpperCase()})</span>
                  </>
                )}
              </div>
              
              {/* Box body under nice styled bubble */}
              <div 
                className={`max-w-[90%] p-4 leading-relaxed font-body text-xs rounded-[2px] ${msg.role === "user" ? "bg-lime text-bg font-semibold" : "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-white"}`}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Loading bubble visual */}
          {isChatLoading && (
            <div className="flex flex-col items-start">
              <span className="font-mono text-[9px] text-[#6B6B6B] uppercase mb-1">COACH IS THINKING...</span>
              <div className="p-3.5 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-[2px] flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-lime" />
                <span className="font-mono text-[10px] text-lime font-bold tracking-widest uppercase">
                  {chatMode === "pro" ? "ACTIVATING COGNITIVE PRO THOUGHT MATRIX..." : "GENERATING PROTOCOL..."}
                </span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef}></div>
        </div>

        {/* Input area */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-[rgba(255,255,255,0.08)] bg-bg flex items-center gap-2">
          <input 
            type="text" 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Address Coach Arjun..."
            disabled={isChatLoading}
            className="flex-1 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white p-3 text-xs rounded-[2px] focus:outline-none focus:border-lime"
          />
          <button 
            type="submit" 
            disabled={isChatLoading || !inputMessage.trim()}
            className="bg-lime text-bg font-body font-bold text-xs p-3.5 rounded-[2px] hover:bg-[#D4FF1A] transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50"
            title="Transmit Instruction"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>


      {/* INTERACTIVE ATHLETE IMAGE LAB DRAWER (Gemini Image Creator/Editor) */}
      <div className={`fixed top-0 right-0 w-full sm:w-[520px] h-full bg-[#0a0a0add]/95 border-l border-[rgba(255,255,255,0.08)] z-[2001] shadow-2xl transition-transform duration-300 transform ${isImageLabOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}>
        
        {/* Header panel */}
        <div className="p-5 border-b border-[rgba(255,255,255,0.08)] bg-bg/90 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-lime border border-lime flex items-center justify-center font-display text-bg text-[10px]">
              IG
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-xs text-white uppercase tracking-tight">ATH-ART GENERATOR</span>
              <span className="font-mono text-[8px] text-lime font-bold uppercase tracking-wider block mt-0.5">GEMINI FLUX IMAGE SYSTEM</span>
            </div>
          </div>
          <button 
            onClick={() => setIsImageLabOpen(false)}
            aria-label="Close Studio"
            className="text-muted hover:text-white bg-transparent border-none cursor-pointer outline-none transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content flow area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <p className="font-body text-xs text-muted-grey leading-relaxed">
            Generate ultra-premium athletic inspiration wallpapers, design ideas, or customize your physical visualization maps with the Google Gemini Image Node (gemini-3.1-flash-image-preview).
          </p>

          {/* Preview panel */}
          <div className="border border-[rgba(255,255,255,0.08)] bg-black/60 aspect-square w-full relative flex items-center justify-center overflow-hidden">
            {generatedImage ? (
              <>
                <img 
                  src={generatedImage} 
                  alt="Athletic preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <a 
                    href={generatedImage} 
                    download="ironpeak_athlete_inspiration.png"
                    className="p-2.5 bg-bg/90 hover:bg-lime hover:text-bg border border-[rgba(255,255,255,0.1)] text-white transition-all shadow-xl"
                    title="Download raw image"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button 
                    onClick={() => {
                      // Apply generated image as local page element or backdrop trigger for premium ambient experience!
                      document.body.style.backgroundImage = `radial-gradient(ellipse at bottom, rgba(7, 7, 7, 0.95), rgba(7, 7, 7, 0.98)), url(${generatedImage})`;
                      document.body.style.backgroundSize = "cover";
                      document.body.style.backgroundPosition = "center";
                      document.body.style.backgroundAttachment = "fixed";
                      alert("Aesthetic Matrix updated! Target image was mapped to global body background layout.");
                    }}
                    className="p-2.5 bg-bg/90 hover:bg-lime hover:text-bg border border-[rgba(255,255,255,0.1)] text-white transition-all text-[10px] font-mono font-bold shadow-xl"
                  >
                    MAP BACKGROUND
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 text-[#555]">
                <Image className="w-12 h-12 mb-3 text-[rgba(255,255,255,0.06)]" />
                <span className="font-mono text-xs text-muted-grey uppercase tracking-widest font-semibold">STATIC CORE IDLE</span>
                <span className="font-body text-[10px] text-[#555] max-w-[200px] mt-1.5">Write a prompt below to ignite the athletic core generator.</span>
              </div>
            )}

            {/* Loading Cover Overlay */}
            {isImageLoading && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center text-center p-5">
                <Loader2 className="w-8 h-8 animate-spin text-lime mb-4" />
                <span className="font-mono text-xs font-bold text-lime tracking-[0.2em] uppercase">CALIBRATING STAGE VISUALS</span>
                <p className="font-mono text-[9px] text-[#666] mt-1 uppercase max-w-[240px]">
                  "Forging extreme density, light matrices, and raw muscular resolution..."
                </p>
              </div>
            )}
          </div>

          {!generatedImage ? (
            /* FRESH IMAGE CREATOR FORM */
            <form onSubmit={handleGenerateImage} className="space-y-4">
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase flex items-center gap-2">
                <span className="text-lime">1. FORM PROMPT INSTRUCTIONS</span>
              </span>
              
              <div className="space-y-2">
                <textarea 
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="e.g., Close-up of muscular powerlifter dynamic deadlifting in raining dark iron gym, phosphor lime neon flares, intense grit"
                  required
                  rows={3}
                  className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] text-white p-3 text-xs rounded-[2px] focus:outline-none focus:border-lime"
                />
                
                {/* Easy template helper presets */}
                <div className="flex flex-wrap gap-1">
                  {[
                    "Boxer training in heavy Mumbai rain",
                    "Grit powerlifter lifting neon steel",
                    "Aesthetic female athlete posing under glowing lime panels"
                  ].map((tpl, id) => (
                    <button 
                      key={id}
                      type="button"
                      onClick={() => setImagePrompt(tpl)}
                      className="bg-bg border border-[rgba(255,255,255,0.04)] hover:border-lime px-2.5 py-1 text-[9.5px] rounded-[2px] text-muted-grey hover:text-white"
                    >
                      💡 {tpl.substring(0, 30)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio selecting block */}
              <div className="space-y-2">
                <span className="font-mono text-[8.5px] text-muted-grey uppercase tracking-widest block font-bold">2. ASPECT RATIO</span>
                <div className="grid grid-cols-3 gap-2">
                  {["1:1", "16:9", "3:4"].map((ratio) => (
                    <button 
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-2 text-center border font-mono text-[10px] rounded-[2px] hover:border-lime transition-colors ${aspectRatio === ratio ? "border-lime bg-lime/10 text-lime font-bold" : "border-[rgba(255,255,255,0.06)] text-[#777]"}`}
                    >
                      {ratio === "1:1" ? "1:1 SQUARE" : ratio === "16:9" ? "16:9 CINEMATIC" : "3:4 TALL"}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                disabled={isImageLoading || !imagePrompt.trim()}
                className="w-full bg-lime hover:bg-[#D4FF1A] text-bg font-body font-black text-xs tracking-wider uppercase py-4 flex items-center justify-center gap-1.5 cursor-pointer rounded-[2px] disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 fill-bg animate-pulse" /> GENERATE INSPIRATIONAL ART
              </button>
            </form>
          ) : (
            /* IMAGE EDITOR FORM FOR SECONDARY CUSTOMIZATION */
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-[rgba(255,255,255,0.02)] p-3 border border-[rgba(255,255,255,0.05)]">
                <span className="font-mono text-[9px] text-[#777] uppercase">PREVIEW STORED SUCCESSFULLY</span>
                <button 
                  onClick={() => {
                    setGeneratedImage(null);
                    setImagePrompt("");
                  }}
                  className="text-red-500 font-mono text-[9px] uppercase hover:underline cursor-pointer bg-transparent border-none"
                >
                  [ RESET STUDIO ]
                </button>
              </div>

              <div className="bg-[rgba(200,255,0,0.02)] p-4 border border-[rgba(200,255,0,0.12)]">
                <p className="font-mono text-[10px] tracking-[0.22em] uppercase flex items-center gap-2 mb-3">
                  <span className="text-lime">EDIT CURRENT IMAGE WITH TEXT</span>
                </p>
                
                <form onSubmit={handleEditImage} className="space-y-3.5">
                  <textarea 
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Describe modifications (e.g., Add a lightning bolt on the athlete chest, change illumination to purple neon grid overlay)"
                    required
                    rows={2}
                    className="w-full bg-[rgba(7,7,7,0.7)] border border-[rgba(255,255,255,0.08)] text-white p-3 text-xs rounded-[2px] focus:outline-none focus:border-lime"
                  />
                  
                  <button 
                    type="submit"
                    disabled={isImageLoading || !editPrompt.trim()}
                    className="w-full bg-lime hover:bg-[#D4FF1A] text-bg font-body font-black text-xs tracking-wider uppercase py-3.5 flex items-center justify-center gap-1.5 cursor-pointer rounded-[2px] disabled:opacity-50"
                  >
                    <Sliders className="w-4 h-4 text-bg" /> CALIBRATE & EDIT VISUAL
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>

        {/* Footer info panel inside drawer */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.08)] bg-bg text-center font-mono text-[8.5px] text-[#555] uppercase">
          Powered securely by gemini-3.1-flash-image-preview
        </div>

      </div>

    </div>
  );
}
