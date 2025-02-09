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

# Additional imports for recommendations
import pickle
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from typing import List

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



# ---------------------------
# New Recommendation Endpoint
# ---------------------------

load_dotenv()
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_CACHE_PATH = "recommendations_embeddings_cache.pkl"
try:
    embedding_cache = pd.read_pickle(EMBEDDING_CACHE_PATH)
except FileNotFoundError:
    embedding_cache = {}
with open(EMBEDDING_CACHE_PATH, "wb") as cache_file:
    pickle.dump(embedding_cache, cache_file)

def get_embedding(text: str, model: str = EMBEDDING_MODEL) -> list:
    from openai import OpenAI
    client = OpenAI()  # Assumes OPENAI_API_KEY is set in the environment
    response = client.embeddings.create(input=text, model=model)
    return response.data[0].embedding

def embedding_from_string(string: str, model: str = EMBEDDING_MODEL, cache=embedding_cache) -> list:
    key = (string, model)
    if key not in cache:
        cache[key] = get_embedding(string, model)
        with open(EMBEDDING_CACHE_PATH, "wb") as cache_file:
            pickle.dump(cache, cache_file)
    return cache[key]

def distances_from_embeddings(query_embedding: list, embeddings: list, distance_metric="cosine") -> list:
    query = np.array(query_embedding)
    all_embeddings = np.array(embeddings)
    if distance_metric == "cosine":
        dot_products = np.dot(all_embeddings, query)
        query_norm = np.linalg.norm(query)
        embeddings_norm = np.linalg.norm(all_embeddings, axis=1)
        cosine_similarities = dot_products / (embeddings_norm * query_norm + 1e-10)
        distances = 1 - cosine_similarities
        return distances.tolist()
    else:
        distances = np.linalg.norm(all_embeddings - query, axis=1)
        return distances.tolist()

def indices_of_nearest_neighbors_from_distances(distances: list) -> list:
    return sorted(range(len(distances)), key=lambda i: distances[i])

def get_recommendations_from_query(events_df: pd.DataFrame, query: str, k_nearest_neighbors: int = 10) -> dict:
    """
    Given a query string, compute its embedding and compare it with the embeddings for all events.
    Each event's text is a combination of its title and description.
    Returns a dictionary in the format:
    
    {
        "events": [
            {
                "username": "...",
                "title": "...",
                "description": "...",
                "imageurl": "...",
                "tags": "...",
                "longitude": ...,
                "latitude": ...,
                "date": "...",
                "postid": ...,
                "isEvent": ...,
                "distance": <computed distance>
            },
            ...
        ]
    }
    """
    # Combine title and description using .get() to avoid missing-key errors
    event_texts = events_df.apply(
        lambda row: f"Title: {row.get('title', '')}\nDescription: {row.get('description', '')}",
        axis=1
    ).tolist()
    
    # Compute (or retrieve cached) embeddings for all events
    event_embeddings = [embedding_from_string(text, model=EMBEDDING_MODEL) for text in event_texts]
    
    # Compute embedding for the query string
    query_embedding = embedding_from_string(query, model=EMBEDDING_MODEL)
    
    # Compute cosine distances between the query and each event embedding
    distances = distances_from_embeddings(query_embedding, event_embeddings, distance_metric="cosine")
    
    # Get indices sorted by increasing distance (most similar first)
    neighbor_indices = indices_of_nearest_neighbors_from_distances(distances)
    
    recommended_events = []
    count = 0
    for idx in neighbor_indices:
        if count >= k_nearest_neighbors:
            break
        # Convert the row to a dictionary
        event_dict = events_df.iloc[idx].to_dict()
        # Generate a unique identifier (postid) using the DataFrame's index (you can change this if needed)
        event_dict["postid"] = int(events_df.index[idx])
        # Add the computed distance
        event_dict["distance"] = distances[idx]
        recommended_events.append(event_dict)
        count += 1
    
    return {"events": recommended_events}

# Pydantic model for incoming recommendation query
class QueryRequest(BaseModel):
    query: str

@app.post("/recommend-events", response_model=dict)
def recommend_events(request: QueryRequest):
    try:
        # Connect to the database and fetch all events from EventData
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=DictCursor)
        cursor.execute("SELECT * FROM EventData")
        events = cursor.fetchall()
        cursor.close()
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving events: {str(e)}")
    
    # Convert the events to a DataFrame ensuring each row is a dictionary
    df = pd.DataFrame([dict(row) for row in events])
    # Normalize column names to lowercase
    df.columns = [str(col).lower() for col in df.columns]
    
    # Rename columns to match desired output:
    if "user" in df.columns:
        df = df.rename(columns={"user": "username"})
    if "isevent" in df.columns:
        df = df.rename(columns={"isevent": "isEvent"})
    
    # Convert the date column if it exists (SQL DATE to ISO format)
    if "date" in df.columns and pd.api.types.is_datetime64_any_dtype(df["date"]):
        df["date"] = df["date"].apply(lambda d: d.isoformat())
    
    # Get the recommendations for the provided query
    recommendations = get_recommendations_from_query(df, request.query, k_nearest_neighbors=10)
    return recommendations

# ---------------------------
# Root Endpoint
# ---------------------------
@app.get("/")
def root():
    return {"message": "Backend is up and running."}