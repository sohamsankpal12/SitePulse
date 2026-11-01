"""
Deploy frontend dist/ to S3 and invalidate CloudFront cache
"""
from dotenv import load_dotenv
load_dotenv()
import boto3, os, mimetypes

region     = 'ap-south-1'
account_id = os.environ.get('AWS_ACCOUNT_ID', '225632394243')
bucket     = f'sitepulse-frontend-{account_id}'
dist_dir   = 'frontend/dist'

s3 = boto3.client('s3', region_name=region)
cf = boto3.client('cloudfront', region_name='us-east-1')

print(f"Uploading to s3://{bucket}...")

count = 0
for root, dirs, files in os.walk(dist_dir):
    for filename in files:
        local_path = os.path.join(root, filename)
        s3_key = os.path.relpath(local_path, dist_dir).replace('\\', '/')
        mime, _ = mimetypes.guess_type(local_path)
        mime = mime or 'application/octet-stream'
        cache = 'max-age=31536000' if '/assets/' in s3_key else 'no-cache, no-store, must-revalidate'
        s3.upload_file(
            local_path, bucket, s3_key,
            ExtraArgs={'ContentType': mime, 'CacheControl': cache}
        )
        count += 1
        print(f"  Uploaded: {s3_key}")

print(f"\nTotal: {count} files uploaded")

# Invalidate CloudFront
print("\nInvalidating CloudFront cache...")
try:
    dists = cf.list_distributions()
    dist_list = dists.get('DistributionList', {}).get('Items', [])
    dist = next((d for d in dist_list if bucket in str(d.get('Origins', ''))), None)
    
    if dist:
        cf.create_invalidation(
            DistributionId=dist['Id'],
            InvalidationBatch={
                'Paths': {'Quantity': 1, 'Items': ['/*']},
                'CallerReference': str(os.urandom(8).hex()),
            }
        )
        print(f"CloudFront cache cleared! Distribution: {dist['Id']}")
    else:
        print("CloudFront distribution not found — clear cache manually")
except Exception as e:
    print(f"CloudFront error: {e}")

print("\nDone! Website updated.")
