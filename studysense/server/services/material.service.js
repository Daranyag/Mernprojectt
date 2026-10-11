const mongoose = require('mongoose');
const { StudyMaterial } = require('../models/StudyMaterial');
const Subject = require('../models/Subject');
const { Topic } = require('../models/Topic');

/**
 * Service handling Study Materials business logic and persistence
 */
class MaterialService {
  /**
   * Helper to verify subject ownership
   */
  async verifySubject(userId, subjectId) {
    const subject = await Subject.findOne({ _id: subjectId, user: userId });
    if (!subject) {
      const error = new Error('Subject not found or does not belong to your account');
      error.statusCode = 404;
      throw error;
    }
    return subject;
  }

  /**
   * Resolve an existing topic by ID or title, or create a new topic if typed by user
   */
  async resolveOrCreateTopic(userId, subjectId, topicInput, unit = '') {
    if (!topicInput) return null;
    const str = String(topicInput).trim();
    if (!str || str === 'null' || str === 'undefined' || str === 'general' || str === 'none') {
      return null;
    }

    // If valid ObjectId, check if it already exists under this subject
    if (mongoose.Types.ObjectId.isValid(str)) {
      const existingById = await Topic.findOne({ _id: str, user: userId, subject: subjectId });
      if (existingById) return existingById;
    }

    // Try finding by exact/case-insensitive title under subject
    const safeTitle = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let topic = await Topic.findOne({
      user: userId,
      subject: subjectId,
      title: { $regex: new RegExp(`^${safeTitle}$`, 'i') },
    });

    // If not found, create the new topic directly under this subject
    if (!topic) {
      topic = await Topic.create({
        user: userId,
        subject: subjectId,
        title: str,
        unit: unit ? unit.trim() : '',
        status: 'In Progress',
        priority: 'Medium',
      });
    }

    return topic;
  }

  /**
   * Create a new study material (note or resource)
   */
  async createMaterial(userId, data) {
    const {
      type,
      title,
      subject,
      topic = null,
      customTopic = '',
      unit = '',
      content = '',
      url = '',
      fileName = '',
      fileSize = 0,
      pageCount = 0,
      tags = [],
      isFavorite = false
    } = data;

    // Verify subject exists and is owned
    await this.verifySubject(userId, subject);

    // Resolve topic by ID, typed string, or customTopic
    const topicToResolve = customTopic || topic;
    const resolvedTopic = await this.resolveOrCreateTopic(userId, subject, topicToResolve, unit);

    const material = await StudyMaterial.create({
      user: userId,
      subject,
      topic: resolvedTopic ? resolvedTopic._id : null,
      unit: unit ? unit.trim() : (resolvedTopic?.unit || ''),
      type,
      title: title.trim(),
      content: content ? content.trim() : '',
      url: url ? url.trim() : '',
      fileName: fileName ? fileName.trim() : '',
      fileSize: Number(fileSize) || 0,
      pageCount: Number(pageCount) || 0,
      tags: Array.isArray(tags) ? tags : [],
      isFavorite: Boolean(isFavorite),
      isReviewed: false,
    });

    const populated = await StudyMaterial.findById(material._id)
      .populate('subject', 'name color')
      .populate('topic', 'title status priority unit');

    return populated.toSafeObject();
  }

  /**
   * List materials for authenticated user with filters, search, and sorting
   */
  async getMaterials(userId, queryParams = {}) {
    const {
      subject,
      topic,
      type,
      favorite,
      reviewed,
      search,
      sort = 'newest',
      page = 1,
      limit = 50,
    } = queryParams;

    const filter = { user: new mongoose.Types.ObjectId(userId) };

    if (subject && mongoose.Types.ObjectId.isValid(subject)) {
      filter.subject = new mongoose.Types.ObjectId(subject);
    }

    if (topic) {
      if (topic === 'general' || topic === 'none' || topic === 'overall') {
        filter.topic = null;
      } else if (mongoose.Types.ObjectId.isValid(topic)) {
        filter.topic = new mongoose.Types.ObjectId(topic);
      }
    }

    if (type && ['note', 'resource', 'pdf'].includes(type.toLowerCase())) {
      filter.type = type.toLowerCase();
    }

    if (favorite !== undefined && favorite !== '') {
      filter.isFavorite = favorite === 'true' || favorite === true;
    }

    if (reviewed !== undefined && reviewed !== '') {
      filter.isReviewed = reviewed === 'true' || reviewed === true;
    }

    if (search && search.trim().length > 0) {
      const term = search.trim();
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { content: { $regex: term, $options: 'i' } },
        { tags: { $in: [new RegExp(term, 'i')] } },
      ];
    }

