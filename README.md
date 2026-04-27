# SwarmPay

Agent credit scoring for the x402 payment ecosystem.

## Structure

```
/swarmpay
  /api    FastAPI backend — agent scoring endpoints
  /web    Next.js 14 frontend — app router, TypeScript, Tailwind
```

## API

```bash
cd api
python -m venv .venv && source .venv/bin/activate
pip install -e .
uvicorn api.index:app --reload
```

Swagger UI: http://localhost:8000/docs

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/v0/score/{agent_address}` | Agent credit score |

## Web

```bash
cd web
npm install
npm run dev
```

App: http://localhost:3000
