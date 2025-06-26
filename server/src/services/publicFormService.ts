import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../database/connection';
import { GeneratedForm } from '../types';
import * as ExcelJS from 'exceljs';

export interface PublicFormSubmission {
  formId: string;
  jsonFingerprint: string;
  submissionData: any;
  submittedAt: string;
}

export interface PublicFormSubmissionDocument {
  _id?: ObjectId;
  formId: string;
  jsonFingerprint: string;
  submissionData: any;
  submittedAt: string;
  createdAt: string;
  userInfo?: {
    userId: string;
    username: string;
    userFullName: string;
  };
}

export class PublicFormService {
  private getFormsCollection(): Collection<GeneratedForm> {
    return getDatabase().collection('generated_form');
  }

  private getSubmissionsCollection(): Collection<PublicFormSubmissionDocument> {
    return getDatabase().collection('public_form_submissions');
  }

  async getPublicForm(formId: string, jsonFingerprint: string): Promise<GeneratedForm | null> {
    try {
      // Validate formId format - formIds are stored as strings
      if (typeof formId !== 'string' || formId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(formId)) {
        console.log(`Invalid formId format: ${formId}`);
        return null;
      }

      const collection = this.getFormsCollection();
      
      // Find form by ID and require verified status
      const form = await collection.findOne({ 
        _id: new ObjectId(formId),
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
      
      // Include blockchain verification information in the response
      const formWithBlockchain = {
        ...form,
        isBlockchainVerified: !!(form.status === 'verified' && form.blockchainInfo?.transactionHash),
        blockchainData: form.blockchainInfo ? {
          transactionHash: form.blockchainInfo.transactionHash,
          blockNumber: form.blockchainInfo.blockNumber,
          verifiedAt: form.blockchainInfo.verifiedAt,
          gasUsed: form.blockchainInfo.gasUsed,
          explorerUrl: form.blockchainInfo.transactionHash ? 
            `https://sepolia.etherscan.io/tx/${form.blockchainInfo.transactionHash}` : null
        } : null
      };
      
      return formWithBlockchain;

    } catch (error: any) {
      console.error('Error getting public form:', error);
      throw new Error(`Failed to get public form: ${error.message}`);
    }
  }

  async getFormsByPdfFingerprint(pdfFingerprint: string): Promise<GeneratedForm[]> {
    try {
      const collection = this.getFormsCollection();
      
      const forms = await collection.find({ 
        pdfFingerprint: pdfFingerprint 
      }).toArray();

      console.log(`Found ${forms.length} forms with PDF fingerprint: ${pdfFingerprint}`);
      return forms;

    } catch (error: any) {
      console.error('Error getting forms by PDF fingerprint:', error);
      throw new Error(`Failed to get forms by PDF fingerprint: ${error.message}`);
    }
  }

  async submitPublicForm(submission: PublicFormSubmission): Promise<{ submissionId: string; submittedAt: string }> {
    try {
      // First verify the form exists, is verified, and is accessible
      const form = await this.getPublicForm(submission.formId, submission.jsonFingerprint);
      
      if (!form) {
        throw new Error('Form not found, not verified, or invalid fingerprint');
      }

      // Extract form creator information from the form metadata
      let userInfo: { userId: string; username: string; userFullName: string } | undefined;
      
      if (form.metadata?.createdBy) {
        const createdBy = form.metadata.createdBy;
        
        // Handle both old format (string) and new format (object)
        if (typeof createdBy === 'string') {
          // Old format: createdBy is just a user ID string
          userInfo = {
            userId: createdBy,
            username: createdBy,
            userFullName: 'Unknown User'
          };
          console.log(`Form creator info retrieved (old format) for form ${submission.formId}:`, userInfo);
        } else if (typeof createdBy === 'object' && createdBy !== null) {
          // New format: createdBy is an object with userId, username, userFullName
          userInfo = {
            userId: createdBy.userId || 'unknown',
            username: createdBy.username || 'unknown',
            userFullName: createdBy.userFullName || 'Unknown User'
          };
          console.log(`Form creator info retrieved (new format) for form ${submission.formId}:`, userInfo);
        } else {
          console.log(`Invalid createdBy format for form ${submission.formId}:`, typeof createdBy);
        }
      } else {
        console.log(`No form creator info found for form ${submission.formId}`);
      }

      // Prepare submission document with form creator's userInfo
      const submissionDocument: PublicFormSubmissionDocument = {
        formId: submission.formId,
        jsonFingerprint: submission.jsonFingerprint,
        submissionData: submission.submissionData,
        submittedAt: submission.submittedAt,
        createdAt: new Date().toISOString(),
        ...(userInfo && { userInfo }) // Include userInfo if available
      };

      const collection = this.getSubmissionsCollection();
      const result = await collection.insertOne(submissionDocument);

      console.log(`Public form submission saved successfully with ID: ${result.insertedId} for form: ${submission.formId}${userInfo ? ` (created by: ${userInfo.userFullName})` : ''}`);

      return {
        submissionId: result.insertedId.toString(),
        submittedAt: submissionDocument.submittedAt
      };

    } catch (error: any) {
      console.error('Error submitting public form:', error);
      throw new Error(`Failed to submit public form: ${error.message}`);
    }
  }

  async getPublicSubmissions(page: number = 1, pageSize: number = 10, search?: string): Promise<{ submissions: any[]; totalCount: number }> {
    try {
      const collection = this.getSubmissionsCollection();
      const formsCollection = this.getFormsCollection();
      
      // Build search query
      let matchQuery: any = {};
      if (search) {
        // Search in form title (we'll need to join with forms collection)
        matchQuery.$or = [
          { 'formTitle': { $regex: search, $options: 'i' } },
          { 'userInfo.userFullName': { $regex: search, $options: 'i' } },
          { 'userInfo.username': { $regex: search, $options: 'i' } }
        ];
      }

      // Aggregate pipeline to join with forms collection and get form titles
      const pipeline = [
        {
          $lookup: {
            from: 'generated_form',
            localField: 'formId',
            foreignField: '_id',
            as: 'formDetails',
            pipeline: [
              { $addFields: { formIdString: { $toString: '$_id' } } }
            ]
          }
        },
        {
          $addFields: {
            formTitle: { $arrayElemAt: ['$formDetails.metadata.formName', 0] },
            formIdObjectId: { $toObjectId: '$formId' }
          }
        },
        ...(Object.keys(matchQuery).length > 0 ? [{ $match: matchQuery }] : []),
        { $sort: { submittedAt: -1 } },
        {
          $facet: {
            submissions: [
              { $skip: (page - 1) * pageSize },
              { $limit: pageSize },
              {
                $project: {
                  _id: 1,
                  formId: 1,
                  formTitle: 1,
                  submissionData: 1,
                  submittedAt: 1,
                  userInfo: 1
                }
              }
            ],
            totalCount: [{ $count: 'count' }]
          }
        }
      ];

      const [result] = await collection.aggregate(pipeline).toArray();
      const submissions = result.submissions || [];
      const totalCount = result.totalCount[0]?.count || 0;

      return { submissions, totalCount };

    } catch (error: any) {
      console.error('Error getting public submissions:', error);
      throw new Error(`Failed to get public submissions: ${error.message}`);
    }
  }

  async getPublicSubmissionsByForm(formId: string, page: number = 1, pageSize: number = 10): Promise<{ submissions: any[]; totalCount: number }> {
    try {
      // Validate formId format - formIds are stored as strings in submissions collection
      if (typeof formId !== 'string' || formId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(formId)) {
        throw new Error('Invalid form ID format - must be a 24-character hexadecimal string');
      }

      const collection = this.getSubmissionsCollection();
      const formsCollection = this.getFormsCollection();

      // Get form details first
      const form = await formsCollection.findOne({ _id: new ObjectId(formId) });

      const pipeline = [
        { $match: { formId: formId } },
        {
          $addFields: {
            formTitle: form?.metadata?.formName || 'Untitled Form'
          }
        },
        { $sort: { submittedAt: -1 } },
        {
          $facet: {
            submissions: [
              { $skip: (page - 1) * pageSize },
              { $limit: pageSize },
              {
                $project: {
                  _id: 1,
                  formId: 1,
                  formTitle: 1,
                  submissionData: 1,
                  submittedAt: 1,
                  userInfo: 1
                }
              }
            ],
            totalCount: [{ $count: 'count' }]
          }
        }
      ];

      const [result] = await collection.aggregate(pipeline).toArray();
      const submissions = result.submissions || [];
      const totalCount = result.totalCount[0]?.count || 0;

      return { submissions, totalCount };

    } catch (error: any) {
      console.error('Error getting public submissions by form:', error);
      throw new Error(`Failed to get public submissions by form: ${error.message}`);
    }
  }

  async getAggregatedPublicSubmissions(): Promise<any[]> {
    try {
      const collection = this.getSubmissionsCollection();
      const formsCollection = this.getFormsCollection();

      const pipeline = [
        {
          $lookup: {
            from: 'generated_form',
            localField: 'formId',
            foreignField: '_id',
            as: 'formDetails',
            pipeline: [
              { $addFields: { formIdString: { $toString: '$_id' } } }
            ]
          }
        },
        {
          $addFields: {
            formTitle: { $arrayElemAt: ['$formDetails.metadata.formName', 0] },
            formCreatedBy: { $arrayElemAt: ['$formDetails.metadata.createdBy', 0] }
          }
        },
        {
          $group: {
            _id: '$formId',
            formTitle: { $first: '$formTitle' },
            formCreatedBy: { $first: '$formCreatedBy' },
            submissionCount: { $sum: 1 },
            latestSubmission: { $max: '$submittedAt' },
            earliestSubmission: { $min: '$submittedAt' },
            submissions: {
              $push: {
                _id: '$_id',
                submissionData: '$submissionData',
                submittedAt: '$submittedAt',
                userInfo: '$userInfo'
              }
            }
          }
        },
        {
          $project: {
            formId: '$_id',
            formTitle: 1,
            formCreatedBy: 1,
            submissionCount: 1,
            latestSubmission: 1,
            earliestSubmission: 1,
            submissions: 1
          }
        },
        { $sort: { submissionCount: -1, latestSubmission: -1 } }
      ];

      const result = await collection.aggregate(pipeline).toArray();
      return result;

    } catch (error: any) {
      console.error('Error getting aggregated public submissions:', error);
      throw new Error(`Failed to get aggregated public submissions: ${error.message}`);
    }
  }

  async getUserPublicSubmissions(userId: string, page: number = 1, pageSize: number = 10, search?: string): Promise<{ submissions: any[]; totalCount: number }> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const collection = this.getSubmissionsCollection();
      const formsCollection = this.getFormsCollection();

      // Build the initial match stage for user filtering
      let matchStage: any = { 'userInfo.userId': userId };
      
      // Add search functionality if provided
      if (search && search.trim()) {
        const searchRegex = { $regex: search.trim(), $options: 'i' };
        matchStage = {
          ...matchStage,
          $or: [
            { formId: searchRegex }
          ]
        };
      }

      const pipeline = [
        { $match: matchStage },
        {
          $addFields: {
            formObjectId: { $toObjectId: '$formId' }
          }
        },
        {
          $lookup: {
            from: 'generated_form',
            localField: 'formObjectId',
            foreignField: '_id',
            as: 'formDetails'
          }
        },
        {
          $addFields: {
            formTitle: { $arrayElemAt: ['$formDetails.metadata.formName', 0] },
            formDescription: { $arrayElemAt: ['$formDetails.metadata.formDescription', 0] }
          }
        },
        { $sort: { submittedAt: -1 } },
        {
          $facet: {
            submissions: [
              { $skip: (page - 1) * pageSize },
              { $limit: pageSize },
              {
                $project: {
                  _id: 1,
                  formId: 1,
                  formTitle: { $ifNull: ['$formTitle', 'Untitled Form'] },
                  formDescription: { $ifNull: ['$formDescription', 'No description available'] },
                  submittedAt: 1,
                  userInfo: 1
                }
              }
            ],
            totalCount: [{ $count: 'count' }]
          }
        }
      ];

      const [result] = await collection.aggregate(pipeline).toArray();
      const submissions = result.submissions || [];
      const totalCount = result.totalCount[0]?.count || 0;

      return { submissions, totalCount };

    } catch (error: any) {
      console.error('Error getting user public submissions:', error);
      throw new Error(`Failed to get user public submissions: ${error.message}`);
    }
  }

