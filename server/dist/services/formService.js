"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.formService = exports.FormService = void 0;
const mongodb_1 = require("mongodb");
const connection_1 = require("../database/connection");
const crypto = __importStar(require("crypto"));
class FormService {
    getCollection() {
        return (0, connection_1.getDatabase)().collection('generated_form');
    }
    /**
     * Generate a JSON fingerprint from form data for forms created without PDF upload
     * This provides consistent fingerprint generation similar to the AI agent's implementation
     */
    generateJsonFingerprint(formData) {
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
        }
        catch (error) {
            console.error('Error generating JSON fingerprint:', error);
            // Fallback to a simple hash of current timestamp and random data
            const fallbackData = `form_${Date.now()}_${Math.random()}`;
            return crypto.createHash('sha256').update(fallbackData, 'utf8').digest('hex');
        }
    }
    /**
     * Generate a short ID from a hash (first 8 characters)
     */
    generateShortId(hash) {
        return hash.substring(0, 8);
    }
    /**
     * Generate PDF metadata and fingerprint for forms created without PDF upload
     */
    generateFormMetadata(formData) {
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
    async saveForm(formRequest, userId) {
        const { formData, fieldConfigurations, originalJson, metadata, pdfMetadata, pdfFingerprint } = formRequest;
        // Validate required fields
        if (!formData || !Array.isArray(formData)) {
            throw new Error('Invalid form data. Expected formData to be an array.');
        }
        if (!fieldConfigurations || typeof fieldConfigurations !== 'object') {
            throw new Error('Invalid field configurations. Expected fieldConfigurations to be an object.');
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
                // Use the user metadata from the request if provided, otherwise fallback to userId
                ...(metadata?.createdBy ? { createdBy: metadata.createdBy } :
                    userId ? { createdBy: { userId, username: userId, userFullName: 'Unknown User' } } : {}),
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
        const createdByUserId = formDocument.metadata.createdBy?.userId || userId || 'anonymous';
        console.log(`Form saved successfully with ID: ${result.insertedId} for user: ${createdByUserId}${formDocument.pdfFingerprint ? ` with fingerprint: ${formDocument.pdfFingerprint}` : ''}`);
        return {
            formId: result.insertedId.toString(),
            savedAt: formDocument.metadata.createdAt
        };
    }
    async getForms(page = 1, pageSize = 10, userId) {
        const collection = this.getCollection();
        const skip = (page - 1) * pageSize;
        // Create filter for user-specific forms - support both old and new format
        const filter = userId ? {
            $or: [
                { 'metadata.createdBy.userId': userId }, // New format
                { 'metadata.createdBy': userId } // Old format for backward compatibility
            ]
        } : {};
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
            filter.$or = [
                { 'metadata.createdBy.userId': userId }, // New format
                { 'metadata.createdBy': userId } // Old format for backward compatibility
            ];
        }
        return await collection.findOne(filter);
    }
    async searchForms(searchQuery, page = 1, pageSize = 10, userId) {
        const collection = this.getCollection();
        const skip = (page - 1) * pageSize;
        // Create search filter
        const searchFilter = {};
        // Add user ownership filter if userId is provided - support both old and new format
        if (userId) {
            searchFilter.$or = [
                { 'metadata.createdBy.userId': userId }, // New format
                { 'metadata.createdBy': userId } // Old format for backward compatibility
            ];
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
                    {
                        $or: [
                            { 'metadata.createdBy.userId': userId }, // New format
                            { 'metadata.createdBy': userId } // Old format for backward compatibility
                        ]
                    },
                    textSearchFilter
                ];
                delete searchFilter.$or; // Remove duplicate
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
    async updateForm(id, updateData, userId, userInfo) {
        const collection = this.getCollection();
        // Create filter to include user ownership verification if userId is provided
        const filter = { _id: new mongodb_1.ObjectId(id) };
        if (userId) {
            filter.$or = [
                { 'metadata.createdBy.userId': userId }, // New format
                { 'metadata.createdBy': userId } // Old format for backward compatibility
            ];
        }
        // Prepare update object
        const updateObject = { ...updateData };
        // If updating metadata, ensure we preserve existing metadata fields and add updatedBy
        if (updateData.metadata) {
            updateObject.metadata = {
                ...updateData.metadata,
                updatedAt: new Date().toISOString(),
                // Add user info for who updated the form
                ...(userInfo ? { updatedBy: userInfo } :
                    userId ? { updatedBy: { userId, username: userId, userFullName: 'Unknown User' } } : {})
            };
        }
        else if (userId || userInfo) {
            // If no metadata update but we have user info, add the updatedBy field using $set for specific fields
            updateObject['metadata.updatedAt'] = new Date().toISOString();
            if (userInfo) {
                updateObject['metadata.updatedBy'] = userInfo;
            }
            else if (userId) {
                updateObject['metadata.updatedBy'] = { userId, username: userId, userFullName: 'Unknown User' };
            }
        }
        const result = await collection.findOneAndUpdate(filter, { $set: updateObject }, { returnDocument: 'after' });
        return result || null;
    }
    async deleteForm(id, userId) {
        const collection = this.getCollection();
        // Create filter to include user ownership verification if userId is provided
        const filter = { _id: new mongodb_1.ObjectId(id) };
        if (userId) {
            filter.$or = [
                { 'metadata.createdBy.userId': userId }, // New format
                { 'metadata.createdBy': userId } // Old format for backward compatibility
            ];
        }
        const result = await collection.deleteOne(filter);
        return result.deletedCount > 0;
    }
    async getFormsByPdfFingerprint(pdfFingerprint, userId) {
        const collection = this.getCollection();
        // Create filter for PDF fingerprint and user ownership
        const filter = { pdfFingerprint };
        if (userId) {
            filter.$or = [
                { 'metadata.createdBy.userId': userId }, // New format
                { 'metadata.createdBy': userId } // Old format for backward compatibility
            ];
        }
        const forms = await collection
            .find(filter)
            .sort({ 'metadata.createdAt': -1 })
            .toArray();
        console.log(`Found ${forms.length} forms with PDF fingerprint: ${pdfFingerprint}${userId ? ` for user: ${userId}` : ''}`);
        return forms;
    }
    async verifyFormStatus(formId) {
        try {
            const collection = this.getCollection();
            const form = await collection.findOne({ _id: new mongodb_1.ObjectId(formId) });
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
        }
        catch (error) {
            console.error('Error verifying form status:', error);
            return {
                success: false,
                error: 'Internal server error',
                message: error.message
            };
        }
    }
}
exports.FormService = FormService;
exports.formService = new FormService();
//# sourceMappingURL=formService.js.map