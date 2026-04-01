---
title: "Building a Private AI Knowledge Base with Milvus and Document Embedding"
date: "2024-11-10"
tags: ["ai", "milvus", "vector-search", "llm"]
excerpt: "How we built a document embedding pipeline and RAG chat application on top of Milvus that lets enterprise clients query their own data without sending it to external APIs."
draft: false
---

The barrier to AI adoption for enterprise clients isn't the model — it's the data. Most AI services require you to send your documents to an external API. For clients operating under strict data residency requirements or with sensitive internal knowledge bases, that's a non-starter. We built an on-premises document embedding pipeline and chat application that brought AI to the data, instead of the other way around.

## The Problem

Our IBM clients had large repositories of internal documentation: runbooks, compliance policies, architecture decision records, onboarding guides. Engineers spent hours hunting through SharePoint and Confluence for answers that existed somewhere in those documents. A natural language interface would eliminate most of that search friction — but not if it meant sending proprietary documents to OpenAI.

The solution: embed documents locally, store vectors in Milvus (an open-source vector database that runs on Kubernetes), and use a locally-hosted LLM for generation. All data stays on-premises.

## The Embedding Pipeline

Embedding converts text into dense numeric vectors. Semantically similar text produces vectors that are close together in high-dimensional space, which enables similarity search. We used `sentence-transformers` with the `all-MiniLM-L6-v2` model — a compact 80 MB model that produces 384-dimensional vectors and runs comfortably on CPU.

The pipeline reads documents from an S3-compatible object store, chunks them into overlapping segments, embeds each chunk, and upserts the vectors into Milvus:

```python filename="pipeline/embed.py"
from sentence_transformers import SentenceTransformer
from pymilvus import Collection
from dataclasses import dataclass
from typing import Iterator

CHUNK_SIZE = 400    # words (approximate)
CHUNK_OVERLAP = 50

@dataclass
class Chunk:
    doc_id: str
    text: str
    chunk_index: int
    source: str

def chunk_document(doc_id: str, text: str, source: str) -> Iterator[Chunk]:
    words = text.split()
    step = CHUNK_SIZE - CHUNK_OVERLAP
    for i, start in enumerate(range(0, len(words), step)):
        segment = " ".join(words[start : start + CHUNK_SIZE])
        yield Chunk(doc_id=doc_id, text=segment, chunk_index=i, source=source)

def embed_and_upsert(
    chunks: list[Chunk],
    collection: Collection,
    model: SentenceTransformer,
) -> None:
    texts = [c.text for c in chunks]
    vectors = model.encode(texts, batch_size=32, show_progress_bar=False)

    data = [
        [c.doc_id for c in chunks],
        [c.chunk_index for c in chunks],
        [c.source for c in chunks],
        [c.text for c in chunks],
        vectors.tolist(),
    ]
    collection.upsert(data)
```

The overlap between chunks ensures that answers spanning a chunk boundary aren't lost. Without overlap, a sentence split across two chunks produces two incomplete chunks, neither of which matches a query well.

## Milvus Collection Schema

We store both the vector and the source text in Milvus. Storing the text alongside the vector avoids a round-trip to the document store for every retrieval:

```python filename="pipeline/schema.py"
from pymilvus import FieldSchema, CollectionSchema, DataType

fields = [
    FieldSchema(name="id",          dtype=DataType.INT64,         is_primary=True, auto_id=True),
    FieldSchema(name="doc_id",      dtype=DataType.VARCHAR,       max_length=128),
    FieldSchema(name="chunk_index", dtype=DataType.INT64),
    FieldSchema(name="source",      dtype=DataType.VARCHAR,       max_length=512),
    FieldSchema(name="text",        dtype=DataType.VARCHAR,       max_length=4096),
    FieldSchema(name="embedding",   dtype=DataType.FLOAT_VECTOR,  dim=384),
]

schema = CollectionSchema(
    fields=fields,
    description="Document knowledge base",
)
```

We chose HNSW as the index type. HNSW (Hierarchical Navigable Small World) provides approximate nearest-neighbour search with low latency and good recall. For a collection of a few hundred thousand chunks, a query takes under 20 ms.

## The Query Flow

When a user submits a question, the chat application embeds the question with the same model, retrieves the top-*k* most similar chunks from Milvus, assembles them into a context string, and sends the context together with the question to the local LLM:

```python filename="app/query.py"
def retrieve_context(
    question: str,
    collection: Collection,
    model: SentenceTransformer,
    top_k: int = 8,
) -> list[str]:
    query_vec = model.encode([question])[0].tolist()

    results = collection.search(
        data=[query_vec],
        anns_field="embedding",
        param={"metric_type": "COSINE", "params": {"ef": 64}},
        limit=top_k,
        output_fields=["text", "source"],
    )

    return [
        f"[Source: {hit.entity.get('source')}]\n{hit.entity.get('text')}"
        for hit in results[0]
    ]
```

The `ef` parameter controls the HNSW search quality/speed trade-off. At `ef=64` we saw 95%+ recall on our test set with sub-30 ms query times.

## Results

Two things happened after deployment. First, engineers started finding answers they previously couldn't locate — not because the information didn't exist, but because keyword search doesn't surface documents that describe something without using the exact search term. Second, client teams started asking to embed their own internal documents beyond what we'd loaded initially. The pipeline had an API; they started calling it themselves.

We measured a 50% reduction in time-to-answer for common operational questions. More importantly, it reduced the barrier to starting an AI workflow from "requires a data science team" to "upload your documents."
