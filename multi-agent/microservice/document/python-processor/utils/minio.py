import os
from minio import Minio
from minio.error import S3Error
from utils.logger import logger  # Import logger

# Load environment variables
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost")
MINIO_PORT = int(os.getenv("MINIO_PORT", 9000))
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "document")

# Initialize MinIO client
minio_client = Minio(
    f"{MINIO_ENDPOINT}:{MINIO_PORT}",
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False,
)

def getFile(user_id: str, file_name: str, download_folder: str = "files") -> str:
    """
    Download a file from MinIO and save it to the specified folder.

    Args:
        folder_name (str): The folder name in MinIO.
        file_name (str): The name of the file to download.
        download_folder (str): The local folder to save the file.

    Returns:
        str: The local file path of the downloaded file.
    """
    try:
        # Ensure the download folder exists
        os.makedirs(download_folder, exist_ok=True)

        # Construct the object name and local file path
        object_name = 'user' + user_id + '/' + file_name
        local_file_path = os.path.join(download_folder, file_name)

        # Download the file from MinIO
        minio_client.fget_object(MINIO_BUCKET, object_name, local_file_path)
        logger.info(
            f"File '{file_name}' downloaded successfully.",
            extra={"file_name": file_name, "status": "success"}
        )

        return local_file_path
    except S3Error as e:
        logger.error(
            f"Error downloading file '{file_name}': {e}",
            extra={"file_name": file_name, "status": "error"}
        )
        raise