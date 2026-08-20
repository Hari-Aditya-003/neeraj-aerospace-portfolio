const body = document.body;
const header = document.querySelector(".site-header");
const progress = document.querySelector(".scroll-progress");
const navToggle = document.querySelector(".nav-toggle");
const navLinksContainer = document.querySelector(".nav-links");
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
    hue: hash(index + 366.4) > 0.9 ? "160,205,255" : "173,235,255",
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

const programs = new Map();
let programOrder = [];
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

const mobileNavigation = window.matchMedia("(max-width: 720px)");

const setMenuOpen = (open, { focusFirst = false, restoreFocus = false } = {}) => {
  const menuIsOpen = open && mobileNavigation.matches;
  body.classList.toggle("menu-open", menuIsOpen);
  navToggle.setAttribute("aria-expanded", String(menuIsOpen));
  navToggle.setAttribute("aria-label", menuIsOpen ? "Close menu" : "Open menu");
  navLinksContainer.inert = mobileNavigation.matches && !menuIsOpen;

  if (mobileNavigation.matches) {
    navLinksContainer.setAttribute("aria-hidden", String(!menuIsOpen));
  } else {
    navLinksContainer.removeAttribute("aria-hidden");
  }

  if (menuIsOpen && focusFirst) {
    window.requestAnimationFrame(() => navLinks[0]?.focus());
  } else if (!menuIsOpen && restoreFocus) {
    navToggle.focus();
  }
};

navToggle.addEventListener("click", () => {
  setMenuOpen(!body.classList.contains("menu-open"), { focusFirst: true });
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    setMenuOpen(false);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && body.classList.contains("menu-open")) {
    setMenuOpen(false, { restoreFocus: true });
  }
});

document.addEventListener("pointerdown", (event) => {
  if (body.classList.contains("menu-open") && !header.contains(event.target)) {
    setMenuOpen(false);
  }
});

mobileNavigation.addEventListener("change", () => setMenuOpen(false));
setMenuOpen(false);

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
const programSection = document.querySelector("#systems");
const twinViewer = document.querySelector(".twin-viewer");
const viewerStatus = document.querySelector("#viewer-status");
const programNav = document.querySelector("#program-nav");
const programViewModes = document.querySelector("#viewer-modes");
const programCycleBar = document.querySelector("#viewer-cycle-bar");
const programWatermark = document.querySelector("#program-watermark");
const programAngle = document.querySelector("#viewer-angle");
const programState = document.querySelector("#program-state");
const programSource = document.querySelector("#program-source");
const programKicker = document.querySelector("#program-kicker");
const programTitle = document.querySelector("#program-title");
const programCopy = document.querySelector("#program-copy");
const programScope = document.querySelector("#program-scope");
const programProofList = document.querySelector("#program-proof-list");
let currentProgram = "";
let currentProgramView = "";
let programSwapTimer;
let programCycleTimer;
let programCyclePaused = false;
let programSectionVisible = false;

const getCurrentProgram = () => programs.get(currentProgram);
const getProgramView = (program, viewKey) =>
  program?.views.find((view) => view.key === viewKey);
const hasDimensionLabels = (program, view) =>
  program?.id !== "long-endurance-fixed-wing" && view?.key !== "perspective";

const swapProgramImage = (program, view) => {
  window.clearTimeout(programSwapTimer);
  programImage.classList.add("switching");
  programWatermark.textContent = program.watermark;
  programAngle.textContent = `${view.label.toUpperCase()} / ${program.index}`;
  viewerStatus.textContent = `${view.label.toUpperCase()} VIEW / ${program.category}`;
  twinViewer.classList.toggle("dimension-mask-active", hasDimensionLabels(program, view));
  twinViewer.classList.toggle("dimension-mask-light", program.id === "quad-lift-fuselage");

  programSwapTimer = window.setTimeout(() => {
    const revealImage = () => programImage.classList.remove("switching");
    programImage.onload = revealImage;
    programImage.onerror = () => {
      revealImage();
      viewerStatus.textContent = "VIEW UNAVAILABLE / CHECK PROJECT ASSET";
    };
    programImage.src = view.image;
    programImage.alt = view.alt;
    if (programImage.complete) window.requestAnimationFrame(revealImage);
  }, reducedMotion ? 0 : 150);
};

const renderProgramNav = () => {
  const tabs = programOrder.map((program, index) => {
    const button = document.createElement("button");
    const number = document.createElement("span");
    const copy = document.createElement("span");
    const title = document.createElement("strong");
    const detail = document.createElement("small");

    button.className = "program-tab";
    button.type = "button";
    button.role = "tab";
    button.id = `program-tab-${program.id}`;
    button.dataset.program = program.id;
    button.setAttribute("aria-selected", "false");
    button.setAttribute("aria-controls", "project-viewer");
    button.tabIndex = index === 0 ? 0 : -1;
    number.textContent = program.index;
    title.textContent = program.navTitle;
    detail.textContent = `${program.category} / ${program.navSubtitle}`;
    copy.append(title, detail);
    button.append(number, copy);
    return button;
  });
  programNav.replaceChildren(...tabs);
};

const renderProgramViews = (program) => {
  const buttons = program.views.map((view) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.programView = view.key;
    button.setAttribute("aria-pressed", "false");
    button.textContent = view.label;
    return button;
  });
  programViewModes.replaceChildren(...buttons);
};

const renderProgramProof = (program) => {
  const buttons = program.views.map((view) => {
    const button = document.createElement("button");
    const image = document.createElement("img");
    const label = document.createElement("span");

    button.type = "button";
    button.dataset.programView = view.key;
    button.setAttribute("aria-label", `Show ${view.label.toLowerCase()} view of ${program.title}`);
    image.src = view.image;
    image.alt = "";
    image.loading = "lazy";
    image.classList.toggle("dimensions-hidden", hasDimensionLabels(program, view));
    label.textContent = view.label;
    button.append(image, label);
    return button;
  });
  programProofList.replaceChildren(...buttons);
};

const resetProgramCycleBar = () => {
  programCycleBar.classList.remove("running");
  void programCycleBar.offsetWidth;
  if (!reducedMotion && !programCyclePaused && !document.hidden && programSectionVisible) {
    programCycleBar.classList.add("running");
  }
};

const stopProgramCycle = () => {
  window.clearInterval(programCycleTimer);
  programCycleTimer = undefined;
  programCycleBar.classList.remove("running");
};

const setProgramView = (viewKey, { restart = true } = {}) => {
  const program = getCurrentProgram();
  const view = getProgramView(program, viewKey);
  if (!program || !view) return;

  currentProgramView = view.key;
  programViewModes.querySelectorAll("[data-program-view]").forEach((button) => {
    const active = button.dataset.programView === view.key;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  programProofList.querySelectorAll("[data-program-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.programView === view.key);
  });
  swapProgramImage(program, view);

  const currentIndex = program.views.findIndex((item) => item.key === view.key);
  const nextView = program.views[(currentIndex + 1) % program.views.length];
  if (nextView) {
    const preload = new Image();
    preload.src = nextView.image;
  }

  if (restart) restartProgramCycle();
};

const advanceProgramView = () => {
  const program = getCurrentProgram();
  if (!program || program.views.length < 2) return;
  const currentIndex = Math.max(
    0,
    program.views.findIndex((view) => view.key === currentProgramView)
  );
  const nextView = program.views[(currentIndex + 1) % program.views.length];
  setProgramView(nextView.key, { restart: false });
  resetProgramCycleBar();
};

const restartProgramCycle = () => {
  stopProgramCycle();
  if (reducedMotion || programCyclePaused || document.hidden || !programSectionVisible) return;
  const program = getCurrentProgram();
  if (!program || program.views.length < 2) return;
  resetProgramCycleBar();
  programCycleTimer = window.setInterval(advanceProgramView, 3000);
};

const renderProgram = (key, initial = false) => {
  const program = programs.get(key);
  if (!program || (!initial && key === currentProgram)) return;

  currentProgram = key;
  programKicker.textContent = program.kicker;
  programTitle.textContent = program.title;
  programCopy.textContent = program.description;
  programState.textContent = program.status;
  programState.dataset.state = program.status.toLowerCase().replaceAll(" ", "-");
  programSource.href = program.reference.url;
  programSource.textContent = `${program.reference.label} ↗`;
  programScope.replaceChildren(
    ...program.scope.map((item) => {
      const entry = document.createElement("li");
      entry.textContent = item;
      return entry;
    })
  );

  renderProgramViews(program);
  renderProgramProof(program);

  programNav.querySelectorAll(".program-tab").forEach((tab) => {
    const active = tab.dataset.program === key;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active) twinViewer.setAttribute("aria-labelledby", tab.id);
  });

  const defaultView =
    program.views.find((view) => view.key === "perspective") || program.views[0];
  setProgramView(defaultView.key);
};

