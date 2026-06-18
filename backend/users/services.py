def calculate_student_completion_percentage(profile):
    """
    Calculates the student's profile completion percentage:
    - Academic Information (college_name AND degree AND branch AND graduation_year): 30%
    - Resume file uploaded: 30%
    - Skills (list has at least one skill): 20%
    - Career goal specified: 20%
    """
    score = 0

    # 1. Academic Info (30%)
    if (profile.college_name and profile.college_name.strip() and
        profile.degree and profile.degree.strip() and
        profile.branch and profile.branch.strip() and
        profile.graduation_year is not None):
        score += 30

    # 2. Resume (30%)
    if profile.resume:
        score += 30

    # 3. Skills (20%)
    if isinstance(profile.skills, list) and len(profile.skills) > 0:
        score += 20
    elif isinstance(profile.skills, str) and profile.skills.strip():
        # Fallback if list is stored as comma-separated string
        score += 20

    # 4. Career Goal (20%)
    if profile.career_goal and profile.career_goal.strip():
        score += 20

    profile.profile_completion = score
    profile.save(update_fields=['profile_completion'])
    return score
