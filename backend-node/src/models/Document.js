const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['report', 'research_paper', 'researchPaper', 'book_chapter', 'bookChapter', 'presentation', 'viva_questions', 'full_documentation', 'readme', 'ppt_content']
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  format: {
    type: String,
    enum: ['markdown', 'json', 'html', 'text'],
    default: 'json'
  },
  version: {
    type: Number,
    default: 1
  },
  generatedBy: {
    type: String,
    default: 'documentation_agent'
  },
  metadata: {
    wordCount: Number,
    sections: [String],
    exportedAt: Date
  }
}, {
  timestamps: true
});

documentSchema.index({ projectId: 1, type: 1 });
documentSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
