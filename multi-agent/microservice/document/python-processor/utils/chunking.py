

def segment(text):
  from underthesea import word_tokenize
  return word_tokenize(text, format="text")

def format_chunk(chunks,metadata = "None"):
  
  objs = []
  for chunk in chunks:
    content = {
      'metadata': metadata,
      'text': segment(' '.join(chunk.splits))
    }
    objs.append(content)
  return objs

def statistical_chunker():
  from semantic_router.encoders import HuggingFaceEncoder
  from semantic_chunkers import StatisticalChunker
  encoder = HuggingFaceEncoder()
  statistical_chunker = StatisticalChunker(encoder=encoder)
  return statistical_chunker

def regex_chunker():
  from semantic_chunkers import RegexChunker
  regex_chunker = RegexChunker()
  return regex_chunker