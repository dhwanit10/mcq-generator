import re
import math
import logging
import difflib
from typing import List, Dict, Set
from app.config import settings

logger = logging.getLogger(__name__)

# Try importing sklearn cosine similarity
HAS_SKLEARN = False
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    HAS_SKLEARN = True
except Exception as e:
    logger.warning(f"sklearn not available or blocked by environment policy ({e}). Using pure Python TF-IDF fallback for deduplication.")


def _normalize_text(text: str) -> str:
    """Normalizes text by lowercasing and removing punctuation/extra spaces."""
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    return " ".join(text.split())


def _tokenize(text: str) -> List[str]:
    """Tokenizes text into lowercase words."""
    return re.findall(r'\w+', text.lower())


def _pure_python_tfidf_similarity(query: str, corpus: List[str]) -> float:
    """
    Pure Python implementation of TF-IDF Cosine Similarity for duplicate detection.
    Guarantees execution even in environments where binary C-extensions are blocked.
    """
    if not corpus:
        return 0.0

    all_docs = corpus + [query]
    tokenized_docs = [_tokenize(doc) for doc in all_docs]
    num_docs = len(all_docs)

    # Document frequencies
    df: Dict[str, int] = {}
    for doc_tokens in tokenized_docs:
        unique_tokens = set(doc_tokens)
        for token in unique_tokens:
            df[token] = df.get(token, 0) + 1

    # Calculate TF-IDF vectors
    def get_tfidf_vec(tokens: List[str]) -> Dict[str, float]:
        tf: Dict[str, int] = {}
        for token in tokens:
            tf[token] = tf.get(token, 0) + 1
        
        vec: Dict[str, float] = {}
        total_tokens = len(tokens) or 1
        for token, count in tf.items():
            idf = math.log((num_docs + 1) / (df.get(token, 0) + 1)) + 1.0
            vec[token] = (count / total_tokens) * idf
        return vec

    doc_vectors = [get_tfidf_vec(doc_tokens) for doc_tokens in tokenized_docs]
    query_vec = doc_vectors[-1]

    def cosine_sim(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
        common_keys = set(vec1.keys()) & set(vec2.keys())
        dot_product = sum(vec1[k] * vec2[k] for k in common_keys)
        mag1 = math.sqrt(sum(val ** 2 for val in vec1.values()))
        mag2 = math.sqrt(sum(val ** 2 for val in vec2.values()))
        if mag1 == 0 or mag2 == 0:
            return 0.0
        return dot_product / (mag1 * mag2)

    max_sim = 0.0
    for existing_vec in doc_vectors[:-1]:
        sim = cosine_sim(query_vec, existing_vec)
        if sim > max_sim:
            max_sim = sim

    # Also compute sequence matcher ratio as secondary guard
    seq_sims = [difflib.SequenceMatcher(None, _normalize_text(query), _normalize_text(d)).ratio() for d in corpus]
    max_seq_sim = max(seq_sims) if seq_sims else 0.0

    return max(max_sim, max_seq_sim)


class DuplicateDetector:
    """
    Per-job lightweight semantic deduplication service using exact string matching,
    scikit-learn TF-IDF, and pure Python fallback.
    """
    def __init__(self, similarity_threshold: float = None):
        self.threshold = similarity_threshold if similarity_threshold is not None else settings.DUPLICATE_SIMILARITY_THRESHOLD
        self.accepted_questions: List[str] = []
        self.normalized_questions: List[str] = []

    def is_duplicate(self, question_text: str) -> bool:
        if not question_text or not question_text.strip():
            return True

        norm_q = _normalize_text(question_text)
        
        # 1. Exact match check
        if norm_q in self.normalized_questions:
            logger.info(f"Duplicate detected via exact match: '{question_text[:40]}...'")
            return True

        if not self.normalized_questions:
            return False

        # 2. Sklearn Cosine Similarity if available
        if HAS_SKLEARN:
            try:
                corpus = self.normalized_questions + [norm_q]
                vectorizer = TfidfVectorizer().fit_transform(corpus)
                vectors = vectorizer.toarray()
                
                target_vec = vectors[-1].reshape(1, -1)
                existing_vecs = vectors[:-1]
                
                similarities = cosine_similarity(target_vec, existing_vecs)[0]
                max_similarity = float(similarities.max()) if len(similarities) > 0 else 0.0

                if max_similarity >= self.threshold:
                    logger.info(f"Duplicate detected via sklearn similarity ({max_similarity:.2f} >= {self.threshold}): '{question_text[:40]}...'")
                    return True
                return False
            except Exception as e:
                logger.warning(f"Sklearn similarity check failed ({e}). Falling back to pure Python TF-IDF.")

        # 3. Pure Python TF-IDF + SequenceMatcher Fallback
        similarity = _pure_python_tfidf_similarity(question_text, self.accepted_questions)
        if similarity >= self.threshold:
            logger.info(f"Duplicate detected via Python TF-IDF similarity ({similarity:.2f} >= {self.threshold}): '{question_text[:40]}...'")
            return True

        return False

    def add_question(self, question_text: str):
        self.accepted_questions.append(question_text)
        self.normalized_questions.append(_normalize_text(question_text))