const loadProgramCatalog = async () => {
  try {
    const indexResponse = await fetch("assets/projects/index.json");
    if (!indexResponse.ok) throw new Error(`Catalog request failed: ${indexResponse.status}`);
    const metadataPaths = await indexResponse.json();
    const records = await Promise.all(
      metadataPaths.map(async (metadataPath) => {
        const metadataUrl = new URL(`assets/projects/${metadataPath}`, window.location.href);
        const response = await fetch(metadataUrl);
        if (!response.ok) throw new Error(`Project request failed: ${response.status}`);
        const record = await response.json();
        record.views = record.views.map((view) => ({
          ...view,
          image: new URL(view.image, metadataUrl).href,
        }));
        return record;
      })
    );

    programs.clear();
    records.forEach((record) => programs.set(record.id, record));
    programOrder = records;
    renderProgramNav();
    renderProgram(programOrder[0].id, true);
  } catch (error) {
    const message = document.createElement("p");
    message.className = "catalog-loading catalog-error";
    message.textContent = "The project archive could not be loaded.";
    programNav.replaceChildren(message);
    viewerStatus.textContent = "ARCHIVE UNAVAILABLE";
    programCopy.textContent = "Refresh the page from the local web server to reload the project records.";
    console.error(error);
  }
};

programNav.addEventListener("click", (event) => {
  const tab = event.target instanceof Element ? event.target.closest(".program-tab") : null;
  if (!tab) return;
  renderProgram(tab.dataset.program);
});

programNav.addEventListener("keydown", (event) => {
  const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"];
  if (!keys.includes(event.key) || !programOrder.length) return;
  event.preventDefault();
  const currentIndex = Math.max(
    0,
    programOrder.findIndex((program) => program.id === currentProgram)
  );
  let nextIndex = currentIndex;
  if (event.key === "ArrowDown" || event.key === "ArrowRight") {
    nextIndex = (currentIndex + 1) % programOrder.length;
  } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
    nextIndex = (currentIndex - 1 + programOrder.length) % programOrder.length;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = programOrder.length - 1;
  }
  const nextProgram = programOrder[nextIndex];
  renderProgram(nextProgram.id);
  document.querySelector(`[data-program="${nextProgram.id}"]`)?.focus();
});

programViewModes.addEventListener("click", (event) => {
  const button =
    event.target instanceof Element ? event.target.closest("[data-program-view]") : null;
  if (button) setProgramView(button.dataset.programView);
});

programProofList.addEventListener("click", (event) => {
  const button =
    event.target instanceof Element ? event.target.closest("[data-program-view]") : null;
  if (button) setProgramView(button.dataset.programView);
});

twinViewer.addEventListener("pointerenter", (event) => {
  if (event.pointerType !== "mouse") return;
  programCyclePaused = true;
  stopProgramCycle();
});

twinViewer.addEventListener("pointerleave", (event) => {
  if (event.pointerType !== "mouse") return;
  programCyclePaused = false;
  restartProgramCycle();
});

twinViewer.addEventListener("focusin", () => {
  programCyclePaused = true;
  stopProgramCycle();
});

twinViewer.addEventListener("focusout", (event) => {
  if (twinViewer.contains(event.relatedTarget)) return;
  programCyclePaused = false;
  restartProgramCycle();
});

const programVisibilityObserver = new IntersectionObserver(
  ([entry]) => {
    programSectionVisible = entry.isIntersecting;
    if (programSectionVisible) restartProgramCycle();
    else stopProgramCycle();
  },
  { rootMargin: "180px 0px", threshold: 0.05 }
);
programVisibilityObserver.observe(programSection);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopProgramCycle();
  else restartProgramCycle();
});

loadProgramCatalog();

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
const openImageDialog = (src, alt, caption, hideDimensions = false, lightBackground = false) => {
  dialogImage.src = src;
  dialogImage.alt = alt;
  dialogImage.classList.toggle("dimensions-hidden", hideDimensions);
  dialogImage.classList.toggle("dimensions-hidden-light", hideDimensions && lightBackground);
  dialog.classList.toggle("dimensions-hidden-light", hideDimensions && lightBackground);
  dialogCaption.textContent = caption;
  dialog.showModal();
};

