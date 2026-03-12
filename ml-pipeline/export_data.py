import os
import psycopg2
import pandas as pd
from dotenv import load_dotenv

# 1. Load the existing .env file from the parent (root) directory
load_dotenv(dotenv_path="../.env")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found. Ensure your root .env file exists.")

# Clean the Prisma URL so psycopg2 can read it
CLEAN_DB_URL = DATABASE_URL.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

# 2. Set your specific testing window and folder
START_TIME = '2026-03-11 15:00:00'
END_TIME = '2026-03-11 15:02:00'
OUTPUT_FOLDER = 'datasets'   # <-- Name of the new folder
OUTPUT_FILENAME = 'safe_walking_01.csv'

def export_to_edge_impulse_csv():
    conn = None
    try:
        # Create the datasets folder if it doesn't already exist
        os.makedirs(OUTPUT_FOLDER, exist_ok=True)
        
        # Combine the folder name and file name into a full path
        export_path = os.path.join(OUTPUT_FOLDER, OUTPUT_FILENAME)

        # Use the CLEANED URL here
        conn = psycopg2.connect(CLEAN_DB_URL)
        
        # 3. SQL Query 
        query = f"""
            SELECT 
                "timestamp" AS created_at, 
                "thighPitch" AS thigh_pitch, 
                "shankPitch" AS shank_pitch, 
                angle AS knee_flexion_angle, 
                force AS fsr_adc
            FROM "SensorLog" 
            WHERE "timestamp" BETWEEN '{START_TIME}' AND '{END_TIME}'
            ORDER BY "timestamp" ASC;
        """
        
        df = pd.read_sql_query(query, conn)
        
        if df.empty:
            print("No data found for this time range. Check your START_TIME and END_TIME.")
            return

        # 4. Format timestamp for Edge Impulse (milliseconds from 0)
        df['created_at'] = pd.to_datetime(df['created_at'])
        start_timestamp = df['created_at'].iloc[0]
        
        df['timestamp'] = (df['created_at'] - start_timestamp).dt.total_seconds() * 1000
        df['timestamp'] = df['timestamp'].astype(int)

        # 5. Export to the new folder path
        df_final = df[['timestamp', 'thigh_pitch', 'shank_pitch', 'knee_flexion_angle', 'fsr_adc']]
        df_final.to_csv(export_path, index=False)
        print(f"Successfully exported {len(df_final)} rows to {export_path}")
        
    except Exception as e:
        print(f"Database Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    export_to_edge_impulse_csv()