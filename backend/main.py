from fastapi import FastAPI, UploadFile, HTTPException, File
from fastapi.responses import RedirectResponse,StreamingResponse,JSONResponse
from botocore.exceptions import NoCredentialsError
import io
import boto3
import os

# Initialize FastAPI app
app = FastAPI()

# AWS S3 Configuration (Set these as environment variables or replace with actual values)
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "your-bucket-name")
S3_PUBLIC_URL = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com"

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