  async getUserPublicFormsAggregated(userId: string, page: number = 1, pageSize: number = 10, search: string = ''): Promise<{ forms: any[], totalCount: number }> {
    try {
      const collection = this.getSubmissionsCollection();

      // Build search filter
      const searchFilter: any = {};
      if (search && search.trim()) {
        searchFilter.$or = [
          { 'formDetails.metadata.formName': { $regex: search, $options: 'i' } },
          { 'formDetails.metadata.formDescription': { $regex: search, $options: 'i' } }
        ];
      }

      const pipeline = [
        { $match: { 'userInfo.userId': userId } }, // Fixed: use userInfo.userId instead of userId
        {
          $addFields: {
            formObjectId: { $toObjectId: '$formId' }
          }
        },
        {
          $lookup: {
            from: 'generated_form',
            localField: 'formObjectId',
            foreignField: '_id',
            as: 'formDetails'
          }
        },
        {
          $unwind: {
            path: '$formDetails',
            preserveNullAndEmptyArrays: true
          }
        },
        ...(Object.keys(searchFilter).length > 0 ? [{ $match: searchFilter }] : []),
        {
          $group: {
            _id: '$formId',
            formTitle: { $first: '$formDetails.metadata.formName' },
            formDescription: { $first: '$formDetails.metadata.formDescription' },
            submissionCount: { $sum: 1 },
            latestSubmission: { $max: '$submittedAt' },
            firstSubmission: { $min: '$submittedAt' }
          }
        },
        { $sort: { latestSubmission: -1 } },
        {
          $facet: {
            forms: [
              { $skip: (page - 1) * pageSize },
              { $limit: pageSize },
              {
                $project: {
                  _id: 0,
                  formId: '$_id',
                  formTitle: { $ifNull: ['$formTitle', 'Untitled Form'] },
                  formDescription: { $ifNull: ['$formDescription', 'No description available'] },
                  submissionCount: 1,
                  latestSubmission: 1,
                  firstSubmission: 1
                }
              }
            ],
            totalCount: [{ $count: 'count' }]
          }
        }
      ];

      const [result] = await collection.aggregate(pipeline).toArray();
      const forms = result.forms || [];
      const totalCount = result.totalCount[0]?.count || 0;

      return { forms, totalCount };

    } catch (error: any) {
      console.error('Error getting user aggregated public forms:', error);
      throw new Error(`Failed to get user aggregated public forms: ${error.message}`);
    }
  }

