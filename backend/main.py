from fastapi import FastAPI, UploadFile, HTTPException, File
from fastapi.responses import RedirectResponse,StreamingResponse,JSONResponse
from botocore.exceptions import NoCredentialsError
from math import radians, sin, cos, sqrt, atan2
import subprocess
import io
import boto3
import os
import psycopg2
import uuid
from pydantic import BaseModel
from psycopg2.extras import DictCursor
from datetime import datetime, date

# Initialize FastAPI app
app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify your frontend domain, e.g., ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# AWS S3 Configuration (Set these as environment variables or replace with actual values)
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "memorymaphackathon")
S3_PUBLIC_URL = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com"
DATABASE_URL = "postgres://ufjgvj3cmsm1m6:pb0ae99a299aaf078c4202af4c25e2479c37cfd6840d7b3f1b531c88e590ff1a1@ccpa7stkruda3o.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d3gtgu1i569dre"
# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id='',  # Optional if set in env
    aws_secret_access_key='',  # Optional if set in env
    region_name='us-east-1'  # Optional if set in env
)



@app.get("/get-image/{image_name}")
async def get_image(image_name: str):

    s3_object = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=image_name)
    image_data = s3_object['Body'].read()

    return StreamingResponse(io.BytesIO(image_data), media_type="image/jpeg")
    


@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
   print(S3_PUBLIC_URL)
   try:
       # Generate a unique file name using uuid to avoid overwriting
       unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
       local_path = f"./test.png"


       with open(local_path, "wb") as buffer:
           buffer.write(await file.read())
       print(S3_BUCKET_NAME)
       subprocess.run(["node", "process.js"], capture_output=True, text=True)
       # Upload file to S3
       print('uploading')
       with open("output_with_transparent_circle.png", 'rb') as editedFile:
           s3_client.upload_fileobj(
               editedFile,
               S3_BUCKET_NAME,
               unique_filename,
               ExtraArgs={"ContentType": "image/png"}
           )
       print('reached1')
       # Generate the public URL of the uploaded file
       file_url = f"{S3_PUBLIC_URL}/{unique_filename}"


       # Return the URL of the uploaded image
       return JSONResponse(content={"image_url": file_url}, status_code=200)


   except NoCredentialsError:
       raise HTTPException(status_code=403, detail="AWS credentials not found or incorrect.")
   except Exception as e:
       raise HTTPException(status_code=500, detail=str(e))

def calculate_distance(lat1, lon1, lat2, lon2):
    # Haversine formula to calculate the distance between two points on the Earth's surface
    R = 6371  # Radius of Earth in km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    distance = R * c  # Result in kilometers
    return distance

def get_db_connection():
    # Connect to the PostgreSQL database
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    return conn

@app.get("/get-events/")
async def get_events(lat: float, lon: float, radius: float):
    try:
        # Connect to PostgreSQL database
        connection = get_db_connection()
        
        # Use DictCursor for fetching rows as dictionaries
        cursor = connection.cursor(cursor_factory=DictCursor)
        
        # SQL query to get all events from the database
        query = "SELECT * FROM EventData"
        cursor.execute(query)

        # Fetch all events
        events = cursor.fetchall()
        
        nearby_events = []
        for event in events:
            # Extract event latitude and longitude from the database
            event_lat = event['latitude']  # Ensure the column name is correct
            event_lon = event['longitude']  # Ensure the column name is correct
            
            # Calculate the distance from the provided location (lat, lon)
            distance = calculate_distance(lat, lon, event_lat, event_lon)

            # If the event is within the specified radius, add to the list
            event['date'] = event['date'].isoformat()  # Format the date
            event=dict(event)
            if distance <= radius:
                event['distance'] = distance  # Add the calculated distance to the event
                nearby_events.append(event)

        # Close the cursor and connection
        cursor.close()
        connection.close()

        # Return the list of nearby events
        return JSONResponse(content={"events": nearby_events})

    except psycopg2.Error as err:
        raise HTTPException(status_code=500, detail=f"PostgreSQL error: {str(err)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
    

    # username Title ,desc date, coords tags,

class Event(BaseModel):
    username: str
    title: str
    description: str
    imageurl: str
    tags: str
    longitude: float
    latitude: float
    date: datetime  
    isEvent: bool

@app.post("/add-event/")
async def add_event(event: Event):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Ensure date is stored as "YYYY-MM-DD" format
        date_value = event.date.date().isoformat()

        query = """
        INSERT INTO EventData (username, title, description, imageurl, tags, longitude, latitude, date, "isEvent")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING postid;
        """ 

        values = (
            event.username,
            event.title,
            event.description,
            event.imageurl,
            event.tags,
            event.longitude,
            event.latitude,
            date_value, 
            event.isEvent
        )

        print("Executing query with values:", values)

        cursor.execute(query, values)
        new_postid = cursor.fetchone()[0]  
        connection.commit()

        cursor.close()
        connection.close()

        return {"message": "Event added successfully", "postid": new_postid}

    except psycopg2.Error as err:
        print("Database error:", err) 
        raise HTTPException(status_code=500, detail=f"Database error: {str(err)}")

    except Exception as e:
        print("General error:", e) 
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
