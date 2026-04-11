'use strict';

const loader    = document.getElementById('loader');
const loaderBar = document.getElementById('loaderProgress');
const loaderTxt = document.getElementById('loaderStatus');

const loadSteps = [
    { pct: 25,  msg: 'Loading security modules...' },
    { pct: 55,  msg: 'Initializing particle engine...' },
    { pct: 80,  msg: 'Configuring 3D renderer...' },
    { pct: 100, msg: 'Systems online.' },
];

let stepIdx = 0;

function runLoader() {
    if (stepIdx >= loadSteps.length) return;
    const step = loadSteps[stepIdx++];
    loaderBar.style.width = step.pct + '%';
    loaderTxt.textContent = step.msg;
    const delay = stepIdx === loadSteps.length ? 500 : 420 + Math.random() * 200;
    setTimeout(() => {
        if (stepIdx < loadSteps.length) runLoader();
        else finishLoader();
    }, delay);
}

function finishLoader() {
    setTimeout(() => {
        loader.classList.add('loaded');
        document.body.style.overflow = '';
        initScrollAnimations();
    }, 600);
}

document.body.style.overflow = 'hidden';
setTimeout(runLoader, 350);

(function initThreeScene() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 70;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    function makeParticleTex(color) {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0,   color.center);
        g.addColorStop(0.35, color.mid);
        g.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(c);
    }

    const texRed   = makeParticleTex({ center: 'rgba(255,80,50,1)',   mid: 'rgba(255,44,44,0.5)' });
    const texWhite = makeParticleTex({ center: 'rgba(255,255,255,1)', mid: 'rgba(200,200,255,0.4)' });

    const PARTICLE_COUNT = 160;
    const SPREAD_X = 150, SPREAD_Y = 85, SPREAD_Z = 30;

    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x:  (Math.random() - 0.5) * SPREAD_X,
            y:  (Math.random() - 0.5) * SPREAD_Y,
            z:  (Math.random() - 0.5) * SPREAD_Z,
            vx: (Math.random() - 0.5) * 0.035,
            vy: (Math.random() - 0.5) * 0.025,
            isRed: Math.random() < 0.28,
        });
    }

    function buildPointsMesh(isRed, texture) {
        const group    = particles.filter(p => p.isRed === isRed);
        const posArray = new Float32Array(group.length * 3);
        const geo      = new THREE.BufferGeometry();
        const attr     = new THREE.BufferAttribute(posArray, 3);
        attr.setUsage(THREE.DynamicDrawUsage);
        geo.setAttribute('position', attr);
        const mat = new THREE.PointsMaterial({
            size: isRed ? 1.2 : 0.9,
            map: texture,
            transparent: true,
            opacity: isRed ? 0.9 : 0.65,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
        });
        const mesh = new THREE.Points(geo, mat);
        scene.add(mesh);
        return { mesh, group, attr };
    }

    const redPoints   = buildPointsMesh(true,  texRed);
    const whitePoints = buildPointsMesh(false, texWhite);

    const MAX_LINES   = 420;
    const MAX_DIST_SQ = 24 * 24;

    function buildLineMesh(color, opacity) {
        const pos  = new Float32Array(MAX_LINES * 6);
        const geo  = new THREE.BufferGeometry();
        const attr = new THREE.BufferAttribute(pos, 3);
        attr.setUsage(THREE.DynamicDrawUsage);
        geo.setAttribute('position', attr);
        geo.setDrawRange(0, 0);
        const mat  = new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
        const segs = new THREE.LineSegments(geo, mat);
        scene.add(segs);
        return { pos, geo, attr };
    }

    const lines1 = buildLineMesh(0xff3333, 0.18);
    const lines2 = buildLineMesh(0xaaaacc, 0.09);

    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff2c2c, wireframe: true, transparent: true, opacity: 0.045 });

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(32, 0.4, 16, 120), ringMat);
    ring1.rotation.x = 0.5;
    scene.add(ring1);

    const ring2m = ringMat.clone();
    ring2m.opacity = 0.025;
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(50, 0.25, 12, 100), ring2m);
    ring2.rotation.set(-0.8, 0.3, 0);
    scene.add(ring2);

    const ring3m = ringMat.clone();
    ring3m.opacity = 0.06;
    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(18, 0.3, 16, 80), ring3m);
    ring3.rotation.x = Math.PI / 2;
    scene.add(ring3);

    const mouse     = { x: 0, y: 0 };
    const camTarget = { x: 0, y: 0 };

    window.addEventListener('mousemove', e => {
        mouse.x =  (e.clientX / window.innerWidth  - 0.5) * 2;
        mouse.y =  (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function updateConnections() {
        let i1 = 0, i2 = 0;
        for (let i = 0; i < PARTICLE_COUNT && (i1 < MAX_LINES || i2 < MAX_LINES); i++) {
            for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                const p1 = particles[i], p2 = particles[j];
                const dx = p1.x - p2.x, dy = p1.y - p2.y;
                if (dx * dx + dy * dy < MAX_DIST_SQ) {
                    const L = p1.isRed ? lines1 : lines2;
                    const idx = p1.isRed ? i1 : i2;
                    if (idx < MAX_LINES) {
                        L.pos[idx * 6]     = p1.x; L.pos[idx * 6 + 1] = p1.y; L.pos[idx * 6 + 2] = p1.z;
                        L.pos[idx * 6 + 3] = p2.x; L.pos[idx * 6 + 4] = p2.y; L.pos[idx * 6 + 5] = p2.z;
                        if (p1.isRed) i1++; else i2++;
                    }
                }
            }
        }
        lines1.geo.setDrawRange(0, i1 * 2); lines1.attr.needsUpdate = true;
        lines2.geo.setDrawRange(0, i2 * 2); lines2.attr.needsUpdate = true;
    }

    function updatePoints() {
        const rg = redPoints.group, wg = whitePoints.group;
        for (let i = 0; i < rg.length; i++) redPoints.attr.setXYZ(i, rg[i].x, rg[i].y, rg[i].z);
        for (let i = 0; i < wg.length; i++) whitePoints.attr.setXYZ(i, wg[i].x, wg[i].y, wg[i].z);
        redPoints.attr.needsUpdate = true;
        whitePoints.attr.needsUpdate = true;
    }

    let frame = 0;

    function animate() {
        requestAnimationFrame(animate);
        frame++;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy;
            if (p.x >  SPREAD_X / 2) p.x = -SPREAD_X / 2;
            if (p.x < -SPREAD_X / 2) p.x =  SPREAD_X / 2;
            if (p.y >  SPREAD_Y / 2) p.y = -SPREAD_Y / 2;
            if (p.y < -SPREAD_Y / 2) p.y =  SPREAD_Y / 2;
        }

        updatePoints();
        if (frame % 2 === 0) updateConnections();

        ring1.rotation.y += 0.0006; ring1.rotation.z += 0.0003;
        ring2.rotation.y -= 0.0004; ring2.rotation.z += 0.0002;
        ring3.rotation.z += 0.0008;

        camTarget.x += (mouse.x * 5 - camTarget.x) * 0.04;
        camTarget.y += (-mouse.y * 3 - camTarget.y) * 0.04;
        camera.position.x = camTarget.x;
        camera.position.y = camTarget.y;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
})();