  async exportPublicSubmissionsToExcel(submissions: PublicFormSubmissionDocument[]): Promise<Buffer> {
    try {
      // Create a new workbook and add a worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Public Submissions');

      if (submissions.length === 0) {
        // If no submissions, create a simple header
        worksheet.columns = [
          { header: 'No Data', key: 'noData', width: 30 }
        ];
        worksheet.addRow({ noData: 'No submissions found' });
        const buffer = await workbook.xlsx.writeBuffer() as Buffer;
        return buffer;
      }

      // Collect all unique field names from submission data
      const allFieldNames = new Set<string>();
      submissions.forEach(submission => {
        if (submission.submissionData && typeof submission.submissionData === 'object') {
          Object.keys(submission.submissionData).forEach(fieldName => {
            allFieldNames.add(fieldName);
          });
        }
      });

      // Sort field names for consistency
      const sortedFieldNames = Array.from(allFieldNames).sort();

      // Define base columns
      const baseColumns = [
        { header: 'Submission ID', key: 'submissionId', width: 30 },
        { header: 'Form ID', key: 'formId', width: 30 },
        { header: 'JSON Fingerprint', key: 'jsonFingerprint', width: 50 },
        { header: 'Submitted At', key: 'submittedAt', width: 30 },
        { header: 'User ID', key: 'userId', width: 30 },
        { header: 'Username', key: 'username', width: 30 },
        { header: 'User Full Name', key: 'userFullName', width: 30 }
      ];

      // Add dynamic columns for each form field
      const fieldColumns = sortedFieldNames.map(fieldName => ({
        header: `Field: ${fieldName}`,
        key: `field_${fieldName.replace(/[^a-zA-Z0-9]/g, '_')}`, // Sanitize key for Excel
        width: Math.min(fieldName.length + 10, 50) // Dynamic width based on field name
      }));

      // Combine all columns
      worksheet.columns = [...baseColumns, ...fieldColumns];

      // Add rows to the worksheet
      submissions.forEach(submission => {
        const baseRowData = {
          submissionId: submission._id?.toString(),
          formId: submission.formId,
          jsonFingerprint: submission.jsonFingerprint,
          submittedAt: submission.submittedAt,
          userId: submission.userInfo?.userId,
          username: submission.userInfo?.username,
          userFullName: submission.userInfo?.userFullName
        };

        // Add field data
        const fieldData: any = {};
        sortedFieldNames.forEach(fieldName => {
          const sanitizedKey = `field_${fieldName.replace(/[^a-zA-Z0-9]/g, '_')}`;
          const fieldValue = submission.submissionData?.[fieldName];
          
          // Format the field value for Excel
          if (fieldValue === null || fieldValue === undefined) {
            fieldData[sanitizedKey] = '';
          } else if (typeof fieldValue === 'object') {
            // Handle complex objects (like checkbox groups)
            if (Array.isArray(fieldValue)) {
              fieldData[sanitizedKey] = fieldValue.join(', ');
            } else {
              // For objects, check if it's a checkbox group with true/false values
              const trueKeys = Object.keys(fieldValue).filter(key => fieldValue[key] === true);
              if (trueKeys.length > 0) {
                fieldData[sanitizedKey] = trueKeys.join(', ');
              } else {
                fieldData[sanitizedKey] = JSON.stringify(fieldValue);
              }
            }
          } else if (typeof fieldValue === 'boolean') {
            fieldData[sanitizedKey] = fieldValue ? 'Yes' : 'No';
          } else {
            fieldData[sanitizedKey] = String(fieldValue);
          }
        });

        // Combine base data and field data
        worksheet.addRow({ ...baseRowData, ...fieldData });
      });

      // Auto-fit columns based on content
      worksheet.columns.forEach(column => {
        if (column.values) {
          let maxLength = 10;
          column.values.forEach(value => {
            if (value && typeof value === 'string' && value.length > maxLength) {
              maxLength = value.length;
            }
          });
          column.width = Math.min(maxLength + 2, 50); // Cap at 50 characters
        }
      });

      // Style the header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add borders to all cells
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Write to buffer and return
      const buffer = await workbook.xlsx.writeBuffer() as Buffer;
      return buffer;

    } catch (error: any) {
      console.error('Error exporting public submissions to Excel:', error);
      throw new Error(`Failed to export public submissions to Excel: ${error.message}`);
    }
  }

