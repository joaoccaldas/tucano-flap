export enum GameState { MENU, PLAYING, PAUSED, GAME_OVER }

export class Game {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private state: GameState = GameState.MENU;
  private lastTime: number = 0;
  private score: number = 0;
  private highScore: number = 0;
  
  // Entities
  private tucano!: { x: number; y: number; vy: number; width: number; height: number; rotation: number };
  private pipes!: Array<{ x: number; gapY: number; passed: boolean }>;
  private particles!: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>;
  
  // Constants
  private readonly GRAVITY = 1500;
  private readonly FLAP_FORCE = -400;
  private readonly PIPE_SPEED = 250;
  private readonly PIPE_SPAWN_RATE = 2.0;
  private readonly PIPE_WIDTH = 80;
  private readonly PIPE_GAP = 200;
  private pipeTimer: number = 0;
  
  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.reset();
  }
  
  private reset(): void {
    this.tucano = { x: 300, y: this.height / 2, vy: 0, width: 40, height: 30, rotation: 0 };
    this.pipes = [];
    this.particles = [];
    this.score = 0;
    this.pipeTimer = 0;
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
    this.tucano.vy += this.GRAVITY * dt;
    this.tucano.y += this.tucano.vy * dt;
    this.tucano.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.tucano.vy / 500)));
    
    // Ground/ceiling collision
    if (this.tucano.y + this.tucano.height/2 > this.height - 50 || this.tucano.y < -50) {
      this.gameOver();
      return;
    }
    
    // Pipes
    this.pipeTimer += dt;
    if (this.pipeTimer >= this.PIPE_SPAWN_RATE) {
      this.spawnPipe();
      this.pipeTimer = 0;
    }
    
    for (const pipe of this.pipes) {
      pipe.x -= this.PIPE_SPEED * dt;
      
      // Collision
      if (this.checkCollision(pipe)) {
        this.gameOver();
        return;
      }
      
      // Score
      if (!pipe.passed && pipe.x + this.PIPE_WIDTH < this.tucano.x) {
        pipe.passed = true;
        this.score++;
        this.spawnParticles(this.tucano.x, this.tucano.y, '#FFD700', 10);
      }
    }
    
    // Remove off-screen pipes
    this.pipes = this.pipes.filter(p => p.x > -this.PIPE_WIDTH);
    
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
    const maxGapY = this.height - 100 - this.PIPE_GAP;
    const gapY = Math.random() * (maxGapY - minGapY) + minGapY;
    this.pipes.push({ x: this.width + this.PIPE_WIDTH, gapY, passed: false });
  }
  
  private checkCollision(pipe: { x: number; gapY: number }): boolean {
    const tLeft = this.tucano.x - this.tucano.width/2;
    const tRight = this.tucano.x + this.tucano.width/2;
    const tTop = this.tucano.y - this.tucano.height/2;
    const tBottom = this.tucano.y + this.tucano.height/2;
    
    const pLeft = pipe.x;
    const pRight = pipe.x + this.PIPE_WIDTH;
    const gapTop = pipe.gapY;
    const gapBottom = pipe.gapY + this.PIPE_GAP;
    
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
  }
  
  flap(): void {
    if (this.state === GameState.PLAYING) {
      this.tucano.vy = this.FLAP_FORCE;
      this.spawnParticles(this.tucano.x - 20, this.tucano.y, '#FFFFFF', 5);
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
    // Clear
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Background gradient
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#0f3460');
    grad.addColorStop(1, '#1a1a2e');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Ground
    this.ctx.fillStyle = '#2d5a3d';
    this.ctx.fillRect(0, this.height - 50, this.width, 50);
    
    // Pipes
    this.ctx.fillStyle = '#2d6a4f';
    for (const pipe of this.pipes) {
      // Top pipe
      this.ctx.fillRect(pipe.x, 0, this.PIPE_WIDTH, pipe.gapY);
      // Bottom pipe
      this.ctx.fillRect(pipe.x, pipe.gapY + this.PIPE_GAP, this.PIPE_WIDTH, this.height - pipe.gapY - this.PIPE_GAP - 50);
    }
    
    // Tucano
    this.ctx.save();
    this.ctx.translate(this.tucano.x, this.tucano.y);
    this.ctx.rotate(this.tucano.rotation);
    
    // Body
    this.ctx.fillStyle = '#ff6b35'; // Orange
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Beak
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(15, -5, 12, 8);
    
    // Eye
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(-5, -5, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(-5, -5, 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Wing
    this.ctx.fillStyle = '#ff8c42';
    this.ctx.beginPath();
    this.ctx.ellipse(-5, 5, 12, 8, 0.3, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
    
    // Particles
    for (const p of this.particles) {
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
    
    // UI
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 48px Courier New, monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.score}`, 20, 60);
    
    // State messages
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 64px Courier New, monospace';
    
    if (this.state === GameState.MENU) {
      this.ctx.fillStyle = '#00ff88';
      this.ctx.fillText('TUCANO FLAP 🇧🇷', this.width/2, this.height/2 - 50);
      this.ctx.font = '32px Courier New, monospace';
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText('Press OK/Enter to Start', this.width/2, this.height/2 + 50);
    } else if (this.state === GameState.GAME_OVER) {
      this.ctx.fillStyle = '#ff6b6b';
      this.ctx.fillText('GAME OVER', this.width/2, this.height/2 - 50);
      this.ctx.font = '32px Courier New, monospace';
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText(`Score: ${this.score}  High: ${this.highScore}`, this.width/2, this.height/2 + 20);
      this.ctx.fillText('Press OK/Enter to Restart', this.width/2, this.height/2 + 80);
    } else if (this.state === GameState.PAUSED) {
      this.ctx.fillStyle = '#ffd93d';
      this.ctx.fillText('PAUSED', this.width/2, this.height/2);
    }
  }
}
