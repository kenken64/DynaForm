"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recipientGroupService = exports.RecipientGroupService = void 0;
const mongodb_1 = require("mongodb");
const connection_1 = require("../database/connection");
class RecipientGroupService {
    getCollection() {
        return (0, connection_1.getDatabase)().collection('recipientGroups');
    }
    getRecipientsCollection() {
        return (0, connection_1.getDatabase)().collection('recipients');
    }
    async createRecipientGroup(groupData, userId) {
        // Validate required fields
        if (!groupData.aliasName?.trim()) {
            throw new Error('Alias name is required');
        }
        if (!groupData.recipientIds || groupData.recipientIds.length === 0) {
            throw new Error('At least one recipient must be selected');
        }
        // Check if alias name already exists for this user
        const existingGroup = await this.getCollection().findOne({
            aliasName: groupData.aliasName.toLowerCase().trim(),
            createdBy: userId
        });
        if (existingGroup) {
            throw new Error('A group with this alias name already exists');
        }
        // Validate that all recipient IDs exist and belong to the user
        const recipientObjectIds = groupData.recipientIds.map(id => {
            try {
                return new mongodb_1.ObjectId(id);
            }
            catch (error) {
                throw new Error(`Invalid recipient ID: ${id}`);
            }
        });
        const validRecipients = await this.getRecipientsCollection().find({
            _id: { $in: recipientObjectIds },
            createdBy: userId
        }).toArray();
        if (validRecipients.length !== groupData.recipientIds.length) {
            throw new Error('One or more recipient IDs are invalid or do not belong to you');
        }
        const now = new Date().toISOString();
        const recipientGroup = {
            aliasName: groupData.aliasName.trim(),
            description: groupData.description?.trim() || '',
            recipientIds: groupData.recipientIds,
            createdAt: now,
            updatedAt: now,
            createdBy: userId
        };
        const collection = this.getCollection();
        const result = await collection.insertOne(recipientGroup);
        console.log(`Recipient group created successfully with ID: ${result.insertedId} for user: ${userId}`);
        // Return the created group with the _id
        return {
            ...recipientGroup,
            _id: result.insertedId.toString()
        };
    }
    async getRecipientGroups(page = 1, pageSize = 10, userId, search) {
        const skip = (page - 1) * pageSize;
        const collection = this.getCollection();
        // Build search filter
        const baseFilter = { createdBy: userId };
        if (search?.trim()) {
            const searchRegex = { $regex: search.trim(), $options: 'i' };
            baseFilter.$or = [
                { aliasName: searchRegex },
                { description: searchRegex }
            ];
        }
        // Get total count
        const totalCount = await collection.countDocuments(baseFilter);
        // Get paginated groups
        const groups = await collection
            .find(baseFilter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .toArray();
        const totalPages = Math.ceil(totalCount / pageSize);
        return {
            success: true,
            count: totalCount,
            page,
            pageSize,
            totalPages,
            data: groups.map(group => ({
                ...group,
                _id: group._id.toString()
            }))
        };
    }
    async getRecipientGroup(groupId, userId) {
        let objectId;
        try {
            objectId = new mongodb_1.ObjectId(groupId);
        }
        catch (error) {
            throw new Error('Invalid group ID format');
        }
        const collection = this.getCollection();
        const group = await collection.findOne({
            _id: objectId,
            createdBy: userId
        });
        if (!group) {
            throw new Error('Recipient group not found');
        }
        return {
            ...group,
            _id: group._id.toString()
        };
    }
    async updateRecipientGroup(groupId, updates, userId) {
        let objectId;
        try {
            objectId = new mongodb_1.ObjectId(groupId);
        }
        catch (error) {
            throw new Error('Invalid group ID format');
        }
        // Check if group exists and belongs to user
        const existingGroup = await this.getRecipientGroup(groupId, userId);
        // Validate alias name if provided
        if (updates.aliasName?.trim()) {
            const duplicateGroup = await this.getCollection().findOne({
                aliasName: updates.aliasName.toLowerCase().trim(),
                createdBy: userId,
                _id: { $ne: objectId }
            });
            if (duplicateGroup) {
                throw new Error('A group with this alias name already exists');
            }
        }
        // Validate recipient IDs if provided
        if (updates.recipientIds && updates.recipientIds.length > 0) {
            const recipientObjectIds = updates.recipientIds.map(id => {
                try {
                    return new mongodb_1.ObjectId(id);
                }
                catch (error) {
                    throw new Error(`Invalid recipient ID: ${id}`);
                }
            });
            const validRecipients = await this.getRecipientsCollection().find({
                _id: { $in: recipientObjectIds },
                createdBy: userId
            }).toArray();
            if (validRecipients.length !== updates.recipientIds.length) {
                throw new Error('One or more recipient IDs are invalid or do not belong to you');
            }
        }
        // Build update object
        const updateData = {
            updatedAt: new Date().toISOString()
        };
        if (updates.aliasName?.trim()) {
            updateData.aliasName = updates.aliasName.trim();
        }
        if (updates.description !== undefined) {
            updateData.description = updates.description?.trim() || '';
        }
        if (updates.recipientIds && updates.recipientIds.length > 0) {
            updateData.recipientIds = updates.recipientIds;
        }
        const collection = this.getCollection();
        const result = await collection.updateOne({ _id: objectId, createdBy: userId }, { $set: updateData });
        if (result.matchedCount === 0) {
            throw new Error('Recipient group not found');
        }
        console.log(`Recipient group updated successfully: ${groupId} for user: ${userId}`);
        // Return updated group
        return await this.getRecipientGroup(groupId, userId);
    }
    async deleteRecipientGroup(groupId, userId) {
        let objectId;
        try {
            objectId = new mongodb_1.ObjectId(groupId);
        }
        catch (error) {
            throw new Error('Invalid group ID format');
        }
        const collection = this.getCollection();
        const result = await collection.deleteOne({
            _id: objectId,
            createdBy: userId
        });
        if (result.deletedCount === 0) {
            throw new Error('Recipient group not found');
        }
        console.log(`Recipient group deleted successfully: ${groupId} for user: ${userId}`);
    }
    async searchByAlias(aliasName, userId) {
        if (!aliasName?.trim()) {
            return [];
        }
        const collection = this.getCollection();
        const searchRegex = { $regex: aliasName.trim(), $options: 'i' };
        const groups = await collection
            .find({
            aliasName: searchRegex,
            createdBy: userId
        })
            .sort({ aliasName: 1 })
            .toArray();
        return groups.map(group => ({
            ...group,
            _id: group._id.toString()
        }));
    }
    async getGroupsWithRecipients(userId) {
        const collection = this.getCollection();
        const recipientsCollection = this.getRecipientsCollection();
        // Get all groups for the user
        const groups = await collection
            .find({ createdBy: userId })
            .sort({ aliasName: 1 })
            .toArray();
        // For each group, populate recipient details
        const groupsWithRecipients = await Promise.all(groups.map(async (group) => {
            const recipientObjectIds = group.recipientIds.map(id => new mongodb_1.ObjectId(id));
            const recipients = await recipientsCollection
                .find({ _id: { $in: recipientObjectIds } })
                .toArray();
            return {
                ...group,
                _id: group._id.toString(),
                recipients: recipients.map(recipient => ({
                    ...recipient,
                    _id: recipient._id.toString()
                }))
            };
        }));
        return groupsWithRecipients;
    }
}
exports.RecipientGroupService = RecipientGroupService;
exports.recipientGroupService = new RecipientGroupService();
//# sourceMappingURL=recipientGroupService.js.map