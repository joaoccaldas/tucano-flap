# Recursive Self-Improvement Build System

## Philosophy
The game improves itself through iterative loops. Each loop:
1. **Evaluate** → What's working? What's broken?
2. **Plan** → Generate 10 improvements with rationale
3. **Queue** → Prioritize by impact/effort/dependencies
4. **Build** → Implement with tests
5. **Audit** → Code quality, performance, TV compatibility
6. **Loop** → Back to step 1

## Loop Structure

### Loop 1: Foundation (v0.1)
- [ ] Core physics (gravity, flap velocity)
- [ ] Pipe generation with gaps
- [ ] Collision detection
- [ ] Score tracking
- [ ] Basic Tucano sprite
- [ ] Parallax background (forest)
- [ ] Samsung TV controller support
- [ ] Sound effects (flap, score, die)
- [ ] Game state (menu, playing, game over)
- [ ] Vite build setup

### Loop 2: Polish (v0.2)
- [ ] Animated sprites
- [ ] Particle effects on flap
- [ ] Background music (bossa nova loop)
- [ ] High score persistence
- [ ] Pause functionality
- [ ] Visual polish (shadows, gradients)
- [ ] Mobile/TV responsive
- [ ] Loading screen
- [ ] CRT scanline effect (retro TV feel)
- [ ] Unit tests for physics

### Loop 3: Features (v0.3)
- [ ] Power-ups (shield, slow-mo, magnet)
- [ ] Level progression (speed increases)
- [ ] Different pipe types (moving, varying gaps)
- [ ] Multiple backgrounds (unlockable)
- [ ] Achievement system
- [ ] Daily challenges
- [ ] Local multiplayer (hot seat)
- [ ] Accessibility options
- [ ] Performance optimization
- [ ] Analytics/events

### Loop 4+ : Generated at runtime
See `QUEUE.md` for current queue.

## Evaluation Criteria
Each loop evaluates:
- **Fun factor**: Would someone play for 10 minutes?
- **Performance**: 60fps on Samsung TV browser?
- **Code quality**: Test coverage > 80%?
- **Visual appeal**: Would it look good on a TV?
- **Accessibility**: Controller-only playable?

## Improvement Generation Rules
When planning improvements:
1. Justify WHY (user value, technical debt, polish)
2. Estimate EFFORT (hours)
3. Define SUCCESS criteria
4. Check DEPENDENCIES (what must exist first)
5. Prioritize by: Impact / Effort / Blockers
