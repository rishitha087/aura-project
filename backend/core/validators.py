import os
import mimetypes
from django.core.exceptions import ValidationError

def validate_file(file, max_size_mb, allowed_extensions, allowed_mimetypes):
    """
    Validates a file's size, extension, and mime-type.
    """
    # 1. Validate File Size
    if file.size > max_size_mb * 1024 * 1024:
        raise ValidationError(f"File size exceeds maximum limit of {max_size_mb}MB.")

    # 2. Validate Extension
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in allowed_extensions:
        raise ValidationError(f"Unsupported file extension {ext}. Allowed extensions: {', '.join(allowed_extensions)}")

    # 3. Validate Mime-type
    mime_type, _ = mimetypes.guess_type(file.name)
    if not mime_type:
        # Fallback to file content type
        mime_type = getattr(file, 'content_type', None)

    if mime_type not in allowed_mimetypes:
        raise ValidationError(f"Invalid file type. Allowed formats: {', '.join(allowed_extensions)}")

def validate_student_resume(file):
    validate_file(
        file,
        max_size_mb=5,
        allowed_extensions=['.pdf', '.docx'],
        allowed_mimetypes=[
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ]
    )

def validate_hr_resume(file):
    validate_file(
        file,
        max_size_mb=5,
        allowed_extensions=['.pdf', '.docx'],
        allowed_mimetypes=[
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ]
    )

def validate_hr_id_card(file):
    validate_file(
        file,
        max_size_mb=5,
        allowed_extensions=['.pdf', '.png', '.jpg', '.jpeg'],
        allowed_mimetypes=[
            'application/pdf',
            'image/png',
            'image/jpeg'
        ]
    )

def validate_hr_experience_letter(file):
    validate_file(
        file,
        max_size_mb=5,
        allowed_extensions=['.pdf', '.png', '.jpg', '.jpeg'],
        allowed_mimetypes=[
            'application/pdf',
            'image/png',
            'image/jpeg'
        ]
    )

def validate_hr_profile_photo(file):
    validate_file(
        file,
        max_size_mb=2,
        allowed_extensions=['.png', '.jpg', '.jpeg'],
        allowed_mimetypes=[
            'image/png',
            'image/jpeg'
        ]
    )
