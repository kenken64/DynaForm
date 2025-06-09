import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../database/connection';
import { GeneratedForm, SaveFormRequest, PaginatedResponse } from '../types';
import * as crypto from 'crypto';

export class FormService {
  private getCollection(): Collection<GeneratedForm> {
    return getDatabase().collection('generated_form');
  }

  /**
   * Generate a JSON fingerprint from form data for forms created without PDF upload
   * This provides consistent fingerprint generation similar to the AI agent's implementation
   */
  private generateJsonFingerprint(formData: any): string {
    try {
      // Create a canonical representation of the form structure
      const canonicalData = {
        formData: formData.formData || [],
        originalJson: formData.originalJson || {},
        metadata: {
          formName: formData.metadata?.formName || "",
          version: formData.metadata?.version || "1.0.0"
        }
      };
      
      // Convert to JSON string with sorted keys for consistency
      const jsonString = JSON.stringify(canonicalData, Object.keys(canonicalData).sort());
      
      // Generate SHA256 hash
      const fingerprint = crypto.createHash('sha256').update(jsonString, 'utf8').digest('hex');
      console.log(`Generated JSON fingerprint for form without PDF: ${fingerprint}`);
      return fingerprint;
      
    } catch (error) {
      console.error('Error generating JSON fingerprint:', error);
      // Fallback to a simple hash of current timestamp and random data
      const fallbackData = `form_${Date.now()}_${Math.random()}`;
      return crypto.createHash('sha256').update(fallbackData, 'utf8').digest('hex');
    }
  }

  /**
   * Generate a short ID from a hash (first 8 characters)
   */
  private generateShortId(hash: string): string {
    return hash.substring(0, 8);
  }

  /**
   * Generate PDF metadata and fingerprint for forms created without PDF upload
   */
  private generateFormMetadata(formData: any): { pdfMetadata: any; pdfFingerprint: string } {
    const jsonFingerprint = this.generateJsonFingerprint(formData);
    const shortId = this.generateShortId(jsonFingerprint);
    
    // Create PDF-like metadata structure for consistency
    const pdfMetadata = {
      title: formData.metadata?.formName || 'Generated Form',
      creator: 'Form Editor',
      producer: 'DynaForm Form Builder',
      creation_date: new Date().toISOString(),
      page_count: 1, // Forms created without PDF are considered single-page
      hashes: {
        md5: crypto.createHash('md5').update(JSON.stringify(formData.formData || [])).digest('hex'),
        sha1: crypto.createHash('sha1').update(JSON.stringify(formData.formData || [])).digest('hex'),
        sha256: crypto.createHash('sha256').update(JSON.stringify(formData.formData || [])).digest('hex'),
        short_id: shortId,
        json_fingerprint: jsonFingerprint
      }
    };
    
    console.log(`Generated form metadata for PDF-less form: ${JSON.stringify(pdfMetadata.hashes)}`);
    
    return {
      pdfMetadata,
      pdfFingerprint: shortId
    };
  }

  async saveForm(formRequest: SaveFormRequest, userId: string): Promise<{ formId: string; savedAt: string }> {
    const { formData, fieldConfigurations, originalJson, metadata, pdfMetadata, pdfFingerprint } = formRequest;

    // Validate required fields
    if (!formData || !Array.isArray(formData)) {
      throw new Error('Invalid form data. Expected formData to be an array.');
    }

    if (!fieldConfigurations || typeof fieldConfigurations !== 'object') {
      throw new Error('Invalid field configurations. Expected fieldConfigurations to be an object.');
    }

    if (!userId) {
      throw new Error('User ID is required to save form.');
    }

    // Prepare document to save
    const formDocument: GeneratedForm = {
      formData,
      fieldConfigurations,
      originalJson,
      metadata: {
        createdAt: new Date().toISOString(),
        formName: metadata?.formName || 'Untitled Form',
        version: '1.0.0',
        createdBy: userId, // Add user ID to track ownership
        ...metadata
      },
      ...(pdfMetadata && { pdfMetadata }), // Include PDF metadata if provided
      ...(pdfFingerprint && { pdfFingerprint }) // Include PDF fingerprint if provided
    };

    // Generate PDF metadata and fingerprint if not provided (for forms created without PDF upload)
    if (!pdfMetadata && !pdfFingerprint) {
      console.log('No PDF metadata provided, generating JSON fingerprint for form created without PDF upload');
      const { pdfMetadata: generatedPdfMetadata, pdfFingerprint: generatedPdfFingerprint } = this.generateFormMetadata(formDocument);
      formDocument.pdfMetadata = generatedPdfMetadata;
      formDocument.pdfFingerprint = generatedPdfFingerprint;
    }

    const collection = this.getCollection();
    const result = await collection.insertOne(formDocument);

    console.log(`Form saved successfully with ID: ${result.insertedId} for user: ${userId}${formDocument.pdfFingerprint ? ` with fingerprint: ${formDocument.pdfFingerprint}` : ''}`);

    return {
      formId: result.insertedId.toString(),
      savedAt: formDocument.metadata.createdAt
    };
  }

