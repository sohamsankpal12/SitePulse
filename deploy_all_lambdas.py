"""
Deploy all Lambda functions with updated shared/helpers.js
"""
from dotenv import load_dotenv
load_dotenv()
import boto3, os, zipfile, io, time

region = 'ap-south-1'
lam = boto3.client('lambda', region_name=region)

FUNCTIONS = {
    'SitePulse-Websites':      'backend/functions/websites',
    'SitePulse-Checks':        'backend/functions/checks',
    'SitePulse-Dashboard':     'backend/functions/dashboard',
    'SitePulse-Incidents':     'backend/functions/incidents',
    'SitePulse-Monitor':       'backend/functions/monitor',
    'SitePulse-Notifications': 'backend/functions/notifications',
}

def zip_folder(folder_path):
    """Zip a folder into bytes in memory"""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(folder_path):
            # Skip node_modules
            dirs[:] = [d for d in dirs if d != 'node_modules']
            for file in files:
                full_path = os.path.join(root, file)
                arcname = os.path.relpath(full_path, folder_path)
                zf.write(full_path, arcname)
    buf.seek(0)
    return buf.read()

print("=" * 50)
print("Deploying all Lambda functions...")
print("=" * 50)

for fn_name, folder in FUNCTIONS.items():
    print(f"\n--- {fn_name} ---")
    if not os.path.exists(folder):
        print(f"  SKIP: folder not found: {folder}")
        continue
    
    try:
        zip_bytes = zip_folder(folder)
        print(f"  Zip size: {len(zip_bytes)/1024:.1f} KB")
        
        resp = lam.update_function_code(
            FunctionName=fn_name,
            ZipFile=zip_bytes,
            Publish=False,
        )
        print(f"  Deployed! Status: {resp.get('LastUpdateStatus', 'N/A')}")
        time.sleep(1)  # Small delay between deployments
        
    except lam.exceptions.ResourceNotFoundException:
        print(f"  SKIP: Function '{fn_name}' not found in AWS")
    except Exception as e:
        print(f"  ERROR: {e}")

print("\n" + "=" * 50)
print("All functions deployed!")
print("=" * 50)
