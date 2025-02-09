from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from models import SessionLocal, Event

app = FastAPI()

# Dependency for database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Schema for creating an event
class EventCreate(BaseModel):
    title: str
    description: str
    latitude: float
    longitude: float

# API to add a new event
@app.post("/api/events/")
def add_event(event: EventCreate, db: Session = Depends(get_db)):
    new_event = Event(
        title=event.title,
        description=event.description,
        latitude=event.latitude,
        longitude=event.longitude
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return {"message": "Event added successfully", "event": new_event}

# API to fetch all events
@app.get("/api/events/")
def get_events(db: Session = Depends(get_db)):
    events = db.query(Event).all()
    return events
