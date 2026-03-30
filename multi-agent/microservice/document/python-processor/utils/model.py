from sentence_transformers import SentenceTransformer, CrossEncoder

# Load models once (singleton pattern)
_sbert_model = SentenceTransformer("distiluse-base-multilingual-cased-v2")
# _cross_model = CrossEncoder("distiluse-base-multilingual-cased-v2")

def get_embedding(contents):
    return _sbert_model.encode(contents).tolist()

# def get_cross_score(pairs):
#     return _cross_model.predict(pairs).tolist()
