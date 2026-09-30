/**
 * ============================================================================
 * A STORY FOR MANISHA — ATTACK ON TITAN CINEMATIC EXPERIENCE
 * ============================================================================
 * Short, ultra-polished 6-scene interactive anime cinematic.
 * Created for Manisha by Jashwanth Reddy.
 */

// ---------------------------------------------------------------------------
// 1. CONFIGURATION
// ---------------------------------------------------------------------------
const CONFIG = {
  girlfriendName: "Manisha",
  yourName: "Jashwanth Reddy",
  birthday: "2026-10-31T00:00:00",
  launchDate: "2026-10-01T00:00:00",
  music: "assets/audio/background.mp3"
};

// Global audio engine controller
let AudioEngine = null;

// ---------------------------------------------------------------------------
// 2. DOM INITIALIZATION
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  AudioEngine = initializeAudio();
  initializeCountdown();
  initializeTheThread();
  initializeScarfScene();
  initializeBirthdayUnlock();
  initializeCinematicTransitions();
  initializeAmbientCanvas();
});

// ---------------------------------------------------------------------------
// 3. AUDIO SYSTEM (Existing Music with Graceful Synthesizer Fallback)
// ---------------------------------------------------------------------------
function initializeAudio() {
  const audioEl = document.getElementById('soundtrackAudio');
  const audioBtn = document.getElementById('btnMinimalAudio');
  const audioStatus = document.getElementById('audioStatusText');

  let isPlaying = false;
  let audioCtx = null;
  let synthGain = null;
  let synthActive = false;

  // Synthesizes atmospheric ambient wind & warm drone if MP3 is absent
  function startAtmosphericWind() {
    if (synthActive) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtx) audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const bufferSize = audioCtx.sampleRate * 2.5;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const bandpass = audioCtx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 280;
      bandpass.Q.value = 3.5;

      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(73.42, audioCtx.currentTime); // D2

      synthGain = audioCtx.createGain();
      synthGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      synthGain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 3);

      whiteNoise.connect(bandpass);
      bandpass.connect(synthGain);
      osc.connect(synthGain);
      synthGain.connect(audioCtx.destination);

      whiteNoise.start();
      osc.start();
      synthActive = true;
    } catch (e) {
      console.warn("Ambient synthesizer unavailable:", e);
    }
  }

  function stopAtmosphericWind() {
    if (synthGain && audioCtx) {
      synthGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1);
      setTimeout(() => {
        if (audioCtx && audioCtx.state !== 'closed') audioCtx.suspend();
        synthActive = false;
      }, 1000);
    }
  }

  function play() {
    if (audioEl) {
      audioEl.volume = 0.5;
      const p = audioEl.play();
      if (p !== undefined) {
        p.catch(() => {
          startAtmosphericWind();
        });
      }
    } else {
      startAtmosphericWind();
    }
    isPlaying = true;
    if (audioBtn) audioBtn.classList.add('playing');
    if (audioStatus) audioStatus.textContent = "ON";
  }

  function pause() {
    if (audioEl && !audioEl.paused) audioEl.pause();
    stopAtmosphericWind();
    isPlaying = false;
    if (audioBtn) audioBtn.classList.remove('playing');
    if (audioStatus) audioStatus.textContent = "OFF";
  }

  function toggle() {
    if (isPlaying) pause();
    else play();
  }

  function setVolume(targetVol, rampMs = 1000) {
    if (audioEl) {
      const startVol = audioEl.volume;
      const startTime = performance.now();
      function ramp(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / rampMs);
        audioEl.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * progress));
        if (progress < 1) requestAnimationFrame(ramp);
      }
      requestAnimationFrame(ramp);
    }
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', toggle);
  }

  return { play, pause, toggle, setVolume, get isPlaying() { return isPlaying; } };
}