  async getForms(page: number = 1, pageSize: number = 10, userId?: string): Promise<PaginatedResponse<GeneratedForm>> {
    const collection = this.getCollection();
    
    const skip = (page - 1) * pageSize;
    
    // Create filter for user-specific forms
    const filter = userId ? { 'metadata.createdBy': userId } : {};
    
    // Get total count
    const totalCount = await collection.countDocuments(filter);
    
    // Get paginated forms
    const forms = await collection
      .find(filter)
      .sort({ 'metadata.createdAt': -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    return {
      success: true,
      count: totalCount,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      data: forms
    };
  }

  async getFormById(id: string, userId?: string): Promise<GeneratedForm | null> {
    const collection = this.getCollection();
    
    // Create filter to include user ownership verification if userId is provided
    const filter: any = { _id: new ObjectId(id) };
    if (userId) {
      filter['metadata.createdBy'] = userId;
    }
    
    return await collection.findOne(filter);
  }

  async searchForms(searchQuery: string, page: number = 1, pageSize: number = 10, userId?: string): Promise<PaginatedResponse<GeneratedForm>> {
    const collection = this.getCollection();
    
    const skip = (page - 1) * pageSize;
    
    // Create search filter
    const searchFilter: any = {};
    
    // Add user ownership filter if userId is provided
    if (userId) {
      searchFilter['metadata.createdBy'] = userId;
    }
    
    // Add search query filter
    if (searchQuery) {
      const textSearchFilter = {
        $or: [
          { 'metadata.formName': { $regex: searchQuery, $options: 'i' } },
          { 'formData.name': { $regex: searchQuery, $options: 'i' } }
        ]
      };
      
      // Combine user filter and search filter
      if (userId) {
        searchFilter.$and = [
          { 'metadata.createdBy': userId },
          textSearchFilter
        ];
        delete searchFilter['metadata.createdBy']; // Remove duplicate
      } else {
        Object.assign(searchFilter, textSearchFilter);
      }
    }
    
    // Get total count for search
    const totalCount = await collection.countDocuments(searchFilter);
    
    // Get paginated search results
    const forms = await collection
      .find(searchFilter)
      .sort({ 'metadata.createdAt': -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    return {
      success: true,
      count: totalCount,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      data: forms
    };
  }

  async updateForm(id: string, updateData: Partial<GeneratedForm>, userId?: string): Promise<GeneratedForm | null> {
    const collection = this.getCollection();
    
    // Create filter to include user ownership verification if userId is provided
    const filter: any = { _id: new ObjectId(id) };
    if (userId) {
      filter['metadata.createdBy'] = userId;
    }
    
    // If updating metadata, ensure we preserve existing metadata fields
    if (updateData.metadata) {
      updateData.metadata = {
        ...updateData.metadata,
        updatedAt: new Date().toISOString()
      };
    }

    const result = await collection.findOneAndUpdate(
      filter,
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return result || null;
  }

  async deleteForm(id: string, userId?: string): Promise<boolean> {
    const collection = this.getCollection();
    
    // Create filter to include user ownership verification if userId is provided
    const filter: any = { _id: new ObjectId(id) };
    if (userId) {
      filter['metadata.createdBy'] = userId;
    }
    
    const result = await collection.deleteOne(filter);
    return result.deletedCount > 0;
  }

  async getFormsByPdfFingerprint(pdfFingerprint: string, userId?: string): Promise<GeneratedForm[]> {
    const collection = this.getCollection();
    
    // Create filter for PDF fingerprint and user ownership
    const filter: any = { pdfFingerprint };
    if (userId) {
      filter['metadata.createdBy'] = userId;
    }
    
    const forms = await collection
      .find(filter)
      .sort({ 'metadata.createdAt': -1 })
      .toArray();

    console.log(`Found ${forms.length} forms with PDF fingerprint: ${pdfFingerprint}${userId ? ` for user: ${userId}` : ''}`);
    
    return forms;
  }

  async verifyFormStatus(formId: string): Promise<any> {
    try {
      const collection = this.getCollection();
      const form = await collection.findOne({ _id: new ObjectId(formId) });

      if (!form) {
        return {
          success: false,
          error: 'Form not found',
          message: `No form found with ID: ${formId}`
        };
      }

      // Check if form is verified on blockchain
      const isVerified = form.status === 'verified' && form.blockchainInfo;

      if (!isVerified) {
        return {
          success: false,
          verified: false,
          message: 'Form is not verified on blockchain yet.',
          formId: formId,
          formName: form.metadata?.formName || 'Untitled Form'
        };
      }

      // Return successful verification with blockchain details
      return {
        success: true,
        verified: true,
        message: 'Form successfully verified on blockchain!',
        formId: formId,
        formName: form.metadata?.formName || 'Untitled Form',
        verificationData: {
          status: form.status,
          publicUrl: form.blockchainInfo?.publicUrl,
          transactionHash: form.blockchainInfo?.transactionHash,
          blockNumber: form.blockchainInfo?.blockNumber,
          verifiedAt: form.blockchainInfo?.verifiedAt,
          gasUsed: form.blockchainInfo?.gasUsed
        }
      };

    } catch (error: any) {
      console.error('Error verifying form status:', error);
      return {
        success: false,
        error: 'Internal server error',
        message: error.message
      };
    }
  }
}

export const formService = new FormService();