document.querySelector(".expand-view").addEventListener("click", () => {
  const program = getCurrentProgram();
  const view = getProgramView(program, currentProgramView);
  if (!program || !view) return;
  openImageDialog(
    view.image,
    view.alt,
    `${program.title} / ${view.label} view`,
    hasDimensionLabels(program, view),
    program.id === "quad-lift-fuselage"
  );
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

const flightProofRecords = [
  {
    index: "01",
    title: "Personal-mobility VTOL demonstrator",
    kicker: "PERSONAL MOBILITY / OUTDOOR FLIGHT",
    label: "FLIGHT DEMONSTRATION / SUPPLIED FOOTAGE",
    duration: "01:17",
    video: "assets/showcase/flight-proof/personal-mobility-vtol.mp4",
    poster: "assets/showcase/flight-proof/personal-mobility-vtol-poster.jpg",
    description:
      "Full-scale distributed-lift vehicle captured in sustained outdoor hover and translation, documenting the integrated cabin, rotor frame, landing structure, and flight-control system.",
    facts: [
      ["EVIDENCE", "SUSTAINED FLIGHT"],
      ["SYSTEM", "DISTRIBUTED LIFT"],
      ["ENVIRONMENT", "OUTDOOR FIELD"],
    ],
  },
  {
    index: "02",
    title: "Aerial mission-feed demonstration",
    kicker: "MISSION SYSTEM / LIVE AERIAL FEED",
    label: "OPERATIONAL VIEW / SUPPLIED FOOTAGE",
    duration: "01:40",
    video: "assets/showcase/flight-proof/aerial-mission-feed.mp4",
    poster: "assets/showcase/flight-proof/aerial-mission-feed-poster.jpg",
    description:
      "Recorded aircraft-view telemetry over mountainous terrain demonstrates live visual awareness, route coverage, and the operational perspective delivered by the airborne platform.",
    facts: [
      ["EVIDENCE", "AIRBORNE FEED"],
      ["MISSION", "AREA OBSERVATION"],
      ["TERRAIN", "MOUNTAINOUS"],
    ],
  },
  {
    index: "03",
    title: "Fixed-wing flight validation",
    kicker: "FIXED WING / AIRBORNE HANDLING",
    label: "FLIGHT VALIDATION / SUPPLIED FOOTAGE",
    duration: "00:06",
    video: "assets/showcase/flight-proof/fixed-wing-flight.mp4",
    poster: "assets/showcase/flight-proof/fixed-wing-flight-poster.jpg",
    description:
      "A compact fixed-wing aircraft is captured in a banked field pass, providing direct visual evidence of airborne stability, control response, and practical outdoor operation.",
    facts: [
      ["EVIDENCE", "AIRBORNE PASS"],
      ["AIRFRAME", "FIXED WING"],
      ["FOCUS", "HANDLING"],
    ],
  },
  {
    index: "04",
    title: "Fixed-wing field flight sequence",
    kicker: "FIELD OPERATIONS / FIXED-WING SORTIE",
    label: "FIELD VALIDATION / SUPPLIED FOOTAGE",
    duration: "00:14",
    video: "assets/showcase/flight-proof/field-launch-validation.mp4",
    poster: "assets/showcase/flight-proof/field-launch-validation-poster.jpg",
    description:
      "Runway-side footage follows a fixed-wing sortie in a real operating environment, connecting ground preparation and launch conditions with the aircraft's airborne phase.",
    facts: [
      ["EVIDENCE", "FIELD SORTIE"],
      ["SYSTEM", "FIXED WING"],
      ["LOCATION", "AIRFIELD"],
    ],
  },
  {
    index: "05",
    title: "Mobile UAV catapult hardware",
    kicker: "GROUND SYSTEM / ASSISTED LAUNCH",
    label: "LAUNCH HARDWARE / SUPPLIED FOOTAGE",
    duration: "00:16",
    video: "assets/showcase/flight-proof/mobile-catapult.mp4",
    poster: "assets/showcase/flight-proof/mobile-catapult-poster.jpg",
    description:
      "A trailer-mounted truss launcher is shown assembled in the field, documenting the adjustable rail, mobile chassis, support structure, and aircraft interface used for assisted launch.",
    facts: [
      ["EVIDENCE", "FIELD HARDWARE"],
      ["SYSTEM", "UAV CATAPULT"],
      ["FORMAT", "MOBILE CHASSIS"],
    ],
  },
  {
    index: "06",
    title: "Propulsion integration rig",
    kicker: "PROPULSION R&D / BENCH INTEGRATION",
    label: "BENCH TEST / SUPPLIED FOOTAGE",
    duration: "00:30",
    video: "assets/showcase/flight-proof/propulsion-rig.mp4",
    poster: "assets/showcase/flight-proof/propulsion-rig-poster.jpg",
    description:
      "Workshop footage exposes a compact propulsion assembly, wiring, support frame, and adjacent airframe structure during hands-on subsystem integration and bench evaluation.",
    facts: [
      ["EVIDENCE", "BENCH ASSEMBLY"],
      ["SYSTEM", "PROPULSION"],
      ["PHASE", "INTEGRATION"],
    ],
  },
  {
    index: "07",
    title: "Solar-panel cleaning robot",
    kicker: "FIELD ROBOTICS / PV MAINTENANCE",
    label: "ROBOTIC OPERATION / SUPPLIED FOOTAGE",
    duration: "01:23",
    video: "assets/showcase/flight-proof/solar-panel-cleaning.mp4",
    poster: "assets/showcase/flight-proof/solar-panel-cleaning-poster.jpg",
    description:
      "The tracked cleaning platform traverses photovoltaic modules while the brush system removes surface debris, showing mobility, edge transition, and cleaning action in an outdoor array.",
    facts: [
      ["EVIDENCE", "LIVE OPERATION"],
      ["SYSTEM", "CLEANING ROBOT"],
      ["SURFACE", "PV ARRAY"],
    ],
  },
  {
    index: "08",
    title: "Multirotor flight test",
    kicker: "MULTIROTOR / LOW-ALTITUDE CONTROL",
    label: "FLIGHT TEST / SUPPLIED FOOTAGE",
    duration: "00:45",
    video: "assets/showcase/flight-proof/multirotor-flight.mp4",
    poster: "assets/showcase/flight-proof/multirotor-flight-poster.jpg",
    description:
      "A multirotor prototype is exercised close to the field, recording take-off, hover, translation, and attitude response during practical low-altitude flight testing.",
    facts: [
      ["EVIDENCE", "CONTROLLED FLIGHT"],
      ["AIRFRAME", "MULTIROTOR"],
      ["FOCUS", "ATTITUDE RESPONSE"],
    ],
  },
  {
    index: "09",
    title: "Lighting and mechanism integration",
    kicker: "MECHATRONICS / FUNCTIONAL CHECK",
    label: "MECHANISM TEST / SUPPLIED FOOTAGE",
    duration: "00:12",
    video: "assets/showcase/flight-proof/mechanism-lighting-test.mp4",
    poster: "assets/showcase/flight-proof/mechanism-lighting-test-poster.jpg",
    description:
      "A compact enclosed prototype demonstrates integrated lighting, actuation, and mechanical movement during a close-range functional check of the assembled device.",
    facts: [
      ["EVIDENCE", "FUNCTION CHECK"],
      ["SYSTEM", "MECHATRONIC"],
      ["FOCUS", "LIGHT + MOTION"],
    ],
  },
  {
    index: "10",
    title: "CAD-to-hardware controller prototype",
    kicker: "PRODUCT DEVELOPMENT / PHYSICAL PROTOTYPE",
    label: "CAD TO HARDWARE / SUPPLIED FOOTAGE",
    duration: "00:08",
    video: "assets/showcase/flight-proof/cad-controller-prototype.mp4",
    poster: "assets/showcase/flight-proof/cad-controller-prototype-poster.jpg",
    description:
      "The physical controller assembly is shown against its CAD model, making the transition from digital packaging and interface design to a working handheld prototype directly visible.",
    facts: [
      ["EVIDENCE", "WORKING PROTOTYPE"],
      ["WORKFLOW", "CAD TO BUILD"],
      ["FORMAT", "HANDHELD"],
    ],
  },
  {
    index: "11",
    title: "Portable mechatronic prototype",
    kicker: "SYSTEM INTEGRATION / PORTABLE RIG",
    label: "HARDWARE DEMONSTRATION / SUPPLIED FOOTAGE",
    duration: "00:10",
    video: "assets/showcase/flight-proof/portable-mechatronic-rig.mp4",
    poster: "assets/showcase/flight-proof/portable-mechatronic-rig-poster.jpg",
    description:
      "A compact portable rig brings structure, motors, wiring, sensors, and radio control into one accessible assembly for field handling and integrated subsystem checks.",
    facts: [
      ["EVIDENCE", "ASSEMBLED RIG"],
      ["SYSTEM", "MECHATRONIC"],
      ["FOCUS", "INTEGRATION"],
    ],
  },
];

const flightProofWall = document.querySelector("#flight-proof-wall");
const portraitFlightProofRecords = new Set(["06", "08", "09", "10", "11"]);
let flightProofVideos = [];
const visibleFlightProofVideos = new Map();
const compactFlightProofPlayback = window.matchMedia("(max-width: 720px)");

const loadFlightProofVideo = (video) => {
  if (video.dataset.loaded === "true") return;
  const source = video.querySelector("source");
  if (!source || !video.dataset.src) return;
  if (video.dataset.poster) video.poster = video.dataset.poster;
  source.src = video.dataset.src;
  video.preload = "metadata";
  video.dataset.loaded = "true";
  video.load();
};

const syncFlightProofPlayback = () => {
  const playbackLimit = compactFlightProofPlayback.matches ? 2 : 3;
  const activeVideos = new Set(
    [...visibleFlightProofVideos.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, playbackLimit)
      .map(([video]) => video)
  );

  flightProofVideos.forEach((video) => {
    const shouldPlay =
      !document.hidden && !reducedMotion && activeVideos.has(video);
    if (shouldPlay) {
      loadFlightProofVideo(video);
      video.play().catch(() => {});
    } else {
      video.pause();
      video.closest(".flight-proof-card")?.classList.remove("is-playing");
    }
  });
};

const flightProofLoadObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      loadFlightProofVideo(entry.target);
      flightProofLoadObserver.unobserve(entry.target);
    });
  },
  { rootMargin: "700px 0px", threshold: 0.01 }
);

const flightProofPlaybackObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.18) {
        visibleFlightProofVideos.set(entry.target, entry.intersectionRatio);
      } else {
        visibleFlightProofVideos.delete(entry.target);
      }
    });
    syncFlightProofPlayback();
  },
  { rootMargin: "80px 0px", threshold: [0, 0.18, 0.45] }
);

