def build_mcq_system_prompt() -> str:
    """Returns the base system prompt instructions for strict document-grounded MCQ generation."""
    return (
        "You are an expert educational assessment question generator.\n\n"
        "Your task is to generate high-quality multiple-choice questions strictly grounded in the supplied study material.\n\n"
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
        "Do not generate questions from your general knowledge when the answer is not supported by the supplied document.\n"
        "Use the document as the primary source of truth."
    )


def build_user_prompt(
    difficulty: str,
    bloom_level: str,
    batch_size: int,
    document_content: str,
    batch_index: int = 1,
    total_batches: int = 1
) -> str:
    """Builds the dynamic prompt with batch settings, Bloom level, difficulty, and source document."""
    return (
        f"--- GENERATION PARAMETERS ---\n"
        f"Requested Difficulty: {difficulty}\n"
        f"Requested Bloom's Taxonomy Level: {bloom_level}\n"
        f"Questions to Generate in this batch: {batch_size}\n"
        f"Batch Context: Batch {batch_index} of {total_batches}. Please focus on varied sections/concepts to ensure topic coverage.\n\n"
        f"--- SUPPLIED STUDY MATERIAL (SOURCE DOCUMENT) ---\n"
        f"{document_content}\n\n"
        f"--- INSTRUCTIONS ---\n"
        f"Generate exactly {batch_size} distinct multiple-choice questions matching difficulty '{difficulty}' "
        f"and Bloom's level '{bloom_level}'. Ensure each question has a valid 'source_reference' citing the page number "
        f"(e.g., 'Page X') from the supplied document wherever applicable."
    )
