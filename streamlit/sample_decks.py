SAMPLE_PRESETS = [
    {
        "id": "cbse-phy-emi",
        "label": "Physics · Lenz Law",
        "syllabus": "CBSE Class 11–12 (All Subjects)",
        "notes_text": (
            "Electromagnetic Induction (NCERT Ch. 6):\n"
            "Faraday's law gives induced emf e = -dΦ_B/dt where magnetic flux Φ_B = B · A = BA cos θ.\n"
            "The negative sign represents Lenz's law: the polarity of induced emf tends to produce a current "
            "which opposes the change in magnetic flux that produced it (conservation of energy).\n"
            "For a conducting rod of length l moving at velocity v perpendicular to uniform B, motional emf ε = B l v."
        ),
        "deck": {
            "id": "sample-cbse-phy-emi",
            "title": "Electromagnetic Induction: Lenz Sign & Energy Coupling",
            "syllabus": "CBSE Class 11–12 (All Subjects)",
            "rigor": "Challenge",
            "outputMode": "mixed",
            "modelUsed": "sample",
            "sourceExcerpt": "Faraday's law gives induced emf e = -dΦ_B/dt...",
            "syllabusSummary": "CBSE Class 11–12 · Physics Ch. 6 Electromagnetic Induction · Challenge",
            "flashcards": [
                {
                    "id": "sample-fc-1",
                    "concept": "Lenz Law Polarity Under Decreasing Flux",
                    "mechanism": "Sign Convention",
                    "prompt": "A horizontal loop carries an induced current when an upward magnetic field B through it rapidly weakens. Which direction does the induced magnetic field point, and why?",
                    "hint": "Lenz law opposes the CHANGE in flux (ΔΦ_B), not the magnetic field itself.",
                    "answer": "The induced magnetic field points UPWARD (same direction as B). Because upward flux is decreasing, ΔΦ_B is downward; to oppose this decrease, the loop induces a counter-clockwise current generating an upward B_ind.",
                    "commonPitfall": "Reversing the field automatically instead of opposing dΦ_B/dt.",
                    "syllabusTag": "Ch. 6 · Lenz Law",
                    "rating": None,
                },
                {
                    "id": "sample-fc-2",
                    "concept": "Open-Circuit vs Closed-Circuit Motional EMF",
                    "mechanism": "Edge Case",
                    "prompt": "A metal rod slides at constant velocity v perpendicular to uniform field B along frictionless rails, with the resistor removed (open circuit). What happens to the induced EMF and external force required?",
                    "hint": "Separate charge separation from continuous Joule dissipation.",
                    "answer": "Motional EMF ε = B l v STILL exists across the rod ends, but current I = 0, so magnetic braking force F = BIl = 0 and zero external force is needed to maintain constant velocity.",
                    "commonPitfall": "Assuming zero current implies zero induced EMF.",
                    "syllabusTag": "Ch. 6 · Motional EMF",
                    "rating": None,
                },
            ],
            "quizQuestions": [
                {
                    "id": "sample-qz-1",
                    "concept": "Velocity Scaling of Joule Dissipation",
                    "mechanism": "Mathematical Trade-Off",
                    "scenarioPrompt": "A conducting rod slides at steady speed v on rails closed by resistor R in perpendicular field B. If speed doubles to 2v, how does thermal power dissipated in R change?",
                    "options": [
                        "Increases by a factor of 4 (P ∝ v²)",
                        "Doubles (P ∝ v)",
                        "Remains unchanged because R is constant",
                        "Increases by a factor of 8 (P ∝ v³)",
                    ],
                    "correctIndex": 0,
                    "correctExplanation": "Induced EMF ε = Blv doubles, so I = Blv/R doubles. Joule power P = I²R = B²l²v²/R scales with v², becoming 4× larger.",
                    "distractorNotes": [
                        {"optionIndex": 1, "whyIncorrect": "EMF and braking force scale linearly with v, whereas P = F·v scales with v²."},
                        {"optionIndex": 2, "whyIncorrect": "Constant R does not fix power because induced EMF increases with v."},
                        {"optionIndex": 3, "whyIncorrect": "Power scales quadratically with v, not cubically."},
                    ],
                    "syllabusTag": "Ch. 6 · Energy Consideration",
                }
            ],
        },
    },
    {
        "id": "cbse-chem-electrochem",
        "label": "Chemistry · Nernst Equation",
        "syllabus": "CBSE Class 11–12 (All Subjects)",
        "notes_text": (
            "Electrochemistry (NCERT Ch. 2):\n"
            "E°_cell = E°_cathode - E°_anode (standard reduction potentials). "
            "At 298 K, E_cell = E°_cell - (0.0591 / n) log10(Q), and Δ_r G° = -n F E°_cell."
        ),
        "deck": {
            "id": "sample-cbse-chem-electrochem",
            "title": "Electrochemistry: Nernst Perturbations & Conductivity Regimes",
            "syllabus": "CBSE Class 11–12 (All Subjects)",
            "rigor": "Challenge",
            "outputMode": "mixed",
            "modelUsed": "sample",
            "sourceExcerpt": "E°_cell = E°_cathode - E°_anode...",
            "syllabusSummary": "CBSE Class 11–12 · Chemistry Ch. 2 Electrochemistry · Challenge",
            "flashcards": [
                {
                    "id": "sample-chem-fc-1",
                    "concept": "Intensive E° vs Extensive ΔG° Scaling",
                    "mechanism": "Mathematical Trade-Off",
                    "prompt": "If a balanced galvanic cell equation is multiplied throughout by 2, what happens to E°_cell and Δ_r G°?",
                    "hint": "Distinguish intensive potential (J/C) from extensive free energy (J).",
                    "answer": "E°_cell remains UNCHANGED (intensive), while n doubles so Δ_r G° = -n F E°_cell DOUBLES in magnitude.",
                    "commonPitfall": "Doubling E°_cell when multiplying stoichiometric coefficients.",
                    "syllabusTag": "Ch. 2 · Gibbs Energy & Cell Potential",
                    "rating": None,
                }
            ],
            "quizQuestions": [],
        },
    },
]
