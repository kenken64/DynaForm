import { Collection } from 'mongodb';
import { getDatabase } from '../database/connection';
import { FormDataSubmission, SavedFormDataSubmission, PaginatedResponse } from '../types';

export class FormDataService {
  private getCollection(): Collection<SavedFormDataSubmission> {
    return getDatabase().collection('forms_data');
  }

  async saveFormData(
    formDataSubmission: FormDataSubmission,
    requestInfo: { ip?: string; userAgent?: string }
  ): Promise<{ isNewSubmission: boolean; submittedAt: string }> {
    const { formId, formTitle, formData, userInfo, submissionMetadata } = formDataSubmission;

    // Validate required fields
    if (!formId) {
      throw new Error('Form ID is required');
    }

    if (!formData || typeof formData !== 'object') {
      throw new Error('Invalid form data. Expected formData to be an object.');
    }

    // Prepare document for upsert
    const formDataDocument: SavedFormDataSubmission = {
      formId: formId,
      formTitle: formTitle,
      formData: formData,
      userInfo: userInfo,
      submissionMetadata: {
        submittedAt: new Date().toISOString(),
        ipAddress: requestInfo.ip || 'unknown',
        userAgent: requestInfo.userAgent || 'unknown',
        ...submissionMetadata
      },
      updatedAt: new Date().toISOString()
    };

    const collection = this.getCollection();
    
    // Use upsert based on formId and optionally userInfo
    const filter = userInfo?.userId 
      ? { formId: formId, 'userInfo.userId': userInfo.userId }
      : { formId: formId };

    const result = await collection.replaceOne(
      filter,
      formDataDocument,
      { upsert: true }
    );

    console.log(`Form data ${result.upsertedCount > 0 ? 'created' : 'updated'} successfully for form ID: ${formId}`);

    return {
      isNewSubmission: result.upsertedCount > 0,
      submittedAt: formDataDocument.submissionMetadata.submittedAt
    };
  }

  async getFormData(formId: string, userId?: string): Promise<SavedFormDataSubmission | null> {
    const collection = this.getCollection();
    
    // Build filter
    const filter: any = { formId: formId };
    if (userId) {
      filter['userInfo.userId'] = userId;
    }

    return await collection.findOne(filter);
  }

  async getFormSubmissions(formId: string, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<SavedFormDataSubmission>> {
    const collection = this.getCollection();
    
    const skip = (page - 1) * pageSize;
    
    // Get total count
    const totalCount = await collection.countDocuments({ formId: formId });
    
    // Get paginated submissions
    const submissions = await collection
      .find({ formId: formId })
      .sort({ 'submissionMetadata.submittedAt': -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    return {
      success: true,
      count: totalCount,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      data: submissions
    };
  }

  async getAllFormData(formId?: string, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<SavedFormDataSubmission>> {
    const collection = this.getCollection();
    
    const skip = (page - 1) * pageSize;
    
    // Build filter - if formId is provided, filter by it
    const filter: any = formId ? { formId: formId } : {};
    
    // Get total count
    const totalCount = await collection.countDocuments(filter);
    
    // Get paginated submissions
    const submissions = await collection
      .find(filter)
      .sort({ 'submissionMetadata.submittedAt': -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    return {
      success: true,
      count: totalCount,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      data: submissions
    };
  }
}

export const formDataService = new FormDataService();