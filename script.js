const body = document.body;
const header = document.querySelector(".site-header");
const progress = document.querySelector(".scroll-progress");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = [...document.querySelectorAll(".nav-links a")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hero = document.querySelector(".hero");
const heroSticky = document.querySelector(".hero-sticky");
const heroChapters = [...document.querySelectorAll(".hero-chapter")];
const heroPhaseLabels = [...document.querySelectorAll(".hero-phase-rail span")];

const createSiteFlightNetwork = () => {
  const canvas = document.querySelector("#site-flight-network");
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return null;

  const hash = (value) => {
    const result = Math.sin(value * 12.9898) * 43758.5453;
    return result - Math.floor(result);
  };
  const compact = window.innerWidth < 720;
  const routeCount = compact ? 3 : 5;
  const nodeCount = compact ? 18 : 46;
  const nodes = Array.from({ length: nodeCount }, (_, index) => ({
    route: index % routeCount,
    offset: hash(index + 4.3),
    speed: 0.006 + hash(index + 18.7) * 0.006,
    scale: 0.72 + hash(index + 31.2) * 0.62,
  }));
  const stars = Array.from({ length: compact ? 220 : 520 }, (_, index) => ({
    x: hash(index + 70.4),
    y: hash(index + 140.7),
    size: 0.4 + hash(index + 210.9) * 1.15,
    alpha: 0.08 + hash(index + 280.2) * 0.2,
    phase: hash(index + 336.1) * Math.PI * 2,
    hue: hash(index + 366.4) > 0.9 ? "255,232,189" : "173,235,255",
    drift: 0.0004 + hash(index + 391.7) * 0.0011,
  }));
  const meteors = Array.from({ length: compact ? 2 : 4 }, (_, index) => ({
    offset: hash(index + 942.2),
    speed: 0.014 + hash(index + 975.4) * 0.012,
    x: 0.08 + hash(index + 1008.6) * 0.82,
    y: 0.06 + hash(index + 1039.8) * 0.48,
    length: 54 + hash(index + 1071.1) * 92,
    phase: hash(index + 1102.3) * Math.PI * 2,
  }));
  const motionDots = Array.from({ length: compact ? 120 : 340 }, (_, index) => ({
    x: hash(index + 412.6),
    y: hash(index + 496.4),
    speed: 0.0028 + hash(index + 584.7) * 0.009,
    drift: 3 + hash(index + 641.2) * 21,
    size: 0.36 + hash(index + 718.3) * 1.06,
    alpha: 0.025 + hash(index + 793.5) * 0.075,
    phase: hash(index + 851.6) * Math.PI * 2,
    tone: hash(index + 912.8) > 0.88 ? 1 : 0,
  }));
  const routeColors = [
    [173, 235, 255],
    [125, 211, 240],
    [255, 255, 255],
    [77, 175, 214],
    [0, 117, 158],
  ];
  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    scrollProgress: 0,
    scrollVelocity: 0,
  };

  const resize = () => {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    state.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  };

  const routePoint = (route, progressValue, seconds) => {
    const progressValueWrapped = ((progressValue % 1) + 1) % 1;
    const spacing = compact ? 0.29 : 0.16;
    const base = compact ? 0.22 : 0.17;
    const motionTime = seconds * (1 + state.scrollVelocity * 0.44);
    const drift =
      Math.sin(motionTime * 0.05 + route * 1.6) *
      state.height *
      (0.018 + state.scrollVelocity * 0.008);
    return {
      x: -state.width * 0.08 + progressValueWrapped * state.width * 1.16,
      y:
        state.height * (base + route * spacing) +
        Math.sin(
          progressValueWrapped * Math.PI * 2 + route * 1.72 + motionTime * 0.025
        ) *
          state.height *
          0.068 +
        Math.sin(progressValueWrapped * Math.PI * 6 + route * 0.9) *
          state.height *
          0.013 +
        drift,
    };
  };

  const drawDrone = (point, angle, node, color) => {
    const size = (compact ? 5.4 : 6.8) * node.scale;
    context.save();
    context.translate(point.x, point.y);
    context.rotate(angle);
    context.strokeStyle = `rgba(${color.join(",")},0.48)`;
    context.fillStyle = `rgba(${color.join(",")},0.18)`;
    context.lineWidth = 0.72;
    context.beginPath();
    context.ellipse(0, 0, size * 0.3, size * 0.12, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(-size * 0.62, -size * 0.32);
    context.lineTo(size * 0.62, size * 0.32);
    context.moveTo(-size * 0.62, size * 0.32);
    context.lineTo(size * 0.62, -size * 0.32);
    context.stroke();
    [
      [-0.62, -0.32],
      [0.62, 0.32],
      [-0.62, 0.32],
      [0.62, -0.32],
    ].forEach(([x, y]) => {
      context.beginPath();
      context.ellipse(x * size, y * size, size * 0.24, size * 0.09, 0, 0, Math.PI * 2);
      context.stroke();
    });
    context.restore();
  };

  const draw = (milliseconds) => {
    const seconds = milliseconds / 1000;
    context.clearRect(0, 0, state.width, state.height);
    context.globalCompositeOperation = "source-over";

    const networkEnergy = 0.72 + state.scrollVelocity * 0.74;
    stars.forEach((star) => {
      const pulse = 0.58 + Math.sin(seconds * 0.72 + star.phase) * 0.42;
      const x = ((star.x + seconds * star.drift) % 1) * state.width;
      const y = star.y * state.height + Math.sin(seconds * 0.2 + star.phase) * 2.2;
      context.fillStyle = `rgba(${star.hue},${star.alpha * pulse})`;
      context.fillRect(x, y, star.size, star.size);
    });

    meteors.forEach((meteor) => {
      const progress = (seconds * meteor.speed + meteor.offset) % 1;
      const windowed = Math.max(0, 1 - Math.abs(progress - 0.5) / 0.11);
      if (windowed <= 0) return;

      const x = (meteor.x + (progress - 0.5) * 0.34) * state.width;
      const y = (meteor.y + (progress - 0.5) * 0.2) * state.height;
      const tail = meteor.length * windowed;
      context.save();
      context.globalCompositeOperation = "lighter";
      const meteorGlow = context.createLinearGradient(x - tail, y - tail * 0.42, x, y);
      meteorGlow.addColorStop(0, "rgba(173,235,255,0)");
      meteorGlow.addColorStop(0.78, `rgba(173,235,255,${0.1 * windowed})`);
      meteorGlow.addColorStop(1, `rgba(255,255,255,${0.42 * windowed})`);
      context.strokeStyle = meteorGlow;
      context.lineWidth = 0.8 + windowed * 0.7;
      context.beginPath();
      context.moveTo(x - tail, y - tail * 0.42);
      context.lineTo(x, y);
      context.stroke();
      context.restore();
    });

    motionDots.forEach((dot) => {
      const travel = (dot.x + seconds * dot.speed * networkEnergy) % 1;
      const x = travel * state.width;
      const y =
        dot.y * state.height +
        Math.sin(seconds * 0.62 + dot.phase + travel * Math.PI * 5) * dot.drift;
      const pulse = 0.54 + Math.sin(seconds * 1.5 + dot.phase) * 0.46;
      const color = dot.tone ? "255,255,255" : "173,235,255";
      context.fillStyle = `rgba(${color},${dot.alpha * pulse * networkEnergy})`;
      context.fillRect(x, y, dot.size, dot.size);
      if (dot.size > 1.08 && pulse > 0.86) {
        context.fillStyle = `rgba(${color},${dot.alpha * 0.38})`;
        context.fillRect(x - dot.size * 3, y, dot.size * 2, 0.45);
      }
    });

    for (let route = 0; route < routeCount; route += 1) {
      const color = routeColors[route];
      context.beginPath();
      for (let step = 0; step <= 90; step += 1) {
        const point = routePoint(route, step / 90, seconds);
        if (step === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      }
      context.strokeStyle = `rgba(${color.join(",")},${route === routeCount - 1 ? 0.09 : 0.13})`;
      context.lineWidth = 0.72;
      context.setLineDash([1.5, 10]);
      context.stroke();
      context.setLineDash([]);

      const pulseCount = compact ? 4 : 8;
      for (let pulse = 0; pulse < pulseCount; pulse += 1) {
        const pulseProgress =
          (seconds * (0.013 + state.scrollVelocity * 0.008) +
            pulse / pulseCount +
            route * 0.17) %
          1;
        const pulsePoint = routePoint(route, pulseProgress, seconds);
        const size = 0.9 + Math.sin(seconds * 1.6 + pulse * 1.9) * 0.25;
        context.beginPath();
        context.arc(pulsePoint.x, pulsePoint.y, size, 0, Math.PI * 2);
        context.fillStyle = `rgba(${color.join(",")},${0.22 + state.scrollVelocity * 0.14})`;
        context.fill();
      }
    }

    const renderedNodes = nodes.map((node) => {
      const progressValue = node.offset + seconds * node.speed;
      const point = routePoint(node.route, progressValue, seconds);
      const ahead = routePoint(node.route, progressValue + 0.002, seconds);
      return {
        node,
        point,
        angle: Math.atan2(ahead.y - point.y, ahead.x - point.x),
      };
    });

    for (let index = 0; index < renderedNodes.length; index += 1) {
      const current = renderedNodes[index];
      for (let otherIndex = index + 1; otherIndex < renderedNodes.length; otherIndex += 1) {
        const other = renderedNodes[otherIndex];
        if (Math.abs(current.node.route - other.node.route) !== 1) continue;
        const dx = current.point.x - other.point.x;
        const dy = current.point.y - other.point.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 68 || distance > 212) continue;
        const alpha = (1 - (distance - 68) / 144) * 0.072;
        context.beginPath();
        context.moveTo(current.point.x, current.point.y);
        context.lineTo(other.point.x, other.point.y);
        context.strokeStyle = `rgba(99,205,255,${alpha})`;
        context.lineWidth = 0.52;
        context.stroke();
      }
    }

    renderedNodes.forEach(({ node, point, angle }) => {
      drawDrone(point, angle, node, routeColors[node.route]);
    });
    context.globalCompositeOperation = "source-over";
  };

  resize();
  window.addEventListener("resize", resize, { passive: true });

  if (reducedMotion) {
    draw(0);
  } else {
    let lastFrame = -Infinity;
    const animateNetwork = (milliseconds) => {
      if (milliseconds - lastFrame >= 33) {
        draw(milliseconds);
        lastFrame = milliseconds;
      }
      window.requestAnimationFrame(animateNetwork);
    };
    window.requestAnimationFrame(animateNetwork);
  }

  return {
    nodeCount: nodes.length,
    routeCount,
    setScrollProgress(value, velocity) {
      state.scrollProgress = value;
      state.scrollVelocity = velocity;
    },
  };
};

window.siteFlightNetwork = createSiteFlightNetwork();

const programs = {
  vtol: {
    views: {
      twin: {
        image: "assets/enhanced/jet-vtol-cad.jpg",
        alt: "Real CAD structure view of the personal mobility VTOL concept",
        status: "CAD BLUEPRINT / VTOL-01",
      },
      prototype: {
        image: "assets/enhanced/vtol-cabin-white.jpg",
        alt: "Physical personal mobility VTOL cabin and airframe prototype",
        status: "REAL PROJECT IMAGE / VTOL-01",
      },
    },
    kicker: "PERSONAL MOBILITY / HUMAN-CARRYING VTOL",
    title: "Personal Mobility VTOL Platform",
    copy:
      "A flight-demonstrated personal mobility platform connecting cabin packaging, distributed lift, landing supports, propulsion placement, and complete airframe integration.",
    scope: [
      "Cabin and occupant packaging",
      "Distributed propulsion architecture",
      "Prototype integration and flight demonstration",
    ],
    metrics: [
      ["SYSTEM", "VTOL"],
      ["EVIDENCE", "FLIGHT"],
      ["FOCUS", "INTEGRATION"],
    ],
    proof: [
      {
        image: "assets/enhanced/vtol-cabin-white.jpg",
        label: "Cabin prototype",
        caption: "Personal mobility VTOL / cabin and landing structure",
      },
      {
        image: "assets/enhanced/vtol-airframe-hangar.jpg",
        label: "Full airframe",
        caption: "Personal mobility VTOL / full airframe manufacturing",
      },
      {
        image: "assets/enhanced/vtol-propulsion-rig.jpg",
        label: "Propulsion rig",
        caption: "VTOL propulsion and structure integration rig",
      },
    ],
  },
  uav: {
    views: {
      twin: {
        image: "assets/enhanced/magnumwing-top-blueprint.jpg",
        alt: "Real top-view design structure of the fixed-wing cargo UAV",
        status: "BODY BLUEPRINT / CARGO-02",
      },
      prototype: {
        image: "assets/enhanced/fixedwing-field.jpg",
        alt: "Physical fixed-wing UAV prepared on a field runway",
        status: "REAL PROJECT IMAGE / CARGO-02",
      },
    },
    kicker: "MAGNUM WINGS / HEAVY-LIFT CARGO UAV",
    title: "25 kg & 100 kg Payload Platforms",
    copy:
      "Cargo-aircraft development spanning aerodynamic surfaces, topology-led structures, composite airframes, landing gear, payload packaging, and prototype-ready manufacturing definition.",
    scope: [
      "25 kg full airframe ownership",
      "100 kg platform architecture",
      "Landing gear validated to 3g cases",
    ],
    metrics: [
      ["PAYLOAD", "25 / 100 KG"],
      ["LANDING", "UP TO 3G"],
      ["PARTS", "-20%"],
    ],
    proof: [
      {
        image: "assets/enhanced/fixedwing-field.jpg",
        label: "Field airframe",
        caption: "Fixed-wing UAV / field-ready prototype",
      },
      {
        image: "assets/enhanced/structural-cad-wing.jpg",
        label: "Wing structure",
        caption: "Fixed-wing UAV / internal structural architecture",
      },
      {
        image: "assets/enhanced/magnumwing-front-blueprint.jpg",
        label: "Configuration",
        caption: "Fixed-wing UAV / front configuration study",
      },
    ],
  },
  propulsion: {
    views: {
      twin: {
        image: "assets/generated/propulsion-cutaway.jpg",
        alt: "Exploded 3D cutaway visualization of a compact UAV jet propulsion system",
        status: "CUTAWAY BLUEPRINT / AD-03",
      },
      prototype: {
        image: "assets/enhanced/vtol-propulsion-rig.jpg",
        alt: "Physical propulsion and aircraft integration test rig",
        status: "REAL PROJECT IMAGE / AD-03",
      },
    },
    kicker: "APOLLYON DYNAMICS / JET PROPULSION",
    title: "Compact Propulsion Architecture",
    copy:
      "A founder-led R&D direction for compact turbine packaging: intake-to-nozzle flow, compressor and turbine staging, lightweight structures, and ground-test-oriented integration.",
    scope: [
      "Compact mechanical packaging",
      "Compressor-to-nozzle architecture",
      "Test-oriented subsystem integration",
    ],
    metrics: [
      ["CORE", "TURBINE"],
      ["VENTURE", "APOLLYON"],
      ["PHASE", "R&D"],
    ],
    proof: [
      {
        image: "assets/enhanced/jet-vtol-cad.jpg",
        label: "CAD packaging",
        caption: "Propulsion-led VTOL / subsystem packaging study",
      },
      {
        image: "assets/enhanced/vtol-propulsion-rig.jpg",
        label: "Integration rig",
        caption: "Propulsion and airframe integration rig",
      },
      {
        image: "assets/enhanced/quad-uav-prototype.jpg",
        label: "Airframe install",
        caption: "Multirotor prototype / installed propulsion hardware",
      },
    ],
  },
  launch: {
    views: {
      twin: {
        image: "assets/generated/catapult-launch-digital-twin.jpg",
        alt: "Manufactured 3D visualization of the field UAV catapult launcher",
        status: "LAUNCH BLUEPRINT / GS-04",
      },
      prototype: {
        image: "assets/enhanced/catapult-launcher.jpg",
        alt: "Physical mobile truss catapult system for fixed-wing UAV launch",
        status: "REAL PROJECT IMAGE / GS-04",
      },
    },
    kicker: "GROUND SYSTEMS / LAUNCH & LANDING",
    title: "Catapult, Landing Gear & Field Systems",
    copy:
      "A mobile truss launcher, pressure hardware, field chassis, aircraft interface, and landing-system work shaped around deployment, maintainability, and real load paths.",
    scope: [
      "Mobile field-launch architecture",
      "Aircraft-to-launcher interface",
      "Landing gear load-path definition",
    ],
    metrics: [
      ["SYSTEM", "CATAPULT"],
      ["CHASSIS", "MOBILE"],
      ["LANDING", "3G CASES"],
    ],
    proof: [
      {
        image: "assets/enhanced/catapult-launcher.jpg",
        label: "Field launcher",
        caption: "Mobile UAV catapult / supplied project photograph",
      },
      {
        image: "assets/enhanced/fixedwing-field.jpg",
        label: "Aircraft interface",
        caption: "Fixed-wing UAV / field operations context",
      },
      {
        image: "assets/enhanced/multi-uav-lab.jpg",
        label: "Build environment",
        caption: "UAV manufacturing and assembly environment",
      },
    ],
  },
};

let lastScrollTop = window.scrollY;
let lastScrollTime = performance.now();

const updateScrollState = () => {
  const scrollTop = window.scrollY;
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const pageProgress = total > 0 ? scrollTop / total : 0;
  const now = performance.now();
  const elapsed = Math.max(16, now - lastScrollTime);
  const scrollVelocity = Math.min(1, (Math.abs(scrollTop - lastScrollTop) / elapsed) * 0.042);
  lastScrollTop = scrollTop;
  lastScrollTime = now;

  progress.style.width = `${pageProgress * 100}%`;
  header.classList.toggle("scrolled", scrollTop > 28);

  document.documentElement.style.setProperty("--scroll-light-x", `${22 + pageProgress * 58}%`);
  document.documentElement.style.setProperty(
    "--scroll-light-y",
    `${16 + ((pageProgress * 118) % 70)}%`
  );
  document.documentElement.style.setProperty(
    "--scroll-light-opacity",
    `${0.16 + scrollVelocity * 0.16}`
  );
  document.documentElement.style.setProperty(
    "--scroll-light-shift-x",
    `${Math.sin(pageProgress * Math.PI * 3) * 70}px`
  );
  document.documentElement.style.setProperty(
    "--scroll-light-shift-y",
    `${scrollVelocity * -74}px`
  );
  window.siteFlightNetwork?.setScrollProgress(pageProgress, scrollVelocity);

  const heroTravel = Math.max(hero.offsetHeight - window.innerHeight, 1);
  const heroProgress = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / heroTravel));
  const chapterIndex = Math.min(2, Math.floor(heroProgress * 3));
  const fadeStart = Math.max(0, (heroProgress - 0.64) / 0.36);

  heroSticky.style.setProperty("--hero-scale", String(1.01 + heroProgress * 0.05));
  heroSticky.style.setProperty("--hero-image-opacity", String(0.86 - heroProgress * 0.2));
  heroSticky.style.setProperty("--hero-front-opacity", "0");
  heroSticky.style.setProperty("--copy-opacity", String(1 - fadeStart * 0.72));
  heroSticky.style.setProperty("--copy-shift", `${fadeStart * -32}px`);
  heroSticky.style.setProperty("--hero-light-x", `${heroProgress * 180 - 48}px`);
  heroSticky.style.setProperty("--hero-light-y", `${heroProgress * -64}px`);
  heroSticky.style.setProperty("--hero-light-opacity", `${0.32 + (1 - fadeStart) * 0.36}`);

  heroChapters.forEach((chapter, index) => chapter.classList.toggle("active", index === chapterIndex));
  heroPhaseLabels.forEach((label, index) => label.classList.toggle("active", index === chapterIndex));
  window.flightScene?.setProgress(heroProgress);
};