const renderFlightProofWall = () => {
  const cards = flightProofRecords.map((record) => {
    const card = document.createElement("article");
    const media = document.createElement("div");
    const video = document.createElement("video");
    const source = document.createElement("source");
    const overlay = document.createElement("div");
    const signal = document.createElement("span");
    const signalDot = document.createElement("i");
    const count = document.createElement("span");
    const copy = document.createElement("div");
    const kicker = document.createElement("p");
    const title = document.createElement("h3");
    const description = document.createElement("p");
    const facts = document.createElement("dl");
    const titleId = `flight-proof-title-${record.index}`;
    const descriptionId = `flight-proof-description-${record.index}`;

    card.className = `flight-proof-card ${
      portraitFlightProofRecords.has(record.index) ? "is-portrait" : "is-landscape"
    }`;
    card.setAttribute("aria-labelledby", titleId);
    media.className = "flight-proof-card-media";
    video.autoplay = false;
    video.defaultMuted = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.dataset.poster = record.poster;
    video.controls = reducedMotion;
    video.dataset.src = record.video;
    video.setAttribute("aria-describedby", descriptionId);
    video.setAttribute("aria-label", `${record.title}, real test video`);
    source.type = "video/mp4";
    video.append(source);

    overlay.className = "flight-proof-card-overlay";
    signal.className = "flight-proof-card-signal";
    signalDot.setAttribute("aria-hidden", "true");
    signal.append(signalDot, "REAL TEST VIDEO");
    count.className = "flight-proof-card-count";
    count.textContent = `${record.index} / ${String(flightProofRecords.length).padStart(2, "0")}`;
    overlay.append(signal, count);
    media.append(video, overlay);

    copy.className = "flight-proof-card-copy";
    kicker.className = "flight-proof-card-kicker";
    kicker.textContent = record.kicker;
    title.id = titleId;
    title.textContent = record.title;
    description.id = descriptionId;
    description.className = "flight-proof-card-description";
    description.textContent = record.description;
    facts.className = "flight-proof-card-facts";
    facts.replaceChildren(
      ...record.facts.map(([labelText, valueText]) => {
        const wrapper = document.createElement("div");
        const label = document.createElement("dt");
        const value = document.createElement("dd");
        label.textContent = labelText;
        value.textContent = valueText;
        wrapper.append(label, value);
        return wrapper;
      })
    );

    const duration = document.createElement("span");
    duration.className = "flight-proof-card-duration";
    duration.textContent = record.duration;
    duration.setAttribute("aria-label", `Duration ${record.duration}`);
    copy.append(kicker, title, description, facts, duration);
    card.append(media, copy);

    video.addEventListener("playing", () => card.classList.add("is-playing"));
    video.addEventListener("waiting", () => card.classList.remove("is-playing"));
    video.addEventListener("error", () => card.classList.add("has-video-error"));
    return card;
  });

  flightProofWall.replaceChildren(...cards);
  flightProofVideos = Array.from(flightProofWall.querySelectorAll("video"));
  flightProofVideos.forEach((video) => {
    flightProofLoadObserver.observe(video);
    flightProofPlaybackObserver.observe(video);
  });
};

