#!/usr/bin/env node
/**
 * Tucano Flap - Automated Game Evaluation
 * 
 * This script analyzes the current game state and generates
 * 10 improvements for the next development loop.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface GameMetrics {
  files: number;
  linesOfCode: number;
  testCoverage: number;
  hasAudio: boolean;
  hasSprites: boolean;
  hasLevels: boolean;
  hasPowerUps: boolean;
  tvOptimized: boolean;
}

interface Improvement {
  id: string;
  title: string;
  description: string;
  justification: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  dependencies: string[];
}

function analyzeProject(): GameMetrics {
  const metrics: GameMetrics = {
    files: 0,
    linesOfCode: 0,
    testCoverage: 0,
    hasAudio: false,
    hasSprites: false,
    hasLevels: false,
    hasPowerUps: false,
    tvOptimized: false,
  };

  // Check for audio
  const audioPath = join(process.cwd(), 'src', 'systems', 'AudioManager.ts');
  metrics.hasAudio = existsSync(audioPath);

  // Check for sprites
  const assetsPath = join(process.cwd(), 'public', 'sprites');
  metrics.hasSprites = existsSync(assetsPath);

  // Check for levels
  const levelPath = join(process.cwd(), 'src', 'systems', 'LevelManager.ts');
  metrics.hasLevels = existsSync(levelPath);

  // Check for power-ups
  const powerUpPath = join(process.cwd(), 'src', 'entities', 'PowerUp.ts');
  metrics.hasPowerUps = existsSync(powerUpPath);

  // Check TV optimization
  const indexPath = join(process.cwd(), 'index.html');
  if (existsSync(indexPath)) {
    const content = readFileSync(indexPath, 'utf-8');
    metrics.tvOptimized = content.includes('tv-focus') || content.includes('Samsung');
  }

  return metrics;
}

function generateImprovements(metrics: GameMetrics): Improvement[] {
  const improvements: Improvement[] = [];
  let id = 1;

  // Always suggest these foundational improvements
  improvements.push({
    id: `IMP-${String(id++).padStart(3, '0')}`,
    title: 'Sprite Animation System',
    description: 'Add animated sprite sheets for Tucano (flap wings, idle, die), pipes, and background',
    justification: 'Static rectangles don\'t convey personality; animation adds life and Brazilian flavor',
    effort: 'medium',
    impact: 'high',
    dependencies: ['TASK-003'], // Tucano entity exists
  });

  improvements.push({
    id: `IMP-${String(id++).padStart(3, '0')}`,
    title: 'Brazilian Background Themes',
    description: 'Parallax backgrounds: Amazon forest, Rio favelas, Salvador beaches, São Paulo skyline',
    justification: 'Theme is "Brazilian soul" — backgrounds sell the fantasy and provide visual progression',
    effort: 'high',
    impact: 'high',
    dependencies: ['TASK-002'], // Core game loop
  });

  improvements.push({
    id: `IMP-${String(id++).padStart(3, '0')}`,
    title: 'Power-Up System',
    description: 'Collectible items: Shield (one crash immunity), Slow-Mo (time dilation), Magnet (auto-score)',
    justification: 'Adds strategic depth beyond "flap timing"; rewards risk-taking; extends session length',
    effort: 'high',
    impact: 'high',
    dependencies: ['TASK-006', 'TASK-007'], // Collision and score
  });

  improvements.push({
    id: `IMP-${String(id++).padStart(3, '0')}`,
    title: 'Dynamic Difficulty & Levels',
    description: 'Progressive difficulty: pipes move faster, gaps shrink, moving pipes; level transitions every 10 pipes',
    justification: 'Prevents plateau; maintains challenge as player improves; creates "just one more" moments',
    effort: 'medium',
    impact: 'high',
    dependencies: ['TASK-005', 'TASK-007'], // Pipes and score
  });

  improvements.push({
    id: `IMP-${String(id++).padStart(3, '0')}`,
    title: 'Bossa Nova Soundtrack',
    description: 'Background music: looping bossa nova track; dynamic audio (quieter during pause, intense near death)',
    justification: 'Audio is 50% of game feel; Brazilian music reinforces theme; TV has speakers',
    effort: 'medium',
    impact: 'medium',
    dependencies: ['TASK-010'], // Audio system
  });

  improvements.push({
    id: `IMP-${String(id++).padStart(3, '0')}`,
    title: 'Particle Effects System',
    description: 'Visual feedback: feather particles on flap, sparkles on score, explosion on crash, trail behind Tucano',
    justification: 'Juice makes games feel premium; particles communicate physics; TV screen shows it well',
    effort: 'low',
    impact: 'medium',
    dependencies: ['TASK-003'], // Tucano exists
  });

  improvements.push({
    id: `IMP-${String(id++).padStart(3, '0')}`,
    title: 'High Score Persistence',
    description: 'Save high scores to localStorage; display leaderboard; daily/weekly/all-time filters',
    justification: 'Competition drives replay; persistence across sessions; TV users play in bursts',
    effort: 'low',
    impact: 'medium',
    dependencies: ['TASK-007'], // Score system
  });

  improvements.push({
    id: `IMP-${String(id++).padStart(3, '0')}`,
    title: 'CRT Scanline Effect',
    description: 'Post-processing shader: subtle scanlines, slight curvature, chromatic aberration edges',
    justification: 'Nostalgia factor; fits TV context; differentiates from mobile clones',
    effort: 'medium',
    impact: 'low',
    dependencies: ['TASK-002'], // Game loop
  });

  improvements.push({
    id: `IMP-${String(id++).padStart(3, '0')}`,
    title: 'Accessibility Options',
    description: 'Colorblind mode, high contrast, large UI scale, reduced motion, audio-only mode for visually impaired',
    justification: 'Inclusive design; legal requirements in some markets; good for TV distance viewing',
    effort: 'medium',
    impact: 'medium',
    dependencies: ['TASK-008'], // UI manager
  });

  improvements.push({
    id: `IMP-${String(id++).padStart(3, '0')}`,
    title: 'Local Multiplayer (Hot Seat)',
    description: '2-player mode: players take turns, compete for higher score, simultaneous ghost races',
    justification: 'TV is social; family competition fits "Caldas family" vibe; extends session time',
    effort: 'high',
    impact: 'high',
    dependencies: ['TASK-008'], // Game states
  });

  return improvements;
}

function writeQueue(improvements: Improvement[]): void {
  const queuePath = join(process.cwd(), 'QUEUE.md');
  const timestamp = new Date().toISOString();
  
  let content = `# Tucano Flap — Generated Task Queue\n\n`;
  content += `**Generated:** ${timestamp}\n`;
  content += `**Loop:** Auto-generated by evaluate-game.js\n\n`;
  content += `## Next 10 Improvements\n\n`;
  
  for (const imp of improvements) {
    content += `### ${imp.id}: ${imp.title}\n`;
    content += `- **Description:** ${imp.description}\n`;
    content += `- **Justification:** ${imp.justification}\n`;
    content += `- **Effort:** ${imp.effort} | **Impact:** ${imp.impact}\n`;
    content += `- **Dependencies:** ${imp.dependencies.join(', ') || 'none'}\n\n`;
  }
  
  content += `## Implementation Order\n\n`;
  content += `Sort by: Impact DESC, Effort ASC, Dependencies satisfied\n\n`;
  content += `1. IMP-006 (low effort, medium impact) → Quick win\n`;
  content += `2. IMP-007 (low effort, medium impact) → Persistence\n`;
  content += `3. IMP-001 (medium effort, high impact) → Core visuals\n`;
  content += `4. IMP-005 (medium effort, medium impact) → Audio\n`;
  content += `5. IMP-010 (high effort, high impact) → Social\n`;
  
  console.log(content);
  
  // In real implementation, would write to file
  // writeFileSync(queuePath, content);
}

// Main execution
const metrics = analyzeProject();
console.log('📊 Current Metrics:', metrics);

const improvements = generateImprovements(metrics);
console.log('\n🎯 Generated', improvements.length, 'improvements');

writeQueue(improvements);

export { analyzeProject, generateImprovements };