updateScrollState();
window.addEventListener("scroll", updateScrollState, { passive: true });

navToggle.addEventListener("click", () => {
  const open = body.classList.toggle("menu-open");
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    body.classList.remove("menu-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  });
});

document.querySelectorAll(".contact-copy").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copyValue;
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }

    const originalLabel = `Copy ${button.dataset.copyName}`;
    button.classList.add("copied");
    button.setAttribute("aria-label", `${button.dataset.copyName} copied`);
    button.setAttribute("title", `${button.dataset.copyName} copied`);

    window.setTimeout(() => {
      button.classList.remove("copied");
      button.setAttribute("aria-label", originalLabel);
      button.setAttribute("title", originalLabel);
    }, 1800);
  });
});

const contactTopics = [...document.querySelectorAll(".contact-topic")];
const contactPrimary = document.querySelector("[data-contact-primary]");
const contactPrimaryLabel = document.querySelector("[data-contact-primary-label]");
const contactSelection = document.querySelector("[data-contact-selection]");

contactTopics.forEach((topic) => {
  topic.addEventListener("click", () => {
    const selectedTopic = topic.dataset.contactTopic;
    if (!selectedTopic || !contactPrimary || !contactPrimaryLabel || !contactSelection) return;

    contactTopics.forEach((item) => {
      const isSelected = item === topic;
      item.classList.toggle("active", isSelected);
      item.setAttribute("aria-pressed", String(isSelected));
    });

    contactSelection.textContent = selectedTopic;
    contactPrimaryLabel.textContent = `Discuss ${selectedTopic.toLowerCase()}`;
    contactPrimary.href = `mailto:neerajprakash995@gmail.com?subject=${encodeURIComponent(`${selectedTopic} enquiry`)}`;
  });
});