renderFlightProofWall();
compactFlightProofPlayback.addEventListener("change", syncFlightProofPlayback);
document.addEventListener("visibilitychange", () => {
  syncFlightProofPlayback();
});

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

  let webglContext;
  try {
    const contextOptions = { alpha: true, antialias: true };
    webglContext =
      canvas.getContext("webgl2", contextOptions) ||
      canvas.getContext("webgl", contextOptions);
  } catch {
    webglContext = null;
  }
  if (!webglContext) {
    canvas.hidden = true;
    return null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.set(0, 0, 9.4);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      context: webglContext,
      alpha: true,
      antialias: true,
    });
  } catch {
    canvas.hidden = true;
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const root = new THREE.Group();
  root.position.set(2.3, 0, -0.35);
  root.rotation.set(-0.09, 0.02, 0.2);
  scene.add(root);

  const quality = window.innerWidth < 720 ? 0.72 : window.innerWidth < 1100 ? 1.18 : 1.52;
  const base = [];
  const colorValues = [];
  const primaryBlue = new THREE.Color(0x1f6feb);
  const softBlue = new THREE.Color(0x78b7ff);
  const white = new THREE.Color(0xffffff);
  const steel = new THREE.Color(0xb8c1c8);
  const cyan = new THREE.Color(0x35d7d0);
  const electricBlue = new THREE.Color(0x4f86ff);
  const iceBlue = new THREE.Color(0x8ad7ff);

  const addPoint = (x, y, z, accent = 0) => {
    base.push(x, y, z);
    const colorRoll = Math.random();
    const color =
      accent > 0.86
        ? primaryBlue
        : accent > 0.7
          ? white
          : colorRoll > 0.78
            ? cyan.clone().lerp(white, 0.28)
            : colorRoll > 0.53
              ? electricBlue.clone().lerp(steel, 0.52)
              : steel
                  .clone()
                  .lerp(softBlue, Math.min(0.38, accent * 0.28 + Math.random() * 0.1));
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

  // Densely sampled aerodynamic edges keep the point cloud legible at a glance.
  for (let index = 0; index < Math.floor(760 * quality); index += 1) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const span = 0.14 + Math.random() * 3.48;
    const spanRatio = span / 3.62;
    const chord = 1.42 - spanRatio * 1.05;
    const centerY = 0.43 - span * 0.145;
    const edge = Math.random() > 0.5 ? 1 : -1;
    addPoint(
      side * span + (Math.random() - 0.5) * 0.018,
      centerY + edge * chord * 0.5 + (Math.random() - 0.5) * 0.018,
      (Math.random() - 0.5) * 0.025,
      spanRatio > 0.76 ? 0.96 : edge > 0 ? 0.78 : 0.64
    );
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

  for (let index = 0; index < Math.floor(280 * quality); index += 1) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const span = 0.07 + Math.random() * 1.53;
    const spanRatio = span / 1.6;
    const chord = 0.58 - spanRatio * 0.28;
    const edge = Math.random() > 0.5 ? 1 : -1;
    addPoint(
      side * span,
      -1.91 - span * 0.025 + edge * chord * 0.5,
      (Math.random() - 0.5) * 0.022,
      spanRatio > 0.72 ? 0.9 : 0.74
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
  const satellitePositions = new Float32Array(base.length);
  const scattered = new Float32Array(base.length);
  const baseColors = new Float32Array(colorValues);
  const flyingWingColors = new Float32Array(base.length);
  const quadVtolColors = new Float32Array(base.length);
  const satelliteColors = new Float32Array(base.length);
  const colors = new Float32Array(baseColors);
  const hashValue = (value) => {
    const result = Math.sin(value * 12.9898) * 43758.5453;
    return result - Math.floor(result);
  };
  const writeColor = (target, offset, color, intensity = 1) => {
    target[offset] = Math.min(1, color.r * intensity);
    target[offset + 1] = Math.min(1, color.g * intensity);
    target[offset + 2] = Math.min(1, color.b * intensity);
  };
  const writePosition = (target, offset, x, y, z) => {
    target[offset] = x;
    target[offset + 1] = y;
    target[offset + 2] = z;
  };
  const droneMotors = [
    { x: -1.42, y: 0.62, z: -0.28, blade: 0.08 },
    { x: 1.38, y: 0.64, z: -0.24, blade: -0.06 },
    { x: -1.82, y: 0.8, z: 0.24, blade: 0.16 },
    { x: 1.76, y: 0.78, z: 0.28, blade: -0.14 },
  ];

  for (let offset = 0; offset < base.length; offset += 3) {
    const pointIndex = offset / 3;
    const primary = hashValue(pointIndex + 11.7);
    const secondary = hashValue(pointIndex + 37.2);
    const tertiary = hashValue(pointIndex + 71.9);

    const detailA = hashValue(pointIndex + 96.5);
    const detailB = hashValue(pointIndex + 124.4);
    const detailC = hashValue(pointIndex + 151.1);

    // 02: blended-wing UAV with real planform, propulsion and control-surface detail.
    if (primary < 0.13) {
      const bodyY = -1.62 + detailA * 3.55;
      const profile = Math.pow(
        Math.max(0.04, Math.sin(((bodyY + 1.62) / 3.55) * Math.PI)),
        0.5
      );
      const angle = secondary * Math.PI * 2;
      const radius = Math.sqrt(tertiary) * profile;
      writePosition(
        flyingWingPositions,
        offset,
        Math.cos(angle) * radius * 0.5,
        bodyY,
        Math.sin(angle) * radius * 0.2
      );
      writeColor(
        flyingWingColors,
        offset,
        bodyY > 1.35 ? white : tertiary > 0.82 ? softBlue : steel,
        bodyY > 1.35 ? 1.1 : 0.94
      );
    } else if (primary < 0.82) {
      const side = detailA > 0.5 ? 1 : -1;
      const spanRatio = Math.pow(detailB, 0.76);
      const span = 0.16 + spanRatio * 3.55;
      const leadingEdge = 1.58 - spanRatio * 2.12;
      const trailingEdge = -1.52 + spanRatio * 0.5;
      const edgeRoll = hashValue(pointIndex + 139.8);
      const chordRatio =
        edgeRoll < 0.14 ? 1 : edgeRoll < 0.28 ? 0 : secondary;
      const y = trailingEdge + (leadingEdge - trailingEdge) * chordRatio;
      const camber =
        Math.sin(chordRatio * Math.PI) * (1 - spanRatio) * 0.14;
      writePosition(
        flyingWingPositions,
        offset,
        side * span + (detailC - 0.5) * 0.025,
        y,
        camber + (tertiary - 0.5) * 0.045
      );
      const onEdge = edgeRoll < 0.28;
      const wingColor =
        spanRatio > 0.9
          ? softBlue
          : onEdge
            ? white
            : spanRatio > 0.58
              ? cyan
              : electricBlue;
      writeColor(flyingWingColors, offset, wingColor, onEdge ? 1.08 : 0.88);
    } else if (primary < 0.9) {
      const side = detailA > 0.5 ? 1 : -1;
      const podY = -0.68 + secondary * 1.58;
      const profile = Math.max(0.08, Math.sin(((podY + 0.68) / 1.58) * Math.PI));
      const angle = tertiary * Math.PI * 2;
      const radius = Math.sqrt(detailC);
      writePosition(
        flyingWingPositions,
        offset,
        side * 0.56 + Math.cos(angle) * radius * profile * 0.2,
        podY,
        0.09 + Math.sin(angle) * radius * profile * 0.15
      );
      writeColor(
        flyingWingColors,
        offset,
        podY > 0.62 ? primaryBlue : podY < -0.48 ? cyan : steel,
        1.02
      );
    } else if (primary < 0.97) {
      const side = detailA > 0.5 ? 1 : -1;
      const spanRatio = 0.18 + detailB * 0.78;
      const span = spanRatio * 3.55;
      const trailingEdge = -1.52 + spanRatio * 0.5;
      writePosition(
        flyingWingPositions,
        offset,
        side * span,
        trailingEdge + 0.1 + (secondary - 0.5) * 0.025,
        0.055 + (tertiary - 0.5) * 0.02
      );
      writeColor(
        flyingWingColors,
        offset,
        spanRatio > 0.82 ? softBlue : white,
        1.08
      );
    } else {
      const side = detailA > 0.5 ? 1 : -1;
      writePosition(
        flyingWingPositions,
        offset,
        side * (3.55 + secondary * 0.14),
        -0.98 + (tertiary - 0.5) * 0.34,
        detailC * 0.58
      );
      writeColor(flyingWingColors, offset, detailA > 0.5 ? primaryBlue : cyan, 1.08);
    }

    // 03: industrial survey quadcopter with a three-quarter hardware silhouette.
    const droneSegment = hashValue(pointIndex + 183.6);
    if (droneSegment < 0.31) {
      const face = Math.floor(detailA * 6);
      let bodyX = -0.92 + secondary * 1.86;
      const noseTaper = bodyX > 0.54 ? 1 - ((bodyX - 0.54) / 0.4) * 0.42 : 1;
      const tailTaper = bodyX < -0.7 ? 1 - ((-0.7 - bodyX) / 0.22) * 0.22 : 1;
      const profile = Math.max(0.56, noseTaper * tailTaper);
      const yExtent = 0.34 * profile;
      const zExtent = 0.28 * profile;
      let bodyY = (tertiary - 0.5) * yExtent * 2;
      let bodyZ = (detailB - 0.5) * zExtent * 2;
      if (face === 0 || face === 1) {
        bodyX = face === 0 ? -0.92 : 0.94;
      }
      if (face === 2 || face === 3) bodyY = face === 2 ? -yExtent : yExtent;
      if (face === 4 || face === 5) bodyZ = face === 4 ? -zExtent : zExtent;
      const edgePoint = detailC < 0.26;
      if (edgePoint && face < 2) bodyY = tertiary > 0.5 ? yExtent : -yExtent;
      if (edgePoint && face >= 2) bodyX = secondary > 0.5 ? 0.94 : -0.92;
      writePosition(quadVtolPositions, offset, bodyX, bodyY, bodyZ);
      writeColor(
        quadVtolColors,
        offset,
        edgePoint
          ? white
          : face > 3 && detailB > 0.72
            ? cyan
            : steel,
        edgePoint ? 1.08 : face > 3 ? 0.94 : 0.86
      );
    } else if (droneSegment < 0.54) {
      const armIndex = Math.floor(detailA * droneMotors.length);
      const motor = droneMotors[armIndex];
      const distance = detailB;
      const startX = motor.x > 0 ? 0.5 : -0.5;
      const startY = 0.18;
      const deltaX = motor.x - startX;
      const deltaY = motor.y - startY;
      const armLength = Math.hypot(deltaX, deltaY);
      const rail = tertiary > 0.5 ? 1 : -1;
      const railOffset = rail * 0.035 + (detailC - 0.5) * 0.018;
      writePosition(
        quadVtolPositions,
        offset,
        startX + deltaX * distance - (deltaY / armLength) * railOffset,
        startY + deltaY * distance + (deltaX / armLength) * railOffset,
        motor.z * 0.22 + (motor.z - motor.z * 0.22) * distance +
          (secondary - 0.5) * 0.035
      );
      writeColor(
        quadVtolColors,
        offset,
        distance > 0.84 ? softBlue : rail > 0 ? steel : cyan,
        distance > 0.84 ? 1.05 : rail > 0 ? 0.9 : 0.84
      );
    } else if (droneSegment < 0.65) {
      const motorIndex = Math.floor(detailA * droneMotors.length);
      const motor = droneMotors[motorIndex];
      const angle = secondary * Math.PI * 2;
      const radius = detailB < 0.58 ? 0.16 : Math.sqrt(tertiary) * 0.15;
      writePosition(
        quadVtolPositions,
        offset,
        motor.x + Math.cos(angle) * radius,
        motor.y + Math.sin(angle) * radius * 0.7,
        motor.z + 0.1 + (detailC - 0.5) * 0.18
      );
      writeColor(
        quadVtolColors,
        offset,
        detailC > 0.72 ? softBlue : detailB < 0.58 ? steel : white,
        detailC > 0.72 ? 1.05 : 0.94
      );
    } else if (droneSegment < 0.86) {
      const motorIndex = Math.floor(detailA * droneMotors.length);
      const motor = droneMotors[motorIndex];
      const bladeSide = secondary > 0.5 ? 1 : -1;
      const direction = motor.blade + (bladeSide < 0 ? Math.PI : 0);
      const distance = 0.13 + detailB * 0.84;
      const taper = 1 - (distance - 0.13) / 0.84;
      const thickness = (tertiary - 0.5) * (0.035 + taper * 0.055);
      writePosition(
        quadVtolPositions,
        offset,
        motor.x + Math.cos(direction) * distance - Math.sin(direction) * thickness,
        motor.y +
          Math.sin(direction) * distance + Math.cos(direction) * thickness,
        motor.z + 0.22 + (detailC - 0.5) * 0.022
      );
      writeColor(
        quadVtolColors,
        offset,
        distance > 0.86 ? softBlue : bladeSide > 0 ? white : steel,
        distance > 0.86 ? 1.06 : bladeSide > 0 ? 1 : 0.88
      );
    } else if (droneSegment < 0.93) {
      const sphereZ = secondary * 2 - 1;
      const sphereRadius = Math.sqrt(Math.max(0, 1 - sphereZ * sphereZ));
      const angle = tertiary * Math.PI * 2;
      const lensPoint = detailA < 0.26;
      if (lensPoint) {
        const lensAngle = detailB * Math.PI * 2;
        writePosition(
          quadVtolPositions,
          offset,
          0.42 + Math.cos(lensAngle) * 0.18,
          -0.52 + Math.sin(lensAngle) * 0.15,
          -0.58 + (detailC - 0.5) * 0.018
        );
      } else {
        writePosition(
          quadVtolPositions,
          offset,
          0.42 + Math.cos(angle) * sphereRadius * 0.28,
          -0.5 + Math.sin(angle) * sphereRadius * 0.24,
          -0.34 + sphereZ * 0.25
        );
      }
      writeColor(
        quadVtolColors,
        offset,
        lensPoint ? electricBlue : detailC > 0.76 ? white : steel,
        lensPoint ? 1.08 : 0.94
      );
    } else {
      const side = detailA > 0.5 ? 1 : -1;
      const structure = detailB;
      if (structure < 0.56) {
        writePosition(
          quadVtolPositions,
          offset,
          -1.02 + secondary * 2.02,
          -0.84 + (tertiary - 0.5) * 0.035,
          side * 0.38 + (detailC - 0.5) * 0.035
        );
      } else {
        const supportX = structure < 0.78 ? -0.58 : 0.58;
        const distance = secondary;
        writePosition(
          quadVtolPositions,
          offset,
          supportX + (tertiary - 0.5) * 0.04,
          -0.14 - distance * 0.7,
          side * (0.18 + distance * 0.2)
        );
      }
      writeColor(quadVtolColors, offset, structure < 0.56 ? steel : white, 0.96);
    }

    // 04: communications satellite with surfaced bus, segmented arrays and dish hardware.
    const satelliteSegment = hashValue(pointIndex + 397.6);
    if (satelliteSegment < 0.28) {
      const face = Math.floor(detailA * 6);
      const xExtent = 0.68;
      const yExtent = 0.76;
      const zExtent = 0.44;
      let x = (secondary - 0.5) * xExtent * 2;
      let y = (tertiary - 0.5) * yExtent * 2;
      let z = (detailC - 0.5) * zExtent * 2;
      if (face === 0 || face === 1) x = face === 0 ? -xExtent : xExtent;
      if (face === 2 || face === 3) y = face === 2 ? -yExtent : yExtent;
      if (face === 4 || face === 5) z = face === 4 ? -zExtent : zExtent;
      const edgeDetail = hashValue(pointIndex + 388.3);
      if (edgeDetail < 0.24) {
        if (face < 2) y = tertiary > 0.5 ? yExtent : -yExtent;
        if (face >= 2 && face < 4) x = secondary > 0.5 ? xExtent : -xExtent;
        if (face > 3) x = secondary > 0.5 ? xExtent : -xExtent;
      }
      writePosition(satellitePositions, offset, x, y, z);
      writeColor(
        satelliteColors,
        offset,
        edgeDetail < 0.24 ? white : face > 3 ? steel : face > 1 ? iceBlue : softBlue,
        edgeDetail < 0.24 ? 1.08 : 0.94
      );
    } else if (satelliteSegment < 0.75) {
      const side = detailA > 0.5 ? 1 : -1;
      const panelU = detailB;
      const segment = Math.min(2, Math.floor(panelU * 3));
      let localU = panelU * 3 - segment;
      let panelV = tertiary;
      const gridDetail = hashValue(pointIndex + 459.7);
      if (gridDetail < 0.18) localU = Math.round(localU * 4) / 4;
      if (gridDetail >= 0.18 && gridDetail < 0.36) {
        panelV = Math.round(panelV * 5) / 5;
      }
      const panelDistance = 0.8 + segment * 1.04 + localU * 0.92;
      writePosition(
        satellitePositions,
        offset,
        side * panelDistance,
        (panelV - 0.5) * 1.02,
        0.08 + (panelDistance - 0.8) * 0.055 + (detailC - 0.5) * 0.025
      );
      writeColor(
        satelliteColors,
        offset,
        gridDetail < 0.36 ? cyan : electricBlue,
        gridDetail < 0.36 ? 1.08 : 0.88 + panelV * 0.1
      );
    } else if (satelliteSegment < 0.86) {
      const angle = secondary * Math.PI * 2;
      const rimPoint = detailA < 0.34;
      const radius = rimPoint ? 0.52 : 0.07 + Math.sqrt(tertiary) * 0.45;
      writePosition(
        satellitePositions,
        offset,
        -0.08 + Math.cos(angle) * radius * 0.92,
        0.93 + Math.sin(angle) * radius * 0.58,
        0.24 + Math.pow(radius / 0.52, 2) * 0.3
      );
      writeColor(
        satelliteColors,
        offset,
        rimPoint ? white : tertiary > 0.58 ? steel : iceBlue,
        rimPoint ? 1.08 : 0.94
      );
    } else if (satelliteSegment < 0.96) {
      const hardware = detailA;
      if (hardware < 0.52) {
        const distance = secondary;
        writePosition(
          satellitePositions,
          offset,
          -0.08 + distance * 0.32 + (tertiary - 0.5) * 0.025,
          0.92 + distance * 0.64,
          0.53 - distance * 0.22
        );
      } else if (hardware < 0.8) {
        const side = tertiary > 0.5 ? 1 : -1;
        writePosition(
          satellitePositions,
          offset,
          side * (0.62 + secondary * 0.18),
          (detailC - 0.5) * 0.08,
          (detailB - 0.5) * 0.08
        );
      } else {
        const strut = Math.floor(tertiary * 3);
        const startAngle = strut * ((Math.PI * 2) / 3) + 0.3;
        const distance = secondary;
        writePosition(
          satellitePositions,
          offset,
          -0.08 + Math.cos(startAngle) * 0.48 * (1 - distance),
          0.93 + Math.sin(startAngle) * 0.28 * (1 - distance) + distance * 0.26,
          0.48 - distance * 0.14
        );
      }
      writeColor(satelliteColors, offset, hardware < 0.52 ? primaryBlue : white, 1.05);
    } else {
      const nozzle = Math.floor(detailA * 4);
      const side = nozzle % 2 === 0 ? -1 : 1;
      const depth = nozzle < 2 ? -1 : 1;
      const distance = secondary;
      const angle = tertiary * Math.PI * 2;
      writePosition(
        satellitePositions,
        offset,
        side * 0.42 + Math.cos(angle) * distance * 0.16,
        -0.86 - distance * 0.34,
        depth * 0.28 + Math.sin(angle) * distance * 0.16
      );
      writeColor(satelliteColors, offset, distance > 0.72 ? primaryBlue : iceBlue, 1.04);
    }
  }

  const compactGeometry = window.innerWidth < 720;
  const droneTilt = compactGeometry ? 0.2 : 0.24;
  const droneTiltCos = Math.cos(droneTilt);
  const droneTiltSin = Math.sin(droneTilt);
  for (let offset = 0; offset < base.length; offset += 3) {
    flyingWingPositions[offset] =
      flyingWingPositions[offset] * (compactGeometry ? 0.72 : 1) -
      (compactGeometry ? 0 : 0.18);
    quadVtolPositions[offset] =
      quadVtolPositions[offset] * (compactGeometry ? 0.78 : 1.02) -
      (compactGeometry ? 0.04 : 1.72);
    const droneY = quadVtolPositions[offset + 1];
    const droneZ = quadVtolPositions[offset + 2];
    quadVtolPositions[offset + 1] =
      (droneY * droneTiltCos - droneZ * droneTiltSin) *
      (compactGeometry ? 0.88 : 1);
    quadVtolPositions[offset + 2] =
      droneY * droneTiltSin + droneZ * droneTiltCos;
    satellitePositions[offset] =
      satellitePositions[offset] * (compactGeometry ? 0.72 : 1) -
      (compactGeometry ? 0.18 : 1.88);
    satellitePositions[offset + 1] *= compactGeometry ? 0.9 : 1;
  }

  const loadDroneReference = () => {
    const droneReference = new Image();
    droneReference.decoding = "async";
    droneReference.addEventListener("load", () => {
      const sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = 384;
      sampleCanvas.height = 256;
      const sampleContext = sampleCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!sampleContext) return;

      sampleContext.clearRect(0, 0, sampleCanvas.width, sampleCanvas.height);
      sampleContext.drawImage(
        droneReference,
        0,
        0,
        sampleCanvas.width,
        sampleCanvas.height
      );
      const imageData = sampleContext.getImageData(
        0,
        0,
        sampleCanvas.width,
        sampleCanvas.height
      ).data;
      const silhouettePixels = [];
      const edgePixels = [];
      const alphaAt = (x, y) =>
        imageData[(y * sampleCanvas.width + x) * 4 + 3];

      for (let y = 1; y < sampleCanvas.height - 1; y += 1) {
        for (let x = 1; x < sampleCanvas.width - 1; x += 1) {
          const alpha = alphaAt(x, y);
          if (alpha < 52) continue;
          const pixelIndex = y * sampleCanvas.width + x;
          silhouettePixels.push(pixelIndex);
          if (
            alphaAt(x - 1, y) < 38 ||
            alphaAt(x + 1, y) < 38 ||
            alphaAt(x, y - 1) < 38 ||
            alphaAt(x, y + 1) < 38
          ) {
            edgePixels.push(pixelIndex);
          }
        }
      }
      if (!silhouettePixels.length) return;

      for (let offset = 0; offset < quadVtolPositions.length; offset += 3) {
        const pointIndex = offset / 3;
        const useEdge = edgePixels.length > 0 && hashValue(pointIndex + 612.4) < 0.34;
        const sourcePixels = useEdge ? edgePixels : silhouettePixels;
        const pixelIndex =
          sourcePixels[
            Math.floor(hashValue(pointIndex + 684.2) * sourcePixels.length)
          ];
        const x = pixelIndex % sampleCanvas.width;
        const y = Math.floor(pixelIndex / sampleCanvas.width);
        const colorIndex = pixelIndex * 4;
        const red = imageData[colorIndex] / 255;
        const green = imageData[colorIndex + 1] / 255;
        const blue = imageData[colorIndex + 2] / 255;
        const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
        const normalizedX =
          (x / (sampleCanvas.width - 1) - 0.5) * 5.55;
        const normalizedY =
          (0.5 - y / (sampleCanvas.height - 1)) * 3.7;
        const jitterX =
          (hashValue(pointIndex + 728.9) - 0.5) * (useEdge ? 0.012 : 0.032);
        const jitterY =
          (hashValue(pointIndex + 764.1) - 0.5) * (useEdge ? 0.012 : 0.032);

        quadVtolPositions[offset] =
          (normalizedX + jitterX) * (compactGeometry ? 0.66 : 0.9) -
          (compactGeometry ? 0.04 : 1.55);
        quadVtolPositions[offset + 1] =
          (normalizedY + jitterY) * (compactGeometry ? 0.66 : 0.86);
        quadVtolPositions[offset + 2] =
          (luminance - 0.45) * 0.5 +
          (hashValue(pointIndex + 811.6) - 0.5) * 0.055;

        const sourceAccent = red > green * 1.2 && red > blue * 1.5 && red > 0.34;
        const coolAccent =
          blue > red * 1.15 && green > red * 1.12 && green > 0.24;
        if (sourceAccent) {
          writeColor(quadVtolColors, offset, softBlue, 0.92 + luminance * 0.18);
        } else if (coolAccent) {
          writeColor(quadVtolColors, offset, cyan, 0.88 + luminance * 0.18);
        } else if (useEdge) {
          writeColor(quadVtolColors, offset, white, 0.68 + luminance * 0.34);
        } else {
          const metal = steel.clone().lerp(white, Math.min(0.72, luminance * 0.82));
          writeColor(quadVtolColors, offset, metal, 0.58 + luminance * 0.5);
        }
      }
    });
    droneReference.src =
      "assets/generated/hero/drone-reference-v1.png?v=20260816-1";
  };
  loadDroneReference();

  const shapeTargets = [
    basePositions,
    flyingWingPositions,
    quadVtolPositions,
    satellitePositions,
  ];
  const shapeColors = [
    baseColors,
    flyingWingColors,
    quadVtolColors,
    satelliteColors,
  ];

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
  particleGeometry.getAttribute("color").setUsage(THREE.DynamicDrawUsage);

  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = 64;
  spriteCanvas.height = 64;
  const spriteContext = spriteCanvas.getContext("2d");
  const gradient = spriteContext.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.16, "rgba(255,255,255,0.98)");
  gradient.addColorStop(0.42, "rgba(255,255,255,0.5)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  spriteContext.fillStyle = gradient;
  spriteContext.fillRect(0, 0, 64, 64);
  const sprite = new THREE.CanvasTexture(spriteCanvas);

  const particleMaterial = new THREE.PointsMaterial({
    size: window.innerWidth < 720 ? 0.064 : 0.054,
    map: sprite,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.NormalBlending,
    depthWrite: false,
    alphaTest: 0.02,
  });
  const haloMaterial = new THREE.PointsMaterial({
    size: window.innerWidth < 720 ? 0.112 : 0.098,
    map: sprite,
    vertexColors: true,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    alphaTest: 0.005,
  });
  const particleHalo = new THREE.Points(particleGeometry, haloMaterial);
  const aircraftParticles = new THREE.Points(particleGeometry, particleMaterial);
  root.add(particleHalo);
  root.add(aircraftParticles);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x4d93ff,
    transparent: true,
    opacity: 0.24,
    side: THREE.DoubleSide,
  });
  const orbitRing = new THREE.Mesh(new THREE.RingGeometry(4.15, 4.17, 160), ringMaterial);
  orbitRing.position.set(0, 0, -0.85);
  root.add(orbitRing);

  const innerRingMaterial = ringMaterial.clone();
  innerRingMaterial.color.setHex(0xffffff);
  innerRingMaterial.opacity = 0.12;
  const innerOrbitRing = new THREE.Mesh(
    new THREE.RingGeometry(3.06, 3.075, 144),
    innerRingMaterial
  );
  innerOrbitRing.position.set(0, 0, -0.82);
  root.add(innerOrbitRing);

  const orbitDotPositions = [];
  for (let index = 0; index < 260; index += 1) {
    if (index % 22 < 15) {
      const angle = (index / 260) * Math.PI * 2;
      orbitDotPositions.push(Math.cos(angle) * 4.72, Math.sin(angle) * 4.72, -0.92);
    }
  }
  const orbitDotGeometry = new THREE.BufferGeometry();
  orbitDotGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(orbitDotPositions, 3)
  );
  const orbitDotMaterial = new THREE.PointsMaterial({
    size: window.innerWidth < 720 ? 0.042 : 0.052,
    map: sprite,
    color: 0x78b7ff,
    transparent: true,
    opacity: 0.62,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const orbitDots = new THREE.Points(orbitDotGeometry, orbitDotMaterial);
  root.add(orbitDots);

  const starCount = Math.floor(1760 * quality);
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  for (let index = 0; index < starCount; index += 1) {
    starPositions[index * 3] = (Math.random() - 0.5) * 18;
    starPositions[index * 3 + 1] = (Math.random() - 0.5) * 10;
    starPositions[index * 3 + 2] = -1 - Math.random() * 7;
    const colorRoll = Math.random();
    const color =
      colorRoll > 0.96
        ? iceBlue
        : colorRoll > 0.88
            ? cyan
            : colorRoll > 0.8
              ? electricBlue
              : colorRoll > 0.67
                ? primaryBlue
                : colorRoll > 0.36
                  ? white
                  : steel;
    starColors[index * 3] = color.r;
    starColors[index * 3 + 1] = color.g;
    starColors[index * 3 + 2] = color.b;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
  const starMaterial = new THREE.PointsMaterial({
    size: window.innerWidth < 720 ? 0.032 : 0.036,
    map: sprite,
    vertexColors: true,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const starField = new THREE.Points(starGeometry, starMaterial);
  scene.add(starField);

  const dustCount = Math.floor((window.innerWidth < 720 ? 150 : 320) * quality);
  const dustPositions = new Float32Array(dustCount * 3);
  const dustColors = new Float32Array(dustCount * 3);
  for (let index = 0; index < dustCount; index += 1) {
    dustPositions[index * 3] = (Math.random() - 0.5) * 15;
    dustPositions[index * 3 + 1] = (Math.random() - 0.5) * 8.5;
    dustPositions[index * 3 + 2] = 0.4 + Math.random() * 4.8;
    const dustPalette = [softBlue, white, cyan, steel];
    const color = dustPalette[Math.floor(Math.random() * dustPalette.length)];
    dustColors[index * 3] = color.r;
    dustColors[index * 3 + 1] = color.g;
    dustColors[index * 3 + 2] = color.b;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  dustGeometry.setAttribute("color", new THREE.BufferAttribute(dustColors, 3));
  const dustMaterial = new THREE.PointsMaterial({
    size: window.innerWidth < 720 ? 0.038 : 0.048,
    map: sprite,
    vertexColors: true,
    transparent: true,
    opacity: 0.54,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const foregroundDust = new THREE.Points(dustGeometry, dustMaterial);
  scene.add(foregroundDust);

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
      const cycleTime =
        Math.max(0, elapsed - 0.4) % (shapeTargets.length * 10);
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
      const sourceColors = shapeColors[shapeIndex];
      const targetColors = shapeColors[nextShapeIndex];
      const colorBlend = smoothstep(7.15, 9.85, cycleLocal);
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
      const colorAttribute = particleGeometry.getAttribute("color");
      const values = positionAttribute.array;
      const liveColors = colorAttribute.array;

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
        if (distance < 1.52 && assemble > 0.78 && dissolve < 0.9) {
          const force = (1 - distance / 1.52) * 0.62;
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
        liveColors[index] =
          sourceColors[index] + (targetColors[index] - sourceColors[index]) * colorBlend;
        liveColors[index + 1] =
          sourceColors[index + 1] +
          (targetColors[index + 1] - sourceColors[index + 1]) * colorBlend;
        liveColors[index + 2] =
          sourceColors[index + 2] +
          (targetColors[index + 2] - sourceColors[index + 2]) * colorBlend;
      }
      positionAttribute.needsUpdate = true;
      colorAttribute.needsUpdate = true;

      const mobile = window.innerWidth < 720;
      const targetX = mobile ? 0 : 2.25 - scrollProgress * 0.72;
      const targetY = mobile ? 1.55 + scrollProgress * 0.18 : Math.sin(elapsed * 0.55) * 0.08;
      root.position.x += (targetX - root.position.x) * 0.045;
      root.position.y += (targetY - root.position.y) * 0.045;
      root.rotation.x +=
        (-0.09 + pointer.y * 0.035 + scrollProgress * 0.07 - root.rotation.x) *
        0.035;
      root.rotation.y +=
        (pointer.x * 0.08 + scrollProgress * 0.12 - root.rotation.y) * 0.035;
      root.rotation.z +=
        (0.2 + pointer.x * 0.035 + scrollProgress * 0.055 - root.rotation.z) *
        0.035;
      const targetScale = (mobile ? 0.77 : 1) + scrollProgress * (mobile ? 0.08 : 0.16);
      root.scale.setScalar(targetScale);
      orbitRing.rotation.z = elapsed * 0.065;
      innerOrbitRing.rotation.z = elapsed * -0.045;
      orbitDots.rotation.z = elapsed * -0.085;
      orbitDots.scale.setScalar(1 + Math.sin(elapsed * 0.86) * 0.012);
      ringMaterial.opacity = 0.2 + Math.sin(elapsed * 0.9) * 0.055;
      innerRingMaterial.opacity = 0.1 + Math.cos(elapsed * 0.72) * 0.035;
      orbitDotMaterial.opacity = 0.5 + Math.sin(elapsed * 1.15) * 0.16;
      starField.rotation.z = elapsed * 0.012;
      starField.position.x = pointer.x * -0.24 + Math.sin(elapsed * 0.16) * 0.08;
      starField.position.y = pointer.y * -0.18 + Math.cos(elapsed * 0.13) * 0.06;
      starMaterial.opacity = 0.72 + Math.sin(elapsed * 0.48) * 0.12;
      foregroundDust.rotation.z = elapsed * -0.018;
      foregroundDust.position.x = pointer.x * -0.46 + Math.cos(elapsed * 0.22) * 0.12;
      foregroundDust.position.y = pointer.y * -0.32 + Math.sin(elapsed * 0.26) * 0.14;
      dustMaterial.opacity = 0.43 + Math.sin(elapsed * 0.78) * 0.13;
      const shapeVisibility = Math.max(0, shapeOpacity - dissolve * 0.16);
      particleMaterial.opacity =
        0.04 + shapeVisibility * (0.9 + Math.sin(elapsed * 1.4) * 0.05);
      haloMaterial.opacity =
        0.02 + shapeVisibility * (0.14 + Math.sin(elapsed * 1.1) * 0.025);
      particleMaterial.size =
        (mobileScene ? 0.064 : 0.054) * (1 + Math.sin(elapsed * 1.25) * 0.055);
      haloMaterial.size =
        (mobileScene ? 0.112 : 0.098) * (1 + Math.sin(elapsed * 1.08) * 0.06);
      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
  };
  animate();

  return { setProgress, shapeCount: shapeTargets.length, morphState };
};

const initializeFlightScene = () => {
  if (window.flightScene || !window.THREE || reducedMotion) return;
  window.flightScene = createFlightScene();
  updateScrollState();
};

const loadFlightEngine = () => {
  if (reducedMotion) return;
  if (window.THREE) {
    initializeFlightScene();
    return;
  }

  const engine = document.createElement("script");
  engine.src = "assets/vendor/three.min.js?v=20260801-4";
  engine.async = true;
  engine.fetchPriority = "low";
  engine.addEventListener("load", initializeFlightScene, { once: true });
  engine.addEventListener(
    "error",
    () => {
      const canvas = document.querySelector("#flight-space");
      if (canvas) canvas.hidden = true;
    },
    { once: true }
  );
  document.head.append(engine);
};

const scheduleFlightEngine = () => {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(loadFlightEngine, { timeout: 900 });
  } else {
    window.setTimeout(loadFlightEngine, 250);
  }
};

if (document.readyState !== "complete") {
  window.addEventListener("load", scheduleFlightEngine, { once: true });
} else {
  scheduleFlightEngine();
}

updateScrollState();
