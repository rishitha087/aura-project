# pyrefly: ignore [missing-import]
from rest_framework.permissions import BasePermission

class IsStudent(BasePermission):
    """
    Allows access only to users with the 'student' role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'student'
        )

class IsHR(BasePermission):
    """
    Allows access only to users with the 'hr' role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'hr'
        )

class IsAdminUserRole(BasePermission):
    """
    Allows access only to users with the 'admin' role or superusers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'admin' or request.user.is_staff or request.user.is_superuser)
        )