const lightingSections = [
  ...document.querySelectorAll(
    ".founder, .systems, .flight-proof, .evidence, .project-archive, .toolchain, .timeline, .contact"
  ),
];

lightingSections.forEach((section) => {
  const sweep = document.createElement("span");
  sweep.className = "section-light-sweep";
  sweep.setAttribute("aria-hidden", "true");
  section.prepend(sweep);
});

const sections = [
  ...new Set([...document.querySelectorAll("main section[id]"), ...lightingSections]),
];
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("section-lit", entry.isIntersecting);
      if (!entry.isIntersecting) return;
      entry.target.style.zIndex = "50";
      const sectionLight = {
        founder: "0, 129, 174",
        systems: "25, 99, 190",
        "flight-proof": "0, 117, 171",
        evidence: "23, 119, 180",
        timeline: "12, 104, 165",
        contact: "0, 124, 169",
      }[entry.target.id];
      if (sectionLight) {
        document.documentElement.style.setProperty("--section-light-rgb", sectionLight);
      }
      navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${entry.target.id}`;
        link.classList.toggle("active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    });
  },
  { rootMargin: "-40% 0px -52%" }
);
sections.forEach((section) => sectionObserver.observe(section));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

window.setTimeout(() => {
  document
    .querySelectorAll(".reveal:not(.visible)")
    .forEach((element) => element.classList.add("visible"));
}, reducedMotion ? 0 : 850);

if (window.location.hash) {
  const hashTarget = document.querySelector(window.location.hash);
  hashTarget?.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
}

const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.target.dataset.counted) return;
      entry.target.dataset.counted = "true";
      const target = Number(entry.target.dataset.count);
      const prefix = entry.target.dataset.prefix || "";
      const suffix = entry.target.dataset.suffix || "";
      const started = performance.now();
      const duration = reducedMotion ? 1 : 1100;

      const tick = (now) => {
        const value = Math.min(1, (now - started) / duration);
        const eased = 1 - Math.pow(1 - value, 3);
        entry.target.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
        if (value < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.6 }
);
document.querySelectorAll("[data-count]").forEach((element) => countObserver.observe(element));

const programImage = document.querySelector("#program-image");
const twinViewer = document.querySelector(".twin-viewer");
const viewerStatus = document.querySelector("#viewer-status");
const programKicker = document.querySelector("#program-kicker");
const programTitle = document.querySelector("#program-title");
const programCopy = document.querySelector("#program-copy");
const programScope = document.querySelector("#program-scope");
const programProofList = document.querySelector("#program-proof-list");
const programViewButtons = [...document.querySelectorAll("[data-program-view]")];
const metricLabels = [
  document.querySelector("#metric-one-label"),
  document.querySelector("#metric-two-label"),
  document.querySelector("#metric-three-label"),
];
const metricValues = [
  document.querySelector("#metric-one-value"),
  document.querySelector("#metric-two-value"),
  document.querySelector("#metric-three-value"),
];
let currentProgram = "vtol";
let currentProgramView = "prototype";
let programTimer;

const swapProgramImage = (view, viewKey) => {
  window.clearTimeout(programTimer);
  programImage.classList.add("switching");
  twinViewer.classList.toggle("prototype-active", viewKey === "prototype");

  programTimer = window.setTimeout(() => {
    programImage.src = view.image;
    programImage.alt = view.alt;
    viewerStatus.textContent = view.status;
    programImage.onload = () => programImage.classList.remove("switching");
    if (programImage.complete) programImage.classList.remove("switching");
  }, reducedMotion ? 0 : 190);
};

const renderProgramProof = (program) => {
  programProofList.replaceChildren();
  program.proof.forEach((item) => {
    const button = document.createElement("button");
    const image = document.createElement("img");
    const label = document.createElement("span");
    button.type = "button";
    button.dataset.lightbox = item.image;
    button.dataset.caption = item.caption;
    button.setAttribute("aria-label", `Open ${item.caption}`);
    image.src = item.image;
    image.alt = "";
    image.loading = "lazy";
    label.textContent = item.label;
    button.append(image, label);
    programProofList.append(button);
  });
};

const renderProgram = (key, initial = false) => {
  if (!programs[key] || (!initial && key === currentProgram)) return;
  const program = programs[key];
  currentProgram = key;
  currentProgramView = "prototype";
  programKicker.textContent = program.kicker;
  programTitle.textContent = program.title;
  programCopy.textContent = program.copy;
  programScope.replaceChildren(
    ...program.scope.map((item) => {
      const entry = document.createElement("li");
      entry.textContent = item;
      return entry;
    })
  );
  program.metrics.forEach(([label, value], index) => {
    metricLabels[index].textContent = label;
    metricValues[index].textContent = value;
  });
  programViewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.programView === "prototype");
  });
  renderProgramProof(program);
  swapProgramImage(program.views.prototype, "prototype");
};

document.querySelectorAll(".program-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".program-tab").forEach((item) => {
      const active = item === tab;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
    });
    renderProgram(tab.dataset.program);
  });
});

programViewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const viewKey = button.dataset.programView;
    if (!programs[currentProgram].views[viewKey] || viewKey === currentProgramView) return;
    currentProgramView = viewKey;
    programViewButtons.forEach((item) => item.classList.toggle("active", item === button));
    swapProgramImage(programs[currentProgram].views[viewKey], viewKey);
  });
});

renderProgram("vtol", true);

const tiltViewer = twinViewer;
if (tiltViewer && !reducedMotion) {
  tiltViewer.addEventListener("pointermove", (event) => {
    const rect = tiltViewer.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    tiltViewer.style.setProperty("--ry", `${x * 2.8}deg`);
    tiltViewer.style.setProperty("--rx", `${y * -2.2}deg`);
  });
  tiltViewer.addEventListener("pointerleave", () => {
    tiltViewer.style.setProperty("--ry", "0deg");
    tiltViewer.style.setProperty("--rx", "0deg");
  });
}

const dialog = document.querySelector(".image-dialog");
const dialogImage = dialog.querySelector("img");
const dialogCaption = dialog.querySelector("p");
const openImageDialog = (src, alt, caption) => {
  dialogImage.src = src;
  dialogImage.alt = alt;
  dialogCaption.textContent = caption;
  dialog.showModal();
};

document.querySelector(".expand-view").addEventListener("click", () => {
  const program = programs[currentProgram];
  const view = program.views[currentProgramView];
  openImageDialog(view.image, view.alt, view.status);
});

document.addEventListener("click", (event) => {
  const trigger = event.target instanceof Element ? event.target.closest("[data-lightbox]") : null;
  if (!trigger) return;
  const image = trigger.querySelector("img");
  openImageDialog(
    trigger.dataset.lightbox,
    image?.alt || trigger.dataset.caption || "",
    trigger.dataset.caption || ""
  );
});

document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

const flightVideoObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (entry.isIntersecting && !reducedMotion) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  },
  { threshold: 0.45 }
);
document.querySelectorAll(".flight-reel video").forEach((video) => flightVideoObserver.observe(video));

if (!reducedMotion) {
  hero.addEventListener("pointermove", (event) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    heroSticky.style.setProperty("--hero-x", `${x * -16}px`);
    heroSticky.style.setProperty("--hero-y", `${y * -12}px`);
  });

  document.querySelectorAll(".magnetic").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
    });
    element.addEventListener("pointerleave", () => {
      element.style.transform = "";
    });
  });
}

const createFlightScene = () => {
  const canvas = document.querySelector("#flight-space");
  if (!canvas || !window.THREE || reducedMotion) return null;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.set(0, 0, 9.4);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    canvas.hidden = true;
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setClearColor(0x000000, 0);

  const root = new THREE.Group();
  root.position.set(2.3, 0, -0.35);
  root.rotation.set(-0.14, 0.03, 0.34);
  scene.add(root);

  const quality = window.innerWidth < 720 ? 0.66 : 1.42;
  const base = [];
  const colorValues = [];
  const blue = new THREE.Color(0x63d2f3);
  const paleBlue = new THREE.Color(0xadebff);
  const amber = new THREE.Color(0xffffff);
  const red = new THREE.Color(0x8de0f7);

  const addPoint = (x, y, z, accent = 0) => {
    base.push(x, y, z);
    const color =
      accent > 0.86
        ? red
        : accent > 0.7
          ? amber
        : blue.clone().lerp(paleBlue, Math.min(1, accent + Math.random() * 0.34));
    colorValues.push(color.r, color.g, color.b);
  };

  for (let index = 0; index < Math.floor(1750 * quality); index += 1) {
    const y = -2.68 + Math.random() * 5.36;
    const t = (y + 2.68) / 5.36;
    const profile = Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.56);
    const radius = 0.045 + profile * 0.285;
    const angle = Math.random() * Math.PI * 2;
    addPoint(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius,
      t > 0.86 ? 0.82 : Math.abs(Math.cos(angle)) * 0.24
    );
  }

  for (let index = 0; index < Math.floor(2850 * quality); index += 1) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const span = 0.16 + Math.random() * 3.45;
    const spanRatio = span / 3.61;
    const chord = 1.42 - spanRatio * 1.05;
    const x = side * span;
    const centerY = 0.43 - span * 0.145;
    const y = centerY + (Math.random() - 0.5) * chord;
    const z = (Math.random() - 0.5) * (0.035 + (1 - spanRatio) * 0.09);
    addPoint(x, y, z, spanRatio > 0.82 ? 0.88 : Math.random() * 0.35);
  }

  for (let index = 0; index < Math.floor(940 * quality); index += 1) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const span = 0.08 + Math.random() * 1.5;
    const spanRatio = span / 1.58;
    const chord = 0.58 - spanRatio * 0.28;
    addPoint(
      side * span,
      -1.91 - span * 0.025 + (Math.random() - 0.5) * chord,
      (Math.random() - 0.5) * 0.055,
      spanRatio > 0.78 ? 0.8 : 0.16
    );
  }

  for (let index = 0; index < Math.floor(420 * quality); index += 1) {
    const y = -2.25 + Math.random() * 0.98;
    const height = ((-1.27 - y) / 0.98) * 0.82;
    addPoint((Math.random() - 0.5) * 0.055, y, Math.random() * Math.max(0.05, height), 0.28);
  }

  for (let index = 0; index < Math.floor(320 * quality); index += 1) {
    const blade = Math.random() > 0.5 ? 1 : -1;
    const radius = Math.random() * 0.95;
    const horizontal = Math.random() > 0.34;
    addPoint(
      horizontal ? blade * radius : (Math.random() - 0.5) * 0.035,
      -2.73 + (Math.random() - 0.5) * 0.04,
      horizontal ? (Math.random() - 0.5) * 0.035 : blade * radius,
      0.9
    );
  }

  const positions = new Float32Array(base.length);
  const basePositions = new Float32Array(base);
  const flyingWingPositions = new Float32Array(base.length);
  const quadVtolPositions = new Float32Array(base.length);
  const scattered = new Float32Array(base.length);
  const colors = new Float32Array(colorValues);
  const hashValue = (value) => {
    const result = Math.sin(value * 12.9898) * 43758.5453;
    return result - Math.floor(result);
  };

  for (let offset = 0; offset < base.length; offset += 3) {
    const pointIndex = offset / 3;
    const primary = hashValue(pointIndex + 11.7);
    const secondary = hashValue(pointIndex + 37.2);
    const tertiary = hashValue(pointIndex + 71.9);

    if (primary < 0.12) {
      const bodyAngle = secondary * Math.PI * 2;
      const bodyRadius = Math.sqrt(tertiary);
      flyingWingPositions[offset] = Math.cos(bodyAngle) * bodyRadius * 0.42;
      flyingWingPositions[offset + 1] = -1.78 + hashValue(pointIndex + 96.5) * 3.62;
      flyingWingPositions[offset + 2] =
        Math.sin(bodyAngle) * bodyRadius * 0.12;
    } else {
      const side = primary > 0.58 ? 1 : -1;
      const spanRatio = Math.pow(
        hashValue(pointIndex + 124.4),
        0.72
      );
      const span = 0.2 + spanRatio * 3.38;
      const chord = 1.55 - spanRatio * 1.1;
      const sweptCenter = 0.78 - span * 0.37;
      flyingWingPositions[offset] =
        side * span + (hashValue(pointIndex + 151.1) - 0.5) * 0.05;
      flyingWingPositions[offset + 1] =
        sweptCenter + (secondary - 0.5) * chord;
      flyingWingPositions[offset + 2] = (tertiary - 0.5) * 0.09;
    }

    const quadSegment = hashValue(pointIndex + 183.6);
    if (quadSegment < 0.24) {
      const bodyAngle = secondary * Math.PI * 2;
      const radius = Math.sqrt(tertiary);
      quadVtolPositions[offset] = Math.cos(bodyAngle) * radius * 0.72;
      quadVtolPositions[offset + 1] = Math.sin(bodyAngle) * radius * 1.04;
      quadVtolPositions[offset + 2] =
        (hashValue(pointIndex + 211.3) - 0.5) * 0.22;
    } else if (quadSegment < 0.64) {
      const arm = Math.floor(hashValue(pointIndex + 243.8) * 4);
      const signX = arm % 2 === 0 ? -1 : 1;
      const signY = arm < 2 ? -1 : 1;
      const distance = hashValue(pointIndex + 279.2);
      quadVtolPositions[offset] =
        signX * (0.28 + distance * 1.34) + (secondary - 0.5) * 0.07;
      quadVtolPositions[offset + 1] =
        signY * (0.2 + distance * 0.85) + (tertiary - 0.5) * 0.07;
      quadVtolPositions[offset + 2] =
        (hashValue(pointIndex + 307.5) - 0.5) * 0.07;
    } else {
      const rotor = Math.floor(hashValue(pointIndex + 336.7) * 4);
      const centerX = rotor % 2 === 0 ? -1.68 : 1.68;
      const centerY = rotor < 2 ? -1.08 : 1.08;
      const angle = secondary * Math.PI * 2;
      const radius = 0.47 + (tertiary - 0.5) * 0.1;
      quadVtolPositions[offset] = centerX + Math.cos(angle) * radius;
      quadVtolPositions[offset + 1] = centerY + Math.sin(angle) * radius;
      quadVtolPositions[offset + 2] =
        (hashValue(pointIndex + 364.1) - 0.5) * 0.06;
    }
  }
  const shapeTargets = [basePositions, flyingWingPositions, quadVtolPositions];

  for (let index = 0; index < base.length; index += 3) {
    const radius = 2.4 + Math.random() * 5.8;
    const theta = Math.random() * Math.PI * 2;
    const vertical = (Math.random() - 0.5) * 5.8;
    scattered[index] = base[index] + Math.cos(theta) * radius;
    scattered[index + 1] = base[index + 1] + vertical;
    scattered[index + 2] = base[index + 2] + Math.sin(theta) * radius;
    positions[index] = scattered[index];
    positions[index + 1] = scattered[index + 1];
    positions[index + 2] = scattered[index + 2];
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  particleGeometry.getAttribute("position").setUsage(THREE.DynamicDrawUsage);

  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = 64;
  spriteCanvas.height = 64;
  const spriteContext = spriteCanvas.getContext("2d");
  const gradient = spriteContext.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.25, "rgba(255,255,255,0.92)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  spriteContext.fillStyle = gradient;
  spriteContext.fillRect(0, 0, 64, 64);
  const sprite = new THREE.CanvasTexture(spriteCanvas);

  const particleMaterial = new THREE.PointsMaterial({
    size: window.innerWidth < 720 ? 0.056 : 0.047,
    map: sprite,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.NormalBlending,
    depthWrite: false,
    alphaTest: 0.02,
  });
  const aircraftParticles = new THREE.Points(particleGeometry, particleMaterial);
  root.add(aircraftParticles);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xadebff,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
  });
  const orbitRing = new THREE.Mesh(new THREE.RingGeometry(4.15, 4.17, 160), ringMaterial);
  orbitRing.position.set(0, 0, -0.85);
  root.add(orbitRing);

  const starCount = Math.floor(1150 * quality);
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  for (let index = 0; index < starCount; index += 1) {
    starPositions[index * 3] = (Math.random() - 0.5) * 18;
    starPositions[index * 3 + 1] = (Math.random() - 0.5) * 10;
    starPositions[index * 3 + 2] = -1 - Math.random() * 7;
    const color = Math.random() > 0.96 ? red : Math.random() > 0.86 ? amber : blue;
    starColors[index * 3] = color.r;
    starColors[index * 3 + 1] = color.g;
    starColors[index * 3 + 2] = color.b;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
  const starMaterial = new THREE.PointsMaterial({
    size: 0.029,
    map: sprite,
    vertexColors: true,
    transparent: true,
    opacity: 0.72,
    blending: THREE.NormalBlending,
    depthWrite: false,
  });
  const starField = new THREE.Points(starGeometry, starMaterial);
  scene.add(starField);

  const miniDronePositions = [];
  for (let index = 0; index < 48; index += 1) {
    const angle = (index / 48) * Math.PI * 2;
    miniDronePositions.push(Math.cos(angle) * 0.16, Math.sin(angle) * 0.07, 0);
  }
  const rotorCenters = [
    [-0.34, -0.21],
    [0.34, -0.21],
    [-0.34, 0.21],
    [0.34, 0.21],
  ];
  rotorCenters.forEach(([centerX, centerY]) => {
    for (let index = 0; index < 16; index += 1) {
      const ratio = index / 15;
      miniDronePositions.push(centerX * ratio, centerY * ratio, 0);
    }
    for (let index = 0; index < 28; index += 1) {
      const angle = (index / 28) * Math.PI * 2;
      miniDronePositions.push(
        centerX + Math.cos(angle) * 0.105,
        centerY + Math.sin(angle) * 0.105,
        0
      );
    }
  });

  const miniDroneGeometry = new THREE.BufferGeometry();
  miniDroneGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(miniDronePositions, 3)
  );
  const miniDroneMaterial = new THREE.PointsMaterial({
    size: window.innerWidth < 720 ? 0.038 : 0.028,
    map: sprite,
    color: 0xadebff,
    transparent: true,
    opacity: 0.38,
    blending: THREE.NormalBlending,
    depthWrite: false,
  });
  const miniDroneLayout = [
    [-5.6, 2.75, -3.3, 0.62, -0.2],
    [-5.15, -2.35, -4.5, 0.42, 0.28],
    [5.4, 3.05, -3.8, 0.5, 0.18],
    [6.15, -1.75, -5.2, 0.58, -0.36],
    [0.4, 3.8, -5.5, 0.34, 0.1],
    [-6.55, 0.25, -6.2, 0.32, -0.08],
  ];
  const miniDrones = miniDroneLayout
    .slice(0, window.innerWidth < 720 ? 4 : miniDroneLayout.length)
    .map(([x, y, z, scale, rotation], index) => {
      const drone = new THREE.Points(miniDroneGeometry, miniDroneMaterial);
      drone.position.set(x, y, z);
      drone.scale.setScalar(scale);
      drone.rotation.z = rotation;
      drone.userData = {
        baseX: x,
        baseY: y,
        baseRotation: rotation,
        phase: index * 1.17,
        speed: 0.34 + index * 0.035,
      };
      scene.add(drone);
      return drone;
    });

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(rect.height, 1);
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  const pointer = { x: 0, y: 0 };
  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    },
    { passive: true }
  );

  let scrollProgress = 0;
  let sceneActive = true;
  new IntersectionObserver(
    ([entry]) => {
      sceneActive = entry.isIntersecting;
    },
    { threshold: 0 }
  ).observe(hero);

  const setProgress = (value) => {
    scrollProgress = Math.min(1, Math.max(0, value));
  };

  const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);
  const smoothstep = (start, end, value) => {
    const normalized = Math.min(1, Math.max(0, (value - start) / (end - start)));
    return normalized * normalized * (3 - 2 * normalized);
  };

  const clock = new THREE.Clock();
  const morphState = {
    currentShape: 0,
    nextShape: 1,
    morph: 0,
  };
  let lastBlueprintOpacity = 1;
  const animate = () => {
    const elapsed = clock.getElapsedTime();
    if (sceneActive) {
      const assemble = easeOutCubic(Math.min(1, Math.max(0, (elapsed - 0.72) / 2.15)));
      const dissolve = smoothstep(0.58, 1, scrollProgress);
      const cycleTime = Math.max(0, elapsed - 0.4) % 30;
      const shapeIndex = Math.floor(cycleTime / 10);
      const nextShapeIndex = (shapeIndex + 1) % shapeTargets.length;
      const cycleLocal = cycleTime % 10;
      const transitionProgress = smoothstep(7, 10, cycleLocal);
      const targetBlend = cycleLocal < 8.45 ? 0 : 1;
      const shapeOpacity =
        cycleLocal < 7
          ? 1
          : cycleLocal < 8.45
            ? 1 - smoothstep(7, 8.45, cycleLocal)
            : smoothstep(8.45, 10, cycleLocal);
      const sourceShape = shapeTargets[shapeIndex];
      const targetShape = shapeTargets[nextShapeIndex];
      morphState.currentShape = targetBlend === 0 ? shapeIndex : nextShapeIndex;
      morphState.nextShape = nextShapeIndex;
      morphState.morph = transitionProgress;
      const mobileScene = window.innerWidth < 720;
      const blueprintOpacity = mobileScene
        ? 1
        : shapeIndex === 0
          ? cycleLocal < 8.45
            ? shapeOpacity
            : 0
          : nextShapeIndex === 0 && cycleLocal >= 8.45
            ? shapeOpacity
            : 0;
      if (Math.abs(blueprintOpacity - lastBlueprintOpacity) > 0.01) {
        heroSticky.style.setProperty(
          "--blueprint-cycle-opacity",
          blueprintOpacity.toFixed(2)
        );
        lastBlueprintOpacity = blueprintOpacity;
      }
      const interactionX = pointer.x * 4.7 - (window.innerWidth < 720 ? 0 : 1.2);
      const interactionY = pointer.y * 3.15;
      const positionAttribute = particleGeometry.getAttribute("position");
      const values = positionAttribute.array;

      for (let index = 0; index < values.length; index += 3) {
        const bx =
          sourceShape[index] +
          (targetShape[index] - sourceShape[index]) * targetBlend;
        const by =
          sourceShape[index + 1] +
          (targetShape[index + 1] - sourceShape[index + 1]) * targetBlend;
        const bz =
          sourceShape[index + 2] +
          (targetShape[index + 2] - sourceShape[index + 2]) * targetBlend;
        const sx = scattered[index];
        const sy = scattered[index + 1];
        const sz = scattered[index + 2];
        const disintegration = dissolve * (0.22 + Math.abs(bx) * 0.055);
        let x = sx + (bx - sx) * assemble + (sx - bx) * disintegration;
        let y = sy + (by - sy) * assemble + (sy - by) * disintegration;
        let z = sz + (bz - sz) * assemble + (sz - bz) * disintegration;

        const dx = bx - interactionX;
        const dy = by - interactionY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 1.18 && assemble > 0.78 && dissolve < 0.9) {
          const force = (1 - distance / 1.18) * 0.44;
          x += (dx / Math.max(distance, 0.08)) * force;
          y += (dy / Math.max(distance, 0.08)) * force;
          z += force * 0.72;
        }

        const shimmer =
          Math.sin(elapsed * 1.7 + index * 0.021) * (0.012 + dissolve * 0.045);
        const lift =
          Math.cos(elapsed * 1.12 + index * 0.013) * (0.004 + dissolve * 0.016);
        values[index] = x + shimmer;
        values[index + 1] = y + lift;
        values[index + 2] = z;
      }
      positionAttribute.needsUpdate = true;

      const mobile = window.innerWidth < 720;
      const targetX = mobile ? 0 : 2.25 - scrollProgress * 0.72;
      const targetY = mobile ? 1.55 + scrollProgress * 0.18 : Math.sin(elapsed * 0.55) * 0.08;
      root.position.x += (targetX - root.position.x) * 0.045;
      root.position.y += (targetY - root.position.y) * 0.045;
      root.rotation.x +=
        (-0.14 + pointer.y * 0.04 + scrollProgress * 0.1 - root.rotation.x) *
        0.035;
      root.rotation.y +=
        (pointer.x * 0.08 + scrollProgress * 0.12 - root.rotation.y) * 0.035;
      root.rotation.z +=
        (0.34 + pointer.x * 0.04 + scrollProgress * 0.08 - root.rotation.z) *
        0.035;
      const targetScale = (mobile ? 0.77 : 1) + scrollProgress * (mobile ? 0.08 : 0.16);
      root.scale.setScalar(targetScale);
      orbitRing.rotation.z = elapsed * 0.04;
      ringMaterial.opacity = 0.11 + Math.sin(elapsed * 0.7) * 0.025;
      starField.rotation.z = elapsed * 0.006;
      starField.position.x = pointer.x * -0.14;
      starField.position.y = pointer.y * -0.1;
      miniDrones.forEach((drone) => {
        const data = drone.userData;
        drone.position.x = data.baseX + pointer.x * -0.08;
        drone.position.y =
          data.baseY + Math.sin(elapsed * data.speed + data.phase) * 0.12 + pointer.y * -0.05;
        drone.rotation.z =
          data.baseRotation + Math.sin(elapsed * data.speed * 0.7 + data.phase) * 0.08;
      });
      const visibleShape = targetBlend === 0 ? shapeIndex : nextShapeIndex;
      const particlePresence = mobileScene || visibleShape === 0 ? 0 : 1;
      particleMaterial.opacity = Math.max(
        0,
        shapeOpacity * particlePresence * 0.9 - dissolve * 0.15
      );
      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
  };
  animate();

  return { setProgress, miniDroneCount: miniDrones.length, morphState };
};

window.flightScene = createFlightScene();
updateScrollState();
