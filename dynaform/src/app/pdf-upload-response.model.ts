export interface PdfMetadataHashes {
  md5: string;
  sha1: string;
  sha256: string;
  short_id: string;
  json_fingerprint: string;
}

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creation_date?: string;
  modification_date?: string;
  page_count: number;
  hashes: PdfMetadataHashes;
}

export interface PdfUploadResponse {
  accessible_urls: string[];
  message: string;
  output_directory_on_server: string;
  saved_file_paths_on_server: string[];
  saved_files_count: number;
  metadata: PdfMetadata;
}