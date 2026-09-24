# Physics Skill Stack v1

## Goal

Add a native physics-learning layer to Teaching OS without making the application depend directly on external skill repositories.

## Architecture

1. **Physics Thinking / Derivation**
   - phenomenon → givens/constraints → physical principle → derivation → meaning
   - no vibe-based explanation
   - named quantities should emerge from the physical/mathematical structure when appropriate

2. **Scientific Computation / Verification**
   - Claim → Evidence → Verifier → Result
   - symbolic adapter point for future SymPy/K-Dense integration
   - dimensional, numerical, and limiting-case verification remain available locally

3. **Scientific Representation**
   - physics model is the source of truth
   - visualization receives model values; it does not invent them
   - preserve units, vector scale, labels, and transformation provenance

4. **Interactive Simulation**
   - renderer/simulator is downstream of the verified model
   - future r3f/Rapier adapter plugs into the simulation adapter contract
   - simulation output must not be treated as the law itself

5. **Teaching Design**
   - learning goal
   - prerequisites
   - likely misconceptions
   - prediction before reveal
   - check for understanding
   - targeted retry

## Native skill registry

- `physics-derivation`
- `physics-verification`
- `physics-visualization`
- `physics-interactive-simulation`
- `lesson-design`
- `check-for-understanding`

## First reference component: inclined plane

The first implemented model is gravitational decomposition on an inclined plane:

- `mg`
- `mg sin θ`
- `mg cos θ`

It includes:

- derivation metadata
- dimensional verification
- vector reconstruction verification
- limiting cases at 0° and 90°
- scientific visualization specification
- lesson-design metadata
- a prediction-first check-for-understanding item

## External-skill integration policy

External projects are upstream references / adapters, not the core runtime dependency.

- Scientific Visualization principles → native representation rules
- K-Dense / SymPy → optional machine-facing verification adapter
- r3f-physics → optional rendering/simulation adapter
- Learning Commons → native teaching-design and CFU patterns

Student-facing explanation and machine-facing verification remain separate.
