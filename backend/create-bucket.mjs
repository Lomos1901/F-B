import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ckhqscuqmyzhcjzppfva.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNraHFzY3VxbXl6aGNqenBwZnZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDMxNjExNiwiZXhwIjoyMDk1ODkyMTE2fQ.HHRVd-8ZWehqFPSU-4v7G_o7_KsgzU-K0uRmkhe-GG8'; // Service Role Key

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setupBucket() {
  const BUCKET_NAME = 'product-images';
  console.log('Checking for bucket:', BUCKET_NAME);

  const { data: buckets, error: getError } = await supabase.storage.listBuckets();
  if (getError) {
    console.error('Error listing buckets:', getError);
    return;
  }

  const exists = buckets.find(b => b.name === BUCKET_NAME);
  if (exists) {
    console.log(`Bucket ${BUCKET_NAME} already exists.`);
  } else {
    console.log(`Creating bucket ${BUCKET_NAME}...`);
    const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
      fileSizeLimit: 5242880 // 5MB
    });
    if (error) {
      console.error('Error creating bucket:', error);
      return;
    }
    console.log(`Bucket ${BUCKET_NAME} created successfully:`, data);
  }
}

setupBucket();
