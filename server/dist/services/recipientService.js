"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recipientService = exports.RecipientService = void 0;
const mongodb_1 = require("mongodb");
const connection_1 = require("../database/connection");
class RecipientService {
    getCollection() {
        return (0, connection_1.getDatabase)().collection('recipients');
    }
    async createRecipient(recipientData, userId) {
        // Validate required fields
        if (!recipientData.name?.trim()) {
            throw new Error('Recipient name is required');
        }
        if (!recipientData.email?.trim()) {
            throw new Error('Recipient email is required');
        }
        if (!recipientData.jobTitle?.trim()) {
            throw new Error('Job title is required');
        }
        if (!recipientData.companyName?.trim()) {
            throw new Error('Company name is required');
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipientData.email)) {
            throw new Error('Invalid email format');
        }
        // Check if email already exists
        const existingRecipient = await this.getCollection().findOne({
            email: recipientData.email.toLowerCase().trim(),
            createdBy: userId
        });
        if (existingRecipient) {
            throw new Error('A recipient with this email already exists');
        }
        const now = new Date().toISOString();
        const recipient = {
            name: recipientData.name.trim(),
            jobTitle: recipientData.jobTitle.trim(),
            email: recipientData.email.toLowerCase().trim(),
            companyName: recipientData.companyName.trim(),
            createdAt: now,
            updatedAt: now,
            createdBy: userId
        };
        const collection = this.getCollection();
        const result = await collection.insertOne(recipient);
        console.log(`Recipient created successfully with ID: ${result.insertedId} for user: ${userId}`);
        // Return the created recipient with the _id
        return {
            ...recipient,
            _id: result.insertedId.toString()
        };
    }
    async getRecipients(page = 1, pageSize = 10, userId, search) {
        const skip = (page - 1) * pageSize;
        const collection = this.getCollection();
        // Build search filter
        const baseFilter = { createdBy: userId };
        if (search?.trim()) {
            const searchRegex = { $regex: search.trim(), $options: 'i' };
            baseFilter.$or = [
                { name: searchRegex },
                { jobTitle: searchRegex },
                { email: searchRegex },
                { companyName: searchRegex }
            ];
        }
        // Get total count
        const totalCount = await collection.countDocuments(baseFilter);
        // Get paginated recipients
        const recipients = await collection
            .find(baseFilter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .toArray();
        return {
            success: true,
            count: totalCount,
            page,
            pageSize,
            totalPages: Math.ceil(totalCount / pageSize),
            data: recipients
        };
    }
    async getRecipient(id, userId) {
        if (!mongodb_1.ObjectId.isValid(id)) {
            throw new Error('Invalid recipient ID format');
        }
        const collection = this.getCollection();
        const recipient = await collection.findOne({
            _id: new mongodb_1.ObjectId(id),
            createdBy: userId
        });
        if (!recipient) {
            throw new Error('Recipient not found or access denied');
        }
        return recipient;
    }
    async updateRecipient(id, updates, userId) {
        if (!mongodb_1.ObjectId.isValid(id)) {
            throw new Error('Invalid recipient ID format');
        }
        // Validate updates
        if (updates.email && !updates.email.trim()) {
            throw new Error('Email cannot be empty');
        }
        if (updates.name && !updates.name.trim()) {
            throw new Error('Name cannot be empty');
        }
        if (updates.jobTitle && !updates.jobTitle.trim()) {
            throw new Error('Job title cannot be empty');
        }
        if (updates.companyName && !updates.companyName.trim()) {
            throw new Error('Company name cannot be empty');
        }
        // Validate email format if provided
        if (updates.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updates.email)) {
                throw new Error('Invalid email format');
            }
            // Check if email already exists (excluding current recipient)
            const existingRecipient = await this.getCollection().findOne({
                email: updates.email.toLowerCase().trim(),
                createdBy: userId,
                _id: { $ne: new mongodb_1.ObjectId(id) }
            });
            if (existingRecipient) {
                throw new Error('A recipient with this email already exists');
            }
        }
        const collection = this.getCollection();
        // Prepare update document
        const updateDoc = {
            updatedAt: new Date().toISOString()
        };
        if (updates.name)
            updateDoc.name = updates.name.trim();
        if (updates.jobTitle)
            updateDoc.jobTitle = updates.jobTitle.trim();
        if (updates.email)
            updateDoc.email = updates.email.toLowerCase().trim();
        if (updates.companyName)
            updateDoc.companyName = updates.companyName.trim();
        const result = await collection.findOneAndUpdate({ _id: new mongodb_1.ObjectId(id), createdBy: userId }, { $set: updateDoc }, { returnDocument: 'after' });
        if (!result) {
            throw new Error('Recipient not found or access denied');
        }
        console.log(`Recipient updated successfully: ${id} for user: ${userId}`);
        return result;
    }
    async deleteRecipient(id, userId) {
        if (!mongodb_1.ObjectId.isValid(id)) {
            throw new Error('Invalid recipient ID format');
        }
        const collection = this.getCollection();
        const result = await collection.deleteOne({
            _id: new mongodb_1.ObjectId(id),
            createdBy: userId
        });
        if (result.deletedCount === 0) {
            throw new Error('Recipient not found or access denied');
        }
        console.log(`Recipient deleted successfully: ${id} for user: ${userId}`);
        return true;
    }
    async exportRecipients(userId) {
        const collection = this.getCollection();
        const recipients = await collection
            .find({ createdBy: userId })
            .sort({ name: 1 })
            .toArray();
        return recipients;
    }
}
exports.RecipientService = RecipientService;
exports.recipientService = new RecipientService();
//# sourceMappingURL=recipientService.js.map