from typing import Optional


def build_mcq_system_prompt(subject: Optional[str] = None) -> str:
    """
    Returns the base system prompt for strict document-grounded MCQ generation.
    Includes subject-specific visual generation instructions when subject is provided.
    """
    visual_instructions = _build_visual_instructions(subject)

    return (
        "You are an expert educational assessment question generator.\n\n"
        "Your task is to generate high-quality multiple-choice questions strictly grounded "
        "in the supplied study material.\n\n"
        "The generated questions must:\n"
        "1. Be factually correct.\n"
        "2. Be answerable using the supplied document.\n"
        "3. Match the requested difficulty.\n"
        "4. Match the requested Bloom's taxonomy level.\n"
        "5. Have exactly four options.\n"
        "6. Have exactly one correct answer.\n"
        "7. Have plausible and educationally meaningful distractors.\n"
        "8. Avoid trivial or obviously incorrect distractors.\n"
        "9. Avoid ambiguous wording.\n"
        "10. Avoid duplicate or near-duplicate questions.\n"
        "11. Cover different concepts from the supplied document.\n"
        "12. Avoid introducing unsupported facts.\n"
        "13. Include a concise explanation.\n"
        "14. Return ONLY the requested structured output.\n\n"
        "Do not generate questions from your general knowledge when the answer is not "
        "supported by the supplied document.\n"
        "Use the document as the primary source of truth.\n\n"
        + visual_instructions
    )


def _build_visual_instructions(subject: Optional[str]) -> str:
    """
    Returns subject-specific visual question instructions.
    Approximately 30-40% of questions should include a visual aid.
    """
    subject_lower = (subject or "").strip().lower()

    base = (
        "── VISUAL QUESTIONS ──\n"
        "For approximately 30-40% of the questions in each batch, include a visual aid "
        "that meaningfully supports the question. Set has_visual=true for these questions "
        "and populate visual_type and visual_data accordingly.\n"
        "For the remaining 60-70%, set has_visual=false and omit visual_type and visual_data.\n\n"
    )

    if subject_lower == "maths" or subject_lower == "physics":
        return base + (
            "Subject: {subject_upper}\n"
            "Visual type: 'graph'\n"
            "For graph questions, populate visual_data.plotly_spec with a valid Plotly JSON object "
            "containing 'data' (array of trace objects) and 'layout' (title, axis labels, etc.).\n"
            "Examples of appropriate graphs:\n"
            "  - Line/curve graphs: functions like y=sin(x), y=x², velocity-time, displacement-time\n"
            "  - Bar charts: comparing quantities, frequencies\n"
            "  - Scatter plots: correlation or experimental data\n"
            "  - Vector diagrams: force components represented as annotations\n"
            "The question should refer to a feature of the graph (e.g., 'What is the gradient at x=2?', "
            "'Which region shows constant velocity?', 'What is the maximum value?').\n"
            "The plotly_spec must be self-contained with realistic numeric data arrays.\n"
            "Do NOT use placeholder strings like 'x_values' — use actual numbers.\n"
        ).format(subject_upper=(subject_lower or "maths/physics").upper())

    elif subject_lower == "chemistry":
        return base + (
            "Subject: CHEMISTRY\n"
            "Visual type: 'structure'\n"
            "For structure questions, populate visual_data.smiles with a valid SMILES string "
            "for the molecule or compound being discussed.\n"
            "Examples:\n"
            "  - Benzene: c1ccccc1\n"
            "  - Ethanol: CCO\n"
            "  - Glucose: C([C@@H]1[C@H]([C@@H]([C@H](C(O1)O)O)O)O)O\n"
            "  - Aspirin: CC(=O)Oc1ccccc1C(=O)O\n"
            "The question should relate to identifying functional groups, predicting reactions, "
            "IUPAC naming, or properties of the structure shown.\n"
            "Only use SMILES for molecules actually mentioned in the source document.\n"
        )

    elif subject_lower == "biology":
        return base + (
            "Subject: BIOLOGY\n"
            "Visual type: 'diagram'\n"
            "For diagram questions, populate:\n"
            "  - visual_data.diagram_name: canonical name of the diagram "
            "(e.g. 'Stages of Mitosis', 'Human Heart Anatomy', 'Plant Cell Structure')\n"
            "  - visual_data.diagram_keywords: list of 3-6 specific search keywords "
            "for finding this diagram (e.g. ['mitosis', 'cell division', 'prophase', 'metaphase'])\n"
            "Do NOT populate visual_data.diagram_links — the backend resolves these after generation.\n"
            "The question should reference the diagram directly "
            "(e.g. 'In the diagram of mitosis shown, which stage...', "
            "'Based on the heart anatomy diagram, which vessel...').\n"
            "Choose diagrams that are commonly found in biology textbooks and directly "
            "supported by the source document.\n"
        )

    else:
        # Generic visual instructions for unknown/mixed subjects
        return base + (
            "Visual type: choose 'graph', 'structure', or 'diagram' as appropriate.\n"
            "For 'graph': populate visual_data.plotly_spec with Plotly JSON.\n"
            "For 'structure': populate visual_data.smiles with a SMILES string.\n"
            "For 'diagram': populate visual_data.diagram_name and visual_data.diagram_keywords.\n"
        )


def build_user_prompt(
    difficulty: str,
    bloom_level: str,
    batch_size: int,
    document_content: str,
    batch_index: int = 1,
    total_batches: int = 1,
    subject: Optional[str] = None
) -> str:
    """Builds the dynamic user prompt with batch settings, Bloom level, difficulty, and source document."""
    subject_line = f"Subject: {subject.capitalize()}\n" if subject else ""
    return (
        f"--- GENERATION PARAMETERS ---\n"
        f"{subject_line}"
        f"Requested Difficulty: {difficulty}\n"
        f"Requested Bloom's Taxonomy Level: {bloom_level}\n"
        f"Questions to Generate in this batch: {batch_size}\n"
        f"Batch Context: Batch {batch_index} of {total_batches}. "
        f"Please focus on varied sections/concepts to ensure topic coverage.\n\n"
        f"--- SUPPLIED STUDY MATERIAL (SOURCE DOCUMENT) ---\n"
        f"{document_content}\n\n"
        f"--- INSTRUCTIONS ---\n"
        f"Generate exactly {batch_size} distinct multiple-choice questions matching "
        f"difficulty '{difficulty}' and Bloom's level '{bloom_level}'. "
        f"Ensure each question has a valid 'source_reference' citing the page number "
        f"(e.g., 'Page X') from the supplied document wherever applicable.\n"
        f"Remember: 30-40% of questions must include a visual (has_visual=true) with "
        f"complete visual_type and visual_data as described in the system instructions."
    )
