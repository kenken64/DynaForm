"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formService = exports.FormService = void 0;
const mongodb_1 = require("mongodb");
const connection_1 = require("../database/connection");
class FormService {
    getCollection() {
        return (0, connection_1.getDatabase)().collection('generated_form');
    }
    async saveForm(formRequest, userId) {
        const { formData, fieldConfigurations, originalJson, metadata } = formRequest;
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
        const formDocument = {
            formData,
            fieldConfigurations,
            originalJson,
            metadata: {
                createdAt: new Date().toISOString(),
                formName: metadata?.formName || 'Untitled Form',
                version: '1.0.0',
                createdBy: userId, // Add user ID to track ownership
                ...metadata
            }
        };
        const collection = this.getCollection();
        const result = await collection.insertOne(formDocument);
        console.log(`Form saved successfully with ID: ${result.insertedId} for user: ${userId}`);
        return {
            formId: result.insertedId.toString(),
            savedAt: formDocument.metadata.createdAt
        };
    }
    async getForms(page = 1, pageSize = 10, userId) {
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
    async getFormById(id, userId) {
        const collection = this.getCollection();
        // Create filter to include user ownership verification if userId is provided
        const filter = { _id: new mongodb_1.ObjectId(id) };
        if (userId) {
            filter['metadata.createdBy'] = userId;
        }
        return await collection.findOne(filter);
    }
    async searchForms(searchQuery, page = 1, pageSize = 10, userId) {
        const collection = this.getCollection();
        const skip = (page - 1) * pageSize;
        // Create search filter
        const searchFilter = {};
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
            }
            else {
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
    async updateForm(id, updateData, userId) {
        const collection = this.getCollection();
        // Create filter to include user ownership verification if userId is provided
        const filter = { _id: new mongodb_1.ObjectId(id) };
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
        const result = await collection.findOneAndUpdate(filter, { $set: updateData }, { returnDocument: 'after' });
        return result || null;
    }
    async deleteForm(id, userId) {
        const collection = this.getCollection();
        // Create filter to include user ownership verification if userId is provided
        const filter = { _id: new mongodb_1.ObjectId(id) };
        if (userId) {
            filter['metadata.createdBy'] = userId;
        }
        const result = await collection.deleteOne(filter);
        return result.deletedCount > 0;
    }
}
exports.FormService = FormService;
exports.formService = new FormService();
//# sourceMappingURL=formService.js.map