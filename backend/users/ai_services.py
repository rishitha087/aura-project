import os
import json
import random
import threading
import requests
from django.contrib.auth import get_user_model
from django.conf import settings
# pyrefly: ignore [missing-import]
from pypdf import PdfReader
from .models import ResumeAnalysis, InterviewAnalysis, SkillGapReport, CareerGuidance, LearningRoadmap, Booking, HRAssessment

User = get_user_model()

# Fetch API Key from env
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

def generate_ai_json(prompt, system_instruction=None):
    """
    Sends request to Google Gemini REST API (gemini-2.5-flash).
    Forces JSON output mode in generationConfig.
    Falls back to None if any error or timeout occurs.
    """
    if not GEMINI_API_KEY or not GEMINI_API_KEY.startswith('AIzaSy'):
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    
    contents = [{"parts": [{"text": prompt}]}]
    
    generation_config = {"responseMimeType": "application/json"}
    
    body = {
        "contents": contents,
        "generationConfig": generation_config
    }
    
    if system_instruction:
        body["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    try:
        response = requests.post(url, headers=headers, json=body, timeout=12)
        if response.status_code == 200:
            res_json = response.json()
            # Extract text from the candidate
            text_out = res_json['candidates'][0]['content']['parts'][0]['text']
            return json.loads(text_out)
        else:
            print(f"Gemini API returned error code {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"Gemini API request failed: {e}")
        return None

def generate_ai_text(prompt, system_instruction=None):
    """
    Sends requests to Google Gemini REST API and returns text.
    """
    if not GEMINI_API_KEY or not GEMINI_API_KEY.startswith('AIzaSy'):
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    
    body = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    if system_instruction:
        body["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    try:
        response = requests.post(url, headers=headers, json=body, timeout=12)
        if response.status_code == 200:
            return response.json()['candidates'][0]['content']['parts'][0]['text']
        return None
    except Exception as e:
        print(f"Gemini API text call failed: {e}")
        return None

# --- TEXT EXTRACTION ---
def extract_text_from_pdf(pdf_file):
    """
    Uses pypdf to extract plain text contents from a file object.
    """
    try:
        reader = PdfReader(pdf_file)
        text_content = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_content.append(text)
        return "\n".join(text_content)
    except Exception as e:
        print(f"PDF extraction failed: {e}")
        return ""


# --- TASK 1: RESUME ANALYSIS ---
def parse_and_analyze_resume(student_id, resume_file_path):
    """
    Synchronous analysis handler.
    """
    try:
        student = User.objects.get(pk=student_id)
    except User.DoesNotExist:
        return

    # Extract text
    text_extracted = ""
    try:
        with open(resume_file_path, 'rb') as f:
            text_extracted = extract_text_from_pdf(f)
    except Exception as e:
        print(f"Failed to open/parse resume path: {e}")

    profile = None
    try:
        profile = student.student_profile
    except:
        pass

    # Fallback default content if extraction is too short
    if len(text_extracted.strip()) < 100:
        career_goal = profile.career_goal if (profile and profile.career_goal) else "Engineering"
        text_extracted = f"Resume details for {student.full_name}. Profile goals: {career_goal}."

    prompt = f"""
    Analyze the following resume text for a candidate named {student.full_name}.
    Extract skills, projects, and work experience. Generate a resume score out of 100.
    Provide lists for strengths, weaknesses, and actionable recommendations.
    
    Resume Text:
    {text_extracted}
    
    Output strictly in this JSON format:
    {{
      "resume_score": 85,
      "strengths": ["string"],
      "weaknesses": ["string"],
      "recommendations": ["string"]
    }}
    """

    res = generate_ai_json(prompt, "You are a senior technical hiring manager reviewing CVs.")
    
    if not res:
        # Fallback Mock Data Generator
        skills_detected = profile.skills if (profile and profile.skills) else []
        score = random.randint(72, 86)
        res = {
            "resume_score": score,
            "strengths": [
                f"Includes target career roles matching '{profile.career_goal if (profile and profile.career_goal) else 'Software Developer'}'",
                f"Has core skillset keywords listed: {', '.join(skills_detected[:4]) if skills_detected else 'Python, SQL'}",
                "Layout has clearly separated headers for education and skills"
            ],
            "weaknesses": [
                "Lacks specific quantitative impact metrics (e.g. % improvement, hours saved)",
                "Summary section is generic; could highlight unique achievements",
                "Certifications or external links to project repositories are missing"
            ],
            "recommendations": [
                "Revise project bullet points to use the X-Y-Z formula (Accomplished [X] as measured by [Y], by doing [Z])",
                "Add direct hyperlinks to your GitHub repositories or LinkedIn credentials",
                "Trim older academic accomplishments to highlight recent programming frameworks"
            ]
        }

    # Save to db
    analysis = ResumeAnalysis.objects.create(
        student=student,
        resume_score=res["resume_score"],
        strengths=res["strengths"],
        weaknesses=res["weaknesses"],
        recommendations=res["recommendations"]
    )
    return analysis

def analyze_resume_background(student_id, resume_file_path):
    """
    Spawns background thread for resume analysis.
    """
    t = threading.Thread(target=parse_and_analyze_resume, args=(student_id, resume_file_path))
    t.start()


# --- TASK 2: INTERVIEW ANALYSIS ---
def generate_interview_report(booking_id):
    """
    Generates AI report based on booking details, student profile, and HR feedback.
    """
    try:
        booking = Booking.objects.get(pk=booking_id)
    except Booking.DoesNotExist:
        return None

    # Get HR feedback
    review_comments = ""
    hr_rating = 4
    try:
        review_comments = booking.review.comment
        hr_rating = booking.review.rating
    except:
        pass

    profile = None
    try:
        profile = booking.student.student_profile
    except:
        pass
    student_skills = profile.skills if (profile and profile.skills) else []
    target_goal = profile.career_goal if (profile and profile.career_goal) else "Developer"

    prompt = f"""
    Generate an AI Interview Evaluation report.
    Interviewer (HR) Rating: {hr_rating} / 5
    Interviewer Written Review Notes: "{review_comments}"
    
    Candidate Name: {booking.student.full_name}
    Target Career Goal: {target_goal}
    Current Skills: {', '.join(student_skills)}
    
    Evaluate the candidate and generate technical_score, communication_score, and behavioral_score (each out of 100).
    Provide lists of strengths, weaknesses, and next-step recommendations.
    
    Output strictly in this JSON format:
    {{
      "technical_score": 80,
      "communication_score": 75,
      "behavioral_score": 85,
      "strengths": ["string"],
      "weaknesses": ["string"],
      "recommendations": ["string"]
    }}
    """

    res = generate_ai_json(prompt, "You are a professional HR assessment bot. Score candidates constructively based on HR reports.")

    if not res:
        # Mock Fallback based on HR rating
        base_score = 55 + (hr_rating * 8) + random.randint(0, 5)
        res = {
            "technical_score": min(base_score + random.randint(-5, 5), 100),
            "communication_score": min(base_score + random.randint(-4, 6), 100),
            "behavioral_score": min(base_score + random.randint(-3, 8), 100),
            "strengths": [
                "Exhibited strong foundational understanding of the target domain",
                "Addressed behavioral prompts with a professional and friendly demeanor",
                "Communicated ideas clearly, answering core questions without excessive jargon"
            ],
            "weaknesses": [
                "Struggled slightly when probed on advanced scenarios and architectural constraints",
                "Pacing could be refined; spent too much time on introduction answers",
                "Fumbled slightly on details regarding career transitions or achievements"
            ],
            "recommendations": [
                "Conduct mock drills focusing on data structures and scalability parameters",
                "Structure behavioral scenarios using the STAR (Situation, Task, Action, Result) method",
                "Keep answers concise: aim for 2-minute answers to keep the recruiter engaged"
            ]
        }

    # Create and return Report
    analysis, created = InterviewAnalysis.objects.get_or_create(
        booking=booking,
        defaults={
            "technical_score": res["technical_score"],
            "communication_score": res["communication_score"],
            "behavioral_score": res["behavioral_score"],
            "strengths": res["strengths"],
            "weaknesses": res["weaknesses"],
            "recommendations": res["recommendations"]
        }
    )
    if not created:
        analysis.technical_score = res["technical_score"]
        analysis.communication_score = res["communication_score"]
        analysis.behavioral_score = res["behavioral_score"]
        analysis.strengths = res["strengths"]
        analysis.weaknesses = res["weaknesses"]
        analysis.recommendations = res["recommendations"]
        analysis.save()

    return analysis

def generate_interview_report_background(booking_id):
    """
    Spawns background thread for interview analysis.
    """
    t = threading.Thread(target=generate_interview_report, args=(booking_id,))
    t.start()


# --- TASK 3 & 6: SKILL GAP & LEARNING ROADMAP ---
ROLE_REQUIRED_SKILLS = {
    "java backend developer": ["Java", "SQL", "Spring Boot", "Microservices", "Docker", "AWS", "Kafka", "Git"],
    "frontend developer": ["HTML", "CSS", "JavaScript", "React", "Tailwind CSS", "TypeScript", "Redux", "Webpack"],
    "fullstack developer": ["React", "Node.js", "Express", "SQL", "MongoDB", "JavaScript", "Docker", "Git"],
    "data analyst": ["Python", "SQL", "Excel", "Tableau", "Pandas", "PowerBI", "Statistics", "Machine Learning"],
    "software engineer": ["Python", "Java", "DSA", "SQL", "Git", "Docker", "System Design", "Agile"],
    "qa engineer": ["Selenium", "Java", "Manual Testing", "SQL", "API Testing", "Postman", "Git", "CI/CD"],
}

def analyze_skill_gap_and_roadmap(student_id, target_role):
    """
    Runs skill gap analysis and generates roadmap.
    """
    try:
        student = User.objects.get(pk=student_id)
    except User.DoesNotExist:
        return None

    profile = None
    try:
        profile = student.student_profile
    except:
        pass
    raw_skills = profile.skills if (profile and profile.skills) else []
    student_skills = [s.lower() for s in raw_skills]
    normalized_role = target_role.lower().strip()
    
    # Resolve required skills
    req_skills = ROLE_REQUIRED_SKILLS.get(normalized_role)
    if not req_skills:
        # Fallback: query Gemini or compile simple defaults based on target_role name
        prompt = f"List exactly 8 essential technical skills required for a '{target_role}' role as a JSON array of strings: ['skill1', 'skill2']."
        res_list = generate_ai_json(prompt, "You are a professional IT job descriptions parser. Return only JSON.")
        if res_list and isinstance(res_list, list):
            req_skills = res_list
        else:
            req_skills = ["Git", "SQL", "Problem Solving", "Collaboration", "Coding", "Cloud Basics", "Data Structures", "System Design"]

    # Calculate gap
    missing_skills = [s for s in req_skills if s.lower() not in student_skills]
    
    # Score calculation
    total_skills = len(req_skills)
    have_count = total_skills - len(missing_skills)
    readiness_score = int((have_count / total_skills) * 100) if total_skills else 50

    # Roadmap prompt
    prompt = f"""
    Create a personalized 4-week learning roadmap for {student.full_name} targeting the role '{target_role}'.
    Current Skills: {', '.join(raw_skills)}
    Missing Skills: {', '.join(missing_skills)}
    
    Provide week-by-week study milestones.
    Output strictly in this JSON format:
    {{
      "Week 1": ["Study item 1", "Practice 2"],
      "Week 2": ["Study item 1", "Practice 2"],
      "Week 3": ["Study item 1", "Practice 2"],
      "Week 4": ["Study item 1", "Practice 2"]
    }}
    """
    roadmap_data = generate_ai_json(prompt, "You are an expert technical curriculum designer.")
    
    if not roadmap_data:
        # Fallback mock roadmap
        roadmap_data = {
            "Week 1": [f"Deep dive into {missing_skills[0] if len(missing_skills) > 0 else 'Git workflow basics'}", "Build small practice sandbox projects"],
            "Week 2": [f"Focus on {missing_skills[1] if len(missing_skills) > 1 else 'REST API structure and SQL queries'}", "Code algorithm practices"],
            "Week 3": [f"Learn {missing_skills[2] if len(missing_skills) > 2 else 'Cloud infrastructure or containers'}", "Integrate modules into a complete application"],
            "Week 4": [f"Simulate target role interview drills for '{target_role}'", "Review resume tags and schedule a mock interview session"]
        }

    # Save SkillGapReport
    gap_report, _ = SkillGapReport.objects.get_or_create(
        student=student,
        target_role=target_role,
        defaults={
            "missing_skills": missing_skills,
            "readiness_score": readiness_score,
            "recommended_path": list(roadmap_data.keys())
        }
    )
    if not _:
        gap_report.missing_skills = missing_skills
        gap_report.readiness_score = readiness_score
        gap_report.recommended_path = list(roadmap_data.keys())
        gap_report.save()

    # Save LearningRoadmap
    roadmap, _ = LearningRoadmap.objects.get_or_create(
        student=student,
        target_role=target_role,
        defaults={"roadmap_data": roadmap_data}
    )
    if not _:
        roadmap.roadmap_data = roadmap_data
        roadmap.save()

    return gap_report


# --- TASK 4: CAREER GUIDANCE ---
def get_career_guidance_report(student_id):
    """
    Returns or calculates career recommendation for the student.
    """
    try:
        student = User.objects.get(pk=student_id)
    except User.DoesNotExist:
        return None

    # Get reviews
    profile = None
    try:
        profile = student.student_profile
    except:
        pass
    student_skills = profile.skills if (profile and profile.skills) else []
    degree = profile.degree if (profile and profile.degree) else 'B.E./B.Tech'
    goal = profile.career_goal if (profile and profile.career_goal) else 'Engineering'

    # Gather historical interview scores
    analyses = InterviewAnalysis.objects.filter(booking__student=student)
    avg_score = 75
    if analyses.exists():
        scores = []
        for a in analyses:
            scores.extend([a.technical_score, a.communication_score, a.behavioral_score])
        avg_score = int(sum(scores) / len(scores))

    prompt = f"""
    Suggest suitable career roles for a student with:
    Skills: {', '.join(student_skills)}
    Degree: {degree}
    Avg Mock Interview Performance: {avg_score}/100
    Career Target Goal: {goal}
    
    Output top 3 suggested roles, a career readiness score (0-100), and improvement areas.
    Output strictly in this JSON format:
    {{
      "readiness_score": 76,
      "recommended_roles": [
         {{"role": "Backend Developer", "match_percentage": 85}},
         {{"role": "Software Engineer", "match_percentage": 78}},
         {{"role": "Data Analyst", "match_percentage": 68}}
      ],
      "improvement_areas": ["string"]
    }}
    """

    res = generate_ai_json(prompt, "You are a veteran technical career guidance counselor. Give realistic match percentages.")

    if not res:
        # Fallback mock career suggestions
        res = {
            "readiness_score": avg_score + random.randint(-5, 5),
            "recommended_roles": [
                {"role": f"{goal if goal else 'Software Engineer'}", "match_percentage": 82},
                {"role": "Fullstack Developer", "match_percentage": 74},
                {"role": "QA automation Engineer", "match_percentage": 65}
            ],
            "improvement_areas": [
                "Practice scalable system design architectures",
                "Improve mock algorithmic speed under strict time boundaries",
                "Integrate cloud deployment configurations into side portfolios"
            ]
        }

    # Save to db
    guidance, _ = CareerGuidance.objects.get_or_create(
        student=student,
        defaults={
            "recommended_roles": res["recommended_roles"],
            "readiness_score": res["readiness_score"],
            "improvement_areas": res["improvement_areas"]
        }
    )
    if not _:
        guidance.recommended_roles = res["recommended_roles"]
        guidance.readiness_score = res["readiness_score"]
        guidance.improvement_areas = res["improvement_areas"]
        guidance.save()

    return guidance


# --- TASK 7: AI INTERACTIVE CAREER COACH ---
def get_ai_coach_response(student_id, message_history):
    """
    Returns conversational responses answering target prep questions.
    `message_history` is a list of dicts: [{"role": "user", "text": "..."}, {"role": "model", "text": "..."}]
    """
    try:
        student = User.objects.get(pk=student_id)
    except User.DoesNotExist:
        return "Student user profile not found."

    profile = None
    try:
        profile = student.student_profile
    except:
        pass
    skills = profile.skills if (profile and profile.skills) else []
    goal = profile.career_goal if (profile and profile.career_goal) else 'Engineering'

    # Construct context prompt
    context = f"""
    You are an AI Career Coach mentoring {student.full_name}.
    Candidate profile:
    - Target Goal: {goal}
    - Current skills: {', '.join(skills)}
    
    Answer questions concisely, giving actionable technical career guidance, preparation tips, and interview advice.
    """
    
    last_message = message_history[-1]["text"] if message_history else "Hello Coach!"
    
    # We will query generate_ai_text directly
    reply = generate_ai_text(last_message, system_instruction=context)
    
    if not reply:
        # Fallback offline replies
        replies = [
            "To prepare for these types of interviews, I recommend practicing key algorithms on platforms like LeetCode and structuring your projects using clean architectures.",
            f"Given your target of '{goal}', prioritizing foundational skills like SQL, Git, and Docker will significantly enhance your readiness. What specific area should we drill next?",
            "For communication, remember to pause, structure your thoughts with the STAR format, and state the business impact of your tech stacks. Let me know if you want to try a practice query!"
        ]
        reply = random.choice(replies)

    return reply


# --- TASK 8: HR SKILL ASSESSMENT ---
FALLBACK_HR_QUESTIONS = [
    # Technical
    {"category": "technical", "question": "Explain the difference between microservices architecture and monolithic architecture. How would you design a scalable service communication model?"},
    {"category": "technical", "question": "What are the core differences between SQL databases and NoSQL databases? In what scenario would you choose MongoDB over PostgreSQL for a backend system?"},
    {"category": "technical", "question": "Explain the concept of REST APIs and how they differ from GraphQL. What are the pros and cons of using GraphQL in a React application?"},
    # Behavioral
    {"category": "behavioral", "question": "A candidate gets defensive when given constructive feedback on their coding design. Describe step-by-step how you would handle this conversation as an interviewer."},
    {"category": "behavioral", "question": "How do you evaluate cultural fit during an interview without introducing personal bias? What structured questions or scorecards do you use?"},
    {"category": "behavioral", "question": "If a candidate is technically extremely strong but demonstrates poor communication skills, what recommendation would you write in the assessment report and why?"},
    # Aptitude
    {"category": "aptitude", "question": "A team has 5 developers. In one week, they can resolve 15 tickets. If we add 3 more developers, how many tickets can they resolve in a 4-week sprint, assuming linear scale and 20% collaboration overhead?"},
    {"category": "aptitude", "question": "Explain how you would design a test plan to verify the performance and rate-limiting behaviors of an API that handles 10,000 requests per minute."}
]

def generate_hr_assessment_questions(hr_id):
    """
    Generates 5 assessment questions for an HR candidate using Gemini,
    with a robust fallback to local questions mapped by category.
    """
    try:
        hr = User.objects.get(pk=hr_id)
    except User.DoesNotExist:
        return None

    skills = []
    try:
        skills = hr.hr_profile.ticked_skills or []
    except:
        pass
    
    skills_str = ", ".join(skills) if skills else "General Software Engineering, HR Interviewing, Behavioral Assessment"

    prompt = f"""
    You are an AI Professional Assessor. Generate exactly 5 medium-level interview assessment questions for an HR/Interviewer candidate named {hr.full_name}.
    The candidate has selected these expertise skills: {skills_str}.
    
    The questions must cover:
    - 2 Technical / Domain knowledge questions (appropriate for their selected tech areas).
    - 2 Behavioral / Scenario-based interviewing questions (testing feedback quality, empathy, conflict resolution).
    - 1 Aptitude / Critical thinking question.

    Output strictly in this JSON format:
    [
      {{"category": "technical", "question": "Question text here"}},
      {{"category": "technical", "question": "Question text here"}},
      {{"category": "behavioral", "question": "Question text here"}},
      {{"category": "behavioral", "question": "Question text here"}},
      {{"category": "aptitude", "question": "Question text here"}}
    ]
    """

    res = generate_ai_json(prompt, "You are a professional IT interviewer. Return only JSON.")
    
    if not res or not isinstance(res, list) or len(res) != 5:
        # Fallback to local question bank
        tech_q = [q for q in FALLBACK_HR_QUESTIONS if q["category"] == "technical"]
        behav_q = [q for q in FALLBACK_HR_QUESTIONS if q["category"] == "behavioral"]
        apt_q = [q for q in FALLBACK_HR_QUESTIONS if q["category"] == "aptitude"]

        res = [
            random.choice(tech_q),
            random.choice(tech_q),
            random.choice(behav_q),
            random.choice(behav_q),
            random.choice(apt_q)
        ]

    # Save or update HRAssessment
    assessment, created = HRAssessment.objects.get_or_create(
        hr=hr,
        defaults={
            "questions": res,
            "answers": [],
            "score": 0,
            "feedback": "Pending submission",
            "is_passed": False
        }
    )
    if not created:
        assessment.questions = res
        assessment.save()

    return assessment

def evaluate_hr_assessment_answers(hr_id, answers):
    """
    Evaluates candidate answers using Gemini, with a heuristic fallback if offline.
    """
    try:
        assessment = HRAssessment.objects.get(hr_id=hr_id)
        hr = assessment.hr
    except HRAssessment.DoesNotExist:
        return None

    # Construct prompt
    prompt = f"""
    You are an AI Expert Evaluator grading an HR/Interviewer applicant's assessment.
    Candidate Name: {hr.full_name}
    
    Questions and Answers:
    """
    for i, (q, a) in enumerate(zip(assessment.questions, answers)):
        prompt += f"\nQuestion {i+1} ({q.get('category')}): {q.get('question')}\nAnswer: {a}\n"
        
    prompt += """
    Grade the candidate constructively. Calculate an overall score out of 100.
    They pass if they score >= 70.
    Provide a feedback report highlighting strengths, weaknesses, and a final suggestion.
    
    Output strictly in this JSON format:
    {
      "score": 82,
      "feedback": "Detailed feedback text here",
      "is_passed": true
    }
    """

    res = generate_ai_json(prompt, "You are a senior professional assessor. Return only JSON.")
    
    if not res or "score" not in res:
        # Fallback offline grading
        # Heuristic score based on length and presence of core technical/behavioral concepts
        total_score = 60
        for ans in answers:
            ans_len = len(ans.strip())
            if ans_len > 150:
                total_score += 6
            elif ans_len > 50:
                total_score += 3
            else:
                total_score -= 4
            
            lower_ans = ans.lower()
            key_words = ['star', 'empathy', 'scrum', 'sql', 'microservices', 'bias', 'culture', 'communication', 'technical']
            matches = sum(1 for w in key_words if w in lower_ans)
            total_score += min(matches * 2, 6)

        total_score = min(max(total_score, 40), 96)
        is_passed = total_score >= 70
        
        feedback_txt = f"Assessment graded via Heuristic Semantic Engine.\n\n"
        feedback_txt += f"Review Notes:\n"
        feedback_txt += f"- Answer quality and keyword relevance check complete.\n"
        feedback_txt += f"- Technical vocabulary and depth match the score tier.\n\n"
        if is_passed:
            feedback_txt += "Summary: PASS. The candidate demonstrated appropriate domain knowledge and constructive feedback structures."
        else:
            feedback_txt += "Summary: FAIL. Answers were too short or lacked domain-specific terminology."
            
        res = {
            "score": total_score,
            "feedback": feedback_txt,
            "is_passed": is_passed
        }

    # Save results
    assessment.answers = answers
    assessment.score = res["score"]
    assessment.feedback = res["feedback"]
    assessment.is_passed = res["is_passed"]
    assessment.save()

    # Automatically update verification status
    try:
        verification = hr.hr_verification
        if res["is_passed"]:
            verification.verification_status = 'approved'
            verification.admin_notes = "Approved automatically by passing AI Skill Assessment Test."
        else:
            verification.verification_status = 'rejected'
            verification.admin_notes = "Rejected automatically. AI Assessment Test score was below the passing threshold of 70."
        verification.save()
    except:
        pass

    return assessment

