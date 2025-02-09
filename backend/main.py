from fastapi import FastAPI, UploadFile, HTTPException, File
from fastapi.responses import RedirectResponse,StreamingResponse,JSONResponse
from botocore.exceptions import NoCredentialsError
import mysql.connector
from math import radians, sin, cos, sqrt, atan2
import io
import boto3
import os

# Initialize FastAPI app
app = FastAPI()

# AWS S3 Configuration (Set these as environment variables or replace with actual values)
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "your-bucket-name")
S3_PUBLIC_URL = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com"
DB_HOST = "10.131.217.165"
DB_USER = "root"
DB_PASSWORD = "my-secret-pw"
DB_NAME = "trial"

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


# Function to calculate distance using the Haversine formula
def calculate_distance(lat1, lon1, lat2, lon2):
    # Radius of the Earth in kilometers
    R = 6371.0
    # Convert degrees to radians
    lat1_rad = radians(lat1)
    lon1_rad = radians(lon1)
    lat2_rad = radians(lat2)
    lon2_rad = radians(lon2)

    # Difference in coordinates
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad

    # Haversine formula
    a = sin(dlat / 2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    # Distance in kilometers
    distance = R * c
    return distance

# Database connection function
def get_db_connection():
    connection = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    return connection


@app.get("/get-events/")
async def get_events(lat: float, lon: float, radius: float):
    try:
        # Connect to MySQL database
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        print(connection)
        # SQL query to get all events from the database
        query = "SELECT * FROM EventData"
        cursor.execute(query)

        # Fetch all events
        events = cursor.fetchall()
        
        nearby_events = []

        for event in events:
            # Calculate the distance from the provided location (lat, lon)
            event_lat = event['Lat']
            event_lon = event['Long']
            distance = calculate_distance(lat, lon, event_lat, event_lon)

            # If the event is within the specified radius, add to the list
            if distance <= radius:
                event['distance'] = distance  # Add the calculated distance to the event
                nearby_events.append(event)

        # Close the cursor and connection
        cursor.close()
        connection.close()

        # Return the list of nearby events
        return JSONResponse(content={"events": nearby_events})

    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"MySQL error: {str(err)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

