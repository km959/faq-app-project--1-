"""
Run this once to load all FAQs into the knowledge_base table.
Usage: python seed_knowledge_base.py
"""

from database import SessionLocal
import models

FAQS = [
    # ---- General ----
    ("General", "How is my personal data protected on Nextenti?",
     "Your data security is our top priority. We comply with government regulations when processing your Aadhaar data, using it only for lawful purposes. Your personal information remains confidential until you apply for a job. Organizations cannot view your profile or access your details unless you have applied for a job and given explicit consent."),

    ("General", "Is this app only for doctors or specific healthcare professionals?",
     "No, Nextenti is a comprehensive platform designed for all healthcare professionals - doctors, nurses, pharmacists, lab technicians, and healthcare administration staff. The app provides career opportunities and resources tailored to your field."),

    ("General", "How do I update my profile picture?",
     "Log in to your account. Personal account: go to Personal Details > Edit Profile. Organization account: go to Organization Profile > Edit Profile. Click Change Photo, upload your new image, and save."),

    ("General", "Who can benefit from using this app?",
     "Nextenti benefits current healthcare professionals and those entering the field, with flexible job opportunities, career support, coverage of up to 19 professions (doctors, nurses, pharmacists, healthcare IT, and more), and access to 14 healthcare-related sectors (hospitals, pharma companies, diagnostic labs, and more). Organizations can post jobs, find candidates, and streamline hiring."),

    ("General", "Can I manage both Organization and Personal accounts within the app?",
     "Yes. Each account must have a different mobile number and email address, with its own login credentials. You can log in between accounts as needed - to find talent (Organization account) or search/apply for jobs (Personal account)."),

    ("General", "How do I contact Nextenti support for assistance?",
     "On Mobile: tap the Profile menu > Support > Nextenti Support, then submit your query or use Live Chat. On Web: scroll to the bottom and click Nextenti Help Support, then submit your query or use Live Chat."),

    ("General", "How can I reset or change my password?",
     "If forgotten: go to the Login page, click 'Forgot Password', and follow the reset instructions. If you know your current password: log in, go to Settings > Change Password, and follow the prompts."),

    ("General", "My account was deleted. How can I restore it?",
     "Contact Nextenti Support through the application, explain your situation, and the support team will help restore your account."),

    ("General", "I'm stuck while using the application. What should I do?",
     "Open the Nextenti Support option in the application, explain the issue or step where you're stuck, and follow the guidance provided by the support team."),

    # ---- Personal ----
    ("Personal", "Can I change my profession after signing up?",
     "Yes. Go to Edit Profile > Personal Details, select your previously chosen profession and update it to your new one, then save the changes."),

    ("Personal", "How can I view a particular upcoming job?",
     "Log in, go to My Jobs section, select the Upcoming Job tab to view all upcoming jobs, and open a specific job to see its details."),

    ("Personal", "Can I negotiate the salary after receiving the offer?",
     "Yes. After receiving an offer you can submit a 'Raise Request' to request a higher salary or changes to your compensation package, or contact the organization directly using the contact details provided in the offer letter."),

    ("Personal", "How can I contact the organization after seeing a job that I'm interested in?",
     "Apply for the job. The organization is notified of your application. If shortlisted, they'll send you an offer, and once received you can view the organization's contact details and additional info."),

    ("Personal", "Can I apply to jobs in any location?",
     "Yes, you can apply to jobs anywhere in India. Nextenti provides a location filter to search jobs in your preferred city or region and apply to convenient opportunities."),

    ("Personal", "Can I post job opportunities as a candidate?",
     "Yes. Log in to your candidate account, verify your Aadhaar via OTP, then locate the 'Post Job Information' button on your homepage, enter job details, and submit."),

    ("Personal", "Can organizations view my profile?",
     "Organizations can only view your profile after you apply for a job. Until then, your information remains private and is not shared with any employers."),

    ("Personal", "Can I use my PAN card for verification?",
     "No. Only an Aadhaar card can be used for verification as per Nextenti's regulations and security policies. PAN cards are not accepted."),

    ("Personal", "Can I change from Short-term to Long-term after job accepted?",
     "Once a job offer is accepted, changes like switching from short-term to long-term must be discussed directly with the organization."),

    ("Personal", "What happens if I miss the check-in and check-out time?",
     "Notify your supervisor or HR department about the situation, follow their guidance on missed-time policies, and take any recommended steps to resolve it."),

    ("Personal", "What if my profession isn't listed in the dropdown options?",
     "Select 'Other' and manually enter your specific profession. Nextenti is continuously expanding its supported professions list."),

    ("Personal", "Can I track my job application status?",
     "Go to Manage Jobs > Applied Jobs to check the status of each application, such as Interview Scheduled or Offered."),

    ("Personal", "Where can I view my job offers?",
     "Go to Applied and select the 'Offered Jobs' section on your homepage to browse the details of all offers you've received."),

    ("Personal", "Can I save jobs to view later?",
     "In Search Jobs, click the Save icon next to any listing. Access saved jobs later in Saved Jobs, located next to Recommended Jobs in the Explore Jobs section."),

    ("Personal", "How do I get started with finding a job?",
     "Download the app or visit the website, sign up with your basic information, navigate to 'Search Jobs', use keywords like job title/organization/location to refine your search, and apply to matching opportunities."),

    ("Personal", "How can I update my preferred work locations?",
     "Go to Manage Preferences > Location Preferences and add or remove cities, states, or areas where you want to work."),

    ("Personal", "Can I get notifications for interview schedules?",
     "Yes. When an organization schedules an interview, you'll receive in-app notifications and emails/SMS if enabled."),

    ("Personal", "How can I receive personalized job recommendations?",
     "Go to Home Page > Manage Preferences, fill in organization type/state/city/area of work, and Nextenti's AI will match you with suitable jobs shown in 'Recommended Jobs'."),

    ("Personal", "Can I delete my account?",
     "Go to Settings > Delete Account, enter your password, click Delete Account, and confirm. Your data will be removed per Nextenti's privacy policy."),

    ("Personal", "How can I find job opportunities?",
     "From the Login Page: use the Job Search option with location/organization/title filters. From your Homepage: click 'Search Jobs' and use filters to browse results."),

    ("Personal", "Can I apply to multiple jobs?",
     "Yes, you can apply to multiple jobs at the same time, increasing your chances of getting shortlisted."),

    ("Personal", "What is the availability function, and how does it work?",
     "The Availability function lets you set preferred workdays and hours in your Personal account. Nextenti's AI-driven system matches you with jobs that fit your schedule for better work-life balance."),

    ("Personal", "How can I create availability only for Consultations and Procedures?",
     "Log in to your Personal account, click 'Add Availability', under Job Type select 'Procedure' and 'Consultation', enter your available dates/timings, and save."),

    ("Personal", "Who can see my Availability?",
     "Your availability is private and only visible/manageable by you in the Availability section. Organizations only see your details when you apply for a job, not your full calendar."),

    ("Personal", "How does the job matching algorithm work?",
     "Nextenti analyzes your Profession, Preferences, and Availability and compares them with job postings to recommend the best-suited jobs, viewable in 'Recommended Jobs'."),

    ("Personal", "How can I filter jobs by organization type?",
     "Open Search Jobs and use the search bar to select or type the Organization Type, such as Hospital, Clinic, Pharma, Lab, etc."),

    ("Personal", "How can I optimize my job search experience?",
     "Go to your Candidate Account > Manage Preferences, enter organization type/location preferences, then open Availability and specify when you're available to work."),

    ("Personal", "What should I do if I receive a job offer I'm not interested in?",
     "Go to the Applied section > Offered Jobs, locate the offer, and click Decline to reject it."),

    ("Personal", "Can I update my registered mobile number?",
     "Log in, go to Edit Profile > Personal Details, click Edit next to Mobile Number, enter your password for verification, provide the new number, verify with OTP, and click Save."),

    # ---- Organization ----
    ("Organization", "Can I hire immediately?",
     "Yes. You can post vacancies in real time, candidates get instant notifications, AI-powered matching connects you to relevant candidates, and you can communicate directly through in-app chat."),

    ("Organization", "How can I post a job on Nextenti?",
     "Sign up or log in with your organization's details, go to 'Create Job', fill in job title/profession/type/duration/description/required skills, and click 'Post Job'."),

    ("Organization", "Where can I view my Posted Jobs?",
     "Log in to your Organization account, go to the Home screen, and click Posted Jobs."),

    ("Organization", "Where can I view my drafted jobs?",
     "Log in to your Organization account, go to the Home screen, and click Drafted Jobs."),

    ("Organization", "Where can I view my closed jobs?",
     "Log in to your Organization account, go to the Home screen, and click Closed Jobs."),

    ("Organization", "Where can I view my cancelled jobs?",
     "Log in to your Organization account, go to the Home screen, and click Cancelled Jobs."),

    ("Organization", "How can I close a job?",
     "Go to Posted Jobs or Drafted Jobs, find the job, click the three-dot menu on the job card, and select Close Job. It moves to Closed Jobs."),

    ("Organization", "How can I cancel a job?",
     "Go to Posted Jobs or Drafted Jobs, find the job, click the three-dot menu, and select Cancel Job. It moves to Cancelled Jobs."),

    ("Organization", "What is the use of the Timesheet section?",
     "The Timesheet section tracks employee attendance and work progress, recording daily check-ins and check-outs to monitor working hours."),

    ("Organization", "Where can I view the timesheet history of employees?",
     "Log in to your Organization account and navigate to the Timesheet Logs section to see the complete history."),

    ("Organization", "Where can I see my Action Required and Updates?",
     "Log in to your Organization account and go to the Dashboard section to see Action Required items and Updates."),

    ("Organization", "Where can I view chat requests?",
     "View via the Requests section in the header, or go to Manage Jobs > Requests for chat requests related to specific jobs."),

    ("Organization", "How can I change my password?",
     "On the login page, click Forgot Password, follow the prompts with your registered email/mobile, then create a new password."),

    ("Organization", "How can I delete my account?",
     "Log in, click the Profile menu, select Delete Account, and follow the prompts to confirm."),

    ("Organization", "Where can I edit my organization details?",
     "Log in, navigate to the Profile section in the side menu, and you'll be directed to Organization Details."),

    ("Organization", "Where can I edit my billing details?",
     "Log in, go to Profile in the side menu, then click Next through Organization Details > Organization Profile > Authorized Person Details to reach the Billing Details page."),

    ("Organization", "Where can I edit my authorized person details?",
     "Log in, go to Profile in the side menu, then click Next through Organization Details > Organization Profile to reach the Authorized Person Details page."),

    ("Organization", "How can I manage users in my organization account?",
     "Go to User Management in the side menu, click Add User, provide name/email/role and permissions, then click Submit. The invited user receives login credentials."),

    ("Organization", "How can I take a subscription?",
     "Go to the Profile menu, select Manage Subscription, choose a plan based on your needs, and proceed with payment to activate it."),
]


def run():
    db = SessionLocal()
    try:
        existing = db.query(models.KnowledgeBaseFAQ).count()
        if existing > 0:
            print(f"knowledge_base already has {existing} rows. Skipping seed.")
            return

        for category, question, answer in FAQS:
            db.add(models.KnowledgeBaseFAQ(category=category, question=question, answer=answer))

        db.commit()
        print(f"Seeded {len(FAQS)} FAQs into knowledge_base.")
    finally:
        db.close()


if __name__ == "__main__":
    run()