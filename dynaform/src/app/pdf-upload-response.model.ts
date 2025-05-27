export interface PdfUploadResponse {
  accessible_urls: string[];
  message: string;
  output_directory_on_server: string;
  saved_file_paths_on_server: string[];
  saved_files_count: number;
}