import type { Project } from "./types";

/**
 * The full project inventory. Facts sourced strictly from the master resume.
 * No fabricated metrics, dates, testimonials, or links. Visitor copy avoids
 * em dashes per Zack's standing preference.
 */
export const projects: Project[] = [
  {
    id: "omnipotence",
    name: "Omnipotence / CodeLens",
    tier: "deep",
    status: ["deployed", "adopted"],
    whatItIs:
      "A code-aware RAG engine: ask a plain-English question about a large codebase and get a concise, source-cited answer.",
    stack: [
      "Python 3.11",
      "Hexagonal architecture",
      "Tree-sitter",
      "SentenceTransformers",
      "OpenSearch",
      "Amazon Bedrock",
      "AWS CloudFormation",
      "Docker",
      "pytest",
    ],
    problem:
      "Engineers waste hours reading unfamiliar code to answer simple questions. Omnipotence ingests repositories, chunks them semantically, and answers questions through a multi-stage retrieval and ranking pipeline, always citing the source.",
    architecture:
      "Strict dependency inversion: pure business logic in the core, 14 abstract ports, and swappable adapters for OpenSearch, Bedrock or Ollama, Tree-sitter, and HuggingFace. Deployed to AWS entirely as infrastructure-as-code with CloudFormation: containerised services on ECS and ECR behind API Gateway and an ALB, Bedrock for inference, OpenSearch for hybrid search, S3 for vectors, and Lambda for ingestion.",
    hardestProblem:
      "Proving the architecture actually held. Automated architecture-boundary tests fail the build if business logic reaches for an adapter, and the same core runs Ollama locally and Bedrock in production without a single change to business logic.",
    tradeoffs:
      "Retrieval quality comes from pipeline design, not model size: syntax-aware chunking, LLM enrichment under strict anti-hallucination prompting, hybrid k-NN plus BM25 retrieval, relevance filtering, and cross-encoder reranking. More moving parts, but every stage is independently runnable for evaluation and debugging.",
    limitations:
      "Six languages supported at the chunking layer today. Answer quality depends on repository enrichment quality, and the deep pipeline trades some latency for grounding and citation accuracy.",
    context:
      "Built solo over a six month internship in the API and Backend chapter at Impala Studios, a team of five. It went from nothing to deployed and used company-wide inside that window, and the codebase was then opened to every engineer so others could build on it. The internship was graded 9 out of 10.",
    metrics: [
      { value: "~7,200", label: "lines of Python" },
      { value: "14", label: "abstract ports" },
      { value: "28", label: "test modules" },
      { value: "10+", label: "repos indexed" },
      { value: "6", label: "languages" },
    ],
    systemMap: {
      join: "Both tracks meet in OpenSearch: ingest writes the chunk index and the router profiles, ask reads them back.",
      tracks: [
        {
          id: "ingest",
          label: "INGEST",
          purpose: "Turn raw source code into a searchable index.",
          stages: [
            {
              command: "chunk",
              label: "Chunk",
              impl: "LocalFSRepoSource + TreeSitterSyntax",
              detail:
                "Walks the repo, filters by extension and skips node_modules, .git and generated files. Tree-sitter finds structural breakpoints (classes, functions, methods), hoists leading comments and decorators onto their declaration, respects an 800 token budget, and falls back to line splitting when parsing fails. Every chunk carries AST metadata: node kind, AST path, symbol and receiver names.",
              output: "chunks.jsonl",
            },
            {
              command: "enrich",
              label: "Enrich",
              impl: "OllamaEnricher (Qwen2.5-Coder)",
              detail:
                "A code LLM writes a summary of 160 characters or fewer plus six to eight conceptual keywords per chunk, in batches. Strict anti-hallucination prompting: chunk-local context only, no speculation, no raw identifiers. This is what bridges the gap between how developers ask and how code is written.",
              output: "enriched.jsonl",
              swap: { local: "Ollama (Qwen2.5-Coder)", prod: "Amazon Bedrock" },
            },
            {
              command: "embed",
              label: "Embed",
              impl: "QodoEmbedder (Qodo-Embed-1)",
              detail:
                "One L2-normalised vector per chunk, generated through SentenceTransformers.",
              output: "enriched_with_vecs.jsonl",
            },
            {
              command: "index",
              label: "Index",
              impl: "OpenSearch",
              detail:
                "Ensures the index exists with the right k-NN mapping and embedding dimension, then bulk-indexes vector, text and metadata together. This is the step that makes hybrid k-NN plus BM25 retrieval possible later.",
              output: "code_chunks_v5",
            },
            {
              command: "router",
              label: "Router",
              impl: "OllamaRouterAuthor + OpenSearchRouterStore",
              detail:
                "An LLM builds a compact profile of the whole repository: title, summary, languages, tech stack, modules, key symbols, keywords and sample queries. Content-hashed, so it only rebuilds when the repo actually changed.",
              output: "one router profile per repo",
            },
          ],
        },
        {
          id: "ask",
          label: "ASK",
          purpose: "Turn a natural-language question into a grounded, cited answer.",
          stages: [
            {
              step: "1/6",
              label: "Embed query",
              impl: "QueryEmbeddingService",
              detail:
                "Embeds the question with the same Qodo-Embed model used at ingestion, so the query and the chunks share one vector space.",
            },
            {
              step: "2/6",
              label: "Route",
              impl: "RepoFilteringService",
              detail:
                "Searches the router index with the question and picks the most relevant repositories, producing a repo_id filter. Narrowing the search space before deep retrieval is what keeps the expensive stages cheap.",
              output: "repo_id filter",
            },
            {
              command: "retrieve",
              label: "Hybrid retrieve",
              impl: "RetrievalService.retrieve_hybrid",
              detail:
                "Queries OpenSearch with the query vector (k-NN) and the query text (BM25) at once, scoped to the routed repos. Top 20 candidates by default.",
              output: "20 candidate chunks",
            },
            {
              command: "filter",
              step: "3/6",
              label: "LLM filter",
              impl: "OllamaLLMFilter",
              detail:
                "A code judge. For each candidate it decides, from the visible code alone, whether that chunk can actually help answer the question, dropping import-only and header hits.",
            },
            {
              command: "rerank",
              step: "4/6",
              label: "Rerank",
              impl: "HFCrossEncoderReranker",
              detail:
                "A cross-encoder scores query against chunk directly, a stronger relevance model than first-stage retrieval, and reorders whatever survived the filter.",
            },
            {
              command: "pack",
              step: "5/6",
              label: "Pack context",
              impl: "ContextPackingService",
              detail:
                "Dedupes chunks, optionally expands to neighbours, applies per-file and total caps, and tracks a citation for every block: file path plus line span.",
              output: "packed context + citations",
            },
            {
              command: "answer",
              step: "6/6",
              label: "Answer",
              impl: "OllamaAnswerLLM",
              detail:
                "Generates the answer from the packed context under a grounded system prompt, so what comes back is backed by the retrieved code and carries its citations.",
              swap: { local: "Ollama", prod: "Amazon Bedrock" },
            },
          ],
        },
      ],
    },
    diagram: [
      { label: "query", caption: "embed the natural-language question" },
      { label: "route", caption: "select candidate repositories cheaply" },
      { label: "hybrid retrieve", caption: "k-NN vectors plus BM25 lexical" },
      { label: "LLM filter", caption: "drop irrelevant chunks" },
      { label: "rerank", caption: "cross-encoder reorders by relevance" },
      { label: "cited answer", caption: "grounded answer with sources" },
    ],
  },
  {
    id: "recomp-tracker",
    name: "Recomp Tracker",
    tier: "deep",
    status: ["beta"],
    whatItIs:
      "A ~65k-LOC Android app that unifies nutrition, training, and recovery into a closed feedback loop, with a cited AI coach that cannot fabricate a metric.",
    stack: [
      "Kotlin",
      "Jetpack Compose",
      "Material 3",
      "MVVM + Clean Architecture",
      "Coroutines / Flow",
      "Room",
      "WorkManager",
      "OpenAI-compatible LLM",
      "RAG",
      "TDD",
    ],
    problem:
      "A calorie counter only logs. Recomp Tracker reads the user's own trends in weight, waist, adherence, and recovery, then recommends concrete plan changes, while an AI coach answers questions and takes actions grounded strictly in real data.",
    architecture:
      "A strict dependency rule from UI to ViewModel to Repository to Room and DataStore, with a pure-Kotlin domain layer that carries zero Android dependencies, so core logic runs on the JVM in milliseconds and is trivially unit-testable. Offline-first persistence with Room across 15 migrations, 11 DataStore stores, and API secrets in AES-256-GCM encrypted storage.",
    hardestProblem:
      "Deterministic-first AI. Every number and verdict is computed by domain engines; the LLM only adds prose, so the model has no path to fabricate a metric. The plan-version ledger was the hardest piece: a plan change never re-judges days already logged under the old target, which naive implementations silently corrupt.",
    tradeoffs:
      "Keeping the model behind a deterministic boundary means more domain code and less LLM magic, but it buys a real trust and safety property rather than a prompt-engineering hope.",
    limitations:
      "Closed beta with 10 users, Play Store publication imminent. Retention numbers from testers are still being gathered.",
    context:
      "Designed, built and shipped alone, start to finish. In closed beta with 10 users and heading for Google Play. Every test was written first: around 1,300 of them, including real in-memory database tests that exercise foreign-key and transaction behaviour rather than mocking it away.",
    metrics: [
      { value: "~65k", label: "lines of code" },
      { value: "~1,300", label: "unit tests" },
      { value: "19", label: "coach tools" },
      { value: "18", label: "signal detectors" },
      { value: "10", label: "beta users" },
    ],
    coachBoundary: {
      claim:
        "The coach cannot invent a number. Every figure it quotes was computed by the app before the model saw it, and every action that touches your log, your plan or your training stops and asks first. That is a structural property, not a carefully worded prompt.",
      anatomy: [
        { text: "Your weight trend is ", source: "written" },
        { text: "[computed from 28 days of weigh-ins]", source: "computed" },
        { text: " and your adherence is ", source: "written" },
        { text: "[computed against your base plan]", source: "computed" },
        { text: ". This week's verdict is ", source: "written" },
        { text: "[decided by the adjustment engine]", source: "computed" },
        { text: ". You have been consistent through a tough week, so I would keep going as you are.", source: "written" },
      ],
      lanes: [
        {
          id: "read",
          label: "RUNS STRAIGHT AWAY",
          rule: "Looking things up changes nothing, so nothing blocks it.",
          why: "Nine ways to read your data, the food library, the exercise library or the web.",
        },
        {
          id: "confirm",
          label: "STOPS AND ASKS",
          rule: "The conversation genuinely pauses until you answer.",
          why: "Eight actions that would change your food log, your calorie target or your training. You see exactly what is about to be written before it is.",
        },
        {
          id: "memory",
          label: "WRITES WITHOUT ASKING",
          rule: "Deliberately ungated, because you can undo it in one tap.",
          why: "Two actions that change only what the coach remembers about you, all of it visible and editable on its own screen.",
        },
      ],
      tools: [
        { label: "Today's summary", lane: "read", detail: "A day's food log with macro totals and the metrics recorded that day." },
        { label: "Weekly trends", lane: "read", detail: "The last seven days of macro totals and how closely you hit your targets." },
        { label: "Training summary", lane: "read", detail: "Four weeks of strength per lift and its direction, plus volume, sessions per week and how recovered you have been." },
        { label: "Body trends", lane: "read", detail: "Four weeks of weight, waist and skinfold movement per week, and a smoothed weekly weight." },
        { label: "Food library search", lane: "read", detail: "Finds a food and can scale its macros to the portion you actually ate." },
        { label: "Web search", lane: "read", detail: "Looks something up online and comes back with the sources it used." },
        { label: "Your routines", lane: "read", detail: "Lists your training routines with their set, rep and weight targets." },
        { label: "Exercise search", lane: "read", detail: "Searches a library of more than 870 exercises." },
        { label: "Meal suggestions", lane: "read", detail: "Works out what you have left for the day and suggests portioned meals to fill the gap." },
        { label: "Log a meal", lane: "confirm", detail: "Adds a meal to your day. Give it a future date and it plans the meal instead of counting it as eaten." },
        { label: "Edit a meal", lane: "confirm", detail: "Rescales a logged meal to a different portion or corrects its macros." },
        { label: "Delete a meal", lane: "confirm", detail: "Removes a meal. If more than one could match, it asks which you meant rather than guessing." },
        { label: "Log a body metric", lane: "confirm", detail: "Records a weight, waist, sleep, energy, hunger or soreness value for today." },
        { label: "Change your calorie target", lane: "confirm", detail: "Sets the daily target your whole plan is measured against." },
        { label: "Create a routine", lane: "confirm", detail: "Builds a new training routine. If it cannot match an exercise you named, it abandons the whole write and suggests near matches." },
        { label: "Edit a routine", lane: "confirm", detail: "Changes only the parts you asked about: adding, removing, retargeting or renaming." },
        { label: "Create an exercise", lane: "confirm", detail: "Adds a custom exercise to your library with the muscles it works." },
        { label: "Remember this", lane: "memory", detail: "Saves something about you so it carries across conversations." },
        { label: "Forget that", lane: "memory", detail: "Drops a remembered fact." },
      ],
      verdict: {
        states: ["Wait for data", "Hold", "Increase calories", "Reduce calories"],
        note: "Eight outcomes, tried strictly in order, first match wins. The two gates come first, so a verdict is never read off a trend that has not earned it yet. Thresholds are yours to edit; the fourteen day minimum is not.",
        outcomes: [
          { when: "Fewer than fourteen days logged", verdict: "Wait for data" },
          { when: "You hit your target on fewer than 80 percent of logged days", verdict: "Wait for data" },
          { when: "First week, scale up but waist steady: water, not fat", verdict: "Hold" },
          { when: "Losing weight while recovery or strength is falling", verdict: "Increase calories", change: "+150" },
          { when: "Gaining weight and waist growing with it", verdict: "Reduce calories", change: "-100" },
          { when: "Weight and waist both steady, strength holding", verdict: "Hold" },
          { when: "Weight up, waist steady, strength climbing: lean gain", verdict: "Hold" },
          { when: "Nothing above matched cleanly", verdict: "Hold" },
        ],
      },
    },
  },
  {
    id: "consented-cart",
    name: "Consented Cart",
    tier: "deep",
    status: ["live"],
    whatItIs:
      "A Shopify embedded app that recovers abandoned carts under GDPR opt-in, enforcing the consent rule at the database schema, not by UI convention.",
    stack: [
      "React Router v7",
      "TypeScript",
      "Prisma ORM",
      "Shopify Admin API",
      "Shopify App Proxy",
      "Polaris / App Bridge",
      "Liquid",
      "Resend",
      "Vitest",
    ],
    problem:
      "The industry-standard move is to auto-enrol every visitor into marketing lists, which is legally risky under GDPR and CCPA. Consented Cart captures explicit, timestamped, versioned consent at the point of interaction and only then triggers email flows.",
    architecture:
      "16 relational Prisma entities across 12 sequential migrations, including a zero-downtime idempotent backfill. Every submission writes two separately revocable consent records, marketing unchecked by default, enforced at the schema level so future features cannot silently bypass it. OAuth and embedded auth, App Proxy public APIs, webhook-driven pipelines, and a Polaris admin dashboard.",
    hardestProblem:
      "A revenue-attribution engine that matches Shopify orders-paid webhooks back to the originating capture event within a configurable window, with idempotency-keyed email dispatch so retried webhook deliveries cannot double-send.",
    tradeoffs:
      "Enforcing opt-in at the schema and hashing PII at rest adds friction to every feature, but it makes a legally significant business rule impossible to violate by accident.",
    limitations:
      "Live, on the Shopify App Store distribution model. Merchant adoption numbers are not mine to publish yet.",
    context:
      "Built at Kukis, a company I co-own, as one of the products we sell to Shopify merchants. I wrote it solo, end to end: OAuth and embedded auth, public storefront APIs, webhook-driven pipelines, transactional email, the relational schema and its migrations, plus a storefront theme extension alongside the embedded React admin.",
    relatedIds: ["kukis"],
    metrics: [
      { value: "~12,300", label: "lines of TypeScript" },
      { value: "16", label: "Prisma entities" },
      { value: "12", label: "migrations" },
      { value: "94", label: "files" },
    ],
    consentLedger: {
      claim:
        "Opt-in is not a checkbox this app remembers to honour, it is the shape of the data. One submission writes two separate records, marketing is never granted by default, and each record keeps the exact wording the shopper agreed to. Try to get a marketing email sent without ticking the box.",
      rows: [
        {
          kind: "Transactional",
          purpose: "Send this shopper the thing they just asked for, like their own cart link.",
          grantedByDefault: true,
          allows: "Recovery, save-for-later and back-in-stock emails they requested.",
        },
        {
          kind: "Marketing",
          purpose: "Add them to marketing flows and promotional campaigns.",
          grantedByDefault: false,
          allows: "Marketing email. Nothing else depends on it.",
        },
      ],
      snapshot: [
        { label: "The wording itself", detail: "The exact consent text shown at that moment, stored verbatim on the record rather than referenced." },
        { label: "The version in force", detail: "Editing the policy text bumps the merchant's version forward automatically. Records already written are never rewritten." },
        { label: "The box before they touched it", detail: "The state the marketing checkbox was in before submitting, which is the evidence that ticking it was a deliberate act." },
        { label: "When, and from where", detail: "Timestamp in UTC, IP address, browser user agent and the store it happened on." },
      ],
      guarantees: [
        {
          cannot: "A shopper cannot be auto-enrolled into marketing",
          because: "Marketing is its own record and is never written as granted unless the box was ticked. Every widget ships it unticked.",
        },
        {
          cannot: "Withdrawing marketing consent cannot break the emails they asked for",
          because: "The two records are separate rows, revocable independently of each other.",
        },
        {
          cannot: "A policy change cannot rewrite what someone already agreed to",
          because: "Each record snapshots the wording and version at submission, and nothing in the app updates those columns afterwards.",
        },
        {
          cannot: "A retried webhook cannot send the same email twice",
          because: "All outbound email leaves through a single typed dispatch point carrying an idempotency key.",
        },
        {
          cannot: "A future feature cannot quietly bypass the opt-in rule",
          because: "The rule lives in the schema and the consent write path, not in UI convention that a new screen could forget.",
        },
        {
          cannot: "The migration off the legacy model cannot drop or duplicate a record",
          because: "The backfill is idempotent and backwards compatible, so it could run repeatedly with no downtime.",
        },
        {
          cannot: "Public capture endpoints cannot be hammered",
          because: "They are rate limited, because anything reachable from a storefront is reachable by anyone.",
        },
      ],
    },
  },
  {
    id: "lex-ai",
    name: "Lex-AI",
    tier: "deep",
    status: ["academic"],
    whatItIs:
      "A RAG chatbot over 87 official EU AI-policy documents, built on a vector database written from scratch in NumPy.",
    stack: [
      "Python",
      "BAAI/bge-small-en-v1.5",
      "NumPy",
      "MMR reranking",
      "Ollama + Llama 3.2 3B",
      "Streamlit",
    ],
    problem:
      "Answer natural-language questions about EU AI policy grounded in a curated corpus, without confabulating when the answer is not in the documents.",
    architecture:
      "A full pipeline built end to end: resilient document acquisition at 97.7% success across 403s, redirect walls, and scanned PDFs, sentence-aware overlapping chunking, BGE asymmetric query and passage prefixing, and a vector database written from scratch in NumPy with exact cosine search and a from-scratch MMR reranker for source diversity.",
    hardestProblem:
      "An empirically tuned evidence threshold of 0.55 cosine that refuses to call the LLM at all when retrieval confidence is too low, so the system says it does not have the answer instead of confabulating. Validated at 0.63 to 0.86 for on-topic queries versus below 0.20 for out-of-scope ones.",
    tradeoffs:
      "Writing the vector store and reranker by hand instead of using FAISS or Chroma is more work, but it demonstrates the underlying maths rather than tool familiarity, and every design constant came from measurement.",
    limitations:
      "Runs on a local 3B open-weight model, which trades some fluency for full self-hosted control. Corpus is 87 documents, 1,060 chunks.",
    metrics: [
      { value: "87", label: "policy documents" },
      { value: "1,060", label: "retrieval chunks" },
      { value: "0.55", label: "evidence threshold" },
      { value: "97.7%", label: "acquisition success" },
    ],
    diagram: [
      { label: "query", caption: "embed with BGE query prefix" },
      { label: "cosine search", caption: "exact search over NumPy store" },
      { label: "MMR rerank", caption: "balance relevance and diversity" },
      { label: "evidence gate", caption: "refuse below 0.55 cosine" },
      { label: "cited answer", caption: "4-part answer with citations" },
    ],
    evidenceGate: {
      claim:
        "The interesting part of a retrieval system is not how it answers, it is how it decides not to. Below a confidence of 0.55 this one refuses outright and never calls the model at all, so an out-of-scope question costs nothing and returns no invention. Drag the marker to see where a question lands.",
      threshold: 0.55,
      below:
        "Refused before the model is ever called. The answer is that this is not in the knowledge base, which is a real answer.",
      above:
        "Answered from the retrieved passages, in a fixed four-part shape, with inline citations and a ranked list of the documents used.",
      calibration:
        "The number came from measurement, not instinct. Questions that belong to the corpus and questions that clearly do not were scored, and the two populations fell far apart. The threshold sits in the empty space between them, which is why it holds up rather than needing constant nudging.",
      bands: [
        {
          label: "Clearly out of scope",
          from: 0,
          to: 0.2,
          meaning: "Nothing in the corpus shares meaningful vocabulary with the question.",
          answered: false,
        },
        {
          label: "Nothing measured here",
          from: 0.2,
          to: 0.63,
          meaning: "No benchmark question landed in this range, which is exactly why the line was drawn inside it.",
          answered: false,
        },
        {
          label: "Genuine policy questions",
          from: 0.63,
          to: 0.86,
          meaning: "Every on-topic benchmark question scored in this range, all of it clear of the line.",
          answered: true,
        },
      ],
      liveHere:
        "This same idea is running on the page you are reading. The help bot in the corner refuses off-topic questions the same way, before spending anything, and it will show you its citations when it does answer. Ask it something unrelated and watch it decline.",
      liveCaveat:
        "The thresholds differ. Lex-AI compares dense embeddings across policy documents; this site compares term overlap across a resume, so the numbers are tuned separately against their own benchmarks.",
      handBuilt: [
        {
          label: "The vector store",
          detail: "No search library. Every stored passage is compared against the question in one vectorised pass, and because all vectors are normalised in advance, measuring the angle between them reduces to a single multiplication.",
        },
        {
          label: "The diversity reranker",
          detail: "Ranking by relevance alone returns five near-identical passages from the same document. This picks each next passage for what it adds over the ones already chosen, so the answer is built from several sources rather than one paragraph repeated.",
        },
        {
          label: "A cap per document",
          detail: "No single document may dominate the evidence, however well it happens to match.",
        },
        {
          label: "Sentence-aware chunking",
          detail: "Passages are split at sentence boundaries with a deliberate overlap, so no chunk begins halfway through a thought and nothing is lost at the seams.",
        },
        {
          label: "Asymmetric embedding",
          detail: "The embedding model expects questions and documents to be prepared differently. Treating them the same is a quiet mistake that degrades every result without ever raising an error.",
        },
      ],
    },
  },
  {
    id: "tulipvision",
    name: "TulipVision",
    tier: "deep",
    status: ["deployed", "adopted"],
    whatItIs:
      "A tulip-sprout detection platform: a YOLOv11 model track plus the full FastAPI, Vue, and Azure deployment, adopted by a university research group.",
    stack: [
      "Python",
      "PyTorch",
      "Ultralytics YOLO",
      "FastAPI",
      "Vue 3 / TypeScript",
      "Redis",
      "Docker",
      "Azure Container Apps",
    ],
    problem:
      "Detect and count tulip sprouts in raw field imagery for precision agriculture. Upload a field photo, choose a detector, and get an annotated image, a sprout count, and per-detection confidence.",
    architecture:
      "A FastAPI backend with JWT auth and a pluggable model-adapter registry, so one abstract detector interface backs all four benchmarked models behind the same endpoints. A typed Vue 3 SPA with 8 views, Redis caching keyed on image hash plus threshold plus model digest, and a storage abstraction that switches between local disk and Azure Blob by environment.",
    hardestProblem:
      "An adaptive tiled-inference pipeline that splits oversized images into overlapping 640x640 tiles, runs batched inference, remaps tile-local boxes back to original coordinates, and applies a custom global NMS pass to remove duplicates along tile seams, improving small-object recall with no retraining.",
    tradeoffs:
      "A shared evaluation protocol across four architectures made results comparable and switchable in the app, at the cost of building common dataset, metrics, and visualisation utilities up front.",
    limitations:
      "My YOLOv11 track reached mAP@50 around 0.63; the best model in the study, Faster R-CNN, reached around 0.86. The platform surfaces this honestly so users can compare detectors.",
    context:
      "Applied research at Inholland Alkmaar with a team of three, March to June 2026, graded 8 out of 10. The research group adopted it and it runs on Azure. I owned the YOLOv11 track and then built the entire platform around everyone's models: the API, the web app and the deployment.",
    metrics: [
      { value: "4", label: "models benchmarked" },
      { value: "0.86", label: "best mAP@50" },
      { value: "8", label: "frontend views" },
      { value: "8/10", label: "project grade" },
    ],
    visionBench: {
      claim:
        "A field photograph is far larger than anything a detector will accept, and a sprout is a few pixels across. Shrink the photo to fit and the sprouts vanish. The fix was to stop shrinking, and it needed no retraining at all.",
      tiling: {
        image: "game/method/tulipvision-field.webp",
        note: "Pixel art illustration of a tulip field. The crops and boxes are drawn by this page to show how the method works, and are not output from the detector. Its real scores are in the panel below.",
        steps: [
          {
            label: "One pass",
            detail: "The whole photograph is shrunk down to what the detector accepts. The larger sprouts survive the resize. The small ones stop being anything the model can see, and no amount of tuning gets them back.",
          },
          {
            label: "Cut into tiles",
            detail: "Instead of shrinking, the frame is cut into a grid of overlapping crops, each one small enough to pass through the detector at full resolution. The overlap matters: a plant sitting exactly on a cut would otherwise be sliced in half and missed by both sides.",
          },
          {
            label: "Detect in every tile",
            detail: "Each crop is inspected in batches, and the boxes that come back are translated from crop coordinates into positions on the original photograph. Now the small sprouts are found, but the overlap has a cost: anything inside a shared strip gets reported once by each crop that saw it.",
          },
          {
            label: "Merge the seams",
            detail: "A final pass across the whole photograph compares every box against every other and collapses the ones describing the same sprout. Duplicates along the seams disappear, and the count is right.",
          },
        ],
      },
      protocol:
        "Four architectures, one shared annotated dataset, one evaluation protocol, so the numbers are comparable rather than four separate claims. Every result is stored and surfaced in the app, and a detector can be swapped per analysis.",
      models: [
        { name: "Faster R-CNN", mine: false, map50: 0.86, precision: 0.87, recall: 0.85, note: "Two-stage. The most accurate of the four." },
        { name: "YOLOv11", mine: true, map50: 0.63, precision: 0.72, recall: 0.69, note: "My track. Single-stage, and the one the tiled pipeline was built around." },
        { name: "RetinaNet", mine: false, map50: 0.28, note: "Single-stage. Clearly outperformed here." },
        { name: "YOLOv5", mine: false, note: "Included as a real-time baseline." },
      ],
      shipped: [
        {
          label: "One interface, four detectors",
          detail: "Every architecture sits behind the same abstract detector, registered by name, so all four are served through identical endpoints and a new one can be added without touching the API.",
        },
        {
          label: "A cache key that includes the weights",
          detail: "Results are cached against the image, the confidence threshold and a digest of the model checkpoint. Swapping in retrained weights changes the key, so a stale result cannot outlive the model that produced it.",
        },
        {
          label: "Storage that moves with the environment",
          detail: "Uploads, results and model weights go to local disk in development and to cloud storage in production, chosen by configuration rather than by branching code.",
        },
        {
          label: "Deployed, not just runnable",
          detail: "Containerised with the whole stack composed together, pushed to Azure with a scripted deploy that runs a health check afterwards rather than assuming the release worked.",
        },
      ],
    },
  },
  {
    id: "locked-in",
    name: "Locked IN",
    tier: "deep",
    status: ["personal"],
    whatItIs:
      "A native iOS commitment tracker that enforces commitments through a rules-based domain engine rather than simple habit logging.",
    stack: [
      "Swift",
      "SwiftUI",
      "Swift Concurrency",
      "@MainActor",
      "Combine",
      "XCTest",
    ],
    problem:
      "Habit apps just log. Locked IN enforces user commitments with a real domain engine: a lock you choose and cannot then shorten, rolling 14-day evaluation windows, ISO-week scheduling, violation detection, streaks, and a recovery mode that reduces how much you are allowed to run at once.",
    architecture:
      "Four strict layers, a pure-Swift domain with zero framework imports, @MainActor state stores, MVVM feature modules, and protocol-based persistence with atomic-write JSON repos plus in-memory doubles, so previews and unit tests never touch disk.",
    hardestProblem:
      "A policy-engine gatekeeper that is the single authority for allowed actions and returns a user-facing reason for every denied mutation, which centralises the rules and makes invalid state unrepresentable.",
    tradeoffs:
      "Keeping all business logic in framework-free engines means more protocol plumbing, but it makes the hardest logic testable in milliseconds and buys an injectable app clock that makes time-dependent behaviour reproducible.",
    limitations:
      "A personal-scope project. Dates and any TestFlight distribution are still to be confirmed.",
    context:
      "A solo build. The domain layer is pure Swift with no framework imports beyond Foundation, so the rules are ordinary structs: the three engines run to roughly 2,000 lines between them, with a further 1,700 lines of scenario factories feeding both the SwiftUI previews and an in-app seeder. Thirty tests cover the two hardest areas, the lifecycle and recovery.",
    metrics: [
      { value: "4", label: "architecture layers" },
      { value: "6", label: "lifecycle states" },
      { value: "17", label: "refusal reasons" },
      { value: "14-day", label: "evaluation window" },
      { value: "30", label: "lifecycle tests" },
    ],
    commitmentClock: {
      claim:
        "Every rule in this app is about elapsed time, so none of it can be shown standing still. Drag the day forward: the lifecycle advances, a missed target trips the system into recovery, and the gatekeeper starts refusing things. Every refusal below is the app's own wording, with its own numbers counting down.",
      note: "One commitment, played forward. The states, thresholds, gates and refusal messages are the app's; the commitment itself is an example.",
      lockDays: 28,
      windowDays: 14,
      weeklyTarget: 5,
      baseDate: "2026-03-02",
      timeline: { violation: 3, resolved: 4, restored: 11 },
      actions: [
        { id: "edit-title", label: "Rename it" },
        { id: "edit-frequency", label: "Change how often" },
        { id: "retire", label: "Retire it" },
        { id: "remove", label: "Delete it" },
        { id: "add", label: "Start another commitment" },
        { id: "complete", label: "Log a session" },
      ],
      reasons: [
        {
          id: "cannotEditFieldDuringLock",
          title: "Field Locked",
          message: "Frequency cannot change during lock. {n} day{s} remaining (ends {date}).",
          hint: "You can still edit title, icon, preferred time, and estimated duration.",
        },
        {
          id: "cannotRetireDuringLock",
          title: "Retirement Locked",
          message: "Protocol cannot be retired during lock. {n} day{s} remaining (ends {date}).",
          hint: "Retirement unlocks after lock end.",
        },
        {
          id: "cannotRemoveUnlessCompletedOrRetired",
          title: "Removal Blocked",
          message: "Only completed or retired protocols can be removed.",
          hint: "Retire the protocol after lock, then remove it.",
        },
        {
          id: "capacityExceeded",
          title: "Capacity Reached",
          message: "System capacity is {a}/{b}. Additions are blocked.",
          hint: "Complete or retire protocols first.",
        },
        {
          id: "protocolCompletedOrRetired",
          title: "Protocol Closed",
          message: "This protocol is completed or retired.",
          hint: "Create a new protocol to continue tracking.",
        },
      ],
      pipeline: [
        {
          label: "It replays, it does not guess",
          detail: "Jumping the clock forward does not skip anything. Six checks run in a fixed order on every tick, and each one walks the days that closed since it last ran: missed days, whole closed weeks, shortfalls inside the current week, window boundaries, clean days, and a final repair pass.",
        },
        {
          label: "Each check carries its own cursor",
          detail: "A protocol remembers the last day it checked, each window remembers which weeks it has already scored, and the system remembers where the recovery count got to. That is what makes the replay safe: every intervening day is evaluated exactly once, in order, no matter how far the clock jumped.",
        },
        {
          label: "A week can fail before it ends",
          detail: "The shortfall check does not wait for Sunday. It fires the moment the target becomes arithmetically impossible: with a five-a-week target, one session logged and only three usable days left, the week is already lost and the violation lands there and then.",
        },
        {
          label: "Some weeks are deliberately forgiven",
          detail: "Four cases suppress a violation on purpose: the part-week you created it in, the day you created it, the creation week itself, and the part-week left after recovery ends. A partial week that could never have met the target is not a failure.",
        },
        {
          label: "It repairs itself",
          detail: "A normalisation pass reconciles states that contradict each other: a process killed mid-transition, a protocol left paused with nothing pausing it, a clean-day streak that reached its target while recovery was somehow still running. The edge cases it handles are numbered in the code.",
        },
      ],
      layers: [
        {
          label: "Features",
          detail: "The screens and their view models. Views send actions; nothing here decides anything.",
        },
        {
          label: "Application",
          detail: "Main-thread stores holding observable state. Each mutation copies the system, runs engine calls against the copy, assigns it back and persists, so a half-applied change cannot be observed.",
        },
        {
          label: "Core",
          detail: "Repository interfaces with a file-backed implementation that writes atomically, plus in-memory doubles so previews and tests never touch disk. The AI seam lives here too.",
        },
        {
          label: "Domain",
          detail: "Pure Swift, importing nothing but Foundation. No UI type, no observable wrapper, no framework. Every rule on this screen lives here, which is why it can be tested as ordinary values rather than through a running app.",
        },
      ],
    },
  },
  {
    id: "digital-banking",
    name: "Digital Banking Platform",
    tier: "card",
    status: ["academic"],
    whatItIs:
      "A full-stack Java and Vue bank simulation with real financial domain logic, where I was top committer on a 5-person Scrum team.",
    stack: [
      "Java 21",
      "Spring Boot 3",
      "Spring Security + JWT",
      "Vue 3",
      "JUnit 5",
      "Cucumber",
    ],
    metrics: [
      { value: "~80/215", label: "commits (top committer)" },
      { value: "9", label: "BDD scenarios" },
    ],
    links: [
      {
        label: "GitHub",
        href: "https://github.com/Sorint-original/Code-Generation",
      },
    ],
  },
  {
    id: "kukis",
    name: "Kukis",
    tier: "card",
    status: ["live"],
    whatItIs:
      "A company I co-own, and the live marketing site I built for it: a custom brand system and a canvas 96-frame scroll-scrub hero animation.",
    context:
      "Kukis is a company I co-own. It builds and sells software to merchants, and Consented Cart is one of its products. The site is the front door: I designed the brand system and built the site itself.",
    relatedIds: ["consented-cart"],
    stack: [
      "React 18",
      "TypeScript",
      "Tailwind CSS v4",
      "Vite 6",
      "Framer Motion",
      "Canvas API",
      "Vitest",
      "GitHub Actions",
    ],
    metrics: [
      { value: "96", label: "animation frames" },
      { value: "0", label: "backend services" },
      { value: "live", label: "at kukis.nl" },
    ],
    marketingSite: {
      claim:
        "The site has one job: make a legal distinction land with people who are not lawyers. Agreeing to be tracked and agreeing to be emailed are two different permissions, and a shopper who refuses the first has not refused the second. Everything else on the page exists to carry that sentence.",
      premise:
        "Under GDPR, cookie consent and marketing consent are separate permissions resting on separate grounds. Declining a cookie banner says nothing about whether someone would like to hear from a shop by email, provided you ask for that separately and do not need a cookie to do it.",
      cases: [
        {
          id: "accepts",
          label: "A shopper who accepts the cookie banner",
          outcomes: [
            {
              approach: "Tools that depend on cookies",
              reachable: true,
              detail: "Followed across the visit, so an abandoned basket can be chased the usual way.",
            },
            {
              approach: "Consent-first capture",
              reachable: true,
              detail: "Reachable as well, on the separate permission they gave for email.",
            },
          ],
        },
        {
          id: "declines",
          label: "A shopper who declines the cookie banner",
          outcomes: [
            {
              approach: "Tools that depend on cookies",
              reachable: false,
              detail: "Nothing to hang a recovery on. The shopper is invisible and the basket is simply lost.",
            },
            {
              approach: "Consent-first capture",
              reachable: true,
              detail: "Still reachable, because the email permission was asked for on its own and never needed the cookie.",
            },
          ],
        },
      ],
      hero: [
        {
          label: "Every frame decoded before you scroll",
          detail: "All ninety-six are decoded up front and off the main thread, so dragging through the sequence never waits on an image. Decoding them as they are needed is exactly what makes this kind of animation stutter.",
        },
        {
          label: "Refitted per device, not merely scaled",
          detail: "The sequence was shot landscape. Filling a phone screen with it would push the breaking pieces out of frame, so on small screens it is refitted and rescaled instead, and the bands this leaves at the edges are feathered into the background with a gradient so the join cannot be seen.",
        },
        {
          label: "A still image for anyone who asked for one",
          detail: "Where reduced motion is preferred the sequence does not play at all and a single frame stands in its place.",
        },
        {
          label: "Keyboard focus cannot outrun the animation",
          detail: "Buttons that have not arrived on screen yet are held out of the tab order until they do. Without that, a keyboard user reaches a control they cannot see, which is the failure this kind of hero usually ships with.",
        },
      ],
      heroNote:
        "The title screen you scrolled through to get here is a descendant of that hero: same ninety-six frames, same scroll-scrub idea, and the comment in this site's own code says so.",
      delivery: [
        {
          label: "A working funnel with nothing behind it",
          detail: "Submissions post as JSON to a form endpoint that is configuration rather than code, so changing provider is a setting and not a rewrite.",
        },
        {
          label: "And a fallback for having no provider at all",
          detail: "With nothing configured it falls back to a pre-filled email link, so the form does something useful on day one at no cost.",
        },
        {
          label: "The rules live outside the component",
          detail: "Required fields, email format and shop-address tidying are plain functions with their own tests, malformed addresses and bare domains included, so the validation can be trusted without rendering anything.",
        },
        {
          label: "The build refuses to ship broken types",
          detail: "A production build runs the type checker first and fails on it, and every push deploys through the same pipeline.",
        },
      ],
    },
    links: [{ label: "kukis.nl", href: "https://kukis.nl" }],
  },
  {
    id: "haarlem-festival",
    name: "Haarlem Festival",
    tier: "card",
    status: ["academic"],
    whatItIs:
      "A full-stack festival platform I led, with a 50+ endpoint REST API on Azure SQL.",
    stack: ["PHP", "JavaScript", "MVC", "Azure SQL", "Docker", "Figma"],
    metrics: [{ value: "50+", label: "API endpoints" }],
  },
  {
    id: "study-planner",
    name: "Study Planner",
    tier: "card",
    status: ["academic"],
    whatItIs:
      "A study planner I led for scheduling, progress tracking, and deadlines, with AJAX-powered real-time updates.",
    stack: ["PHP", "JavaScript", "AJAX", "MVC", "SQL"],
    metrics: [
      { value: "30+", label: "API endpoints" },
      { value: "~50%", label: "faster DB ops" },
    ],
  },
  {
    id: "chapeau",
    name: "Chapeau Ordering System",
    tier: "card",
    status: ["academic"],
    whatItIs:
      "A full-stack restaurant ordering system with real-time order tracking and automated kitchen management.",
    stack: ["C#", "Azure SQL"],
  },
  {
    id: "cello",
    name: "Cello Restaurant App",
    tier: "card",
    status: ["personal"],
    whatItIs:
      "A cross-platform mobile ordering app with a loyalty and referral system, built freelance at around 15.",
    stack: ["JavaScript", "iOS", "Android"],
    metrics: [
      { value: "~35%", label: "retention increase" },
      { value: "~20%", label: "more new customers" },
    ],
  },
];

export const deepProjects = projects.filter((p) => p.tier === "deep");
export const cardProjects = projects.filter((p) => p.tier === "card");

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}
