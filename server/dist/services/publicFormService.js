"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicFormService = exports.PublicFormService = void 0;
const mongodb_1 = require("mongodb");
const connection_1 = require("../database/connection");
class PublicFormService {
    getFormsCollection() {
        return (0, connection_1.getDatabase)().collection('generated_form');
    }
    getSubmissionsCollection() {
        return (0, connection_1.getDatabase)().collection('public_form_submissions');
    }
    async getPublicForm(formId, jsonFingerprint) {
        try {
            // Validate ObjectId format
            if (!mongodb_1.ObjectId.isValid(formId)) {
                console.log(`Invalid ObjectId format: ${formId}`);
                return null;
            }
            const collection = this.getFormsCollection();
            // Find form by ID and require verified status
            const form = await collection.findOne({
                _id: new mongodb_1.ObjectId(formId),
                status: "verified"
            });
            if (!form) {
                console.log(`Form ${formId} not found or not verified for public access`);
                return null;
            }
            // Validate JSON fingerprint matches what's stored in the form
            const storedFingerprint = form.pdfMetadata?.hashes?.json_fingerprint;
            if (storedFingerprint && storedFingerprint !== jsonFingerprint) {
                console.log(`JSON fingerprint mismatch for form ${formId}. Expected: ${storedFingerprint}, Received: ${jsonFingerprint}`);
                return null;
            }
            console.log(`Verified public form retrieved successfully: ${formId} with fingerprint: ${jsonFingerprint}`);
            return form;
        }
        catch (error) {
            console.error('Error getting public form:', error);
            throw new Error(`Failed to get public form: ${error.message}`);
        }
    }
    async getFormsByPdfFingerprint(pdfFingerprint) {
        try {
            const collection = this.getFormsCollection();
            const forms = await collection.find({
                pdfFingerprint: pdfFingerprint
            }).toArray();
            console.log(`Found ${forms.length} forms with PDF fingerprint: ${pdfFingerprint}`);
            return forms;
        }
        catch (error) {
            console.error('Error getting forms by PDF fingerprint:', error);
            throw new Error(`Failed to get forms by PDF fingerprint: ${error.message}`);
        }
    }
    async submitPublicForm(submission) {
        try {
            // First verify the form exists, is verified, and is accessible
            const form = await this.getPublicForm(submission.formId, submission.jsonFingerprint);
            if (!form) {
                throw new Error('Form not found, not verified, or invalid fingerprint');
            }
            // Prepare submission document
            const submissionDocument = {
                formId: submission.formId,
                jsonFingerprint: submission.jsonFingerprint,
                submissionData: submission.submissionData,
                submittedAt: submission.submittedAt,
                createdAt: new Date().toISOString()
            };
            const collection = this.getSubmissionsCollection();
            const result = await collection.insertOne(submissionDocument);
            console.log(`Public form submission saved successfully with ID: ${result.insertedId} for form: ${submission.formId}`);
            return {
                submissionId: result.insertedId.toString(),
                submittedAt: submissionDocument.submittedAt
            };
        }
        catch (error) {
            console.error('Error submitting public form:', error);
            throw new Error(`Failed to submit public form: ${error.message}`);
        }
    }
}
exports.PublicFormService = PublicFormService;
exports.publicFormService = new PublicFormService();
//# sourceMappingURL=publicFormService.js.map