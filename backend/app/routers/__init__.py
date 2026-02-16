from fastapi import APIRouter

from app.routers import (
    auth,
    companies,
    segments,
    users,
    contacts,
    uploads,
    assignments,
    marketing,
    audit,
    notifications,
    exports
)

# Create main API router
api_router = APIRouter()

# Include authentication and user management routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(segments.router, tags=["Segments"])
api_router.include_router(companies.router, prefix="/companies", tags=["Companies"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["Contacts"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["Uploads"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["Assignments"])
api_router.include_router(marketing.router, prefix="/marketing", tags=["Marketing"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(exports.router, prefix="/exports", tags=["Exports"])


@api_router.get("/", tags=["API"])
async def api_root():
    """API v1 root endpoint."""
    return {
        "message": "Spanner CRM API v1",
        "status": "operational",
    }