    // Determine sort order
    let sortObj = { createdAt: -1 };
    if (sort === 'oldest') {
      sortObj = { createdAt: 1 };
    } else if (sort === 'title') {
      sortObj = { title: 1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [materials, totalCount] = await Promise.all([
      StudyMaterial.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('subject', 'name color')
        .populate('topic', 'title status priority'),
      StudyMaterial.countDocuments(filter),
    ]);

    return {
      materials: materials.map((m) => m.toSafeObject()),
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
      },
    };
  }

  /**
   * Get single material by ID
   */
  async getMaterialById(userId, materialId) {
    const material = await StudyMaterial.findOne({ _id: materialId, user: userId })
      .populate('subject', 'name color')
      .populate('topic', 'title status priority');

    if (!material) {
      const error = new Error('Study material not found');
      error.statusCode = 404;
      throw error;
    }

    return material.toSafeObject();
  }

  /**
   * Update an owned study material
   */
  async updateMaterial(userId, materialId, updateData) {
    const material = await StudyMaterial.findOne({ _id: materialId, user: userId });
    if (!material) {
      const error = new Error('Study material not found');
      error.statusCode = 404;
      throw error;
    }

    // If changing subject or topic, verify ownership and resolve topic
    const targetSubject = updateData.subject || material.subject;
    if (updateData.subject) {
      await this.verifySubject(userId, targetSubject);
      material.subject = targetSubject;
    }

    if (updateData.topic !== undefined || updateData.customTopic !== undefined) {
      const topicToResolve = updateData.customTopic || updateData.topic;
      const resolvedTopic = await this.resolveOrCreateTopic(userId, targetSubject, topicToResolve, updateData.unit || material.unit);
      material.topic = resolvedTopic ? resolvedTopic._id : null;
      if (resolvedTopic?.unit && !updateData.unit) {
        material.unit = resolvedTopic.unit;
      }
    }

    if (updateData.title !== undefined) material.title = updateData.title.trim();
    if (updateData.unit !== undefined) material.unit = updateData.unit ? updateData.unit.trim() : '';
    if (updateData.content !== undefined) material.content = updateData.content.trim();
    if (updateData.url !== undefined) material.url = updateData.url.trim();
    if (updateData.fileName !== undefined) material.fileName = updateData.fileName.trim();
    if (updateData.fileSize !== undefined) material.fileSize = Number(updateData.fileSize) || 0;
    if (updateData.pageCount !== undefined) material.pageCount = Number(updateData.pageCount) || 0;
    if (updateData.tags !== undefined && Array.isArray(updateData.tags)) material.tags = updateData.tags;
    if (updateData.type !== undefined) material.type = updateData.type;
    if (updateData.isFavorite !== undefined) material.isFavorite = Boolean(updateData.isFavorite);
    if (updateData.isReviewed !== undefined) material.isReviewed = Boolean(updateData.isReviewed);

    await material.save();

    const populated = await StudyMaterial.findById(material._id)
      .populate('subject', 'name color')
      .populate('topic', 'title status priority unit');

    return populated.toSafeObject();
  }

  /**
   * Delete an owned material
   */
  async deleteMaterial(userId, materialId) {
    const material = await StudyMaterial.findOne({ _id: materialId, user: userId });
    if (!material) {
      const error = new Error('Study material not found');
      error.statusCode = 404;
      throw error;
    }

    await StudyMaterial.deleteOne({ _id: materialId, user: userId });

    return {
      id: materialId,
      title: material.title,
      type: material.type,
    };
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(userId, materialId) {
    const material = await StudyMaterial.findOne({ _id: materialId, user: userId });
    if (!material) {
      const error = new Error('Study material not found');
      error.statusCode = 404;
      throw error;
    }

    material.isFavorite = !material.isFavorite;
    await material.save();

    return {
      id: material._id.toString(),
      isFavorite: material.isFavorite,
    };
  }

  /**
   * Toggle reviewed status
   */
  async toggleReviewed(userId, materialId) {
    const material = await StudyMaterial.findOne({ _id: materialId, user: userId });
    if (!material) {
      const error = new Error('Study material not found');
      error.statusCode = 404;
      throw error;
    }

    material.isReviewed = !material.isReviewed;
    await material.save();

    return {
      id: material._id.toString(),
      isReviewed: material.isReviewed,
    };
  }
}

module.exports = new MaterialService();
