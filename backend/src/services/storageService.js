// src/services/storage.js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || 'ipetro-photos';
const PUBLIC_URL_BASE = process.env.SUPABASE_URL_BASE; // <-- add this line

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Upload local file to Supabase storage
 * @param {string} objectPath - "inspections/1/filename.jpg"
 * @param {string} localFilePath - local temp path
 * @param {boolean} makePublic - if true, returns public url (bucket must allow public read)
 * @returns {string} url (signed or public)
 */
async function uploadFile(objectPath, localFilePath, makePublic = true) {
  const fileBuffer = fs.readFileSync(localFilePath);
  const ext = path.extname(localFilePath).toLowerCase();
  let contentType = 'application/octet-stream';
  if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  if (ext === '.png') contentType = 'image/png';
  if (ext === '.webp') contentType = 'image/webp';

  const cleanPath = objectPath.replace(/^\/+/, '');

  // Upload (allow overwrite with upsert: true)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(cleanPath, fileBuffer, { contentType, upsert: true });

  if (error) throw error;

  if (makePublic) {
    // Return direct public URL
    return `${PUBLIC_URL_BASE}/${cleanPath}`;
  }

  //  Otherwise create a temporary signed URL (e.g. for private buckets)
  const expiresIn = 60 * 60 * 24;
  const { data: signedData, error: sErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(cleanPath, expiresIn);

  if (sErr) throw sErr;
  return signedData.signedUrl;
}

/**
 * Delete file from Supabase bucket
 * @param {string} objectKey
 */
async function deleteFile(objectKey) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([objectKey]);

  if (error) throw error;
  return true;
}

module.exports = { uploadFile, deleteFile, supabase };