const navbar    = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

navToggle.addEventListener('click', () => {
    const open = navToggle.classList.toggle('open');
    navLinks.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
});

navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
    });
});

const sections = document.querySelectorAll('section[id]');

function updateActiveNav() {
    const scrollPos = window.scrollY + 132;
    sections.forEach(sec => {
        const link = document.querySelector(`.nav-link[href="#${sec.id}"]`);
        if (!link) return;
        link.classList.toggle('active', scrollPos >= sec.offsetTop && scrollPos < sec.offsetTop + sec.offsetHeight);
    });
}

window.addEventListener('scroll', updateActiveNav, { passive: true });

function initScrollAnimations() {
    const fadeEls = document.querySelectorAll('.fade-up');
    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        fadeEls.forEach(el => obs.observe(el));
    } else {
        fadeEls.forEach(el => el.classList.add('visible'));
    }
}

function initCounters() {
    const counters = document.querySelectorAll('.counter');
    if (!counters.length) return;
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            obs.unobserve(e.target);
            const el = e.target, target = parseInt(el.dataset.target, 10), dur = 1800, start = performance.now();
            function step(now) {
                const progress = Math.min((now - start) / dur, 1);
                const eased    = 1 - Math.pow(1 - progress, 3);
                el.textContent  = Math.round(eased * target);
                if (progress < 1) requestAnimationFrame(step);
                else el.textContent = target;
            }
            requestAnimationFrame(step);
        });
    }, { threshold: 0.5 });
    counters.forEach(c => obs.observe(c));
}

