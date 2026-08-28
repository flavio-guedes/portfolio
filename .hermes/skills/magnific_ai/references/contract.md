# Magnific Contract Reference

Fonte oficial: https://docs.magnific.com/llms.txt
Páginas: https://docs.magnific.com/api-reference/mystic/post-mystic.md
         https://docs.magnific.com/api-reference/mystic/get-mystic-task.md

## Base

- Base URL: https://api.magnific.com
- Auth header: x-magnific-api-key
- Content-Type: application/json

## Mystic

### Submit

POST /v1/ai/mystic

Request body schema:

- prompt?: string | null
- webhook_url?: string
- structure_reference?: base64 string
- structure_strength?: integer [0,100], default 50
- style_reference?: base64 string
- adherence?: integer [0,100], default 50
- hdr?: integer [0,100], default 50
- resolution?: enum ["1k","2k","4k"], default "2k"
- aspect_ratio?: enum [...], default "square_1_1"
- model?: enum ["realism","fluid","zen","flexible","super_real","editorial_portraits"], default "realism"
- creative_detailing?: integer [0,100], default 33
- engine?: enum ["automatic","magnific_illusio","magnific_sharpy","magnific_sparkle"], default "automatic"
- fixed_generation?: boolean, default false
- filter_nsfw?: boolean, default true
- styling.styles?: array[{name:string,strength:number}] max 1
- styling.characters?: array[{strength:number,id?:string}] max 1
- styling.colors?: array[{color:string pattern ^#[0-9A-F]{6}$, weight:number}] min 1 max 5

Response:

- 200: { data: { task_id: string, status: "CREATED"|"IN_PROGRESS"|"COMPLETED"|"FAILED", generated?: string[] } }

Status:

GET /v1/ai/mystic/{task-id}

Response:

- 200 same shape; when completed, `generated` array contains image URLs.

LoRA notes:

- LoRA-compatible only when default model is used without structure/style references.
- Incompatible combos are silently ignored by API.

## Upscaler Precision V2

### Submit

POST /v1/ai/image-upscaler-precision-v2

Request body schema:

- image?: base64 string or HTTPS URL
- scale_factor?: integer 2-16
- sharpen?: integer 0-100, default 7
- smart_grain?: integer 0-100, default 7
- ultra_detail?: integer 0-100, default 30
- flavor?: enum ["sublime","photo","photo_denoiser"]
- webhook_url?: string

Response same async shape.

## Async behavior

- Most AI endpoints return a task immediately.
- Use polling GET or webhook.
- Webhook headers: webhook-id, webhook-timestamp, webhook-signature.
- Signature string: webhook-id.webhook-timestamp.raw_body
- Verify with HMAC-SHA256 and shared webhook secret.

## Rate limits

- Free: 10 requests/day.
- Tier 1: 125 requests/day.
- Analytics: 100 requests/day for business/enterprise.

## Costs

- Mystic: credit-based; see pricing page for current rates.
- Upscaler: output pixel area based on input size and scale factor.
- Video Upscaler: per-frame pricing.

## Output persistence

- Mystic result URLs should be downloaded and persisted.
- 24h validity mentioned for some outputs; download immediately after completion.