// ---------------------------------------------------------------------------
// 4. REAL COUNTDOWN SYSTEM
// ---------------------------------------------------------------------------
function initializeCountdown() {
  const targetDate = new Date(CONFIG.birthday).getTime();
  const launchDate = new Date(CONFIG.launchDate).getTime();

  const elMissionDays = document.getElementById('missionDaysRemaining');
  const elDays = document.getElementById('cntDays');
  const elHours = document.getElementById('cntHours');
  const elMinutes = document.getElementById('cntMinutes');
  const elSeconds = document.getElementById('cntSeconds');
  const elProgressFill = document.getElementById('journeyProgressFill');
  const elPercentText = document.getElementById('journeyPercentText');

  const pad = (n) => String(n).padStart(2, '0');

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      if (elMissionDays) elMissionDays.textContent = '0';
      if (elDays) elDays.textContent = '00';
      if (elHours) elHours.textContent = '00';
      if (elMinutes) elMinutes.textContent = '00';
      if (elSeconds) elSeconds.textContent = '00';
      if (elProgressFill) elProgressFill.style.width = '100%';
      if (elPercentText) elPercentText.textContent = 'ZERO HOUR REACHED';

      // Automatically trigger transformation
      if (window.triggerBirthdayTransformation) {
        window.triggerBirthdayTransformation();
      }
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (elMissionDays) elMissionDays.textContent = days;
    if (elDays) elDays.textContent = pad(days);
    if (elHours) elHours.textContent = pad(hours);
    if (elMinutes) elMinutes.textContent = pad(minutes);
    if (elSeconds) elSeconds.textContent = pad(seconds);

    // Progress bar: 01.10.2026 -> 31.10.2026
    const totalSpan = targetDate - launchDate;
    const elapsed = now - launchDate;
    const percentage = Math.min(100, Math.max(0, Math.round((elapsed / totalSpan) * 100)));

    if (elProgressFill) elProgressFill.style.width = `${percentage}%`;
    if (elPercentText) elPercentText.textContent = `${percentage}% OF MISSION COMPLETE`;
  }

  setInterval(update, 1000);
  update();
}

// ---------------------------------------------------------------------------
// 5. SCENE 3 — THE THREAD (Glowing SVG Path & 4 Memory Points)
// ---------------------------------------------------------------------------
function initializeTheThread() {
  const threadScene = document.getElementById('scene-thread');
  const threadPath = document.getElementById('svgThreadPath');
  const memoryPoints = document.querySelectorAll('.thread-memory-point');

  if (!threadScene) return;

  // 1. Intersection Observer to illuminate the thread and open memory points
  const pointObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('point-active');
        if (threadPath) {
          threadPath.classList.add('thread-illuminated');
        }
      } else {
        if (threadPath) {
          const anyActive = document.querySelector('.thread-memory-point.point-active');
          if (!anyActive) threadPath.classList.remove('thread-illuminated');
        }
      }
    });
  }, {
    threshold: 0.35,
    rootMargin: '0px 0px -10% 0px'
  });

  memoryPoints.forEach(point => pointObserver.observe(point));

  // 2. Dynamic thread flow synchronized with scroll progress
  let isTicking = false;
  window.addEventListener('scroll', () => {
    if (!isTicking) {
      requestAnimationFrame(() => {
        const rect = threadScene.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        if (rect.top < windowHeight && rect.bottom > 0) {
          const totalDist = rect.height + windowHeight;
          const currentProgress = (windowHeight - rect.top) / totalDist;
          const clamped = Math.max(0, Math.min(1, currentProgress));

          if (threadPath) {
            threadPath.style.strokeDashoffset = `${400 - (clamped * 350)}px`;
          }
        }
        isTicking = false;
      });
      isTicking = true;
    }
  }, { passive: true });
}

