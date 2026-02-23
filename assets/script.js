/* ====================================================================
   25th Silver Jubilee Anniversary — Interactive Script
   Particles • Doors • Scroll Storytelling • Ambient Music
   ==================================================================== */

(function () {
    'use strict';

    /* -----------------------------------------------------------------
       CONFIG
    ----------------------------------------------------------------- */
    const CFG = {
        particleCount: 80,
        particleMinSize: 1,
        particleMaxSize: 3,
        particleSpeed: 0.3,
        heartCount: 30,
        sceneThreshold: 0.25,
        parallaxStrength: 30,
    };

    /* -----------------------------------------------------------------
       UTILITY
    ----------------------------------------------------------------- */
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);
    const rand = (min, max) => Math.random() * (max - min) + min;
    const lerp = (a, b, t) => a + (b - a) * t;

    /* -----------------------------------------------------------------
       1. SILVER PARTICLE SYSTEM  (background canvas)
    ----------------------------------------------------------------- */
    class Particle {
        constructor(canvas) {
            this.canvas = canvas;
            this.reset(true);
        }

        reset(init = false) {
            this.x = rand(0, this.canvas.width);
            this.y = init ? rand(0, this.canvas.height) : -10;
            this.size = rand(CFG.particleMinSize, CFG.particleMaxSize);
            this.speedY = rand(0.1, CFG.particleSpeed);
            this.speedX = rand(-0.15, 0.15);
            this.opacity = rand(0.1, 0.5);
            this.flickerSpeed = rand(0.005, 0.02);
            this.flickerPhase = rand(0, Math.PI * 2);
            // Silver / champagne colors
            const t = Math.random();
            if (t < 0.7) {
                this.color = `rgba(192, 192, 192, `;   // silver
            } else {
                this.color = `rgba(212, 195, 120, `;    // champagne
            }
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.flickerPhase) * 0.05;
            this.flickerPhase += this.flickerSpeed;
            this.currentOpacity = this.opacity * (0.6 + 0.4 * Math.sin(this.flickerPhase));
            if (this.y > this.canvas.height + 10) this.reset();
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color + this.currentOpacity + ')';
            ctx.fill();
            // tiny glow
            if (this.size > 2) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = this.color + (this.currentOpacity * 0.15) + ')';
                ctx.fill();
            }
        }
    }

    class ParticleSystem {
        constructor() {
            this.canvas = $('#particle-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.resize();
            window.addEventListener('resize', () => this.resize());
            for (let i = 0; i < CFG.particleCount; i++) {
                this.particles.push(new Particle(this.canvas));
            }
            this.animate();
        }

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            for (const p of this.particles) {
                p.update();
                p.draw(this.ctx);
            }
            requestAnimationFrame(() => this.animate());
        }
    }

    /* -----------------------------------------------------------------
       2. HEART PARTICLE SYSTEM  (ending section canvas)
    ----------------------------------------------------------------- */
    class HeartParticle {
        constructor(canvas) {
            this.canvas = canvas;
            this.reset(true);
        }

        reset(init = false) {
            this.x = rand(0, this.canvas.width);
            this.y = init ? rand(0, this.canvas.height) : this.canvas.height + 20;
            this.size = rand(8, 18);
            this.speedY = rand(-0.5, -1.2);
            this.speedX = rand(-0.3, 0.3);
            this.opacity = rand(0.15, 0.45);
            this.rotation = rand(0, Math.PI * 2);
            this.rotationSpeed = rand(-0.02, 0.02);
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.rotation) * 0.3;
            this.rotation += this.rotationSpeed;
            if (this.y < -30) this.reset();
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = '#D4AF37';
            ctx.font = `${this.size}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('♥', 0, 0);
            ctx.restore();
        }
    }

    class HeartSystem {
        constructor() {
            this.canvas = $('#hearts-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.hearts = [];
            this.active = false;
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }

        resize() {
            if (!this.canvas) return;
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        }

        start() {
            if (this.active) return;
            this.active = true;
            this.resize();
            for (let i = 0; i < CFG.heartCount; i++) {
                this.hearts.push(new HeartParticle(this.canvas));
            }
            this.animate();
        }

        animate() {
            if (!this.active) return;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            for (const h of this.hearts) {
                h.update();
                h.draw(this.ctx);
            }
            requestAnimationFrame(() => this.animate());
        }
    }

    /* -----------------------------------------------------------------
       3. DOOR ANIMATION CONTROLLER
    ----------------------------------------------------------------- */
    class DoorController {
        constructor(onComplete) {
            this.container = $('#doors-container');
            this.onComplete = onComplete;
        }

        open() {
            this.container.classList.add('active');
            // Small delay then open
            requestAnimationFrame(() => {
                setTimeout(() => {
                    this.container.classList.add('opened');
                }, 100);
            });
            // After animation, clean up and reveal content
            setTimeout(() => {
                this.container.style.display = 'none';
                if (this.onComplete) this.onComplete();
            }, 4500);
        }
    }

    /* -----------------------------------------------------------------
       4. SCROLL STORYTELLING  (with lerp-smoothed parallax)
    ----------------------------------------------------------------- */
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    class ScrollStory {
        constructor() {
            this.scenes = $$('.scene');
            this.invitation = $('#invitation');
            this.ending = $('#ending');
            this.allSections = [...this.scenes, this.invitation, this.ending].filter(Boolean);

            // Parallax lerp state — one entry per scene-bg
            this.parallaxTargets = [];
            this.scenes.forEach((scene) => {
                const bg = scene.querySelector('.scene-bg');
                if (bg) {
                    this.parallaxTargets.push({ el: bg, scene, current: 0, target: 0 });
                }
            });

            this.ticking = false;
            this.init();
        }

        init() {
            const options = {
                root: null,
                threshold: 0.15,
                rootMargin: '0px 0px -5% 0px',
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, options);

            this.allSections.forEach((section) => observer.observe(section));

            // Skip parallax entirely for users who prefer reduced motion
            if (prefersReducedMotion) return;

            // Listen to scroll to update target values (cheap — no DOM writes)
            window.addEventListener('scroll', () => this.updateTargets(), { passive: true });

            // Start the lerp animation loop
            this.animateParallax();
        }

        /** Recalculate desired translateY values (runs on every scroll tick) */
        updateTargets() {
            for (const item of this.parallaxTargets) {
                const rect = item.scene.getBoundingClientRect();
                const inView = rect.top < window.innerHeight && rect.bottom > 0;
                if (inView) {
                    const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
                    item.target = (progress - 0.5) * CFG.parallaxStrength;
                }
            }
        }

        /** Continuously lerp current → target and write transforms (runs at display refresh rate) */
        animateParallax() {
            const lerpFactor = 0.08; // lower = smoother / more inertia
            for (const item of this.parallaxTargets) {
                item.current = lerp(item.current, item.target, lerpFactor);
                // Only write to DOM when there's meaningful change
                if (Math.abs(item.current - item.target) > 0.01) {
                    item.el.style.transform = `translate3d(0, ${item.current}px, 0) scale(1.05)`;
                }
            }
            requestAnimationFrame(() => this.animateParallax());
        }
    }

    /* -----------------------------------------------------------------
       5. AMBIENT MUSIC SYNTHESIZER (Web Audio API)
       Generates a gentle piano-like ambient soundscape
    ----------------------------------------------------------------- */
    class AmbientMusic {
        constructor() {
            this.ctx = null;
            this.masterGain = null;
            this.isPlaying = false;
            this.isMuted = false;
            this.scheduledTime = 0;
            this.intervalId = null;

            // Pentatonic scale notes for a gentle, pleasant melody
            // C major pentatonic frequencies across octaves
            this.notes = [
                261.63, 293.66, 329.63, 392.00, 440.00,  // C4, D4, E4, G4, A4
                523.25, 587.33, 659.26, 783.99, 880.00,  // C5, D5, E5, G5, A5
            ];

            // Chord progressions (indices into notes array)
            this.chords = [
                [0, 2, 4],  // C E G
                [1, 3, 5],  // D G C
                [2, 4, 6],  // E G D
                [0, 3, 7],  // C G A
                [4, 6, 8],  // A D G
                [0, 2, 5],  // C E C
            ];
        }

        init() {
            if (this.ctx) return;
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();

            // Master gain (smooth volume)
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
            this.masterGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 3);

            // Reverb-like effect using delay
            const delay = this.ctx.createDelay();
            delay.delayTime.value = 0.3;
            const feedback = this.ctx.createGain();
            feedback.gain.value = 0.3;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 2000;

            // Connect: master → delay → feedback → filter → delay (loop)
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.connect(delay);
            delay.connect(feedback);
            feedback.connect(filter);
            filter.connect(delay);
            delay.connect(this.ctx.destination);

            this.scheduledTime = this.ctx.currentTime;
        }

        playNote(freq, startTime, duration, volume = 0.08) {
            if (!this.ctx) return;

            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            // Add subtle vibrato
            const vibrato = this.ctx.createOscillator();
            const vibratoGain = this.ctx.createGain();
            vibrato.frequency.value = 4;
            vibratoGain.gain.value = 2;
            vibrato.connect(vibratoGain);
            vibratoGain.connect(osc.frequency);
            vibrato.start(startTime);
            vibrato.stop(startTime + duration + 0.5);

            // ADSR-like envelope
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(volume * 0.6, startTime + duration * 0.3);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gainNode);
            gainNode.connect(this.masterGain);

            osc.start(startTime);
            osc.stop(startTime + duration + 0.1);
        }

        playChord(chordIndex, startTime) {
            const chord = this.chords[chordIndex % this.chords.length];
            chord.forEach((noteIdx, i) => {
                const freq = this.notes[noteIdx];
                // Arpeggiate slightly
                this.playNote(freq, startTime + i * 0.15, 3.5, 0.06);
            });
        }

        scheduleChords() {
            if (!this.ctx || !this.isPlaying) return;

            const now = this.ctx.currentTime;
            // Schedule ahead by 8 seconds
            while (this.scheduledTime < now + 8) {
                const chordIdx = Math.floor(Math.random() * this.chords.length);
                this.playChord(chordIdx, this.scheduledTime);

                // Also play a gentle melodic note
                const melodyNote = this.notes[Math.floor(Math.random() * 5) + 5]; // higher octave
                this.playNote(melodyNote, this.scheduledTime + 1.5, 2, 0.035);

                // Add a low bass drone
                this.playNote(this.notes[0] / 2, this.scheduledTime, 4, 0.025);

                this.scheduledTime += 4; // 4 seconds per chord
            }
        }

        start() {
            this.init();
            this.isPlaying = true;
            this.scheduleChords();
            this.intervalId = setInterval(() => this.scheduleChords(), 3000);
        }

        stop() {
            this.isPlaying = false;
            if (this.intervalId) clearInterval(this.intervalId);
            if (this.masterGain) {
                this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2);
            }
        }

        toggle() {
            if (this.isMuted) {
                this.isMuted = false;
                if (this.masterGain) {
                    this.masterGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.5);
                }
            } else {
                this.isMuted = true;
                if (this.masterGain) {
                    this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
                }
            }
            return this.isMuted;
        }
    }

    /* -----------------------------------------------------------------
       6. APP CONTROLLER  (wire everything together)
    ----------------------------------------------------------------- */
    class App {
        constructor() {
            this.particleSystem = new ParticleSystem();
            this.heartSystem = new HeartSystem();
            this.music = new AmbientMusic();
            this.scrollStory = null;
            this.mainContent = $('#main-content');
            this.preloader = $('#preloader');
            this.enterBtn = $('#enter-btn');
            this.musicToggle = $('#music-toggle');

            // Hide main content initially
            this.mainContent.style.display = 'none';

            this.bindEvents();
            this.setupEndingObserver();
        }

        bindEvents() {
            // Enter button
            this.enterBtn.addEventListener('click', () => this.enterCelebration());

            // Music toggle
            this.musicToggle.addEventListener('click', () => {
                const muted = this.music.toggle();
                this.musicToggle.classList.toggle('muted', muted);
            });
        }

        enterCelebration() {
            // 1. Start music (needs user gesture)
            this.music.start();

            // 2. Hide preloader
            this.preloader.classList.add('hidden');

            // 3. Show & open doors
            const doorCtrl = new DoorController(() => {
                // After doors open, show main content
                this.mainContent.style.display = 'block';
                this.mainContent.style.opacity = '0';
                requestAnimationFrame(() => {
                    this.mainContent.style.transition = 'opacity 1.5s ease';
                    this.mainContent.style.opacity = '1';
                });

                // Init scroll-based storytelling
                this.scrollStory = new ScrollStory();

                // Show music toggle
                this.musicToggle.classList.add('visible');
            });

            doorCtrl.open();
        }

        setupEndingObserver() {
            const endingSection = $('#ending');
            if (!endingSection) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        this.heartSystem.start();
                    }
                });
            }, { threshold: 0.2 });

            observer.observe(endingSection);
        }
    }

    /* -----------------------------------------------------------------
       BOOT
    ----------------------------------------------------------------- */
    document.addEventListener('DOMContentLoaded', () => {
        new App();
    });

})();
