import type { RecallDeck, SyllabusTrack } from './types';

export interface SampleNotePreset {
  id: string;
  label: string;
  syllabus: SyllabusTrack;
  notesText: string;
  deck: RecallDeck;
}

export const SAMPLE_PRESETS: SampleNotePreset[] = [
  {
    id: 'cbse-phy-emi',
    label: 'Class 12 Physics · Lenz Law & Motional EMF',
    syllabus: 'CBSE Class 12 Physics',
    notesText: `Electromagnetic Induction (NCERT Ch. 6):
Faraday's law gives induced emf e = -dΦ_B/dt where magnetic flux Φ_B = B · A = BA cos θ.
The negative sign represents Lenz's law: the polarity of induced emf is such that it tends to produce a current which opposes the change in magnetic flux that produced it (conservation of energy).
For a conducting rod of length l moving with velocity v perpendicular to a uniform magnetic field B, motional emf ε = B l v. If the circuit has resistance R, induced current I = Blv/R and magnetic retarding force F = BIl = B²l²v/R. Mechanical power input Fv equals Joule heating I²R.
Self-inductance L of a solenoid: Φ = LI, back emf e = -L(dI/dt), stored magnetic energy U = 1/2 L I².`,
    deck: {
      id: 'sample-cbse-phy-emi',
      title: 'Electromagnetic Induction: Lenz Sign & Energy Coupling',
      syllabus: 'CBSE Class 12 Physics',
      rigor: 'Application & HOTS',
      outputMode: 'mixed',
      modelUsed: 'sample',
      createdAt: '2026-11-18T00:00:00.000Z',
      sourceExcerpt:
        "Faraday's law gives induced emf e = -dΦ_B/dt where magnetic flux Φ_B = B · A = BA cos θ...",
      syllabusSummary: 'CBSE Class 12 Physics · Ch. 6 Electromagnetic Induction · Application & HOTS',
      flashcards: [
        {
          id: 'sample-fc-1',
          concept: 'Lenz Law Polarity Under Decreasing Flux',
          mechanism: 'Sign Convention',
          prompt:
            'A horizontal loop carries an induced current when an upward magnetic field B through it rapidly weakens. Which direction does the induced magnetic field point, and why?',
          hint: 'Lenz law opposes the CHANGE in flux (ΔΦ_B), not the magnetic field itself.',
          answer:
            'The induced magnetic field points UPWARD (same direction as B). Because the upward flux is decreasing, ΔΦ_B is downward; to oppose this decrease, the loop induces a counter-clockwise current (viewed from above) that generates an upward B_ind.',
          commonPitfall:
            'Students often reverse the field automatically ("always oppose B") instead of opposing the change dΦ_B/dt.',
          syllabusTag: 'Ch. 6 · Lenz Law',
          reviewCount: 0,
        },
        {
          id: 'sample-fc-2',
          concept: 'Open-Circuit vs Closed-Circuit Motional EMF',
          mechanism: 'Edge Case',
          prompt:
            'A metal rod of length l slides at constant velocity v perpendicular to uniform field B along frictionless rails, but the left-end resistor is removed (open circuit). What happens to the induced EMF and the external force needed to maintain velocity v?',
          hint: 'Separate charge separation (electric field balance) from continuous current dissipation.',
          answer:
            'Motional EMF ε = B l v STILL exists across the rod ends because Lorentz force q(v × B) separates charges until qE = qvB. However, current I = 0, so magnetic braking force F = BIl = 0 and zero external force is needed to maintain constant velocity.',
          commonPitfall:
            'Assuming zero current implies zero induced EMF, or assuming mechanical work is still required.',
          syllabusTag: 'Ch. 6 · Motional EMF',
          reviewCount: 0,
        },
        {
          id: 'sample-fc-3',
          concept: 'Angle Dependence in Flux Derivative',
          mechanism: 'Causal Chain',
          prompt:
            'In a uniform B-field, a coil rotates at constant angular speed ω so Φ(t) = NBA cos(ωt). At the instant the coil plane is PARALLEL to B, what are the instantaneous flux Φ and induced EMF |e|?',
          hint: 'Remember θ is measured between B and the area normal vector n̂, not the coil plane.',
          answer:
            'When the coil plane is parallel to B, θ = 90°, so Φ = NBA cos(90°) = 0 Wb. However, |dΦ/dt| = NBAω |sin(90°)| = NBAω is MAXIMUM.',
          commonPitfall:
            'Thinking zero instantaneous flux implies zero induced EMF, or measuring θ from the coil surface instead of the normal.',
          syllabusTag: 'Ch. 6 · AC Generator Principle',
          reviewCount: 0,
        },
        {
          id: 'sample-fc-4',
          concept: 'Inductor Current Continuity at Switch Opening',
          mechanism: 'Experimental Perturbation',
          prompt:
            'Why does opening a switch in series with a high-inductance solenoid (carrying steady current I₀) produce a high-voltage spark across the switch contacts?',
          hint: 'Examine e = -L(dI/dt) as Δt → 0.',
          answer:
            'An inductor resists instantaneous change in current because magnetic energy U = ½LI₀² cannot vanish instantaneously. Forcing I from I₀ to 0 in a tiny Δt creates a huge negative dI/dt, inducing a massive forward EMF e = -L(dI/dt) across the air gap that ionizes air.',
          commonPitfall:
            'Treating an ideal inductor like a resistor whose voltage drops to zero immediately when the switch opens.',
          syllabusTag: 'Ch. 6 · Self-Inductance',
          reviewCount: 0,
        },
      ],
      quizQuestions: [
        {
          id: 'sample-qz-1',
          concept: 'Velocity Scaling of Joule Dissipation',
          mechanism: 'Mathematical Trade-Off',
          scenarioPrompt:
            'A conducting rod slides at steady speed v on U-shaped rails of negligible resistance closed by a resistor R in a perpendicular field B. If the external puller doubles the steady speed to 2v, how does the thermal power dissipated in R change?',
          options: [
            'Increases by a factor of 4 (P ∝ v²)',
            'Doubles (P ∝ v)',
            'Remains unchanged because R is constant',
            'Increases by a factor of 8 (P ∝ v³)',
          ],
          correctIndex: 0,
          correctExplanation:
            'Induced EMF ε = Blv doubles, so current I = Blv/R doubles. Joule power P = I²R = B²l²v²/R scales with v², becoming 4× larger.',
          distractorNotes: [
            {
              optionIndex: 1,
              whyIncorrect:
                'Only the induced EMF ε and braking force F = B²l²v/R double linearly; power P = F·v multiplies both F and v.',
            },
            {
              optionIndex: 2,
              whyIncorrect:
                'Constant resistance R does not fix power because induced voltage ε increases linearly with velocity.',
            },
            {
              optionIndex: 3,
              whyIncorrect:
                'Power scales quadratically with velocity (v²), not cubically.',
            },
          ],
          syllabusTag: 'Ch. 6 · Energy Consideration',
        },
        {
          id: 'sample-qz-2',
          concept: 'Flux Through Expanding vs Translating Loop',
          mechanism: 'Edge Case',
          scenarioPrompt:
            'A rigid circular loop moves entirely inside a spatially UNIFORM, time-constant magnetic field B with velocity v perpendicular to B. What is the induced current in the loop?',
          options: [
            'Zero, because Φ_B = BA cos θ remains constant over time',
            'Proportional to B·(2r)·v clockwise',
            'Proportional to πr²·B·v counter-clockwise',
            'Non-zero only if the loop moves faster than v = R/B',
          ],
          correctIndex: 0,
          correctExplanation:
            'Although opposite sides of the translating loop individually experience motional EMF Blv, the two EMFs oppose each other around the closed path, yielding zero net dΦ_B/dt = 0 and zero net current.',
          distractorNotes: [
            {
              optionIndex: 1,
              whyIncorrect:
                'Applying Blv blindly to one diameter ignores the equal and opposite motional EMF induced on the trailing semicircle.',
            },
            {
              optionIndex: 2,
              whyIncorrect:
                'Flux Φ_B is constant, not changing at rate πr²Bv.',
            },
            {
              optionIndex: 3,
              whyIncorrect:
                'There is no velocity threshold; net flux change is identically zero for any v in a uniform field.',
            },
          ],
          syllabusTag: 'Ch. 6 · Faraday Law',
        },
      ],
    },
  },
  {
    id: 'cbse-chem-electrochem',
    label: 'Class 12 Chemistry · Nernst Equation & Cell Sign',
    syllabus: 'CBSE Class 12 Chemistry',
    notesText: `Electrochemistry (NCERT Ch. 2):
Standard EMF of a galvanic cell: E°_cell = E°_cathode - E°_anode (both written as standard reduction potentials).
Nernst equation at 298 K: E_cell = E°_cell - (0.0591 / n) log10(Q), where Q = [Products]^p / [Reactants]^r (pure solids and liquids take activity = 1).
Gibbs energy relation: Δ_r G° = -n F E°_cell, and Δ_r G° = -2.303 RT log10(K_c).
For spontaneity in a galvanic cell, E_cell > 0 so Δ_r G < 0.
Kohlrausch law of independent migration of ions: Λ°_m(weak electrolyte) increases steeply on dilution because degree of dissociation α increases, whereas strong electrolyte Λ_m rises linearly with √c due to reduced inter-ionic attraction.`,
    deck: {
      id: 'sample-cbse-chem-electrochem',
      title: 'Electrochemistry: Nernst Perturbations & Conductivity Regimes',
      syllabus: 'CBSE Class 12 Chemistry',
      rigor: 'Application & HOTS',
      outputMode: 'mixed',
      modelUsed: 'sample',
      createdAt: '2026-11-18T00:00:00.000Z',
      sourceExcerpt:
        'Standard EMF of a galvanic cell: E°_cell = E°_cathode - E°_anode (both written as standard reduction potentials)...',
      syllabusSummary: 'CBSE Class 12 Chemistry · Ch. 2 Electrochemistry · Application & HOTS',
      flashcards: [
        {
          id: 'sample-chem-fc-1',
          concept: 'Reaction Quotient Q Direction on Cell EMF',
          mechanism: 'Causal Chain',
          prompt:
            'In the Daniell cell Zn(s) | Zn²⁺(aq) || Cu²⁺(aq) | Cu(s), how does diluting ONLY the Cu²⁺ half-cell (keeping [Zn²⁺] fixed) affect E_cell at 298 K?',
          hint: 'Write Q = [Zn²⁺]/[Cu²⁺] and trace the sign of -(0.0591/2) log10(Q).',
          answer:
            'E_cell DECREASES. Diluting [Cu²⁺] decreases the denominator of Q = [Zn²⁺]/[Cu²⁺], increasing Q. Since E_cell = E°_cell - (0.0591/2) log10(Q), a larger log10(Q) subtracts more from E°_cell.',
          commonPitfall:
            'Inverting Q as [Cu²⁺]/[Zn²⁺] or including solid Zn(s)/Cu(s) concentrations in the reaction quotient.',
          syllabusTag: 'Ch. 2 · Nernst Equation',
          reviewCount: 0,
        },
        {
          id: 'sample-chem-fc-2',
          concept: 'Intensive E° vs Extensive ΔG° Scaling',
          mechanism: 'Mathematical Trade-Off',
          prompt:
            'If a balanced galvanic cell equation is multiplied throughout by 2, what happens to E°_cell and Δ_r G°?',
          hint: 'Distinguish intensive potential (J/C) from extensive free energy (J).',
          answer:
            'E°_cell remains UNCHANGED (it is an intensive property: Joules per Coulomb cancels doubling of electrons). However, n doubles, so Δ_r G° = -n F E°_cell DOUBLES in magnitude.',
          commonPitfall:
            'Doubling E°_cell when multiplying stoichiometric coefficients by 2.',
          syllabusTag: 'Ch. 2 · Gibbs Energy & Cell Potential',
          reviewCount: 0,
        },
      ],
      quizQuestions: [
        {
          id: 'sample-chem-qz-1',
          concept: 'Dilution Curves of Strong vs Weak Electrolytes',
          mechanism: 'Mechanism Boundary',
          scenarioPrompt:
            'Why can Λ°_m (limiting molar conductivity) be obtained by linear extrapolation of Λ_m vs √c to c → 0 for KCl, whereas this fails for CH₃COOH?',
          options: [
            'CH₃COOH degree of dissociation α rises sharply near c → 0, curving Λ_m steeply upward',
            'KCl ions hydrolyze water at infinite dilution, lowering its slope',
            'CH₃COOH has higher ionic mobility than K⁺ and Cl⁻ at high concentration',
            'Strong electrolytes obey Kohlrausch law only above 1.0 M concentration',
          ],
          correctIndex: 0,
          correctExplanation:
            'For weak electrolytes like CH₃COOH, α increases rapidly upon extreme dilution (Ostwald dilution law), causing a steep non-linear rise in Λ_m that prevents linear extrapolation; Kohlrausch law using strong electrolytes must be used instead.',
          distractorNotes: [
            {
              optionIndex: 1,
              whyIncorrect: 'KCl is a salt of strong acid and strong base and does not undergo hydrolysis.',
            },
            {
              optionIndex: 2,
              whyIncorrect: 'At high concentration, CH₃COOH is barely dissociated, so its Λ_m is much lower than KCl.',
            },
            {
              optionIndex: 3,
              whyIncorrect: 'The Debye-Hückel-Onsager linear relation holds at LOW concentrations, not above 1.0 M.',
            },
          ],
          syllabusTag: 'Ch. 2 · Molar Conductivity',
        },
      ],
    },
  },
  {
    id: 'cbse-bio-lac-operon',
    label: 'Class 12 Biology · Lac Operon Negative Control',
    syllabus: 'CBSE Class 12 Biology',
    notesText: `Molecular Basis of Inheritance (NCERT Ch. 5) — The Lac Operon:
The lac operon consists of one regulatory gene (i gene coding for repressor protein) and three structural genes (z for β-galactosidase, y for permease, a for transacetylase).
In the absence of an inducer (lactose / allolactose), the active repressor binds to the operator region (o) and prevents RNA polymerase from transcribing the operon.
In the presence of lactose, allolactose binds to the repressor, inducing a conformational change that inactivates the repressor so it cannot bind the operator, allowing RNA polymerase to transcribe z, y, and a.`,
    deck: {
      id: 'sample-cbse-bio-lac-operon',
      title: 'Lac Operon: Repressor Mutations & Inducer Logic',
      syllabus: 'CBSE Class 12 Biology',
      rigor: 'Edge-Case & Olympiad',
      outputMode: 'mixed',
      modelUsed: 'sample',
      createdAt: '2026-11-18T00:00:00.000Z',
      sourceExcerpt:
        'The lac operon consists of one regulatory gene (i gene coding for repressor protein) and three structural genes (z, y, a)...',
      syllabusSummary: 'CBSE Class 12 Biology · Ch. 5 Molecular Basis · Edge-Case & Olympiad',
      flashcards: [
        {
          id: 'sample-bio-fc-1',
          concept: 'Loss of LacY Permease Basal Expression Trap',
          mechanism: 'Experimental Perturbation',
          prompt:
            'If lactose must enter the E. coli cell to serve as the inducer, why can a wild-type uninduced cell respond to newly added lactose at all if the operon starts switched OFF?',
          hint: 'Negative regulation by the lac repressor is leaky, not absolute.',
          answer:
            'A very low basal level of lac operon transcription always occurs ("leaky" repression), keeping a few molecules of permease (lacY) in the membrane and β-galactosidase (lacZ) in the cytoplasm to transport initial lactose and convert it to allolactose.',
          commonPitfall:
            'Assuming the repressor blocks 100% of transcription permanently before induction.',
          syllabusTag: 'Ch. 5 · Lac Operon Regulation',
          reviewCount: 0,
        },
      ],
      quizQuestions: [
        {
          id: 'sample-bio-qz-1',
          concept: 'Operator Mutation vs Repressor Mutation',
          mechanism: 'Causal Chain',
          scenarioPrompt:
            'An E. coli strain has a mutation in the operator sequence (oᶜ) such that the lac repressor protein can no longer bind to it. What is the expression status of lacZ in the ABSENCE of lactose?',
          options: [
            'Constitutively expressed (switched ON even without lactose)',
            'Permanently repressed (cannot be induced even with lactose)',
            'Expressed only when allolactose binds RNA polymerase directly',
            'Transcribed only for the i gene, blocking z, y, and a',
          ],
          correctIndex: 0,
          correctExplanation:
            'Because the repressor cannot physically occupy the mutated operator, RNA polymerase is never sterically blocked, resulting in constitutive (continuous) transcription of z, y, and a regardless of lactose presence.',
          distractorNotes: [
            {
              optionIndex: 1,
              whyIncorrect:
                'Permanent repression occurs when the repressor cannot bind ALLOLACTOSE (super-repressor iˢ), not when the operator fails to bind the repressor.',
            },
            {
              optionIndex: 2,
              whyIncorrect: 'Allolactose binds the repressor protein, never RNA polymerase.',
            },
            {
              optionIndex: 3,
              whyIncorrect: 'The i gene has its own independent promoter and does not rely on the lac operator.',
            },
          ],
          syllabusTag: 'Ch. 5 · Operon Mutations',
        },
      ],
    },
  },
];
