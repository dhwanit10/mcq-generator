from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, field_validator


class VisualData(BaseModel):
    """
    Carries subject-specific rendering data for visual MCQ questions.

    - Maths / Physics: Plotly-compatible JSON spec (layout + data traces).
      Render with Plotly.js on the frontend.
    - Chemistry: SMILES string for molecular structure.
      Render with RDKit.js / SmilesDrawer on the frontend.
    - Biology: diagram_keywords (search terms), diagram_name (canonical name),
      and diagram_links (resolved URLs — populated by the backend after generation).
    """
    # Maths & Physics ─ Plotly JSON
    plotly_spec: Optional[Dict[str, Any]] = Field(
        None,
        description="Plotly-compatible JSON with 'data' (traces) and 'layout' keys. For maths/physics graphs."
    )

    # Chemistry ─ SMILES
    smiles: Optional[str] = Field(
        None,
        description="SMILES string for the molecular structure. Render with SmilesDrawer.js / RDKit.js."
    )

    # Biology ─ Diagram lookup
    diagram_name: Optional[str] = Field(
        None,
        description="Canonical name of the biological diagram (e.g. 'Stages of Mitosis')."
    )
    diagram_keywords: Optional[List[str]] = Field(
        default_factory=list,
        description="Search keywords used to find the diagram in the local image pool or Google Images."
    )
    # Populated by the backend after generation ─ not emitted by the LLM
    diagram_links: Optional[List[str]] = Field(
        default_factory=list,
        description="Resolved image URLs (local or SerpAPI). Up to 3. Backend-populated, not LLM-generated."
    )


class MCQQuestion(BaseModel):
    question: str = Field(..., description="The multiple-choice question text")
    options: List[str] = Field(..., description="Exactly four choices/options for the question")
    correct_option: int = Field(..., description="0-indexed position of the correct answer (0, 1, 2, or 3)")
    explanation: str = Field(..., description="Concise explanation justifying the correct answer based on context")
    difficulty: str = Field("medium", description="Difficulty level requested (e.g., easy, medium, hard)")
    bloom_level: str = Field("apply", description="Bloom's taxonomy level requested")
    source_reference: Optional[str] = Field(None, description="Page number or section reference from source PDF")
    source_chunk_ids: Optional[List[str]] = Field(default_factory=list, description="Identifiers of retrieved source chunks")

    # ── Visual fields ──
    has_visual: bool = Field(
        False,
        description="True if this question is accompanied by a diagram, graph, structure, or visual aid."
    )
    visual_type: Optional[str] = Field(
        None,
        description=(
            "Type of visual: 'graph' (maths/physics plotly chart), "
            "'structure' (chemistry SMILES molecule), "
            "or 'diagram' (biology image)."
        )
    )
    visual_data: Optional[VisualData] = Field(
        None,
        description="Visual rendering data. Only present when has_visual=true."
    )

    @field_validator("options")
    @classmethod
    def validate_options_length(cls, v: List[str]) -> List[str]:
        if len(v) != 4:
            raise ValueError(f"MCQ must have exactly 4 options, got {len(v)}")
        cleaned = [opt.strip() for opt in v]
        if len(set(cleaned)) < len(cleaned):
            raise ValueError("MCQ options must be distinct/unique")
        if any(len(opt) == 0 for opt in cleaned):
            raise ValueError("MCQ options cannot be empty strings")
        return cleaned

    @field_validator("correct_option")
    @classmethod
    def validate_correct_option(cls, v: int) -> int:
        if v not in (0, 1, 2, 3):
            raise ValueError(f"correct_option must be 0, 1, 2, or 3, got {v}")
        return v

    @field_validator("question")
    @classmethod
    def validate_question_text(cls, v: str) -> str:
        text = v.strip()
        if len(text) < 10:
            raise ValueError("Question text is too short")
        return text


class MCQBatchResponse(BaseModel):
    questions: List[MCQQuestion] = Field(..., description="List of generated MCQ objects in batch")


class ValidationResult(BaseModel):
    is_valid: bool
    reason: Optional[str] = None
    quality_score: float = 1.0
