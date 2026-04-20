import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

dotenv.config();

// Initialize Firebase for server-side data fetching
const firebaseConfigPath = path.resolve("firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Route for building standalone campaign page
  app.post("/api/admin/build-standalone-campaign", async (req, res) => {
    console.log("[Build] Received request to build standalone campaign page");
    
    try {
      console.time("build-process");
      
      // Fetch data directly from Firestore to avoid large POST body issues
      console.log("[Build] Fetching settings from Firestore...");
      const settingsDoc = await getDoc(doc(db, "settings", "main"));
      const settings = settingsDoc.exists() ? settingsDoc.data() : {};
      
      console.log("[Build] Fetching portfolio from Firestore...");
      const portSnapshot = await getDocs(collection(db, "portfolio"));
      const portfolio = portSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      console.log(`[Build] Data fetched. Settings entries: ${Object.keys(settings).length}, Portfolio count: ${portfolio.length}`);

      const campaignPortfolio = portfolio
        .filter((item: any) => item.section === 'campaign-portfolio')
        .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));

      console.log(`[Build] Filtered campaign portfolio count: ${campaignPortfolio.length}`);

      const extractYoutubeId = (url: string) => {
        if (!url) return '';
        const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : url;
      };

      const heroVideoId = extractYoutubeId(settings.campaignHeroVideoId || '0BKvOfTyLmU');

      console.log("[Build] Generating HTML template...");
      // Comprehensive HTML Template for Standalone Campaign Page
      const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${settings.siteTitle || '이사야 캠페인'}</title>
    <meta name="description" content="${settings.metaDescription || ''}">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://hangeul.pstatic.net/hangeul_static/css/nanum-square-neo.css" rel="stylesheet">
    <style>
        :root { --accent: ${settings.accentColor || '#f59e0b'}; }
        body { font-family: 'NanumSquareNeo', sans-serif; background: black; color: white; -webkit-font-smoothing: antialiased; }
        .selection\\:bg-amber-500 ::selection { background-color: var(--accent); color: black; }
        .aspect-video { aspect-ratio: 16 / 9; }
        .break-keep { word-break: keep-all; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .gradient-text { background-clip: text; -webkit-background-clip: text; color: transparent; background-image: linear-gradient(to bottom, white, #9ca3af); }
    </style>
</head>
<body class="selection:bg-amber-500">
    <!-- Navbar (Simplified) -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5 py-4 px-6">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <a href="/" class="text-xl font-black tracking-tighter">ISAIAH <span class="text-amber-500">CAMPAIGN</span></a>
            <div class="hidden md:flex space-x-8 text-[10px] font-bold tracking-[0.2em] uppercase">
                <a href="#why-isaiah" class="hover:text-amber-500 transition-colors">Philosophy</a>
                <a href="#services" class="hover:text-amber-500 transition-colors">Services</a>
                <a href="#portfolio" class="hover:text-amber-500 transition-colors">Portfolio</a>
                <a href="#contact" class="px-4 py-2 bg-amber-500 text-black rounded-full hover:bg-amber-400 transition-all">Connect</a>
            </div>
        </div>
    </nav>

    <!-- 1. Hero Section -->
    <section class="relative h-[90vh] w-full overflow-hidden flex items-end justify-end bg-black pb-24 md:pb-32">
        <div class="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
            <iframe 
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] h-[115%] scale-[1.35]"
                src="https://www.youtube.com/embed/${heroVideoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${heroVideoId}&modestbranding=1&rel=0"
                frameborder="0" allow="autoplay; encrypted-media"></iframe>
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        <div class="relative z-10 max-w-7xl mx-auto px-6 text-right w-full">
            <div class="flex flex-wrap justify-end gap-3 mb-8">
                ${(settings.campaignHeroSubcopy || 'Real-time Workflow, Cinematic Story').split(',').map((tag: string) => `
                <span class="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                    ${tag.trim()}
                </span>`).join('')}
            </div>
            <h1 class="text-2xl md:text-4xl font-bold tracking-tighter leading-[1.6] mb-8 break-keep gradient-text whitespace-pre-line uppercase">
                ${(settings.campaignHeroHeadline || '선거는 초단위의 속도전,\n메시지는 영상이 될 때 힘을 가집니다.').replace(/\n/g, '<br>')}
            </h1>
            <p class="text-white/60 text-lg md:text-xl max-w-3xl ml-auto mb-4 leading-[1.8] break-keep whitespace-pre-line">
                ${(settings.campaignHeroDescription || '기획, 촬영, 편집, 현장 대응, 라이브, 브랜딩까지\n후보와 캠프의 철학을 유권자에게 전달하는 캠페인 미디어 통합 솔루션').replace(/\n/g, '<br>')}
            </p>
        </div>
    </section>

    <!-- 2. Why Isaiah Section -->
    <section id="why-isaiah" class="py-24 bg-neutral-950">
        <div class="max-w-7xl mx-auto px-6">
            <div class="mb-16">
                <h4 class="text-amber-500 font-bold tracking-widest mb-4 uppercase text-xs">Why Isaiah</h4>
                <h2 class="text-3xl md:text-5xl font-bold tracking-tighter leading-snug md:leading-[1.2]">압도적 경험이 완성하는<br> <span class="text-amber-500 text-6xl md:text-8xl block mt-2">캠페인</span>의 결과</h2>
            </div>
            <div class="grid md:grid-cols-4 gap-6">
                ${[
                    { main: '속도와 시스템', sub: 'Speed & System', desc: '초단위 대응이 필요한 캠페인 현장에서 즉각적인 콘텐츠 생산과 배포 시스템을 가동합니다.', icon: 'zap' },
                    { main: '스토리텔링과 퀄리티', sub: 'Storytelling & Quality', desc: '단순한 정보 전달을 넘어 후보의 철학을 시네마틱한 문법으로 풀어내 유권자의 마음을 움직입니다.', icon: 'target' },
                    { main: '현장 실행력', sub: 'Field Excellence', desc: '전국 단위의 현장 촬영, 라이브 송출, 돌발 상황 대응까지 수많은 현장에서 검증된 실행력을 제공합니다.', icon: 'users' },
                    { main: '아이덴티티와 브랜딩', sub: 'Identity & Branding', desc: '캠페인 전체의 시각 언어를 통합 관리하여 후보만의 독보적인 브랜드 아이덴티티를 구축합니다.', icon: 'shield-check' }
                ].map(item => `
                <div class="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors group">
                    <div class="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
                        <i data-lucide="${item.icon}" class="w-6 h-6 text-amber-500"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-1">${item.main}</h3>
                    <p class="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-4">${item.sub}</p>
                    <p class="text-white/40 text-sm leading-relaxed break-keep">${item.desc}</p>
                </div>`).join('')}
            </div>
        </div>
    </section>

    <!-- 3. Service Details -->
    <section id="services" class="py-24 bg-black">
        <div class="max-w-7xl mx-auto px-6">
            ${[
                { main: '디지털 워크플로우 & 인프라', sub: 'Infrastructure', desc: '선거는 초단위의 속도전, 정보 유실 없는 실시간 협업 체계를 구축합니다.', img: settings.campaignService1Image || 'https://picsum.photos/seed/infra/800/600' },
                { main: '미디어 콘텐츠 제작', sub: 'Production', desc: '유권자의 마음을 움직이는 고품격 미디어 콘텐츠을 제작합니다.', img: settings.campaignService2Image || 'https://picsum.photos/seed/prod/800/600', rev: true },
                { main: '현장 대응 및 협업', sub: 'Field Operations', desc: '현장의 열기를 실시간으로 전달하며 어떤 상황에서도 유연하게 대응합니다.', img: settings.campaignService3Image || 'https://picsum.photos/seed/field/800/600' },
                { main: '브랜드 아이덴티티', sub: 'Branding', desc: '후보의 철학을 시각화하여 유권자에게 일관되고 강력한 메시지를 전달합니다.', img: settings.campaignService4Image || 'https://picsum.photos/seed/brand/800/600', rev: true }
            ].map((s, i) => `
            <div class="flex flex-col ${s.rev ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 mb-32">
                <div class="flex-1 space-y-6 ${s.rev ? 'md:text-right' : ''}">
                    <div class="flex items-center space-x-2 text-amber-500 font-bold text-xs uppercase tracking-widest ${s.rev ? 'md:justify-end md:space-x-reverse' : ''}">
                        <span class="w-8 h-px bg-amber-500"></span>
                        <span>Service ${i + 1}</span>
                    </div>
                    <h3 class="text-3xl md:text-5xl font-bold tracking-tighter uppercase">${s.main}</h3>
                    <p class="text-white/60 text-xl leading-relaxed break-keep">${s.desc}</p>
                </div>
                <div class="flex-1 w-full aspect-[4/3] rounded-3xl overflow-hidden bg-white/5">
                    <img src="${s.img}" class="w-full h-full object-cover">
                </div>
            </div>`).join('')}
        </div>
    </section>

    <!-- 4. Portfolio -->
    <section id="portfolio" class="py-24 bg-neutral-950">
        <div class="max-w-7xl mx-auto px-6">
            <div class="mb-16">
                <h4 class="text-amber-500 font-bold tracking-widest mb-4 uppercase text-xs">Records</h4>
                <h2 class="text-3xl md:text-5xl font-bold tracking-tighter mb-4">입증된 결과로 말하는<br>캠페인 미디어 레코드</h2>
            </div>
            <div class="grid md:grid-cols-2 gap-8">
                ${campaignPortfolio.map(item => `
                <div class="group cursor-pointer rounded-xl overflow-hidden bg-white/5 aspect-video relative" onclick="openVideo('${extractYoutubeId(item.videoUrl || item.youtubeUrl)}')">
                    <img src="${item.thumbnail || 'https://img.youtube.com/vi/' + extractYoutubeId(item.videoUrl || item.youtubeUrl) + '/maxresdefault.jpg'}" class="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500">
                    <div class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <div class="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center mb-4">
                            <i data-lucide="play" class="w-6 h-6 text-black fill-current"></i>
                        </div>
                        <h4 class="text-xl font-bold mb-2 break-keep">${item.title}</h4>
                        <p class="text-sm text-white/40">${item.year || ''} | ${item.clientOrCandidate || ''}</p>
                    </div>
                </div>`).join('')}
            </div>
        </div>
    </section>

    <!-- 5. CTA -->
    <section id="contact" class="py-32 bg-black text-center relative overflow-hidden">
        <div class="absolute inset-0 bg-amber-500/5 opacity-50 blur-[100px]"></div>
        <div class="relative z-10 max-w-4xl mx-auto px-6">
            <h2 class="text-4xl md:text-7xl font-bold tracking-tighter mb-8 uppercase leading-none">Your Next Winning<br><span class="text-amber-500 italic">Campaign starts here</span></h2>
            <p class="text-white/40 text-lg mb-12 break-keep leading-relaxed">준비되셨습니까? 이사야가 당신의 캠페인을 완성합니다.</p>
            <a href="tel:${settings.contactPhone || ''}" class="inline-flex items-center space-x-4 bg-white text-black px-12 py-6 rounded-full font-black tracking-widest hover:bg-amber-500 transition-all uppercase text-lg group">
                <span>Start Project</span>
                <i data-lucide="arrow-right" class="w-6 h-6 group-hover:translate-x-2 transition-transform"></i>
            </a>
        </div>
    </section>

    <footer class="py-12 bg-black border-t border-white/10 text-center">
        <p class="text-white/20 text-[10px] tracking-[0.5em] uppercase">© 2024 PRODUCTION ISAIAH. Precision in Action.</p>
    </footer>

    <script>
        lucide.createIcons();
        function openVideo(id) {
            const overlay = document.createElement('div');
            overlay.style = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
            overlay.innerHTML = '<div style="width:100%;max-width:1200px;aspect-ratio:16/9;background:black;position:relative;"><button onclick="this.parentElement.parentElement.remove()" style="position:absolute;top:-40px;right:0;color:white;font-weight:bold;">CLOSE</button><iframe src="https://www.youtube.com/embed/' + id + '?autoplay=1" style="width:100%;height:100%;border:none;" allow="autoplay; fullscreen"></iframe></div>';
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
            document.body.appendChild(overlay);
        }
        // Smooth scroll for anchors
        document.querySelectorAll(\'a[href^="#"]\').forEach(anchor => {
            anchor.addEventListener(\'click\', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute(\'href\')).scrollIntoView({ behavior: \'smooth\' });
            });
        });
    </script>
</body>
</html>`;

      console.log(`[Build] Writing HTML to public/campaign (Length: ${html.length} characters)`);
      const campaignDir = path.resolve("public", "campaign");
      if (!fs.existsSync(campaignDir)) {
        await fs.promises.mkdir(campaignDir, { recursive: true });
      }
      await fs.promises.writeFile(path.join(campaignDir, "index.html"), html);

      // Also write to dist if in production
      console.log("[Build] Writing HTML to dist/campaign if exists");
      const distDir = path.resolve("dist", "campaign");
      if (fs.existsSync(path.resolve("dist"))) {
        if (!fs.existsSync(distDir)) await fs.promises.mkdir(distDir, { recursive: true });
        await fs.promises.writeFile(path.join(distDir, "index.html"), html);
      }

      console.timeEnd("build-process");
      console.log("[Build] Standalone campaign page built successfully");
      res.status(200).json({ success: true, path: "/campaign/index.html" });
    } catch (error) {
      console.timeEnd("build-process");
      console.error("[Build] Build standalone error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // API Route for sending emails
  app.post("/api/send-email", async (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Missing email credentials in environment variables.");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "zootv.kr@gmail.com",
      subject: `[문의] ${name}님의 제작 문의`,
      text: `
이름: ${name}
이메일: ${email}
전화번호: ${phone}

내용:
${message}
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve("dist");
    
    // 캠페인 페이지 직접 접속 대응 (독립형 파일 우선 순위)
    app.get(["/campaign", "/campaign/"], (req, res) => {
      const campaignPath = path.join(distPath, "campaign", "index.html");
      if (fs.existsSync(campaignPath)) {
        res.sendFile(campaignPath);
      } else {
        res.sendFile(path.join(distPath, "index.html"));
      }
    });

    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