// ---------------------------------------------------------------------------
// 6. SCENE 4 — MIKASA & THE RED SCARF (Abstract Landscape & Pitch-Black Moment)
// ---------------------------------------------------------------------------
function initializeScarfScene() {
  const mikasaScene = document.getElementById('scene-mikasa');
  const scarfContainer = document.getElementById('centralScarfContainer');
  const silhouette = document.querySelector('.lone-silhouette-container');
  const moon = document.querySelector('.landscape-moon');
  const scarfMoment = document.getElementById('scarfMomentBlock');
  const scarfZoomCurtain = document.getElementById('scarfZoomCurtain');

  if (!mikasaScene) return;

  const isTouch = window.matchMedia('(hover: none) or (pointer: coarse)').matches;
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Subtle mousemove parallax (desktop only, respectful of motion preference)
  if (!isTouch && !isReduced) {
    let mouseX = 0, mouseY = 0, curX = 0, curY = 0;
    window.addEventListener('mousemove', (e) => {
      const rect = mikasaScene.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 20;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 20;
      }
    });

    function renderParallax() {
      curX += (mouseX - curX) * 0.08;
      curY += (mouseY - curY) * 0.08;

      if (silhouette) {
        silhouette.style.transform = `translate3d(calc(-50% + ${curX * 0.4}px), ${curY * 0.4}px, 0)`;
      }
      if (moon) {
        moon.style.transform = `translate3d(calc(-50% + ${curX * -0.2}px), ${curY * -0.2}px, 0)`;
      }
      if (scarfContainer && !scarfContainer.classList.contains('scarf-zooming')) {
        scarfContainer.style.transform = `translate3d(calc(-50% + ${curX * 0.7}px), ${curY * 0.7}px, 0)`;
      }

      requestAnimationFrame(renderParallax);
    }
    requestAnimationFrame(renderParallax);
  }

  // 2. Pitch-black scarf moment observer: Screen turns pitch black, isolating the red scarf
  if (scarfMoment) {
    const momentObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          mikasaScene.classList.add('pitch-black-active');
        } else {
          mikasaScene.classList.remove('pitch-black-active');
        }
      });
    }, {
      threshold: 0.3
    });
    momentObserver.observe(scarfMoment);
  }

  // 3. Scarf Zoom Curtain observer: Zoom scarf to camera, fading out to countdown dot
  if (scarfZoomCurtain && scarfContainer) {
    const zoomObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          scarfContainer.classList.add('scarf-zooming');
        } else {
          scarfContainer.classList.remove('scarf-zooming');
        }
      });
    }, {
      threshold: 0.2
    });
    zoomObserver.observe(scarfZoomCurtain);
  }
}

// ---------------------------------------------------------------------------
// 7. OCTOBER 31 BIRTHDAY UNLOCK TRANSFORMATION
// ---------------------------------------------------------------------------
function initializeBirthdayUnlock() {
  const doorLocked = document.getElementById('doorStateLocked');
  const bdayReveal = document.getElementById('birthdayRevealStage');
  const btnOverride = document.getElementById('btnSecretUnlock');
  const doorCrest = document.getElementById('doorLockCrest');
  const flashVeil = document.getElementById('cinemaFlashVeil');

  let transformed = false;

  function triggerBirthdayTransformation() {
    if (transformed) return;
    transformed = true;

    // 1. Music fades out
    if (AudioEngine) AudioEngine.setVolume(0.05, 800);

    // 2. Flash veil & camera vibration
    if (flashVeil) {
      flashVeil.classList.add('flashing');
      setTimeout(() => flashVeil.classList.remove('flashing'), 850);
    }

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const viewport = document.getElementById('cinematicViewport');
    if (viewport && !isReduced) {
      viewport.classList.add('screen-shake');
      setTimeout(() => viewport.classList.remove('screen-shake'), 600);
    }

    // 3. Swap stages
    setTimeout(() => {
      if (doorLocked) doorLocked.style.display = 'none';
      if (bdayReveal) {
        bdayReveal.classList.remove('hidden');
        bdayReveal.setAttribute('aria-hidden', 'false');
      }

      // 4. Music begins emotional climax swell
      if (AudioEngine) {
        if (!AudioEngine.isPlaying) AudioEngine.play();
        AudioEngine.setVolume(0.65, 2000);
      }

      // 5. Scroll smoothly to the final reveal
      bdayReveal.scrollIntoView({ behavior: 'smooth' });

      // 6. Spawn golden rising particles
      if (window.setAmbientMode) {
        window.setAmbientMode('celebration');
      }
    }, 400);
  }

  // Export so countdown or manual clicks can invoke
  window.triggerBirthdayTransformation = triggerBirthdayTransformation;

  if (btnOverride) {
    btnOverride.addEventListener('click', triggerBirthdayTransformation);
  }
  if (doorCrest) {
    doorCrest.addEventListener('click', triggerBirthdayTransformation);
  }
}