document.addEventListener('DOMContentLoaded', initCounters);

function initTiltCards() {
    document.querySelectorAll('.project-card[data-tilt]').forEach(card => {
        let rAF = null;
        card.addEventListener('mousemove', e => {
            if (rAF) cancelAnimationFrame(rAF);
            rAF = requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const rotX = -((e.clientY - rect.top  - rect.height / 2) / (rect.height / 2)) * 10;
                const rotY =  ((e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2)) * 10;
                card.style.transform  = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`;
                card.style.boxShadow  = `0 20px 60px rgba(0,0,0,0.5), ${-rotY * 0.5}px ${rotX * 0.5}px 30px rgba(255,44,44,0.12)`;
            });
        });
        card.addEventListener('mouseleave', () => {
            if (rAF) cancelAnimationFrame(rAF);
            card.style.transform = card.style.boxShadow = '';
        });
    });
}

document.addEventListener('DOMContentLoaded', initTiltCards);

const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');
const submitBtn   = document.getElementById('submitBtn');
const btnText     = document.getElementById('btnText');

if (contactForm) {
    contactForm.addEventListener('submit', e => {
        const name    = document.getElementById('name').value.trim();
        const email   = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();
        if (!name || !email || !message) { e.preventDefault(); return; }
        submitBtn.disabled = true;
        if (btnText) btnText.textContent = 'Sending…';
        setTimeout(() => {
            if (submitBtn) { submitBtn.disabled = false; if (btnText) btnText.textContent = 'Send Message'; }
        }, 3000);
    });
}

document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    gsap.from('.nav-logo',    { opacity: 0, x: -20, duration: 0.9, delay: 1.8, ease: 'power3.out' });
    gsap.from('.nav-links li',{ opacity: 0, y: -12, duration: 0.6, delay: 2.0, stagger: 0.08, ease: 'power2.out' });

    ScrollTrigger.batch('.service-card', {
        onEnter: els => gsap.fromTo(els, { opacity: 0, y: 40, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.12, ease: 'power3.out' }),
        once: true, start: 'top 85%',
    });

    ScrollTrigger.batch('.why-card', {
        onEnter: els => gsap.fromTo(els, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.1, ease: 'power3.out' }),
        once: true, start: 'top 85%',
    });

    ScrollTrigger.batch('.project-card', {
        onEnter: els => gsap.fromTo(els, { opacity: 0, y: 35 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' }),
        once: true, start: 'top 88%',
    });

    document.querySelectorAll('.section-title').forEach(el => {
        gsap.from(el, { scrollTrigger: { trigger: el, start: 'top 88%', once: true }, opacity: 0, y: 24, duration: 0.8, ease: 'power3.out' });
    });

    const aboutStats = document.querySelector('.about-stats');
    if (aboutStats) {
        ScrollTrigger.create({
            trigger: aboutStats, start: 'top 80%', once: true,
            onEnter: () => {
                document.querySelectorAll('.counter').forEach(el => {
                    const target = parseInt(el.dataset.target, 10);
                    gsap.fromTo(el, { innerText: 0 }, {
                        innerText: target, duration: 2, ease: 'power2.out', snap: { innerText: 1 },
                        onUpdate() { el.textContent = Math.round(this.targets()[0].innerText); }
                    });
                });
            }
        });
    }
});

document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%');
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `.nav-link.active{color:#fff}.nav-link.active::after{transform:translateX(-50%) scaleX(1)}#submitBtn:disabled{opacity:.6;cursor:not-allowed}`;
    document.head.appendChild(style);
});

(function initChatbot() {
    const widget    = document.getElementById('chatWidget');
    const toggle    = document.getElementById('chatToggle');
    const chatX     = document.getElementById('chatX');
    const messages  = document.getElementById('chatMessages');
    const chips     = document.getElementById('chatChips');
    const input     = document.getElementById('chatInput');
    const sendBtn   = document.getElementById('chatSend');
    const badge     = document.getElementById('chatBadge');

    if (!widget) return;

    const KB = {
        greeting: 'Hi! 👋 I\'m the REV Assistant.\nHow can I help you today?',
        defaultChips: ['Services', 'Get a Quote', 'Contact Us', 'Emergency'],

        rules: [
            {
                keys: ['fire alarm', 'alarm', 'smoke', 'detector', 'detection'],
                reply: '🔥 Our Fire Alarm Systems include:\n• Addressable fire panels\n• Smoke & heat detectors\n• Emergency notification systems\n• Suppression integration\n\nWant a free site survey?',
                chips: ['Get a Quote', 'More Services', 'Contact Us'],
            },
            {
                keys: ['cctv', 'camera', 'surveillance', 'video', 'recording'],
                reply: '📷 Our CCTV Solutions include:\n• 4K Ultra HD cameras\n• AI motion detection\n• Remote viewing app\n• Cloud & NVR storage\n\nCovers residential, commercial & industrial.',
                chips: ['Get a Quote', 'More Services', 'Contact Us'],
            },
            {
                keys: ['access control', 'access', 'biometric', 'keycard', 'entry', 'door'],
                reply: '🔒 Our Access Control Systems include:\n• Biometric & card readers\n• Multi-door management\n• Visitor management\n• Time & attendance tracking',
                chips: ['Get a Quote', 'More Services', 'Contact Us'],
            },
            {
                keys: ['fire safety', 'extinguisher', 'sprinkler', 'suppression', 'equipment'],
                reply: '🛡️ Our Fire Safety Equipment:\n• Fire extinguishers (supply & service)\n• Sprinkler systems\n• Emergency lighting\n• Compliance audits & signage',
                chips: ['Get a Quote', 'More Services', 'Contact Us'],
            },
            {
                keys: ['services', 'service', 'offer', 'provide', 'what do'],
                reply: '🛡️ We offer four core services:\n\n1. Fire Alarm Systems\n2. CCTV Surveillance\n3. Access Control Systems\n4. Fire Safety Equipment\n\nWhich interests you most?',
                chips: ['Fire Alarm', 'CCTV', 'Access Control', 'Fire Safety'],
            },
            {
                keys: ['quote', 'price', 'cost', 'pricing', 'how much', 'estimate'],
                reply: '📋 To get a free no-obligation quote:\n\n📞 +91 72879 28180\n📞 +91 63011 80242\n\nOr fill the contact form on this page — we respond within 24 hours!',
                chips: ['Contact Us', 'Services', 'Emergency'],
            },
            {
                keys: ['contact', 'address', 'location', 'where', 'find', 'email', 'phone', 'number'],
                reply: '📍 No-14 SMS Layout 2nd Street\n    Ondipdur, Coimbatore - 641016\n\n📞 +91 72879 28180\n📞 +91 63011 80242\n\n✉️ rudhran.codes@gmail.com',
                chips: ['Get a Quote', 'Services', 'Emergency'],
            },
            {
                keys: ['emergency', 'urgent', 'help', 'immediate', 'now', 'asap'],
                reply: '🚨 EMERGENCY CONTACT:\n\n📞 +91 72879 28180\n📞 +91 63011 80242\n\nWe provide 24/7 emergency support. Call us immediately — our engineers are on standby.',
                chips: ['Contact Us', 'Get a Quote'],
            },
            {
                keys: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'hola'],
                reply: 'Hello! 👋 Great to have you here.\nI can help with info about our fire safety & security services, quotes, or contact details. What do you need?',
                chips: ['Services', 'Get a Quote', 'Contact Us'],
            },
            {
                keys: ['thanks', 'thank you', 'thank', 'great', 'awesome', 'perfect'],
                reply: 'You\'re welcome! 😊 Is there anything else I can help you with?',
                chips: ['Services', 'Get a Quote', 'Contact Us'],
            },
            {
                keys: ['bye', 'goodbye', 'see you', 'later', 'done'],
                reply: 'Thanks for reaching out! 🙏\nDon\'t hesitate to call us anytime:\n📞 +91 72879 28180\n\nStay safe! 🛡️',
                chips: ['Get a Quote', 'Contact Us'],
            },
        ],

        fallback: {
            reply: 'I\'m not sure about that, but our team can help!\n\n📞 +91 72879 28180\n📞 +91 63011 80242\n✉️ rudhran.codes@gmail.com',
            chips: ['Services', 'Get a Quote', 'Contact Us', 'Emergency'],
        },
    };

    function now() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function appendMsg(text, role) {
        const wrap   = document.createElement('div');
        wrap.className = `chat-msg ${role}`;
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.textContent = text;
        const time   = document.createElement('span');
        time.className = 'chat-time';
        time.textContent = now();
        wrap.appendChild(bubble);
        wrap.appendChild(time);
        messages.appendChild(wrap);
        messages.scrollTop = messages.scrollHeight;
    }

    function setChips(list) {
        chips.innerHTML = '';
        list.forEach(label => {
            const btn = document.createElement('button');
            btn.className   = 'chip';
            btn.textContent = label;
            btn.addEventListener('click', () => handleUserInput(label));
            chips.appendChild(btn);
        });
    }

    function showTyping() {
        const wrap = document.createElement('div');
        wrap.className  = 'chat-msg bot chat-typing';
        wrap.id         = 'typingIndicator';
        wrap.innerHTML  = '<div class="chat-bubble"><span></span><span></span><span></span></div>';
        messages.appendChild(wrap);
        messages.scrollTop = messages.scrollHeight;
    }

    function hideTyping() {
        const t = document.getElementById('typingIndicator');
        if (t) t.remove();
    }

    function getResponse(text) {
        const lower = text.toLowerCase();
        for (const rule of KB.rules) {
            if (rule.keys.some(k => lower.includes(k))) return rule;
        }
        return KB.fallback;
    }

    function handleUserInput(text) {
        if (!text.trim()) return;
        appendMsg(text, 'user');
        chips.innerHTML = '';
        input.value = '';
        showTyping();
        setTimeout(() => {
            hideTyping();
            const res = getResponse(text);
            appendMsg(res.reply, 'bot');
            setChips(res.chips || KB.defaultChips);
        }, 900 + Math.random() * 400);
    }

    function openChat() {
        widget.classList.add('open');
        badge.classList.add('hidden');
        input.focus();
    }

    function closeChat() {
        widget.classList.remove('open');
    }

    toggle.addEventListener('click', () => {
        widget.classList.contains('open') ? closeChat() : openChat();
    });

    chatX.addEventListener('click', closeChat);

    sendBtn.addEventListener('click', () => handleUserInput(input.value.trim()));

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUserInput(input.value.trim()); }
    });

    setTimeout(() => {
        appendMsg(KB.greeting, 'bot');
        setChips(KB.defaultChips);
    }, 300);

    setTimeout(() => {
        if (!widget.classList.contains('open')) {
            badge.classList.remove('hidden');
        }
    }, 3500);
})();
