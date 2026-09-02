import time
import uuid
from typing import Dict, List
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.api.v1.routes import router as api_v1_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.ENABLE_DOCS else None,
    docs_url="/docs" if settings.ENABLE_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_DOCS else None
)

# ──────────────────────────────────────────────
# 1. Security Headers Middleware
# ──────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data: https:; "
            "connect-src 'self' http://localhost:5180 http://127.0.0.1:5180 http://localhost:5173 http://127.0.0.1:5173 http://0.0.0.0:8010 http://localhost:8010; "
            "frame-ancestors 'none';"
        )
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ──────────────────────────────────────────────
# 2. In-Memory Rate Limiter Middleware
# ──────────────────────────────────────────────
class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    In-memory rate limiter for expensive AI inference endpoints:
    - 60 requests per minute per IP for extraction, counterargument, deliberation, and key testing.
    """
    def __init__(self, app, max_requests: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[float]] = {}
        self.last_cleanup: float = time.time()
        self.rate_limited_prefixes = [
            f"{settings.API_V1_STR}/extract",
            f"{settings.API_V1_STR}/analyze/counterargument",
            f"{settings.API_V1_STR}/deliberate/chat",
            f"{settings.API_V1_STR}/models/test-key",
        ]

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if any(path.startswith(prefix) for prefix in self.rate_limited_prefixes):
            client_ip = request.client.host if request.client else "127.0.0.1"
            now = time.time()

            # Periodic cleanup of inactive IPs (every 5 minutes)
            if now - self.last_cleanup > 300.0:
                self.last_cleanup = now
                stale_ips = [
                    ip for ip, ts_list in self.requests.items()
                    if not ts_list or (now - ts_list[-1] >= self.window_seconds)
                ]
                for ip in stale_ips:
                    self.requests.pop(ip, None)

            timestamps = self.requests.get(client_ip, [])
            # Prune timestamps older than window
            timestamps = [ts for ts in timestamps if now - ts < self.window_seconds]

            if len(timestamps) >= self.max_requests:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": "Rate limit exceeded. Please wait a moment before sending more requests.",
                        "retry_after_seconds": int(self.window_seconds - (now - timestamps[0])) if timestamps else 30
                    }
                )

            timestamps.append(now)
            self.requests[client_ip] = timestamps

        return await call_next(request)

app.add_middleware(RateLimiterMiddleware)

# ──────────────────────────────────────────────
# 3. Strict CORS Setup (Restricted to specific origins)
# ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

# ──────────────────────────────────────────────
# 4. Global Sanitized Exception Handler
# ──────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=exc.headers
        )

    error_id = str(uuid.uuid4())
    print(f"[Unhandled Server Error {error_id}] Path: {request.url.path} | Error: {type(exc).__name__}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred.",
            "error_id": error_id
        }
    )

# ──────────────────────────────────────────────
# Mount Routes
# ──────────────────────────────────────────────
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Phronesis Backend API"
    }