// ---------------------------------------------------------------------------
// 8. CINEMATIC SCENE PROGRESSION & TRANSITIONS
// ---------------------------------------------------------------------------
function initializeCinematicTransitions() {
  const btnBegin = document.getElementById('btnBeginExperience');
  const wallScene = document.getElementById('scene-wall');
  const flashVeil = document.getElementById('cinemaFlashVeil');
  const viewport = document.getElementById('cinematicViewport');

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (btnBegin && wallScene) {
    btnBegin.addEventListener('click', () => {
      // 1. Start audio seamlessly on gesture
      if (AudioEngine && !AudioEngine.isPlaying) {
        AudioEngine.play();
      }

      // 2. Heartbeat shake & flash (respecting motion preferences)
      if (viewport && !isReduced) {
        viewport.classList.add('screen-shake');
        setTimeout(() => viewport.classList.remove('screen-shake'), 500);
      }
      if (flashVeil) {
        flashVeil.classList.add('flashing');
        setTimeout(() => flashVeil.classList.remove('flashing'), 800);
      }

      // 3. Move camera smoothly to Scene 2: The Wall
      setTimeout(() => {
        wallScene.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    });
  }

  // Audio volume modulation based on scene visibility
  const sceneVolMap = {
    'scene-mission': 0.35,
    'scene-wall': 0.55,
    'scene-thread': 0.38,
    'scene-mikasa': 0.42,
    'scene-countdown': 0.45,
    'scene-final': 0.4
  };

  const scenes = document.querySelectorAll('.cinema-scene');
  const sceneObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && AudioEngine) {
        const id = entry.target.id;
        const targetVol = sceneVolMap[id];
        if (targetVol !== undefined) {
          AudioEngine.setVolume(targetVol, 1200);
        }
      }
    });
  }, {
    threshold: 0.35
  });

  scenes.forEach(scene => sceneObserver.observe(scene));
}

// ---------------------------------------------------------------------------
// 9. LIGHTWEIGHT AMBIENT CANVAS (Ash, Embers & Golden Stars)
// ---------------------------------------------------------------------------
function initializeAmbientCanvas() {
  const canvas = document.getElementById('ambientCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  let mode = 'normal'; // 'normal' | 'celebration'
  window.setAmbientMode = (m) => { mode = m; };

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = isReduced ? 10 : 35;
  const particles = [];

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 10;
      this.size = Math.random() * 2 + 0.8;
      this.speedY = isReduced ? (Math.random() * 0.3 + 0.1) : (Math.random() * 0.6 + 0.25);
      this.speedX = isReduced ? (Math.random() - 0.5) * 0.2 : (Math.random() - 0.5) * 0.4;
      this.opacity = Math.random() * 0.5 + 0.2;
      this.decay = Math.random() * 0.002 + 0.001;
      this.isRed = Math.random() < 0.35;
    }

    update() {
      this.y -= this.speedY;
      this.x += this.speedX;
      this.opacity -= this.decay;
      if (this.y < -10 || this.opacity <= 0) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);

      if (mode === 'celebration') {
        // Golden rising particles
        ctx.fillStyle = `rgba(223, 183, 108, ${this.opacity * 0.9})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(223, 183, 108, 0.6)`;
      } else {
        // Subtle ash & red embers
        if (this.isRed) {
          ctx.fillStyle = `rgba(167, 25, 48, ${this.opacity})`;
          ctx.shadowBlur = 6;
          ctx.shadowColor = `rgba(167, 25, 48, 0.5)`;
        } else {
          ctx.fillStyle = `rgba(200, 210, 205, ${this.opacity * 0.4})`;
          ctx.shadowBlur = 0;
        }
      }

      ctx.fill();
    }
  }

  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    requestAnimationFrame(loop);
  }
  loop();
}
