export enum GameState { MENU, PLAYING, PAUSED, GAME_OVER }

type AnimalSprite = 'tucano' | 'arara' | 'capivara' | 'jaguar' | 'jow' | 'thais';
type Difficulty = 'easy' | 'normal' | 'chaos';
type ScoreEntry = { name: string; animal: AnimalSprite; score: number };
type Portal = { x: number; y: number; radius: number; active: boolean };

export class Game {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private state: GameState = GameState.MENU;
  private lastTime: number = 0;
  private score: number = 0;
  private highScore: number = 0;
  private playerName: string = 'Nono Caldas';
  private selectedAnimal: AnimalSprite = 'tucano';
  private selectedDifficulty: Difficulty = 'easy';
  private scoreHistory: ScoreEntry[] = [];
  private worldMode: 'tucano' | 'blocks' = 'tucano';
  private worldShiftTimer: number = 0;
  private nextPortalScore: number = 3;
  
  // Entities
  private tucano!: { x: number; y: number; vy: number; width: number; height: number; rotation: number };
  private pipes!: Array<{ x: number; gapY: number; passed: boolean }>;
  private particles!: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>;
  private portals!: Portal[];
  
  // Constants
  private gravity = 1450;
  private flapForce = -470;
  private pipeSpeed = 250;
  private pipeSpawnRate = 2.2;
  private pipeWidth = 120;  // Larger pipes
  private pipeGap = 240;    // Slightly larger gap for bigger sprites
  private pipeTimer: number = 0;
  
  // Custom animal images
  private customImages: Map<string, HTMLImageElement> = new Map();
  
