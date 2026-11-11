/**
 * main.js — UUD RIS (1949–1950) Editorial Landing Page
 *
 * Smooth scroll engine: Lenis Smooth Scroll synchronized 1:1 with GSAP ScrollTrigger.
 * Zero manual window scroll listeners — every scroll animation runs through GSAP ticker + RAF.
 */

(function () {
  'use strict';

  var lenisInstance = null;

  /* ─────────────────────────────────────────────────────
     Poll until GSAP + ScrollTrigger are ready
  ─────────────────────────────────────────────────────── */
  function waitForGSAP(cb) {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      cb();
    } else {
      setTimeout(function () { waitForGSAP(cb); }, 50);
    }
  }

  /* ─────────────────────────────────────────────────────
     0. GLOBAL: LENIS SMOOTH SCROLL + GSAP SCROLLTRIGGER SYNC
     Eliminates stepped/jumpy browser wheel & aligns all ScrollTriggers
  ─────────────────────────────────────────────────────── */
  function initLenisScroll() {
    gsap.registerPlugin(ScrollTrigger);

    if (typeof Lenis !== 'undefined') {
      var lenis = new Lenis({
        duration: 1.25,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        smoothWheel: true
      });

      // Wajib: Sinkronkan Lenis dengan GSAP ScrollTrigger
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);

      lenisInstance = lenis;

      // Smooth anchor links via Lenis instead of abrupt native jump
      document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
          var href = anchor.getAttribute('href');
          if (!href || href === '#') return;
          var target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            lenis.scrollTo(target, { duration: 1.35 });
          }
        });
      });
    }
  }

  /* ─────────────────────────────────────────────────────
     GLOBAL SCROLL PROGRESS BAR (GSAP ScrollTrigger Scrub)
  ─────────────────────────────────────────────────────── */
  function initProgressBar() {
    var bar = document.getElementById('progressBar');
    if (!bar) return;

    gsap.set(bar, { scaleX: 0, transformOrigin: 'left center' });
    gsap.to(bar, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.2,
        invalidateOnRefresh: true
      }
    });
  }

  /* ─────────────────────────────────────────────────────
     1. HERO SHRINK ZONE (#shrinkZone)
     • Single unified GSAP Timeline with scrub: 1.2 (inertia damping)
     • All visual elements (.hero-card, .behind-text-container,
       .section-header, #heroSignature) choreographed smoothly
       without manual if (progress > ...) pop-in conditions
  ─────────────────────────────────────────────────────── */
  function initShrinkAnimation() {
    var card         = document.getElementById('heroCard');
    var shrinkZone   = document.getElementById('shrinkZone');
    var behindBox    = document.getElementById('behindTextContainer');
    var secHeader    = document.getElementById('sectionHeader');
    var signature    = document.getElementById('heroSignature');
    var signatureImg = signature ? signature.querySelector('.hero-card__signature-img') : null;

    if (!card || !shrinkZone) return;

    var TARGET_SCALE  = 0.68;
    var TARGET_RADIUS = '22px';
    var NAV_OFFSET    = 8;

    /* Initial states controlled directly by GSAP (no CSS transition conflicts) */
    if (behindBox) {
      gsap.set(behindBox, { autoAlpha: 0, scale: 0.96 });
    }
    if (secHeader) {
      gsap.set(secHeader, { autoAlpha: 0, y: -14 });
    }
    if (signature) {
      gsap.set(signature, {
        autoAlpha: 0,
        xPercent: -50,
        yPercent: -44,
        scale: 0.92
      });
    }
    if (signatureImg) {
      gsap.set(signatureImg, {
        clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)'
      });
    }

    /* Navbar dark-active toggle triggered via ScrollTrigger boundary */
    ScrollTrigger.create({
      trigger: shrinkZone,
      start: 'top -4%',
      endTrigger: document.documentElement,
      end: 'bottom bottom',
      onEnter: function () { document.body.classList.add('dark-active'); },
      onLeaveBack: function () { document.body.classList.remove('dark-active'); }
    });

    /* Unified ScrollTrigger Timeline with inertia damping (scrub: 1.2) */
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: shrinkZone,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2,
        invalidateOnRefresh: true
      }
    });

    /* Phase 1: Card shrinks smoothly into center */
    tl.to(card, {
      scale: TARGET_SCALE,
      borderRadius: TARGET_RADIUS,
      y: NAV_OFFSET,
      duration: 0.72,
      ease: 'power2.inOut'
    }, 0);

    /* Phase 2: Infinite marquee text behind card fades in continuously */
    if (behindBox) {
      tl.to(behindBox, {
        autoAlpha: 1,
        scale: 1,
        duration: 0.42,
        ease: 'power2.out'
      }, 0.08);
    }

    /* Phase 3: Top section header slides & fades in */
    if (secHeader) {
      tl.to(secHeader, {
        autoAlpha: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out'
      }, 0.14);
    }

    /* Phase 4: Gold signature fades, centers, and reveals handwriting stroke */
    if (signature) {
      tl.to(signature, {
        autoAlpha: 1,
        yPercent: -50,
        scale: 1,
        duration: 0.42,
        ease: 'power2.out'
      }, 0.24);
    }
    if (signatureImg) {
      tl.to(signatureImg, {
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        duration: 0.56,
        ease: 'power2.inOut'
      }, 0.28);
    }
  }

  /* ─────────────────────────────────────────────────────
     2. CONTENT SECTION (#content · Repository of Remnants)
     • .highline-block uses ease: 'expo.inOut' for sharp sweep + silky brake
     • .fade-text-sm uses Fade + Translate (y: 35 → 0, stagger: 0.12, power3.out)
  ─────────────────────────────────────────────────────── */
  function initContentAnimations() {
    /* 1. Large Text: High Line Reveal (Block Highlighter Wipe #D4AF37) */
    var reveals = document.querySelectorAll('.highline-reveal');
    reveals.forEach(function (el, index) {
      var block = el.querySelector('.highline-block');
      var text  = el.querySelector('.highline-text');
      if (!block || !text) return;

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top 86%',
          toggleActions: 'play none none none'
        }
      });

      /* Step 1: Balok emas #D4AF37 menyapu melintasi teks kiri → kanan (expo.inOut) */
      tl.fromTo(block,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.72, ease: 'expo.inOut', delay: (index % 2) * 0.1 }
      )
      /* Step 2: Teks terungkap saat balok menutupi area teks */
      .set(text, { opacity: 1 }, '-=0.14')
      /* Step 3: Balok emas menyusut wipe keluar ke kanan (expo.inOut) */
      .to(block, {
        scaleX: 0,
        transformOrigin: 'right center',
        duration: 0.72,
        ease: 'expo.inOut'
      });
    });

    /* 2. Small Text & Elements: Fade + Vertical Translate stagger */
    var smallTexts = document.querySelectorAll('.fade-text-sm');
    if (smallTexts.length) {
      gsap.set(smallTexts, { opacity: 0, y: 35 });

      ScrollTrigger.batch(smallTexts, {
        start: 'top 88%',
        once: true,
        onEnter: function (batch) {
          gsap.fromTo(batch,
            { opacity: 0, y: 35 },
            {
              opacity: 1,
              y: 0,
              duration: 1,
              stagger: 0.12,
              ease: 'power3.out',
              overwrite: 'auto'
            }
          );
        }
      });
    }
  }

  /* ─────────────────────────────────────────────────────
     2B. SCRUBBED COLOR INTERPOLATION (Sections 2 ↔ 3 ↔ 4)
     • Smooth pixel-by-pixel RGB/Hex mixing via GSAP ScrollTrigger scrub
     • Section 2 (#content: #0b0a09) → Section 3 (#indikator-section: #FAF8F5)
       → Section 4 (#horizontalScrollSection: #0b0a09)
     • At exact 50% border midpoint, background pauses seamlessly at
       50% obsidian + 50% ivory = rgb(131, 129, 127)
  ─────────────────────────────────────────────────────── */
  function initScrubbedThemeInterpolation() {
    var indikatorSection  = document.getElementById('indikator-section');
    var horizontalSection = document.getElementById('horizontalScrollSection');
    if (!indikatorSection) return;

    var mixBg           = gsap.utils.interpolate('#0b0a09', '#FAF8F5');
    var mixInk          = gsap.utils.interpolate('#FAF8F5', '#161514');
    var mixNavInk       = gsap.utils.interpolate('#FFFFFF', '#161514');
    var mixNavBorder    = gsap.utils.interpolate('rgba(255, 255, 255, 0.35)', 'rgba(22, 21, 20, 0.35)');
    var mixBodyCol      = gsap.utils.interpolate('rgba(255, 255, 255, 0.62)', '#4a4744');
    var mixMuted        = gsap.utils.interpolate('rgba(255, 255, 255, 0.42)', '#7D8490');
    var mixTickerBg     = gsap.utils.interpolate('rgba(255, 255, 255, 0.00)', 'rgba(255, 255, 255, 0.50)');
    var mixTickerBorder = gsap.utils.interpolate('rgba(255, 255, 255, 0.08)', 'rgba(22, 21, 20, 0.10)');
    var mixTickerText   = gsap.utils.interpolate('rgba(255, 255, 255, 0.45)', 'rgba(22, 21, 20, 0.75)');
    var mixMetaBg       = gsap.utils.interpolate('rgba(255, 255, 255, 0.00)', 'rgba(255, 255, 255, 0.60)');
    var mixMetaBorder   = gsap.utils.interpolate('rgba(255, 255, 255, 0.15)', 'rgba(22, 21, 20, 0.20)');
    var mixMetaHoverBg  = gsap.utils.interpolate('rgba(255, 255, 255, 0.08)', '#FFFFFF');
    var mixMetaHoverBdr = gsap.utils.interpolate('rgba(255, 255, 255, 0.45)', 'rgba(22, 21, 20, 0.60)');
    var mixCtaSecondary = gsap.utils.interpolate('rgba(255, 255, 255, 0.48)', 'rgba(22, 21, 20, 0.60)');
    var mixGoldAccent   = gsap.utils.interpolate('#F3E5AB', '#9A7B2C');

    var enterState = { progress: 0 };
    var exitState  = { progress: 0 };
    var rootStyle  = document.documentElement.style;

    function applyThemeMix() {
      var t = Math.max(0, Math.min(1, enterState.progress - exitState.progress));

      // Ink transitions across a smoothstep curve slightly after t=0.50 so headings
      // remain crisp and legible on the 50% brownish-grey border mix rgb(131,129,127)
      var rawInk = gsap.utils.clamp(0, 1, (t - 0.56) / 0.24);
      var inkT   = rawInk * rawInk * (3 - 2 * rawInk);

      rootStyle.setProperty('--scene-bg',          mixBg(t));
      rootStyle.setProperty('--scene-ink',         mixInk(inkT));
      rootStyle.setProperty('--scene-nav-ink',     mixNavInk(inkT));
      rootStyle.setProperty('--scene-nav-border',  mixNavBorder(inkT));
      rootStyle.setProperty('--scene-body',        mixBodyCol(inkT));
      rootStyle.setProperty('--scene-muted',       mixMuted(inkT));
      rootStyle.setProperty('--scene-ticker-bg',   mixTickerBg(inkT));
      rootStyle.setProperty('--scene-ticker-bdr',  mixTickerBorder(inkT));
      rootStyle.setProperty('--scene-ticker-txt',  mixTickerText(inkT));
      rootStyle.setProperty('--scene-meta-bg',     mixMetaBg(inkT));
      rootStyle.setProperty('--scene-meta-bdr',    mixMetaBorder(inkT));
      rootStyle.setProperty('--scene-meta-hbg',    mixMetaHoverBg(inkT));
      rootStyle.setProperty('--scene-meta-hbdr',   mixMetaHoverBdr(inkT));
      rootStyle.setProperty('--scene-cta-sec',     mixCtaSecondary(inkT));
      rootStyle.setProperty('--scene-gold-accent', mixGoldAccent(inkT));
      rootStyle.setProperty('--scene-light',       t.toFixed(4));
    }

    applyThemeMix();

    // Morph 1: #content (#0b0a09) → #indikator-section (#FAF8F5)
    // Symmetrical 100vh scrub: top 50% (border center) === exact 50% RGB mix
    gsap.to(enterState, {
      progress: 1,
      ease: 'none',
      onUpdate: applyThemeMix,
      scrollTrigger: {
        trigger: indikatorSection,
        start: 'top bottom',
        end: 'top top',
        scrub: true,
        invalidateOnRefresh: true,
        onLeave: function () { enterState.progress = 1; applyThemeMix(); },
        onLeaveBack: function () { enterState.progress = 0; applyThemeMix(); },
        onRefresh: function (self) { enterState.progress = self.progress; applyThemeMix(); }
      }
    });

    // Morph 2: #indikator-section (#FAF8F5) → #horizontalScrollSection (#0b0a09)
    if (horizontalSection) {
      gsap.to(exitState, {
        progress: 1,
        ease: 'none',
        onUpdate: applyThemeMix,
        scrollTrigger: {
          trigger: horizontalSection,
          start: 'top bottom',
          end: 'top top',
          scrub: true,
          invalidateOnRefresh: true,
          onLeave: function () { exitState.progress = 1; applyThemeMix(); },
          onLeaveBack: function () { exitState.progress = 0; applyThemeMix(); },
          onRefresh: function (self) { exitState.progress = self.progress; applyThemeMix(); }
        }
      });
    }
  }

  /* ─────────────────────────────────────────────────────
     3. SECTION 3: SCROLL-LINKED SVG PATH DRAWING (GSAP ScrollTrigger)
     • Synchronized cleanly with Lenis + GSAP (no manual window scroll listener)
     • Draws #scroll-drawn-path smoothly with scrub damping
     • Highlights touched indicator cards along scroll progress
  ─────────────────────────────────────────────────────── */
  function initScrollLinkedPathDrawing() {
    var path    = document.getElementById('scroll-drawn-path');
    var section = document.getElementById('indikator-section');
    var cards   = document.querySelectorAll('.indicator-card');
    if (!path || !section) return;

    var pathLength = path.getTotalLength();
    gsap.set(path, {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength
    });

    /* Proportional SVG gold path drawing scrubbed smoothly with GSAP + Lenis */
    gsap.to(path, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top 55%',
        end: 'bottom 65%',
        scrub: 0.9,
        invalidateOnRefresh: true,
        onRefresh: function () {
          pathLength = path.getTotalLength();
          path.style.strokeDasharray = pathLength;
        },
        onUpdate: function (self) {
          var scrollPercentage = self.progress;
          var rect = section.getBoundingClientRect();
          var windowHeight = window.innerHeight;

          cards.forEach(function (card) {
            var cardRect = card.getBoundingClientRect();
            var cardRelativeTop = cardRect.top - rect.top;
            var sectionProgressAtCard = rect.height > 0 ? cardRelativeTop / rect.height : 0;

            if (scrollPercentage >= sectionProgressAtCard * 0.92 && cardRect.top < windowHeight * 0.8 && cardRect.bottom > windowHeight * 0.12) {
              card.classList.add('is-touched');
            } else {
              card.classList.remove('is-touched');
            }
          });
        }
      }
    });
  }

  /* ─────────────────────────────────────────────────────
     4. SECTION 4: PINNED HORIZONTAL PHOTO SCROLL
     • Decoupled Pinning + Early Horizontal Motion (`start: 'top bottom'`)
     • Photos already glide sideways as section enters from viewport bottom,
       then lock seamlessly at `top top` (`anticipatePin: 1`)
     • Long editorial track across 8 scattered clusters (16 photos)
     • Subtle topographic contour parallax drift (`scrub: 1.4`)
     • Pure immersion: Navbar & Progress bar fade away
  ─────────────────────────────────────────────────────── */
  function initHorizontalPhotoScroll() {
    var section    = document.getElementById('horizontalScrollSection');
    var track      = document.getElementById('horizontalTrack');
    var contourSvg = section ? section.querySelector('.horizontal-bg-contours svg') : null;

    if (!section || !track) return;

    function getScrollDistance() {
      var viewportWidth = section.clientWidth || window.innerWidth;
      var distance = track.scrollWidth - viewportWidth;
      return distance > 0 ? distance : 0;
    }

    function getPinLength() {
      return Math.max(Math.round(getScrollDistance() * 1.35), 4200);
    }

    // 1. Trigger KHUSUS untuk PINNING (Mengunci layar saat section penuh di layar)
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: function () {
        return '+=' + getPinLength();
      },
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onToggle: function (self) {
        if (self.isActive) {
          document.body.classList.add('in-horizontal-scroll');
        } else {
          document.body.classList.remove('in-horizontal-scroll');
        }
      }
    });

    // 2. Tween KHUSUS untuk GERAK KE SAMPING (Langsung jalan sejak section terlihat di bawah)
    gsap.fromTo(
      track,
      {
        x: function () {
          return window.innerWidth * 0.12;
        }
      },
      {
        x: function () {
          return -getScrollDistance();
        },
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: function () {
            return '+=' + (getPinLength() + window.innerHeight);
          },
          scrub: 1.1,
          invalidateOnRefresh: true
        }
      }
    );

    // 3. Parallax cincin kontur emas latar belakang (ikut jalan sejak muncul di bawah)
    if (contourSvg) {
      gsap.to(contourSvg, {
        xPercent: -14,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: function () {
            return '+=' + (getPinLength() + window.innerHeight);
          },
          scrub: 1.4,
          invalidateOnRefresh: true
        }
      });
    }
  }

  /* ─────────────────────────────────────────────────────
     5. HIGH-LINE TEXT WIPE REVEAL (Constitutional Quote Section)
     Gold block sweeps left→right then vanishes (scaleX 1 → 0)
  ─────────────────────────────────────────────────────── */
  function initHighLineTextReveal() {
    var section = document.getElementById('highlineTextSection');
    if (!section) return;

    var lines = section.querySelectorAll('.ht-line');
    if (!lines.length) return;

    lines.forEach(function (line, idx) {
      var wipe = line.querySelector('.ht-wipe');
      var text = line.querySelector('.ht-text');
      if (!wipe || !text) return;

      gsap.set(wipe, { scaleX: 1, transformOrigin: 'left center' });
      gsap.set(text, { opacity: 0 });

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: line,
          start: 'top 82%',
          toggleActions: 'play none none none'
        }
      });

      tl.to(text, { opacity: 1, duration: 0.01 }, 0)
        .to(wipe, {
          scaleX: 0,
          transformOrigin: 'right center',
          duration: 1.05,
          ease: 'expo.inOut',
          delay: idx * 0.2
        }, 0);
    });
  }

  /* ─────────────────────────────────────────────────────
     6. SCROLL-REVEAL FADE + TRANSLATE (Last 3 Sections)
     • Section 5 (#splitDualSection): Dual headers + staggered cockpit cards
     • Section 6 (#federationSection): Header, filters & per-row 16-card batch
     • Section 7 (#cinematicFooter): Notched footer shell, brand, nav & bottom bar
  ─────────────────────────────────────────────────────── */
  function initLastThreeSectionsReveal() {
    var splitSection = document.getElementById('splitDualSection');
    var fedSection   = document.getElementById('federationSection');
    var footer       = document.getElementById('cinematicFooter');

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.split-card, .fed-card').forEach(function (card) {
        card.classList.add('sr-ready');
      });
      return;
    }

    function revealGroup(nodeList, triggerEl, opts) {
      var elements = nodeList ? Array.prototype.slice.call(nodeList) : [];
      if (!elements.length || !triggerEl) return;

      var yOffset   = (opts && opts.y != null) ? opts.y : 36;
      var startPos  = (opts && opts.start) || 'top 86%';
      var stagger   = (opts && opts.stagger != null) ? opts.stagger : 0.1;
      var duration  = (opts && opts.duration != null) ? opts.duration : 0.9;
      var markReady = Boolean(opts && opts.markReady);

      gsap.set(elements, { opacity: 0, y: yOffset });

      ScrollTrigger.create({
        trigger: triggerEl,
        start: startPos,
        once: true,
        onEnter: function () {
          gsap.to(elements, {
            opacity: 1,
            y: 0,
            duration: duration,
            stagger: stagger,
            ease: 'power3.out',
            overwrite: 'auto',
            onComplete: function () {
              gsap.set(elements, { clearProps: 'transform,willChange' });
              if (markReady) {
                elements.forEach(function (el) { el.classList.add('sr-ready'); });
              }
            }
          });
        }
      });
    }

    /* ── Section 5: Dual Interactive Split (#splitDualSection) ── */
    if (splitSection) {
      var splitHeaderWrap  = splitSection.querySelector('.split-dual-header');
      var splitHeaderLeft  = splitSection.querySelectorAll('.split-col-header--left > *');
      var splitHeaderRight = splitSection.querySelectorAll('.split-col-header--right > *');
      var splitCardsTrack  = splitSection.querySelector('.split-cards-track');
      var splitCards       = splitSection.querySelectorAll('.split-card');

      revealGroup(splitHeaderLeft,  splitHeaderWrap, { y: 36, stagger: 0.1,  duration: 0.9,  start: 'top 86%' });
      revealGroup(splitHeaderRight, splitHeaderWrap, { y: 36, stagger: 0.1,  duration: 0.9,  start: 'top 86%' });
      revealGroup(splitCards,       splitCardsTrack, { y: 44, stagger: 0.16, duration: 0.95, start: 'top 86%', markReady: true });
    }

    /* ── Section 6: Federation Archive Grid (#federationSection) ── */
    if (fedSection) {
      var fedHeader    = fedSection.querySelector('.federation-header');
      var fedHeaderEls = fedSection.querySelectorAll('.federation-header > *');
      var fedCards     = fedSection.querySelectorAll('#federationGrid .fed-card');

      revealGroup(fedHeaderEls, fedHeader, { y: 34, stagger: 0.1, duration: 0.88, start: 'top 86%' });

      if (fedCards.length) {
        gsap.set(fedCards, { opacity: 0, y: 40 });

        ScrollTrigger.batch(fedCards, {
          start: 'top 88%',
          once: true,
          onEnter: function (batch) {
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 0.85,
              stagger: 0.08,
              ease: 'power3.out',
              overwrite: 'auto',
              onComplete: function () {
                batch.forEach(function (card) {
                  card.classList.add('sr-ready');
                  gsap.set(card, { clearProps: 'transform,willChange' });
                });
              }
            });
          }
        });
      }
    }

    /* ── Section 7: Cinematic Notched Footer (#cinematicFooter) ── */
    if (footer) {
      var footerCard     = footer.querySelector('.footer-card');
      var footerBrandEls = footer.querySelectorAll('.footer-top-brand > *');
      var footerNavGrid  = footer.querySelector('.footer-nav-grid');
      var footerLowerEls = footer.querySelectorAll('.footer-nav-col, .footer-institutions-strip, .footer-bottom-bar');

      revealGroup(footerCard ? [footerCard] : [], footer, { y: 40, stagger: 0, duration: 0.95, start: 'top 90%' });
      revealGroup(footerBrandEls, footerCard,    { y: 28, stagger: 0.1,  duration: 0.88, start: 'top 88%' });
      revealGroup(footerLowerEls, footerNavGrid, { y: 26, stagger: 0.09, duration: 0.85, start: 'top 96%' });
    }
  }

  /* ─────────────────────────────────────────────────────
     7. SECTION 6: FEDERATION GRID FILTERS
  ─────────────────────────────────────────────────────── */
  function initFederationFilters() {
    var filterBtns = document.querySelectorAll('.fed-filter-btn');
    var fedCards   = document.querySelectorAll('.fed-card');

    if (!filterBtns.length || !fedCards.length) return;

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');

        var filter = this.getAttribute('data-filter');
        fedCards.forEach(function (card) {
          var category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            card.style.display = 'block';
            gsap.fromTo(card,
              { opacity: 0, y: 18 },
              {
                opacity: 1,
                y: 0,
                duration: 0.45,
                ease: 'power3.out',
                overwrite: 'auto',
                onComplete: function () {
                  card.classList.add('sr-ready');
                  gsap.set(card, { clearProps: 'transform,willChange' });
                }
              }
            );
          } else {
            card.style.display = 'none';
          }
        });

        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }
      });
    });
  }

  /* ─────────────────────────────────────────────────────
     GLOBAL INTERACTION HANDLERS (Modal & Detail)
  ─────────────────────────────────────────────────────── */
  window.openCompareModal = function () {
    var modal = document.getElementById('compare-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.style.overflow = 'hidden';
      if (lenisInstance) lenisInstance.stop();
    }
  };

  window.closeCompareModal = function () {
    var modal = document.getElementById('compare-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
      if (lenisInstance) lenisInstance.start();
    }
  };

  window.toggleDetail = function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.classList.toggle('hidden');
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    }
  };

  /* ─────────────────────────────────────────────────────
     BOOT
  ─────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initFederationFilters();

    waitForGSAP(function () {
      initLenisScroll();
      initProgressBar();
      initShrinkAnimation();
      initContentAnimations();
      initScrubbedThemeInterpolation();
      initScrollLinkedPathDrawing();
      initHorizontalPhotoScroll();
      initHighLineTextReveal();
      initLastThreeSectionsReveal();

      window.addEventListener('load', function () {
        ScrollTrigger.refresh();
      });
    });
  });

})();
