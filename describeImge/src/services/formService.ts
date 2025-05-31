import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../database/connection';
import { GeneratedForm, SaveFormRequest, PaginatedResponse } from '../types';

export class FormService {
  private getCollection(): Collection<GeneratedForm> {
    return getDatabase().collection('generated_form');
  }

  async saveForm(formRequest: SaveFormRequest): Promise<{ formId: string; savedAt: string }> {
    const { formData, fieldConfigurations, originalJson, metadata } = formRequest;

    // Validate required fields
    if (!formData || !Array.isArray(formData)) {
      throw new Error('Invalid form data. Expected formData to be an array.');
    }

    if (!fieldConfigurations || typeof fieldConfigurations !== 'object') {
      throw new Error('Invalid field configurations. Expected fieldConfigurations to be an object.');
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
        ...metadata
      }
    };

    const collection = this.getCollection();
    const result = await collection.insertOne(formDocument);

    console.log(`Form saved successfully with ID: ${result.insertedId}`);

    return {
      formId: result.insertedId.toString(),
      savedAt: formDocument.metadata.createdAt
    };
  }

  async getForms(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<GeneratedForm>> {
    const collection = this.getCollection();
    
    const skip = (page - 1) * pageSize;
    
    // Get total count
    const totalCount = await collection.countDocuments({});
    
    // Get paginated forms
    const forms = await collection
      .find({})
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

  async getFormById(id: string): Promise<GeneratedForm | null> {
    const collection = this.getCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  async searchForms(searchQuery: string, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<GeneratedForm>> {
    const collection = this.getCollection();
    
    const skip = (page - 1) * pageSize;
    
    // Create search filter
    const searchFilter = searchQuery ? {
      $or: [
        { 'metadata.formName': { $regex: searchQuery, $options: 'i' } },
        { 'formData.name': { $regex: searchQuery, $options: 'i' } }
      ]
    } : {};
    
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

  async updateForm(id: string, updateData: Partial<GeneratedForm>): Promise<GeneratedForm | null> {
    const collection = this.getCollection();
    
    // If updating metadata, ensure we preserve existing metadata fields
    if (updateData.metadata) {
      updateData.metadata = {
        ...updateData.metadata,
        updatedAt: new Date().toISOString()
      };
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return result || null;
  }

  async deleteForm(id: string): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}

export const formService = new FormService();