  // Background panorama
  private bgImage: HTMLImageElement | null = null;
  private bgOffset: number = 0;
  
  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.loadCustomImages();
    this.loadBackground();
    this.reset();
  }
  
  private loadBackground(): void {
    // Single panoramic image that loops seamlessly
    const img = new Image();
    img.crossOrigin = 'anonymous';  // Enable CORS for GitHub Pages
    img.onload = () => {
      console.log('Loaded panoramic background: ' + img.naturalWidth + 'x' + img.naturalHeight);
    };
    img.onerror = (e) => {
      console.error('Failed to load panoramic background:', e);
    };
    img.src = 'backgrounds/brazil-coast-panorama.jpg';
    this.bgImage = img;
  }
  
  private loadCustomImages(): void {
    // Load custom sprites for Jow and Thais - use PNG with transparency
    const imageFiles = [
      { name: 'jow', src: 'sprites/jow.png' },
      { name: 'thais', src: 'sprites/thais.png' }
    ];
    
    for (const { name, src } of imageFiles) {
      const img = new Image();
      img.onload = () => {
        console.log(`Loaded ${name} sprite`);
      };
      img.onerror = () => {
        console.warn(`Failed to load ${name} sprite, will use fallback`);
      };
      img.src = src;
      this.customImages.set(name, img);
    }
  }
  
  private reset(): void {
    this.tucano = { x: 300, y: this.height / 2, vy: 0, width: 40, height: 30, rotation: 0 };
    this.pipes = [];
    this.particles = [];
    this.score = 0;
    this.pipeTimer = 0;
    this.portals = [];
    this.worldMode = 'tucano';
    this.worldShiftTimer = 0;
    this.nextPortalScore = 3;
  }
  
  start(): void {
    this.loop(0);
  }
  
  private loop(timestamp: number): void {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;
    
    if (this.state === GameState.PLAYING) {
      this.update(dt);
    }
    this.render();
    
    requestAnimationFrame((t) => this.loop(t));
  }
  
  private update(dt: number): void {
    // Physics
    this.tucano.vy += this.gravity * dt;
    this.tucano.y += this.tucano.vy * dt;
    this.tucano.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.tucano.vy / 500)));
    
    // Ground/ceiling collision
    if (this.tucano.y + this.tucano.height/2 > this.height - 50 || this.tucano.y < -50) {
      this.gameOver();
      return;
    }
    
    if (this.worldMode === 'blocks') {
      this.worldShiftTimer -= dt;
      if (this.worldShiftTimer <= 0) {
        this.worldMode = 'tucano';
        this.portals.push({ x: this.width + 120, y: this.height * 0.42, radius: 54, active: true });
      }
    }

    // Pipes
    this.pipeTimer += dt;
    if (this.pipeTimer >= this.pipeSpawnRate) {
      this.spawnPipe();
      this.pipeTimer = 0;
    }
    
    for (const pipe of this.pipes) {
      pipe.x -= this.pipeSpeed * dt;
      
      // Collision
      if (this.checkCollision(pipe)) {
        this.gameOver();
        return;
      }
      
      // Score
      if (!pipe.passed && pipe.x + this.pipeWidth < this.tucano.x) {
        pipe.passed = true;
        this.score++;
        this.spawnParticles(this.tucano.x, this.tucano.y, '#FFD700', 10);
        if (this.score >= this.nextPortalScore && this.worldMode === 'tucano' && !this.portals.some((portal) => portal.active)) {
          this.portals.push({ x: this.width + 120, y: this.height * (0.28 + Math.random() * 0.3), radius: 52, active: true });
          this.nextPortalScore += 4;
        }
      }
    }
    
    // Remove off-screen pipes
    this.pipes = this.pipes.filter(p => p.x > -this.pipeWidth);
    this.portals = this.portals.filter((portal) => portal.x > -portal.radius * 2 && portal.active);
    for (const portal of this.portals) {
      portal.x -= this.pipeSpeed * dt;
      const dx = this.tucano.x - portal.x;
      const dy = this.tucano.y - portal.y;
      if (dx * dx + dy * dy < (portal.radius + 16) * (portal.radius + 16)) {
        portal.active = false;
        this.spawnParticles(portal.x, portal.y, '#9B5DE5', 20);
        if (this.worldMode === 'tucano') {
          this.worldMode = 'blocks';
          this.worldShiftTimer = 6.5;
        } else {
          this.worldMode = 'tucano';
        }
      }
    }
    
    // Particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }
  
  private spawnPipe(): void {
    const minGapY = 100;
    const maxGapY = this.height - 100 - this.pipeGap;
    const gapY = Math.random() * (maxGapY - minGapY) + minGapY;
    this.pipes.push({ x: this.width + this.pipeWidth, gapY, passed: false });
  }
  
  private checkCollision(pipe: { x: number; gapY: number }): boolean {
    const tLeft = this.tucano.x - this.tucano.width/2;
    const tRight = this.tucano.x + this.tucano.width/2;
    const tTop = this.tucano.y - this.tucano.height/2;
    const tBottom = this.tucano.y + this.tucano.height/2;
    
    const pLeft = pipe.x;
    const pRight = pipe.x + this.pipeWidth;
    const gapTop = pipe.gapY;
    const gapBottom = pipe.gapY + this.pipeGap;
    
    // Check if tucano overlaps pipe horizontally
    if (tRight > pLeft && tLeft < pRight) {
      // Check if tucano is NOT in the gap vertically
      if (tTop < gapTop || tBottom > gapBottom) {
        return true;
      }
    }
    return false;
  }
  
  private spawnParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        life: 0.5 + Math.random() * 0.5,
        color
      });
    }
  }
  
  private gameOver(): void {
    this.state = GameState.GAME_OVER;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
    this.scoreHistory.unshift({ name: this.playerName, animal: this.selectedAnimal, score: this.score });
    this.scoreHistory = this.scoreHistory
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }
  
  setPlayerName(name: string): void {
    const trimmed = name.trim();
    this.playerName = trimmed.length > 0 ? trimmed : 'Nono Caldas';
  }

  getPlayerName(): string {
    return this.playerName;
  }

  setAnimal(animal: AnimalSprite): void {
    this.selectedAnimal = animal;
  }

  getAnimal(): AnimalSprite {
    return this.selectedAnimal;
  }

  setDifficulty(difficulty: Difficulty): void {
    this.selectedDifficulty = difficulty;
    if (difficulty === 'easy') {
      this.gravity = 1360;
      this.flapForce = -520;
      this.pipeSpeed = 220;
      this.pipeSpawnRate = 2.45;
      this.pipeGap = 250;
    } else if (difficulty === 'normal') {
      this.gravity = 1450;
      this.flapForce = -470;
      this.pipeSpeed = 250;
      this.pipeSpawnRate = 2.2;
      this.pipeGap = 220;
    } else {
      this.gravity = 1560;
      this.flapForce = -455;
      this.pipeSpeed = 295;
      this.pipeSpawnRate = 1.8;
      this.pipeGap = 190;
    }
  }

  getDifficulty(): Difficulty {
    return this.selectedDifficulty;
  }

  getScoreHistory(): ScoreEntry[] {
    return this.scoreHistory;
  }

  flap(): void {
    if (this.state === GameState.PLAYING) {
      this.tucano.vy = this.flapForce;
      const trailColors: Record<AnimalSprite, string> = {
        tucano: '#FFFFFF',
        arara: '#FF3D00',
        capivara: '#A1887F',
        jaguar: '#FFDF00',
        jow: '#D4A574',
        thais: '#87CEEB',
      };
      this.spawnParticles(this.tucano.x - 20, this.tucano.y, trailColors[this.selectedAnimal], 7);
    } else if (this.state === GameState.MENU || this.state === GameState.GAME_OVER) {
      this.reset();
      this.state = GameState.PLAYING;
    }
  }
  
  togglePause(): void {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
    } else if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
    }
  }
  
  navigate(_key: number): void {
    // Menu navigation - placeholder for future
  }
  
  private render(): void {
    const groundY = this.height - 50;
    const time = this.lastTime / 1000;
    
    // Scrolling panoramic background (Brazil coast)
    const usePhotoBg = this.bgImage && this.bgImage.complete && this.bgImage.naturalWidth > 0;
    
    if (usePhotoBg && this.bgImage) {
      // Scroll background slowly - seamless loop
      this.bgOffset += this.pipeSpeed * 0.02;
      
      const img = this.bgImage;
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      
      // Scale to fill height, maintain aspect
      const scale = this.height / imgHeight;
      const drawWidth = imgWidth * scale;
      const drawHeight = this.height;
      
      // Calculate position for seamless looping
      const xPos = -(this.bgOffset % drawWidth);
      
      // Draw current position
      this.ctx.drawImage(img, xPos, 0, drawWidth, drawHeight);
      // Draw next copy for seamless loop
      this.ctx.drawImage(img, xPos + drawWidth, 0, drawWidth, drawHeight);
      // Draw one more to cover any gaps
      this.ctx.drawImage(img, xPos + drawWidth * 2, 0, drawWidth, drawHeight);
    } else {
      // Fallback gradient sky
      const sky = this.ctx.createLinearGradient(0, 0, 0, groundY);
      if (this.worldMode === 'blocks') {
        sky.addColorStop(0, '#5E60CE');
        sky.addColorStop(0.5, '#5390D9');
        sky.addColorStop(1, '#80FFDB');
      } else {
        sky.addColorStop(0, '#FF6B6B');
        sky.addColorStop(0.55, '#FECA57');
        sky.addColorStop(1, '#48DBFB');
      }
      this.ctx.fillStyle = sky;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Legacy background elements (only when NOT using photo background)
    if (!usePhotoBg) {
      const farOffset = (time * this.pipeSpeed * 0.1) % this.width;
      const midOffset = (time * this.pipeSpeed * 0.3) % this.width;
      const cloudOffset = (time * this.pipeSpeed * 0.5) % (this.width + 220);

      // Sun glow behind the skyline.
      const sunGlow = this.ctx.createRadialGradient(this.width * 0.72, groundY * 0.58, 10, this.width * 0.72, groundY * 0.58, 180);
      sunGlow.addColorStop(0, 'rgba(255, 240, 180, 0.95)');
      sunGlow.addColorStop(0.5, 'rgba(255, 205, 87, 0.35)');
      sunGlow.addColorStop(1, 'rgba(255, 205, 87, 0)');
      this.ctx.fillStyle = sunGlow;
      this.ctx.fillRect(0, 0, this.width, groundY);

      if (this.worldMode === 'blocks') {
        this.ctx.fillStyle = '#6930C3';
        for (let i = -1; i < 5; i++) {
          const baseX = i * 180 - farOffset;
          for (let h = 0; h < 4; h++) {
            const size = 36;
            this.ctx.fillRect(baseX + h * size, groundY - 70 - h * 24, size, size);
            this.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            this.ctx.strokeRect(baseX + h * size, groundY - 70 - h * 24, size, size);
          }
        }
        this.ctx.fillStyle = '#4EA8DE';
        for (let i = -1; i < 4; i++) {
          const baseX = i * 260 - midOffset;
          this.ctx.fillRect(baseX + 20, groundY - 160, 48, 48);
          this.ctx.fillRect(baseX + 68, groundY - 112, 48, 48);
          this.ctx.fillRect(baseX + 116, groundY - 64, 48, 48);
        }
      } else {
        // Far mountains.
        this.ctx.fillStyle = '#2D1B4E';
        for (let i = -1; i < 3; i++) {
          const baseX = i * 320 - farOffset;
          this.ctx.beginPath();
          this.ctx.moveTo(baseX, groundY);
          this.ctx.lineTo(baseX + 70, groundY - 55);
          this.ctx.lineTo(baseX + 150, groundY - 18);
          this.ctx.lineTo(baseX + 235, groundY - 85);
          this.ctx.lineTo(baseX + 320, groundY);
          this.ctx.closePath();
          this.ctx.fill();
        }

        // Mid layer with Christ the Redeemer silhouettes.
        this.ctx.fillStyle = '#1A3A5C';
        for (let i = -1; i < 2; i++) {
          const baseX = i * (this.width * 0.85) - midOffset;
          this.ctx.beginPath();
          this.ctx.moveTo(baseX, groundY);
          this.ctx.quadraticCurveTo(baseX + 120, groundY - 60, baseX + 260, groundY);
          this.ctx.lineTo(baseX, groundY);
          this.ctx.fill();

          const statueX = baseX + 155;
          const statueY = groundY - 88;
          this.ctx.beginPath();
          this.ctx.moveTo(statueX - 6, statueY + 42);
          this.ctx.lineTo(statueX - 16, statueY + 82);
          this.ctx.lineTo(statueX + 16, statueY + 82);
          this.ctx.lineTo(statueX + 6, statueY + 42);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.fillRect(statueX - 7, statueY + 8, 14, 36);
          this.ctx.fillRect(statueX - 44, statueY + 12, 88, 10);
          this.ctx.beginPath();
          this.ctx.arc(statueX, statueY, 10, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }

      // Clouds.
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
      for (let i = -1; i < 5; i++) {
        const x = i * 210 - cloudOffset;
        const y = 70 + (i % 3) * 55;
        this.ctx.beginPath();
        this.ctx.arc(x + 36, y, 24, 0, Math.PI * 2);
        this.ctx.arc(x + 60, y - 10, 30, 0, Math.PI * 2);
        this.ctx.arc(x + 92, y, 22, 0, Math.PI * 2);
        this.ctx.arc(x + 66, y + 12, 26, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Ground.
    this.ctx.fillStyle = this.worldMode === 'blocks' ? '#2B9348' : '#2D5A3D';
    this.ctx.fillRect(0, groundY, this.width, this.height - groundY);
    this.ctx.fillStyle = this.worldMode === 'blocks' ? '#55A630' : '#57B86A';
    this.ctx.fillRect(0, groundY, this.width, 8);
    this.ctx.strokeStyle = 'rgba(123, 201, 111, 0.28)';
    this.ctx.lineWidth = 2;
    for (let x = -40; x < this.width + 40; x += 22) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, groundY + 14);
      this.ctx.lineTo(x + 10, groundY + 32);
      this.ctx.moveTo(x + 8, groundY + 12);
      this.ctx.lineTo(x + 16, groundY + 28);
      this.ctx.stroke();
    }

    // Portals.
    for (const portal of this.portals) {
      const ringColor = this.worldMode === 'blocks' ? '#FF9F1C' : '#9B5DE5';
      this.ctx.save();
      this.ctx.translate(portal.x, portal.y);
      this.ctx.strokeStyle = ringColor;
      this.ctx.lineWidth = 8;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, portal.radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, portal.radius - 12, 0, Math.PI * 2);
      this.ctx.stroke();
      for (let i = 0; i < 6; i++) {
        this.ctx.fillStyle = i % 2 === 0 ? ringColor : '#ffffff';
        this.ctx.fillRect(-10 + i * 4, -portal.radius + 10 + i * 12, 8, 8);
      }
      this.ctx.restore();
    }

    // Pipes with color variation.
    const pipeColors = [
      { main: '#009C3B', accent: '#FFDF00' },  // Brazil green/gold
      { main: '#FF6B6B', accent: '#4ECDC4' },  // Coral/teal
      { main: '#9B59B6', accent: '#F1C40F' },  // Purple/gold
      { main: '#E74C3C', accent: '#3498DB' },  // Red/blue
      { main: '#2ECC71', accent: '#E67E22' },  // Green/orange
    ];
    
    for (let i = 0; i < this.pipes.length; i++) {
      const pipe = this.pipes[i];
      const colorSet = pipeColors[i % pipeColors.length];
      const bottomPipeY = pipe.gapY + this.pipeGap;
      const bottomPipeHeight = this.height - bottomPipeY - 50;

      this.ctx.fillStyle = this.worldMode === 'blocks' ? '#4CC9F0' : colorSet.main;
      this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.gapY);
      this.ctx.fillRect(pipe.x, bottomPipeY, this.pipeWidth, bottomPipeHeight);

      this.ctx.fillStyle = this.worldMode === 'blocks' ? '#90BE6D' : colorSet.accent;
      this.ctx.fillRect(pipe.x + 8, pipe.gapY * 0.48, this.pipeWidth - 16, 16);
      this.ctx.fillRect(pipe.x + 8, bottomPipeY + bottomPipeHeight * 0.2, this.pipeWidth - 16, 16);

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.fillRect(pipe.x + 10, 0, 14, pipe.gapY);
      this.ctx.fillRect(pipe.x + 10, bottomPipeY, 14, bottomPipeHeight);

      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(pipe.x, 0, this.pipeWidth, pipe.gapY);
      this.ctx.strokeRect(pipe.x, bottomPipeY, this.pipeWidth, bottomPipeHeight);
    }

    // Feather trail while rising.
    if (this.tucano.vy < -50) {
      const featherCount = 4;
      const trailMap: Record<AnimalSprite, string[]> = {
        tucano: ['#FFFFFF'],
        arara: ['#1565C0', '#FF3D00'],
        capivara: ['#A1887F', '#7CB342'],
        jaguar: ['#FFDF00', '#F9A825'],
        jow: ['#D4A574', '#8B7355', '#FFD700'],
        thais: ['#87CEEB', '#E6E6FA', '#FFD700'],
      };
      const trailColors = trailMap[this.selectedAnimal];
      for (let i = 0; i < featherCount; i++) {
        const featherX = this.tucano.x - 10 - i * 11;
        const featherY = this.tucano.y + 6 + Math.sin(time * 10 + i) * 4;
        this.ctx.save();
        this.ctx.translate(featherX, featherY);
        this.ctx.rotate(-0.55 + i * 0.12);
        this.ctx.globalAlpha = 0.22 - i * 0.04;
        this.ctx.fillStyle = trailColors[i % trailColors.length];
        if (this.selectedAnimal === 'capivara') {
          this.ctx.beginPath();
          this.ctx.moveTo(-6, 2);
          this.ctx.lineTo(0, -6);
          this.ctx.lineTo(7, 1);
          this.ctx.lineTo(0, 6);
          this.ctx.closePath();
        } else {
          this.ctx.beginPath();
          this.ctx.moveTo(-6, 0);
          this.ctx.quadraticCurveTo(0, -5, 7, 0);
          this.ctx.quadraticCurveTo(0, 4, -6, 0);
        }
        this.ctx.fill();
        this.ctx.restore();
      }
      this.ctx.globalAlpha = 1;
    }

    // Animal sprite.
    this.ctx.save();
    this.ctx.translate(this.tucano.x, this.tucano.y);
    this.ctx.rotate(this.tucano.rotation);

    const wingAngle = Math.sin(time * 18) * 0.35 - Math.min(this.tucano.vy / 900, 0.15);

    if (this.selectedAnimal === 'tucano') {
      this.ctx.fillStyle = '#111';
      this.ctx.beginPath();
      this.ctx.ellipse(-3, 0, 32, 24, -0.1, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.ellipse(-27, -2, 17, 15, -0.2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.save();
      this.ctx.translate(-6, 3);
      this.ctx.rotate(wingAngle);
      this.ctx.fillStyle = '#1C1C1C';
      this.ctx.beginPath();
      this.ctx.moveTo(-6, -2);
      this.ctx.quadraticCurveTo(-27, 12, -18, 30);
      this.ctx.quadraticCurveTo(6, 20, 14, 3);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
      this.ctx.fillStyle = '#F8F8F2';
      this.ctx.beginPath();
      this.ctx.moveTo(-24, -3);
      this.ctx.quadraticCurveTo(-6, 6, -12, 23);
      this.ctx.quadraticCurveTo(-29, 14, -24, -3);
      this.ctx.fill();
      const beakGrad = this.ctx.createLinearGradient(9, -12, 57, 15);
      beakGrad.addColorStop(0, '#FFE66D');
      beakGrad.addColorStop(0.6, '#FF9F1C');
      beakGrad.addColorStop(1, '#F77F00');
      this.ctx.fillStyle = beakGrad;
      this.ctx.beginPath();
      this.ctx.moveTo(6, -12);
      this.ctx.quadraticCurveTo(45, -24, 57, -5);
      this.ctx.quadraticCurveTo(33, 0, 11, 5);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.fillStyle = '#111';
      this.ctx.beginPath();
      this.ctx.moveTo(42, -14);
      this.ctx.quadraticCurveTo(60, -11, 54, 2);
      this.ctx.quadraticCurveTo(42, -2, 39, -8);
      this.ctx.closePath();
      this.ctx.fill();
    } else if (this.selectedAnimal === 'arara') {
      this.ctx.fillStyle = '#1565C0';
      this.ctx.beginPath();
      this.ctx.ellipse(-6, 0, 33, 26, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#FF3D00';
      this.ctx.beginPath();
      this.ctx.ellipse(-27, -3, 15, 15, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.save();
      this.ctx.translate(-3, 5);
      this.ctx.rotate(wingAngle);
      this.ctx.fillStyle = '#0D47A1';
      this.ctx.beginPath();
      this.ctx.moveTo(-3, 0);
      this.ctx.quadraticCurveTo(-27, 15, -15, 33);
      this.ctx.quadraticCurveTo(9, 21, 18, 2);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
      this.ctx.fillStyle = '#FFD54F';
      this.ctx.quadraticCurveTo(6, 14, 12, 1);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
      this.ctx.fillStyle = '#FFD54F';
      this.ctx.beginPath();
      this.ctx.moveTo(6, -5);
      this.ctx.quadraticCurveTo(24, -11, 28, -1);
      this.ctx.quadraticCurveTo(18, 2, 7, 4);
      this.ctx.closePath();
      this.ctx.fill();
    } else if (this.selectedAnimal === 'capivara') {
      this.ctx.fillStyle = '#8D6E63';
      this.ctx.beginPath();
      this.ctx.ellipse(-6, 3, 36, 23, 0.05, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.ellipse(-30, -3, 18, 15, -0.1, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#6D4C41';
      this.ctx.fillRect(-38, 14, 12, 12);
      this.ctx.fillRect(-15, 15, 12, 12);
      this.ctx.fillRect(9, 15, 12, 12);
      this.ctx.save();
      this.ctx.translate(-2, 2);
      this.ctx.rotate(wingAngle * 0.3);
      this.ctx.fillStyle = '#A1887F';
      this.ctx.beginPath();
      this.ctx.ellipse(3, 0, 15, 11, 0.1, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    } else if (this.selectedAnimal === 'jaguar') {
      this.ctx.fillStyle = '#F9A825';
      this.ctx.beginPath();
      this.ctx.ellipse(-6, 0, 33, 21, -0.05, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#6D4C41';
      this.ctx.beginPath();
      this.ctx.ellipse(-27, -3, 17, 15, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.save();
      this.ctx.translate(-3, 3);
      this.ctx.rotate(wingAngle * 0.75);
      this.ctx.fillStyle = '#5D4037';
      this.ctx.beginPath();
      this.ctx.moveTo(0, -3);
      this.ctx.quadraticCurveTo(-24, 15, -11, 33);
      this.ctx.quadraticCurveTo(15, 18, 18, 2);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
      this.ctx.fillStyle = '#212121';
      this.ctx.fillRect(15, -9, 15, 5);
      this.ctx.fillRect(18, -2, 12, 5);
    } else if (this.selectedAnimal === 'jow') {
      // Jow - The legendary Jonatha-bird (custom image)
      // Cancel the bird rotation for photos - they should stay upright
      this.ctx.rotate(-this.tucano.rotation);
      const img = this.customImages.get('jow');
      if (img && img.complete && img.naturalWidth > 0) {
        // Draw the actual photo - WIDER aspect for better look
        const targetWidth = 280;  // Fixed width for consistent sizing
        const targetHeight = 200; // Shorter height for wider look
        // Center the image on the bird position
        const offsetX = -targetWidth / 2;
        const offsetY = -targetHeight / 2;
        // Add glow effect
        this.ctx.shadowColor = 'rgba(212, 165, 116, 0.6)';
        this.ctx.shadowBlur = 20;
        this.ctx.drawImage(img, offsetX, offsetY, targetWidth, targetHeight);
        this.ctx.shadowBlur = 0;
      } else {
        // Fallback: simple bird shape
        this.ctx.fillStyle = '#8B7355';
        this.ctx.beginPath();
        this.ctx.ellipse(-2, 0, 23, 18, -0.05, 0, Math.PI * 2);
        this.ctx.fill();
      }
    } else if (this.selectedAnimal === 'thais') {
      // Thais - The graceful Thais-bird (custom image)
      // Cancel the bird rotation for photos - they should stay upright
      this.ctx.rotate(-this.tucano.rotation);
      const img = this.customImages.get('thais');
      if (img && img.complete && img.naturalWidth > 0) {
        // Draw the actual photo - WIDER aspect for better look
        const targetWidth = 280;  // Fixed width for consistent sizing
        const targetHeight = 200; // Shorter height for wider look
        // Center the image on the bird position
        const offsetX = -targetWidth / 2;
        const offsetY = -targetHeight / 2;
        // Add glow effect
        this.ctx.shadowColor = 'rgba(245, 222, 179, 0.6)';
        this.ctx.shadowBlur = 20;
        this.ctx.drawImage(img, offsetX, offsetY, targetWidth, targetHeight);
        this.ctx.shadowBlur = 0;
      } else {
        // Fallback: simple bird shape
        this.ctx.fillStyle = '#E8D5C4';
        this.ctx.beginPath();
        this.ctx.ellipse(-2, 0, 22, 17, -0.03, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    this.ctx.fillStyle = '#2ECC71';
    this.ctx.beginPath();
    this.ctx.arc(-15, -5, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#FFF';
    this.ctx.beginPath();
    this.ctx.arc(-15, -5, 3, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#111';
    this.ctx.beginPath();
    this.ctx.arc(-14.5, -5, 1.5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();

    // Particles.
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(Math.atan2(p.vy, p.vx || 0.01));
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.fillStyle = p.color;
      if (p.color === '#FFFFFF') {
        this.ctx.beginPath();
        this.ctx.moveTo(-5, 0);
        this.ctx.quadraticCurveTo(0, -4, 6, 0);
        this.ctx.quadraticCurveTo(0, 4, -5, 0);
        this.ctx.fill();
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }
    this.ctx.globalAlpha = 1;
    
    // UI
    this.ctx.textAlign = 'left';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 4;
    this.ctx.shadowOffsetY = 4;
    this.ctx.fillStyle = '#fffdf5';
    this.ctx.font = 'bold 60px Courier New, monospace';
    this.ctx.fillText(`Score: ${this.score}`, 20, 70);
    this.ctx.font = 'bold 30px Courier New, monospace';
    this.ctx.fillStyle = 'rgba(255, 253, 245, 0.92)';
    this.ctx.fillText(`Player: ${this.playerName}`, 22, 112);
    this.ctx.fillText(`World: ${this.worldMode === 'blocks' ? 'BLOCKS CREATE WORLD' : 'TUCANO BRAZIL'}`, 22, 148);
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    // State messages
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 64px Courier New, monospace';
    
    if (this.worldMode === 'blocks' && this.state === GameState.PLAYING) {
      this.ctx.textAlign = 'center';
      this.ctx.font = 'bold 28px Courier New, monospace';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText('BLOCKS CREATE WORLD RIFT', this.width / 2, 64);
      this.ctx.fillText('Fly through the voxel crossover zone', this.width / 2, 98);
    }

    if (this.state === GameState.MENU) {
      this.ctx.fillStyle = '#00ff88';
      this.ctx.fillText('TUCANO FLAP 🇧🇷', this.width/2, this.height/2 - 50);
      this.ctx.font = '32px Courier New, monospace';
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText(`Ready, ${this.playerName}`, this.width/2, this.height/2 + 10);
      this.ctx.fillText(`Animal: ${this.selectedAnimal.toUpperCase()} • ${this.selectedDifficulty.toUpperCase()}`, this.width/2, this.height/2 + 58);
      this.ctx.fillText('Press OK/Enter to Start', this.width/2, this.height/2 + 106);
    } else if (this.state === GameState.GAME_OVER) {
      this.ctx.fillStyle = '#ff6b6b';
      this.ctx.fillText('GAME OVER', this.width/2, this.height/2 - 50);
      this.ctx.font = '32px Courier New, monospace';
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText(`${this.playerName}, score: ${this.score}  High: ${this.highScore}`, this.width/2, this.height/2 + 20);
      this.ctx.fillText('Press OK/Enter to Restart', this.width/2, this.height/2 + 80);
    } else if (this.state === GameState.PAUSED) {
      this.ctx.fillStyle = '#ffd93d';
      this.ctx.fillText('PAUSED', this.width/2, this.height/2);
    }

    const leaders = this.scoreHistory.slice(0, 3);
    if (leaders.length > 0) {
      this.ctx.textAlign = 'right';
      this.ctx.fillStyle = 'rgba(255,255,255,0.92)';
      this.ctx.font = 'bold 26px Courier New, monospace';
      this.ctx.fillText('Top Flyers', this.width - 32, 56);
      this.ctx.font = '22px Courier New, monospace';
      leaders.forEach((entry, index) => {
        this.ctx.fillText(`${index + 1}. ${entry.name} ${entry.animal} ${entry.score}`, this.width - 32, 92 + index * 28);
      });
    }
  }
}
