"""
Seed script: creates 15 approved dummy profiles with realistic Tamil village data.
Run from the backend directory:
    python seed.py
"""

import os
import sys

os.environ.setdefault("FIRST_ADMIN_EMAIL", "")
os.environ.setdefault("FIRST_ADMIN_PASSWORD", "")

from app.config import settings  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models.user import CurrentStatus, User  # noqa: E402

PROFILES = [
    # ── Job ──────────────────────────────────────────────────────────────────
    {
        "full_name": "Arjun Murugesan",
        "email": "arjun.murugesan@example.com",
        "village_area": "Keelattur North Street",
        "current_status": CurrentStatus.job,
        "current_status_detail": "Software Engineer at Infosys, Chennai",
        "education": "B.E. Computer Science, Anna University (2021)",
        "bio": "Grew up chasing mangoes in our backyard. Now I chase deadlines in Chennai. Proud son of Keelattur, always home for Pongal.",
        "phone": "+91 98400 11001",
        "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    },
    {
        "full_name": "Kavitha Selvaraj",
        "email": "kavitha.selvaraj@example.com",
        "village_area": "Keelattur South Street",
        "current_status": CurrentStatus.job,
        "current_status_detail": "Staff Nurse at Government Hospital, Villupuram",
        "education": "B.Sc. Nursing, Rajah Muthiah Medical College (2019)",
        "bio": "Serving our district for five years. Healthcare is not just a job — it is my way of giving back to the people who raised me.",
        "phone": "+91 94440 22002",
        "photo_url": "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop&crop=face",
    },
    {
        "full_name": "Dinesh Krishnamoorthy",
        "email": "dinesh.krish@example.com",
        "village_area": "Periya Kuppam",
        "current_status": CurrentStatus.job,
        "current_status_detail": "Civil Engineer at L&T Construction, Bangalore",
        "education": "B.E. Civil Engineering, Annamalai University (2020)",
        "bio": "Building bridges — literally. From our village panchayat roads to metro stations in Bangalore. Every structure I build carries a piece of home.",
        "phone": "+91 90000 33003",
        "photo_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    },
    {
        "full_name": "Priya Annamalai",
        "email": "priya.annamalai@example.com",
        "village_area": "Keelattur East Street",
        "current_status": CurrentStatus.job,
        "current_status_detail": "Secondary School Teacher, Govt. High School, Cuddalore",
        "education": "B.Ed., Bharathidasan University (2018)",
        "bio": "Teaching 8th and 9th standard students. I believe every child in our district deserves the same opportunities as city kids. Doing my part one classroom at a time.",
        "phone": "+91 91500 44004",
        "photo_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    },
    # ── Studying ─────────────────────────────────────────────────────────────
    {
        "full_name": "Surya Palaniswami",
        "email": "surya.palani@example.com",
        "village_area": "Keelattur West Street",
        "current_status": CurrentStatus.studying,
        "current_status_detail": "M.Tech. Artificial Intelligence, IIT Madras",
        "education": "B.E. Electronics, Thiagarajar College of Engineering (2023)",
        "bio": "First person from our village to get into IIT! Appa cried. Amma made 10 kg of sweet pongal for the neighbourhood. Working on computer vision research.",
        "phone": "+91 87540 55005",
        "photo_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face",
    },
    {
        "full_name": "Meena Sundaram",
        "email": "meena.sundaram@example.com",
        "village_area": "Siruvadi Colony",
        "current_status": CurrentStatus.studying,
        "current_status_detail": "MBBS 4th year, Madurai Medical College",
        "education": "Higher Secondary (Biology), Govt. School, Villupuram — 98.5%",
        "bio": "Future doctor from Siruvadi! Specialising in paediatrics. Dream is to open a free clinic in our village someday. Long road ahead but every step counts.",
        "phone": "+91 86380 66006",
        "photo_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
    },
    {
        "full_name": "Karthik Balasubramanian",
        "email": "karthik.bala@example.com",
        "village_area": "Keelattur North Street",
        "current_status": CurrentStatus.studying,
        "current_status_detail": "B.Com. (Hons), Loyola College, Chennai",
        "education": "Higher Secondary, Govt. Boys School, Keelattur — 92%",
        "bio": "Finance nerd by day, cricket fanatic by evening. Planning to clear CA exams by 2026. Represent your village wherever you go.",
        "phone": "+91 82200 77007",
        "photo_url": "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop&crop=face",
    },
    # ── Business ─────────────────────────────────────────────────────────────
    {
        "full_name": "Ravi Sundaresan",
        "email": "ravi.sundaresan@example.com",
        "village_area": "Keelattur Market Road",
        "current_status": CurrentStatus.business,
        "current_status_detail": "Owner, Sri Murugan Provisional Store & Organic Products",
        "education": "Diploma in Business Management, Pondicherry Polytechnic (2016)",
        "bio": "Started with a small kadai, now supply organic rice and groundnut oil across 12 villages. Employing 6 people from our panchayat. Business is service.",
        "phone": "+91 99400 88008",
        "photo_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    },
    {
        "full_name": "Lakshmi Venkataraman",
        "email": "lakshmi.venkat@example.com",
        "village_area": "Periya Kuppam",
        "current_status": CurrentStatus.business,
        "current_status_detail": "Founder, Lakshmi Tailoring & Embroidery Works",
        "education": "Diploma in Fashion Design, Govt. Polytechnic, Cuddalore (2017)",
        "bio": "Started tailoring during COVID lockdown with just a machine and a dream. Now have 4 employees and sell hand-embroidered sarees on Instagram. Village women empowering village women.",
        "phone": "+91 98760 99009",
        "photo_url": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face",
    },
    {
        "full_name": "Senthil Kumar Rajendran",
        "email": "senthil.raj@example.com",
        "village_area": "Keelattur South Street",
        "current_status": CurrentStatus.business,
        "current_status_detail": "Proprietor, SKR Auto Garage & Two-Wheeler Service",
        "education": "ITI Automobile Mechanic, Govt. ITI, Villupuram (2015)",
        "bio": "Fixing vehicles is in my blood — my father had a bicycle repair shop. Upgraded to bikes and cars. Customers come from 5 villages around. Honest work, honest price.",
        "phone": "+91 97890 10010",
        "photo_url": "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face",
    },
    # ── Farming ──────────────────────────────────────────────────────────────
    {
        "full_name": "Murugan Thangaraj",
        "email": "murugan.thangaraj@example.com",
        "village_area": "Keelattur Fields Area",
        "current_status": CurrentStatus.farming,
        "current_status_detail": "Organic Paddy & Sugarcane Farming, 8 acres",
        "education": "Higher Secondary, Keelattur Govt. School (2014)",
        "bio": "Fourth generation farmer. Switched fully to organic methods three years ago. Our paddy sells at premium in Chennai markets now. Proud to keep our land alive.",
        "phone": "+91 96780 11011",
        "photo_url": "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=400&h=400&fit=crop&crop=face",
    },
    {
        "full_name": "Valli Palanichamy",
        "email": "valli.palanichamy@example.com",
        "village_area": "Siruvadi Colony",
        "current_status": CurrentStatus.farming,
        "current_status_detail": "Floriculture & Jasmine Cultivation, 3 acres",
        "education": "B.Sc. Agriculture, Tamil Nadu Agricultural University (2020)",
        "bio": "Came back from university to modernise our family farm. Growing jasmine and marigold for temple supply. Using drip irrigation and soil testing. Agriculture is a science.",
        "phone": "+91 95670 12012",
        "photo_url": "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face",
    },
    # ── Other ─────────────────────────────────────────────────────────────────
    {
        "full_name": "Arun Pandiyan",
        "email": "arun.pandiyan@example.com",
        "village_area": "Keelattur North Street",
        "current_status": CurrentStatus.other,
        "current_status_detail": "Freelance Videographer & Wedding Photographer",
        "education": "Diploma in Visual Communication, Madurai Kamaraj University (2019)",
        "bio": "Capturing memories for families across Tamil Nadu. Shot over 200 weddings. Started a YouTube channel documenting village life — 15k subscribers and growing!",
        "phone": "+91 94560 13013",
        "photo_url": "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&fit=crop&crop=face",
    },
    {
        "full_name": "Deepa Natarajan",
        "email": "deepa.natarajan@example.com",
        "village_area": "Keelattur East Street",
        "current_status": CurrentStatus.other,
        "current_status_detail": "Classical Bharatanatyam Dancer & Dance Teacher",
        "education": "B.A. Fine Arts (Dance), Queen Mary's College, Chennai (2021)",
        "bio": "Trained under Guru Savithri Amma for 12 years. Now teaching 30 children in our village every weekend. Performed at state-level youth festivals. Dance is our heritage.",
        "phone": "+91 93450 14014",
        "photo_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
    },
    {
        "full_name": "Prasanna Muthukrishnan",
        "email": "prasanna.muthu@example.com",
        "village_area": "Periya Kuppam",
        "current_status": CurrentStatus.other,
        "current_status_detail": "Army Veteran, now Village Panchayat Ward Member",
        "education": "Higher Secondary, Keelattur Govt. School (2010); served Indian Army 2010–2022",
        "bio": "12 years in the Army — Siachen, Kashmir, Rajasthan. Came home to serve our village another way. Working on road repairs, street lights, and a new community library.",
        "phone": "+91 92340 15015",
        "photo_url": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face",
    },
]


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    created = 0
    skipped = 0

    try:
        for p in PROFILES:
            if db.query(User).filter(User.email == p["email"]).first():
                print(f"  skip  {p['full_name']} (already exists)")
                skipped += 1
                continue

            user = User(
                email=p["email"],
                hashed_password=hash_password("villageconnect123"),
                full_name=p["full_name"],
                village_area=p["village_area"],
                current_status=p["current_status"],
                current_status_detail=p["current_status_detail"],
                education=p["education"],
                bio=p["bio"],
                phone=p["phone"],
                photo_url=p["photo_url"],
                is_approved=True,
                is_admin=False,
                is_active=True,
            )
            db.add(user)
            created += 1
            print(f"  added {p['full_name']} ({p['current_status'].value})")

        db.commit()
        print(f"\n✓ Done — {created} created, {skipped} skipped.")
    except Exception as e:
        db.rollback()
        print(f"\n✗ Error: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run()
