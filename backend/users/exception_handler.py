"""
Custom DRF exception handler for PrepSync.

In production, surfaces safe error messages without leaking stack traces.
In development, DRF's default full exception detail is preserved.
"""
import logging
from django.conf import settings
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default exception handler to:
    1. Log all 5xx errors server-side
    2. Return generic message for unhandled server errors in production
    3. Preserve full detail in development
    """
    # Let DRF handle 4xx errors (validation, auth, permissions) normally
    response = drf_exception_handler(exc, context)

    if response is not None:
        # 4xx handled — just return as-is
        return response

    # response is None → unhandled exception (500)
    logger.error(
        'Unhandled exception in %s %s: %s',
        context['request'].method,
        context['request'].path,
        exc,
        exc_info=True,
    )

    if settings.DEBUG:
        # In dev, let Django render the full traceback page
        raise exc

    # In production, return a safe generic response
    return Response(
        {'detail': 'An internal server error occurred. Our team has been notified.'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