  async getSubmissionsForExport(formId?: string): Promise<PublicFormSubmissionDocument[]> {
    try {
      const collection = this.getSubmissionsCollection();
      
      let query: any = {};
      if (formId) {
        // Validate formId format (24-character hex string)
        if (typeof formId !== 'string' || formId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(formId)) {
          throw new Error('Invalid formId format. Must be a 24-character hex string.');
        }
        // formIds are stored as strings in submissions collection, not ObjectIds
        query = { formId: formId };
      }

      const submissions = await collection
        .find(query)
        .sort({ submittedAt: -1 })
        .limit(10000) // Limit to 10k records for performance
        .toArray();

      return submissions;

    } catch (error: any) {
      console.error('Error getting submissions for export:', error);
      throw new Error(`Failed to get submissions for export: ${error.message}`);
    }
  }

  async exportSubmissionsToExcel(formId?: string): Promise<Buffer> {
    try {
      console.log('🔍 exportSubmissionsToExcel called with formId:', formId);
      const submissions = await this.getSubmissionsForExport(formId);
      console.log('✅ Got submissions for export:', submissions.length);
      return await this.exportPublicSubmissionsToExcel(submissions);
    } catch (error: any) {
      console.error('Error in export submissions to Excel:', error);
      throw new Error(`Failed to export submissions to Excel: ${error.message}`);
    }
  }
}

export const publicFormService = new PublicFormService();
