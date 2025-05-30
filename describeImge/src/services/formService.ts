import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../database/connection';
import { GeneratedForm, SaveFormRequest, PaginationQuery, SearchQuery } from '../types';
import config from '../config';

export class FormService {
    private getCollection(): Collection<GeneratedForm> {
        return getDatabase().collection<GeneratedForm>('generated_form');
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

    async getForms(query: PaginationQuery): Promise<{
        forms: GeneratedForm[];
        totalCount: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const collection = this.getCollection();
        
        // Parse pagination parameters
        const page = parseInt(query.page || '1');
        const pageSize = Math.min(parseInt(query.pageSize || config.DEFAULT_PAGE_SIZE.toString()), config.MAX_PAGE_SIZE);
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
            forms,
            totalCount,
            page,
            pageSize,
            totalPages: Math.ceil(totalCount / pageSize)
        };
    }

    async getFormById(id: string): Promise<GeneratedForm | null> {
        const collection = this.getCollection();
        
        if (!ObjectId.isValid(id)) {
            throw new Error('Invalid form ID format');
        }

        return await collection.findOne({ _id: new ObjectId(id) });
    }

    async searchForms(query: SearchQuery): Promise<{
        forms: GeneratedForm[];
        totalCount: number;
        page: number;
        pageSize: number;
        totalPages: number;
        searchQuery: string;
    }> {
        const collection = this.getCollection();
        const searchQuery = query.search || '';
        
        // Parse pagination parameters
        const page = parseInt(query.page || '1');
        const pageSize = Math.min(parseInt(query.pageSize || config.DEFAULT_PAGE_SIZE.toString()), config.MAX_PAGE_SIZE);
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
            forms,
            totalCount,
            page,
            pageSize,
            totalPages: Math.ceil(totalCount / pageSize),
            searchQuery
        };
    }

    async deleteForm(id: string): Promise<boolean> {
        const collection = this.getCollection();
        
        if (!ObjectId.isValid(id)) {
            throw new Error('Invalid form ID format');
        }

        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount > 0;
    }

    async updateForm(id: string, updateData: Partial<GeneratedForm>): Promise<GeneratedForm | null> {
        const collection = this.getCollection();
        
        if (!ObjectId.isValid(id)) {
            throw new Error('Invalid form ID format');
        }

        const updatedData = {
            ...updateData,
            'metadata.updatedAt': new Date().toISOString()
        };

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updatedData },
            { returnDocument: 'after' }
        );

        return result || null;
    }
}
