from fastapi import FastAPI, UploadFile, HTTPException, File
from fastapi.responses import RedirectResponse,StreamingResponse,JSONResponse
from botocore.exceptions import NoCredentialsError
from math import radians, sin, cos, sqrt, atan2
import io
import boto3
import os
import psycopg2
from psycopg2.extras import DictCursor

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
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "your-bucket-name")
S3_PUBLIC_URL = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com"
DATABASE_URL = "postgres://ufjgvj3cmsm1m6:pb0ae99a299aaf078c4202af4c25e2479c37cfd6840d7b3f1b531c88e590ff1a1@ccpa7stkruda3o.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d3gtgu1i569dre"

# Initialize S3 client
s3_client = boto3.client("s3")

@app.get("/get-image/{image_name}")
async def get_image(image_name: str):
    # Retrieve the image from S3
    bucket_name = "memorymaphackathon"
    try:
        # Fetch the object from the S3 bucket
        s3_object = s3_client.get_object(Bucket=bucket_name, Key=image_name)
        image_data = s3_object['Body'].read()

        # Return the image data as a StreamingResponse (use the correct mime type)
        return StreamingResponse(io.BytesIO(image_data), media_type="image/jpeg")

    except Exception as e:
        return {"error": "Image not found or unable to fetch it"}
    

@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Generate a unique file name to avoid overwriting
        unique_filename = f"{uuid4().hex}_{file.filename}"

        # Upload file to S3
        s3_client.upload_fileobj(
            file.file,
            bucket_name,
            unique_filename,
            ExtraArgs={"ContentType": file.content_type}
        )

        # Generate the public URL of the uploaded file
        file_url = f"https://{bucket_name}.s3.amazonaws.com/{unique_filename}"

        # Return the URL of the uploaded image
        return JSONResponse(content={"image_url": file_url})

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