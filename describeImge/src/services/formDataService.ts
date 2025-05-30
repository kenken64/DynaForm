import { Collection } from 'mongodb';
import { getDatabase } from '../database/connection';
import { FormDataSubmission, PaginationQuery } from '../types';
import config from '../config';

export class FormDataService {
    private getCollection(): Collection<FormDataSubmission> {
        return getDatabase().collection<FormDataSubmission>('forms_data');
    }

    async saveFormData(data: {
        formId: string;
        formData: Record<string, any>;
        formTitle?: string;
        userInfo?: { userId?: string; [key: string]: any };
        submissionMetadata?: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<{ isNewSubmission: boolean; submittedAt: string }> {
        const { formId, formData, formTitle, userInfo, submissionMetadata, ipAddress, userAgent } = data;

        if (!formId) {
            throw new Error('Form ID is required');
        }

        if (!formData || typeof formData !== 'object') {
            throw new Error('Invalid form data. Expected formData to be an object.');
        }

        // Prepare document for upsert
        const formDataDocument: FormDataSubmission = {
            formId: formId,
            formTitle: formTitle || undefined,
            formData: formData,
            userInfo: userInfo || undefined,
            submissionMetadata: {
                submittedAt: new Date().toISOString(),
                ipAddress: ipAddress || 'unknown',
                userAgent: userAgent || 'unknown',
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

    async getFormData(formId: string, userId?: string): Promise<FormDataSubmission | null> {
        const collection = this.getCollection();
        
        // Build filter
        const filter: any = { formId: formId };
        if (userId) {
            filter['userInfo.userId'] = userId;
        }

        return await collection.findOne(filter);
    }

    async getFormSubmissions(formId: string, query: PaginationQuery): Promise<{
        submissions: FormDataSubmission[];
        totalCount: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        const collection = this.getCollection();
        
        const page = parseInt(query.page || '1');
        const pageSize = Math.min(parseInt(query.pageSize || config.DEFAULT_PAGE_SIZE.toString()), config.MAX_PAGE_SIZE);
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
            submissions,
            totalCount,
            page,
            pageSize,
            totalPages: Math.ceil(totalCount / pageSize)
        };
    }

    async deleteFormData(formId: string, userId?: string): Promise<boolean> {
        const collection = this.getCollection();
        
        const filter: any = { formId: formId };
        if (userId) {
            filter['userInfo.userId'] = userId;
        }

        const result = await collection.deleteOne(filter);
        return result.deletedCount > 0;
    }

    async deleteAllFormSubmissions(formId: string): Promise<number> {
        const collection = this.getCollection();
        const result = await collection.deleteMany({ formId: formId });
        return result.deletedCount;
    }
}
