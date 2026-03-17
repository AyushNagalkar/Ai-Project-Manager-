'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { membersAPI } from '@/lib/api';

export default function TeamManagementPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Resume upload
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    contact: '',
    skills: '',
    password: ''
  });

  useEffect(() => {
    loadMembers();
  }, [projectId]);

  const loadMembers = async () => {
    try {
      const response = await membersAPI.getAll(projectId);
      setMembers(response.data);
    } catch (error: any) {
      console.error('Error loading members:', error);
      setError(error.response?.data?.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setError('');

    try {
      await membersAPI.add(projectId, {
        name: formData.name,
        email: formData.email,
        age: formData.age ? parseInt(formData.age) : undefined,
        contact: formData.contact || undefined,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        password: formData.password || undefined
      });

      setSuccess(`${formData.name} added to the team!`);
      setFormData({ name: '', email: '', age: '', contact: '', skills: '', password: '' });
      setShowAddForm(false);
      await loadMembers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add member');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from the team?`)) return;

    try {
      await membersAPI.remove(projectId, userId);
      setSuccess(`${name} removed from the team`);
      await loadMembers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    setResumeLoading(true);
    setError('');

    try {
      const response = await membersAPI.uploadResume(projectId, resumeFile);
      setExtractedData(response.data.extracted);
      
      // Pre-fill the form with extracted data
      const extracted = response.data.extracted;
      setFormData(prev => ({
        ...prev,
        name: extracted.name || prev.name,
        email: extracted.email || prev.email,
        contact: extracted.contact || prev.contact,
        skills: extracted.skills ? extracted.skills.join(', ') : prev.skills
      }));
      
      setShowAddForm(true);
      setSuccess('Resume parsed successfully! Form pre-filled with extracted data.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to parse resume. Make sure the OCR service is running.');
    } finally {
      setResumeLoading(false);
      setResumeFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-bg p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push(`/projects/${projectId}`)}
          className="text-blue-500 hover:text-blue-400 mb-6 flex items-center gap-2 text-sm"
        >
          ← Back to Project
        </button>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-heading">👥 Team Management</h1>
            <p className="text-dim mt-1">{members.length} team member{members.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary"
            >
              + Add Member
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-400">✕</button>
          </div>
        )}
        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-6">
            ✅ {success}
          </div>
        )}

        {/* Resume Upload Section */}
        <div className="card p-6 mb-6 !border-dashed !border-2">
          <h3 className="text-lg font-bold text-heading mb-3">📄 Upload Resume (PDF)</h3>
          <p className="text-dim text-sm mb-4">Upload a team member's resume to auto-extract name, email, skills, and contact info.</p>
          <div className="flex gap-3 items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="flex-1 text-sm rounded-lg p-2 input-field"
            />
            <button
              onClick={handleResumeUpload}
              disabled={!resumeFile || resumeLoading}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:bg-purple-300 transition flex items-center gap-2"
            >
              {resumeLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {resumeLoading ? 'Parsing...' : 'Parse Resume'}
            </button>
          </div>
          {extractedData && (
            <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Extracted Data:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {extractedData.name && <div><strong>Name:</strong> {extractedData.name}</div>}
                {extractedData.email && <div><strong>Email:</strong> {extractedData.email}</div>}
                {extractedData.contact && <div><strong>Contact:</strong> {extractedData.contact}</div>}
                {extractedData.skills?.length > 0 && (
                  <div className="col-span-2">
                    <strong>Skills:</strong>{' '}
                    {extractedData.skills.map((s: string, i: number) => (
                      <span key={i} className="inline-block bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-2 py-1 rounded-full mr-1 mb-1">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Add Member Form */}
        {showAddForm && (
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-bold text-heading mb-4">Add Team Member</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-heading mb-1">Name *</label>
                  <input
                    type="text" required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-heading mb-1">Email *</label>
                  <input
                    type="email" required
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@university.edu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-heading mb-1">Age</label>
                  <input
                    type="number" min="10" max="100"
                    className="input-field"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-heading mb-1">Contact</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-heading mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="Python, React, Machine Learning, Data Science"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-heading mb-1">Password (for new account)</label>
                <input
                  type="password"
                  className="input-field"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank for default: smartpm123"
                />
                <p className="text-xs text-dim mt-1">If the user doesn't have an account, one will be created with this password (default: smartpm123)</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={addLoading}
                  className="btn-primary px-6 py-2"
                >
                  {addLoading ? 'Adding...' : 'Add to Team'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setExtractedData(null); }}
                  className="btn-secondary px-6 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Member Cards */}
        <div className="space-y-4">
          {members.map((member: any, index: number) => (
            <div key={member.user?._id || index} className="card p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                      (() => {
                        const colors = [
                          'from-blue-500 to-purple-600',
                          'from-emerald-500 to-teal-600',
                          'from-orange-500 to-red-500',
                          'from-pink-500 to-rose-600',
                          'from-indigo-500 to-blue-600',
                          'from-violet-500 to-purple-600',
                          'from-amber-500 to-orange-600',
                          'from-cyan-500 to-blue-500',
                        ];
                        const hash = (member.user?.name || '?').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
                        return colors[hash % colors.length];
                      })()
                    }`}
                  >
                    {(member.user?.name?.charAt(0) || '?').toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-heading">{member.user?.name || 'Unknown'}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        member.role === 'leader' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}>
                        {member.role === 'leader' ? '👑 Leader' : 'Member'}
                      </span>
                    </div>
                    <p className="text-sub text-sm">{member.user?.email}</p>
                    {member.user?.age && <p className="text-dim text-xs mt-1">Age: {member.user.age}</p>}
                    {member.user?.contact && <p className="text-dim text-xs">Contact: {member.user.contact}</p>}
                    {member.user?.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {member.user.skills.map((skill: string, i: number) => (
                          <span key={i} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {member.role !== 'leader' && (
                  <button
                    onClick={() => handleRemoveMember(member.user?._id, member.user?.name)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {members.length === 0 && (
          <div className="text-center py-12 card">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-heading mb-2">No team members yet</h3>
            <p className="text-sub mb-4">Add team members to start assigning tasks</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary px-6 py-2"
            >
              Add First Member
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
